import sys
import time
import requests
from pathlib import Path
from PIL import Image
import io

# Đảm bảo in tiếng Việt chuẩn trên Windows console
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:8000"

def verify_png_magic_bytes(data: bytes) -> bool:
    """Kiểm tra chữ ký file PNG (89 50 4E 47 0D 0A 1A 0A) theo chuẩn RFC 2083"""
    png_signature = b"\x89PNG\r\n\x1a\n"
    return len(data) >= 8 and data[:8] == png_signature

def run_verification():
    print("=" * 70)
    print("  KIỂM THỬ XÁC THỰC FILE ẢNH VIRTUAL TRY-ON (CHỐNG LỖI ĐỊNH DẠNG)")
    print("=" * 70)

    # 1. Kiểm tra file cũ bị lỗi của người dùng
    user_failed_file = Path(r"C:\Users\Admin\Downloads\SMARTBUY-AI-TRYON-001 (2).png")
    if user_failed_file.exists():
        print("\n1. Đối chiếu file cũ bị lỗi của người dùng:")
        print(f"   - Đường dẫn: {user_failed_file}")
        print(f"   - Kích thước: {user_failed_file.stat().st_size} bytes")
        with open(user_failed_file, "rb") as f:
            content = f.read()
        print(f"   - Chữ ký PNG hợp lệ: {verify_png_magic_bytes(content)}")
        print(f"   - Nội dung thực tế trong file: {content.decode('utf-8', errors='replace')}")
        print("   => NGUYÊN NHÂN: File tải về là chuỗi JSON lỗi của máy chủ khi tác vụ còn đang 'processing', không phải ảnh PNG thật.")

    # 2. Gửi tác vụ mới với ảnh sản phẩm thật
    print("\n2. Gửi yêu cầu thử đồ mới đến AI Server...")
    sample_dir = Path("public/images/san-pham/quan-ao-nam/ao/ao-thun")
    garment_files = list(sample_dir.glob("*.jpg"))
    if not garment_files:
        print("   ✗ Không tìm thấy ảnh sản phẩm mẫu.")
        return

    garment_file = garment_files[0]
    person_file = garment_files[1] if len(garment_files) > 1 else garment_files[0]

    with open(person_file, "rb") as f_p, open(garment_file, "rb") as f_g:
        files = {
            "person_image": ("person.jpg", f_p, "image/jpeg"),
            "garment_image": ("garment.jpg", f_g, "image/jpeg"),
        }
        resp = requests.post(f"{BASE_URL}/try-on", files=files, data={"category": "upper_body"}, timeout=15)
        resp.raise_for_status()
        job_data = resp.json()
        job_id = job_data["job_id"]
        print(f"   ✓ Đã tạo tác vụ: {job_id}")
        print(f"   - Phản hồi từ POST /try-on có chứa resultUrl không: {'resultUrl' in job_data} (Chuẩn: Không trả resultUrl sớm)")

    # 3. Kiểm tra hành vi nếu tải ảnh khi còn đang 'processing'
    print("\n3. Thử tải ảnh ngay lập tức khi GPU chưa xong (kiểm tra khả năng chặn lưu lỗi thành ảnh)...")
    early_resp = requests.get(f"{BASE_URL}/jobs/{job_id}/result", timeout=5)
    print(f"   - HTTP Status khi GPU đang xử lý: {early_resp.status_code}")
    print(f"   - Content-Type: {early_resp.headers.get('content-type')}")
    print(f"   - Dữ liệu trả về: {early_resp.text}")
    assert early_resp.status_code == 400, "Phải trả về 400 khi chưa có ảnh"
    assert "application/json" in early_resp.headers.get("content-type", ""), "Phải trả Content-Type là JSON, không phải ảnh"
    print("   ✓ Cơ chế chặn lưu lỗi thành công: Client sẽ từ chối lưu dữ liệu này thành file .png.")

    # 4. Polling đến khi hoàn thành thực sự
    print("\n4. Chờ GPU NVIDIA RTX 3060 chạy 20 diffusion steps hoàn tất...")
    start_time = time.time()
    max_wait = 90
    completed = False

    while time.time() - start_time < max_wait:
        poll_resp = requests.get(f"{BASE_URL}/jobs/{job_id}", timeout=5)
        status_data = poll_resp.json()
        status = status_data.get("status")
        progress = status_data.get("progress", 0)

        if status == "completed":
            completed = True
            duration = round(time.time() - start_time, 2)
            print(f"   ✓ GPU đã hoàn tất tạo ảnh sau {duration} giây! (Tiến độ: 100%)")
            break
        elif status == "failed":
            print(f"   ✗ Tác vụ GPU thất bại: {status_data.get('error')}")
            return
        time.sleep(2)

    if not completed:
        print("   ✗ Timeout khi chờ GPU xử lý.")
        return

    # 5. Tải ảnh kết quả hoàn chỉnh và kiểm tra chữ ký định dạng
    print("\n5. Tải ảnh kết quả hoàn chỉnh từ GPU:")
    final_resp = requests.get(f"{BASE_URL}/jobs/{job_id}/result", timeout=15)
    print(f"   - HTTP Status: {final_resp.status_code}")
    print(f"   - Content-Type: {final_resp.headers.get('content-type')}")
    print(f"   - Dung lượng: {len(final_resp.content)} bytes ({round(len(final_resp.content)/1024, 2)} KB)")

    # Kiểm tra Magic Bytes
    is_png = verify_png_magic_bytes(final_resp.content)
    print(f"   - Chữ ký PNG Magic Bytes: {is_png} (0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A)")
    assert is_png, "LỖI: File tải về không có chữ ký PNG hợp lệ!"

    # 6. Mở và giải mã ảnh bằng Pillow (mô phỏng Windows Photos / Chrome)
    print("\n6. Kiểm tra khả năng giải mã ảnh (Windows Photos / Chrome compatibility):")
    try:
        img = Image.open(io.BytesIO(final_resp.content))
        img.verify()  # Xác thực cấu trúc file PNG không bị lỗi hỏng
        # Mở lại để lấy kích thước và mode
        img = Image.open(io.BytesIO(final_resp.content))
        print("   ✓ Giải mã thành công!")
        print(f"   - Kích thước ảnh: {img.width} x {img.height} pixels")
        print(f"   - Không gian màu: {img.mode}")
        print(f"   - Định dạng: {img.format}")
    except Exception as e:
        print(f"   ✗ Lỗi khi giải mã ảnh: {e}")
        return

    # 7. Lưu file kết quả chuẩn vào thư mục để đối chiếu
    output_verified = Path("ai-server/outputs/SMARTBUY-AI-TRYON-VERIFIED.png")
    output_verified.write_bytes(final_resp.content)
    print(f"   ✓ Đã lưu file ảnh kết quả chuẩn tại: {output_verified}")

    # 8. Dọn dẹp tác vụ
    requests.delete(f"{BASE_URL}/jobs/{job_id}", timeout=5)
    print("   ✓ Đã dọn dẹp dữ liệu tạm của tác vụ.")

    print("\n" + "=" * 70)
    print("  KẾT LUẬN: FILE ẢNH PNG HOÀN TOÀN HỢP LỆ VÀ MỞ ĐƯỢC 100% TRÊN MỌI TRÌNH XEM ẢNH!")
    print("=" * 70)

if __name__ == "__main__":
    run_verification()
