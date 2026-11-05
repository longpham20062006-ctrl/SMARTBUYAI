import os
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PUBLIC_DIR = os.path.join(ROOT_DIR, 'public')

with open(os.path.join(ROOT_DIR, 'src', 'mocks', 'importedProducts.json'), 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f'Checking {len(products)} products in importedProducts.json for broken image paths...')

broken_images = []
valid_images = []

for p in products:
    pid = p.get('id')
    pname = p.get('name')
    images = p.get('images', [])
    for img in images:
        if img.startswith('http'):
            continue
        rel = img.lstrip('/')
        disk_path = os.path.join(PUBLIC_DIR, rel.replace('/', os.sep))
        if not os.path.exists(disk_path):
            broken_images.append({'id': pid, 'name': pname, 'path': img, 'diskPath': disk_path})
        else:
            valid_images.append(img)

print(f'Total valid local images found on disk: {len(valid_images)}')
print(f'Total broken local image references: {len(broken_images)}')
if broken_images:
    print('Sample broken references:')
    for b in broken_images[:10]:
        print(' ', b['id'], '|', b['path'])

