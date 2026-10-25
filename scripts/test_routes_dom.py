import subprocess
import os

routes = [
    ('home', 'http://127.0.0.1:5173/'),
    ('products', 'http://127.0.0.1:5173/products'),
    ('men', 'http://127.0.0.1:5173/products?gender=nam'),
    ('women', 'http://127.0.0.1:5173/products?gender=nu'),
    ('tryon', 'http://127.0.0.1:5173/virtual-try-on'),
    ('cart', 'http://127.0.0.1:5173/cart')
]

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

for name, url in routes:
    cmd = [
        chrome_path,
        '--headless=new',
        '--virtual-time-budget=3500',
        '--dump-dom',
        url
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore')
    html = res.stdout
    has_root_content = '<header' in html or 'SMARTBUY AI' in html
    has_error_overlay = '<div id="runtime-error-overlay"' in html
    print(f"[{name.upper()}] URL: {url} -> HTML: {len(html)} chars | Rendered: {has_root_content} | Errors: {has_error_overlay}")
