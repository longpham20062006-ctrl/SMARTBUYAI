import os
import sys
import json
import re
import colorsys
import statistics
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MANIFEST_PATH = os.path.join(ROOT_DIR, 'public', 'images', 'san-pham', 'manifest.json')
REPORT_PATH = os.path.join(ROOT_DIR, 'src', 'mocks', 'duplicateReport.json')

# Bảng từ khóa màu sắc trong tên file (ưu tiên 1)
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

def extract_fabric_color(image_path, file_name=""):
    """
    Trích xuất màu vải trung tâm chính xác:
    - Bước 1: Ưu tiên tên file nếu có quy ước màu (ví dụ hong.jpg, den.jpg).
    - Bước 2: Phân tích vùng vải trung tâm (loại bỏ phông nền, viền, người mẫu).
    - Bước 3: Ánh xạ HSV/RGB sang màu thời trang chuẩn.
    """
    # 1. Kiểm tra tên file trước
    lower_name = file_name.lower()
    for pattern, color_info in FILENAME_COLOR_MAP:
        if re.search(pattern, lower_name):
            return {
                "colorName": color_info["colorName"],
                "colorHex": color_info["colorHex"],
                "slug": color_info["slug"],
                "confidence": 0.98,
                "needsColorReview": False,
                "source": "filename"
            }

    # 2. Phân tích thị giác bằng Pillow
    try:
        with Image.open(image_path) as raw:
            im = raw.convert('RGB')
            w, h = im.size
            crop_box = (int(w * 0.25), int(h * 0.25), int(w * 0.75), int(h * 0.75))
            cropped = im.crop(crop_box)
            cropped.thumbnail((40, 40))
            
            # Sử dụng getdata an toàn
            pixels = [p[:3] for p in cropped.getdata()]
            if not pixels:
                return {"colorName": "Đen", "colorHex": "#18181B", "slug": "den", "confidence": 0.5, "needsColorReview": True, "source": "fallback"}

            # Lọc bớt nhiễu viền hoặc họa tiết in: sắp xếp và lấy trung vị median
            r_vals = [p[0] for p in pixels]
            g_vals = [p[1] for p in pixels]
            b_vals = [p[2] for p in pixels]

            r_med = statistics.median(r_vals)
            g_med = statistics.median(g_vals)
            b_med = statistics.median(b_vals)

            h_val, s_val, v_val = colorsys.rgb_to_hsv(r_med / 255.0, g_med / 255.0, b_med / 255.0)

            # Phân loại màu vải chủ đạo theo thứ tự ưu tiên chính xác:
            # 1. Trắng (White / Off-White)
            if v_val >= 0.72 and s_val < 0.12:
                return {
                    "colorName": "Trắng",
                    "colorHex": "#F9FAFB",
                    "slug": "trang",
                    "confidence": 0.95,
                    "needsColorReview": False,
                    "verificationStatus": "predicted",
                    "source": "cv"
                }

            # 2. Kem / Be (Warm Off-white / Cream / Beige) - Kiểm tra TRƯỚC Xám
            if 0.06 <= h_val <= 0.18 and v_val >= 0.62 and 0.08 <= s_val <= 0.38:
                return {
                    "colorName": "Kem Be",
                    "colorHex": "#E8DDC8",
                    "slug": "kem",
                    "confidence": 0.90,
                    "needsColorReview": False,
                    "verificationStatus": "predicted",
                    "source": "cv"
                }

            # 3. Vàng Nhạt (Light Yellow)
            if 0.11 <= h_val <= 0.18 and v_val >= 0.65 and s_val > 0.38:
                return {
                    "colorName": "Vàng Nhạt",
                    "colorHex": "#FDE047",
                    "slug": "vang-nhat",
                    "confidence": 0.90,
                    "needsColorReview": False,
                    "verificationStatus": "predicted",
                    "source": "cv"
                }

            # 4. Xanh Navy (Dark Navy) - Kiểm tra TRƯỚC Đen
            if 0.52 <= h_val <= 0.72 and s_val >= 0.20 and 0.12 <= v_val < 0.40:
                return {
                    "colorName": "Xanh Navy",
                    "colorHex": "#1E3A8A",
                    "slug": "xanh-navy",
                    "confidence": 0.92,
                    "needsColorReview": False,
                    "verificationStatus": "predicted",
                    "source": "cv"
                }

            # 5. Đen (True Black)
            if v_val < 0.20 or (v_val < 0.28 and s_val < 0.18):
                return {
                    "colorName": "Đen",
                    "colorHex": "#18181B",
                    "slug": "den",
                    "confidence": 0.95,
                    "needsColorReview": False,
                    "verificationStatus": "predicted",
                    "source": "cv"
                }

            # 6. Xám (Light Gray, Gray, Dark Gray)
            if s_val < 0.16:
                if v_val >= 0.68:
                    return {
                        "colorName": "Xám Nhạt",
                        "colorHex": "#D1D5DB",
                        "slug": "xam-nhat",
                        "confidence": 0.90,
                        "needsColorReview": False,
                        "verificationStatus": "predicted",
                        "source": "cv"
                    }
                else:
                    return {
                        "colorName": "Xám Khói",
                        "colorHex": "#6B7280",
                        "slug": "xam",
                        "confidence": 0.90,
                        "needsColorReview": False,
                        "verificationStatus": "predicted",
                        "source": "cv"
                    }

            # 7. Nâu Cà Phê (Coffee Brown)
            if 0.05 <= h_val <= 0.12 and 0.20 <= v_val < 0.60 and s_val >= 0.25:
                return {
                    "colorName": "Nâu Cà Phê",
                    "colorHex": "#78350F",
                    "slug": "nau",
                    "confidence": 0.90,
                    "needsColorReview": False,
                    "verificationStatus": "predicted",
                    "source": "cv"
                }

            # 8. Xanh Dương (Bright Blue)
            if 0.50 <= h_val <= 0.70 and v_val >= 0.40 and s_val >= 0.20:
                return {
                    "colorName": "Xanh Dương",
                    "colorHex": "#2563EB",
                    "slug": "xanh-duong",
                    "confidence": 0.90,
                    "needsColorReview": False,
                    "verificationStatus": "predicted",
                    "source": "cv"
                }

            # 9. Xanh Rêu (Olive / Forest Green)
            if 0.22 <= h_val <= 0.48 and s_val >= 0.18:
                return {
                    "colorName": "Xanh Rêu",
                    "colorHex": "#365314",
                    "slug": "xanh-reu",
                    "confidence": 0.88,
                    "needsColorReview": False,
                    "verificationStatus": "predicted",
                    "source": "cv"
                }

            # 10. Hồng Pastel (Pastel Pink)
            if 0.80 <= h_val <= 0.99 and v_val > 0.60 and s_val > 0.15:
                return {
                    "colorName": "Hồng Pastel",
                    "colorHex": "#F472B6",
                    "slug": "hong-pastel",
                    "confidence": 0.95,
                    "needsColorReview": False,
                    "verificationStatus": "predicted",
                    "source": "cv"
                }

            # 11. Đỏ Đô (Burgundy / Red)
            if (h_val >= 0.95 or h_val <= 0.05) and s_val > 0.35:
                return {
                    "colorName": "Đỏ Đô",
                    "colorHex": "#DC2626",
                    "slug": "do",
                    "confidence": 0.88,
                    "needsColorReview": False,
                    "verificationStatus": "predicted",
                    "source": "cv"
                }

            # Màu phối / Họa tiết phức tạp
            hex_rep = '#{:02x}{:02x}{:02x}'.format(int(r_med), int(g_med), int(b_med))
            return {
                "colorName": "Màu Phối Độc Bản",
                "colorHex": hex_rep,
                "slug": "phoi-mau",
                "confidence": 0.70,
                "needsColorReview": True,
                "verificationStatus": "needs-review",
                "source": "cv"
            }
    except Exception as e:
        return {"colorName": "Đen", "colorHex": "#18181B", "slug": "den", "confidence": 0.5, "needsColorReview": True, "verificationStatus": "needs-review", "source": "error"}

def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]

def analyze():
    print("=== [BƯỚC 2] PHÂN TÍCH THỊ GIÁC: MỘT FOLDER MẪU = MỘT SẢN PHẨM ===")
    if not os.path.exists(MANIFEST_PATH):
        print(f"LỖI: Chưa có manifest tại {MANIFEST_PATH}. Vui lòng chạy npm run products:scan trước.")
        sys.exit(1)

    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        manifest = json.load(f)

    model_folders = manifest.get('modelFolders', [])
    print(f"Tổng số thư mục mẫu thiết kế: {len(model_folders)}")

    # Cấu hình danh mục và tag mùa chuẩn xác khớp từng folder thực tế
    CAT_METAS = {
        'ao-thun': {
            'prefix': 'TEE',
            'seasons': ['he', 'xuan-thu'],
            'basePrice': 179000,
            'defaultName': 'Áo Thun Nam Cổ Tròn Dáng Rộng',
            'material': '100% Cotton Compact 250gsm dày dặn, thấm hút 2 chiều',
            'fit': 'Oversized Streetwear'
        },
        'ao-thun-dai-tay': {
            'prefix': 'LONGSLEEVE',
            'seasons': ['dong', 'xuan-thu'],
            'basePrice': 199000,
            'defaultName': 'Áo Thun Dài Tay Nam Cổ Tròn',
            'material': 'Cotton 2 chiều dệt tổ ong thoáng khí giữ ấm',
            'fit': 'Relaxed Fit'
        },
        'ao-polo': {
            'prefix': 'POLO',
            'seasons': ['he', 'xuan-thu'],
            'basePrice': 219000,
            'defaultName': 'Áo Polo Nam Cổ Bẻ Cao Cấp',
            'material': '100% Pique Cotton dệt mắt chim thoáng khí, cổ dệt bo hai kim',
            'fit': 'Regular Boxy Fit'
        },
        'ao-so-mi': {
            'prefix': 'SHIRT',
            'seasons': ['he', 'xuan-thu', 'dong'],
            'basePrice': 239000,
            'defaultName': 'Áo Sơ Mi Nam Tay Dài Phom Rộng',
            'material': 'Lụa Cotton chống nhăn pha sợi đũi cao cấp',
            'fit': 'Relaxed Drop-shoulder'
        },
        'ao-hoodie': {
            'prefix': 'HOODIE',
            'seasons': ['dong', 'xuan-thu'],
            'basePrice': 329000,
            'defaultName': 'Áo Hoodie Nỉ Bông Dày Dặn Mùa Đông',
            'material': 'Nỉ bông Cotton 380gsm mũ trùm 2 lớp',
            'fit': 'Oversized Boxy'
        },
        'ao-len': {
            'prefix': 'SWEATER',
            'seasons': ['dong', 'xuan-thu'],
            'basePrice': 299000,
            'defaultName': 'Áo Len Dệt Kim Giữ Nhiệt Cao Cấp',
            'material': 'Sợi len lông cừu mềm mịn không ngứa',
            'fit': 'Regular Preppy Fit'
        },
        'ao-khoac': {
            'prefix': 'JACKET',
            'seasons': ['dong', 'xuan-thu'],
            'basePrice': 389000,
            'defaultName': 'Áo Khoác Phong Cách Streetwear',
            'material': 'Vải gió dù 2 lớp chống nước cản gió tốt',
            'fit': 'Relaxed Bomber'
        },
        'quan-short': {
            'prefix': 'SHORTS',
            'seasons': ['he', 'xuan-thu'],
            'basePrice': 169000,
            'defaultName': 'Quần Short Nam Năng Động Dạo Phố',
            'material': 'Vải Kaki hoặc Dù gió thể thao nhanh khô',
            'fit': 'Regular Fit trên gối'
        },
        'quan-dai': {
            'prefix': 'PANTS',
            'seasons': ['he', 'xuan-thu', 'dong'],
            'basePrice': 289000,
            'defaultName': 'Quần Dài Nam Ống Suông Form Rộng',
            'material': 'Kaki Cotton co giãn nhẹ hoặc vải Tuyết Mưa cao cấp',
            'fit': 'Straight Leg / Wide Leg'
        },
        'quan-jeans': {
            'prefix': 'JEANS',
            'seasons': ['he', 'xuan-thu', 'dong'],
            'basePrice': 349000,
            'defaultName': 'Quần Jeans Nam Denim Cao Cấp',
            'material': '100% Cotton Denim 13oz bền chắc đứng phom',
            'fit': 'Baggy / Straight Fit'
        },
        'phu-kien': {
            'prefix': 'ACC',
            'seasons': ['he', 'xuan-thu', 'dong'],
            'basePrice': 89000,
            'defaultName': 'Phụ Kiện Thời Trang Gen Z',
            'material': 'Hợp kim titan mạ bạc 925 chống xỉn',
            'fit': 'Freesize'
        }
    }

    # Sắp xếp các thư mục mẫu theo thứ tự tự nhiên (ao_thun_1, ao_thun_2, ...)
    sorted_folders = sorted(model_folders, key=lambda f: natural_sort_key(f['folderKey']))

    confirmed_groups = []
    duplicate_candidates = []
    category_counters = {}

    for folder_data in sorted_folders:
        folder_key = folder_data['folderKey']
        model_name = folder_data['modelFolder']
        cat_slug = folder_data['categorySlug']
        gender = folder_data['gender']
        prefix = folder_data.get('prefix', 'PROD')
        images = folder_data.get('images', [])

        meta = CAT_METAS.get(cat_slug, CAT_METAS['ao-thun'])
        seasons = meta['seasons']
        base_price = meta['basePrice']

        # Đếm số thứ tự model theo prefix
        idx = category_counters.get(prefix, 0) + 1
        category_counters[prefix] = idx
        prod_id = f"{prefix}-{str(idx).zfill(3)}"

        # Tên sản phẩm đặc biệt cho ao_thun_1
        if model_name == 'ao_thun_1':
            prod_name = "Áo Thun NICE Typography Unisex Form Rộng"
        elif 'defaultName' in meta:
            prod_name = f"{meta['defaultName']} #{idx}"
        else:
            prod_name = f"Thiết kế {model_name.replace('_', ' ').title()}"

        # Phân tích màu cho từng file trong folder mẫu
        color_variants_dict = {}
        for img_item in images:
            color_res = extract_fabric_color(img_item['fullPath'], img_item['fileName'])
            c_slug = color_res['slug']
            c_name = color_res['colorName']
            c_hex = color_res['colorHex']

            if c_slug not in color_variants_dict:
                is_ver = color_res.get("verificationStatus") in ["trusted-metadata", "admin-confirmed"]
                color_variants_dict[c_slug] = {
                    "id": f"{prod_id}-{c_slug.upper()}",
                    "productId": prod_id,
                    "colorName": c_name,
                    "colorHex": c_hex,
                    "slug": c_slug,
                    "images": [img_item['webPath']],
                    "thumbnail": img_item['webPath'],
                    "verificationStatus": color_res.get("verificationStatus", "predicted"),
                    "verificationSource": color_res.get("source", "cv"),
                    "isVerified": is_ver
                }
            else:
                # Case C: Cùng một mẫu, cùng màu nhưng nhiều góc ảnh -> đưa vào gallery images!
                color_variants_dict[c_slug]["images"].append(img_item['webPath'])

        color_variants_list = list(color_variants_dict.values())
        if not color_variants_list:
            continue

        primary_image = color_variants_list[0]["images"][0]
        all_product_images = []
        for cv in color_variants_list:
            all_product_images.extend(cv["images"])

        # SKU Variants (Màu x Size S, M, L, XL, XXL)
        sizes = ['S', 'M', 'L', 'XL', 'XXL']
        sku_variants = []
        for cv in color_variants_list:
            for s in sizes:
                sku_variants.append({
                    "sku": f"{prod_id}-{cv['slug'].upper()}-{s}",
                    "colorVariantId": cv["id"],
                    "color": {
                        "id": cv["slug"],
                        "name": cv["colorName"],
                        "hex": cv["colorHex"],
                        "slug": cv["slug"],
                        "image": cv["images"][0],
                        "images": cv["images"]
                    },
                    "size": s,
                    "price": base_price,
                    "originalPrice": base_price + 60000,
                    "stock": 25,
                    "image": cv["images"][0],
                    "isVerified": True
                })

        group_item = {
            "groupId": f"GRP-{prod_id}",
            "parentProductId": prod_id,
            "folderKey": folder_key,
            "modelFolder": model_name,
            "productName": prod_name,
            "category": cat_slug,
            "gender": gender,
            "seasons": seasons,
            "primaryImage": primary_image,
            "allImages": all_product_images,
            "mergedColors": [
                {
                    "color": cv["colorName"],
                    "colorId": cv["slug"],
                    "hex": cv["colorHex"],
                    "image": cv["images"][0],
                    "galleryCount": len(cv["images"]),
                    "gallery": cv["images"],
                    "verificationStatus": cv.get("verificationStatus", "predicted"),
                    "verificationSource": cv.get("verificationSource", "cv"),
                    "isVerified": cv.get("isVerified", False)
                }
                for cv in color_variants_list
            ],
            "totalColors": len(color_variants_list),
            "totalImages": len(all_product_images),
            "totalVariants": len(sku_variants),
            "reason": f"Mỗi folder mẫu = 1 sản phẩm ({folder_key}): {len(color_variants_list)} màu, {len(all_product_images)} ảnh"
        }

        confirmed_groups.append(group_item)

    # Báo cáo các folder cần admin kiểm tra (nếu có ảnh không rõ màu)
    for g in confirmed_groups:
        if any(c['colorId'] == 'phoi-mau' for c in g['mergedColors']):
            duplicate_candidates.append({
                "folder": g['folderKey'],
                "productId": g['parentProductId'],
                "productName": g['productName'],
                "status": "Cần xác nhận màu phối độc bản",
                "unmergedFilesCount": 1,
                "sampleFiles": [g['primaryImage']]
            })

    print(f"✓ Phân tích hoàn tất: Tạo thành công {len(confirmed_groups)} sản phẩm từ {len(sorted_folders)} folder mẫu.")
    print(f"✓ Số mẫu có nhiều màu sắc: {sum(1 for g in confirmed_groups if g['totalColors'] > 1)}")
    print(f"✓ Số mẫu có thư viện ảnh gallery (nhiều góc): {sum(1 for g in confirmed_groups if g['totalImages'] > g['totalColors'])}")

    report = {
        "generatedAt": "2026-10-24T00:25:00Z",
        "title": "SMARTBUY AI — Báo Cáo Phân Tích Mẫu Sản Phẩm Theo Folder Thực Tế V3",
        "engine": "Folder-Based Product Variants Engine V3 (1 Folder = 1 Product)",
        "summary": {
            "totalModelFolders": len(sorted_folders),
            "totalConfirmedProducts": len(confirmed_groups),
            "totalMergedProducts": len(confirmed_groups),
            "confirmedMergedGroupsCount": len(confirmed_groups),
            "totalScannedImages": len(manifest.get('images', [])),
            "looseImagesCount": manifest.get('looseImagesCount', 0),
            "multiColorProductsCount": sum(1 for g in confirmed_groups if g['totalColors'] > 1),
            "multiAngleGalleryProductsCount": sum(1 for g in confirmed_groups if g['totalImages'] > g['totalColors']),
            "pendingReviewCount": len(duplicate_candidates)
        },
        "confirmedMergedGroups": confirmed_groups,
        "duplicateCandidates": duplicate_candidates,
        "looseImages": manifest.get('looseImages', [])
    }

    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"✓ Báo cáo đã lưu vào: {REPORT_PATH}")
    return report

if __name__ == '__main__':
    analyze()
