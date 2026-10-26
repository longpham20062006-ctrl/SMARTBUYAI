from PIL import Image

im = Image.open('public/images/branding/smartbuy-ai-logo-original.png.png')

# Let's inspect vertical projection between X=203 and 1207
# to find the gap between the icon on the left and the text
import collections

# Check cyan density across X columns
cyan_by_x = collections.defaultdict(int)
for y in range(116, 512):
    for x in range(203, 1208):
        r, g, b = im.getpixel((x, y))[:3]
        if b > 150 and g > 150 and r < 80:
            cyan_by_x[x] += 1

print("Cyan columns found. Range of icon cyan vs text cyan:")
left_cyan = [x for x in cyan_by_x if x < 600]
right_cyan = [x for x in cyan_by_x if x >= 600]
if left_cyan:
    print(f"Icon circuit cyan X range: {min(left_cyan)} to {max(left_cyan)}")
if right_cyan:
    print(f"Text 'AI' cyan X range: {min(right_cyan)} to {max(right_cyan)}")

# Now let's find the bounding box of the ICON ONLY (hanger + circuit + S)
# From X=203 to max(left_cyan) + margin
icon_right = max(left_cyan) + 40 if left_cyan else 500
# Crop icon mask
icon_mask_pixels = []
for y in range(116, 512):
    for x in range(203, icon_right):
        r, g, b = im.getpixel((x, y))[:3]
        is_cyan = (b > 100 and g > 100 and b > r + 40 and g > r + 40)
        is_deep_black = (r < 18 and g < 18 and b < 18)
        is_bright = (r > 60 or g > 60 or b > 60)
        is_colored = max(abs(r-g), abs(g-b), abs(b-r)) > 15
        if is_cyan or is_deep_black or is_bright or is_colored:
            icon_mask_pixels.append((x, y))

if icon_mask_pixels:
    ixs = [p[0] for p in icon_mask_pixels]
    iys = [p[1] for p in icon_mask_pixels]
    print(f"Exact ICON bbox: X=[{min(ixs)}, {max(ixs)}], Y=[{min(iys)}, {max(iys)}]")
    print(f"Icon size: width={max(ixs)-min(ixs)}, height={max(iys)-min(iys)}")
