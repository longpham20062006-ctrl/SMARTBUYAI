import os
import sys
import io
import json
import statistics
import colorsys
from PIL import Image

if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MANIFEST_PATH = os.path.join(ROOT_DIR, 'public', 'images', 'san-pham', 'manifest.json')

with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

folders = manifest.get('modelFolders', [])

pants_folders = [f for f in folders if 'quan' in f['folderKey']]
print(f"Total pants folders: {len(pants_folders)}")

def sample_crop(im_path, is_pants=False):
    with Image.open(im_path) as raw:
        im = raw.convert('RGB')
        w, h = im.size
        if is_pants:
            # Đối với quần, lấy phần nửa dưới (từ 45% đến 85% chiều cao) và giữa thân (30% đến 70% chiều rộng)
            crop_box = (int(w * 0.30), int(h * 0.45), int(w * 0.70), int(h * 0.85))
        else:
            # Đối với áo, lấy trung tâm
            crop_box = (int(w * 0.25), int(h * 0.25), int(w * 0.75), int(h * 0.75))
        
        cropped = im.crop(crop_box)
        cropped.thumbnail((40, 40))
        loaded = cropped.load()
        if loaded is None:
            return (0, 0, 0), (0, 0, 0)
        cw, ch = cropped.size
        pixels = [loaded[x, y][:3] for y in range(ch) for x in range(cw)]
        r_med = statistics.median([p[0] for p in pixels])
        g_med = statistics.median([p[1] for p in pixels])
        b_med = statistics.median([p[2] for p in pixels])
        h_val, s_val, v_val = colorsys.rgb_to_hsv(r_med / 255.0, g_med / 255.0, b_med / 255.0)
        return (r_med, g_med, b_med), (h_val, s_val, v_val)

for pf in pants_folders:
    fkey = pf['folderKey']
    print(f"\nFolder: {fkey} ({len(pf['images'])} images)")
    for img in pf['images']:
        rgb_top, hsv_top = sample_crop(img['fullPath'], is_pants=False)
        rgb_pant, hsv_pant = sample_crop(img['fullPath'], is_pants=True)
        print(f"  {img['fileName'][:20]} | Top: RGB=({rgb_top[0]:.0f},{rgb_top[1]:.0f},{rgb_top[2]:.0f}) | Pant: RGB=({rgb_pant[0]:.0f},{rgb_pant[1]:.0f},{rgb_pant[2]:.0f})")
