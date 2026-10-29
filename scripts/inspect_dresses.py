import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('src/mocks/importedProducts.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

dress_products = [p for p in products if p['id'].startswith('W-DRESS')]
print(f"Total W-DRESS products: {len(dress_products)}")
for p in dress_products[-10:]:
    print(p['id'], p['name'], p['images'])

