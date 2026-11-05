import csv

with open('docs/SMARTBUY_IMAGE_AUDIT.csv', mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    unref = [row for row in reader if row['used_in_catalog'] == 'FALSE' and row['used_in_homepage'] == 'FALSE']
    print(f"Total unreferenced: {len(unref)}")
    for row in unref:
        print(f"{row['detected_category']} | {row['public_url']} | {row['width']}x{row['height']} | {row['proposed_action']}")
