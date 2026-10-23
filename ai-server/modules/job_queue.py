import time
import queue
import threading
import logging
from typing import Dict, Any, Optional
from pathlib import Path
from modules.tryon_pipeline import tryon_pipeline
from config import JOB_RETENTION_MINUTES

logger = logging.getLogger("tryon.queue")

class Job:
    def __init__(
        self,
        job_id: str,
        person_path: Path,
        garment_path: Path,
        category: str,
        garment_id: Optional[str] = None,
        garment_name: Optional[str] = None,
        request_id: Optional[str] = None,
    ):
        self.job_id = job_id
        self.person_path = person_path
        self.garment_path = garment_path
        self.category = category
        self.garment_id = garment_id
        self.garment_name = garment_name
        self.request_id = request_id
        self.model_name = "CatVTON-SD15-FP16"
        self.status = "queued"  # queued | processing | completed | failed
        self.progress = 0
        self.result_path: Optional[Path] = None
        self.error_message: Optional[str] = None
        self.created_at = time.time()
        self.completed_at: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "job_id": self.job_id,
            "request_id": self.request_id,
            "status": self.status,
            "progress": self.progress,
            "category": self.category,
            "garment_id": self.garment_id,
            "garment_name": self.garment_name,
            "model_name": self.model_name,
            "has_result": self.result_path is not None and self.result_path.exists(),
            "error": self.error_message,
            "created_at": self.created_at,
            "duration_seconds": round((self.completed_at - self.created_at), 2) if self.completed_at else None,
        }

class SingleTaskGPUQueue:
    """
    Hàng đợi đơn nhiệm cho GPU NVIDIA RTX 3060 12GB:
    Đảm bảo chỉ có DUY NHẤT 1 tác vụ chạy trên GPU tại một thời điểm,
    triệt tiêu hoàn toàn nguy cơ CUDA Out Of Memory (OOM).
    Các tác vụ đến sau được xếp hàng và xử lý tuần tự (FIFO).
    """
    def __init__(self):
        self.jobs: Dict[str, Job] = {}
        self.task_queue: queue.Queue = queue.Queue()
        self.worker_thread = threading.Thread(target=self._worker_loop, daemon=True)
        self.cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self.worker_thread.start()
        self.cleanup_thread.start()
        logger.info("Đã khởi động hàng đợi GPU độc quyền cho RTX 3060.")

    def submit_job(
        self,
        job_id: str,
        person_path: Path,
        garment_path: Path,
        category: str = "upper_body",
        garment_id: Optional[str] = None,
        garment_name: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> Job:
        job = Job(
            job_id=job_id,
            person_path=person_path,
            garment_path=garment_path,
            category=category,
            garment_id=garment_id,
            garment_name=garment_name,
            request_id=request_id,
        )
        self.jobs[job_id] = job
        self.task_queue.put(job)
        logger.info(f"Đã nhận tác vụ [{job_id}], Garment ID: {garment_id}, Name: {garment_name}, vị trí trong hàng đợi: {self.task_queue.qsize()}")
        return job

    def get_job(self, job_id: str) -> Optional[Job]:
        return self.jobs.get(job_id)

    def delete_job(self, job_id: str) -> bool:
        job = self.jobs.pop(job_id, None)
        if job:
            try:
                if job.person_path and job.person_path.exists():
                    job.person_path.unlink()
                if job.garment_path and job.garment_path.exists():
                    job.garment_path.unlink()
                if job.result_path and job.result_path.exists():
                    job.result_path.unlink()
            except Exception as e:
                logger.warning(f"Lỗi khi xóa file tạm của job {job_id}: {e}")
            return True
        return False

    def _worker_loop(self):
        """Worker chạy đơn luồng xử lý tuần tự từng tác vụ trên GPU"""
        tryon_pipeline.load_pipeline()

        while True:
            job: Job = self.task_queue.get()
            try:
                job.status = "processing"
                job.progress = 20
                logger.info(f"Bắt đầu xử lý tác vụ [{job.job_id}] trên GPU RTX 3060...")

                job.progress = 50
                result_path = tryon_pipeline.process(
                    job_id=job.job_id,
                    person_image_path=job.person_path,
                    garment_image_path=job.garment_path,
                    category=job.category
                )

                job.result_path = result_path
                job.status = "completed"
                job.progress = 100
                job.completed_at = time.time()
                logger.info(f"Tác vụ [{job.job_id}] hoàn thành xuất sắc!")

            except Exception as e:
                logger.error(f"Lỗi trong quá trình xử lý job [{job.job_id}]: {str(e)}")
                job.status = "failed"
                job.error_message = str(e)
                job.completed_at = time.time()

            finally:
                self.task_queue.task_done()

    def _cleanup_loop(self):
        """Tự động dọn dẹp các tác vụ và file tạm cũ hơn 30 phút để bảo vệ quyền riêng tư và dung lượng đĩa"""
        while True:
            time.sleep(300)  # Kiểm tra mỗi 5 phút
            now = time.time()
            cutoff = now - (JOB_RETENTION_MINUTES * 60)
            expired_ids = [
                jid for jid, j in self.jobs.items()
                if j.created_at < cutoff
            ]
            for jid in expired_ids:
                logger.info(f"Tự động xóa tác vụ hết hạn: [{jid}]")
                self.delete_job(jid)

gpu_job_queue = SingleTaskGPUQueue()
