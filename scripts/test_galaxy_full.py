import subprocess
import os
import sys
import io
import time

if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(encoding="utf-8")

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
os.makedirs(r'D:\SMARTBUYAI\scripts\screenshots', exist_ok=True)

test_cases = [
    ("galaxy_phase1_starfield.png", 500),
    ("galaxy_phase2_hyperspace.png", 2000),
    ("galaxy_phase3_explosion.png", 3200),
    ("galaxy_phase4_logo.png", 4200),
    ("galaxy_phase5_hero_ambient.png", 7000),
]

for filename, budget in test_cases:
    out_path = os.path.join(r'D:\SMARTBUYAI\scripts\screenshots', filename)
    cmd = [
        chrome_path,
        '--headless=new',
        '--enable-webgl',
        '--use-gl=angle',
        '--window-size=1440,900',
        f'--virtual-time-budget={budget}',
        f'--screenshot={out_path}',
        'http://127.0.0.1:5173/?debugGalaxy=1'
    ]
    try:
        subprocess.run(cmd, check=True, timeout=20)
        size = os.path.getsize(out_path)
        print(f"Captured {filename} ({budget}ms) -> {size} bytes")
    except Exception as e:
        print(f"Failed to capture {filename}: {e}")
