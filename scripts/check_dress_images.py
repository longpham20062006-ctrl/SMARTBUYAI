import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('src/mocks/importedProducts.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

for p in products:
    if p['id'].startswith('W-DRESS-07') or p['id'].startswith('W-DRESS-08') or p['id'].startswith('W-DRESS-09'):
        print(f"ID: {p['id']}, Name: {p['name']}, Images: {p.get('images')}, Variants count: {len(p.get('variants', []))}")
        if p.get('variants'):
            print("  First var image:", p['variants'][0].get('image'))

