"""Nondestructive input validation, EXIF fix, PNG saving, and diagnostics.
Never force CLAHE, sharpen or background removal; those can damage true fabric colors.
"""
from dataclasses import dataclass, asdict
from io import BytesIO
from pathlib import Path
from typing import Optional
import hashlib
import numpy as np
from PIL import Image, ImageOps, ImageStat, UnidentifiedImageError
from .config import MAX_UPLOAD_MB, MAX_IMAGE_PIXELS

Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS

@dataclass
class Diagnostics:
    width: int
    height: int
    brightness: float
    contrast: float
    warnings: list[str]


def load_image(raw: bytes, role: str = 'person') -> tuple[Image.Image, Diagnostics]:
    if not raw or len(raw) > MAX_UPLOAD_MB * 1024 * 1024:
        raise ValueError(f'Anh trong hoac vuot qua {MAX_UPLOAD_MB} MB.')
    try:
        with Image.open(BytesIO(raw)) as src:
            src.verify()
        with Image.open(BytesIO(raw)) as src:
            if src.width * src.height > MAX_IMAGE_PIXELS:
                raise ValueError('Anh vuot qua gioi han pixel.')
            image = ImageOps.exif_transpose(src).convert('RGB')
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise ValueError('File khong phai anh hop le (JPG, PNG, WEBP).') from exc
    w, h = image.size
    if min(w, h) < 256:
        raise ValueError('Anh qua nho. Can moi chieu >= 256 px.')
    gray = image.convert('L').resize((192, 192))
    stats = ImageStat.Stat(gray)
    brightness, contrast = float(stats.mean[0]), float(stats.stddev[0])
    warnings = []
    if brightness < 45: warnings.append('Anh qua toi: nen chup voi anh sang deu.')
    if brightness > 224: warnings.append('Anh qua sang: co the mat chi tiet vai.')
    if contrast < 20: warnings.append('Anh it tuong phan, nhan dien co the co the sai.')
    if role == 'person' and h < w: warnings.append('Anh nguoi dang ngang; anh dung thuong tot hon.')
    if role == 'garment' and min(w, h) < 512: warnings.append('Anh san pham nho, hoa tiet co the khong ro.')
    return image, Diagnostics(w, h, brightness, contrast, warnings)


def png_bytes(image: Image.Image) -> bytes:
    stream = BytesIO()
    image.convert('RGB').save(stream, 'PNG', optimize=True)
    return stream.getvalue()


def image_sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def compose_comparison(a: Image.Image, b: Image.Image) -> Image.Image:
    width = min(a.width, b.width, 900)
    h = round(width * b.height / b.width)
    a = ImageOps.fit(a.convert('RGB'), (width, h), method=Image.Resampling.LANCZOS)
    b = ImageOps.fit(b.convert('RGB'), (width, h), method=Image.Resampling.LANCZOS)
    out = Image.new('RGB', (width * 2, h), 'white')
    out.paste(a, (0, 0)); out.paste(b, (width, 0))
    return out


def blend_comparison(original: Image.Image, generated: Image.Image, strength: float) -> Image.Image:
    orig = ImageOps.fit(original.convert('RGB'), generated.size, method=Image.Resampling.LANCZOS)
    return Image.blend(orig, generated.convert('RGB'), max(0.0, min(1.0, float(strength))))
