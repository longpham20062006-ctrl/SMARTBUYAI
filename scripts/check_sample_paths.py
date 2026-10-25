import os
import sys
import io

if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(encoding='utf-8')
if isinstance(sys.stderr, io.TextIOWrapper):
    sys.stderr.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PUBLIC_SAN_PHAM = os.path.join(ROOT_DIR, 'public', 'images', 'san-pham')

def check_paths():
    print("=== KIỂM TRA ĐƯỜNG DẪN FOLDER MẪU THỜI TRANG ===")
    if not os.path.exists(PUBLIC_SAN_PHAM):
        print(f"Lỗi: Không tìm thấy thư mục {PUBLIC_SAN_PHAM}")
        return

    genders = ['quan-ao-nam', 'quan-ao-nu']
    total_folders = 0
    total_images = 0

    for g in genders:
        g_dir = os.path.join(PUBLIC_SAN_PHAM, g)
        if not os.path.isdir(g_dir):
            continue
        g_folders = 0
        g_images = 0
        for root, dirs, files in os.walk(g_dir):
            img_files = [f for f in files if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
            if img_files:
                g_folders += 1
                g_images += len(img_files)
        total_folders += g_folders
        total_images += g_images
        print(f"[{g}]: {g_folders} folder mẫu, {g_images} ảnh")

    print(f"Tổng cộng toàn bộ hệ thống: {total_folders} folder mẫu, {total_images} ảnh")

if __name__ == '__main__':
    check_paths()
