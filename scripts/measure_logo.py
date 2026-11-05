from PIL import Image

src_path = 'public/images/branding/smartbuy-ai-logo-original.png.png'
im = Image.open(src_path)
w, h = im.size

# Let's find precise content bounds
# In the image, background is dark charcoal (R~25-35, G~25-35, B~25-35)
# Hanger icon is dark gray/black with cyan circuit chip
# SMARTBUY text is dark gray/black with lighting
# AI text is vibrant cyan

# Let's inspect horizontal profile
# We will check vertical columns and horizontal rows
row_diffs = []
for y in range(h):
    row = [im.getpixel((x, y)) for x in range(w)]
    # diff from first pixel
    bg0 = row[0]
    d = sum(abs(p[0]-bg0[0]) + abs(p[1]-bg0[1]) + abs(p[2]-bg0[2]) for p in row)
    row_diffs.append(d)

col_diffs = []
for x in range(w):
    col = [im.getpixel((x, y)) for y in range(h)]
    bg0 = col[0]
    d = sum(abs(p[0]-bg0[0]) + abs(p[1]-bg0[1]) + abs(p[2]-bg0[2]) for p in col)
    col_diffs.append(d)

min_y = next(i for i, d in enumerate(row_diffs) if d > 2000)
max_y = next(h - 1 - i for i, d in enumerate(reversed(row_diffs)) if d > 2000)

min_x = next(i for i, d in enumerate(col_diffs) if d > 1500)
max_x = next(w - 1 - i for i, d in enumerate(reversed(col_diffs)) if d > 1500)

print(f"Precise logo bounding box: Left={min_x}, Top={min_y}, Right={max_x}, Bottom={max_y}")
print(f"Crop width={max_x - min_x}, height={max_y - min_y}, aspect ratio={(max_x - min_x)/(max_y - min_y):.2f}")

# Now let's find the split between the Icon (hanger) and the text (SMARTBUY)
# In the image, the hanger is on the left, SMARTBUY starts after the hanger
# Let's find where the gap between hanger and SMARTBUY is
# Scan x from min_x + 150 to min_x + 400
gap_x = 0
min_col_activity = 99999999
for x in range(min_x + 200, min_x + 360):
    col = [im.getpixel((x, y)) for y in range(min_y, max_y + 1)]
    # calculate difference from local background
    activity = sum(abs(p[0]-30) + abs(p[1]-30) + abs(p[2]-30) for p in col)
    if activity < min_col_activity:
        min_col_activity = activity
        gap_x = x

print(f"Estimated gap between icon and text: x={gap_x}")
print(f"Icon box: [{min_x}, {min_y}] to [{gap_x}, {max_y}] (w={gap_x - min_x}, h={max_y - min_y})")
print(f"Text box: [{gap_x}, {min_y}] to [{max_x}, {max_y}] (w={max_x - gap_x}, h={max_y - min_y})")
