import os
import sys
import io
import json
import math
import statistics
import colorsys
from PIL import Image

if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MANIFEST_PATH = os.path.join(ROOT_DIR, 'public', 'images', 'san-pham', 'manifest.json')

with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

folders = {f['folderKey']: f for f in manifest.get('modelFolders', [])}

def get_rgb(path):
    with Image.open(path) as raw:
        im = raw.convert('RGB')
        w, h = im.size
        cropped = im.crop((int(w * 0.25), int(h * 0.25), int(w * 0.75), int(h * 0.75)))
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

def color_dist(c1, c2):
    return math.sqrt((c1[0] - c2[0])**2 + (c1[1] - c2[1])**2 + (c1[2] - c2[2])**2)

test_keys = [
    'quan-ao-nu/ao/ao-thun/ao_8',
    'quan-ao-nu/ao/ao-thun/ao_5',
    'quan-ao-nu/ao/ao-thun/ao_3',
    'quan-ao-nam/ao/ao-hoodie/ao_hoodie_1'
]

for k in test_keys:
    f = folders.get(k)
    if not f:
        continue
    print(f"\n=== {k} ===")
    rgbs = []
    for img in f['images']:
        rgb, hsv = get_rgb(img['fullPath'])
        rgbs.append((img['fileName'], rgb, hsv))
        print(f"  {img['fileName'][:20]}... RGB=({rgb[0]:.0f},{rgb[1]:.0f},{rgb[2]:.0f}) HSV=(h={hsv[0]:.2f}, s={hsv[1]:.2f}, v={hsv[2]:.2f})")
    
    # Distance matrix
    print("  Pairwise distances:")
    for i in range(len(rgbs)):
        for j in range(i + 1, len(rgbs)):
            d = color_dist(rgbs[i][1], rgbs[j][1])
            print(f"    {rgbs[i][0][:10]} vs {rgbs[j][0][:10]}: dist={d:.1f}")
