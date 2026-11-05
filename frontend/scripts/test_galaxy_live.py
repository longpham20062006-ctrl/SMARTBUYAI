import subprocess
import os
import sys
import io
import time
import json
import urllib.request

if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(encoding="utf-8")

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
os.makedirs(r'D:\SMARTBUYAI\scripts\screenshots', exist_ok=True)

print("--- 1. CAPTURING INTRO (1.5s - Hyperspace / Starfield) ---")
cmd_intro1 = [
    chrome_path,
    '--headless=new',
    '--enable-webgl',
    '--use-gl=angle',
    '--window-size=1440,900',
    '--virtual-time-budget=1500',
    r'--screenshot=D:\SMARTBUYAI\scripts\screenshots\galaxy_intro_phase1.png',
    'http://127.0.0.1:5173/?debugGalaxy=1'
]
subprocess.run(cmd_intro1, check=True, timeout=20)
print("Saved: galaxy_intro_phase1.png")

print("--- 2. CAPTURING GALAXY EXPLOSION & LOGO (3.8s) ---")
cmd_intro2 = [
    chrome_path,
    '--headless=new',
    '--enable-webgl',
    '--use-gl=angle',
    '--window-size=1440,900',
    '--virtual-time-budget=3800',
    r'--screenshot=D:\SMARTBUYAI\scripts\screenshots\galaxy_intro_explosion_logo.png',
    'http://127.0.0.1:5173/?debugGalaxy=1'
]
subprocess.run(cmd_intro2, check=True, timeout=20)
print("Saved: galaxy_intro_explosion_logo.png")

print("--- 3. CAPTURING FASHION HERO WITH CONTINUOUS AMBIENT GALAXY (6.5s) ---")
cmd_hero = [
    chrome_path,
    '--headless=new',
    '--enable-webgl',
    '--use-gl=angle',
    '--window-size=1440,1100',
    '--virtual-time-budget=6500',
    r'--screenshot=D:\SMARTBUYAI\scripts\screenshots\galaxy_ambient_hero.png',
    'http://127.0.0.1:5173/?debugGalaxy=1'
]
subprocess.run(cmd_hero, check=True, timeout=20)
print("Saved: galaxy_ambient_hero.png")

for fname in ['galaxy_intro_phase1.png', 'galaxy_intro_explosion_logo.png', 'galaxy_ambient_hero.png']:
    fpath = os.path.join(r'D:\SMARTBUYAI\scripts\screenshots', fname)
    if os.path.exists(fpath):
        size = os.path.getsize(fpath)
        print(f"File: {fname} Size: {size} bytes")
    else:
        print(f"File NOT found: {fname}")
