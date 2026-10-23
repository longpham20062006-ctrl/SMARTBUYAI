import os
import uuid
import logging
import requests
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from config import HOST, PORT, DEBUG, MAX_UPLOAD_SIZE_MB, DEFAULT_MODEL
from modules.model_loader import model_loader
from modules.image_processor import validate_and_save_upload
from modules.job_queue import gpu_job_queue

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("tryon.server")

app = FastAPI(
    title="SMARTBUY AI · Virtual Try-On Server (RTX 3060 12GB)",
    version="1.0.0",
    description="Hệ thống thử đồ AI cục bộ mã nguồn mở chạy trực tiếp trên GPU NVIDIA RTX 3060 12GB không tốn phí."
)

# Cho phép kết nối từ mọi thiết bị trong mạng LAN (Điện thoại, Laptop, PC khác)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "service": "SMARTBUY AI Virtual Try-On Server",
        "status": "online",
        "engine": DEFAULT_MODEL,
        "gpu": model_loader.gpu_name,
        "device": model_loader.device,
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    """Kiểm tra tình trạng sức khỏe server và thông số bộ nhớ GPU RTX 3060"""
    gpu_status = model_loader.get_gpu_status()
    return {
        "status": "healthy",
        "gpu": gpu_status,
        "queue_length": gpu_job_queue.task_queue.qsize(),
        "active_jobs_count": len(gpu_job_queue.jobs),
    }

@app.get("/capabilities")
def get_capabilities():
    """Thông báo các tính năng thử đồ được hỗ trợ thật trên mô hình hiện tại"""
    return {
        "model_name": DEFAULT_MODEL,
        "precision": "FP16 (Tối ưu RTX 3060 12GB)",
        "supported_categories": [
            {"id": "upper_body", "label": "Áo thun, Sơ mi, Hoodie, Sweater, Len"},
            {"id": "outerwear", "label": "Áo khoác bóng chày, Bomber, Denim"},
            {"id": "lower_body", "label": "Quần jeans, Quần dài, Quần short, Quần cargo"},
            {"id": "dresses", "label": "Váy, Chân váy, Đầm liền thân"},
        ],
        "multi_garment_supported": True,
        "max_resolution": "768x1024",
        "max_file_size_mb": MAX_UPLOAD_SIZE_MB,
        "format_supported": ["JPG", "PNG", "WebP", "AVIF"],
    }

@app.post("/try-on")
async def create_tryon_job(
    person_image: Optional[UploadFile] = File(None),
    person_image_url: Optional[str] = Form(None),
    garment_image: Optional[UploadFile] = File(None),
    top_garment_url: Optional[str] = Form(None),
    bottom_garment_url: Optional[str] = Form(None),
    category: Optional[str] = Form("upper_body"),
    garment_id: Optional[str] = Form(None),
    garment_name: Optional[str] = Form(None),
    request_id: Optional[str] = Form(None),
):
    """
    Endpoint nhận yêu cầu thử đồ AI:
    Chấp nhận file upload trực tiếp hoặc URL ảnh sản phẩm từ website SMARTBUY AI.
    """
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    logger.info(f"Nhận yêu cầu tạo tác vụ thử đồ mới: [{job_id}] | ReqID: {request_id} | Garment: {garment_name} ({garment_id}) | Danh mục: {category}")

    # 1. Thu thập ảnh người
    person_path: Optional[Path] = None
    if person_image:
        content = await person_image.read()
        _, person_path = validate_and_save_upload(content, prefix=f"{job_id}_person")
    elif person_image_url:
        try:
            resp = requests.get(person_image_url, timeout=15)
            resp.raise_for_status()
            _, person_path = validate_and_save_upload(resp.content, prefix=f"{job_id}_person")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Không thể tải ảnh người từ URL cung cấp: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Vui lòng tải lên ảnh người mẫu hoặc cung cấp URL ảnh.")

    # 2. Thu thập ảnh trang phục
    garment_path: Optional[Path] = None
    target_garment_url = top_garment_url or bottom_garment_url

    if garment_image:
        content = await garment_image.read()
        _, garment_path = validate_and_save_upload(content, prefix=f"{job_id}_garment")
        logger.info(f"[{job_id}] Đã nhận trực tiếp file nhị phân ảnh áo ({len(content)} bytes) từ trình duyệt.")
    elif target_garment_url:
        if target_garment_url.startswith(("http://", "https://")):
            try:
                resp = requests.get(target_garment_url, timeout=15)
                resp.raise_for_status()
                _, garment_path = validate_and_save_upload(resp.content, prefix=f"{job_id}_garment")
                logger.info(f"[{job_id}] Đã tải ảnh áo từ URL từ xa ({len(resp.content)} bytes): {target_garment_url}")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Không thể tải ảnh trang phục từ URL: {str(e)}")
        else:
            # Đường dẫn ảnh nội bộ trên website SMARTBUY AI (ví dụ: /images/san-pham/...)
            rel_path = target_garment_url.lstrip("/")
            local_file = BASE_DIR.parent / "public" / rel_path
            if local_file.exists():
                content = local_file.read_bytes()
                _, garment_path = validate_and_save_upload(content, prefix=f"{job_id}_garment")
                logger.info(f"[{job_id}] Đã nạp ảnh áo từ tệp cục bộ ({len(content)} bytes): {local_file}")
            else:
                raise HTTPException(status_code=400, detail=f"Không tìm thấy file ảnh sản phẩm trên máy chủ: {target_garment_url}")
    else:
        raise HTTPException(status_code=400, detail="Vui lòng tải lên ảnh trang phục hoặc chọn sản phẩm từ website.")

    # 3. Gửi tác vụ vào hàng đợi GPU đơn nhiệm
    job = gpu_job_queue.submit_job(
        job_id=job_id,
        person_path=person_path,
        garment_path=garment_path,
        category=category or "upper_body",
        garment_id=garment_id,
        garment_name=garment_name,
        request_id=request_id,
    )

    return JSONResponse(
        status_code=202,
        content={
            "success": True,
            "job_id": job_id,
            "taskId": job_id,
            "request_id": request_id,
            "garment_id": garment_id,
            "garment_name": garment_name,
            "status": "queued",
            "message": "Tác vụ đã được tiếp nhận và đưa vào hàng đợi xử lý trên GPU NVIDIA RTX 3060.",
            "status_url": f"/api/ai/jobs/{job_id}",
        }
    )

@app.get("/jobs/{job_id}/garment")
def get_job_garment(job_id: str):
    """Lấy file ảnh trang phục thực tế mà backend đã lưu và đưa vào mô hình CatVTON"""
    job = gpu_job_queue.get_job(job_id)
    if not job or not job.garment_path or not job.garment_path.exists():
        raise HTTPException(status_code=404, detail="Không tìm thấy ảnh trang phục của tác vụ.")
    return FileResponse(
        path=str(job.garment_path),
        media_type="image/png",
        filename=f"{job_id}_garment.png",
    )

@app.get("/jobs/{job_id}/person")
def get_job_person(job_id: str):
    """Lấy file ảnh người mẫu thực tế mà backend đã lưu và đưa vào mô hình CatVTON"""
    job = gpu_job_queue.get_job(job_id)
    if not job or not job.person_path or not job.person_path.exists():
        raise HTTPException(status_code=404, detail="Không tìm thấy ảnh người mẫu của tác vụ.")
    return FileResponse(
        path=str(job.person_path),
        media_type="image/png",
        filename=f"{job_id}_person.png",
    )

@app.get("/jobs/{job_id}")
def get_job_status(job_id: str):
    """Kiểm tra tiến độ thực thi của tác vụ AI"""
    job = gpu_job_queue.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông tin tác vụ thử đồ hoặc tác vụ đã hết hạn.")

    data = job.to_dict()
    if job.status == "completed":
        data["resultUrl"] = f"/api/ai/jobs/{job_id}/result"
        data["result_url"] = f"/api/ai/jobs/{job_id}/result"
        data["success"] = True
    elif job.status == "failed":
        data["success"] = False
        data["error"] = job.error_message or "Xử lý mô hình AI trên GPU thất bại"

    return data

@app.get("/jobs/{job_id}/result")
def get_job_result(job_id: str):
    """Tải hoặc hiển thị ảnh kết quả thử đồ hoàn chỉnh (PNG chuẩn RFC 2083)"""
    job = gpu_job_queue.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy tác vụ thử đồ hoặc tác vụ đã hết hạn.")

    if job.status == "failed":
        raise HTTPException(status_code=500, detail=f"Tác vụ thử đồ AI thất bại: {job.error_message or 'Lỗi không xác định'}")

    if job.status != "completed" or not job.result_path or not job.result_path.exists():
        raise HTTPException(status_code=400, detail=f"Tác vụ đang ở trạng thái '{job.status}', chưa có ảnh kết quả.")

    file_size = job.result_path.stat().st_size
    if file_size < 1000:
        raise HTTPException(status_code=500, detail="Ảnh kết quả không hợp lệ (kích thước quá nhỏ hoặc rỗng).")

    # Xác thực signature PNG thật (89 50 4E 47 0D 0A 1A 0A)
    with open(job.result_path, "rb") as f:
        header = f.read(8)
        if header != b"\x89PNG\r\n\x1a\n":
            raise HTTPException(status_code=500, detail="File kết quả không đúng cấu trúc ảnh PNG chuẩn.")

    return FileResponse(
        path=str(job.result_path),
        media_type="image/png",
        filename=f"SMARTBUY-AI-TRYON-{job_id[-6:]}.png",
        headers={
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=3600",
            "Content-Disposition": f'inline; filename="SMARTBUY-AI-TRYON-{job_id[-6:]}.png"'
        }
    )

@app.delete("/jobs/{job_id}")
def delete_job(job_id: str):
    """Xóa dữ liệu ảnh tạm để bảo vệ quyền riêng tư người dùng"""
    success = gpu_job_queue.delete_job(job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy tác vụ để xóa.")
    return {"success": True, "message": "Đã xóa toàn bộ file ảnh tạm của tác vụ."}

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Đang khởi động AI Virtual Try-On Server tại http://{HOST}:{PORT}")
    uvicorn.run("app:app", host=HOST, port=PORT, reload=DEBUG)
