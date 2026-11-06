import requests
import time
from pathlib import Path

BASE_URL = "http://127.0.0.1:7860/api/v1"

def test_tryon(category="one-pieces", seg_free="false", photo_type="flat-lay", steps=30, label="test1"):
    person_path = Path("gpu-server-FASHN-8GB/data/runs/69978805c5e84b8c/person.png")
    garment_path = Path("gpu-server-FASHN-8GB/data/runs/69978805c5e84b8c/garment.png")
    
    print(f"[{label}] Submitting job: category={category}, seg_free={seg_free}, photo_type={photo_type}, steps={steps}...")
    with open(person_path, "rb") as fp, open(garment_path, "rb") as fg:
        files = {
            "person": ("person.png", fp, "image/png"),
            "garment": ("garment.png", fg, "image/png"),
        }
        data = {
            "category": category,
            "photo_type": photo_type,
            "steps": steps,
            "guidance": 1.6,
            "seed": 42,
            "segmentation_free": seg_free,
            "retry_if_flagged": "false",
        }
        res = requests.post(f"{BASE_URL}/jobs", files=files, data=data)
    
    if not res.ok:
        print(f"Error {res.status_code}: {res.text}")
        return None
    
    job_id = res.json()["job_id"]
    print(f"Job queued: {job_id}. Polling status...")
    
    start_t = time.time()
    while time.time() - start_t < 300:
        time.sleep(2)
        r = requests.get(f"{BASE_URL}/jobs/{job_id}")
        if not r.ok:
            print("Poll error:", r.text)
            break
        info = r.json()
        status = info.get("status")
        stage = info.get("stage", "")
        print(f"  status: {status} ({stage})")
        if status == "completed":
            img_url = info["result"]["image_url"]
            print(f"Job completed! Image URL: {img_url}, seconds: {info['result'].get('seconds')}")
            # Fetch output
            out_res = requests.get(f"http://127.0.0.1:7860{img_url.replace('/api/v1', '')}")
            out_path = Path(f"gpu-server-FASHN-8GB/data/test_results/{label}_{category}_{job_id[:8]}.png")
            out_path.parent.mkdir(parents=True, exist_ok=True)
            with open(out_path, "wb") as f_out:
                f_out.write(out_res.content)
            print(f"Saved result to {out_path}")
            return out_path
        elif status == "failed":
            print(f"Job failed: {info.get('error')}")
            break
    return None

if __name__ == "__main__":
    # Test with one-pieces and segmentation_free=false
    test_tryon(category="one-pieces", seg_free="false", photo_type="flat-lay", steps=30, label="onepieces_segFalse")
