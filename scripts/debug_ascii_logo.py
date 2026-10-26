from PIL import Image

im = Image.open('public/images/branding/smartbuy-ai-logo-original.png.png')

# Total bounding box is approx: X=[190, 1220], Y=[100, 520]
# Width = 1030, Height = 420
# Let's save a crop of the entire logo with 30px padding:
total_crop = im.crop((180, 95, 1230, 530))
total_crop.save('public/images/branding/debug_total_crop.png')
print("Saved debug_total_crop.png:", total_crop.size)

# Let's also create downscaled ascii representation to understand the visual layout:
small = total_crop.resize((100, 40)).convert('L')
chars = " .:-=+*#%@"
ascii_art = []
for y in range(40):
    line = ""
    for x in range(100):
        val = small.getpixel((x, y))
        # background is ~30-40, let's map contrast
        line += chars[min(len(chars)-1, max(0, int((val - 25) / 15)))]
    ascii_art.append(line)

print("\n".join(ascii_art))
