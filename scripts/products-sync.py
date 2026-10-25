import os
import sys
import io
import json
import re
import csv

if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(encoding='utf-8')
if isinstance(sys.stderr, io.TextIOWrapper):
    sys.stderr.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
REPORT_PATH = os.path.join(ROOT_DIR, 'src', 'mocks', 'duplicateReport.json')
IMPORTED_TS_PATH = os.path.join(ROOT_DIR, 'src', 'mocks', 'importedProducts.ts')
IMPORTED_JSON_PATH = os.path.join(ROOT_DIR, 'src', 'mocks', 'importedProducts.json')
BUILDER_TS_PATH = os.path.join(ROOT_DIR, 'src', 'mocks', 'genzCatalogBuilder.ts')
REPO_TS_PATH = os.path.join(ROOT_DIR, 'src', 'mocks', 'repository.ts')
PRICING_REGISTRY_PATH = os.path.join(ROOT_DIR, 'src', 'mocks', 'pricingRegistry.json')
DATA_DIR = os.path.join(ROOT_DIR, 'public', 'data')
PRICING_CSV_PATH = os.path.join(DATA_DIR, 'men-catalog-pricing.csv')

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
    print("=== [BƯỚC 3] ĐỒNG BỘ NGUỒN DỮ LIỆU SẢN PHẨM & BIẾN THỂ & BẢNG GIÁ ĐỘC LẬP (V4) ===")
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
    pricing_records = []
    sizes = ['S', 'M', 'L', 'XL', 'XXL']

    # Danh mục tên sản phẩm chuẩn Gen Z Streetwear theo folder thực tế
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
            'Áo Polo Dệt Gân Phối Cúc Cổ Bẻ Trẻ Trung',
            'Áo Polo Regular Fit Vải Cá Sấu Dệt Mắt Chim Cao Cấp'
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
            'Áo Longsleeve Dệt Gân Ribbed Co Giãn Tự Nhiên',
            'Áo Dài Tay Phom Boxy Cổ Viền Đôi Dày Dặn',
            'Áo Longsleeve Striped Kẻ Ngang Thủy Thủ Cổ Điển',
            'Áo Dài Tay Thể Thao Nhanh Khô Chống Tia UV',
            'Áo Longsleeve Minimalist Trơn Cổ Bo Ôm Nhẹ Nhàng',
            'Áo Thun Dài Tay Thêu Chữ Nổi 3D Trước Ngực',
            'Áo Dài Tay Lớp Trong Giữ Nhiệt Heattech Siêu Nhẹ',
            'Áo Longsleeve Cắt Ráp Phối Khối Màu Colorblock Nổi Bật',
            'Áo Thun Dài Tay Gấu Xẻ Tà Thoải Mái Vận Động',
            'Áo Dài Tay Cổ Bẻ Polo Phối Cúc Thanh Lịch Mùa Thu',
            'Áo Longsleeve In Họa Tiết Galaxy Ảo Diệu',
            'Áo Dài Tay Wash Loang Acid Wash Bụi Bặm',
            'Áo Longsleeve Cotton Chải Kỹ 2 Chiều Giữ Form',
            'Áo Thun Dài Tay Túi Ngực Phong Cách Workwear',
            'Áo Dài Tay Bo Cổ Dệt Jacquard Tinh Tế',
            'Áo Longsleeve Phom Rộng Thả Vai Hàn Quốc',
            'Áo Thun Dài Tay Streetwear Graphic Độc Bản'
        ],
        'SHIRT': [
            'Áo Sơ Mi Dài Tay Lụa Chống Nhăn Công Sở & Dạo Phố',
            'Áo Sơ Mi Kẻ Caro Tartan Vintage Flannel Dày Dặn Mùa Thu',
            'Áo Sơ Mi Tay Ngắn Cổ Cuba Cuban Collar Đi Biển Năng Động',
            'Áo Sơ Mi Oxford Dệt Sợi Nổi Cổ Đóng Nút Button-Down Lịch Lãm',
            'Áo Sơ Mi Denim Bụi Bặm Phối Túi Nắp Nổi Hai Bên Ngực',
            'Áo Sơ Mi Đũi Linen Cổ Tàu Thoáng Mát Dễ Chịu Ngày Hè',
            'Áo Sơ Mi Khoác Ngoài Oversized Shacket Thu Đông Thời Thượng',
            'Áo Sơ Mi Lụa Hàn Quốc Dáng Rộng Rủ Mềm Mại',
            'Áo Sơ Mi Họa Tiết Hoa Lá Nhiệt Đới Dạo Phố',
            'Áo Sơ Mi Cổ Nhạn Retro Thập Niên 70 Phóng Khoáng',
            'Áo Sơ Mi Kẻ Sọc Dọc Tôn Dáng Thanh Lịch',
            'Áo Sơ Mi Vải Dạ Mỏng Khóa Kéo Hiện Đại'
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
            'Áo Hoodie Túi Kangaroo Rộng Rãi Tiện Lợi Chống Gió Lạnh',
            'Áo Hoodie Dệt Tổ Ong Mũ Dây Rút Dày Dặn Mùa Đông'
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
            'Áo Len Họa Tiết Bông Tuyết Bắc Âu Lễ Hội Ấm Áp',
            'Áo Sweater Cổ Tim Dệt Gân Co Giãn Thoáng Khí',
            'Áo Len Phom Boxy Thả Vai Dệt Sợi Cotton Tự Nhiên',
            'Áo Cardigan Len Dày Túi Ốp Phong Cách Vintage',
            'Áo Len Họa Tiết Loang Màu Ombre Trẻ Trung',
            'Áo Len Cổ Lọ 5cm Phối Áo Khoác Măng Tô Lịch Lãm',
            'Áo Sweater Len Cừu Mềm Dịu Không Kích Ứng Da',
            'Áo Len Phối Màu Tương Phản Nổi Bật Dạo Phố'
        ],
        'JACKET': [
            'Áo Khoác Gió Dù 2 Lớp Cản Gió Cổ Đứng Minimalist',
            'Áo Khoác Bomber Streetwear Phom Rộng Phối Bo Cổ',
            'Áo Khoác Kaki Dày Dặn Phối Túi Hộp Utility Thời Thượng',
            'Áo Khoác Varsity Jacket Phong Cách Bóng Chày Vintage',
            'Áo Khoác Gió Thể Thao Phối Viền Phản Quang Đi Đêm',
            'Áo Khoác Da PU Cao Cấp Cổ Bẻ Phong Trần Cá Tính',
            'Áo Khoác Cardigan Khoác Ngoài Dệt Sợi Dày Ấm Áp',
            'Áo Khoác Nỉ Da Cá Có Mũ Khóa Kéo Hai Chiều Tiện Lợi',
            'Áo Khoác Gió Dù Chống Thấm Nước Nhẹ Dạo Phố',
            'Áo Khoác Dáng Rộng Phong Cách Hàn Quốc Minimalist',
            'Áo Khoác Chần Bông Mùa Đông Siêu Nhẹ Giữ Nhiệt',
            'Áo Khoác Gile Gió Phối Áo Hoodie Năng Động',
            'Áo Khoác Shacket Vải Dạ Kẻ Ô Thời Trang Mùa Lạnh',
            'Áo Khoác Denim Bụi Bặm Xử Lý Rách Nhẹ Cá Tính',
            'Áo Khoác Thể Thao Bo Gấu Khóa Kéo Mượt Mà',
            'Áo Khoác Gió Hai Mặt Đổi Màu Tiện Dụng 2 Trong 1',
            'Áo Khoác Bomber Nhung Tăm Cổ Điển Sang Trọng',
            'Áo Khoác Cổ Lông Tháo Rời Giữ Ấm Cực Đỉnh',
            'Áo Khoác Dù Dáng Dài Cản Gió Đi Phượt Tiện Lợi'
        ],
        'PANTS': [
            'Quần Dài Nam Ống Suông Form Rộng Vải Tuyết Mưa',
            'Quần Dài Kaki Nam Ống Đứng Lịch Lãm Mặc Đi Học Đi Làm',
            'Quần Dài Túi Hộp Cargo Pants Phong Cách Tác Chiến Đường Phố',
            'Quần Jogger Thun Nam Bo Gấu Năng Động Thoải Mái',
            'Quần Dài Xếp Ly Hàn Quốc Ống Rộng Tôn Dáng'
        ],
        'SHORTS': [
            'Quần Short Kaki Nam Túi Hộp Dạo Phố Năng Động',
            'Quần Short Gió Dù Thể Thao Khô Nhanh Đi Tập & Đi Chơi',
            'Quần Short Thun Nam Cotton Chân Cua Thoáng Mát',
            'Quần Short Jorts Denim Rách Gấu Phóng Khoáng',
            'Quần Short Kaki Co Giãn Cạp Thun Dây Rút Tiện Lợi',
            'Quần Short Túi Mổ Phối Viền Tương Phản Thời Thượng',
            'Quần Short Thể Thao 2 Lớp Chống Lộ Đa Năng',
            'Quần Short Basic Dáng Ngang Gối Mặc Hằng Ngày',
            'Quần Short Túi Hộp Khóa Kéo Chống Rơi Đồ',
            'Quần Short Vải Đũi Linen Thoáng Mát Mùa Hè',
            'Quần Short Kaki Trơn Ống Suông Tôn Chiều Cao',
            'Quần Short Thun Phối Viền Kẻ Sọc Năng Động',
            'Quần Short Đi Biển Họa Tiết Nhiệt Đới Sắc Nét',
            'Quần Short Thể Thao Xẻ Gấu Tối Ưu Vận Động',
            'Quần Short Kaki Màu Trung Tính Dễ Phối Đồ',
            'Quần Short Cotton Dệt Gân Co Giãn Thoải Mái'
        ],
        'SET': [
            'Set Đồ Bộ Nam Nỉ Bông Phom Rộng Hoodie & Jogger Đường Phố',
            'Set Đồ Bộ Nam Thể Thao Dù Gió 2 Lớp Năng Động',
            'Set Đồ Bộ Nam Mùa Hè Áo Cổ Tròn Phối Quần Short Thoáng Mát',
            'Set Đồ Bộ Nam Dệt Kim Cotton Waffle Thoải Mái Mặc Nhà & Dạo Phố'
        ],
        'W-CROPTOP': [
            'Áo Croptop Nữ Ôm Dáng Cổ Tròn Minimalist Y2K',
            'Áo Croptop Thun Tăm Co Giãn Tôn Eo Năng Động',
            'Áo Croptop Cổ Vuông Dệt Kim Phong Cách Pháp',
            'Áo Croptop Sát Nách Dáng Boxy Thể Thao Dạo Phố',
            'Áo Croptop Bo Cổ Phối Viền Tương Phản Cá Tính',
            'Áo Croptop Cắt Xẻ Cut-out Độc Bản Táo Bạo',
            'Áo Croptop Rút Dây Hai Bên Eo Tùy Chỉnh Thời Thượng'
        ],
        'W-CARDIGAN': [
            'Áo Cardigan Nữ Dệt Kim Mềm Mịn Cài Cúc Vintage',
            'Áo Khoác Cardigan Len Mỏng Dáng Lửng Phối Váy',
            'Áo Cardigan Cổ Chữ V Phong Cách Hàn Quốc Thanh Lịch',
            'Áo Cardigan Dệt Gân Họa Tiết Nơ Dễ Thương',
            'Áo Cardigan Phom Rộng Thả Vai Xu Hướng Thu Đông',
            'Áo Cardigan Cúc Ánh Kim Sang Trọng Đi Làm Đi Chơi'
        ],
        'W-TANKTOP': [
            'Áo Hai Dây Lụa Cổ Đổ Quyến Rũ Thanh Lịch',
            'Áo Hai Dây Dệt Kim Ôm Body Mùa Hè Tươi Mát',
            'Áo Tank Top Thể Thao Thun Lạnh Nhanh Khô Thoáng Khí',
            'Áo Hai Dây Bản To Phong Cách Basic Tối Giản',
            'Áo Hai Dây Phối Ren Duyên Dáng Dạo Phố',
            'Áo Hai Dây Sọc Ngang Trẻ Trung Năng Động',
            'Áo Tank Top Cắt Nách Sâu Cá Tính Khỏe Khoắn'
        ],
        'W-TEE': [
            'Áo Thun Nữ Phom Rộng Baby Tee In Họa Tiết Vintage',
            'Áo Thun Nữ Cotton Compact Cổ Tròn Dễ Phối Đồ',
            'Áo Thun Nữ Dáng Rộng Thêu Chữ Nghệ Thuật Y2K',
            'Áo Baby Tee Co Giãn Tôn Vòng Eo Con Kiến',
            'Áo Thun Nữ Dài Quá Mông Phong Cách Giấu Quần',
            'Áo Thun Nữ Cổ Viền Màu Dệt Mịn Thoáng Mát',
            'Áo Thun Nữ In Hình Trừu Tượng Gen Z Độc Đáo',
            'Áo Thun Nữ Wash Xám Bụi Bặm Phóng Khoáng',
            'Áo Thun Nữ Họa Tiết Hoa Cúc Nhí Xinh Xắn',
            'Áo Thun Nữ Oversized Phối Quần Jean Năng Động',
            'Áo Baby Tee Cổ Tim Trẻ Trung Dễ Thương',
            'Áo Thun Nữ Trơn Màu Pastel Dịu Mắt Mùa Hè',
            'Áo Thun Nữ Phom Rộng Thả Vai Thoải Mái Cả Ngày'
        ],
        'W-HOODIE': [
            'Áo Hoodie Nữ Nỉ Bông Phom Rộng In Chữ Aesthetic',
            'Áo Hoodie Zip Nữ Khóa Kéo Hai Chiều Dáng Lửng',
            'Áo Hoodie Nữ Thêu Họa Tiết Trái Tim Đáng Yêu',
            'Áo Hoodie Nỉ Chân Cua 380gsm Đứng Dáng Ấm Áp',
            'Áo Hoodie Nữ Túi Trước Rộng Rãi Phong Cách Ulzzang',
            'Áo Hoodie Nữ Màu Pastel Ngọt Ngào Dạo Phố Thu Đông',
            'Áo Hoodie Nữ Mũ Dày Dặn Dây Rút Kim Loại Cao Cấp',
            'Áo Hoodie Crop Nữ Cạp Chun Thể Thao Khỏe Khoắn',
            'Áo Hoodie Nữ Phối Màu Hai Tông Tương Phản Thời Thượng'
        ],
        'W-SWEATER': [
            'Áo Len Nữ Dệt Kim Cổ Lọ Ấm Áp Mùa Đông',
            'Áo Sweater Len Xù Mohair Dáng Rộng Hàn Quốc',
            'Áo Len Nữ Cổ Tim Họa Tiết Quả Trám Preppy',
            'Áo Len Nữ Phom Boxy Thả Vai Dệt Sợi Tự Nhiên'
        ],
        'W-PANTS': [
            'Quần Nữ Ống Rộng Cạp Cao Hack Dáng Ulzzang',
            'Quần Dài Nữ Dáng Suông Vải Tuyết Mưa Thanh Lịch',
            'Quần Nữ Phom Rộng Phối Túi Sườn Thời Trang',
            'Quần Nữ Ống Đứng Lưng Thun Co Giãn Dạo Phố',
            'Quần Nữ Xếp Ly Phong Cách Hàn Quốc Tối Giản',
            'Quần Nữ Cạp Liền Dáng Suông Dễ Phối Đồ'
        ],
        'W-DRESS': [
            f"Váy Nữ Thiết Kế {style} #{i+1}" for i, style in enumerate([
                'Dáng Xòe Nhẹ', 'Cổ Vuông Tiểu Thư', 'Phối Nơ Thanh Lịch', 'Xếp Ly Tinh Tế',
                'Dáng Suông Tối Giản', 'Tay Bồng Hàn Quốc', 'Thắt Eo Duyên Dáng', 'Họa Tiết Pastel',
                'Lụa Mềm Dạo Phố', 'Cổ Chữ V Quyến Rũ', 'Vạt Xéo Trẻ Trung', 'Dáng Chữ A Kinh Điển',
                'Phối Cúc Thời Thượng', 'Dáng Midi Thướt Tha', 'Cúp Ngực Nhẹ Nhàng', 'Thêu Họa Tiết Nhỏ',
                'Trễ Vai Tươi Tắn', 'Dệt Kim Mùa Hè', 'Hai Dây Nữ Tính', 'Xẻ Tà Tinh Tế',
                'Nhún Bèo Xinh Xắn', 'Cổ Bẻ Thanh Lịch', 'Bo Eo Thon Gọn', 'Dáng Maxi Bay Bổng',
                'Vintage Thập Niên 90', 'Aesthetic Gen Z', 'Cắt Ráp Hiện Đại', 'Tối Giản Phong Cách Pháp',
                'Dáng Ôm Nhẹ Bodycon', 'Phối Viền Tương Phản', 'Chất Linen Thoáng Mát', 'Ren Phối Nhẹ',
                'Cổ Yếm Dạo Phố', 'Dáng Lửng Năng Động', 'Xếp Tầng Bồng Bềnh', 'Dệt Gân Ôm Nhẹ',
                'Tay Cánh Tiên', 'Họa Tiết Hoa Nhí', 'Suông Rộng Rũ Mềm', 'Cài Khóa Lưng Tinh Tế',
                'Xẻ Gấu Duyên Dáng', 'Phom Rộng Phóng Khoáng', 'Cổ Peter Pan Cổ Điển', 'Bo Cổ Tròn Mịn',
                'Thun Gân Co Giãn', 'Cột Nơ Sau Lưng', 'Đính Nút Ánh Kim', 'Tay Lỡ Thanh Nhã',
                'Xòe Tầng Xếp Nếp', 'Họa Tiết Sọc Kẻ', 'Vải Tơ Mỏng Nhẹ', 'Dáng Xòe Công Chúa',
                'Cổ Đổ Tự Nhiên', 'Chữ A Cạp Cao', 'Thêu Hoa Tay Tinh Xảo', 'Dáng Ôm Tôn Dáng',
                'Dạo Phố Cuối Tuần', 'Dự Tiệc Nhẹ Nhàng', 'Đi Biển Thoải Mái', 'Phong Cách Seoul',
                'Thời Trang Tokyo', 'Thanh Lịch Công Sở', 'Hẹn Hò Dễ Thương', 'Năng Động Trẻ Trung',
                'A-Line Đứng Dáng', 'Midi Xòe Bồng', 'Xẻ Đùi Táo Bạo', 'Chấm Bi Retro',
                'Vải Denim Mềm', 'Màu Trung Tính', 'Hồng Pastel Ngọt Ngào', 'Trắng Tinh Khôi',
                'Đen Cá Tính', 'Beige Cát Tối Giản', 'Xanh Pastel Dịu Dàng', 'Vàng Nhạt Nắng Hè',
                'Xanh Mint Tươi Mát', 'Xám Khói Thời Thượng', 'Tím Nhạt Mộng Mơ', 'Cam Đào Tươi Trẻ',
                'Nâu Cà Phê Cổ Điển', 'Đỏ Đô Sang Trọng', 'Họa Tiết Nghệ Thuật', 'Thun Lạnh Nhanh Khô',
                'Lụa Satin Mịn', 'Voan Tơ Mềm Rủ', 'Dệt Tổ Ong Thoáng', 'Kaki Mềm Đứng Phom',
                'Phối Cúc Gỗ Mộc', 'Viền Bèo Nữ Tính', 'Phom Chuẩn Đi Học'
            ])
        ]
    }

    # Bảng phân bổ giá đề xuất độc lập từng mẫu theo khoảng tham khảo mục 4.3 Master Prompt V4
    PRICE_BRACKETS = {
        'TEE': [159000, 169000, 179000, 189000, 199000, 209000, 219000, 229000, 239000, 249000, 259000, 269000, 279000],
        'LONGSLEEVE': [195000, 199000, 205000, 209000, 215000, 219000, 225000, 229000, 235000, 239000, 245000, 249000, 255000, 259000, 265000, 269000, 275000, 279000, 285000, 289000, 295000, 299000, 309000, 319000],
        'POLO': [209000, 219000, 229000, 239000, 249000, 259000, 269000, 279000, 289000, 299000],
        'SHIRT': [229000, 239000, 249000, 259000, 269000, 279000, 289000, 299000, 319000, 329000, 349000, 369000],
        'HOODIE': [319000, 339000, 359000, 369000, 389000, 399000, 419000, 439000, 459000, 479000],
        'SWEATER': [269000, 279000, 289000, 299000, 315000, 325000, 335000, 345000, 355000, 365000, 375000, 385000, 395000, 405000, 415000, 425000, 435000],
        'JACKET': [349000, 369000, 389000, 409000, 429000, 449000, 469000, 489000, 509000, 529000, 549000, 569000, 589000, 609000, 629000, 649000, 669000, 679000, 689000],
        'PANTS': [279000, 299000, 329000, 359000, 389000],
        'SHORTS': [179000, 189000, 199000, 209000, 219000, 229000, 239000, 249000, 259000, 269000, 279000, 289000, 299000, 309000, 319000, 325000],
        'SET': [349000, 389000, 439000, 489000],
        'W-CROPTOP': [149000, 159000, 169000, 179000, 189000, 199000, 209000],
        'W-CARDIGAN': [249000, 269000, 289000, 309000, 329000, 349000],
        'W-TANKTOP': [119000, 129000, 139000, 149000, 159000, 169000, 179000],
        'W-TEE': [169000, 179000, 189000, 199000, 209000, 219000, 229000, 239000, 249000, 259000, 269000, 279000, 289000],
        'W-HOODIE': [329000, 349000, 369000, 389000, 409000, 429000, 449000, 469000, 489000],
        'W-SWEATER': [279000, 299000, 319000, 339000],
        'W-PANTS': [259000, 279000, 299000, 319000, 339000, 359000],
        'W-DRESS': [249000 + ((i * 17) % 18) * 10000 for i in range(91)]
    }

    # Đọc giá đã duyệt từ trước (nếu có) để KHÔNG ghi đè giá đã được Admin phê duyệt
    existing_approved_prices = {}
    if os.path.exists(PRICING_REGISTRY_PATH):
        try:
            with open(PRICING_REGISTRY_PATH, 'r', encoding='utf-8') as f:
                prev_records = json.load(f)
                for pr in prev_records:
                    if pr.get('status') == 'approved' and pr.get('approvedPrice'):
                        existing_approved_prices[pr['productId']] = {
                            'approvedPrice': pr['approvedPrice'],
                            'costPrice': pr.get('costPrice'),
                            'status': pr['status'],
                            'suggestedPrice': pr.get('suggestedPrice', pr['approvedPrice'])
                        }
        except Exception:
            pass

    DRESS_MANIFEST_PATH = os.path.join(ROOT_DIR, 'public', 'images', 'san-pham', 'dress_enhancement_manifest.json')
    dress_opt_map = {}
    if os.path.exists(DRESS_MANIFEST_PATH):
        try:
            with open(DRESS_MANIFEST_PATH, 'r', encoding='utf-8') as f:
                d_m = json.load(f)
                for it in d_m.get('items', []):
                    dress_opt_map[it['originalWebPath']] = it['optimizedWebPath']
        except Exception:
            pass

    category_counters = {}

    for idx, group in enumerate(confirmed_groups):
        pid = group['parentProductId']
        gender = group.get('gender', 'nam')
        is_women = pid.startswith('W-') or gender == 'nu'
        raw_prefix = pid.split('-')[1] if pid.startswith('W-') else pid.split('-')[0]
        lookup_key = f"W-{raw_prefix}" if is_women else raw_prefix

        cat_slug = group['category']
        seasons = group['seasons']
        folder_key = group.get('folderKey', '')
        model_folder = group.get('modelFolder', '')
        
        counter = category_counters.get(lookup_key, 0)
        names_list = DESIGN_NAMES.get(lookup_key, DESIGN_NAMES.get(raw_prefix, []))
        if model_folder == 'ao_thun_1' and not is_women:
            prod_name = "Áo Thun NICE Typography Unisex Form Rộng"
        elif names_list:
            prod_name = names_list[counter % len(names_list)]
        else:
            prod_name = group.get('productName', f"Thiết kế {lookup_key} #{counter + 1}")

        # Tính giá riêng biệt không trùng lặp cho từng sản phẩm (bảo toàn giá đã duyệt)
        if pid in existing_approved_prices:
            base_price = existing_approved_prices[pid]['approvedPrice']
            cost_price = existing_approved_prices[pid].get('costPrice') or int(round(base_price * 0.52))
            profit_margin = round((base_price - cost_price) / base_price * 100, 1)
            price_status = 'approved'
            suggested_price = existing_approved_prices[pid].get('suggestedPrice', base_price)
            approved_price = base_price
        else:
            price_bracket = PRICE_BRACKETS.get(lookup_key, PRICE_BRACKETS.get(raw_prefix, [249000]))
            suggested_price = price_bracket[counter % len(price_bracket)]
            cost_price = int(round(suggested_price * 0.52))
            profit_margin = round((suggested_price - cost_price) / suggested_price * 100, 1)
            if is_women:
                # Mẫu Nữ chưa có giá bán thật: tạo giá đề xuất riêng từng mẫu, trạng thái chờ admin duyệt
                price_status = 'pending'
                base_price = 0
                approved_price = 0
            else:
                price_status = 'approved'
                base_price = suggested_price
                approved_price = suggested_price

        category_counters[lookup_key] = counter + 1
        slug = f"{slugify(prod_name)}-{pid.lower()}"

        # 3-tier colors mapping với đầy đủ gallery ảnh thực tế (áp dụng ảnh tối ưu độ nét cao cho Váy)
        colors_list = []
        all_images = []
        for c in group['mergedColors']:
            raw_gallery = c.get('gallery', [c['image']])
            gallery_imgs = [dress_opt_map.get(img, img) for img in raw_gallery]
            primary_c_img = dress_opt_map.get(c['image'], c['image'])
            c_item = {
                "id": c['colorId'],
                "name": c['color'],
                "hex": c['hex'],
                "slug": c['colorId'],
                "image": primary_c_img,
                "images": gallery_imgs,
                "originalImage": c['image']
            }
            colors_list.append(c_item)
            all_images.extend(gallery_imgs)

        # Tránh trùng lặp ảnh trong all_images
        all_images = list(dict.fromkeys(all_images))

        variants = []
        sku_variants = []

        for c_item in colors_list:
            c_slug_str = str(c_item['slug'])
            for s in sizes:
                v_sku = f"{pid}-{c_slug_str.upper()}-{s}"
                variant_obj = {
                    "id": f"{pid.lower()}-{c_slug_str}-{s.lower()}",
                    "sku": v_sku,
                    "color": c_item,
                    "colorId": c_slug_str,
                    "size": s,
                    "price": base_price,
                    "originalPrice": base_price, # Không tự tạo giá gốc cao giả
                    "stock": 18 + ((idx * 3 + len(s)) % 25),
                    "image": c_item['image'],
                    "isVerified": True
                }
                variants.append(variant_obj)
                sku_variants.append({
                    "sku": v_sku,
                    "colorVariantId": f"{pid}-{c_slug_str.upper()}",
                    "size": s,
                    "price": base_price,
                    "stock": variant_obj["stock"],
                    "isVerified": True
                })

        is_set = (cat_slug == 'do-bo')
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
            "originalPrice": base_price if base_price > 0 else suggested_price,
            "costPrice": cost_price,
            "suggestedPrice": suggested_price,
            "approvedPrice": approved_price,
            "priceStatus": price_status,
            "subCategoryPending": True if (is_women and cat_slug in ['quan', 'vay']) else False,
            "needsClassification": True if (is_women and cat_slug in ['quan', 'vay']) else False,
            "isSetItem": is_set,
            "setDetails": {
                "shirtSize": "L",
                "pantSize": "L",
                "includes": ["Áo đồng bộ", "Quần đồng bộ"]
            } if is_set else None,
            "shortDescription": f"Mẫu {prod_name.lower()} chuẩn phom rộng phóng khoáng, chất liệu mềm mại thoáng khí, 100% ảnh thật từ folder {folder_key}.",
            "description": f"""🔥 THÔNG TIN SẢN PHẨM:
- Tên thiết kế: {prod_name}
- Thư mục nguồn: {folder_key}
- Mã Parent SKU: {pid}
- Phân loại: {"Thời trang Nữ cao cấp" if is_women else ("Set Đồ Bộ Nam (Gồm áo & quần đồng điệu)" if is_set else "Thời trang Nam cao cấp")}
- Thương hiệu: SMARTBUY AI (Chính hãng)
- Form dáng: Oversized / Regular Fit chuẩn Gen Z
- Phù hợp các mùa: {', '.join(['Mùa hè' if s == 'he' else 'Mùa đông' if s == 'dong' else 'Xuân – Thu' for s in seasons])}
- Các màu có sẵn: {', '.join([c['name'] for c in colors_list])}

✨ ĐẶC ĐIỂM NỔI BẬT:
- Một mẫu thiết kế duy nhất với các lựa chọn màu sắc được chụp thật 100%
- Khi bấm chọn màu trên website, hình ảnh đổi sang đúng màu vải thực tế
- Đường may đôi kỹ lưỡng, dệt bo sắc nét không bai dão sau khi giặt
- Hỗ trợ đổi size linh hoạt trong 15 ngày""",
            "material": "Chất vải cao cấp thoáng mát mềm mại đứng dáng",
            "fit": "Form dáng chuẩn Gen Z",
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
                    "id": f"{pid}-{c['colorId'].upper()}",
                    "productId": pid,
                    "colorName": c['color'],
                    "colorHex": c['hex'],
                    "images": c.get('gallery', [c['image']]),
                    "thumbnail": c['image'],
                    "verificationStatus": c.get('verificationStatus', 'predicted'),
                    "verificationSource": c.get('verificationSource', 'cv'),
                    "isVerified": c.get('isVerified', False)
                }
                for c in group['mergedColors']
            ],
            "defaultColorId": colors_list[0]['id'] if colors_list else 'den',
            "sizes": sizes,
            "variants": variants,
            "skuVariants": sku_variants,
            "rating": 5.0,
            "reviewCount": 0,
            "soldCount": 0,
            "discountPercent": 0,
            "badge": "SET" if is_set else ("MỚI" if is_women else "Mới"),
            "isFeatured": idx % 4 == 0,
            "isNewArrival": True,
            "duplicateGroup": f"GRP-{pid}",
            "mergeStatus": "merged",
            "createdAt": "2026-10-24",
            "updatedAt": "2026-10-24",
            "isActive": True,
            "needsReview": False
        }
        final_products.append(product_obj)

        pricing_records.append({
            "productId": pid,
            "productName": prod_name,
            "categorySlug": cat_slug,
            "gender": gender,
            "image": all_images[0] if all_images else '',
            "currentPrice": base_price,
            "costPrice": cost_price,
            "suggestedPrice": suggested_price,
            "approvedPrice": approved_price,
            "originalPrice": base_price if base_price > 0 else suggested_price,
            "profitMargin": profit_margin,
            "status": price_status,
            "subCategoryPending": True if (is_women and cat_slug in ['quan', 'vay']) else False,
            "updatedAt": "2026-10-24T12:00:00Z"
        })

    if dry_run:
        print(f"[DRY-RUN] Sẽ tạo {len(final_products)} sản phẩm từ {len(confirmed_groups)} folder mẫu.")
        for p in final_products[:6]:
            print(f"  - {p['id']}: {p['name']} | Giá: {p['price']:,}đ | Giá nhập: {p['costPrice']:,}đ ({len(p['colors'])} màu, {len(p['images'])} ảnh)")
        print("[DRY-RUN] Kết thúc kiểm tra. Không có thay đổi nào được ghi vào đĩa.")
        return

    # 1. Ghi file src/mocks/importedProducts.json và wrapper src/mocks/importedProducts.ts
    with open(IMPORTED_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(final_products, f, ensure_ascii=False, indent=2)
    print(f"✓ Đã lưu {len(final_products)} sản phẩm hợp nhất vào {IMPORTED_JSON_PATH}")

    imported_ts = """// Tự động sinh từ Folder-Based Product Variants Engine V4 (1 folder mẫu = 1 sản phẩm)
import { Product } from '@/types';
import rawData from './importedProducts.json';

export const IMPORTED_PRODUCTS: Product[] = rawData as Product[];
"""
    with open(IMPORTED_TS_PATH, 'w', encoding='utf-8') as f:
        f.write(imported_ts)
    print(f"✓ Đã cập nhật wrapper {IMPORTED_TS_PATH}")

    # 2. Ghi bảng định giá độc lập src/mocks/pricingRegistry.json
    with open(PRICING_REGISTRY_PATH, 'w', encoding='utf-8') as f:
        json.dump(pricing_records, f, ensure_ascii=False, indent=2)
    print(f"✓ Đã lưu bảng giá {len(pricing_records)} sản phẩm độc lập vào {PRICING_REGISTRY_PATH}")

    # 3. Xuất file CSV: men-catalog-pricing.csv và women-catalog-pricing.csv
    os.makedirs(DATA_DIR, exist_ok=True)
    women_pricing_path = os.path.join(DATA_DIR, 'women-catalog-pricing.csv')
    men_records = [r for r in pricing_records if not r['productId'].startswith('W-')]
    women_records = [r for r in pricing_records if r['productId'].startswith('W-')]

    with open(PRICING_CSV_PATH, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Product ID', 'Tên sản phẩm', 'Danh mục', 'Giá hiện tại (VNĐ)', 'Giá nhập (VNĐ)', 'Giá đề xuất (VNĐ)', 'Giá được duyệt (VNĐ)', 'Biên lợi nhuận (%)', 'Trạng thái duyệt'])
        for r in men_records:
            writer.writerow([
                r['productId'],
                r['productName'],
                r['categorySlug'],
                r['currentPrice'],
                r['costPrice'],
                r['suggestedPrice'],
                r['approvedPrice'],
                f"{r['profitMargin']}%",
                r['status']
            ])
    print(f"✓ Đã xuất CSV bảng giá sản phẩm Nam ({len(men_records)} mẫu) ra: {PRICING_CSV_PATH}")

    with open(women_pricing_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Product ID', 'Tên sản phẩm', 'Danh mục', 'Giá hiện tại (VNĐ)', 'Giá nhập (VNĐ)', 'Giá đề xuất (VNĐ)', 'Giá được duyệt (VNĐ)', 'Biên lợi nhuận (%)', 'Trạng thái duyệt'])
        for r in women_records:
            writer.writerow([
                r['productId'],
                r['productName'],
                r['categorySlug'],
                r['currentPrice'],
                r['costPrice'],
                r['suggestedPrice'],
                r['approvedPrice'],
                f"{r['profitMargin']}%",
                r['status']
            ])
    print(f"✓ Đã xuất CSV bảng giá sản phẩm Nữ ({len(women_records)} mẫu) ra: {women_pricing_path}")

    # 4. Đồng bộ FINAL_GENZ_CATALOGUE trong src/mocks/genzCatalogBuilder.ts
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
    print(f"✓ Đã đồng bộ FINAL_GENZ_CATALOGUE trong {BUILDER_TS_PATH}")

    # 5. Tăng SCHEMA_VERSION trong src/mocks/repository.ts để tự động làm mới bộ nhớ trình duyệt
    with open(REPO_TS_PATH, 'r', encoding='utf-8') as f:
        repo_content = f.read()

    new_version_str = "const SCHEMA_VERSION = 'v7.3-women-carousel-sync';"
    updated_repo = re.sub(r"const SCHEMA_VERSION = ['\"][^'\"]+['\"];", new_version_str, repo_content)
    with open(REPO_TS_PATH, 'w', encoding='utf-8') as f:
        f.write(updated_repo)
    print(f"✓ Đã cập nhật SCHEMA_VERSION thành 'v7.3-women-carousel-sync' trong {REPO_TS_PATH}")

    print(f"=== ĐỒNG BỘ THÀNH CÔNG TOÀN BỘ {len(final_products)} SẢN PHẨM & BẢNG GIÁ ĐỘC LẬP ===")

if __name__ == '__main__':
    is_dry = '--dry-run' in sys.argv
    sync(dry_run=is_dry)
