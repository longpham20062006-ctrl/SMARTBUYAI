import json

with open('src/mocks/importedProducts.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

vay_products = [p for p in products if 'vay' in p.get('imageUrl', '').lower() or any('vay' in img.lower() for img in p.get('images', []))]
print(f"Products referencing 'vay': {len(vay_products)}")

# Check some image URLs
for p in vay_products[:5]:
    print(p.get('id'), p.get('name'), p.get('imageUrl'))

