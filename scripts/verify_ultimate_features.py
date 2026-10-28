import subprocess
import os
import sys
import io
import shutil

if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(encoding="utf-8")

# Verify Node executable
node_path = shutil.which('node') or r'C:\Program Files\nodejs\node.exe'
if not os.path.exists(node_path) and not shutil.which('node'):
    print(f"Warning: node executable not found at {node_path}")

# Verify Chrome executable
chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
if not os.path.exists(chrome_path):
    chrome_path = shutil.which('chrome') or shutil.which('google-chrome') or ''

os.makedirs('scripts/screenshots', exist_ok=True)

print("==================================================")
print("1. VERIFYING ALL PRODUCTS 80% WOMEN DRESSES MIXING")
print("==================================================")

if os.path.exists(node_path):
    res = subprocess.run([node_path, 'scripts/test_80_percent.cjs'], capture_output=True, text=True, encoding='utf-8')
    print(res.stdout)
    if res.stderr:
        print("Stderr:", res.stderr)
else:
    print("Node not found, skipping node test.")

print("\n==================================================")
print("2. CAPTURING SCREENSHOTS (CHROME HEADLESS)")
print("==================================================")
if chrome_path and os.path.exists(chrome_path):
    # 2. Galaxy 3D Intro
    cmd_intro = [
        chrome_path,
        '--headless=new',
        '--enable-webgl',
        '--use-gl=angle',
        '--window-size=1440,900',
        '--virtual-time-budget=2000',
        r'--screenshot=D:\SMARTBUYAI\scripts\screenshots\galaxy_intro_3d.png',
        'http://127.0.0.1:5173/?intro=1'
    ]
    try:
        subprocess.run(cmd_intro, check=True, timeout=15)
        print("Saved: scripts/screenshots/galaxy_intro_3d.png")
    except Exception as e:
        print(f"Could not capture intro: {e}")

    # 3. HomePage Fashion Hero & Trending
    cmd_home = [
        chrome_path,
        '--headless=new',
        '--window-size=1440,2400',
        '--virtual-time-budget=4000',
        r'--screenshot=D:\SMARTBUYAI\scripts\screenshots\home_after_intro_trending.png',
        'http://127.0.0.1:5173/'
    ]
    try:
        subprocess.run(cmd_home, check=True, timeout=15)
        print("Saved: scripts/screenshots/home_after_intro_trending.png")
    except Exception as e:
        print(f"Could not capture home: {e}")

    # 4. Catalog Page with Sticky Filter
    cmd_catalog = [
        chrome_path,
        '--headless=new',
        '--window-size=1440,1600',
        '--virtual-time-budget=3000',
        r'--screenshot=D:\SMARTBUYAI\scripts\screenshots\catalog_sticky_filter.png',
        'http://127.0.0.1:5173/products'
    ]
    try:
        subprocess.run(cmd_catalog, check=True, timeout=15)
        print("Saved: scripts/screenshots/catalog_sticky_filter.png")
    except Exception as e:
        print(f"Could not capture catalog: {e}")
else:
    print("Chrome not found on host, skipping headless browser capture.")

print("\n=== ALL AUTOMATED CHECKS FINISHED ===")
