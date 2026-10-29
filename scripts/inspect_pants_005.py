import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('src/mocks/importedProducts.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

for p in products:
    if p['id'] == 'PANTS-005':
        print("PANTS-005 details:")
        print("Name:", p['name'])
        print("Images:", p['images'])
        print("Colors:", p['colors'])
        print("Variants:", p['variants'])

