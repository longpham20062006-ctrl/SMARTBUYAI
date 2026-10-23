# HƯỚNG DẪN TRUY CẬP WEBSITE VÀ THỬ ĐỒ AI TỪ ĐIỆN THOẠI / LAPTOP TRONG MẠNG LAN / WI-FI

Tài liệu này hướng dẫn cách kết nối điện thoại thông minh, laptop hoặc máy tính bảng cùng mạng Wi-Fi tới máy tính để bàn (chạy GPU NVIDIA GeForce RTX 3060) để lướt web và thử đồ AI mượt mà.

---

## 1. MÔ HÌNH KẾT NỐI

```text
 [ Điện thoại iPhone / Android ]   [ Laptop cá nhân khác ]
                 │                            │
                 └──────────────┬─────────────┘
                                │ (Kết nối chung Wi-Fi)
                                ▼
         [ Máy tính Desktop (Core i5 / RTX 3060 12GB) ]
                  IP LAN: 192.168.1.139
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
   Website SMARTBUY AI (Port 5173)    FastAPI AI Server (Port 8000)
   (Vite dev server: 0.0.0.0)          (Inference trên GPU RTX 3060)
```

---

## 2. BƯỚC 1: XÁC ĐỊNH ĐỊA CHỈ IP LAN CỦA MÁY CHỦ RTX 3060

1. Trên máy tính RTX 3060, mở PowerShell hoặc Command Prompt.
2. Gõ lệnh:
   ```powershell
   ipconfig
   ```
3. Tìm mục **Wireless LAN adapter Wi-Fi** hoặc **Ethernet adapter**, ghi lại dòng `IPv4 Address`.
   * *Ví dụ hiện tại của máy tính này:* `192.168.1.139`

---

## 3. BƯỚC 2: MỞ CỔNG TƯỜNG LỬA WINDOWS FIREWALL (CHỈ MỞ 2 CỔNG CẦN THIẾT)

> **LƯU Ý AN TOÀN:** Tuyệt đối **KHÔNG TẮT** toàn bộ Windows Firewall. Chúng ta chỉ tạo một Rule cho phép cổng `5173` (Website) và `8000` (AI Server) trong mạng riêng tư (Private Network).

Chạy lệnh sau trong PowerShell với quyền **Run as Administrator**:

```powershell
# Cho phép cổng 5173 (Website SMARTBUY AI)
New-NetFirewallRule -DisplayName "SMARTBUY AI Web (Port 5173)" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow -Profile Private

# Cho phép cổng 8000 (AI Virtual Try-On Server)
New-NetFirewallRule -DisplayName "SMARTBUY AI Server (Port 8000)" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow -Profile Private
```

*(Nếu muốn gỡ bỏ sau này, chỉ cần chạy lệnh: `Remove-NetFirewallRule -DisplayName "SMARTBUY AI*"`)*

---

## 4. BƯỚC 3: KHỞI ĐỘNG CẢ 2 DỊCH VỤ

1. **Khởi động AI Server trên RTX 3060:**
   Mở terminal 1:
   ```cmd
   ai-server\start_server.bat
   ```
2. **Khởi động Website SMARTBUY AI:**
   Mở terminal 2 tại thư mục gốc `d:\SMARTBUYAI`:
   ```powershell
   npm run dev -- --host 0.0.0.0 --port 5173
   ```

---

## 5. BƯỚC 4: TRUY CẬP TỪ THIẾT BỊ KHÁC

1. Đảm bảo điện thoại hoặc laptop đã kết nối **chung mạng Wi-Fi** với máy chủ.
2. Mở trình duyệt web (Safari, Chrome) trên điện thoại hoặc laptop, nhập địa chỉ:
   ```text
   http://192.168.1.139:5173/virtual-try-on
   ```
3. Bạn có thể chụp ảnh trực tiếp bằng camera điện thoại, chọn áo/quần từ danh mục và nhấn **"Tạo ảnh thử đồ bằng AI"**.
4. Máy tính RTX 3060 sẽ tiếp nhận ảnh qua mạng Wi-Fi, xử lý trên GPU và trả ảnh kết quả hiển thị ngay trên màn hình điện thoại để bạn tải về!
