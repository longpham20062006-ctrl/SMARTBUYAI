import csv
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('docs/SMARTBUY_IMAGE_AUDIT.csv', mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    unref = [row for row in reader if row['used_in_catalog'] == 'FALSE' and row['used_in_homepage'] == 'FALSE']
    print(f"Total unreferenced: {len(unref)}")
    with open('docs/unreferenced_images.txt', 'w', encoding='utf-8') as out:
        for idx, row in enumerate(unref, 1):
            line = f"{idx}. [{row['detected_category']}] {row['public_url']} ({row['width']}x{row['height']})\n"
            out.write(line)
            print(line, end='')

