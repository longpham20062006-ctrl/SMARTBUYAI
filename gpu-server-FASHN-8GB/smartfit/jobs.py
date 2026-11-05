"""Bounded, single-worker local inference queue.

Long GPU inference must not run on the HTTP request thread. This queue is
intentionally in-process: it is for a single Windows PC and is NOT a durable
multi-worker production queue. Finished renders persist in the SQLite history.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from queue import Queue, Full
from threading import Lock, Thread
from time import monotonic
from uuid import uuid4
from typing import Any

from .service import RequestOptions, process


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@dataclass
class Job:
    id: str
    status: str = "queued"
    stage: str = "Đang chờ GPU"
    created_at: str = field(default_factory=utc_now)
    updated_at: str = field(default_factory=utc_now)
    result: dict[str, Any] | None = None
    error: str | None = None
    finished_at: float | None = None

    def public(self) -> dict:
        return {
            "id": self.id,
            "status": self.status,
            "stage": self.stage,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "result": self.result,
            "error": self.error,
        }


class JobQueue:
    def __init__(self, max_waiting: int = 3, retain_seconds: int = 3600):
        self.queue: Queue = Queue(maxsize=max_waiting)
        self.jobs: dict[str, Job] = {}
        self.lock = Lock()
        self.thread: Thread | None = None
        self.retain_seconds = retain_seconds

    def submit(self, person: bytes, garment: bytes, options: RequestOptions) -> Job:
        options.validate()
        job = Job(id=uuid4().hex)
        with self.lock:
            self._prune_locked()
            # Prevent unlimited RAM retention; includes the running job.
            active = sum(1 for x in self.jobs.values() if x.status in ("queued", "running"))
            if active >= self.queue.maxsize + 1:
                raise Full("GPU đang bận. Hãy thử lại sau.")
            try:
                self.queue.put_nowait((job.id, person, garment, options))
            except Full:
                raise Full("Hàng chờ GPU đã đầy.")
            self.jobs[job.id] = job
            if not self.thread or not self.thread.is_alive():
                self.thread = Thread(target=self._worker, daemon=True, name="smartfit-gpu-worker")
                self.thread.start()
        return job

    def get(self, jid: str) -> dict | None:
        with self.lock:
            job = self.jobs.get(jid)
            return job.public() if job else None

    def _mark(self, jid: str, **updates) -> None:
        with self.lock:
            job = self.jobs.get(jid)
            if not job:
                return
            for key, value in updates.items():
                setattr(job, key, value)
            job.updated_at = utc_now()

    def _prune_locked(self) -> None:
        t = monotonic()
        expired = [k for k, v in self.jobs.items() if v.finished_at is not None
                   and (t - v.finished_at) > self.retain_seconds]
        for k in expired:
            del self.jobs[k]

    def _worker(self):
        while True:
            jid, person, garment, opts = self.queue.get()
            try:
                self._mark(jid, status="running", stage="Đang chuẩn bị xử lý ảnh")
                def progress(stage):
                    self._mark(jid, stage=stage)
                output = process(person, garment, opts, progress=progress)
                self._mark(jid, status="completed", stage="Hoàn tất", result={
                    "id": output["id"],
                    "seconds": round(output["seconds"], 2),
                    "seed": output["seed"],
                    "quality": output["quality"],
                    "image_url": f'/api/v1/results/{output["id"]}/output',
                    "comparison_url": f'/api/v1/results/{output["id"]}/comparison',
                }, finished_at=monotonic())
            except (ValueError, RuntimeError) as exc:
                # Expected user/model errors; do not expose traces or filesystem paths.
                self._mark(jid, status="failed", stage="Không thể tạo ảnh",
                           error=str(exc)[:350], finished_at=monotonic())
            except Exception as exc:
                import logging
                logging.exception("SmartFit inference job failed: %s", type(exc).__name__)
                self._mark(jid, status="failed", stage="Không thể tạo ảnh",
                           error=f"Lỗi xử lý AI ({type(exc).__name__}): {str(exc)[:250]}",
                           finished_at=monotonic())
            finally:
                self.queue.task_done()


JOBS = JobQueue()
