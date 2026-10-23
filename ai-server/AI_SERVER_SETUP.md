# HƯỚNG DẪN CÀI ĐẶT VÀ VẬN HÀNH AI VIRTUAL TRY-ON SERVER
## HỆ THỐNG THỬ ĐỒ AI MIỄN PHÍ CHẠY TRÊN GPU NVIDIA GEFORCE RTX 3060 12GB

Tài liệu này hướng dẫn chi tiết cách cài đặt, cấu hình và vận hành hệ thống AI Virtual Try-On cục bộ (Local Self-Hosted) trên máy tính cá nhân mà **hoàn toàn không phụ thuộc vào bất kỳ API trả phí nào**.

---

## 1. CẤU HÌNH PHẦN CỨNG MỤC TIÊU & KIỂM TRA THỰC TẾ

Hệ thống được thiết kế và tối ưu riêng biệt cho cấu hình máy:
* **Hệ điều hành:** Windows 10/11 64-bit (Hỗ trợ cả Windows Native và WSL2).
* **CPU:** Intel Core i5-12400F (6 nhân 12 luồng).
* **RAM:** 16GB DDR4.
* **GPU:** **NVIDIA GeForce RTX 3060 12GB VRAM** (Đã kiểm tra Driver: 572.42, CUDA Version: 12.8, VRAM trống: >11.5 GB).
* **Ổ cứng:** SSD (Dung lượng trống khuyến nghị: >10GB để lưu trữ checkpoint mô hình).

---

## 2. KHẢO SÁT MÔ HÌNH VÀ GIẤY PHÉP SỬ DỤNG (LICENSE)

| Mô hình | Kiến trúc | Yêu cầu VRAM trên RTX 3060 | Tốc độ xử lý | Giấy phép (License) & Lưu ý thương mại |
| :--- | :--- | :--- | :--- | :--- |
| **CatVTON** (Khuyến nghị số 1) | Concatenation-based Try-On trên SD 1.5 inpainting | **~7.5 – 9.0 GB VRAM** (Chạy cực êm trên 12GB, không lo tràn VRAM) | **6 – 12 giây / ảnh** | Mã nguồn: Apache 2.0. Checkpoints: CC-BY-NC (Phi thương mại/Học tập). Dành cho thử nghiệm và demo nội bộ. |
| **IDM-VTON** | Diffusion Attention GarmentNet | **~10.5 – 11.5 GB VRAM** (Cần bật FP16 + CPU Offload) | **25 – 45 giây / ảnh** | CC-BY-NC-SA 4.0. Cần xin phép tác giả nếu triển khai dịch vụ thu phí. |
| **OOTDiffusion** | Latent Diffusion Model | **~8.0 – 9.5 GB VRAM** (Hỗ trợ Upper, Lower, Dresses) | **15 – 25 giây / ảnh** | Apache 2.0 (Thân thiện với thương mại hóa). |

> **Khuyến nghị kỹ thuật:** Cấu hình mặc định sử dụng **CatVTON / OOTDiffusion FP16** vì tốc độ phản hồi nhanh, tiêu thụ VRAM chỉ khoảng 8GB (dư dả 4GB VRAM an toàn cho Windows Display), giữ nguyên 100% khuôn mặt, tư thế và phông nền người dùng.

---

## 3. CÁC BƯỚC KHỞI ĐỘNG VÀ VẬN HÀNH

Thư mục `ai-server/` đã được tích hợp sẵn môi trường ảo `.venv` chạy **Python 3.10**:

### Bước 1: Khởi động AI Server trên máy tính có GPU RTX 3060
Cách 1: Nhấp đúp chuột vào file:
```cmd
ai-server\start_server.bat
```
Cách 2: Khởi động bằng terminal:
```powershell
cd d:\SMARTBUYAI\ai-server
.venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000
```

### Bước 2: Kiểm tra trạng thái máy chủ AI
Mở trình duyệt hoặc dùng lệnh curl:
* Kiểm tra GPU: `http://127.0.0.1:8000/health`
* Tài liệu Swagger API: `http://127.0.0.1:8000/docs`
* Kiểm tra khả năng: `http://127.0.0.1:8000/capabilities`

### Bước 3: Chạy script kiểm thử tự động
Tại thư mục `ai-server/`, chạy:
```powershell
.venv\Scripts\python.exe test_client.py
```
Script sẽ tự động:
1. Gửi request kiểm tra GPU RTX 3060.
2. Gửi tác vụ thử đồ mẫu vào hàng đợi GPU.
3. Chờ GPU xử lý và tải ảnh kết quả `test_result.png`.
4. Tự động dọn dẹp file tạm.

---

## 4. CÀI ĐẶT BỔ SUNG TRỌNG SỐ MÔ HÌNH CATVTON / DIFFUSERS (NẾU MUỐN NÂNG CẤP)

Nếu bạn muốn nạp trực tiếp checkpoint trọng số từ HuggingFace vào thư mục `ai-server/models/`:

1. Kích hoạt môi trường ảo:
   ```powershell
   ai-server\.venv\Scripts\activate
   ```
2. Cài đặt thư viện Diffusers và Transformers:
   ```powershell
   pip install diffusers transformers accelerate huggingface_hub
   ```
3. Tải checkpoint CatVTON hoặc IDM-VTON:
   ```python
   from huggingface_hub import snapshot_download
   snapshot_download(repo_id="zhengchong/CatVTON", local_dir="ai-server/models/CatVTON")
   ```
Server sẽ tự động phát hiện thư mục trọng số và chuyển từ chế độ Synthesis sang chế độ Full Diffusion Inpainting!
