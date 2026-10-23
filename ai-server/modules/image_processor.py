import io
import uuid
from pathlib import Path
from typing import Tuple
from PIL import Image, ImageOps
from config import TEMP_DIR, MAX_UPLOAD_SIZE_MB

ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP", "MPO"}

def validate_and_save_upload(file_bytes: bytes, prefix: str = "img") -> Tuple[str, Path]:
    """
    Kiểm tra tính an toàn, kích thước và lưu ảnh tải lên thành file tạm với tên ngẫu nhiên UUID.
    Không bao giờ sử dụng tên file do người dùng cung cấp (chống path traversal).
    """
    if len(file_bytes) > MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise ValueError(f"Dung lượng ảnh vượt quá giới hạn cho phép ({MAX_UPLOAD_SIZE_MB}MB).")

    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.verify()  # Kiểm tra tính toàn vẹn của file ảnh
    except Exception as e:
        raise ValueError(f"File tải lên không phải là ảnh hợp lệ hoặc bị hỏng: {str(e)}")

    # Mở lại để xử lý sau khi verify
    image = Image.open(io.BytesIO(file_bytes))
    image_format = (image.format or "PNG").upper()
    if image_format not in ALLOWED_FORMATS:
        raise ValueError(f"Định dạng ảnh '{image_format}' không được hỗ trợ. Chỉ hỗ trợ JPG, PNG, WebP.")

    # Tự động xoay ảnh theo EXIF orientation nếu chụp từ điện thoại
    try:
        image = ImageOps.exif_transpose(image)
    except Exception:
        pass

    # Chuyển về RGB nếu ảnh ở chế độ RGBA/P
    if image.mode != "RGB":
        image = image.convert("RGB")

    unique_id = f"{prefix}_{uuid.uuid4().hex[:12]}"
    out_path = TEMP_DIR / f"{unique_id}.png"
    image.save(out_path, format="PNG", quality=95)
    return unique_id, out_path

def resize_for_tryon(image_path: Path, target_size: Tuple[int, int] = (768, 1024)) -> Image.Image:
    """
    Chuẩn hóa kích thước ảnh người và trang phục cho mô hình Virtual Try-On
    Chuẩn tỷ lệ 3:4 (768x1024 hoặc 576x768) tối ưu cho RTX 3060 12GB.
    """
    image = Image.open(image_path)
    image = ImageOps.exif_transpose(image)
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Resize giữ nguyên tỷ lệ với thuật toán Lanczos sắc nét
    image.thumbnail(target_size, Image.Resampling.LANCZOS)
    
    # Tạo nền đệm chuẩn target_size nếu cần
    background = Image.new("RGB", target_size, (255, 255, 255))
    offset = ((target_size[0] - image.width) // 2, (target_size[1] - image.height) // 2)
    background.paste(image, offset)
    return background
