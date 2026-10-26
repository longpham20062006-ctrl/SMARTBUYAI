from PIL import Image

# Open original image
im = Image.open('public/images/branding/smartbuy-ai-logo-original.png.png')
w, h = im.size

# In debug_total_crop.png, we cropped (180, 95, 1230, 530).
# Let's inspect where the hanger hook, S, circuit, SMARTBUY and AI actually are in coordinates of `im`.

# Let's find the exact top of the hook:
# Hook is around X in [250, 400]
hook_points = []
for y in range(200, 600):
    for x in range(200, 400):
        r, g, b = im.getpixel((x, y))[:3]
        # The hook is dark black with edge highlight, or has contrast with bg
        # bg around here is ~ 45-55
        # Hook lines are dark black (10-25) or bright highlight (60-120)
        if (r < 25 and g < 25 and b < 25) or (r > 65 or g > 65 or b > 65):
            hook_points.append((x, y))

hy = [p[1] for p in hook_points]
hx = [p[0] for p in hook_points]
print(f"Hook bounds: X=[{min(hx)}, {max(hx)}], Y=[{min(hy)}, {max(hy)}]")

# Entire logo: let's scan y from min(hy) to 650, x from 180 to 1250:
logo_points = []
for y in range(min(hy) - 10, 650):
    for x in range(180, 1250):
        r, g, b = im.getpixel((x, y))[:3]
        is_cyan = (b > 120 and g > 120 and b > r + 30 and g > r + 30)
        is_black = (r < 25 and g < 25 and b < 25)
        is_bright = (r > 70 or g > 70 or b > 70)
        is_circuit = (b > 80 and g > 80 and b > r + 20)
        if is_cyan or is_black or is_bright or is_circuit:
            logo_points.append((x, y))

all_x = [p[0] for p in logo_points]
all_y = [p[1] for p in logo_points]

print(f"True tight bounding box of entire logo: X=[{min(all_x)}, {max(all_x)}], Y=[{min(all_y)}, {max(all_y)}]")
top = min(all_y)
bottom = max(all_y)
left = min(all_x)
right = max(all_x)
print(f"Width={right-left}, Height={bottom-top}, Aspect Ratio={(right-left)/(bottom-top):.2f}")

# Icon only bounds: icon is on the left, from left to circuit end
# Circuit ends around X=450-470
icon_points = [p for p in logo_points if p[0] <= 470]
ix = [p[0] for p in icon_points]
iy = [p[1] for p in icon_points]
print(f"True ICON bounds: X=[{min(ix)}, {max(ix)}], Y=[{min(iy)}, {max(iy)}]")
print(f"Icon Width={max(ix)-min(ix)}, Icon Height={max(iy)-min(iy)}, Aspect={(max(ix)-min(ix))/(max(iy)-min(iy)):.2f}")
