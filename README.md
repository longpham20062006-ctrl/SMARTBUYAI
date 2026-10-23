# SMARTBUY AI FASHION
> **“Mặc theo cách của bạn”**  
> Nền tảng Thương mại Điện tử Thời trang Cao cấp & Trợ lý Phong cách AI Stylist Thông minh.

---

## 1. Giới Thiệu Dự Án
**SMARTBUY AI** là ứng dụng web thương mại điện tử chuyên ngành **THỜI TRANG** (Nam, Nữ, Unisex), được xây dựng theo định hướng **Frontend-First**, phong cách **Modern Fashion Editorial + Warm Contemporary Minimalism**.

### Các Điểm Nổi Bật:
- **Ngôn ngữ thuần Việt**: 100% tiếng Việt tự nhiên, đầy đủ dấu, chuẩn định dạng tiền tệ VND (`520.000 ₫`) và giờ Việt Nam.
- **Dữ liệu thời trang thuần khiết**: Không có dữ liệu lai tạp thiết bị điện tử. Mô tả chuẩn chỉ về chất liệu (Linen, Cotton Supima, Lụa tơ tằm, Tencel), phom dáng (Regular, Relaxed, Tailored), bảng số đo kích cỡ (Size Guide) và hướng dẫn bảo quản.
- **Single Source of Truth**: Toàn bộ luồng lọc, tìm kiếm, so sánh, giỏ hàng, đặt đơn, trừ tồn kho và bảng quản trị Admin đều đọc/ghi từ một Mock Repository chung, lưu bền vững sau refresh (kèm lưu trữ ảnh bằng IndexedDB).
- **Trợ lý AI Stylist nội bộ**: Tư vấn gợi ý phối đồ dựa trên phân tích ngôn ngữ tự nhiên từ catalog thật.
- **Không phụ thuộc Backend**: Chạy hoàn toàn độc lập trong trình duyệt, sẵn sàng trình diễn như một sản phẩm thật.

---

## 2. Hướng Dẫn Khởi Chạy Nhanh

### Yêu cầu môi trường:
- Node.js version 18 trở lên (đã kiểm thử tương thích tốt trên Node v24).
- Trình duyệt hiện đại (Chrome, Edge, Firefox, Safari).

### Cài đặt và Chạy:
```bash
# 1. Cài đặt các thư viện phụ thuộc
npm install

# 2. Khởi động môi trường phát triển (Dev Server)
npm run dev

# Ứng dụng sẽ khả dụng tại: http://localhost:5173/ (hoặc http://127.0.0.1:5173/)
```

### Đóng gói Sản phẩm (Production Build):
```bash
npm run build
npm run preview
```

---

## 3. Danh Sách Tài Khoản Thử Nghiệm (Demo Accounts)

Hệ thống có sẵn tính năng chuyển đổi 1-chạm hoặc đăng nhập tại `/login`:

1. **Khách hàng Mặc định (Customer)**:
   - Email: `khachhang@smartbuy.vn`
   - Mật khẩu: `123456`
   - Quyền hạn: Xem catalog, chat AI Stylist, so sánh, quản lý giỏ hàng, đặt hàng mô phỏng, xem lịch sử đơn của cá nhân.

2. **Quản trị viên Hệ thống (Admin)**:
   - Email: `admin@smartbuy.vn`
   - Mật khẩu: `admin123`
   - Quyền hạn: Toàn quyền truy cập phân hệ `/admin` (Dashboard KPI doanh thu, Thêm/Sửa/Ẩn sản phẩm, Quản lý danh mục & thương hiệu, Điều chỉnh tồn kho biến thể, Duyệt/Hủy đơn hàng).

---

## 4. Kịch Bản Trải Nghiệm Mẫu (Demo Flows)

1. **Hành trình Mua sắm (Customer Journey)**:
   - Mở Trang chủ `/` -> Lướt qua 8 section thời trang biên tập -> Xem dải danh mục.
   - Bấm vào một sản phẩm -> Xem ảnh lớn, chọn màu sắc (đổi ảnh/giá), chọn kích cỡ -> Mở "Bảng số đo kích thước".
   - Bấm **"Thêm vào giỏ"** -> Giỏ hàng trượt ra từ bên phải kèm thanh tính Freeship từ 500k.
   - Bấm **"Thanh toán ngay"** -> Điền địa chỉ nhận hàng -> Chọn COD -> Bấm Đặt hàng -> Nhận mã đơn `SB-2026-XXXX`.
   - Vào `/orders` kiểm tra trạng thái đơn hàng.

2. **Hành trình Quản trị (Admin Journey)**:
   - Bấm vào menu tài khoản -> Chọn **"Vào trang Quản trị (Admin)"**.
   - Xem Dashboard: KPI doanh thu nhảy số theo các đơn vừa đặt, cảnh báo biến thể sắp hết hàng.
   - Vào `/admin/orders`: Bấm duyệt đơn hàng từ `PENDING` sang `CONFIRMED` hoặc `PROCESSING`.
   - Vào `/admin/inventory`: Xem tồn kho theo từng SKU, thử bấm "Điều chỉnh tồn" để cập nhật số lượng nhập mới.
   - Vào `/admin/products/new`: Đăng thử một thiết kế mới (có hỗ trợ upload ảnh máy tính lưu vào IndexedDB).
   - Quay lại Cửa hàng Khách: Sản phẩm mới ngay lập tức xuất hiện trên catalog!

3. **Trải nghiệm Trợ lý AI Stylist**:
   - Truy cập `/ai-stylist` (hoặc nhập câu hỏi ngay ô chat tại Trang chủ).
   - Nhập: *"Tìm áo sơ mi nam đi làm dưới 600k"* hoặc *"Đầm lụa dự tiệc cho nữ"*.
   - Trợ lý AI Stylist sẽ tự động phân tích và đưa ra các thiết kế khớp chính xác từ catalog.

---

## 5. Cấu Trúc Thư Mục Chuẩn Mực

```
SMARTBUY-AI/
├── public/assets/             # Favicon và tài nguyên tĩnh
├── src/
│   ├── app/                   # Router tập trung toàn bộ các routes
│   ├── components/
│   │   ├── ui/                # Button, Input, Modal, Drawer, Toast, Badge
│   │   ├── layout/            # SiteHeader, SiteFooter, StoreLayout, AdminLayout
│   │   └── common/            # ProductCard, ColorSwatch, SizeSelector, CartDrawer, QuickViewModal
│   ├── features/
│   │   ├── home/              # Trang chủ Editorial
│   │   ├── catalog/           # Danh mục sản phẩm & Chi tiết thiết kế
│   │   ├── collections/       # Chiến dịch & Lookbook
│   │   ├── cart/ & checkout/  # Giỏ hàng & Thanh toán nhiều bước
│   │   ├── orders/            # Lịch sử & Chi tiết đơn hàng
│   │   ├── compare/           # Bảng so sánh 2-4 sản phẩm
│   │   ├── ai-stylist/        # Trợ lý phong cách chat mô phỏng
│   │   ├── auth/ & account/   # Đăng nhập, đăng ký, thông tin thành viên
│   │   ├── info/              # Bảng kích cỡ (Size guide), 403, 404
│   │   └── admin/             # Phân hệ Dashboard, Products, Categories, Brands, Inventory, Orders, Users
│   ├── mocks/                 # Single Source of Truth (Mock Repository, Seed Data, IndexedDB)
│   ├── services/              # Service contract tách biệt sẵn sàng nối API sau
│   ├── styles/                # CSS tokens, Tailwind directives
│   └── types/                 # Toàn bộ TypeScript Interfaces
├── docs/
│   ├── DESIGN_SYSTEM.md       # Quy chuẩn thiết kế, bảng màu, typography
│   ├── FRONTEND_ACCEPTANCE.md # Bảng nghiệm thu tính năng & báo cáo kiểm thử
│   └── API_CONTRACT.md        # Hợp đồng API sẵn sàng cho Backend
├── ASSET_CREDITS.md           # Nguồn gốc giấy phép hình ảnh và phông chữ
└── README.md
```
