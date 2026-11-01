# SmartFit AI — Demo trên laptop, xử lý GPU trên PC

Bản cập nhật này giữ toàn bộ AI Core FASHN VTON v1.5 và API job của bộ cũ. Điểm thay đổi: `app.py` chỉ cho phép lắng nghe trên **IP private cụ thể của PC** hoặc **IP Tailscale** (không cho `0.0.0.0`, không cho IP public); có `START_PC_LAPTOP.bat` để chạy.

## Phương án A — PC và laptop cùng Wi-Fi / cùng mạng riêng

1. PC Windows có RTX GPU: chạy `INSTALL.bat`, `DOWNLOAD_MODELS.bat` như cũ nếu chưa cài. Khởi động PC, **không để Sleep**, giữ cửa sổ server chạy.
2. Kiểm tra 2 máy cùng LAN và kết nối đến nhau (mạng Wi-Fi khách ở trường có thể bật client isolation). Trên **PC**, trong CMD `ipconfig`, tìm địa chỉ **IPv4** của Wi-Fi/Ethernet thực, ví dụ `192.168.1.10`. Trên **laptop**, `ipconfig`, ví dụ `192.168.1.20`.
3. Trên **PC**, chạy `START_PC_LAPTOP.bat`, nhập IP PC `192.168.1.10`. Bỏ trống API key **chỉ khi dùng demo trực tiếp trên mạng riêng tin cậy**. Nếu dùng Next.js ở laptop, nên đặt API key dài và nhập y hệt vào `.env.local` (chỉ ở phía server Next.js).
4. Cho phép **CHỈ laptop** truy cập port 7860 của PC trong Windows Firewall. Mở PowerShell **Run as Administrator** trên PC:

```powershell
New-NetFirewallRule -DisplayName "SmartFit Demo - laptop only" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 7860 -LocalAddress "192.168.1.10" -RemoteAddress "192.168.1.20" -Profile Any
```

Thay cả hai IP theo IP thật. Không tạo rule mở cho mọi thiết bị. Nếu trước đây đã bấm Allow cho Python trên mạng Public, hãy rà soát và tắt rule không cần thiết.

5. Trên laptop, kiểm tra `http://192.168.1.10:7860/api/v1/health`. Nếu trả JSON `ok` và `cuda: true` là laptop gọi được PC.
6. Cách demo nhanh: trên Chrome laptop mở `http://192.168.1.10:7860/web-demo/` (chỉ dùng khi key để trống), chọn ảnh và bấm Thử đồ. Trình duyệt gửi ảnh qua mạng tới PC, PC GPU xử lý, kết quả PNG hiển thị trên laptop.

### Nếu website Next.js chạy trên laptop

Các file `nextjs-integration/` đã có sẵn. Sao chép vào dự án Next.js (App Router). `.env.local` trên **laptop**, máy chạy **Next.js server**:

```env
SMARTFIT_BACKEND_URL=http://192.168.1.10:7860
SMARTFIT_API_KEY=chuoi-bi-mat-cung-gia-tri-da-nhap-tren-PC
```

Không dùng `localhost:7860` trong `SMARTFIT_BACKEND_URL` của laptop: localhost là laptop, không phải PC. Nếu demo trực tiếp không qua Next.js thì `.env.local` không cần. Sau khi đổi env phải restart Next.js (`npm run dev`).

- Browser laptop -> Next.js local -> PC:7860/api/v1/jobs -> GPU -> job status -> image proxy -> browser laptop.
- Trong trang Next.js, component `SmartFitTryOn` sử dụng các endpoint `/api/smartfit/*` của Next.js.
- Key chỉ nằm ở `.env.local` phía server, không dùng biến `NEXT_PUBLIC_...` cho key.

## Phương án B — PC ở nhà, laptop ở trường/hai mạng khác nhau

Nếu PC và laptop không cùng LAN, hãy cài Tailscale trên **cả hai** và đăng nhập vào cùng một tailnet. Tailscale cấp IP riêng ổn định `100.x.y.z` mỗi máy. Lấy IP **Tailscale của PC**, ví dụ `100.101.22.33` và IP **Tailscale laptop**, ví dụ `100.90.11.22`. Chạy `START_PC_LAPTOP.bat` trên PC và nhập **IP Tailscale PC**; tạo firewall rule dành riêng laptop (chạy PowerShell Admin trên PC):

```powershell
New-NetFirewallRule -DisplayName "SmartFit Demo - Tailscale laptop only" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 7860 -LocalAddress "100.101.22.33" -RemoteAddress "100.90.11.22" -Profile Any
```

Trên laptop đổi `.env.local` thành `SMARTFIT_BACKEND_URL=http://100.101.22.33:7860` nếu dùng Next.js, hoặc mở `http://100.101.22.33:7860/web-demo/` trực tiếp trong trường hợp mạng tin cậy và API key trống. Mạng Tailscale mã hóa đường truyền nhưng vẫn cần giới hạn các máy được phép truy cập.

**Quan trọng:** PC phải **đang bật, có mạng và không Sleep**, SmartFit server phải chạy. Không cần thuê cloud GPU; chỉ truyền ảnh qua kết nối mạng (mất Internet thì phương án hai địa điểm sẽ không hoạt động). Không cần port forwarding trên router.

## Kiểm thử trước ngày bảo vệ

- Trên **PC**: vào `http://127.0.0.1:7860/api/v1/health` (lệnh chạy trên IP riêng vẫn có thể không nghe ở 127.0.0.1; hãy dùng IP PC nhập lúc chạy).
- Trên **laptop**: PowerShell `Test-NetConnection -ComputerName 192.168.1.10 -Port 7860` (thay IP) phải báo `TcpTestSucceeded : True`.
- Demo trực tiếp: thử tạo ít nhất 3 ảnh thật và lưu lại kết quả mẫu. Nếu đứt mạng hoặc mất GPU, chỉ trình chiếu kết quả đã tạo và nói rõ đó là ví dụ đã lưu, không phải tạo trực tiếp.
- Gợi ý: PC dùng Ethernet, laptop Wi-Fi riêng; tắt Sleep bằng Settings, cắm nguồn. Không dùng Wi-Fi trường nếu các máy bị cách ly hoặc đường truyền yếu.

## Bảo mật và giới hạn

- Chỉ dùng mạng riêng tin cậy, giới hạn bằng Windows Firewall cho **IP laptop**, không mở port 7860 ra Internet và không port-forward.
- Với website cho người khác truy cập hoặc demo công khai, cần xác thực người dùng / phân quyền job và ảnh / giới hạn lượt gọi / HTTPS và reverse proxy; bộ này là **demo LAN/VPN** chứ không phải triển khai thương mại công khai.
- `API_KEY` chỉ bảo vệ API v1, không thay thế xác thực toàn bộ Studio/API legacy. Firewall/VPN là lớp giới hạn bắt buộc.
- URL ảnh người dùng và lịch sử không nên công khai nếu ảnh nhạy cảm; nên dùng ảnh mẫu được phép sử dụng.
- Xử lý inference vẫn trên PC. Bản vá không thay đổi trọng số mô hình hoặc tự khắc phục hoàn toàn lỗi hình ảnh trước đây.

## Webcam laptop

Bản vá có nút **Bật webcam laptop / Chụp ảnh** trong component `SmartFitTryOn.tsx` của Next.js. Trên laptop hãy mở giao diện bằng `http://localhost:3000` hoặc HTTPS; nhiều trình duyệt chặn webcam khi mở `http://192.168.x.x:7860/web-demo/` vì HTTP LAN không phải secure context. Ảnh tải lên vẫn hoạt động qua LAN.
