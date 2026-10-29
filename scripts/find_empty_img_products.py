import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('src/mocks/importedProducts.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

empty_img_products = [p for p in products if not p.get('images') or len(p.get('images')) == 0 or not p['images'][0]]
print(f"Total products with empty images: {len(empty_img_products)}")
for p in empty_img_products:
    print(f"ID: {p['id']}, Name: {p['name']}, Category: {p.get('categorySlug')}, Gender: {p.get('gender')}")

