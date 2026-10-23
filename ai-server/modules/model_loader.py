import gc
import logging
from typing import Dict, Any

logger = logging.getLogger("tryon.loader")

class ModelLoader:
    def __init__(self):
        self.device = "cpu"
        self.gpu_name = "None"
        self.vram_total_mb = 0
        self.vram_free_mb = 0
        self.is_loaded = False
        self._check_hardware()

    def _check_hardware(self):
        try:
            import torch
            if torch.cuda.is_available():
                self.device = "cuda"
                self.gpu_name = torch.cuda.get_device_name(0)
                mem = torch.cuda.get_device_properties(0).total_memory
                self.vram_total_mb = round(mem / (1024 * 1024))
                allocated = torch.cuda.memory_allocated(0)
                reserved = torch.cuda.memory_reserved(0)
                self.vram_free_mb = self.vram_total_mb - round(reserved / (1024 * 1024))
                logger.info(f"Phát hiện GPU: {self.gpu_name} ({self.vram_total_mb}MB VRAM). CUDA sẵn sàng.")
            else:
                self.device = "cpu"
                logger.warning("Không tìm thấy GPU CUDA. Hệ thống sẽ sử dụng CPU (tốc độ chậm hơn).")
        except Exception as e:
            logger.error(f"Lỗi khi kiểm tra phần cứng GPU: {e}")
            self.device = "cpu"

    def get_gpu_status(self) -> Dict[str, Any]:
        self._check_hardware()
        return {
            "device": self.device,
            "gpu_name": self.gpu_name,
            "vram_total_mb": self.vram_total_mb,
            "vram_free_mb": self.vram_free_mb,
            "is_rtx_3060": "3060" in self.gpu_name,
            "recommended_resolution": "768x1024" if self.vram_total_mb >= 10000 else "512x768"
        }

    def clean_memory(self):
        """Giải phóng bộ nhớ GPU sau mỗi tác vụ thử đồ để chống tràn VRAM"""
        gc.collect()
        try:
            import torch
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                torch.cuda.ipc_collect()
                logger.debug("Đã dọn dẹp bộ nhớ đệm VRAM.")
        except Exception:
            pass

model_loader = ModelLoader()
