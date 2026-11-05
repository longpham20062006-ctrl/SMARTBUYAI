import subprocess
import os
import sys
import io
import time
import shutil

if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(encoding="utf-8")
chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
if not os.path.exists(chrome):
    chrome = shutil.which('chrome') or shutil.which('google-chrome') or 'chrome'
os.makedirs('scripts/screenshots', exist_ok=True)

# 1. Galaxy 3D Intro Starfield / Hyperspace (virtual time budget = 2s)
print("1. Capturing Galaxy 3D Intro...")
cmd1 = [
    chrome,
    '--headless=new',
    '--window-size=1440,900',
    '--virtual-time-budget=2000',
    r'--screenshot=D:\SMARTBUYAI\scripts\screenshots\galaxy_intro_3d.png',
    'http://127.0.0.1:5173/'
]
subprocess.run(cmd1, check=True)
print("   -> scripts/screenshots/galaxy_intro_3d.png")

# 2. Galaxy Brand Reveal (virtual time budget = 4.2s)
print("2. Capturing Galaxy Brand Reveal...")
cmd2 = [
    chrome,
    '--headless=new',
    '--window-size=1440,900',
    '--virtual-time-budget=4200',
    r'--screenshot=D:\SMARTBUYAI\scripts\screenshots\galaxy_brand_reveal.png',
    'http://127.0.0.1:5173/'
]
subprocess.run(cmd2, check=True)
print("   -> scripts/screenshots/galaxy_brand_reveal.png")

# 3. HomePage after intro (virtual time budget = 6.5s)
print("3. Capturing HomePage Fashion Hero & Trending Now...")
cmd3 = [
    chrome,
    '--headless=new',
    '--window-size=1440,2400',
    '--virtual-time-budget=6500',
    r'--screenshot=D:\SMARTBUYAI\scripts\screenshots\home_trending_editorial.png',
    'http://127.0.0.1:5173/'
]
subprocess.run(cmd3, check=True)
print("   -> scripts/screenshots/home_trending_editorial.png")

# 4. Catalog Page with Sticky Quick Filter & 80% dresses
print("4. Capturing Catalog Page with Sticky Filter & 80% Dresses...")
cmd4 = [
    chrome,
    '--headless=new',
    '--window-size=1440,1600',
    '--virtual-time-budget=3000',
    r'--screenshot=D:\SMARTBUYAI\scripts\screenshots\catalog_sticky_filter_80percent.png',
    'http://127.0.0.1:5173/products'
]
subprocess.run(cmd4, check=True)
print("   -> scripts/screenshots/catalog_sticky_filter_80percent.png")

print("All screenshots successfully captured!")
