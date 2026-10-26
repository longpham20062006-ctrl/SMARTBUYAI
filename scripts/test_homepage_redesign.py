import subprocess
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

routes = [
    ('home', 'http://127.0.0.1:5173/'),
    ('products', 'http://127.0.0.1:5173/products'),
    ('men', 'http://127.0.0.1:5173/products?gender=nam'),
    ('women', 'http://127.0.0.1:5173/products?gender=nu'),
    ('try_on', 'http://127.0.0.1:5173/try-on'),
    ('ai_stylist', 'http://127.0.0.1:5173/ai-stylist'),
    ('size_guide', 'http://127.0.0.1:5173/size-guide'),
    ('login', 'http://127.0.0.1:5173/login'),
]

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

print("=== CHECKING ROUTES DOM RENDERING & BRAND LOGO ===")
home_dom = ""
products_dom = ""

for name, url in routes:
    cmd = [
        chrome_path,
        '--headless=new',
        '--virtual-time-budget=4000',
        '--dump-dom',
        url
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore')
    html = res.stdout
    if name == 'home':
        home_dom = html
    elif name == 'products':
        products_dom = html

    has_header = '<header' in html
    has_logo = 'smartbuy-ai-logo-transparent.png' in html or 'alt="SMARTBUY AI"' in html
    has_black_box = 'bg-[#171818]' in html and 'BrandLogo' in html # should be False
    has_error = '<div id="runtime-error-overlay"' in html
    print(f"[{name.upper():10}] DOM: {len(html):6d} chars | Header: {has_header} | Clean Logo: {has_logo} | Errors: {has_error}")

print("\n=== VERIFYING HOMEPAGE PRICE HIDING RULE ===")
# Trên Homepage, các section Trending Now, New Arrivals, Editor's Picks, Lookbook KHÔNG được hiển thị giá
# Tìm các ký hiệu giá tiền '₫' trong body của Homepage
# Lưu ý: Marquee hoặc header freeship từ 299k có thể có '299k', nhưng giá tiền sản phẩm '₫' phải KHÔNG xuất hiện trong ProductCard
# Check if formatPrice pattern (e.g. \d+\.\d{3}₫) appears inside product card sections on HomePage
home_prices = re.findall(r'\d{2,3}\.\d{3}₫', home_dom)
products_prices = re.findall(r'\d{2,3}\.\d{3}₫', products_dom)
print(f"Price occurrences on HomePage: {len(home_prices)} {home_prices[:5]}")
print(f"Price occurrences on Products Catalog: {len(products_prices)} {products_prices[:5]}")

print("\n=== VERIFYING HEADER NAVIGATION TABS ON HOMEPAGE ===")
# Trên '/', Trang chủ phải có bg-[#8B5CF6], Nam không được có bg-[#8B5CF6]
# Let's inspect the active class on tabs
has_active_home = 'Trang chủ' in home_dom and 'bg-[#8B5CF6]' in home_dom
print(f"Header has purple background on active tab: {has_active_home}")

# Capture screenshots
os.makedirs('scripts/screenshots', exist_ok=True)
screens = [
    ('home_desktop_1440', 'http://127.0.0.1:5173/', '1440,900'),
    ('home_desktop_full', 'http://127.0.0.1:5173/', '1440,3000'),
    ('home_tablet_768', 'http://127.0.0.1:5173/', '768,1024'),
    ('home_mobile_375', 'http://127.0.0.1:5173/', '375,812'),
    ('products_catalog_1440', 'http://127.0.0.1:5173/products', '1440,900'),
]

print("\n=== CAPTURING VERIFICATION SCREENSHOTS ===")
for name, url, window_size in screens:
    out_path = os.path.abspath(f'scripts/screenshots/{name}.png')
    cmd = [
        chrome_path,
        '--headless=new',
        f'--window-size={window_size}',
        '--virtual-time-budget=4000',
        f'--screenshot={out_path}',
        url
    ]
    subprocess.run(cmd, capture_output=True)
    if os.path.exists(out_path):
        print(f"Saved screenshot: {name}.png ({os.path.getsize(out_path)} bytes)")
