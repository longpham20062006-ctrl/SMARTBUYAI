#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import os
import re
import sys
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FRONTEND_IMPORTED = os.path.join(ROOT_DIR, 'src', 'mocks', 'importedProducts.json')
BACKEND_IMPORTED = os.path.join(ROOT_DIR, 'backend', 'src', 'main', 'resources', 'data', 'importedProducts.json')
PRICING_REG = os.path.join(ROOT_DIR, 'src', 'mocks', 'pricingRegistry.json')
REPO_TS = os.path.join(ROOT_DIR, 'src', 'mocks', 'repository.ts')

print("=" * 70)
print("INTEGRATING MISSING PRODUCT IMAGES & ENRICHING CATALOG (V9 MASTER AUDIT)")
print("=" * 70)

with open(FRONTEND_IMPORTED, 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Initial product count: {len(products)}")

# 1. Update PANTS-005 with secondary image
pants_sec_img = "/images/san-pham/quan-ao-nam/quan/quan-dai/1792798442795_348043404565674403_5540743654312280467_a80592e298195e259619ac4731c03dd9.jpg"
updated_pants = False
for p in products:
    if p.get('id') == 'PANTS-005':
        if pants_sec_img not in p.get('images', []):
            p['images'].append(pants_sec_img)
            if p.get('colors') and len(p['colors']) > 0:
                if 'images' in p['colors'][0] and pants_sec_img not in p['colors'][0]['images']:
                    p['colors'][0]['images'].append(pants_sec_img)
            print(f"✓ Added secondary image to PANTS-005 (now has {len(p['images'])} images)")
            updated_pants = True
        break

# 2. Define the 7 Gothic Dresses
gothic_dresses = [
    {
        "id": "W-DRESS-GOTHIC-001",
        "name": "Váy Corset Gothic Ren Hoa Văn Victorian",
        "slug": "vay-corset-gothic-ren-hoa-van-victorian-w-dress-gothic-001",
        "image": "/images/san-pham/quan-ao-nu/vay/váy_corset_gothic_ren_hoa_văn_victorian.png",
        "price": 689000,
        "originalPrice": 789000,
        "costPrice": 345000,
        "shortDescription": "Váy corset gothic phong cách Victorian cổ điển, phối ren dệt tinh xảo, đai nẹp siết eo quý phái.",
        "description": "🔥 THÔNG TIN SẢN PHẨM:\n- Tên thiết kế: Váy Corset Gothic Ren Hoa Văn Victorian\n- Mã SKU: W-DRESS-GOTHIC-001\n- Phân loại: Váy Thiết Kế Gothic Nữ Cao Cấp\n- Thương hiệu: SMARTBUY AI\n- Phom dáng: Fit & Flare siết eo tôn dáng\n- Chất liệu: Vải Tafta phối ren hoa dệt thủ công\n- Họa tiết: Ren chìm phong cách Victorian quý tộc Anh Quốc\n- Các màu: Đen Huyền Bí (Black Noir)\n\n✨ ĐẶC ĐIỂM NỔI BẬT:\n- Khung xương nẹp thân áo mềm mại định hình vòng eo con kiến\n- Tay áo phối ren xếp tầng bồng bềnh nữ tính\n- Khóa kéo lưng ẩn giấu tinh tế, êm ái khi cử động\n- Thích hợp dự tiệc tối, chụp ảnh nghệ thuật phong cách Dark Romantic",
        "material": "Tafta cao cấp & Ren dệt Victorian",
        "style": "Gothic Victorian Luxury",
        "colorName": "Đen Noir",
        "colorHex": "#0A0A0A",
        "colorSlug": "den-noir"
    },
    {
        "id": "W-DRESS-GOTHIC-002",
        "name": "Váy Corset Gothic Đen Ngà Cầu Kỳ",
        "slug": "vay-corset-gothic-den-nga-cau-ky-w-dress-gothic-002",
        "image": "/images/san-pham/quan-ao-nu/vay/váy_corset_gothic_đen_ngà_cầu_kỳ.png",
        "price": 729000,
        "originalPrice": 850000,
        "costPrice": 365000,
        "shortDescription": "Váy corset gothic dạ hội phối sắc đen ngà kiêu kỳ, đính viền ren rủ bồng bềnh phong cách quý tộc Châu Âu.",
        "description": "🔥 THÔNG TIN SẢN PHẨM:\n- Tên thiết kế: Váy Corset Gothic Đen Ngà Cầu Kỳ\n- Mã SKU: W-DRESS-GOTHIC-002\n- Phân loại: Váy Thiết Kế Gothic Nữ Cao Cấp\n- Thương hiệu: SMARTBUY AI\n- Phom dáng: Corset Ballgown tiểu thư\n- Chất liệu: Satin mờ phối tơ ngà bồng bềnh\n- Màu sắc: Đen Ngà Hoàng Gia (Black & Ivory)\n\n✨ ĐẶC ĐIỂM NỔI BẬT:\n- Thiết kế phối màu đen và ngà tương phản ấn tượng\n- Chi tiết nơ ren ngực đính kết thủ công tỉ mỉ\n- Tùng váy nhiều lớp xòe rộng nhẹ nhàng khi sải bước",
        "material": "Satin mờ cao cấp & Tơ ngà bồng bềnh",
        "style": "Dark Romance & Royal Gothic",
        "colorName": "Đen Ngà",
        "colorHex": "#1C1917",
        "colorSlug": "den-nga"
    },
    {
        "id": "W-DRESS-GOTHIC-003",
        "name": "Váy Corset Gothic Đen Trắng Nhiều Tầng",
        "slug": "vay-corset-gothic-den-trang-nhieu-tang-w-dress-gothic-003",
        "image": "/images/san-pham/quan-ao-nu/vay/váy_corset_gothic_đen_trắng_nhiều_tầng.png",
        "price": 759000,
        "originalPrice": 890000,
        "costPrice": 380000,
        "shortDescription": "Thiết kế tùng váy đa tầng xếp bèo bồng bềnh, phối thân áo corset thắt dây sau lưng kiêu sa.",
        "description": "🔥 THÔNG TIN SẢN PHẨM:\n- Tên thiết kế: Váy Corset Gothic Đen Trắng Nhiều Tầng\n- Mã SKU: W-DRESS-GOTHIC-003\n- Phân loại: Váy Thiết Kế Gothic Nữ Cao Cấp\n- Thương hiệu: SMARTBUY AI\n- Phom dáng: Tiered Ballgown xếp tầng bồng bềnh\n- Màu sắc: Đen Trắng Tương Phản\n\n✨ ĐẶC ĐIỂM NỔI BẬT:\n- Tùng váy 4 lớp voan lưới bồng tự nhiên không cần tùng độn\n- Thân áo ôm sát đường cong tạo tỷ lệ đồng hồ cát quyến rũ\n- Dây ruy băng đan chéo sau lưng có thể điều chỉnh độ ôm theo vóc dáng",
        "material": "Voan lưới cao cấp & Thân áo nhung gấm",
        "style": "Dark Coquette & Gothic Lolita",
        "colorName": "Đen Trắng",
        "colorHex": "#18181B",
        "colorSlug": "den-trang"
    },
    {
        "id": "W-DRESS-GOTHIC-004",
        "name": "Váy Corset Kẻ Đỏ Đen Cổ Điển",
        "slug": "vay-corset-ke-do-den-co-dien-w-dress-gothic-004",
        "image": "/images/san-pham/quan-ao-nu/vay/váy_corset_kẻ_đỏ_đen_cổ_điển.png",
        "price": 649000,
        "originalPrice": 750000,
        "costPrice": 325000,
        "shortDescription": "Váy corset họa tiết kẻ Tartan đỏ đen phong cách punk rock pha gothic cổ điển cá tính và cuốn hút.",
        "description": "🔥 THÔNG TIN SẢN PHẨM:\n- Tên thiết kế: Váy Corset Kẻ Đỏ Đen Cổ Điển\n- Mã SKU: W-DRESS-GOTHIC-004\n- Phân loại: Váy Thiết Kế Gothic Nữ\n- Thương hiệu: SMARTBUY AI\n- Phong cách: Punk Gothic & Visual Kei\n- Họa tiết: Kẻ Tartan đỏ đen truyền thống\n\n✨ ĐẶC ĐIỂM NỔI BẬT:\n- Chất vải dạ mỏng đứng phom, giữ nếp váy suôn mượt\n- Phối khóa cài kim loại và dây da thời thượng\n- Dễ phối cùng bốt cao cổ hoặc giày Mary Jane da bóng",
        "material": "Dạ nỉ kẻ dệt cao cấp chống nhăn",
        "style": "Punk Gothic Vintage",
        "colorName": "Đỏ Đen Tartan",
        "colorHex": "#7F1D1D",
        "colorSlug": "do-den-tartan"
    },
    {
        "id": "W-DRESS-GOTHIC-005",
        "name": "Váy Dạ Hội Corset Đen Trắng Ren Hoa",
        "slug": "vay-da-hoi-corset-den-trang-ren-hoa-w-dress-gothic-005",
        "image": "/images/san-pham/quan-ao-nu/vay/váy_dạ_hội_corset_đen_trắng_ren_hoa.png",
        "price": 799000,
        "originalPrice": 920000,
        "costPrice": 400000,
        "shortDescription": "Váy dạ hội corset lộng lẫy thêu ren hoa nổi tinh xảo, tùng xòe dài sang trọng cho những buổi dạ tiệc.",
        "description": "🔥 THÔNG TIN SẢN PHẨM:\n- Tên thiết kế: Váy Dạ Hội Corset Đen Trắng Ren Hoa\n- Mã SKU: W-DRESS-GOTHIC-005\n- Phân loại: Váy Dạ Hội Gothic Cao Cấp\n- Thương hiệu: SMARTBUY AI\n- Phom dáng: Đầm dạ tiệc đuôi dài sang trọng\n\n✨ ĐẶC ĐIỂM NỔI BẬT:\n- Họa tiết ren hoa nổi 3D dệt thủ công sắc sảo\n- Lớp lót lụa tơ tằm nhân tạo mềm êm làn da\n- Thiết kế độc quyền cho các sự kiện dạ tiệc thời trang cao cấp",
        "material": "Gấm hoa chìm dệt nổi & Lót lụa satin",
        "style": "Evening Glamour & Gothic Chic",
        "colorName": "Đen Trắng Dạ Hội",
        "colorHex": "#09090B",
        "colorSlug": "den-trang-da-hoi"
    },
    {
        "id": "W-DRESS-GOTHIC-006",
        "name": "Váy Gothic Lolita Cổ Yếm Ren Đen Ivory",
        "slug": "vay-gothic-lolita-co-yem-ren-den-ivory-w-dress-gothic-006",
        "image": "/images/san-pham/quan-ao-nu/vay/váy_gothic_lolita_cổ_yếm_ren_đen_ivory.png",
        "price": 699000,
        "originalPrice": 820000,
        "costPrice": 350000,
        "shortDescription": "Váy thiết kế cổ yếm thêu hoa văn cung đình, kết hợp viền bèo ivory thanh nhã và nữ tính.",
        "description": "🔥 THÔNG TIN SẢN PHẨM:\n- Tên thiết kế: Váy Gothic Lolita Cổ Yếm Ren Đen Ivory\n- Mã SKU: W-DRESS-GOTHIC-006\n- Phân loại: Váy Thiết Kế Gothic Lolita\n- Thương hiệu: SMARTBUY AI\n- Phom dáng: Cổ yếm bèo rủ xòe chữ A\n\n✨ ĐẶC ĐIỂM NỔI BẬT:\n- Cổ yếm kín đáo nhưng thanh thoát, tôn bờ vai thon gọn\n- Nơ ngực và viền xếp ly tỉ mỉ phong cách búp bê sứ Châu Âu\n- Dây buộc cổ êm ái không gây hằn cấn",
        "material": "Cotton nhung mềm phối ren tơ mềm mại",
        "style": "Gothic Lolita Doll",
        "colorName": "Đen Phối Ivory",
        "colorHex": "#27272A",
        "colorSlug": "den-ivory"
    },
    {
        "id": "W-DRESS-GOTHIC-007",
        "name": "Váy Gothic Ren Hoa Đen Trắng Thanh Lịch",
        "slug": "vay-gothic-ren-hoa-den-trang-thanh-lich-w-dress-gothic-007",
        "image": "/images/san-pham/quan-ao-nu/vay/váy_gothic_ren_hoa_đen_trắng_thanh_lịch.png",
        "price": 679000,
        "originalPrice": 790000,
        "costPrice": 340000,
        "shortDescription": "Thiết kế váy ren hoa trang nhã phom ôm rủ nhẹ nhàng, phong cách gothic đương đại thanh lịch.",
        "description": "🔥 THÔNG TIN SẢN PHẨM:\n- Tên thiết kế: Váy Gothic Ren Hoa Đen Trắng Thanh Lịch\n- Mã SKU: W-DRESS-GOTHIC-007\n- Phân loại: Váy Thiết Kế Gothic Nữ Thanh Lịch\n- Thương hiệu: SMARTBUY AI\n- Phom dáng: Regular Fit thanh lịch\n\n✨ ĐẶC ĐIỂM NỔI BẬT:\n- Họa tiết hoa ren đen trên nền vải trắng sữa thanh tao\n- Ứng dụng linh hoạt từ dạo phố đến các buổi tiệc trà cuối tuần\n- Giữ màu đen tuyền bền đẹp sau nhiều lần giặt",
        "material": "Ren hoa nổi Pháp & Lót lụa nhân tạo",
        "style": "Gothic Elegance",
        "colorName": "Đen Trắng Thanh Lịch",
        "colorHex": "#18181B",
        "colorSlug": "den-trang-thanh-lich"
    }
]

existing_ids = {p['id'] for p in products}
new_items_added = 0

for g in gothic_dresses:
    pid = g['id']
    if pid in existing_ids:
        print(f"Item {pid} already exists in catalog, skipping.")
        continue

    sizes = ["S", "M", "L"]
    variants = []
    sku_variants = []
    for s_idx, s in enumerate(sizes):
        sku = f"{pid}-{g['colorSlug'].upper()}-{s}"
        vid = f"{pid.lower()}-{g['colorSlug']}-{s.lower()}"
        stock = 25 + (s_idx * 5)
        var_obj = {
            "id": vid,
            "sku": sku,
            "color": {
                "id": g['colorSlug'],
                "name": g['colorName'],
                "hex": g['colorHex'],
                "slug": g['colorSlug'],
                "image": g['image'],
                "images": [g['image']],
                "originalImage": g['image']
            },
            "colorId": g['colorSlug'],
            "size": s,
            "price": g['price'],
            "originalPrice": g['originalPrice'],
            "stock": stock,
            "image": g['image'],
            "isVerified": True
        }
        variants.append(var_obj)

        sku_variants.append({
            "sku": sku,
            "colorVariantId": f"{pid}-{g['colorSlug'].upper()}",
            "size": s,
            "price": g['price'],
            "stock": stock,
            "isVerified": True,
            "image": g['image']
        })

    prod_obj = {
        "id": pid,
        "folderKey": "quan-ao-nu/vay",
        "modelFolder": pid.lower(),
        "name": g['name'],
        "slug": g['slug'],
        "categorySlug": "vay",
        "parentGroup": "vay",
        "gender": "nu",
        "brand": "SMARTBUY AI",
        "price": g['price'],
        "originalPrice": g['originalPrice'],
        "costPrice": g['costPrice'],
        "suggestedPrice": g['price'],
        "approvedPrice": g['price'],
        "priceStatus": "approved",
        "profitMargin": round(((g['price'] - g['costPrice']) / g['price']) * 100, 1),
        "subCategoryPending": False,
        "needsClassification": False,
        "isSetItem": False,
        "setDetails": None,
        "shortDescription": g['shortDescription'],
        "description": g['description'],
        "material": g['material'],
        "fit": "Form chuẩn Gothic Luxury",
        "style": g['style'],
        "occasion": ["Dự tiệc", "Chụp OOTD", "Sự kiện", "Dạo phố"],
        "season": "all",
        "seasons": ["he", "dong", "xuan-thu"],
        "careInstructions": [
            "Giặt khô hoặc giặt tay nước mát nhẹ nhàng",
            "Không vắt mạnh hoặc sấy nhiệt độ cao",
            "Là hơi nước ở mức nhiệt thấp"
        ],
        "images": [g['image']],
        "colors": [
            {
                "id": g['colorSlug'],
                "name": g['colorName'],
                "hex": g['colorHex'],
                "slug": g['colorSlug'],
                "image": g['image'],
                "images": [g['image']],
                "originalImage": g['image']
            }
        ],
        "colorVariants": [
            {
                "id": f"{pid}-{g['colorSlug'].upper()}",
                "productId": pid,
                "colorName": g['colorName'],
                "colorHex": g['colorHex'],
                "images": [g['image']],
                "thumbnail": g['image'],
                "verificationStatus": "verified",
                "verificationSource": "disk",
                "isVerified": True
            }
        ],
        "defaultColorId": g['colorSlug'],
        "sizes": sizes,
        "variants": variants,
        "skuVariants": sku_variants,
        "rating": 5.0,
        "reviewCount": 18,
        "soldCount": 46,
        "discountPercent": round(((g['originalPrice'] - g['price']) / g['originalPrice']) * 100),
        "badge": "LUXURY",
        "isFeatured": True,
        "isNewArrival": True,
        "duplicateGroup": f"GRP-{pid}",
        "mergeStatus": "merged",
        "createdAt": "2026-10-29",
        "updatedAt": "2026-10-29",
        "isActive": True,
        "needsReview": False
    }

    products.append(prod_obj)
    new_items_added += 1
    print(f"✓ Added new Gothic dress: {pid} - {g['name']}")

print(f"Final product count: {len(products)} (+{new_items_added} new items)")

# Save Frontend importedProducts.json
with open(FRONTEND_IMPORTED, 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)
print(f"✓ Saved Frontend: {FRONTEND_IMPORTED}")

# Save Backend importedProducts.json
with open(BACKEND_IMPORTED, 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)
print(f"✓ Saved Backend: {BACKEND_IMPORTED}")

# Update pricingRegistry.json
if os.path.exists(PRICING_REG):
    with open(PRICING_REG, 'r', encoding='utf-8') as f:
        pricing_data = json.load(f)
    
    pricing_pids = {p.get('productId') for p in pricing_data}
    for g in gothic_dresses:
        if g['id'] not in pricing_pids:
            pricing_data.append({
                "productId": g['id'],
                "productName": g['name'],
                "categorySlug": "vay",
                "gender": "nu",
                "image": g['image'],
                "currentPrice": g['price'],
                "costPrice": g['costPrice'],
                "suggestedPrice": g['price'],
                "approvedPrice": g['price'],
                "originalPrice": g['originalPrice'],
                "profitMargin": round(((g['price'] - g['costPrice']) / g['price']) * 100, 1),
                "status": "approved",
                "subCategoryPending": False,
                "updatedAt": "2026-10-29T12:00:00Z"
            })
    with open(PRICING_REG, 'w', encoding='utf-8') as f:
        json.dump(pricing_data, f, ensure_ascii=False, indent=2)
    print(f"✓ Updated Pricing Registry: {PRICING_REG}")

# Update SCHEMA_VERSION in repository.ts
if os.path.exists(REPO_TS):
    with open(REPO_TS, 'r', encoding='utf-8') as f:
        repo_code = f.read()
    new_version_code = f"const SCHEMA_VERSION = 'v9.0-full-catalog-audit-{datetime.now().strftime('%Y%m%d%H%M')}';"
    updated_repo = re.sub(r"const SCHEMA_VERSION = ['\"][^'\"]+['\"];", new_version_code, repo_code)
    with open(REPO_TS, 'w', encoding='utf-8') as f:
        f.write(updated_repo)
    print(f"✓ Updated SCHEMA_VERSION in {REPO_TS}")

print("\n=== INTEGRATION COMPLETED SUCCESSFULLY ===")

