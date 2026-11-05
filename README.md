# SMARTBUY AI FASHION
> **“Mặc theo cách của bạn”**  
> Nền tảng Thương mại Điện tử Thời trang Cao cấp & Trợ lý Phong cách AI Stylist & Thử Đồ Ảo AI.

---

## 1. Cấu Trúc Dự Án (4 Thư Mục Chuẩn - Monorepo)

Hệ thống được tổ chức thành 4 phân hệ độc lập, rõ ràng:

```
SMARTBUYAI/
├── 📁 frontend/              # Giao diện Khách hàng & Quản trị Admin (React 19 + Vite 8)
│   ├── src/                  # Mã nguồn React UI, Router, Features, Components
│   ├── public/               # Thư viện ảnh sản phẩm & assets
│   ├── index.html            # Entry point HTML
│   ├── vite.config.ts        # Proxy kép: /api/v1 (Backend) & /api/ai (AI Server)
│   └── package.json          # Dependencies frontend
│
├── 📁 backend/               # RESTful API Server nghiệp vụ (Express + TypeScript)
│   ├── src/                  # Server, App, Routes, Controllers, Services
│   ├── .env.example          # Mẫu biến môi trường Backend
│   └── package.json          # Dependencies backend
│
├── 📁 database/              # Cơ sở dữ liệu quan hệ (PostgreSQL 16)
│   ├── schema/               # Full DDL Schema (schema.sql)
│   ├── seeds/                # Dữ liệu ban đầu (Tài khoản, Danh mục, Thương hiệu)
│   ├── migrations/           # Quản lý phiên bản CSDL
│   └── docker-compose.yml    # Khởi chạy PostgreSQL 16 cục bộ 1-click
│
├── 📁 ai-server/             # Máy chủ AI Virtual Try-On (FastAPI + PyTorch GPU) [GIỮ NGUYÊN]
│   ├── app.py                # FastAPI Application (Port 8000)
│   ├── modules/, models/     # CatVTON, Human Parser, PyTorch CUDA
│   └── start_server.bat      # Script khởi chạy GPU RTX 3060 độc lập
│
├── 📁 docs/                  # Tài liệu hệ thống (API_CONTRACT, DESIGN_SYSTEM...)
├── 📁 scripts/               # Các script phân tích, quét ảnh sản phẩm
├── package.json              # Monorepo Root Script điều phối các service
└── README.md
```

---

## 2. Hướng Dẫn Khởi Chạy Nhanh

Tại thư mục gốc `SMARTBUYAI/`:

### A. Chạy Giao Diện (Frontend)
```bash
# Cài đặt (nếu chưa cài)
npm --prefix frontend install

# Chạy Frontend dev server (Port 5173)
npm run dev:fe
# hoặc: npm run dev
```

### B. Chạy Máy Chủ API (Backend)
```bash
# Cài đặt
npm --prefix backend install

# Chạy Backend server (Port 5000)
npm run dev:be
```

### C. Chạy Cơ Sở Dữ Liệu (Database)
```bash
cd database
docker compose up -d
```

### D. Chạy Máy Chủ AI Virtual Try-On (AI Server)
Nhấp đúp chuột vào file `ai-server/start_server.bat` hoặc:
```bash
npm run dev:ai
```

---

## 3. Danh Sách Tài Khoản Thử Nghiệm (Demo Accounts)

Hệ thống có sẵn tính năng chuyển đổi 1-chạm hoặc đăng nhập tại `/login`:

1. **Khách hàng Mặc định (Customer)**:
   - Email: `khachhang@smartbuy.vn`
   - Mật khẩu: `123456`
   - Quyền hạn: Xem catalog, chat AI Stylist, thử đồ ảo AI, giỏ hàng, đặt hàng, xem lịch sử đơn.

2. **Quản trị viên Hệ thống (Admin)**:
   - Email: `admin@smartbuy.vn`
   - Mật khẩu: `admin123`
   - Quyền hạn: Toàn quyền truy cập phân hệ `/admin` (Dashboard KPI doanh thu, Quản lý sản phẩm, Danh mục, Kho hàng, Duyệt/Hủy đơn).

---

## 4. Kiểm Tra Chất Lượng Mã Nguồn

```bash
# Linting mã nguồn
npm run lint

# Đóng gói sản phẩm (Production Build)
npm run build
```
