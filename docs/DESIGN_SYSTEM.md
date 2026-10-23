# DESIGN SYSTEM — SMARTBUY AI
> Định hướng thẩm mỹ: **PREMIUM STREETWEAR × MINIMALIST E-COMMERCE**
> Slogan: “Mặc chất theo cách riêng” — *“YOUR FIT. YOUR RULES.”*

---

## 1. Brand Identity & Art Direction
- **Triết lý thị giác**: Sự kết hợp hài hòa giữa thời trang đường phố cao cấp (Streetwear, Unisex, Oversized, Y2K) và thiết kế thương mại điện tử tối giản hiện đại (Minimalist E-commerce). Nền ấm nhẹ, bề mặt card trắng tinh khiết, kiểu chữ sắc nét và điểm nhấn violet `#8B5CF6` tinh tế, thay thế hoàn toàn màu neon chói mắt cũ.
- **Đối tượng khách hàng**: Gen Z, học sinh, sinh viên và người trẻ yêu thích thời trang streetwear hiện đại với mức giá dễ tiếp cận từ **79.000₫ – 449.000₫**.
- **Nguyên tắc màu sắc**: Không sử dụng màu neon quá gắt. Sử dụng hệ thống semantic design tokens đồng bộ trên cả trang Store và Admin Dashboard.

---

## 2. Bảng Màu Semantic Chuẩn (Design Tokens)

| Thành phần | Semantic Token | Mã Màu Hex | Ứng dụng & Quy chuẩn tương phản |
| :--- | :--- | :--- | :--- |
| **Background chính** | `bg-brand-bg` | `#FAFAF8` | Nền trang tổng thể, tạo cảm giác sang trọng và dịu mắt |
| **Background phụ** | `bg-brand-subtle` | `#F2F3F5` | Nền phụ, dải phân cách section, banner phụ, thanh lọc |
| **Surface / Card** | `bg-brand-surface` | `#FFFFFF` | Nền card sản phẩm, modal, drawer, dropdown, bảng dữ liệu |
| **Primary** | `bg-brand-primary` | `#18181B` | Màu thương hiệu chính, nút CTA chính, tiêu đề |
| **Primary Hover** | `bg-brand-primary-hover` | `#303036` | Trạng thái hover cho các thành phần primary |
| **Accent chính** | `bg-brand-accent` | `#8B5CF6` | Điểm nhấn chính (Violet), nút mua ngay, badge nổi bật |
| **Accent Hover** | `bg-brand-accent-hover` | `#7C3AED` | Trạng thái hover cho nút accent |
| **Accent nhẹ** | `bg-brand-accent-subtle` | `#F3E8FF` | Nền badge nhẹ, hover pill, highlight tìm kiếm |
| **Text chính** | `text-brand-text` | `#18181B` | Tiêu đề, tên sản phẩm, giá tiền chính |
| **Text phụ** | `text-brand-muted` | `#71717A` | Văn bản bổ trợ, mã SKU, breadcrumb, mô tả phụ |
| **Border** | `border-brand-border` | `#E4E4E7` | Đường viền mảnh chuẩn mực 1px |
| **Success** | `brand-success` | `#16A34A` | Trạng thái hoàn thành đơn hàng, thông báo thành công |
| **Error** | `brand-error` | `#DC2626` | Trạng thái lỗi, nút xóa dữ liệu, cảnh báo hủy đơn |
| **Warning** | `brand-warning` | `#D97706` | Trạng thái cảnh báo tồn kho thấp, đơn chờ xử lý |

---

## 3. Hệ Thống Nút Bấm & Tương Tác (Button System)

Tất cả các nút bấm kế thừa từ `src/components/ui/button.tsx` và tuân thủ các quy tắc micro-interaction:

- **Hover**:
  - Chuyển màu mượt mà trong `180–250ms` (`transition-all duration-200`).
  - Nâng nhẹ `1–2px` (`-translate-y-0.5`).
  - Đổ bóng nhẹ nhàng (`shadow-subtle` hoặc `shadow-accent`).
  - Không gây giật layout (`transform-gpu`).
- **Active**:
  - Phản hồi vật lý tức thì (`active:scale-[0.98]`).
- **Loading**:
  - Spinner xoay đều cân đối (`animate-spin`), kích thước chuẩn `w-4 h-4`.
  - Tự động chặn click đúp (`disabled={isLoading}`).
- **Disabled**:
  - `opacity-50 cursor-not-allowed pointer-events-none`.
  - Không kích hoạt hover giả hay gọi action ngoài ý muốn.
- **Accessibility**:
  - Focus ring rõ ràng: `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#8B5CF6]`.
  - Hỗ trợ đầy đủ điều hướng bằng bàn phím và chuẩn `prefers-reduced-motion`.

---

## 4. Modal, Drawer, Toast & ConfirmDialog

- **ConfirmDialog**:
  - Thay thế hoàn toàn `window.confirm()` đồng bộ trên toàn bộ dự án (`OrderDetailPage`, `AdminProductsPage`, `AdminCategoriesPage`, `AdminBrandsPage`, `AdminOrderDetailPage`, `AdminLayout`, `SiteFooter`).
  - Hỗ trợ variant `danger`, `primary`, `accent`, trạng thái `isLoading`, đóng mở mượt với ESC và click backdrop.
- **Modal & Drawer**:
  - Khóa cuộn trang nền (`document.body.style.overflow = 'hidden'`) khi đang mở.
  - Phân tầng z-index chuẩn: Modal: `z-50`, Toast: `z-60`.
  - Giữ nguyên dữ liệu form, khôi phục focus khi đóng.
- **Toast Notifications**:
  - Thông báo nổi nhẹ nhàng ở góc phải màn hình, tự đóng sau thời gian định sẵn, có thể đóng thủ công.

---

## 5. Responsive & Breakpoints

Toàn bộ layout được tối ưu và kiểm thử trên các kích thước chuẩn:
- **Mobile nhỏ (320px – 375px – 390px)**: Grid 2 cột sản phẩm gọn gàng, nút bấm tối thiểu 44px, drawer bộ lọc trượt từ dưới hoặc bên cạnh, không tràn ngang (`overflow-x-hidden`).
- **Tablet (768px – 1024px)**: Grid 3 cột, navigation chuyển đổi thông minh giữa mobile drawer và desktop links.
- **Desktop & Widescreen (1280px – 1440px – 1920px)**: Grid 4 cột, khoảng cách 24px, container tối đa `1400px` căn giữa chuẩn mực.
