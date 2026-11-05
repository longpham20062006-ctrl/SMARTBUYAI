from PIL import Image, ImageFilter

src_path = 'public/images/branding/smartbuy-ai-logo-original.png.png'
im = Image.open(src_path).convert('RGBA')
w, h = im.size

# 1. Canonical original (uncompressed, untouched)
im_orig = Image.open(src_path)
im_orig.save('public/images/branding/smartbuy-ai-logo-original.png', format='PNG')
print("1. Saved pristine original: public/images/branding/smartbuy-ai-logo-original.png")

# 2. Dark cropped logo
# Entire logo content: X in [203, 1204], Y in [281, 486]
pad_x = 24
pad_y = 16
crop_box = (max(0, 203 - pad_x), max(0, 281 - pad_y), min(w, 1204 + pad_x), min(h, 486 + pad_y))
cropped_dark = im.crop(crop_box)
cropped_dark.save('public/images/branding/smartbuy-ai-logo-dark.png', format='PNG')
cropped_dark.save('public/images/branding/smartbuy-ai-logo-dark.webp', format='WEBP', quality=95)
print(f"2. Saved dark logo: {cropped_dark.size}")

# 3. Icon only crop (hanger + hook + S + circuit microchip)
# Content strictly X in [203, 444], Y in [281, 486]
icon_box = (203, 281, 444, 486)
icon_content = im.crop(icon_box)
iw, ih = icon_content.size # 241 x 205
# Create square icon with balanced padding on charcoal (#1E1F1E)
target_sq = max(iw, ih) + 32 # ~ 273x273
icon_square_dark = Image.new('RGBA', (target_sq, target_sq), (30, 31, 30, 255))
ox = (target_sq - iw) // 2
oy = (target_sq - ih) // 2
icon_square_dark.paste(icon_content, (ox, oy))

icon_square_dark.save('public/images/branding/smartbuy-ai-icon.png', format='PNG')
icon_square_dark.resize((512, 512), Image.Resampling.LANCZOS).save('public/images/branding/smartbuy-ai-icon-512.png')
icon_square_dark.resize((192, 192), Image.Resampling.LANCZOS).save('public/images/branding/smartbuy-ai-icon-192.png')
icon_square_dark.resize((180, 180), Image.Resampling.LANCZOS).save('public/apple-touch-icon.png')
icon_square_dark.resize((32, 32), Image.Resampling.LANCZOS).save('public/images/branding/smartbuy-ai-icon-32.png')
icon_square_dark.resize((16, 16), Image.Resampling.LANCZOS).save('public/images/branding/smartbuy-ai-icon-16.png')

# Save multi-size favicon.ico
icon_square_dark.save('public/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
print("3. Saved icon variants and public/favicon.ico")

# 4. Clean Light Logo (for light backgrounds / white header)
cw, ch = cropped_dark.size
light_logo = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))

for y in range(ch):
    for x in range(cw):
        r, g, b, a = cropped_dark.getpixel((x, y))
        br = (r + g + b) / 3.0
        
        # Check cyan (AI text and circuit chip)
        is_cyan = (b > 100 and g > 100 and b > r + 30 and g > r + 30)
        
        if is_cyan:
            # Preserve bright vibrant cyan
            light_logo.putpixel((x, y), (r, g, b, 255))
        elif br < 16:
            # Deep black letter stroke / hanger
            light_logo.putpixel((x, y), (18, 18, 20, 255))
        elif br < 22:
            # Anti-aliasing edge
            alpha = int((22 - br) / 6.0 * 255)
            light_logo.putpixel((x, y), (18, 18, 20, alpha))
        elif br > 75:
            # Highlight on hanger
            alpha = min(255, int((br - 75) * 4))
            light_logo.putpixel((x, y), (r, g, b, alpha))
        else:
            light_logo.putpixel((x, y), (0, 0, 0, 0))

light_logo.save('public/images/branding/smartbuy-ai-logo-light.png', format='PNG')
light_logo.save('public/images/branding/smartbuy-ai-logo-light.webp', format='WEBP', quality=95)
print("4. Saved clean light logo: public/images/branding/smartbuy-ai-logo-light.png")

# 5. Header variant:
# On the header, we can provide a dedicated header badge or the dark logo
cropped_dark.save('public/images/branding/smartbuy-ai-logo-header.png', format='PNG')
print("5. Saved public/images/branding/smartbuy-ai-logo-header.png")
