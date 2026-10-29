import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('src/mocks/importedProducts.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

p0 = products[0]
print("Product keys:", list(p0.keys()))
for p in products:
    img = p.get('imageUrl') or p.get('image') or (p.get('images', [None])[0] if p.get('images') else None)
    if 'quan-dai' in str(p):
        print(f"ID: {p.get('id')}, Name: {p.get('name')}, Img: {img}")
