import subprocess
import os
import sys
import io

if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(encoding="utf-8")
chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
out_dir = r'D:\SMARTBUYAI\scripts\screenshots\sticky_test'
os.makedirs(out_dir, exist_ok=True)

test_cases = [
    ('nam_0px', 'http://127.0.0.1:5173/products?gender=nam&scrollTo=0'),
    ('nam_300px', 'http://127.0.0.1:5173/products?gender=nam&scrollTo=300'),
    ('nam_800px', 'http://127.0.0.1:5173/products?gender=nam&scrollTo=800'),
    ('nam_1500px', 'http://127.0.0.1:5173/products?gender=nam&scrollTo=1500'),
    ('nu_800px', 'http://127.0.0.1:5173/products?gender=nu&scrollTo=800'),
    ('all_800px', 'http://127.0.0.1:5173/products?scrollTo=800'),
]

print("=== CAPTURING STICKY QUICK FILTER SCROLL TESTS ===")
for name, url in test_cases:
    out_file = os.path.join(out_dir, f'{name}.png')
    cmd = [
        chrome,
        '--headless=new',
        '--window-size=1440,900',
        '--virtual-time-budget=2000',
        f'--screenshot={out_file}',
        url
    ]
    print(f"Testing {name} -> {url}")
    subprocess.run(cmd, check=True)
    print(f"  -> Saved {out_file}")

print("=== ALL STICKY SCROLL TESTS COMPLETE ===")
