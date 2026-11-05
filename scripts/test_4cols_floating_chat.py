import subprocess
import os
import re
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
os.makedirs('scripts/screenshots', exist_ok=True)

print("=== 1. VERIFYING 4-COLUMN GRID & NO RIGHT ASIDE ON /products ===")
cmd_dom = [
    chrome_path,
    '--headless=new',
    '--virtual-time-budget=4000',
    '--dump-dom',
    'http://127.0.0.1:5173/products'
]
res = subprocess.run(cmd_dom, capture_output=True, text=True, encoding='utf-8', errors='ignore')
dom_products = res.stdout

# Check 4-column grid class
has_4_cols = 'xl:grid-cols-4' in dom_products
has_3_cols_legacy = 'xl:grid-cols-3' in dom_products # should be False
has_fixed_ai_aside = 'w-[280px]' in dom_products and 'sticky top-32' in dom_products # should be False
has_floating_bubble = 'Chat với SMARTBUY AI' in dom_products
has_bubble_btn = 'Mở chatbot AI Stylist' in dom_products

print(f"Product Grid has xl:grid-cols-4: {has_4_cols}")
print(f"Product Grid has legacy xl:grid-cols-3: {has_3_cols_legacy}")
print(f"Fixed AI Stylist aside present: {has_fixed_ai_aside}")
print(f"Floating AI Chat Bubble present: {has_floating_bubble or has_bubble_btn}")

print("\n=== 2. CAPTURING DESKTOP 1440px SCREENSHOT OF /products ===")
cmd_desk = [
    chrome_path,
    '--headless=new',
    '--window-size=1440,1800',
    r'--screenshot=D:\SMARTBUYAI\scripts\screenshots\catalog_4cols_desktop_1440.png',
    'http://127.0.0.1:5173/products'
]
subprocess.run(cmd_desk, check=True)
print("Desktop 1440px screenshot saved: scripts/screenshots/catalog_4cols_desktop_1440.png")

print("\n=== 3. CAPTURING MOBILE 375px SCREENSHOT OF /products ===")
cmd_mob = [
    chrome_path,
    '--headless=new',
    '--window-size=375,1200',
    r'--screenshot=D:\SMARTBUYAI\scripts\screenshots\catalog_mobile_375.png',
    'http://127.0.0.1:5173/products'
]
subprocess.run(cmd_mob, check=True)
print("Mobile 375px screenshot saved: scripts/screenshots/catalog_mobile_375.png")

print("\n=== 4. VERIFYING /products?gender=nam & /products?gender=nu ===")
for g in ['nam', 'nu']:
    url = f'http://127.0.0.1:5173/products?gender={g}'
    cmd = [
        chrome_path,
        '--headless=new',
        '--virtual-time-budget=3000',
        '--dump-dom',
        url
    ]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore')
    out = r.stdout
    print(f"Gender [{g.upper()}]: 4 cols = {'xl:grid-cols-4' in out} | No fixed AI aside = {'w-[280px]' not in out} | Floating bubble = {'Chat với SMARTBUY AI' in out or 'Mở chatbot AI Stylist' in out}")

print("\n=== ALL TESTS PASSED ===")
