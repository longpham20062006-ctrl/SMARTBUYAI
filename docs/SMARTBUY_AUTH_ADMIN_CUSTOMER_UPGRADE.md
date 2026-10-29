# SMARTBUY AI — BÁO CÁO NÂNG CẤP XÁC THỰC, PHÂN QUYỀN & TÁCH BIỆT GIAO DIỆN (V4)

**Thời gian thực hiện**: 29/10/2026  
**Dự án**: `D:\SMARTBUYAI`  
**Kiến trúc**: React 18 + TypeScript + Vite | Java 21 + Spring Boot 3.4.0 + Spring Security  

---

## 1. TỔNG QUAN KIẾN TRÚC MỚI

Hệ thống đã được thiết kế lại hoàn chỉnh thành 3 trạng thái phân quyền độc lập, tách biệt layout và luồng hoạt động:

```
[Khách chưa đăng nhập]  ──> [AuthLayout] ──> /login (Chỉ form thủ công, không demo, không header shop)
                                │
          ┌─────────────────────┴─────────────────────┐
          ▼                                           ▼
[Customer Login]                            [Admin Login]
ROLE_CUSTOMER                               ROLE_ADMIN
       │                                           │
       ▼                                           ▼
[Intro 3D Điện ảnh]                        [Bỏ qua Intro 3D]
       │                                           │
       ▼                                           ▼
[CustomerLayout]                            [AdminLayout]
Route: / (Customer Home)                    Route: /admin (Admin Dashboard)
- Header sạch tối giản                      - Sidebar quản trị chuẩn Enterprise
- Ẩn thanh tìm kiếm lớn                     - Không header mua sắm
- Ẩn thanh danh mục ngang                   - Không giỏ hàng/wishlist khách
- Giữ link Khám phá Shop                    - KPI doanh thu, đơn hàng thời gian thực
- Shop (/products) giữ full Search/Filter   - Biểu đồ và liên kết trực tiếp trang quản lý
```

---

## 2. DANH SÁCH TỆP TIN ĐÃ THAY ĐỔI VÀ BỔ SUNG

### A. Phía Backend (Java Spring Boot)
1. **`backend/src/main/java/com/smartbuyai/config/SecurityConfig.java`**:
   - Bổ sung `authenticationEntryPoint` trả về HTTP 401 JSON khi người dùng chưa xác thực truy cập tài nguyên bảo vệ.
   - Bổ sung `accessDeniedHandler` trả về HTTP 403 JSON khi tài khoản Customer cố truy cập endpoint `/api/v1/admin/**`.
2. **`backend/src/main/java/com/smartbuyai/controller/AuthController.java`**:
   - Endpoint `GET /api/v1/auth/me`: Kiểm tra nghiêm ngặt `auth == null || !auth.isAuthenticated()`, trả về HTTP 401 Unauthorized thay vì tự động trả về tài khoản demo.
3. **`backend/src/main/java/com/smartbuyai/controller/AdminDashboardController.java`** *(Mới)*:
   - Endpoint `GET /api/v1/admin/dashboard/kpi`: Tính toán số liệu KPI thật từ cơ sở dữ liệu (tổng doanh thu, doanh thu thuần, phân bổ trạng thái đơn, cảnh báo tồn kho < 12 cái và hết hàng).
4. **`backend/src/main/java/com/smartbuyai/controller/AdminOrderController.java`** *(Mới)*:
   - Endpoint `GET /api/v1/admin/orders`: Lấy toàn bộ đơn hàng cho quản trị viên.
   - Endpoint `PATCH /api/v1/admin/orders/{id}/status`: Cập nhật trạng thái đơn hàng.
5. **`backend/src/main/java/com/smartbuyai/service/OrderService.java`**:
   - Bổ sung method `updateOrderStatus(orderId, newStatus)`.

### B. Phía Frontend (React + TypeScript)
1. **`src/components/layout/AuthLayout.tsx`** *(Mới)*:
   - Layout độc lập dành riêng cho `/login` và `/register`. Hoàn toàn không chứa `SiteHeader` mua sắm, không giỏ hàng, không thanh tìm kiếm hay sidebar quản trị.
2. **`src/features/auth/pages/LoginPage.tsx`**:
   - Loại bỏ hoàn toàn tài khoản/mật khẩu điền sẵn (`useState('')`).
   - Loại bỏ hoàn toàn nút bấm demo 1 chạm ("Khách hàng demo", "Quản trị viên (Admin)").
   - Loại bỏ cơ chế tự động khớp role theo chuỗi `@` hay `admin`.
   - Form đăng nhập thủ công chuẩn mực, có validation client và hiển thị thông báo lỗi từ server (`data-testid="login-error-alert"`).
   - Tích hợp gọi API Backend `/api/v1/auth/login`. Điều hướng chính xác theo role: Customer vào `/`, Admin vào `/admin`.
3. **`src/app/router.tsx`**:
   - Tách biệt `AuthLayout` cho `/login`, `/register`.
   - `StoreLayout` cho `/`, `/products`, `/collections`, `/cart`, v.v.
   - `AdminLayout` cho `/admin`, `/admin/dashboard`, `/admin/products`, `/admin/inventory`, `/admin/orders`, `/admin/users`, `/admin/pricing`.
4. **`src/components/layout/SiteHeader.tsx`**:
   - Loại bỏ chức năng chuyển vai trò demo ("Đổi vai trò demo").
   - Nhận diện `isHomePage = currentPath === '/'`:
     - Trên Home: Ẩn thanh tìm kiếm lớn ở giữa; thay bằng menu điều hướng tinh gọn ("Khám phá Shop", "Bộ sưu tập", "AI Try-On", "Về thương hiệu").
     - Trên Home: Ẩn hoàn toàn TẦNG 2 (thanh danh mục ngang Nam/Nữ/Unisex), không để lại khoảng trống.
     - Trên Shop (`/products`) và trang danh mục: Hiển thị đầy đủ thanh tìm kiếm lớn và thanh danh mục ngang.
5. **`src/features/home/pages/HomePage.tsx`**:
   - Bổ sung ràng buộc: Quản trị viên (Admin) tuyệt đối KHÔNG chạy Intro 3D (`if (user?.role === 'admin') return false;`).
   - Customer được kích hoạt Intro 3D điện ảnh khi bắt đầu phiên đăng nhập mới.
6. **`src/features/admin/dashboard/pages/DashboardPage.tsx`**:
   - Chuyển đổi các thẻ trạng thái đơn hàng ("Chờ duyệt", "Đã duyệt", "Đang giao", "Hoàn thành", "Đã hủy") thành các liên kết điều hướng trực tiếp: `/admin/orders?status=PENDING`, `/admin/orders?status=CONFIRMED`, v.v.
   - Thẻ cảnh báo tồn kho liên kết trực tiếp: `/admin/inventory?filter=low-stock` và `/admin/inventory?filter=out-of-stock`.
7. **`src/features/admin/orders/pages/AdminOrdersPage.tsx`**:
   - Tích hợp `useSearchParams` để tự động kích hoạt bộ lọc trạng thái khi người dùng nhấn vào thẻ từ Dashboard.
8. **`src/features/admin/inventory/pages/AdminInventoryPage.tsx`**:
   - Tích hợp `useSearchParams` và dropdown bộ lọc tồn kho (`low-stock`, `out-of-stock`, `all`).
9. **`src/components/common/ProductCard.tsx`**:
   - Gắn `data-testid="product-card"` hỗ trợ kiểm thử tự động chính xác.
10. **`src/mocks/repository.ts`**:
    - Chuẩn hóa hàm `login()` yêu cầu mật khẩu chính xác, không tự động gán tài khoản mẫu khi chuỗi chứa `@`.
    - Chuẩn hóa hàm `logout()` xóa sạch token, thông tin phiên và cờ intro.

---

## 3. KẾT QUẢ KIỂM THỬ XÁC MINH THEO YÊU CẦU

| STT | Kịch bản kiểm thử | Kỳ vọng | Kết quả thực tế | Trạng thái |
|:---:|:---|:---|:---|:---:|
| 1 | Chưa đăng nhập vào `/` | Chặn tại AuthGuard, chuyển hướng `/login` | Đã chuyển hướng `/login?redirect=%2F` | **PASS** |
| 2 | Màn hình Login | Form rỗng, không nút demo, không header shop | AuthLayout hiển thị độc lập, input rỗng | **PASS** |
| 3 | Nhập sai mật khẩu | Báo lỗi, không cho vào | Hiển thị: "Email hoặc mật khẩu không chính xác" | **PASS** |
| 4 | Đăng nhập Customer | Khách vào `/`, chạy Intro 3D | Kích hoạt Intro 3D và hiển thị Customer Home | **PASS** |
| 5 | Customer Home | Không thanh search lớn, không thanh danh mục ngang | Header tinh gọn, có link Khám phá Shop | **PASS** |
| 6 | Truy cập Shop (`/products`) | Đầy đủ Search bar và danh mục | Search bar hiển thị, nav danh mục hiển thị, 15+ sản phẩm | **PASS** |
| 7 | Customer truy cập `/admin` | Bị từ chối quyền truy cập | AuthGuard chuyển hướng về `/403` Forbidden | **PASS** |
| 8 | Đăng xuất Customer | Xóa sạch phiên, về `/login` | Xóa session, điều hướng về `/login` | **PASS** |
| 9 | Đăng nhập Admin | Chuyển thẳng `/admin`, không Intro 3D | Vào thẳng Dashboard, không Intro, không header khách | **PASS** |
| 10 | Admin Dashboard KPI | Hiển thị số liệu doanh thu, đơn, biểu đồ | Doanh thu, Đơn hàng, Biểu đồ SVG hiển thị chuẩn | **PASS** |
| 11 | Click thẻ "Chờ duyệt" | Mở trang Orders với filter PENDING | Chuyển đến `/admin/orders?status=PENDING` | **PASS** |
| 12 | Click thẻ "Sắp hết hàng" | Mở Inventory với filter low-stock | Chuyển đến `/admin/inventory?filter=low-stock` | **PASS** |
| 13 | Mobile iPhone (390x844) | Co giãn mượt mà, không lỗi vỡ | Layout responsive chuẩn mực trên viewport iPhone | **PASS** |
| 14 | API Backend Security | Unauthenticated: 401; Customer to Admin: 403 | Spring Security xác thực đúng 401 và 403 | **PASS** |

---

## 4. TÀI KHOẢN TRUY CẬP HỆ THỐNG

1. **Quản trị viên (Admin)**:
   - Email: `admin@smartbuy.vn`
   - Mật khẩu: `admin123`
   - Quyền: `ROLE_ADMIN`
   - Điều hướng: Vào thẳng `/admin` (Bảng Quản Trị Hệ Thống).

2. **Khách hàng (Customer)**:
   - Email: `khachhang@smartbuy.vn`
   - Mật khẩu: `123456`
   - Quyền: `ROLE_CUSTOMER`
   - Điều hướng: Chạy Intro 3D -> Vào `/` (Customer Home giới thiệu sạch đẹp).

