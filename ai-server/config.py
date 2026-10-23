import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env nếu có
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
TEMP_DIR = BASE_DIR / "temp"
OUTPUT_DIR = BASE_DIR / "outputs"
MODELS_DIR = BASE_DIR / "models"

# Đảm bảo các thư mục tồn tại
TEMP_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Cấu hình mạng & Server
HOST = os.getenv("TRYON_HOST", "0.0.0.0")  # Cho phép thiết bị khác trong LAN (192.168.1.x) truy cập
PORT = int(os.getenv("TRYON_PORT", "8000"))
DEBUG = os.getenv("TRYON_DEBUG", "false").lower() == "true"

# Cấu hình GPU RTX 3060 12GB
DEVICE = os.getenv("TRYON_DEVICE", "cuda")
PRECISION = os.getenv("TRYON_PRECISION", "fp16")  # fp16 tối ưu bộ nhớ VRAM cho RTX 3060
MAX_VRAM_GB = float(os.getenv("TRYON_MAX_VRAM_GB", "11.5"))

# Giới hạn kích thước ảnh & an toàn
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "15"))
JOB_TIMEOUT_SECONDS = int(os.getenv("JOB_TIMEOUT_SECONDS", "180"))  # 3 phút tối đa
JOB_RETENTION_MINUTES = int(os.getenv("JOB_RETENTION_MINUTES", "30"))  # Tự động dọn sau 30 phút

# Mô hình Virtual Try-On mặc định
DEFAULT_MODEL = os.getenv("TRYON_MODEL", "CatVTON-FP16")
