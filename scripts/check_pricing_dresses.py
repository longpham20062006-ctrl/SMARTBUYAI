import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('src/mocks/pricingRegistry.json', 'r', encoding='utf-8') as f:
    reg = json.load(f)

dresses_in_reg = [r for r in reg if 'DRESS' in r.get('productId', '')]
print(f"Total DRESS items in pricingRegistry: {len(dresses_in_reg)}")
for d in dresses_in_reg[:10]:
    print(d['productId'], d['productName'], d['currentPrice'], d['suggestedPrice'], d['status'])

