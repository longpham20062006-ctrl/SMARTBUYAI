from PIL import Image, ImageFilter

# Load cropped dark logo
im = Image.open('public/images/branding/smartbuy-ai-logo-dark.png').convert('RGBA')
w, h = im.size

# Let's inspect the background noise in test_white_bg:
# The noise came from diff = 36 - brightness in the range 24-36.
# But background is literally between 25 and 45 everywhere!
# Letters SMARTBUY are deep black: brightness <= 14!
# Cyan AI is: B > 120 and G > 120 and B > R + 40!
# Metallic edges of the hanger are: brightness >= 60!
# What about between 15 and 59? That was almost ALL charcoal background!

clean_trans = Image.new('RGBA', (w, h), (0, 0, 0, 0))

for y in range(h):
    for x in range(w):
        r, g, b, a = im.getpixel((x, y))
        br = (r + g + b) / 3.0
        
        # Check cyan
        is_cyan = (b > 100 and g > 100 and b > r + 30 and g > r + 30)
        
        if is_cyan:
            clean_trans.putpixel((x, y), (r, g, b, 255))
        elif br < 16:
            # Deep black letter stroke / hanger stroke
            clean_trans.putpixel((x, y), (15, 15, 18, 255))
        elif br < 22:
            # Anti-aliasing edge of black text
            alpha = int((22 - br) / 6.0 * 255)
            clean_trans.putpixel((x, y), (15, 15, 18, alpha))
        elif br > 70:
            # Highlight on hanger
            alpha = min(255, int((br - 70) * 4))
            clean_trans.putpixel((x, y), (r, g, b, alpha))
        else:
            # It's background!
            clean_trans.putpixel((x, y), (0, 0, 0, 0))

# Test on white background
test_white = Image.new('RGB', (w, h), (255, 255, 255))
test_white.paste(clean_trans, (0, 0), clean_trans)
test_white.save('public/images/branding/test_clean_white.png')
clean_trans.save('public/images/branding/smartbuy-ai-logo-clean-trans.png')
print("Saved public/images/branding/test_clean_white.png")
