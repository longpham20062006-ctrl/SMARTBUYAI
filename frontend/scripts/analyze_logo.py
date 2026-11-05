import os
import sys
import io
from typing import Tuple, Optional, List
from PIL import Image

if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(encoding="utf-8")

path = os.path.join('public', 'images', 'branding', 'smartbuy-ai-logo-original.png.png')
if not os.path.exists(path):
    path = os.path.join('public', 'images', 'branding', 'smartbuy-ai-logo-original.png')

im = Image.open(path).convert('RGB')
w, h = im.size
print(f"Total canvas: {w}x{h}")

def get_rgb_tuple(image: Image.Image, xy: Tuple[int, int]) -> Optional[Tuple[int, int, int]]:
    """
    Safely retrieves the RGB values as a 3-tuple (r, g, b) of ints.
    Handles None, single float/int (grayscale), and tuple/list formats.
    """
    raw_pixel = image.getpixel(xy)
    if raw_pixel is None:
        return None
    if isinstance(raw_pixel, int):
        return (raw_pixel, raw_pixel, raw_pixel)
    if isinstance(raw_pixel, float):
        val = int(raw_pixel)
        return (val, val, val)
    if isinstance(raw_pixel, (tuple, list)) and len(raw_pixel) >= 3:
        r, g, b = raw_pixel[0], raw_pixel[1], raw_pixel[2]
        return (r if isinstance(r, int) else int(r),
                g if isinstance(g, int) else int(g),
                b if isinstance(b, int) else int(b))
    return None

# Background sampling
corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
bg_colors: List[Tuple[int, int, int]] = []
for corner in corners:
    c = get_rgb_tuple(im, corner)
    if c is not None:
        bg_colors.append(c)

print("Corner bg colors:", bg_colors)
bg = bg_colors[0] if bg_colors else (0, 0, 0)

# Find bounding box of content (where color deviates from bg)
min_x, max_x = w, 0
min_y, max_y = h, 0

cyan_pixels: List[Tuple[int, int, Tuple[int, int, int]]] = []

for y in range(h):
    for x in range(w):
        p = get_rgb_tuple(im, (x, y))
        if p is None:
            continue
        diff = abs(p[0] - bg[0]) + abs(p[1] - bg[1]) + abs(p[2] - bg[2])
        if diff > 30:
            if x < min_x:
                min_x = x
            if x > max_x:
                max_x = x
            if y < min_y:
                min_y = y
            if y > max_y:
                max_y = y
        # Check cyan
        if p[1] > 180 and p[2] > 180 and p[0] < 80:
            cyan_pixels.append((x, y, p))

if max_x >= min_x and max_y >= min_y:
    content_w = max_x - min_x
    content_h = max_y - min_y
    aspect = (content_w / content_h) if content_h > 0 else 0.0
    print(f"Content Bounding Box: left={min_x}, top={min_y}, right={max_x}, bottom={max_y}")
    print(f"Content width: {content_w}, height: {content_h}, aspect ratio: {aspect:.2f}")

if cyan_pixels:
    first_c = cyan_pixels[len(cyan_pixels) // 2][2]
    print(f"Cyan sample RGB: {first_c}, Hex: #{first_c[0]:02x}{first_c[1]:02x}{first_c[2]:02x}")
    cyan_xs = [pt[0] for pt in cyan_pixels]
    cyan_ys = [pt[1] for pt in cyan_pixels]
    print(f"Cyan range: x=[{min(cyan_xs)}, {max(cyan_xs)}], y=[{min(cyan_ys)}, {max(cyan_ys)}]")
