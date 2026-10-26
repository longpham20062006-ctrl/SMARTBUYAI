import subprocess
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
os.makedirs('scripts/screenshots', exist_ok=True)

print("=== 1. DUMPING HOMEPAGE DOM VIA CHROME HEADLESS ===")
cmd = [
    chrome_path,
    '--headless=new',
    '--virtual-time-budget=4000',
    '--dump-dom',
    'http://127.0.0.1:5173/'
]
res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore')
dom = res.stdout

print(f"Total DOM Length: {len(dom)} characters")

# Check 4 images
img1 = '0fb1b05f-e815-4159-8fe5-abe2c079b9e1.png'
img2 = '3b35766f-f734-4c5a-9990-3223433700dd.png'
img3 = '421e2c20-a146-443d-b809-4ab18442b461.png'
img4 = '68818615-3bdd-4a63-bf3f-cc3bb5bde4aa.png'

print("\n=== 2. VERIFYING 4 IMAGES IN DOM ===")
for i, (name, filename) in enumerate([
    ('ẢNH 1 (Hero Banner)', img1),
    ('ẢNH 2 (Men Streetwear)', img2),
    ('ẢNH 3 (Women Collection)', img3),
    ('ẢNH 4 (Fashion Lookbook)', img4)
], 1):
    count = dom.count(filename)
    pos = dom.find(filename)
    print(f"{name}: count = {count} | pos in DOM = {pos}")

# Check Section Order
print("\n=== 3. VERIFYING SECTION ORDER IN DOM ===")
pos_img1 = dom.find(img1)
pos_usp = dom.find('AI Hỗ Trợ Phối Đồ')
pos_cat = dom.find('Khám phá danh mục thời trang')
pos_trending = dom.find('SẢN PHẨM NỔI BẬT')
pos_img2 = dom.find(img2)
pos_new_arrivals = dom.find('SẢN PHẨM MỚI VỀ')
pos_img3 = dom.find(img3)
pos_try_on = dom.find('THỬ ĐỒ TRƯỚC KHI MUA')
pos_img4 = dom.find(img4)
pos_stylist = dom.find('KHÔNG BIẾT HÔM NAY MẶC GÌ?')
pos_journal = dom.find('Tin tức & Xu hướng thời trang')

sections = [
    ('Hero Banner (ẢNH 1)', pos_img1),
    ('USP Bar', pos_usp),
    ('Shop by Category', pos_cat),
    ('Trending Now', pos_trending),
    ("Men's Streetwear (ẢNH 2)", pos_img2),
    ('New Arrivals', pos_new_arrivals),
    ("Women's Collection (ẢNH 3)", pos_img3),
    ('AI Virtual Try-On', pos_try_on),
    ('Fashion Lookbook (ẢNH 4)', pos_img4),
    ('AI Stylist', pos_stylist),
    ('Fashion Journal', pos_journal),
]

is_ordered = True
prev_pos = -1
for name, pos in sections:
    status = "OK" if pos > prev_pos else "WRONG ORDER"
    if pos <= prev_pos:
        is_ordered = False
    print(f"  Pos {pos:6d} - {name} [{status}]")
    prev_pos = pos

print(f"Overall Section Order is Strictly Correct: {is_ordered}")

print("\n=== 4. VERIFYING ZERO PRICES ON HOMEPAGE ===")
home_prices = re.findall(r'\d{2,3}\.\d{3}₫', dom)
print(f"Price count with ₫ on HomePage: {len(home_prices)} {home_prices}")

print("\n=== 5. CAPTURING VISUAL SCREENSHOTS ===")
# Desktop 1440
cmd_desk = [
    chrome_path,
    '--headless=new',
    '--window-size=1440,2400',
    '--screenshot=scripts/screenshots/home_redesign_4_images_1440.png',
    'http://127.0.0.1:5173/'
]
subprocess.run(cmd_desk, capture_output=True)
print("Desktop screenshot captured: scripts/screenshots/home_redesign_4_images_1440.png")

# Mobile 375
cmd_mob = [
    chrome_path,
    '--headless=new',
    '--window-size=375,2000',
    '--screenshot=scripts/screenshots/home_redesign_4_images_375.png',
    'http://127.0.0.1:5173/'
]
subprocess.run(cmd_mob, capture_output=True)
print("Mobile screenshot captured: scripts/screenshots/home_redesign_4_images_375.png")

print("\n=== COMPLETED VERIFICATION ===")
