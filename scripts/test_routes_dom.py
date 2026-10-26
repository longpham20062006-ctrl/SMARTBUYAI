import subprocess
import os

routes = [
    ('home', 'http://127.0.0.1:5173/'),
    ('products', 'http://127.0.0.1:5173/products'),
    ('men', 'http://127.0.0.1:5173/products?gender=nam'),
    ('women', 'http://127.0.0.1:5173/products?gender=nu'),
    ('login', 'http://127.0.0.1:5173/login'),
    ('admin', 'http://127.0.0.1:5173/admin'),
]

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

print("=== CHECKING ROUTES DOM RENDERING & BRAND LOGO ===")
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
    has_header = '<header' in html
    has_logo = 'alt="SMARTBUY AI"' in html or 'smartbuy-ai-logo' in html or 'smartbuy-ai-icon' in html
    has_error_overlay = '<div id="runtime-error-overlay"' in html
    print(f"[{name.upper()}] URL: {url} | DOM: {len(html)} chars | Header: {has_header} | Logo: {has_logo} | Errors: {has_error_overlay}")

# Capture screenshots for visual inspection
os.makedirs('scripts/screenshots', exist_ok=True)
screens = [
    ('desktop_home', 'http://127.0.0.1:5173/', '1440,900'),
    ('mobile_home', 'http://127.0.0.1:5173/', '375,812'),
    ('desktop_login', 'http://127.0.0.1:5173/login', '1440,900'),
]

print("\n=== CAPTURING SCREENSHOTS ===")
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
