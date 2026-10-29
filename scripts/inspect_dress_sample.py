import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('src/mocks/importedProducts.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

for p in products:
    if p['id'] == 'W-DRESS-001':
        print(json.dumps(p, ensure_ascii=False, indent=2))
        break

