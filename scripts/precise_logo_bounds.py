from PIL import Image

im = Image.open('public/images/branding/smartbuy-ai-logo-original.png.png')

# Let's inspect active pixels in X=[180, 500], Y=[100, 300]
top_hook_pixels = []
for y in range(100, 300):
    for x in range(180, 500):
        r, g, b = im.getpixel((x, y))[:3]
        is_cyan = (b > 100 and g > 100 and b > r + 40 and g > r + 40)
        is_deep_black = (r < 18 and g < 18 and b < 18)
        is_bright = (r > 60 or g > 60 or b > 60)
        is_colored = max(abs(r-g), abs(g-b), abs(b-r)) > 15
        if is_cyan or is_deep_black or is_bright or is_colored:
            top_hook_pixels.append((x, y))

if top_hook_pixels:
    xs = [p[0] for p in top_hook_pixels]
    ys = [p[1] for p in top_hook_pixels]
    print(f"Top section pixels found: X=[{min(xs)}, {max(xs)}], Y=[{min(ys)}, {max(ys)}]")
else:
    print("No pixels in top section found with criteria")

# What about the entire image? Where are the active pixels?
all_active = []
for y in range(0, 768):
    for x in range(0, 1408):
        r, g, b = im.getpixel((x, y))[:3]
        is_cyan = (b > 100 and g > 100 and b > r + 40 and g > r + 40)
        is_deep_black = (r < 18 and g < 18 and b < 18)
        is_bright = (r > 60 or g > 60 or b > 60)
        is_colored = max(abs(r-g), abs(g-b), abs(b-r)) > 15
        if is_cyan or is_deep_black or is_bright or is_colored:
            all_active.append((x, y))

xs = [p[0] for p in all_active]
ys = [p[1] for p in all_active]
print(f"Total active logo bounding box: X=[{min(xs)}, {max(xs)}], Y=[{min(ys)}, {max(ys)}]")

# Let's find where the hook of the hanger is:
hook_pixels = [p for p in all_active if p[1] < 262]
if hook_pixels:
    h_xs = [p[0] for p in hook_pixels]
    h_ys = [p[1] for p in hook_pixels]
    print(f"Hook bounds: X=[{min(h_xs)}, {max(h_xs)}], Y=[{min(h_ys)}, {max(h_ys)}]")

# Text bounds (X > 450):
text_pixels = [p for p in all_active if p[0] > 450]
if text_pixels:
    t_xs = [p[0] for p in text_pixels]
    t_ys = [p[1] for p in text_pixels]
    print(f"Text bounds: X=[{min(t_xs)}, {max(t_xs)}], Y=[{min(t_ys)}, {max(t_ys)}]")
