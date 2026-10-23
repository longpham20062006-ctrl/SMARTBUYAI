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
        resized = image.convert('L').resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
        diff = []
        for row in range(hash_size):
            for col in range(hash_size):
                p1 = resized.getpixel((col, row))
                p2 = resized.getpixel((col + 1, row))
                diff.append(p1 > p2)
        decimal_val = 0
        for index, value in enumerate(diff):
            if value:
                decimal_val += 2 ** index
        return hex(decimal_val)[2:].rjust(hash_size * hash_size // 4, '0')
    except Exception:
        return ""

def scan():
    print("=== [BƯỚC 1] QUÉT TOÀN BỘ ẢNH THEO CẤU TRÚC FOLDER MẪU THỰC TẾ ===")
    print(f"Thư mục nguồn: {IMAGE_DIR}")

    if not os.path.exists(IMAGE_DIR):
        print(f"LỖI: Thư mục {IMAGE_DIR} không tồn tại!")
        sys.exit(1)

    images = []
    seen_hashes = {}
    exact_duplicates = []
    folders_map = {}
    loose_images = []

    for root, dirs, files in os.walk(IMAGE_DIR):
        img_files = [f for f in files if os.path.splitext(f)[1].lower() in VALID_EXTENSIONS]
        if not img_files:
            continue

        rel_dir = os.path.relpath(root, IMAGE_DIR).replace('\\', '/')
        parts = rel_dir.split('/')

        # Kiểm tra xem đây có phải thư mục mẫu hay thư mục danh mục cha chứa file tự do
        has_subdirs_with_images = False
        for sub in dirs:
            sub_path = os.path.join(root, sub)
            for _, _, sfiles in os.walk(sub_path):
                if any(os.path.splitext(sf)[1].lower() in VALID_EXTENSIONS for sf in sfiles):
                    has_subdirs_with_images = True
                    break

        if has_subdirs_with_images:
            # Ảnh rơi vãi ở thư mục cha
            for f in img_files:
                loose_images.append(f"{rel_dir}/{f}")

        # Xác định giới tính từ đường dẫn
        gender = 'nam'
        if 'quan-ao-nu' in parts:
            gender = 'nu'
        elif 'quan-ao-unisex' in parts or 'unisex' in parts or 'phu-kien' in parts:
            gender = 'unisex'

        # Xác định categorySlug và categoryName
        cat_slug = 'ao-thun'
        cat_name = 'Áo thun'
        prefix = 'TEE'

        if 'ao-polo' in parts:
            cat_slug = 'ao-polo'
            cat_name = 'Áo polo'
            prefix = 'POLO'
        elif 'ao-so-mi' in parts:
            cat_slug = 'so-mi-polo'
            cat_name = 'Áo sơ mi'
            prefix = 'SHIRT'
        elif 'ao-hoodie' in parts:
            cat_slug = 'hoodie-sweater'
            cat_name = 'Áo hoodie'
            prefix = 'HOODIE'
        elif 'ao-len' in parts:
            cat_slug = 'hoodie-sweater'
            cat_name = 'Áo len'
            prefix = 'SWEATER'
        elif 'ao-thun-dai-tay' in parts:
            cat_slug = 'ao-thun'
            cat_name = 'Áo thun dài tay'
            prefix = 'LONGSLEEVE'
        elif 'ao-khoac' in parts:
            cat_slug = 'ao-khoac'
            cat_name = 'Áo khoác'
            prefix = 'JACKET'
        elif 'quan-jeans' in parts:
            cat_slug = 'quan-jeans'
            cat_name = 'Quần jeans'
            prefix = 'JEANS'
        elif 'quan-dai' in parts:
            cat_slug = 'quan-dai'
            cat_name = 'Quần dài'
            prefix = 'PANTS'
        elif 'quan-short' in parts:
            cat_slug = 'quan-short'
            cat_name = 'Quần short'
            prefix = 'SHORTS'
        elif 'chan-vay' in parts:
            cat_slug = 'chan-vay'
            cat_name = 'Chân váy'
            prefix = 'SKIRT'
        elif 'dam' in parts or 'vay-lien' in parts:
            cat_slug = 'dam'
            cat_name = 'Váy liền'
            prefix = 'DRESS'
        elif 'vong-tay' in parts:
            cat_slug = 'phu-kien'
            cat_name = 'Vòng tay'
            prefix = 'BRACELET'
        elif 'day-chuyen' in parts or 'vong-co' in parts:
            cat_slug = 'phu-kien'
            cat_name = 'Dây chuyền'
            prefix = 'NECKLACE'
        elif 'nhan' in parts:
            cat_slug = 'phu-kien'
            cat_name = 'Nhẫn'
            prefix = 'RING'
        elif 'phu-kien' in parts:
            cat_slug = 'phu-kien'
            cat_name = 'Phụ kiện'
            prefix = 'ACC'

        model_folder = parts[-1]
        category_rel = '/'.join(parts[:-1]) if len(parts) > 1 else rel_dir

        if rel_dir not in folders_map:
            folders_map[rel_dir] = {
                "folderKey": rel_dir,
                "modelFolder": model_folder,
                "categoryRel": category_rel,
                "categorySlug": cat_slug,
                "categoryName": cat_name,
                "prefix": prefix,
                "gender": gender,
                "images": []
            }

        for f in img_files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, IMAGE_DIR).replace('\\', '/')
            web_path = f"/images/san-pham/{rel_path}"

            # 1. Checksum
            try:
                with open(full_path, 'rb') as fp:
                    file_bytes = fp.read()
                    md5 = hashlib.md5(file_bytes).hexdigest()
                    sha256 = hashlib.sha256(file_bytes).hexdigest()
                    file_size = len(file_bytes)
            except Exception as e:
                print(f"Không thể đọc file {full_path}: {e}")
                continue

            # 2. Decode with Pillow
            try:
                with Image.open(full_path) as img:
                    fmt = img.format
                    width, height = img.size
                    dhash = calculate_dhash(img)
            except Exception as e:
                print(f"Bỏ qua file hỏng hoặc không giải mã được: {rel_path} ({e})")
                continue

            item = {
                "id": f"img_{len(images) + 1}",
                "fileName": f,
                "fullPath": full_path,
                "relativePath": rel_path,
                "webPath": web_path,
                "dirName": rel_dir,
                "modelFolder": model_folder,
                "categoryRel": category_rel,
                "format": fmt,
                "width": width,
                "height": height,
                "sizeBytes": file_size,
                "md5": md5,
                "sha256": sha256,
                "dhash": dhash,
                "gender": gender,
                "categorySlug": cat_slug,
                "categoryName": cat_name,
                "prefix": prefix
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
            folders_map[rel_dir]["images"].append(item)

    print(f"✓ Đã quét thành công {len(images)} file ảnh hợp lệ.")
    print(f"✓ Tìm thấy {len(folders_map)} thư mục mẫu thiết kế chuẩn.")
    print(f"✓ Phát hiện {len(loose_images)} ảnh chưa xếp vào folder mẫu.")
    print(f"✓ Tìm thấy {len(exact_duplicates)} file trùng lặp MD5 100%.")

    manifest = {
        "version": "5.0.0-folder-models-engine",
        "generatedAt": "2026-10-24T00:25:00Z",
        "totalImages": len(images),
        "totalModelFolders": len(folders_map),
        "uniqueImagesCount": len(seen_hashes),
        "exactDuplicatesCount": len(exact_duplicates),
        "exactDuplicates": exact_duplicates,
        "looseImagesCount": len(loose_images),
        "looseImages": loose_images,
        "modelFolders": list(folders_map.values()),
        "images": images
    }

    with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"✓ Manifest đã được ghi vào: {MANIFEST_PATH}")
    return manifest

if __name__ == '__main__':
    scan()
