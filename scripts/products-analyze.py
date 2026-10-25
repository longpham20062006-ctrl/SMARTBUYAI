import os
import sys
import io
import json
import re
import colorsys
import statistics
import math
from PIL import Image

if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(encoding='utf-8')
if isinstance(sys.stderr, io.TextIOWrapper):
    sys.stderr.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MANIFEST_PATH = os.path.join(ROOT_DIR, 'public', 'images', 'san-pham', 'manifest.json')
REPORT_PATH = os.path.join(ROOT_DIR, 'src', 'mocks', 'duplicateReport.json')

def color_dist(c1, c2):
    return math.sqrt((c1[0] - c2[0])**2 + (c1[1] - c2[1])**2 + (c1[2] - c2[2])**2)

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

def extract_fabric_color(image_path, file_name="", is_pants=False):
    """
    Trích xuất màu vải trung tâm chính xác:
    - Bước 1: Ưu tiên tên file nếu có quy ước màu (ví dụ hong.jpg, den.jpg).
    - Bước 2: Phân tích vùng vải (vùng thân trên với áo; vùng thân dưới với quần/chân váy).
    - Bước 3: Ánh xạ HSV/RGB sang màu thời trang chuẩn và lưu RGB để gom cụm.
    """
    # 1. Kiểm tra tên file trước
    lower_name = file_name.lower()
    for pattern, color_info in FILENAME_COLOR_MAP:
        if re.search(pattern, lower_name):
            # Tính nhanh RGB để phục vụ gom cụm
            try:
                with Image.open(image_path) as raw:
                    im = raw.convert('RGB')
                    w, h = im.size
                    crop_box = (int(w * 0.30), int(h * 0.45), int(w * 0.70), int(h * 0.85)) if is_pants else (int(w * 0.25), int(h * 0.25), int(w * 0.75), int(h * 0.75))
                    cropped = im.crop(crop_box)
                    cropped.thumbnail((30, 30))
                    loaded = cropped.load()
                    cw, ch = cropped.size
                    pixels = [loaded[x, y][:3] for y in range(ch) for x in range(cw)] if loaded else []
                    r_med = statistics.median([p[0] for p in pixels]) if pixels else 128
                    g_med = statistics.median([p[1] for p in pixels]) if pixels else 128
                    b_med = statistics.median([p[2] for p in pixels]) if pixels else 128
                    rgb_val = (r_med, g_med, b_med)
            except Exception:
                rgb_val = (128, 128, 128)

            return {
                "colorName": color_info["colorName"],
                "colorHex": color_info["colorHex"],
                "slug": color_info["slug"],
                "confidence": 0.98,
                "needsColorReview": False,
                "source": "filename",
                "rgb": rgb_val
            }

    # 2. Phân tích thị giác bằng Pillow
    try:
        with Image.open(image_path) as raw:
            im = raw.convert('RGB')
            w, h = im.size
            if is_pants:
                crop_box = (int(w * 0.30), int(h * 0.45), int(w * 0.70), int(h * 0.85))
            else:
                crop_box = (int(w * 0.25), int(h * 0.25), int(w * 0.75), int(h * 0.75))
            cropped = im.crop(crop_box)
            cropped.thumbnail((40, 40))
            
            # Lấy pixel an toàn tương thích mọi phiên bản Pillow (không sinh DeprecationWarning)
            cw, ch = cropped.size
            loaded = cropped.load()
            if loaded is None:
                return {
                    "colorName": "Chưa xác minh",
                    "colorHex": "#E4E4E7",
                    "slug": "chua-xac-minh",
                    "confidence": 0.0,
                    "needsColorReview": True,
                    "verificationStatus": "needs-review",
                    "source": "unverified"
                }
            pixels = [loaded[x, y][:3] for y in range(ch) for x in range(cw)]
            if not pixels:
                return {
                    "colorName": "Chưa xác minh",
                    "colorHex": "#E4E4E7",
                    "slug": "chua-xac-minh",
                    "confidence": 0.0,
                    "needsColorReview": True,
                    "verificationStatus": "needs-review",
                    "source": "unverified"
                }

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
            if v_val >= 0.70 and s_val < 0.12:
                res = {
                    "colorName": "Trắng",
                    "colorHex": "#F9FAFB",
                    "slug": "trang",
                    "confidence": 0.95,
                    "needsColorReview": False,
                    "verificationStatus": "predicted",
                    "source": "cv"
                }

            # 2. Kem / Be (Warm Off-white / Cream / Beige) - Kiểm tra TRƯỚC Xám
            elif 0.05 <= h_val <= 0.20 and v_val >= 0.62 and 0.08 <= s_val <= 0.38:
                res = {
                    "colorName": "Kem Be",
                    "colorHex": "#E8DDC8",
                    "slug": "kem",
                    "confidence": 0.90,
                    "needsColorReview": False,
                    "verificationStatus": "predicted",
                    "source": "cv"
                }

            # 3. Vàng Nhạt (Light Yellow)
            elif 0.11 <= h_val <= 0.18 and v_val >= 0.65 and s_val > 0.38:
                res = {
                    "colorName": "Vàng Nhạt",
                    "colorHex": "#FDE047",
                    "slug": "vang-nhat",
                    "confidence": 0.90,
                    "needsColorReview": False,
                    "verificationStatus": "predicted",
                    "source": "cv"
                }

            # 4. Xanh Navy (Dark Navy) - Kiểm tra TRƯỚC Đen
            elif 0.52 <= h_val <= 0.72 and s_val >= 0.20 and 0.10 <= v_val < 0.40:
                res = {
                    "colorName": "Xanh Navy",
                    "colorHex": "#1E3A8A",
                    "slug": "xanh-navy",
                    "confidence": 0.92,
                    "needsColorReview": False,
                    "verificationStatus": "predicted",
                    "source": "cv"
                }

            # 5. Đen (True Black)
            elif v_val < 0.22 or (v_val < 0.28 and s_val < 0.18):
                res = {
                    "colorName": "Đen",
                    "colorHex": "#18181B",
                    "slug": "den",
                    "confidence": 0.95,
                    "needsColorReview": False,
                    "verificationStatus": "predicted",
                    "source": "cv"
                }

            # 6. Xám (Light Gray, Gray, Dark Gray)
            elif s_val < 0.16:
                if v_val >= 0.68:
                    res = {
                        "colorName": "Xám Nhạt",
                        "colorHex": "#D1D5DB",
                        "slug": "xam-nhat",
                        "confidence": 0.90,
                        "needsColorReview": False,
                        "verificationStatus": "predicted",
                        "source": "cv"
                    }
                else:
                    res = {
                        "colorName": "Xám Khói",
                        "colorHex": "#6B7280",
                        "slug": "xam",
                        "confidence": 0.90,
                        "needsColorReview": False,
                        "verificationStatus": "predicted",
                        "source": "cv"
                    }

            # 7. Nâu Cà Phê (Coffee Brown)
            elif 0.05 <= h_val <= 0.12 and 0.20 <= v_val < 0.60 and s_val >= 0.25:
                res = {
                    "colorName": "Nâu Cà Phê",
                    "colorHex": "#78350F",
                    "slug": "nau",
                    "confidence": 0.90,
                    "needsColorReview": False,
                    "verificationStatus": "predicted",
                    "source": "cv"
                }

            # 8. Xanh Dương (Bright Blue)
            elif 0.50 <= h_val <= 0.70 and v_val >= 0.40 and s_val >= 0.20:
                res = {
                    "colorName": "Xanh Dương",
                    "colorHex": "#2563EB",
                    "slug": "xanh-duong",
                    "confidence": 0.90,
                    "needsColorReview": False,
                    "verificationStatus": "predicted",
                    "source": "cv"
                }

            # 9. Xanh Rêu (Olive / Forest Green)
            elif 0.22 <= h_val <= 0.48 and s_val >= 0.18:
                res = {
                    "colorName": "Xanh Rêu",
                    "colorHex": "#365314",
                    "slug": "xanh-reu",
                    "confidence": 0.88,
                    "needsColorReview": False,
                    "verificationStatus": "predicted",
                    "source": "cv"
                }

            # 10. Hồng Pastel (Pastel Pink)
            elif 0.80 <= h_val <= 0.99 and v_val > 0.60 and s_val > 0.15:
                res = {
                    "colorName": "Hồng Pastel",
                    "colorHex": "#F472B6",
                    "slug": "hong-pastel",
                    "confidence": 0.95,
                    "needsColorReview": False,
                    "verificationStatus": "predicted",
                    "source": "cv"
                }

            # 11. Đỏ Đô (Burgundy / Red)
            elif (h_val >= 0.94 or h_val <= 0.05) and s_val > 0.30:
                res = {
                    "colorName": "Đỏ Đô",
                    "colorHex": "#DC2626",
                    "slug": "do",
                    "confidence": 0.88,
                    "needsColorReview": False,
                    "verificationStatus": "predicted",
                    "source": "cv"
                }

            # Màu phối / Họa tiết phức tạp
            else:
                hex_rep = '#{:02x}{:02x}{:02x}'.format(int(r_med), int(g_med), int(b_med))
                res = {
                    "colorName": "Màu Phối Độc Bản",
                    "colorHex": hex_rep,
                    "slug": "phoi-mau",
                    "confidence": 0.70,
                    "needsColorReview": True,
                    "verificationStatus": "needs-review",
                    "source": "cv"
                }

            res["rgb"] = (r_med, g_med, b_med)
            res["hsv"] = (h_val, s_val, v_val)
            return res
    except Exception:
        return {
            "colorName": "Chưa xác minh",
            "colorHex": "#E4E4E7",
            "slug": "chua-xac-minh",
            "confidence": 0.0,
            "needsColorReview": True,
            "verificationStatus": "needs-review",
            "source": "error",
            "rgb": (128, 128, 128)
        }

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
    # Cấu hình danh mục và tag mùa chuẩn xác khớp từng folder thực tế (29 danh mục Nữ + Nam/Phụ kiện)
    CAT_METAS = {
        # ÁO
        'ao-thun': {
            'prefix': 'TEE',
            'seasons': ['he', 'xuan-thu'],
            'basePrice': 179000,
            'defaultName': 'Áo Thun Phom Rộng',
            'material': '100% Cotton Compact 250gsm dày dặn, thấm hút 2 chiều',
            'fit': 'Oversized Streetwear'
        },
        'ao-thun-dai-tay': {
            'prefix': 'LONGSLEEVE',
            'seasons': ['dong', 'xuan-thu'],
            'basePrice': 199000,
            'defaultName': 'Áo Thun Dài Tay Cổ Tròn',
            'material': 'Cotton 2 chiều dệt tổ ong thoáng khí giữ ấm',
            'fit': 'Relaxed Fit'
        },
        'ao-croptop': {
            'prefix': 'CROPTOP',
            'seasons': ['he', 'xuan-thu'],
            'basePrice': 149000,
            'defaultName': 'Áo Croptop Nữ Tôn Dáng',
            'material': 'Thun gân cotton co giãn 4 chiều mềm mịn',
            'fit': 'Slim Cropped'
        },
        'ao-hai-day': {
            'prefix': 'TANKTOP',
            'seasons': ['he'],
            'basePrice': 119000,
            'defaultName': 'Áo Hai Dây / Tank Top Nữ',
            'material': 'Lụa satin hoặc thun tăm thoáng mát mùa hè',
            'fit': 'Slim Fit'
        },
        'ao-so-mi': {
            'prefix': 'SHIRT',
            'seasons': ['he', 'xuan-thu', 'dong'],
            'basePrice': 239000,
            'defaultName': 'Áo Sơ Mi Tay Dài Phom Rộng',
            'material': 'Lụa Cotton chống nhăn pha sợi đũi cao cấp',
            'fit': 'Relaxed Drop-shoulder'
        },
        'ao-kieu': {
            'prefix': 'BLOUSE',
            'seasons': ['he', 'xuan-thu'],
            'basePrice': 219000,
            'defaultName': 'Áo Kiểu Blouse Nữ Hàn Quốc',
            'material': 'Voan tơ mềm mại thoáng mát thanh lịch',
            'fit': 'Regular Fit'
        },
        'ao-polo': {
            'prefix': 'POLO',
            'seasons': ['he', 'xuan-thu'],
            'basePrice': 219000,
            'defaultName': 'Áo Polo Cổ Bẻ Cao Cấp',
            'material': '100% Pique Cotton dệt mắt chim thoáng khí, cổ dệt bo hai kim',
            'fit': 'Regular Boxy Fit'
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
        'ao-cardigan': {
            'prefix': 'CARDIGAN',
            'seasons': ['xuan-thu', 'dong'],
            'basePrice': 259000,
            'defaultName': 'Áo Cardigan Dệt Kim Mỏng Khoác Ngoài',
            'material': 'Sợi len mỏng dệt gân cài cúc',
            'fit': 'Relaxed Cardigan'
        },

        # QUẦN
        'quan-jeans': {
            'prefix': 'JEANS',
            'seasons': ['he', 'xuan-thu', 'dong'],
            'basePrice': 349000,
            'defaultName': 'Quần Jeans Denim Cao Cấp',
            'material': '100% Cotton Denim 13oz bền chắc đứng phom',
            'fit': 'Baggy / Straight Fit'
        },
        'quan-dai': {
            'prefix': 'PANTS',
            'seasons': ['he', 'xuan-thu', 'dong'],
            'basePrice': 289000,
            'defaultName': 'Quần Dài Ống Suông Form Rộng',
            'material': 'Kaki Cotton co giãn nhẹ hoặc vải Tuyết Mưa cao cấp',
            'fit': 'Straight Leg / Wide Leg'
        },
        'quan-short': {
            'prefix': 'SHORTS',
            'seasons': ['he', 'xuan-thu'],
            'basePrice': 169000,
            'defaultName': 'Quần Short Năng Động Dạo Phố',
            'material': 'Vải Kaki hoặc Dù gió thể thao nhanh khô',
            'fit': 'Regular Fit trên gối'
        },
        'quan-ong-rong': {
            'prefix': 'WIDELEG',
            'seasons': ['he', 'xuan-thu'],
            'basePrice': 269000,
            'defaultName': 'Quần Ống Rộng Nữ Dáng Suông',
            'material': 'Vải rũ tuyết mưa cao cấp chống nhăn',
            'fit': 'Wide-Leg Relaxed'
        },
        'quan-cargo': {
            'prefix': 'CARGO',
            'seasons': ['he', 'xuan-thu', 'dong'],
            'basePrice': 299000,
            'defaultName': 'Quần Túi Hộp Cargo Streetwear',
            'material': 'Kaki thô 100% cotton phong cách quân đội',
            'fit': 'Baggy Cargo'
        },
        'quan-legging': {
            'prefix': 'LEGGING',
            'seasons': ['he', 'xuan-thu', 'dong'],
            'basePrice': 189000,
            'defaultName': 'Quần Legging Nữ Co Giãn Tôn Dáng',
            'material': 'Thun dệt spandex co giãn 4 chiều định hình',
            'fit': 'Skinny Legging'
        },
        'quan-jogger': {
            'prefix': 'JOGGER',
            'seasons': ['he', 'xuan-thu', 'dong'],
            'basePrice': 249000,
            'defaultName': 'Quần Jogger Bo Gấu Năng Động',
            'material': 'Nỉ da cá hoặc cotton nỉ thoáng khí',
            'fit': 'Regular Jogger'
        },

        'quan': {
            'prefix': 'PANTS',
            'seasons': ['he', 'xuan-thu', 'dong'],
            'basePrice': 279000,
            'defaultName': 'Quần Nữ Thời Trang',
            'material': 'Chất vải cao cấp đứng phom (Chờ phân loại con)',
            'fit': 'Form dáng chuẩn nữ',
            'subCategoryPending': True
        },
        'vay': {
            'prefix': 'DRESS',
            'seasons': ['he', 'xuan-thu'],
            'basePrice': 299000,
            'defaultName': 'Váy Nữ Thời Trang',
            'material': 'Chất vải thời trang nữ mềm mại (Chờ phân loại con)',
            'fit': 'Dáng váy tôn eo',
            'subCategoryPending': True
        },
        # VÁY
        'chan-vay-ngan': {
            'prefix': 'MINISKIRT',
            'seasons': ['he', 'xuan-thu'],
            'basePrice': 199000,
            'defaultName': 'Chân Váy Ngắn Xếp Ly Nữ',
            'material': 'Tuyết mưa hoặc kaki đứng phom có quần bảo hộ trong',
            'fit': 'A-line Mini'
        },
        'chan-vay-dai': {
            'prefix': 'MAXISKIRT',
            'seasons': ['he', 'xuan-thu'],
            'basePrice': 239000,
            'defaultName': 'Chân Váy Dài Nữ Xòe Dáng Vintage',
            'material': 'Lụa tơ hoặc denim mềm rũ nhẹ nhàng',
            'fit': 'Midi / Maxi Flared'
        },
        'vay-lien': {
            'prefix': 'DRESS',
            'seasons': ['he', 'xuan-thu'],
            'basePrice': 289000,
            'defaultName': 'Váy Liền Thân Chữ A Thời Trang',
            'material': 'Vải linen hoặc lụa cotton thoáng mát',
            'fit': 'A-line Dress'
        },
        'dam-maxi': {
            'prefix': 'MAXIDRESS',
            'seasons': ['he'],
            'basePrice': 329000,
            'defaultName': 'Đầm Maxi Đi Biển Dáng Dài Thướt Tha',
            'material': 'Voan lụa hoa nhí bồng bềnh',
            'fit': 'Maxi Flowing'
        },
        'dam-du-tiec': {
            'prefix': 'PARTY',
            'seasons': ['he', 'xuan-thu', 'dong'],
            'basePrice': 389000,
            'defaultName': 'Đầm Dự Tiệc Bodycon Sang Trọng',
            'material': 'Ren lụa cao cấp đính hạt',
            'fit': 'Fitted Bodycon'
        },

        # ÁO KHOÁC
        'ao-khoac-jean': {
            'prefix': 'DENIMJACKET',
            'seasons': ['xuan-thu', 'dong'],
            'basePrice': 369000,
            'defaultName': 'Áo Khoác Denim Jacket Nữ',
            'material': 'Denim 12oz wash bạc phong cách vintage',
            'fit': 'Cropped / Boxy Jacket'
        },
        'ao-khoac-bomber': {
            'prefix': 'BOMBER',
            'seasons': ['xuan-thu', 'dong'],
            'basePrice': 349000,
            'defaultName': 'Áo Khoác Bomber Nữ 2 Lớp',
            'material': 'Vải dù gió cản nước lót lụa',
            'fit': 'Relaxed Bomber'
        },
        'ao-blazer': {
            'prefix': 'BLAZER',
            'seasons': ['xuan-thu', 'dong'],
            'basePrice': 389000,
            'defaultName': 'Áo Khoác Blazer Nữ Chuẩn Gu Hàn',
            'material': 'Tuyết mưa Hàn Quốc 2 lớp đứng form',
            'fit': 'Oversized Blazer'
        },
        'ao-khoac-chong-nang': {
            'prefix': 'SUNJACKET',
            'seasons': ['he'],
            'basePrice': 219000,
            'defaultName': 'Áo Khoác Chống Nắng Nữ UPF 50+',
            'material': 'Thun lạnh chống tia UV thoáng khí thấm hút',
            'fit': 'Standard Fit'
        },
        'ao-khoac': {
            'prefix': 'JACKET',
            'seasons': ['dong', 'xuan-thu'],
            'basePrice': 389000,
            'defaultName': 'Áo Khoác Phong Cách Streetwear',
            'material': 'Vải gió dù 2 lớp chống nước cản gió tốt',
            'fit': 'Relaxed Bomber'
        },

        # ĐỒ BỘ
        'set-ao-quan': {
            'prefix': 'SETPANTS',
            'seasons': ['he', 'xuan-thu'],
            'basePrice': 369000,
            'defaultName': 'Set Bộ Áo & Quần Nữ Năng Động',
            'material': 'Cotton 2 chiều dệt mềm thoáng',
            'fit': 'Co-ord Set'
        },
        'set-ao-chan-vay': {
            'prefix': 'SETSKIRT',
            'seasons': ['he', 'xuan-thu'],
            'basePrice': 389000,
            'defaultName': 'Set Áo & Chân Váy Nữ Thời Thượng',
            'material': 'Dạ tweed hoặc tuyết mưa sang trọng',
            'fit': 'Matching Skirt Set'
        },
        'do-the-thao': {
            'prefix': 'SPORTSET',
            'seasons': ['he', 'xuan-thu'],
            'basePrice': 319000,
            'defaultName': 'Set Đồ Thể Thao Nữ Năng Động',
            'material': 'Spandex thun lạnh co giãn thể thao',
            'fit': 'Athletic Set'
        },
        'do-bo': {
            'prefix': 'SET',
            'seasons': ['he', 'xuan-thu'],
            'basePrice': 389000,
            'defaultName': 'Set Đồ Bộ Nam Năng Động Dạo Phố',
            'material': 'Cotton Compact dệt 2 chiều hoặc Dù gió thể thao cao cấp',
            'fit': 'Regular / Relaxed Set'
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
        base_price_val = meta.get('basePrice', 0)
        base_price = int(base_price_val) if isinstance(base_price_val, (int, float)) else 0
        original_price = base_price + 60000 if base_price > 0 else 0

        # Đếm số thứ tự model theo prefix và gender (đảm bảo Nam và Nữ có ID độc lập không đè nhau)
        counter_key = f"{gender}_{prefix}" if gender == 'nu' else prefix
        idx = category_counters.get(counter_key, 0) + 1
        category_counters[counter_key] = idx
        prod_id = f"W-{prefix}-{str(idx).zfill(3)}" if gender == 'nu' else f"{prefix}-{str(idx).zfill(3)}"

        # Tên sản phẩm chuẩn xác theo danh mục
        if model_name == 'ao_thun_1' and gender == 'nam':
            prod_name = "Áo Thun NICE Typography Unisex Form Rộng"
        elif 'defaultName' in meta:
            prod_name = f"{meta['defaultName']} #{idx}"
        else:
            prod_name = f"Thiết kế {model_name.replace('_', ' ').title()}"

        # Phân tích màu cho folder mẫu:
        # Mỗi folder mẫu = 1 thiết kế sản phẩm thật (1 Product ID).
        # Quy tắc:
        # 1. Nếu cùng 1 màu chụp nhiều kiểu/góc khác nhau (chụp gần, chụp xa, treo áo, mặt trước/sau)
        #    => 1 Product, 1 Color Variant duy nhất, nhiều ảnh gallery cho đúng màu đó (Nhiều ảnh != Nhiều màu).
        # 2. Nếu cùng 1 kiểu dáng nhưng có nhiều màu khác nhau thật (VD: hoodie đen + trắng, áo len đen + trắng)
        #    => 1 Product, nhiều Color Variant thật, mỗi màu có ảnh tương ứng riêng.
        # 3. Nếu chưa xác định chắc màu => Đánh dấu needs-review, không sinh màu giả.
        is_pants = ('quan' in cat_slug or 'short' in cat_slug or 'jeans' in cat_slug or 'jogger' in cat_slug or 'pants' in cat_slug)
        img_results = []
        for img_item in images:
            color_res = extract_fabric_color(img_item['fullPath'], img_item['fileName'], is_pants=is_pants)
            img_results.append({
                "img": img_item,
                "color": color_res
            })

        # Phân cụm màu sắc:
        clusters = []
        for item in img_results:
            c = item['color']
            c_rgb = c.get('rgb', (128, 128, 128))
            c_slug = str(c.get('slug', 'chua-xac-minh'))

            assigned = False
            for cl in clusters:
                cl_slug = str(cl['color'].get('slug', 'chua-xac-minh'))
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
                    if cl['color'].get('slug') in ['phoi-mau', 'xam-nhat'] and c.get('slug') in ['trang', 'kem', 'den']:
                        cl['color'] = c
                    assigned = True
                    break

            if not assigned:
                clusters.append({
                    "color": c,
                    "items": [item]
                })

        color_variants_list = []
        for cl in clusters:
            c_info = cl['color']
            c_slug = str(c_info.get('slug', 'chua-xac-minh'))
            c_name = str(c_info.get('colorName', 'Chưa xác minh'))
            c_hex = str(c_info.get('colorHex', '#E4E4E7'))
            c_paths = [it['img']['webPath'] for it in cl['items']]
            is_ver = c_info.get("source") == "filename" or c_info.get("confidence", 0) >= 0.85

            color_variants_list.append({
                "id": f"{prod_id}-{c_slug.upper()}",
                "productId": prod_id,
                "colorName": c_name,
                "colorHex": c_hex,
                "slug": c_slug,
                "images": c_paths,
                "thumbnail": c_paths[0],
                "verificationStatus": c_info.get("verificationStatus", "predicted"),
                "verificationSource": c_info.get("source", "cv"),
                "isVerified": is_ver
            })
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
            cv_slug = str(cv['slug'])
            for s in sizes:
                sku_variants.append({
                    "sku": f"{prod_id}-{cv_slug.upper()}-{s}",
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
                    "originalPrice": original_price,
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
