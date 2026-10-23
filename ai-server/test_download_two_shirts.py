import sys
import requests
from PIL import Image
from pathlib import Path
import rembg
import numpy as np

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

url_A = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"
url_B = "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80"

Path("ai-server/test_garments").mkdir(parents=True, exist_ok=True)

resp_A = requests.get(url_A, timeout=15)
path_A = Path("ai-server/test_garments/shirt_A.jpg")
path_A.write_bytes(resp_A.content)
print(f"Shirt A saved ({path_A.stat().st_size} bytes)")

resp_B = requests.get(url_B, timeout=15)
path_B = Path("ai-server/test_garments/shirt_B.jpg")
path_B.write_bytes(resp_B.content)
print(f"Shirt B saved ({path_B.stat().st_size} bytes)")

# Check image sizes
img_A = Image.open(path_A)
img_B = Image.open(path_B)
print(f"Image A: {img_A.size}, mode: {img_A.mode}")
print(f"Image B: {img_B.size}, mode: {img_B.mode}")
