import os
import sys
from pathlib import Path
from PIL import Image

sys.path.insert(0, str(Path("gpu-server-FASHN-8GB").resolve()))

from smartfit.engine import ENGINE

def main():
    person_path = Path("gpu-server-FASHN-8GB/data/runs/69978805c5e84b8c/person.png")
    garment_path = Path("gpu-server-FASHN-8GB/data/runs/69978805c5e84b8c/garment.png")
    
    if not person_path.exists() or not garment_path.exists():
        print("Test images not found!")
        return

    person = Image.open(person_path).convert("RGB")
    garment = Image.open(garment_path).convert("RGB")
    
    out_dir = Path("gpu-server-FASHN-8GB/data/test_results")
    out_dir.mkdir(parents=True, exist_ok=True)
    
    print("Testing 1: category='one-pieces', segmentation_free=False, photo_type='flat-lay'...")
    res1 = ENGINE.run(
        person, garment,
        category="one-pieces",
        photo_type="flat-lay",
        steps=30,
        guidance=1.6,
        seed=42,
        segmentation_free=False
    )
    res1.save(out_dir / "res_onepieces_segFalse_flatlay.png")
    print("Saved res_onepieces_segFalse_flatlay.png")

    print("Testing 2: category='one-pieces', segmentation_free=True, photo_type='flat-lay'...")
    res2 = ENGINE.run(
        person, garment,
        category="one-pieces",
        photo_type="flat-lay",
        steps=30,
        guidance=1.6,
        seed=42,
        segmentation_free=True
    )
    res2.save(out_dir / "res_onepieces_segTrue_flatlay.png")
    print("Saved res_onepieces_segTrue_flatlay.png")

if __name__ == "__main__":
    main()
