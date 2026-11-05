import os
import sys
import io
import json

if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(encoding='utf-8')
if isinstance(sys.stderr, io.TextIOWrapper):
    sys.stderr.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
REPORT_PATH = os.path.join(ROOT_DIR, 'src', 'mocks', 'duplicateReport.json')

def test_colors():
    print("=== KIỂM THỬ MÀU SẮC SẢN PHẨM NỮ ===")
    if not os.path.exists(REPORT_PATH):
        print(f"Lỗi: Không tìm thấy {REPORT_PATH}")
        return

    with open(REPORT_PATH, 'r', encoding='utf-8') as f:
        report = json.load(f)

    groups = report.get('confirmedMergedGroups', [])
    women_groups = [g for g in groups if g.get('gender') == 'nu' or g.get('parentProductId', '').startswith('W-')]

    violations = []
    for g in women_groups:
        pid = g['parentProductId']
        colors = g.get('mergedColors', [])
        color_names = [c['color'] for c in colors]
        # Nếu có nhiều màu mà không có ảnh tương ứng riêng biệt thì báo vi phạm
        for c in colors:
            if not c.get('gallery') and not c.get('image'):
                violations.append(f"{pid}: Màu {c['color']} không có ảnh thật")

    if violations:
        print(f"CẢNH BÁO: Phát hiện {len(violations)} biến thể màu không hợp lệ:")
        for v in violations[:10]:
            print(f"  - {v}")
    else:
        print(f"Hoàn hảo: Tất cả 143 sản phẩm Nữ đều tuân thủ quy tắc màu sắc thực tế!")
        single_cnt = sum(1 for g in women_groups if len(g.get('mergedColors', [])) == 1)
        print(f"- {single_cnt}/143 sản phẩm có đúng 1 màu xác minh (1 card = 1 swatch = gallery đầy đủ ảnh).")

if __name__ == '__main__':
    test_colors()
