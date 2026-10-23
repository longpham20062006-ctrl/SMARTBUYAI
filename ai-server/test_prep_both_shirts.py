import sys
from PIL import Image
from pathlib import Path
import rembg
from CatVTON.utils import resize_and_padding

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

target_size = (768, 1024)

for tag, path in [("A", "ai-server/test_garments/shirt_A.jpg"), ("B", "ai-server/test_garments/shirt_B.jpg")]:
    raw = Image.open(path).convert("RGB")
    nobg = rembg.remove(raw)
    
    alpha = nobg.split()[3]
    bbox = alpha.getbbox()
    if bbox:
        cropped = nobg.crop(bbox)
        gw, gh = cropped.size
        pad_w = max(int(gw * 0.06), 16)
        pad_h = max(int(gh * 0.06), 16)
        padded = Image.new("RGBA", (gw + pad_w * 2, gh + pad_h * 2), (255, 255, 255, 0))
        padded.paste(cropped, (pad_w, pad_h))
        cloth_canvas = Image.new("RGB", padded.size, (255, 255, 255))
        cloth_canvas.paste(padded, (0, 0), padded.split()[3])
    else:
        cloth_canvas = Image.new("RGB", nobg.size, (255, 255, 255))
        cloth_canvas.paste(nobg, (0, 0), nobg.split()[3])
        
    cloth_img = resize_and_padding(cloth_canvas, target_size)
    cloth_img.save(f"ai-server/test_garments/cloth_prepared_{tag}.png")
    print(f"Garment {tag} prepared: {cloth_img.size}")
