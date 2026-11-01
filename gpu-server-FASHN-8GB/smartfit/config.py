from dataclasses import dataclass
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
WEIGHTS = ROOT / 'weights'
VENDOR = ROOT / 'vendor' / 'fashn-vton-1.5'

@dataclass(frozen=True)
class Profile:
    label: str
    steps: int
    guidance: float
    candidate_count: int
    cpu_preprocessing: bool
    sequential_cfg: bool
    free_vram_warning_gb: float

PROFILES = {
    '8gb': Profile('8 GB - tiet kiem VRAM', 20, 1.5, 1, True, True, 7.3),
    '12gb': Profile('12 GB - uu tien chat luong', 30, 1.5, 1, False, False, 7.3),
}

PROFILE_NAME = os.getenv('SMARTFIT_PROFILE', '8gb').strip().lower()
if PROFILE_NAME not in PROFILES:
    raise ValueError('SMARTFIT_PROFILE must be 8gb or 12gb')
PROFILE = PROFILES[PROFILE_NAME]
API_KEY = os.getenv('SMARTFIT_API_KEY', '').strip()
HOST = os.getenv('SMARTFIT_HOST', '127.0.0.1')
PORT = int(os.getenv('SMARTFIT_PORT', '7860'))
MAX_UPLOAD_MB = 20
MAX_IMAGE_PIXELS = 30_000_000
