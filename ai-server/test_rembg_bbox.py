import sys
from PIL import Image
from pathlib import Path
import rembg
import numpy as np

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

path_A = Path("ai-server/test_garments/shirt_A.jpg")
path_B = Path("ai-server/test_garments/shirt_B.jpg")

img_A = Image.open(path_A).convert("RGB")
img_B = Image.open(path_B).convert("RGB")

nobg_A = rembg.remove(img_A)
nobg_B = rembg.remove(img_B)

nobg_A.save("ai-server/test_garments/nobg_A.png")
nobg_B.save("ai-server/test_garments/nobg_B.png")

alpha_A = nobg_A.split()[3]
bbox_A = alpha_A.getbbox()
print("Alpha bbox A:", bbox_A, "Original size:", nobg_A.size)

alpha_B = nobg_B.split()[3]
bbox_B = alpha_B.getbbox()
print("Alpha bbox B:", bbox_B, "Original size:", nobg_B.size)
