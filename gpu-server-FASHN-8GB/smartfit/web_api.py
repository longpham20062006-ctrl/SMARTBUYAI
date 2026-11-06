"""Versioned API for a local Windows GPU service and website proxy.

Security model: binds to 127.0.0.1 only. External websites call through a
server-side proxy on the SAME PC; API credentials must not enter browser JS.
"""
from __future__ import annotations

import hmac
import re
from pathlib import Path
from queue import Full

from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse

from .config import API_KEY, MAX_UPLOAD_MB, PROFILE_NAME
from .jobs import JOBS
from .service import RequestOptions
from .storage import get_run, list_runs

router = APIRouter(prefix="/api/v1", tags=["SmartFit Web API"])
MAX_BYTES = MAX_UPLOAD_MB * 1024 * 1024
VALID_IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp", "application/octet-stream"}
RID_RE = re.compile(r"^[a-f0-9]{16}$")
JOB_RE = re.compile(r"^[a-f0-9]{32}$")


def authorize(key: str | None) -> None:
    if API_KEY and (not key or not hmac.compare_digest(key, API_KEY)):
        raise HTTPException(401, detail="X-SmartFit-Key không hợp lệ")


async def read_upload(up: UploadFile, role: str) -> bytes:
    if up.content_type not in VALID_IMAGE_MIMES:
        raise HTTPException(415, detail=f"{role}: chỉ hỗ trợ JPG, PNG, WEBP")
    contents = await up.read(MAX_BYTES + 1)
    if not contents:
        raise HTTPException(422, detail=f"{role}: tệp trống")
    if len(contents) > MAX_BYTES:
        raise HTTPException(413, detail=f"{role}: vượt {MAX_UPLOAD_MB} MB")
    return contents


@router.get("/health")
def health():
    # Health is intentionally cheap: never loads the 2GB model.
    try:
        import torch
        cuda = torch.cuda.is_available()
        gpu = torch.cuda.get_device_name(0) if cuda else None
        free = round(torch.cuda.mem_get_info()[0] / 1024**3, 2) if cuda else None
        return {"ok": True, "cuda": cuda, "gpu": gpu, "free_vram_gb": free,
                "profile": PROFILE_NAME, "api_version": "1"}
    except Exception:
        return {"ok": False, "cuda": False, "profile": PROFILE_NAME}


@router.post("/jobs", status_code=202)
async def start_job(
    person: UploadFile = File(...), garment: UploadFile = File(...),
    category: str = Form("tops"), photo_type: str = Form("flat-lay"),
    steps: int = Form(30), guidance: float = Form(1.5), seed: int = Form(42),
    segmentation_free: bool | None = Form(None), retry_if_flagged: bool = Form(False),
    x_smartfit_key: str | None = Header(default=None),
):
    authorize(x_smartfit_key)
    # Adaptive segmentation: one-pieces default to False to cleanly erase old dresses/tops/sleeves
    if segmentation_free is None:
        seg_free = False if category == "one-pieces" else True
    else:
        seg_free = segmentation_free

    opts = RequestOptions(category=category, photo_type=photo_type, steps=steps,
                          guidance=guidance, seed=seed,
                          segmentation_free=seg_free,
                          retry_if_flagged=retry_if_flagged)
    try:
        opts.validate()
    except ValueError as exc:
        raise HTTPException(422, detail=str(exc)) from exc
    person_bytes = await read_upload(person, "Ảnh người")
    garment_bytes = await read_upload(garment, "Ảnh trang phục")
    # Decode+verify BEFORE queueing to avoid accepting malformed large work.
    from .images import load_image
    try:
        load_image(person_bytes, "person")
        load_image(garment_bytes, "garment")
        job = JOBS.submit(person_bytes, garment_bytes, opts)
    except ValueError as exc:
        raise HTTPException(422, detail=str(exc)) from exc
    except Full as exc:
        raise HTTPException(429, detail=str(exc), headers={"Retry-After": "15"}) from exc
    return {"job_id": job.id, "status": job.status,
            "status_url": f"/api/v1/jobs/{job.id}"}


@router.get("/jobs/{job_id}")
def job_status(job_id: str, x_smartfit_key: str | None = Header(default=None)):
    authorize(x_smartfit_key)
    if not JOB_RE.fullmatch(job_id):
        raise HTTPException(404, detail="Không tìm thấy lượt xử lý")
    data = JOBS.get(job_id)
    if data is None:
        raise HTTPException(404, detail="Lượt xử lý đã hết hạn hoặc máy chủ vừa khởi động lại")
    return data


@router.get("/results/{run_id}/{kind}")
def image_result(run_id: str, kind: str, x_smartfit_key: str | None = Header(default=None)):
    authorize(x_smartfit_key)
    if not RID_RE.fullmatch(run_id) or kind not in {"output", "comparison", "person", "garment"}:
        raise HTTPException(404)
    row = get_run(run_id)
    if row is None:
        raise HTTPException(404, detail="Không thấy kết quả")
    filepath = Path(row[f"{kind}_path"])
    if not filepath.is_file():
        raise HTTPException(404, detail="Tệp đã bị xóa")
    return FileResponse(filepath, media_type="image/png",
                        filename=f"smartfit_{run_id}_{kind}.png",
                        headers={"Cache-Control": "private, max-age=300",
                                 "X-Content-Type-Options": "nosniff"})


@router.get("/history")
def history(limit: int = 20, x_smartfit_key: str | None = Header(default=None)):
    authorize(x_smartfit_key)
    return [{"id": row["id"], "created_at": row["created_at"],
             "category": row["category"], "seconds": row["seconds"],
             "image_url": f'/api/v1/results/{row["id"]}/output'}
            for row in list_runs(max(1, min(limit, 50)))]
