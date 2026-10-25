import os
import sys
import io

if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(encoding='utf-8')
if isinstance(sys.stderr, io.TextIOWrapper):
    sys.stderr.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
WOMEN_DIR = os.path.join(ROOT_DIR, 'public', 'images', 'san-pham', 'quan-ao-nu')

def inspect_women():
    print("=== THỐNG KÊ CHI TIẾT ẢNH THỜI TRANG NỮ ===")
    if not os.path.exists(WOMEN_DIR):
        print(f"Lỗi: Không tìm thấy {WOMEN_DIR}")
        return

    cat_stats = {}
    total_imgs = 0
    total_models = 0

    for root, dirs, files in os.walk(WOMEN_DIR):
        img_files = [f for f in files if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
        if img_files:
            rel = os.path.relpath(root, WOMEN_DIR).replace('\\', '/')
            parts = rel.split('/')
            category = parts[0]
            if category == 'ao' and len(parts) > 1:
                category = parts[1]

            if category not in cat_stats:
                cat_stats[category] = {"models": 0, "images": 0}
            cat_stats[category]["models"] += 1
            cat_stats[category]["images"] += len(img_files)
            total_models += 1
            total_imgs += len(img_files)

    for cat, stat in sorted(cat_stats.items()):
        print(f"- {cat}: {stat['models']} mẫu, {stat['images']} ảnh")

    print(f"\nTổng cộng Quần áo Nữ: {total_models} folder mẫu, {total_imgs} ảnh.")

if __name__ == '__main__':
    inspect_women()
