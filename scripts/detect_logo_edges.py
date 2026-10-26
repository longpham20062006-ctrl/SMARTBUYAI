from PIL import Image, ImageFilter

im = Image.open('public/images/branding/smartbuy-ai-logo-original.png.png')
w, h = im.size

# Find edges
gray = im.convert('L')
edges = gray.filter(ImageFilter.FIND_EDGES)

# Threshold edges to find active logo content
thresh = edges.point(lambda p: 255 if p > 35 else 0)
bbox = thresh.getbbox()
print(f"Edge detection bounding box: {bbox}")
# bbox is (left, upper, right, lower)
if bbox:
    left, upper, right, lower = bbox
    print(f"Content: width={right - left}, height={lower - upper}, aspect={(right-left)/(lower-upper):.2f}")
    
    # Save a cropped version with padding
    pad = 20
    crop_box = (max(0, left - pad), max(0, upper - pad), min(w, right + pad), min(h, lower + pad))
    cropped = im.crop(crop_box)
    cropped.save('public/images/branding/smartbuy-ai-logo-dark.png')
    print(f"Saved cropped dark logo: {cropped.size} to public/images/branding/smartbuy-ai-logo-dark.png")
