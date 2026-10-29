import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

vay_dir = 'public/images/san-pham/quan-ao-nu/vay'
files = os.listdir(vay_dir)
print(f"Total files in {vay_dir}: {len(files)}")
webp_files = sorted([f for f in files if f.endswith('.webp')])
png_files = sorted([f for f in files if f.endswith('.png')])
jpg_files = sorted([f for f in files if f.endswith('.jpg')])

print(f"Webp: {len(webp_files)} -> {webp_files[:5]} ... {webp_files[-5:]}")
print(f"Png: {len(png_files)} -> {png_files}")
print(f"Jpg: {len(jpg_files)} -> {jpg_files}")

