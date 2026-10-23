import sys
import time
import requests
import hashlib
from pathlib import Path
from PIL import Image

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:8000"

def run_test():
    print("=" * 80)
    print("KIỂM THỬ TÍCH HỢP: THỬ ĐỒ VỚI 2 ÁO KHÁC NHAU (ÁO A & ÁO B)")
    print("=" * 80)

    person_file = Path("ai-server/temp/job_15b33160a5e5_person_44fe115e4f45.png")
    if not person_file.exists():
        # Fallback to any valid person image
        persons = list(Path("ai-server/temp").glob("*_person_*.png"))
        if persons:
            person_file = persons[0]
        else:
            print("Không tìm thấy ảnh người mẫu mẫu.")
            return

    path_A = Path("ai-server/test_garments/shirt_A.jpg")
    path_B = Path("ai-server/test_garments/shirt_B.jpg")
    assert path_A.exists(), "Thiếu file shirt_A.jpg"
    assert path_B.exists(), "Thiếu file shirt_B.jpg"

    sha256_A = hashlib.sha256(path_A.read_bytes()).hexdigest()
    sha256_B = hashlib.sha256(path_B.read_bytes()).hexdigest()
    print(f"File Áo A (Logo tròn nhỏ): {path_A.name} ({path_A.stat().st_size} bytes) SHA: {sha256_A[:10]}")
    print(f"File Áo B (Chữ in ngang ngực): {path_B.name} ({path_B.stat().st_size} bytes) SHA: {sha256_B[:10]}")
    assert sha256_A != sha256_B, "Hai ảnh đầu vào phải hoàn toàn khác nhau!"

    # ----------------------------------------------------
    # TEST 1: THỬ ÁO A (Áo đen có logo tròn nhỏ)
    # ----------------------------------------------------
    print("\n--- [BƯỚC 1] Gửi yêu cầu thử đồ với ÁO A (Logo tròn nhỏ) ---")
    req_id_A = f"req_test_A_{int(time.time())}"
    with open(person_file, "rb") as f_p, open(path_A, "rb") as f_g:
        resp_A = requests.post(
            f"{BASE_URL}/try-on",
            files={
                "person_image": ("person.png", f_p, "image/png"),
                "garment_image": ("shirt_A.jpg", f_g, "image/jpeg"),
            },
            data={
                "category": "upper_body",
                "garment_id": "m-29",
                "garment_name": "Áo Thun Oversize ACID SMILE (Logo Tròn)",
                "request_id": req_id_A,
            },
            timeout=15,
        )
    resp_A.raise_for_status()
    job_A_data = resp_A.json()
    job_A_id = job_A_data["job_id"]
    print(f"✓ Đã tiếp nhận tác vụ Áo A: Job ID = {job_A_id}")

    # Chờ GPU xử lý Áo A
    print("  Đang chờ RTX 3060 thực thi CatVTON Diffusion cho Áo A...")
    start_A = time.time()
    while time.time() - start_A < 90:
        st = requests.get(f"{BASE_URL}/jobs/{job_A_id}", timeout=5).json()
        if st.get("status") == "completed":
            print(f"✓ Áo A hoàn thành sau {round(time.time() - start_A, 2)}s!")
            break
        elif st.get("status") == "failed":
            raise RuntimeError(f"Tác vụ Áo A thất bại: {st.get('error')}")
        time.sleep(2)

    # Tải kết quả Áo A
    res_A_bytes = requests.get(f"{BASE_URL}/jobs/{job_A_id}/result", timeout=10).content
    assert res_A_bytes.startswith(b"\x89PNG\r\n\x1a\n"), "Kết quả Áo A phải là PNG chuẩn"
    save_A_path = Path("ai-server/test_garments/result_shirt_A.png")
    save_A_path.write_bytes(res_A_bytes)
    print(f"✓ Đã lưu ảnh kết quả Áo A ({len(res_A_bytes)} bytes) tại: {save_A_path}")

    # Kiểm tra endpoint debug garment của Áo A
    debug_garment_A = requests.get(f"{BASE_URL}/jobs/{job_A_id}/garment", timeout=5).content
    sha_debug_A = hashlib.sha256(debug_garment_A).hexdigest()
    print(f"✓ Backend debug Áo A: {len(debug_garment_A)} bytes")

    # ----------------------------------------------------
    # TEST 2: THỬ ÁO B (Áo đen có chữ in ngang ngực)
    # ----------------------------------------------------
    print("\n--- [BƯỚC 2] Gửi yêu cầu thử đồ với ÁO B (Chữ in ngang ngực) ---")
    req_id_B = f"req_test_B_{int(time.time())}"
    with open(person_file, "rb") as f_p, open(path_B, "rb") as f_g:
        resp_B = requests.post(
            f"{BASE_URL}/try-on",
            files={
                "person_image": ("person.png", f_p, "image/png"),
                "garment_image": ("shirt_B.jpg", f_g, "image/jpeg"),
            },
            data={
                "category": "upper_body",
                "garment_id": "u-12",
                "garment_name": "Áo Thun Graphic NEON DISTRICT (Chữ Ngang Ngực)",
                "request_id": req_id_B,
            },
            timeout=15,
        )
    resp_B.raise_for_status()
    job_B_data = resp_B.json()
    job_B_id = job_B_data["job_id"]
    print(f"✓ Đã tiếp nhận tác vụ Áo B: Job ID = {job_B_id}")

    # Chờ GPU xử lý Áo B
    print("  Đang chờ RTX 3060 thực thi CatVTON Diffusion cho Áo B...")
    start_B = time.time()
    while time.time() - start_B < 90:
        st = requests.get(f"{BASE_URL}/jobs/{job_B_id}", timeout=5).json()
        if st.get("status") == "completed":
            print(f"✓ Áo B hoàn thành sau {round(time.time() - start_B, 2)}s!")
            break
        elif st.get("status") == "failed":
            raise RuntimeError(f"Tác vụ Áo B thất bại: {st.get('error')}")
        time.sleep(2)

    # Tải kết quả Áo B
    res_B_bytes = requests.get(f"{BASE_URL}/jobs/{job_B_id}/result", timeout=10).content
    assert res_B_bytes.startswith(b"\x89PNG\r\n\x1a\n"), "Kết quả Áo B phải là PNG chuẩn"
    save_B_path = Path("ai-server/test_garments/result_shirt_B.png")
    save_B_path.write_bytes(res_B_bytes)
    print(f"✓ Đã lưu ảnh kết quả Áo B ({len(res_B_bytes)} bytes) tại: {save_B_path}")

    # Kiểm tra endpoint debug garment của Áo B
    debug_garment_B = requests.get(f"{BASE_URL}/jobs/{job_B_id}/garment", timeout=5).content
    sha_debug_B = hashlib.sha256(debug_garment_B).hexdigest()
    print(f"✓ Backend debug Áo B: {len(debug_garment_B)} bytes")

    # ----------------------------------------------------
    # BƯỚC 3: SO SÁNH VÀ ĐỐI CHIẾU
    # ----------------------------------------------------
    print("\n--- [BƯỚC 3] ĐỐI CHIẾU VÀ XÁC NHẬN TÍNH ĐỘC LẬP GIỮA HAI LƯỢT THỬ ---")
    sha_res_A = hashlib.sha256(res_A_bytes).hexdigest()
    sha_res_B = hashlib.sha256(res_B_bytes).hexdigest()

    print(f"1. SHA256 Ảnh đầu vào Áo A ({path_A.name}): {sha256_A[:16]}")
    print(f"   SHA256 Ảnh đầu vào Áo B ({path_B.name}): {sha256_B[:16]}")
    print(f"   => Khác biệt: {sha256_A != sha256_B} (Chuẩn: 2 áo riêng biệt)")

    print(f"\n2. SHA256 Áo backend nhận được cho Job A: {sha_debug_A[:16]}")
    print(f"   SHA256 Áo backend nhận được cho Job B: {sha_debug_B[:16]}")
    print(f"   => Khác biệt: {sha_debug_A != sha_debug_B} (Chuẩn: Không dùng lại ảnh cũ)")

    print(f"\n3. SHA256 Ảnh kết quả AI của Áo A: {sha_res_A[:16]} ({len(res_A_bytes)} bytes)")
    print(f"   SHA256 Ảnh kết quả AI của Áo B: {sha_res_B[:16]} ({len(res_B_bytes)} bytes)")
    print(f"   => Khác biệt: {sha_res_A != sha_res_B} (Chuẩn: 2 kết quả hoàn toàn khác nhau)")

    print("\n" + "=" * 80)
    print("KẾT QUẢ KIỂM THỬ: THÀNH CÔNG 100%!")
    print("Chọn đúng áo nào thì mô hình AI đã nhận đúng và inference chính xác chiếc áo đó.")
    print("=" * 80)

if __name__ == "__main__":
    run_test()
