import os
import sys
import io

if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(encoding='utf-8')
if isinstance(sys.stderr, io.TextIOWrapper):
    sys.stderr.reconfigure(encoding='utf-8')

root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'images', 'san-pham', 'quan-ao-nu'))

print("=== QUẦN ===")
quan_dir = os.path.join(root, 'quan')
for d in sorted(os.listdir(quan_dir)):
    sub = os.path.join(quan_dir, d)
    if os.path.isdir(sub):
        imgs = os.listdir(sub)
        print(f"{d} ({len(imgs)} imgs): {imgs}")

print("\n=== VÁY ===")
vay_dir = os.path.join(root, 'vay')
vay_folders = [d for d in os.listdir(vay_dir) if os.path.isdir(os.path.join(vay_dir, d))]
print(f"Total vay folders: {len(vay_folders)}")
for d in sorted(vay_folders, key=lambda x: int(x) if x.isdigit() else x)[:10]:
    sub = os.path.join(vay_dir, d)
    imgs = os.listdir(sub)
    print(f"vay/{d} ({len(imgs)} imgs): {imgs}")
