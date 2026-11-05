import os
import sys
import io
import json
import hashlib
import csv
from collections import defaultdict
from PIL import Image

if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(encoding='utf-8')
if isinstance(sys.stderr, io.TextIOWrapper):
    sys.stderr.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PUBLIC_DIR = os.path.join(ROOT_DIR, 'public')
IMAGES_DIR = os.path.join(PUBLIC_DIR, 'images')
DOCS_DIR = os.path.join(ROOT_DIR, 'docs')
IMPORTED_JSON_PATH = os.path.join(ROOT_DIR, 'src', 'mocks', 'importedProducts.json')

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'}

def calculate_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def detect_category_from_path(rel_path):
    parts = rel_path.replace('\\', '/').lower().split('/')
    if 'anh_trangchu' in parts:
        return 'trang-chu-banner'
    if 'quan-ao-nam' in parts or 'nam' in parts:
        if 'ao' in parts or any('ao-' in p for p in parts):
            return 'nam-ao'
        if 'quan' in parts or any('quan-' in p for p in parts):
            return 'nam-quan'
        return 'nam'
    if 'quan-ao-nu' in parts or 'nu' in parts:
        if 'vay' in parts or any('vay' in p for p in parts):
            return 'nu-vay'
        if 'ao' in parts or any('ao-' in p for p in parts):
            return 'nu-ao'
        if 'quan' in parts or any('quan-' in p for p in parts):
            return 'nu-quan'
        return 'nu'
    if 'phu-kien' in parts:
        return 'phu-kien'
    if 'do-doi' in parts or 'couple' in parts:
        return 'do-doi'
    return 'khac'

def run_audit():
    print("========================================================================")
    print("🔍 SMARTBUY AI — FULL IMAGE & PRODUCT CATALOG AUDIT (MASTER PROMPT V9)")
    print("========================================================================\n")

    os.makedirs(DOCS_DIR, exist_ok=True)

    # 1. Load importedProducts.json
    with open(IMPORTED_JSON_PATH, 'r', encoding='utf-8') as f:
        products = json.load(f)
    print(f"📦 Đã nạp {len(products)} sản phẩm từ importedProducts.json")

    # Catalog images lookup map
    # public_url -> list of (product_id, role, variant_id)
    catalog_image_map = defaultdict(list)
    for p in products:
        pid = p.get('id', '')
        for img in p.get('images', []):
            if isinstance(img, str) and not img.startswith('http'):
                catalog_image_map[img].append((pid, 'main_gallery', None))
        for v in p.get('variants', []):
            v_img = v.get('imageUrl') or v.get('image')
            v_id = v.get('id')
            if isinstance(v_img, str) and not v_img.startswith('http'):
                catalog_image_map[v_img].append((pid, 'variant', v_id))
        for c in p.get('colors', []):
            c_img = c.get('image')
            if isinstance(c_img, str) and not c_img.startswith('http'):
                catalog_image_map[c_img].append((pid, 'color_swatch', None))

    print(f"🔗 Tổng số đường dẫn ảnh được tham chiếu trong catalog: {len(catalog_image_map)}")

    # 2. Quét đệ quy thư mục public/images
    all_disk_images = []
    hash_map = defaultdict(list)
    corrupted_images = []

    print(f"📂 Bắt đầu quét thư mục ảnh: {IMAGES_DIR}...")
    for root, dirs, files in os.walk(IMAGES_DIR):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in IMAGE_EXTENSIONS:
                full_path = os.path.join(root, file)
                rel_to_public = os.path.relpath(full_path, PUBLIC_DIR).replace('\\', '/')
                public_url = '/' + rel_to_public

                file_size = os.path.getsize(full_path)
                sha256 = calculate_sha256(full_path)

                # Validate image reading with Pillow
                is_valid = True
                width, height = 0, 0
                try:
                    with Image.open(full_path) as im:
                        width, height = im.size
                except Exception as ex:
                    is_valid = False
                    corrupted_images.append((full_path, str(ex)))

                category = detect_category_from_path(rel_to_public)

                img_record = {
                    'file_path': full_path,
                    'public_url': public_url,
                    'file_exists': True,
                    'image_valid': is_valid,
                    'file_name': file,
                    'extension': ext,
                    'file_size': file_size,
                    'width': width,
                    'height': height,
                    'sha256': sha256,
                    'detected_category': category,
                }
                all_disk_images.append(img_record)
                hash_map[sha256].append(public_url)

    print(f"✅ Đã quét {len(all_disk_images)} tệp ảnh thực tế trên đĩa.")
    print(f"⚠️ Số ảnh bị hỏng / không đọc được: {len(corrupted_images)}")

    # 3. Đối chiếu ảnh trên đĩa với Catalog
    used_images = []
    unused_images = []
    duplicate_groups = {}

    for sha, urls in hash_map.items():
        if len(urls) > 1:
            duplicate_groups[sha] = urls

    csv_rows = []
    for item in all_disk_images:
        url = item['public_url']
        sha = item['sha256']
        is_used_catalog = url in catalog_image_map
        is_homepage_asset = 'anh_trangchu' in url

        dup_group = f"DUP_{sha[:8]}" if len(hash_map[sha]) > 1 else ""

        linked_info = catalog_image_map.get(url, [])
        linked_pids = list({info[0] for info in linked_info})
        linked_vids = list({str(info[2]) for info in linked_info if info[2]})

        linked_product_str = ";".join(linked_pids)
        linked_variant_str = ";".join(linked_vids)

        if is_used_catalog:
            final_status = "USED"
            issue = ""
            proposed_action = "RETAIN"
            used_images.append(item)
        elif is_homepage_asset:
            final_status = "NOT_PRODUCT_ASSET"
            issue = "HOMEPAGE_BANNER_OR_EDITORIAL"
            proposed_action = "RETAIN_AS_STATIC_UI"
        elif not item['image_valid']:
            final_status = "INVALID"
            issue = "CORRUPTED_FILE"
            proposed_action = "MANUAL_REPAIR_OR_FLAG"
        elif len(hash_map[sha]) > 1 and any(u in catalog_image_map for u in hash_map[sha]):
            final_status = "DUPLICATE"
            issue = "EXACT_DUPLICATE_OF_USED_IMAGE"
            proposed_action = "MAP_TO_EXISTING_OR_ALIAS"
        else:
            final_status = "NEEDS_REVIEW"
            issue = "UNREFERENCED_VALID_IMAGE"
            proposed_action = "EVALUATE_FOR_CATALOG_ENRICHMENT"
            unused_images.append(item)

        csv_rows.append({
            'file_path': item['file_path'],
            'public_url': url,
            'file_exists': "TRUE",
            'image_valid': "TRUE" if item['image_valid'] else "FALSE",
            'width': item['width'],
            'height': item['height'],
            'sha256': sha,
            'perceptual_hash': "",
            'detected_category': item['detected_category'],
            'linked_product_id': linked_product_str,
            'linked_variant_id': linked_variant_str,
            'used_in_catalog': "TRUE" if is_used_catalog else "FALSE",
            'used_in_homepage': "TRUE" if is_homepage_asset else "FALSE",
            'served_successfully': "TRUE" if item['image_valid'] else "FALSE",
            'duplicate_group': dup_group,
            'issue': issue,
            'proposed_action': proposed_action,
            'final_status': final_status
        })

    # 4. Xuất file CSV docs/SMARTBUY_IMAGE_AUDIT.csv
    csv_path = os.path.join(DOCS_DIR, 'SMARTBUY_IMAGE_AUDIT.csv')
    fieldnames = [
        'file_path', 'public_url', 'file_exists', 'image_valid',
        'width', 'height', 'sha256', 'perceptual_hash',
        'detected_category', 'linked_product_id', 'linked_variant_id',
        'used_in_catalog', 'used_in_homepage', 'served_successfully',
        'duplicate_group', 'issue', 'proposed_action', 'final_status'
    ]

    with open(csv_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(csv_rows)

    print(f"📊 Đã ghi kết quả kiểm toán ảnh vào: {csv_path}")

    # 5. Kiểm tra chiều ngược lại: Có ảnh nào trong catalog bị 404 (không tồn tại trên đĩa) không?
    missing_catalog_images = []
    for url, usages in catalog_image_map.items():
        rel = url.lstrip('/')
        disk_path = os.path.join(PUBLIC_DIR, rel.replace('/', os.sep))
        if not os.path.exists(disk_path):
            missing_catalog_images.append((url, usages))

    print(f"🔍 Ảnh catalog bị 404 (không có trên đĩa): {len(missing_catalog_images)}")
    if missing_catalog_images:
        for m_url, usages in missing_catalog_images[:10]:
            print(f"   ❌ 404: {m_url} (Dùng bởi: {[u[0] for u in usages]})")

    print(f"\n========================================================================")
    print(f"📈 TỔNG KẾT KIỂM TOÁN HÌNH ẢNH:")
    print(f"   - Tổng số tệp ảnh trên đĩa: {len(all_disk_images)}")
    print(f"   - Ảnh đã sử dụng trong catalog: {len([r for r in csv_rows if r['used_in_catalog'] == 'TRUE'])}")
    print(f"   - Ảnh tĩnh trang chủ / UI: {len([r for r in csv_rows if r['used_in_homepage'] == 'TRUE'])}")
    print(f"   - Ảnh chưa sử dụng cần đánh giá: {len([r for r in csv_rows if r['final_status'] == 'NEEDS_REVIEW'])}")
    print(f"   - Ảnh trùng lặp exact SHA256: {len(duplicate_groups)} nhóm")
    print(f"   - Ảnh lỗi / hỏng: {len(corrupted_images)}")
    print(f"   - Ảnh catalog bị thiếu (404): {len(missing_catalog_images)}")
    print(f"========================================================================\n")

    # Xuất danh sách unused để phân tích chi tiết
    unused_list = [r for r in csv_rows if r['final_status'] == 'NEEDS_REVIEW']
    if unused_list:
        print("Chi tiết một số ảnh chưa sử dụng (unreferenced):")
        for u in unused_list[:15]:
            print(f"   * [{u['detected_category']}] {u['public_url']} ({u['width']}x{u['height']}, {u['sha256'][:8]})")

if __name__ == '__main__':
    run_audit()

