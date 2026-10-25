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

def inspect_imported():
    print("=== KIỂM TRA SẢN PHẨM ĐÃ IMPORT TRONG HỆ THỐNG ===")
    if not os.path.exists(REPORT_PATH):
        print(f"Lỗi: Không tìm thấy {REPORT_PATH}")
        return

    with open(REPORT_PATH, 'r', encoding='utf-8') as f:
        report = json.load(f)

    groups = report.get('confirmedMergedGroups', [])
    men_groups = [g for g in groups if g.get('gender') == 'nam']
    women_groups = [g for g in groups if g.get('gender') == 'nu' or g.get('parentProductId', '').startswith('W-')]

    print(f"Tổng số sản phẩm: {len(groups)}")
    print(f"Nam: {len(men_groups)} sản phẩm")
    print(f"Nữ: {len(women_groups)} sản phẩm")

    # Kiểm tra số màu của sản phẩm nữ
    women_single_color = 0
    women_multi_color = 0
    for g in women_groups:
        colors = g.get('mergedColors', [])
        if len(colors) <= 1:
            women_single_color += 1
        else:
            women_multi_color += 1

    print(f"Sản phẩm Nữ 1 màu chuẩn xác: {women_single_color}")
    print(f"Sản phẩm Nữ đa màu xác minh: {women_multi_color}")

if __name__ == '__main__':
    inspect_imported()
