import os
import sys
import io
import json
import math
import re
import statistics
import colorsys
from PIL import Image

if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MANIFEST_PATH = os.path.join(ROOT_DIR, 'public', 'images', 'san-pham', 'manifest.json')

with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

model_folders = manifest.get('modelFolders', [])

FILENAME_COLOR_MAP = [
    (r'(^|[-_])(hong|pink)([-_]|\.|$)', {"colorName": "Hồng Pastel", "colorHex": "#F472B6", "slug": "hong-pastel"}),
    (r'(^|[-_])(xanh-navy|navy)([-_]|\.|$)', {"colorName": "Xanh Navy", "colorHex": "#1E3A8A", "slug": "xanh-navy"}),
    (r'(^|[-_])(xanh-duong|xanh-bien|blue)([-_]|\.|$)', {"colorName": "Xanh Dương", "colorHex": "#2563EB", "slug": "xanh-duong"}),
    (r'(^|[-_])(xanh-reu|reu|olive|green)([-_]|\.|$)', {"colorName": "Xanh Rêu", "colorHex": "#365314", "slug": "xanh-reu"}),
    (r'(^|[-_])(den|black)([-_]|\.|$)', {"colorName": "Đen", "colorHex": "#18181B", "slug": "den"}),
    (r'(^|[-_])(trang|white)([-_]|\.|$)', {"colorName": "Trắng", "colorHex": "#F9FAFB", "slug": "trang"}),
    (r'(^|[-_])(kem|be|beige|cream)([-_]|\.|$)', {"colorName": "Kem Be", "colorHex": "#E8DDC8", "slug": "kem"}),
    (r'(^|[-_])(xam|ghi|grey|gray)([-_]|\.|$)', {"colorName": "Xám Khói", "colorHex": "#6B7280", "slug": "xam"}),
    (r'(^|[-_])(nau|brown|coffee)([-_]|\.|$)', {"colorName": "Nâu Cà Phê", "colorHex": "#78350F", "slug": "nau"}),
    (r'(^|[-_])(do|red|maroon)([-_]|\.|$)', {"colorName": "Đỏ Đô", "colorHex": "#DC2626", "slug": "do"}),
    (r'(^|[-_])(vang|yellow)([-_]|\.|$)', {"colorName": "Vàng Chanh", "colorHex": "#EAB308", "slug": "vang"}),
    (r'(^|[-_])(tim|purple)([-_]|\.|$)', {"colorName": "Tím Pastel", "colorHex": "#A855F7", "slug": "tim"})
]

def color_dist(c1, c2):
    return math.sqrt((c1[0] - c2[0])**2 + (c1[1] - c2[1])**2 + (c1[2] - c2[2])**2)

def classify_rgb_hsv(r_med, g_med, b_med, h_val, s_val, v_val):
    # 1. Trắng (White / Off-White)
    if v_val >= 0.70 and s_val < 0.12:
        return {"colorName": "Trắng", "colorHex": "#F9FAFB", "slug": "trang", "confidence": 0.95}

    # 2. Kem / Be (Warm Off-white / Cream / Beige)
    if 0.05 <= h_val <= 0.20 and v_val >= 0.62 and 0.08 <= s_val <= 0.38:
        return {"colorName": "Kem Be", "colorHex": "#E8DDC8", "slug": "kem", "confidence": 0.90}

    # 3. Vàng Nhạt
    if 0.11 <= h_val <= 0.18 and v_val >= 0.65 and s_val > 0.38:
        return {"colorName": "Vàng Nhạt", "colorHex": "#FDE047", "slug": "vang-nhat", "confidence": 0.90}

    # 4. Xanh Navy (Dark Navy)
    if 0.52 <= h_val <= 0.72 and s_val >= 0.20 and 0.10 <= v_val < 0.40:
        return {"colorName": "Xanh Navy", "colorHex": "#1E3A8A", "slug": "xanh-navy", "confidence": 0.92}

    # 5. Đen (True Black)
    if v_val < 0.22 or (v_val < 0.28 and s_val < 0.18):
        return {"colorName": "Đen", "colorHex": "#18181B", "slug": "den", "confidence": 0.95}

    # 6. Xám
    if s_val < 0.16:
        if v_val >= 0.68:
            return {"colorName": "Xám Nhạt", "colorHex": "#D1D5DB", "slug": "xam-nhat", "confidence": 0.90}
        else:
            return {"colorName": "Xám Khói", "colorHex": "#6B7280", "slug": "xam", "confidence": 0.90}

    # 7. Nâu Cà Phê
    if 0.05 <= h_val <= 0.12 and 0.20 <= v_val < 0.60 and s_val >= 0.25:
        return {"colorName": "Nâu Cà Phê", "colorHex": "#78350F", "slug": "nau", "confidence": 0.90}

    # 8. Xanh Dương
    if 0.50 <= h_val <= 0.70 and v_val >= 0.40 and s_val >= 0.20:
        return {"colorName": "Xanh Dương", "colorHex": "#2563EB", "slug": "xanh-duong", "confidence": 0.90}

    # 9. Xanh Rêu
    if 0.22 <= h_val <= 0.48 and s_val >= 0.18:
        return {"colorName": "Xanh Rêu", "colorHex": "#365314", "slug": "xanh-reu", "confidence": 0.88}

    # 10. Hồng Pastel
    if 0.80 <= h_val <= 0.99 and v_val > 0.60 and s_val > 0.15:
        return {"colorName": "Hồng Pastel", "colorHex": "#F472B6", "slug": "hong-pastel", "confidence": 0.95}

    # 11. Đỏ Đô / Đỏ
    if (h_val >= 0.94 or h_val <= 0.05) and s_val > 0.30:
        return {"colorName": "Đỏ Đô", "colorHex": "#DC2626", "slug": "do", "confidence": 0.88}

    hex_rep = '#{:02x}{:02x}{:02x}'.format(int(r_med), int(g_med), int(b_med))
    return {"colorName": "Màu Phối Độc Bản", "colorHex": hex_rep, "slug": "phoi-mau", "confidence": 0.70}

def analyze_image_color(img_path, file_name, is_pants=False):
    lower_name = file_name.lower()
    for pattern, color_info in FILENAME_COLOR_MAP:
        if re.search(pattern, lower_name):
            return {
                "colorName": color_info["colorName"],
                "colorHex": color_info["colorHex"],
                "slug": color_info["slug"],
                "confidence": 0.98,
                "needsColorReview": False,
                "source": "filename",
                "rgb": (128, 128, 128)
            }
    try:
        with Image.open(img_path) as raw:
            im = raw.convert('RGB')
            w, h = im.size
            if is_pants:
                crop_box = (int(w * 0.30), int(h * 0.45), int(w * 0.70), int(h * 0.85))
            else:
                crop_box = (int(w * 0.25), int(h * 0.25), int(w * 0.75), int(h * 0.75))
            cropped = im.crop(crop_box)
            cropped.thumbnail((40, 40))
            loaded = cropped.load()
            if loaded is None:
                return {"colorName": "Chưa xác minh", "colorHex": "#E4E4E7", "slug": "chua-xac-minh", "confidence": 0.0, "source": "unverified", "rgb": (128, 128, 128)}
            cw, ch = cropped.size
            pixels = [loaded[x, y][:3] for y in range(ch) for x in range(cw)]
            if not pixels:
                return {"colorName": "Chưa xác minh", "colorHex": "#E4E4E7", "slug": "chua-xac-minh", "confidence": 0.0, "source": "unverified", "rgb": (128, 128, 128)}
            r_med = statistics.median([p[0] for p in pixels])
            g_med = statistics.median([p[1] for p in pixels])
            b_med = statistics.median([p[2] for p in pixels])
            h_val, s_val, v_val = colorsys.rgb_to_hsv(r_med / 255.0, g_med / 255.0, b_med / 255.0)
            res = classify_rgb_hsv(r_med, g_med, b_med, h_val, s_val, v_val)
            res["source"] = "cv"
            res["rgb"] = (r_med, g_med, b_med)
            res["hsv"] = (h_val, s_val, v_val)
            res["needsColorReview"] = (res["slug"] in ["phoi-mau", "chua-xac-minh"])
            return res
    except Exception:
        return {"colorName": "Chưa xác minh", "colorHex": "#E4E4E7", "slug": "chua-xac-minh", "confidence": 0.0, "source": "error", "rgb": (128, 128, 128)}

def cluster_folder_images(folder_data):
    images = folder_data.get('images', [])
    cat_slug = folder_data.get('categorySlug', '')
    is_pants = ('quan' in cat_slug or 'short' in cat_slug or 'jeans' in cat_slug or 'jogger' in cat_slug or 'pants' in cat_slug)
    
    if not images:
        return []

    # Phân tích từng ảnh
    img_results = []
    for img in images:
        c_res = analyze_image_color(img['fullPath'], img['fileName'], is_pants=is_pants)
        img_results.append({
            "img": img,
            "color": c_res
        })

    # Gom cụm theo màu thật:
    # Bước 1: Khởi tạo cụm đầu tiên với ảnh đầu
    clusters = []
    for item in img_results:
        c = item['color']
        c_rgb = c.get('rgb', (128, 128, 128))
        c_slug = c.get('slug', 'chua-xac-minh')
        
        assigned = False
        for cl in clusters:
            cl_slug = cl['color']['slug']
            cl_rgb = cl['color'].get('rgb', (128, 128, 128))
            dist = color_dist(c_rgb, cl_rgb)
            
            # Điều kiện gom vào cùng 1 màu:
            # 1. Cùng slug và khoảng cách màu vừa phải (< 95)
            # 2. Hoặc một trong hai là biến thể ánh sáng (Trắng vs Xám nhạt vs Kem Be) với dist < 65
            # 3. Hoặc một ảnh là 'phoi-mau' (họa tiết in) nhưng màu nền gần với cụm chính (dist < 70)
            is_same_color = False
            if cl_slug == c_slug and dist < 95:
                is_same_color = True
            elif {cl_slug, c_slug}.issubset({'trang', 'kem', 'xam-nhat'}) and dist < 65:
                is_same_color = True
            elif (c_slug == 'phoi-mau' or cl_slug == 'phoi-mau') and dist < 70:
                is_same_color = True
            
            if is_same_color:
                cl['items'].append(item)
                # Nếu cụm trước đó là 'phoi-mau' hoặc 'xam-nhat' mà ảnh mới là màu chuẩn 'trang', ưu tiên màu chuẩn
                if cl['color']['slug'] in ['phoi-mau', 'xam-nhat'] and c['slug'] in ['trang', 'kem', 'den']:
                    cl['color'] = c
                assigned = True
                break

        if not assigned:
            clusters.append({
                "color": c,
                "items": [item]
            })

    # Chuyển đổi thành danh sách ColorVariant
    color_variants = []
    for idx, cl in enumerate(clusters):
        c_info = cl['color']
        gallery = [it['img']['webPath'] for it in cl['items']]
        first_img = gallery[0]
        c_slug = c_info['slug']
        color_variants.append({
            "colorName": c_info['colorName'],
            "colorHex": c_info['colorHex'],
            "slug": c_slug,
            "images": gallery,
            "thumbnail": first_img,
            "verificationStatus": "predicted" if c_info.get("source") == "cv" else "trusted-metadata",
            "verificationSource": c_info.get("source", "cv"),
            "isVerified": (c_info.get("source") == "filename" or c_info.get("confidence", 0) >= 0.85)
        })

    return color_variants

# Chạy thử trên toàn bộ 273 folder
single_color_count = 0
multi_color_count = 0
multi_photo_single_color = 0

for f in model_folders:
    cvs = cluster_folder_images(f)
    n_colors = len(cvs)
    n_images = len(f.get('images', []))
    if n_colors == 1:
        single_color_count += 1
        if n_images > 1:
            multi_photo_single_color += 1
    else:
        multi_color_count += 1

print(f"Tổng số folder mẫu: {len(model_folders)}")
print(f"Số sản phẩm 1 màu: {single_color_count}")
print(f"  Trong đó số sản phẩm nhiều ảnh chụp khác góc của cùng 1 màu: {multi_photo_single_color}")
print(f"Số sản phẩm có nhiều màu thật: {multi_color_count}")

# In chi tiết một số mẫu nhiều màu
print("\n--- Ví dụ các sản phẩm có nhiều màu thật ---")
count = 0
for f in model_folders:
    cvs = cluster_folder_images(f)
    if len(cvs) > 1:
        print(f"{f['folderKey']} ({len(f['images'])} ảnh -> {len(cvs)} màu):")
        for cv in cvs:
            print(f"    Màu '{cv['colorName']}' ({cv['slug']}): {len(cv['images'])} ảnh -> {cv['images']}")
        count += 1
        if count >= 8:
            break

# In chi tiết mẫu nhiều ảnh nhưng chỉ 1 màu
print("\n--- Ví dụ sản phẩm nhiều ảnh cùng 1 màu (Gallery nhiều góc) ---")
count = 0
for f in model_folders:
    cvs = cluster_folder_images(f)
    if len(cvs) == 1 and len(f['images']) > 1:
        cv = cvs[0]
        print(f"{f['folderKey']} ({len(f['images'])} ảnh -> DUY NHẤT 1 màu '{cv['colorName']}'): {len(cv['images'])} ảnh trong gallery")
        count += 1
        if count >= 8:
            break
