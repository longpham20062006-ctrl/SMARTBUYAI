from PIL import Image

im = Image.open('public/images/branding/smartbuy-ai-logo-original.png.png')
w, h = im.size
print(f"Image size: {w}x{h}, mode: {im.mode}")

# Let's inspect a grid of points (e.g. 10x10)
for y in range(0, h, 100):
    row_str = f"y={y:3d}: "
    for x in range(0, w, 140):
        r, g, b = im.getpixel((x, y))[:3]
        row_str += f"({r:2x}{g:2x}{b:2x}) "
    print(row_str)
