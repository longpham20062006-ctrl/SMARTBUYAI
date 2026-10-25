import os
import sys
import io
import json
import re

if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(encoding='utf-8')
if isinstance(sys.stderr, io.TextIOWrapper):
    sys.stderr.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
IMPORTED_TS = os.path.join(ROOT_DIR, 'src', 'mocks', 'importedProducts.ts')
AUDIT_REPORT_PATH = os.path.join(ROOT_DIR, 'src', 'mocks', 'colorAuditReport.json')
PUBLIC_DIR = os.path.join(ROOT_DIR, 'public')

def audit_colors():
    print("=== [KIỂM TRA CHUYÊN SÂU] KIỂM ĐỊNH MÀU SẮC & BIẾN THỂ (PRODUCTS:AUDIT-COLORS) ===")

    if not os.path.exists(IMPORTED_TS):
        print(f"LỖI: Không tìm thấy {IMPORTED_TS}")
        sys.exit(1)

    with open(IMPORTED_TS, 'r', encoding='utf-8') as f:
        content = f.read()

    match = re.search(r'export const IMPORTED_PRODUCTS: Product\[\] = (\[[\s\S]*?\]);', content)
    if not match:
        print("LỖI: Không phân tích được mảng IMPORTED_PRODUCTS từ file ts.")
        sys.exit(1)

    products = json.loads(match.group(1))
    print(f"Tổng số sản phẩm cần kiểm định: {len(products)}")

    missing_images = []
    color_variants_count = 0
    trusted_count = 0
    predicted_count = 0
    needs_review_count = 0
    single_color_multi_swatch_issues = []
    empty_color_products = []

    for p in products:
        p_id = p.get('id', '')
        colors = p.get('colors', [])
        color_variants = p.get('colorVariants', [])
        images = p.get('images', [])

        if not colors:
            empty_color_products.append(p_id)
            continue

        color_variants_count += len(colors)

        # 1. Kiểm tra ảnh có tồn tại trên đĩa không
        for c in colors:
            c_img = c.get('image', '')
            if c_img.startswith('/'):
                local_path = os.path.join(PUBLIC_DIR, c_img.lstrip('/'))
                if not os.path.exists(local_path):
                    missing_images.append({
                        "productId": p_id,
                        "color": c.get('name'),
                        "image": c_img,
                        "error": "File ảnh không tồn tại trên đĩa"
                    })

            for g_img in c.get('images', []):
                if g_img.startswith('/'):
                    g_local = os.path.join(PUBLIC_DIR, g_img.lstrip('/'))
                    if not os.path.exists(g_local):
                        missing_images.append({
                            "productId": p_id,
                            "color": c.get('name'),
                            "image": g_img,
                            "error": "File ảnh gallery không tồn tại"
                        })

        # 2. Thống kê trạng thái xác minh từ colorVariants
        for cv in color_variants:
            status = cv.get('verificationStatus', 'predicted')
            if status == 'trusted-metadata':
                trusted_count += 1
            elif status == 'needs-review':
                needs_review_count += 1
            else:
                predicted_count += 1

        # 3. Kiểm tra trùng lặp slug màu trong cùng 1 sản phẩm
        slugs = [c.get('slug') for c in colors]
        if len(slugs) != len(set(slugs)):
            single_color_multi_swatch_issues.append({
                "productId": p_id,
                "duplicateSlugs": [s for s in slugs if slugs.count(s) > 1]
            })

    print("\n--- KẾT QUẢ KIỂM ĐỊNH MÀU SẮC ---")
    print(f"✓ Tổng số biến thể màu đã kiểm tra: {color_variants_count}")
    print(f"✓ Số biến thể có metadata màu đáng tin cậy (trusted-metadata): {trusted_count}")
    print(f"✓ Số biến thể dự đoán thị giác có độ chính xác cao (predicted): {predicted_count}")
    print(f"✓ Số biến thể cần admin kiểm duyệt đặc biệt (needs-review): {needs_review_count}")
    print(f"✓ Số file ảnh bị thiếu trên đĩa: {len(missing_images)}")
    print(f"✓ Số sản phẩm bị trùng lặp swatch cùng màu: {len(single_color_multi_swatch_issues)}")
    print(f"✓ Số sản phẩm không có màu: {len(empty_color_products)}")

    report = {
        "generatedAt": "2026-10-24T00:30:00Z",
        "totalProducts": len(products),
        "totalColorVariants": color_variants_count,
        "trustedMetadataCount": trusted_count,
        "predictedCount": predicted_count,
        "needsReviewCount": needs_review_count,
        "missingImagesCount": len(missing_images),
        "missingImages": missing_images,
        "duplicateColorSwatchIssues": single_color_multi_swatch_issues,
        "emptyColorProducts": empty_color_products
    }

    with open(AUDIT_REPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"✓ Báo cáo kiểm định màu sắc đã lưu tại: {AUDIT_REPORT_PATH}\n")
    return report

if __name__ == '__main__':
    audit_colors()
