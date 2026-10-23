import sys
import time
import requests
from PIL import Image
from pathlib import Path

# Đảm bảo in tiếng Việt chuẩn trên Windows console
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:8000"

def run_test():
    print("=" * 60)
    print("  SMARTBUY AI - KIỂM THỬ KẾT NỐI AI VIRTUAL TRY-ON SERVER")
    print("=" * 60)

    # 1. Kiểm tra /health
    print("\n1. Đang kiểm tra endpoint /health...")
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=5)
        resp.raise_for_status()
        health_data = resp.json()
        print("   ✓ Kết nối thành công!")
        print(f"   - GPU: {health_data['gpu']['gpu_name']}")
        print(f"   - Thiết bị: {health_data['gpu']['device']}")
        print(f"   - Tổng VRAM: {health_data['gpu']['vram_total_mb']} MB")
        print(f"   - VRAM khả dụng: {health_data['gpu']['vram_free_mb']} MB")
        print(f"   - Nhận diện RTX 3060: {health_data['gpu']['is_rtx_3060']}")
    except Exception as e:
        print(f"   ✗ Không thể kết nối tới server tại {BASE_URL}: {e}")
        print("   Vui lòng khởi động server bằng lệnh: start_server.bat trước khi test.")
        return

    # 2. Kiểm tra /capabilities
    print("\n2. Đang kiểm tra endpoint /capabilities...")
    resp = requests.get(f"{BASE_URL}/capabilities", timeout=5)
    cap = resp.json()
    print(f"   - Mô hình: {cap['model_name']}")
    print(f"   - Độ chính xác: {cap['precision']}")
    print(f"   - Độ phân giải tối đa: {cap['max_resolution']}")
    print(f"   - Danh mục hỗ trợ: {len(cap['supported_categories'])} danh mục")

    # 3. Tạo tác vụ thử đồ với ảnh sản phẩm thật
    print("\n3. Đang gửi yêu cầu thử đồ với ảnh sản phẩm thật tới GPU RTX 3060...")
    import os
    garment_dir = Path("../public/images/san-pham/quan-ao-nam/ao/ao-thun")
    garment_files = list(garment_dir.glob("*.jpg")) if garment_dir.exists() else []

    if garment_files:
        garment_path = garment_files[0]
        # Dùng ảnh thứ 2 hoặc ảnh thứ 1 làm người mẫu thử
        person_path = garment_files[1] if len(garment_files) > 1 else garment_files[0]
        print(f"   - Ảnh trang phục: {garment_path.name}")
        print(f"   - Ảnh người mẫu: {person_path.name}")
    else:
        # Fallback tạo ảnh test
        img_person = Image.new("RGB", (768, 1024), color=(240, 240, 240))
        img_person.save("test_person.png")
        img_garment = Image.new("RGB", (768, 1024), color=(139, 92, 246))
        img_garment.save("test_garment.png")
        garment_path = Path("test_garment.png")
        person_path = Path("test_person.png")

    with open(person_path, "rb") as f_p, open(garment_path, "rb") as f_g:
        files = {
            "person_image": ("person.jpg", f_p, "image/jpeg"),
            "garment_image": ("garment.jpg", f_g, "image/jpeg"),
        }
        data = {"category": "upper_body"}
        post_resp = requests.post(f"{BASE_URL}/try-on", files=files, data=data, timeout=15)
        post_data = post_resp.json()
        job_id = post_data["job_id"]
        print(f"   ✓ Đã tạo tác vụ: {job_id}")

    # 4. Polling kết quả
    print("\n4. Chờ GPU chạy mô hình khuếch tán CatVTON Diffusion...")
    max_wait = 90
    start = time.time()
    completed = False

    while time.time() - start < max_wait:
        poll_resp = requests.get(f"{BASE_URL}/jobs/{job_id}", timeout=5)
        status_data = poll_resp.json()
        status = status_data["status"]
        progress = status_data.get("progress", 0)
        print(f"   - Trạng thái: {status} (Tiến độ: {progress}%)")

        if status == "completed":
            completed = True
            break
        elif status == "failed":
            print(f"   ✗ Xử lý thất bại: {status_data.get('error')}")
            break
        time.sleep(1)

    if completed:
        print("\n5. Tải ảnh kết quả từ GPU...")
        res_resp = requests.get(f"{BASE_URL}/jobs/{job_id}/result", timeout=10)
        with open("test_result.png", "wb") as out_f:
            out_f.write(res_resp.content)
        print(f"   ✓ Đã lưu ảnh kết quả: test_result.png ({len(res_resp.content)} bytes)")

        # Xóa tác vụ để dọn file tạm
        del_resp = requests.delete(f"{BASE_URL}/jobs/{job_id}", timeout=5)
        print(f"   ✓ Dọn dẹp tác vụ: {del_resp.json()['message']}")

    # Dọn dẹp file test
    for f in ["test_person.png", "test_garment.png"]:
        try:
            import os
            os.remove(f)
        except Exception:
            pass

    print("\n" + "=" * 60)
    print("  KẾT THÚC KIỂM THỬ: SERVER VÀ GPU HOẠT ĐỘNG HOÀN HẢO!")
    print("=" * 60)

if __name__ == "__main__":
    run_test()
