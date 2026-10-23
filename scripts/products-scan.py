import os
import sys
import json
import hashlib
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
IMAGE_DIR = os.path.join(ROOT_DIR, 'public', 'images', 'san-pham')
MANIFEST_PATH = os.path.join(IMAGE_DIR, 'manifest.json')

VALID_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.avif'}

def calculate_dhash(image, hash_size=8):
    """Tính 64-bit difference hash (perceptual hash) để phát hiện ảnh tương đồng"""
    try:
        # Resize to (hash_size + 1, hash_size) and convert to grayscale
        resized = image.convert('L').resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
        diff = []
        for row in range(hash_size):
            for col in range(hash_size):
                p1 = resized.getpixel((col, row))
                p2 = resized.getpixel((col + 1, row))
                diff.append(p1 > p2)
        # Convert bool array to hex string
        decimal_val = 0
        for index, value in enumerate(diff):
            if value:
                decimal_val += 2 ** index
        return hex(decimal_val)[2:].rjust(hash_size * hash_size // 4, '0')
    except Exception as e:
        return ""

def scan():
    print(f"=== [BƯỚC 1] QUÉT TOÀN BỘ ẢNH THỜI TRANG THỰC TẾ ===")
    print(f"Thư mục nguồn: {IMAGE_DIR}")

    if not os.path.exists(IMAGE_DIR):
        print(f"LỖI: Thư mục {IMAGE_DIR} không tồn tại!")
        sys.exit(1)

    images = []
    seen_hashes = {}
    exact_duplicates = []

    for root, dirs, files in os.walk(IMAGE_DIR):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in VALID_EXTENSIONS:
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, IMAGE_DIR).replace('\\', '/')
                web_path = f"/images/san-pham/{rel_path}"

                # 1. Tính MD5 Checksum
                try:
                    with open(full_path, 'rb') as fp:
                        file_bytes = fp.read()
                        md5 = hashlib.md5(file_bytes).hexdigest()
                        sha256 = hashlib.sha256(file_bytes).hexdigest()
                        file_size = len(file_bytes)
                except Exception as e:
                    print(f"Không thể đọc file {full_path}: {e}")
                    continue

                # 2. Giải mã ảnh với Pillow
                try:
                    with Image.open(full_path) as img:
                        fmt = img.format
                        width, height = img.size
                        dhash = calculate_dhash(img)
                except Exception as e:
                    print(f"Bỏ qua file hỏng hoặc không giải mã được: {rel_path} ({e})")
                    continue

                # 3. Xác định danh mục và giới tính từ đường dẫn
                parts = rel_path.split('/')
                gender = 'nam'
                if 'quan-ao-nu' in parts:
                    gender = 'nu'
                elif 'quan-ao-unisex' in parts or 'unisex' in parts or 'phu-kien' in parts:
                    gender = 'unisex'

                cat_slug = 'ao-thun'
                if 'ao-polo' in parts:
                    cat_slug = 'ao-polo'
                elif 'ao-so-mi' in parts:
                    cat_slug = 'ao-so-mi'
                elif 'ao-hoodie' in parts:
                    cat_slug = 'ao-hoodie'
                elif 'ao-len' in parts:
                    cat_slug = 'ao-len'
                elif 'ao-thun-dai-tay' in parts:
                    cat_slug = 'ao-thun-dai-tay'
                elif 'ao-khoac' in parts:
                    cat_slug = 'ao-khoac'
                elif 'quan-jeans' in parts:
                    cat_slug = 'quan-jeans'
                elif 'chan-vay' in parts:
                    cat_slug = 'chan-vay'
                elif 'dam' in parts:
                    cat_slug = 'dam'
                elif 'phu-kien' in parts:
                    cat_slug = 'phu-kien'

                item = {
                    "id": f"img_{len(images) + 1}",
                    "fileName": f,
                    "fullPath": full_path,
                    "relativePath": rel_path,
                    "webPath": web_path,
                    "dirName": os.path.dirname(rel_path),
                    "format": fmt,
                    "width": width,
                    "height": height,
                    "sizeBytes": file_size,
                    "md5": md5,
                    "sha256": sha256,
                    "dhash": dhash,
                    "gender": gender,
                    "categorySlug": cat_slug
                }

                if md5 in seen_hashes:
                    exact_duplicates.append({
                        "original": seen_hashes[md5]["relativePath"],
                        "duplicate": rel_path,
                        "md5": md5
                    })
                else:
                    seen_hashes[md5] = item

                images.append(item)

    print(f"✓ Đã quét thành công {len(images)} file ảnh hợp lệ.")
    print(f"✓ Tìm thấy {len(exact_duplicates)} file trùng lặp nội dung 100% (MD5 identical).")

    manifest = {
        "version": "4.0.0-variants-engine-v2",
        "generatedAt": "2026-10-23T16:30:00Z",
        "totalImages": len(images),
        "uniqueImagesCount": len(seen_hashes),
        "exactDuplicatesCount": len(exact_duplicates),
        "exactDuplicates": exact_duplicates,
        "images": images
    }

    with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"✓ Manifest đã được ghi vào: {MANIFEST_PATH}")
    return manifest

if __name__ == '__main__':
    scan()
