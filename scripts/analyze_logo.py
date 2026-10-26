from PIL import Image

path = 'public/images/branding/smartbuy-ai-logo-original.png.png'
im = Image.open(path)
w, h = im.size
print(f"Total canvas: {w}x{h}")

# Background sampling
bg_colors = [im.getpixel((0, 0)), im.getpixel((w-1, 0)), im.getpixel((0, h-1)), im.getpixel((w-1, h-1))]
print("Corner bg colors:", bg_colors)
bg = bg_colors[0]

# Find bounding box of content (where color deviates from bg)
min_x, max_x = w, 0
min_y, max_y = h, 0

cyan_pixels = []

for y in range(h):
    for x in range(w):
        p = im.getpixel((x, y))
        diff = abs(p[0] - bg[0]) + abs(p[1] - bg[1]) + abs(p[2] - bg[2])
        if diff > 30:
            if x < min_x: min_x = x
            if x > max_x: max_x = x
            if y < min_y: min_y = y
            if y > max_y: max_y = y
        # Check cyan
        if p[1] > 180 and p[2] > 180 and p[0] < 80:
            cyan_pixels.append((x, y, p))

print(f"Content Bounding Box: left={min_x}, top={min_y}, right={max_x}, bottom={max_y}")
print(f"Content width: {max_x - min_x}, height: {max_y - min_y}, aspect ratio: {(max_x - min_x)/(max_y - min_y):.2f}")

if cyan_pixels:
    first_c = cyan_pixels[len(cyan_pixels)//2][2]
    print(f"Cyan sample RGB: {first_c}, Hex: #{first_c[0]:02x}{first_c[1]:02x}{first_c[2]:02x}")
    cyan_xs = [p[0] for p in cyan_pixels]
    cyan_ys = [p[1] for p in cyan_pixels]
    print(f"Cyan range: x=[{min(cyan_xs)}, {max(cyan_xs)}], y=[{min(cyan_ys)}, {max(cyan_ys)}]")
