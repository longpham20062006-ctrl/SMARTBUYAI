import os
import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
REPORT_PATH = os.path.join(ROOT_DIR, 'src', 'mocks', 'duplicateReport.json')
IMPORTED_TS_PATH = os.path.join(ROOT_DIR, 'src', 'mocks', 'importedProducts.ts')
BUILDER_TS_PATH = os.path.join(ROOT_DIR, 'src', 'mocks', 'genzCatalogBuilder.ts')
REPO_TS_PATH = os.path.join(ROOT_DIR, 'src', 'mocks', 'repository.ts')

def slugify(text):
    text = text.lower()
    replacements = {
        'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
        'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
        'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
        'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
        'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
        'đ': 'd'
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return text

def sync(dry_run=False):
    print("=== [BƯỚC 3] ĐỒNG BỘ NGUỒN DỮ LIỆU SẢN PHẨM & BIẾN THỂ (PRODUCTS:SYNC) ===")
    if dry_run:
        print(">>> CHẾ ĐỘ DRY-RUN: Chỉ phân tích và kiểm tra, KHÔNG ghi đè dữ liệu.")

    if not os.path.exists(REPORT_PATH):
        print(f"LỖI: Không tìm thấy báo cáo tại {REPORT_PATH}. Vui lòng chạy npm run products:analyze trước.")
        sys.exit(1)

    with open(REPORT_PATH, 'r', encoding='utf-8') as f:
        report = json.load(f)

    confirmed_groups = report.get('confirmedMergedGroups', [])
    print(f"Số nhóm thiết kế từ folder mẫu: {len(confirmed_groups)}")

    final_products = []
    sizes = ['S', 'M', 'L', 'XL', 'XXL']

    DESIGN_NAMES = {
        'POLO': [
            'Áo Polo Nam Cổ Bẻ Thêu Chữ Bdumf Phối Cổ Tương Phản',
            'Áo Polo Nam Tay Ngắn Họa Tiết Hoạt Họa Tie & Dog Độc Đáo',
            'Áo Polo Nhung Tăm Nam UNEELUID Cổ Điển Sang Trọng',
            'Áo Polo Phối Bo Cổ Kẻ Sọc In Mèo Thú Cưng Gen Z',
            'Áo Polo Nam Form Rộng Thêu Logo Tối Giản Mặc Hằng Ngày',
            'Áo Polo Thể Thao Phối Viền Cổ Dệt Mịn Chống Bai Dão',
            'Áo Polo Cổ Kéo Khóa Zip Minimalist Hiện Đại',
            'Áo Polo Bo Cổ Vintage American Style Thoáng Khí',
            'Áo Polo Dệt Gân Phối Cúc Cổ Bẻ Trẻ Trung'
        ],
        'TEE': [
            'Áo Thun NICE Typography Unisex Form Rộng',
            'Áo Thun Nam Oversize Graphic Cartoon Dog & Tie',
            'Áo Thun Boxy Tee In Chữ Retro Vintage 90s',
            'Áo Thun Streetwear Họa Tiết Cyberpunk 2026 Nổi Bật',
            'Áo Thun Heavyweight Trơn Dày Dặn 280gsm Đứng Phom',
            'Áo Thun Nam In Họa Tiết Y2K Tribal Dạo Phố',
            'Áo Thun Rộng Dáng Thả Vai Hip Hop Văn Hóa Seoul',
            'Áo Thun Họa Tiết Hoạt Họa Anime Nhật Bản Sắc Nét',
            'Áo Thun Cổ Viền Màu Phối Tương Phản Contrast Trẻ Trung',
            'Áo Thun Washed Xử Lý Giặt Axit Bụi Bặm Cá Tính',
            'Áo Thun Thêu Chữ Thập Minimalist Unisex Thoáng Mát',
            'Áo Thun Nam Họa Tiết Graffiti Nghệ Thuật Đường Phố',
            'Áo Thun Cotton Compact Không Nhăn Mặc Đi Học Đi Chơi'
        ],
        'LONGSLEEVE': [
            'Áo Thun Dài Tay Cổ Tròn Dệt Tổ Ong Waffle Knit Giữ Nhiệt',
            'Áo Longsleeve Nam In Dọc Cánh Tay Phom Rộng Năng Động',
            'Áo Thun Dài Tay Cổ Lọ 3cm Giữ Ấm Mùa Thu Đông',
            'Áo Dài Tay Raglan Phối Màu Cổ Điển Baseball Mỹ',
            'Áo Longsleeve Streetwear Nỉ Da Cá Nhẹ Nhàng Thoáng Khí',
            'Áo Thun Dài Tay Cổ Tim Cài Cúc Henley Retro Vintage',
            'Áo Thun Dài Tay In Graphic Mặt Lưng Oversize Phóng Khoáng',
            'Áo Longsleeve Dệt Gân Ribbed Co Giãn Tự Nhiên'
        ],
        'SHIRT': [
            'Áo Sơ Mi Dài Tay Lụa Chống Nhăn Công Sở & Dạo Phố',
            'Áo Sơ Mi Kẻ Caro Tartan Vintage Flannel Dày Dặn Mùa Thu',
            'Áo Sơ Mi Tay Ngắn Cổ Cuba Cuban Collar Đi Biển Năng Động',
            'Áo Sơ Mi Oxford Dệt Sợi Nổi Cổ Đóng Nút Button-Down Lịch Lãm',
            'Áo Sơ Mi Denim Bụi Bặm Phối Túi Nắp Nổi Hai Bên Ngực',
            'Áo Sơ Mi Đũi Linen Cổ Tàu Thoáng Mát Dễ Chịu Ngày Hè',
            'Áo Sơ Mi Khoác Ngoài Oversized Shacket Thu Đông Thời Thượng'
        ],
        'HOODIE': [
            'Áo Hoodie Nỉ Bông In Họa Tiết Mặt Cười Gai Cyber Chất Lừ',
            'Áo Hoodie Zip Khóa Kéo Hai Chiều Phom Rộng Chuẩn Gu Y2K',
            'Áo Hoodie Nỉ Chân Cua 420gsm Thêu Chữ Nổi 3D Đứng Dáng',
            'Áo Hoodie Phối Màu Hai Tông Color-block Năng Động Thể Thao',
            'Áo Hoodie Basic Trơn Mũ Hai Lớp Dày Dặn Phối Đồ Cực Dễ',
            'Áo Hoodie Rách Tưa Gấu Distressed Phong Cách Grunge Cá Tính',
            'Áo Hoodie Form Rộng In Họa Tiết Lửa Gothic Đen Trắng Ma Mị',
            'Áo Hoodie Thể Thao Phản Quang Đi Đêm Cực An Toàn & Ngầu',
            'Áo Hoodie Túi Kangaroo Rộng Rãi Tiện Lợi Chống Gió Lạnh'
        ],
        'SWEATER': [
            'Áo Len Dệt Kim Họa Tiết Hình Học Hàn Quốc Pastel Thanh Nhã',
            'Áo Len Cổ Lọ Dệt Vặn Thừng Cable Knit Dày Dặn Giữ Ấm',
            'Áo Cardigan Len Cài Cúc Phong Cách Học Đường Preppy Trẻ Trung',
            'Áo Len Dệt Lỗ Thở Xuyên Thấu Grunge Aesthetic Độc Lạ',
            'Áo Len Cổ Tròn Trơn Dệt Mịn Phối Sơ Mi Thanh Lịch',
            'Áo Sweater Len Xù Mohair Mềm Mại Xu Hướng Mùa Đông 2026',
            'Áo Len Dệt Kẻ Sọc Ngang Đậm Chất Nghệ Sĩ Retro Cổ Điển',
            'Áo Len Gile Không Tay Cổ Chữ V Phối Sơ Mi Học Đường',
            'Áo Len Nửa Khóa Kéo Half-Zip Khí Chất Nam Thần Hàn Quốc',
            'Áo Len Họa Tiết Bông Tuyết Bắc Âu Lễ Hội Ấm Áp'
        ]
    }

    category_counters = {}

    for idx, group in enumerate(confirmed_groups):
        pid = group['parentProductId']
        prefix = pid.split('-')[0]
        cat_slug = group['category']
        gender = group.get('gender', 'nam')
        seasons = group['seasons']
        folder_key = group.get('folderKey', '')
        model_folder = group.get('modelFolder', '')
        
        counter = category_counters.get(prefix, 0)
        names_list = DESIGN_NAMES.get(prefix, [])
        if model_folder == 'ao_thun_1':
            prod_name = "Áo Thun NICE Typography Unisex Form Rộng"
        elif names_list:
            prod_name = names_list[counter % len(names_list)]
        else:
            prod_name = group.get('productName', f"Thiết kế {prefix} #{counter + 1}")
        category_counters[prefix] = counter + 1

        slug = f"{slugify(prod_name)}-{pid.lower()}"

        # 3-tier colors mapping với đầy đủ gallery ảnh thực tế
        colors_list = []
        all_images = []
        for c in group['mergedColors']:
            gallery_imgs = c.get('gallery', [c['image']])
            c_item = {
                "id": c['colorId'],
                "name": c['color'],
                "hex": c['hex'],
                "slug": c['colorId'],
                "image": c['image'],
                "images": gallery_imgs
            }
            colors_list.append(c_item)
            all_images.extend(gallery_imgs)

        # Tránh trùng lặp ảnh trong all_images
        all_images = list(dict.fromkeys(all_images))

        base_price = 219000 if prefix == 'POLO' else 179000 if prefix == 'TEE' else 329000 if prefix == 'HOODIE' else 289000 if prefix == 'SWEATER' else 239000
        variants = []
        sku_variants = []

        for c_item in colors_list:
            for s in sizes:
                v_sku = f"{pid}-{c_item['slug'].upper()}-{s}"
                variant_obj = {
                    "id": f"{pid.lower()}-{c_item['slug']}-{s.lower()}",
                    "sku": v_sku,
                    "color": c_item,
                    "colorId": c_item['slug'],
                    "size": s,
                    "price": base_price,
                    "originalPrice": base_price + 70000,
                    "stock": 18 + ((idx * 3 + len(s)) % 25),
                    "image": c_item['image'],
                    "isVerified": True
                }
                variants.append(variant_obj)
                sku_variants.append({
                    "sku": v_sku,
                    "colorVariantId": f"{pid}-{c_item['slug'].upper()}",
                    "size": s,
                    "price": base_price,
                    "stock": variant_obj["stock"],
                    "isVerified": True
                })

        product_obj = {
            "id": pid,
            "folderKey": folder_key,
            "modelFolder": model_folder,
            "name": prod_name,
            "slug": slug,
            "categorySlug": cat_slug,
            "gender": gender,
            "brand": "SMARTBUY AI",
            "price": base_price,
            "originalPrice": base_price + 70000,
            "shortDescription": f"Mẫu {prod_name.lower()} chuẩn phom rộng phóng khoáng, chất liệu mềm mại thoáng khí, 100% ảnh thật từ folder {folder_key}.",
            "description": f"""🔥 THÔNG TIN SẢN PHẨM:
- Tên thiết kế: {prod_name}
- Thư mục nguồn: {folder_key}
- Mã Parent SKU: {pid}
- Thương hiệu: SMARTBUY AI (Chính hãng)
- Form dáng: Oversized / Regular Fit chuẩn Gen Z
- Phù hợp các mùa: {', '.join(['Mùa hè' if s == 'he' else 'Mùa đông' if s == 'dong' else 'Xuân – Thu' for s in seasons])}
- Các màu có sẵn: {', '.join([c['name'] for c in colors_list])}

✨ ĐẶC ĐIỂM NỔI BẬT:
- Một mẫu thiết kế duy nhất với các lựa chọn màu sắc được chụp thật 100%
- Khi bấm chọn màu trên website, hình ảnh đổi sang đúng màu vải thực tế
- Đường may đôi kỹ lưỡng, dệt bo sắc nét không bai dão sau khi giặt
- Hỗ trợ đổi size linh hoạt trong 15 ngày""",
            "material": "Cotton chải kỹ cao cấp dệt 2 chiều đứng dáng",
            "fit": "Oversized / Boxy Fit",
            "style": "Streetwear / Korean Casual",
            "occasion": ["Đi học", "Dạo phố", "Hằng ngày", "Chụp OOTD"],
            "season": "summer" if "he" in seasons else "winter" if "dong" in seasons else "spring-autumn",
            "seasons": seasons,
            "careInstructions": [
                "Giặt lộn trái ở nhiệt độ phòng",
                "Không dùng chất tẩy mạnh có clo",
                "Phơi nơi râm mát thoáng gió"
            ],
            "images": all_images,
            "colors": colors_list,
            "colorVariants": [
                {
                    "id": f"{pid}-{c['slug'].upper()}",
                    "colorName": c['name'],
                    "colorHex": c['hex'],
                    "images": c['images'],
                    "isVerified": True
                }
                for c in colors_list
            ],
            "defaultColorId": colors_list[0]['id'] if colors_list else 'den',
            "sizes": sizes,
            "variants": variants,
            "skuVariants": sku_variants,
            "rating": round(4.7 + ((idx * 0.1) % 0.3), 1),
            "reviewCount": 110 + (idx * 17) % 350,
            "soldCount": f"{round(1.2 + ((idx * 0.3) % 4.5), 1)}k",
            "discountPercent": round((70000 / (base_price + 70000)) * 100),
            "badge": "DROP" if idx % 4 == 0 else "HOT" if idx % 3 == 0 else "NEW" if idx % 2 == 0 else "TRENDING",
            "isFeatured": idx % 3 == 0,
            "isNewArrival": idx % 2 == 0,
            "duplicateGroup": f"GRP-{pid}",
            "mergeStatus": "merged",
            "createdAt": "2026-03-22",
            "updatedAt": "2026-03-24",
            "isActive": True,
            "needsReview": False
        }
        final_products.append(product_obj)

    if dry_run:
        print(f"[DRY-RUN] Sẽ tạo {len(final_products)} sản phẩm từ {len(confirmed_groups)} folder mẫu.")
        for p in final_products[:5]:
            print(f"  - {p['id']}: {p['name']} ({len(p['colors'])} màu, {len(p['images'])} ảnh, folder: {p['folderKey']})")
        print("[DRY-RUN] Kết thúc kiểm tra. Không có thay đổi nào được ghi vào đĩa.")
        return

    # 1. Ghi file src/mocks/importedProducts.ts
    imported_ts = f"""// Tự động sinh từ Folder-Based Product Variants Engine V3 (1 folder mẫu = 1 sản phẩm)
import {{ Product }} from '@/types';

export const IMPORTED_PRODUCTS: Product[] = {json.dumps(final_products, ensure_ascii=False, indent=2)};
"""
    with open(IMPORTED_TS_PATH, 'w', encoding='utf-8') as f:
        f.write(imported_ts)
    print(f"✓ Đã lưu {len(final_products)} sản phẩm hợp nhất vào {IMPORTED_TS_PATH}")

    # 2. Đồng bộ FINAL_GENZ_CATALOGUE trong src/mocks/genzCatalogBuilder.ts
    with open(BUILDER_TS_PATH, 'r', encoding='utf-8') as f:
        builder_content = f.read()

    replacement_pattern = r"export const FINAL_GENZ_CATALOGUE: Product\[\] = \[[\s\S]*?\];"
    new_catalog_export = """export const FINAL_GENZ_CATALOGUE: Product[] = [
  // Toàn bộ mẫu thiết kế chính xác từ kho ảnh thật 100% của SMARTBUY AI
  ...IMPORTED_PRODUCTS,
];"""

    updated_builder = re.sub(replacement_pattern, new_catalog_export, builder_content)
    with open(BUILDER_TS_PATH, 'w', encoding='utf-8') as f:
        f.write(updated_builder)
    print(f"✓ Đã đồng bộ FINAL_GENZ_CATALOGUE trong {BUILDER_TS_PATH} (loại bỏ sản phẩm mock/unsplash trùng)")

    # 3. Tăng SCHEMA_VERSION trong src/mocks/repository.ts để tự động làm mới bộ nhớ trình duyệt
    with open(REPO_TS_PATH, 'r', encoding='utf-8') as f:
        repo_content = f.read()

    new_version_str = "const SCHEMA_VERSION = 'v5.0-folder-models-engine';"
    updated_repo = re.sub(r"const SCHEMA_VERSION = ['\"][^'\"]+['\"];", new_version_str, repo_content)
    with open(REPO_TS_PATH, 'w', encoding='utf-8') as f:
        f.write(updated_repo)
    print(f"✓ Đã cập nhật SCHEMA_VERSION thành 'v5.0-folder-models-engine' trong {REPO_TS_PATH}")

    print("=== ĐỒNG BỘ THÀNH CÔNG ===")

if __name__ == '__main__':
    is_dry = '--dry-run' in sys.argv
    sync(dry_run=is_dry)
