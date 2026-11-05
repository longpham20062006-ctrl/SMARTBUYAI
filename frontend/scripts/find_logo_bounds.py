from PIL import Image

im = Image.open('public/images/branding/smartbuy-ai-logo-original.png.png')
w, h = im.size

# Let's inspect each pixel.
# What makes a pixel part of the logo?
# 1. Cyan color (high saturation / green & blue much higher than red)
# 2. Very dark (letters SMARTBUY are near black, e.g. R,G,B < 15, while background is > 26)
# 3. Bright highlights/metallic/circuit (any channel > 65 or diff between channels)
# 4. Or local gradient > 15

# Let's create a binary mask of active logo pixels
mask = Image.new('L', (w, h), 0)

for y in range(h):
    for x in range(w):
        r, g, b = im.getpixel((x, y))[:3]
        brightness = (r + g + b) // 3
        
        # Cyan detection (AI letters and circuit highlights)
        is_cyan = (b > 100 and g > 100 and b > r + 40 and g > r + 40)
        # Deep black letters (SMARTBUY letters)
        is_deep_black = (r < 18 and g < 18 and b < 18)
        # Metallic / white highlights on hanger or text bevels
        is_bright = (r > 60 or g > 60 or b > 60)
        # Color difference (non-neutral pixels)
        is_colored = max(abs(r-g), abs(g-b), abs(b-r)) > 15
        
        if is_cyan or is_deep_black or is_bright or is_colored:
            mask.putpixel((x, y), 255)

bbox = mask.getbbox()
print(f"Mask Bounding Box: {bbox}")
if bbox:
    min_x, min_y, max_x, max_y = bbox
    print(f"Logo dimensions: width={max_x - min_x}, height={max_y - min_y}, aspect={(max_x - min_x)/(max_y - min_y):.2f}")
    
# Let's also check where the cyan "AI" is located
cyan_coords = []
for y in range(h):
    for x in range(w):
        r, g, b = im.getpixel((x, y))[:3]
        if b > 150 and g > 150 and r < 80:
            cyan_coords.append((x, y))

if cyan_coords:
    xs = [c[0] for c in cyan_coords]
    ys = [c[1] for c in cyan_coords]
    print(f"Cyan 'AI' bounds: X=[{min(xs)}, {max(xs)}], Y=[{min(ys)}, {max(ys)}]")

# Let's save a preview mask to inspect
mask.save('scripts/logo_mask_debug.png')
print("Saved scripts/logo_mask_debug.png")
