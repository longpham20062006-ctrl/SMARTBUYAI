# SMARTBUY AI — JAVA SPRING BOOT BACKEND

Backend chính thức của nền tảng thương mại điện tử thời trang **SMARTBUY AI**.

## 1. Công nghệ sử dụng
- **Java**: OpenJDK 21/25 LTS
- **Framework**: Spring Boot 3.4.0
- **Modules**:
  - `spring-boot-starter-web` (REST APIs)
  - `spring-boot-starter-data-jpa` (Hibernate ORM, Transaction Management)
  - `spring-boot-starter-validation` (Bean Validation)
  - `spring-boot-starter-security` (Spring Security, BCrypt, Stateless JWT)
  - `springdoc-openapi-starter-webmvc-ui` (Swagger UI / OpenAPI 3.0)
  - `jjwt-api`, `jjwt-impl`, `jjwt-jackson` (0.12.6)
- **Database**:
  - Mặc định môi trường phát triển: **H2 Database** file persistence (`./data/smartbuydb`) — tự động lưu trữ, không cần cài đặt thêm.
  - Môi trường Production / Server: **PostgreSQL 17** (Cấu hình sẵn tại `application-postgres.yml`).

---

## 2. Cấu trúc thư mục Backend
```
backend/
├── pom.xml
├── build_backend.bat       # Script build và package Maven
├── start_backend.bat       # Script khởi động Backend Spring Boot
├── src/
│   ├── main/
│   │   ├── java/com/smartbuyai/
│   │   │   ├── SmartbuyAiApplication.java
│   │   │   ├── config/          # SecurityConfig, CorsConfig, OpenApiConfig
│   │   │   ├── controller/      # REST API Controllers (Product, Cart, Order, Wishlist, Auth, Stylist, TryOn, Admin)
│   │   │   ├── dto/             # Request & Response DTOs
│   │   │   ├── entity/          # JPA Entities (Product, Image, Variant, Cart, Order, User, TryOnJob...)
│   │   │   ├── exception/       # GlobalExceptionHandler, ResourceNotFoundException
│   │   │   ├── repository/      # Spring Data JPA Repositories
│   │   │   ├── security/        # JwtTokenProvider, JwtAuthenticationFilter
│   │   │   └── service/         # Business logic services & DataSeederService
│   │   └── resources/
│   │       ├── application.yml           # H2 persistence profile (default)
│   │       ├── application-postgres.yml  # PostgreSQL production profile
│   │       └── data/
│   │           └── importedProducts.json # Bộ dữ liệu 273 sản phẩm thực tế
```

---

## 3. Danh sách REST API Endpoints

### 🛒 Sản phẩm & Danh mục (Public)
- `GET /api/v1/products`: Lấy danh sách sản phẩm (hỗ trợ phân trang `page`, `size`, lọc `gender`, `category`, `q`, `minPrice`, `maxPrice`, sắp xếp `sort`).
- `GET /api/v1/products/{id}`: Xem chi tiết sản phẩm theo Product ID.
- `GET /api/v1/categories`: Danh mục thời trang chuẩn Nam/Nữ.

### 🛍️ Giỏ hàng (Cart)
- `GET /api/v1/cart?sessionId=...`: Lấy giỏ hàng theo User ID hoặc Session ID.
- `POST /api/v1/cart/items`: Thêm sản phẩm vào giỏ (xác thực giá thực tế tại máy chủ).
- `PATCH /api/v1/cart/items/{itemId}`: Cập nhật số lượng sản phẩm trong giỏ.
- `DELETE /api/v1/cart/items/{itemId}`: Xóa một mục khỏi giỏ hàng.
- `DELETE /api/v1/cart/{cartId}`: Xóa sạch toàn bộ giỏ hàng.

### ❤️ Wishlist (Yêu thích)
- `GET /api/v1/wishlist?userId=...`: Danh sách sản phẩm yêu thích.
- `POST /api/v1/wishlist`: Thêm/Xóa sản phẩm khỏi danh sách yêu thích (`{ productId, userId }`).

### 📦 Đơn hàng (Orders)
- `POST /api/v1/orders`: Đặt hàng mới (tính toán bảo mật giá, thuế và phí vận chuyển trên server).
- `GET /api/v1/orders/{orderId}`: Xem thông tin chi tiết đơn hàng.
- `GET /api/v1/orders/my-orders`: Lịch sử đơn hàng của người dùng.

### 🔐 Xác thực & Người dùng (Auth)
- `POST /api/v1/auth/login`: Đăng nhập cấp JWT Token.
- `POST /api/v1/auth/register`: Đăng ký tài khoản khách hàng mới.
- `GET /api/v1/auth/me`: Thông tin tài khoản người dùng đang đăng nhập.

### 🤖 Trợ lý AI Stylist
- `POST /api/v1/ai/stylist/recommend`: Đề xuất set đồ thời trang Gen Z phù hợp theo dịp, phong cách, ngân sách từ catalog thực tế.

### 🪞 AI Virtual Try-On Orchestrator
- `POST /api/v1/ai/try-on`: Điều phối tác vụ thử đồ AI sang Python Worker (GPU RTX 3060).
- `GET /api/v1/ai/try-on/{jobId}`: Kiểm tra trạng thái và nhận ảnh kết quả thử đồ.

### 🛡️ Quản trị viên (Admin - Yêu cầu ROLE_ADMIN)
- `GET /api/v1/admin/products`: Danh sách sản phẩm quản trị.
- `PUT /api/v1/admin/products/{id}/pricing`: Chỉnh sửa giá bán đã duyệt và tồn kho.

---

## 4. Hướng dẫn chạy

### Khởi động nhanh Backend trên Windows:
Chạy file script đã được cấu hình sẵn JDK 25 LTS:
```cmd
cd D:\SMARTBUYAI\backend
start_backend.bat
```
Backend sẽ tự động chạy tại `http://localhost:8080`.
- **Tài liệu OpenAPI / Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **H2 Web Console**: [http://localhost:8080/h2-console](http://localhost:8080/h2-console) (JDBC URL: `jdbc:h2:file:./data/smartbuydb`, User: `sa`, Password: để trống)

### Khởi động Frontend React:
```cmd
cd D:\SMARTBUYAI
npm run dev
```
Truy cập: [http://localhost:5173](http://localhost:5173). Mọi yêu cầu `/api/v1` sẽ tự động chuyển tiếp về Spring Boot.

### Build Production:
```cmd
cd D:\SMARTBUYAI\backend
build_backend.bat clean package -DskipTests
```
File thực thi nằm tại: `target/smartbuy-backend-1.0.0.jar`.
Chạy trên Server Production với PostgreSQL:
```bash
java -jar -Dspring.profiles.active=postgres target/smartbuy-backend-1.0.0.jar
```
