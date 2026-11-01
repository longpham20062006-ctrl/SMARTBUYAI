# SMARTBUY AI — Trải nghiệm Thử đồ online một ảnh

## Trải nghiệm khách hàng
1. Mở **sản phẩm** đang bán trên SMARTBUY AI (đã chọn màu/ảnh).
2. Bấm **Thử đồ online** ngay trong trang sản phẩm hoặc trên card sản phẩm.
3. Chọn **ảnh người của mình** hoặc dùng webcam chụp (tự động có ảnh sản phẩm, không có upload áo, mask hay thông số AI).
4. Bấm **Thử đồ ngay**. PC GPU xử lý FASHN VTON 1.5; laptop nhận ảnh về để so sánh/trải nghiệm và tải PNG.
5. Nếu ảnh lỗi, nhấn **Thử lại** (seed mới).

## Cấu trúc dự án THỰC TẾ
- Website hiện tại là React + **Vite** (`src/features/virtual-try-on/`). KHÔNG PHẢI Next.js.
- `src/features/virtual-try-on/components/ProductTryOn.tsx`: trang khách hàng đơn giản.
- `src/features/virtual-try-on/services/productTryOnApi.ts`: tự lấy binary ảnh sản phẩm có sẵn; gửi form hai ảnh cho FASHN.
- `vite.config.ts`: proxy `/api/smartfit/*` tới PC GPU `/api/v1/*`, API key chỉ trên Vite server.
- `src/features/virtual-try-on/pages/VirtualTryOnPage.tsx`: trang dùng ProductTryOn mới, giữ các URL `/virtual-try-on`, `/try-on`, `/ai-tryon`.
- `src/features/catalog/pages/ProductDetailPage.tsx`: nút thử đồ lấy màu/ảnh đang chọn, đã có link.
- `src/components/common/ProductCard.tsx`: nút thử đồ đã có link với product ID.

## A. Trên PC chứa GPU (cần Internet một lần để cài model)
- Giải nén gói **FASHN server cho RTX 3060 8GB** vào PC (nếu đã cài rồi thì tiếp tục dùng bản hiện có).
- Chạy `INSTALL.bat`, `DOWNLOAD_MODELS.bat` nếu lần đầu; khởi động `START_PC_LAPTOP.bat`.
- Dùng IP Tailscale của **PC** nếu laptop ở trường và PC ở nhà; dùng IP LAN riêng nếu hai máy cùng Wi-Fi.
- Giữ PC không Sleep và kết nối Internet khi demo khác mạng; KHÔNG mở port forwarding công khai.
- Trên PC API sức khỏe: `http://IP_PC:7860/api/v1/health` (thay IP_PC).
- Nếu dùng API key trong `START_PC_LAPTOP.bat`, ghi nhớ để dùng trên laptop.

## B. Trên laptop chạy website React/Vite
1. Yêu cầu Node.js mới tương thích Vite 8, và cài dependencies: `npm install`.
2. Sao chép `.env.smartfit.example` thành `.env.local`.
3. Sửa `SMARTFIT_BACKEND_URL=http://IP_RIENG_PC:7860` (KHÔNG phải localhost nếu PC khác máy).
4. Sửa `SMARTFIT_API_KEY` giống giá trị ở PC. **KHÔNG** dùng `VITE_SMARTFIT_API_KEY`: VITE_* sẽ lộ ra trình duyệt.
5. Chạy `npm run dev`, mở `http://localhost:5173` trên **laptop**. Không mở bằng IP LAN nếu cần webcam.
6. Kiểm tra kết nối bằng `http://localhost:5173/api/smartfit/health`: cần `cuda: true`.
7. Mở danh mục / sản phẩm, nhấn Thử đồ online và chọn ảnh người. Ảnh quần áo đã tự lấy từ website.

### Bảo mật và quyền riêng tư
- Chỉ nên dùng VPN Tailscale hoặc mạng riêng đáng tin cậy; firewall chỉ cho IP laptop.
- API key chỉ nằm trên server Vite / production reverse proxy, không nằm trong browser.
- Tuy nhiên Vite proxy dùng cho **demo local**, không phải backend public: chưa có user-bound job, quota per-account, CSRF, or per-user image access.
- Máy PC lưu ảnh và lịch sử của mô hình FASHN để phục vụ demo; hiện **không tự xóa ngay**. Cần quy định retention, nút xóa và xác thực khi triển khai thật cho khách hàng.
- `Dừng chờ` chỉ dừng kết nối trình duyệt, không hủy tác vụ GPU đã được xếp hàng. Điều này được mô tả đúng trong giao diện.
- Để đưa website lên production, cần proxy **server-side** (Caddy/Nginx/BFF), HTTPS, quyền truy cập theo người dùng và điều kiện giấy phép mô hình phù hợp sử dụng thương mại; không chỉ upload thư mục `dist` lên hosting tĩnh.

### Chất lượng hình ảnh
- Ảnh áo tự động lấy từ ảnh biến thể mà cửa hàng đã hiển thị. Ảnh sản phẩm được chụp **trên người mẫu** mặc định đưa vào FASHN với `photo_type=model`; ảnh có tên `flat-lay`, `packshot`, `isolated` dùng `flat-lay`.
- Để chính xác hơn với catalog có cả ảnh người mẫu và ảnh flat-lay, quản trị viên nên lưu thuộc tính `tryOnPhotoType` riêng cho từng ảnh. Người mua **không** cần chọn loại ảnh.
- FASHN VTON là AI sinh ảnh, có thể làm sai tay áo/tóc/logo; không cam kết ảnh hoàn hảo.
- Có thể cần chuẩn hóa ảnh sản phẩm trong hệ thống quản trị trước khi khách dùng, nhưng không bắt khách xử lý ảnh.

### Hỗ trợ danh mục
- Áo và áo khoác -> tops; quần/chân váy -> bottoms; đầm liền -> one-pieces.
- Phụ kiện, giày chưa được FASHN 1.5 hỗ trợ; không tự tuyên bố là thử được.
- Mỗi lượt xử lý một trang phục, không suy ra FASHN có thể phối nhiều món trong một lệnh.

## Thử nghiệm không cần GPU
Chạy `npm run build` để kiểm tra TypeScript và Vite. Muốn kiểm thử một lượt sinh ảnh thật cần PC RTX 3060 với checkpoint đã tải.
