# HƯỚNG DẪN XỬ LÝ SỰ CỐ (TROUBLESHOOTING)
## AI VIRTUAL TRY-ON SERVER TRÊN NVIDIA RTX 3060 12GB

Tài liệu này tổng hợp các lỗi thường gặp trong quá trình vận hành hệ thống AI thử đồ cục bộ và giải pháp xử lý nhanh chóng.

---

## 1. LỖI CUDA OUT OF MEMORY (OOM) TRÊN GPU

### Triệu chứng:
Log hiển thị: `torch.cuda.OutOfMemoryError: CUDA out of memory. Tried to allocate...`

### Nguyên nhân:
- Độ phân giải ảnh đầu vào quá lớn (ví dụ 4K hoặc 2048x2048).
- Có ứng dụng đồ họa khác (game 3D, Premiere, Blender) đang chiếm dụng VRAM của RTX 3060.

### Giải pháp:
1. Đảm bảo ảnh đầu vào được đưa về chuẩn **768x1024** (đã được cấu hình tự động trong `image_processor.py`).
2. Kiểm tra VRAM đang bị ứng dụng nào chiếm:
   ```cmd
   nvidia-smi
   ```
   Tắt bớt các tab trình duyệt video 4K hoặc phần mềm 3D nền.
3. Kích hoạt tính năng giải phóng bộ nhớ tự động: `model_loader.clean_memory()` đã được tích hợp sau mỗi job.
4. Nếu chạy mô hình lớn (IDM-VTON), hãy chắc chắn biến môi trường `TRYON_PRECISION=fp16` trong file `.env`.

---

## 2. LỖI "MÁY CHỦ AI ĐANG NGOẠI TUYẾN" TRÊN GIAO DIỆN WEBSITE

### Triệu chứng:
Website thông báo: *"Máy chủ AI đang ngoại tuyến. Vui lòng chạy file 'ai-server/start_server.bat'..."*

### Giải pháp:
1. Kiểm tra xem file `start_server.bat` đã được mở và cửa sổ dòng lệnh có đang hiển thị `Uvicorn running on http://0.0.0.0:8000` hay không.
2. Kiểm tra nhanh bằng trình duyệt: gõ `http://127.0.0.1:8000/health`. Nếu trang trả về JSON `{"status": "healthy"}` là server đã sẵn sàng.
3. Nếu cổng 8000 bị chiếm dụng bởi phần mềm khác, đổi cổng trong `ai-server/.env`:
   ```env
   TRYON_PORT=8080
   ```
   Sau đó cập nhật cấu hình proxy trong `vite.config.ts` thành `target: 'http://127.0.0.1:8080'`.

---

## 3. ĐIỆN THOẠI KHÔNG TRUY CẬP ĐƯỢC VÀO WEBSITE QUA WI-FI

### Triệu chứng:
Điện thoại gõ `http://192.168.1.139:5173` báo lỗi *Không thể kết nối máy chủ* (Connection Timed Out).

### Giải pháp:
1. **Kiểm tra mạng Wi-Fi:** Đảm bảo điện thoại và máy tính RTX 3060 đang kết nối cùng một mạng Wi-Fi (tránh trường hợp 1 thiết bị dùng 4G/5G hoặc mạng Khách - Guest Network).
2. **Kiểm tra IP máy tính:** Địa chỉ IP có thể thay đổi sau khi khởi động lại router. Chạy lại `ipconfig` trên máy tính để lấy IP mới nhất.
3. **Cấu hình Windows Firewall:**
   Chạy lệnh PowerShell (Admin) để cấp quyền cho cổng 5173 và 8000 như hướng dẫn trong file `LAN_ACCESS_GUIDE.md`.

---

## 4. TỐC ĐỘ XỬ LÝ ẢNH CHẬM TRÊN CPU THAY VÌ GPU

### Triệu chứng:
Log hiển thị: `Không tìm thấy GPU CUDA. Hệ thống sẽ sử dụng CPU`.

### Giải pháp:
1. Đảm bảo driver NVIDIA đã cài đặt (khuyến nghị phiên bản 550.x hoặc mới hơn).
2. Cài đặt bản PyTorch hỗ trợ CUDA cho môi trường `.venv`:
   ```powershell
   ai-server\.venv\Scripts\activate
   pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124
   ```
3. Khởi động lại `start_server.bat` để server tự động phát hiện GPU RTX 3060.
