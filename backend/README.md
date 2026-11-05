# SMARTBUY AI - BACKEND MODULE

Hệ thống API Server RESTful theo chuẩn [API_CONTRACT.md](../docs/API_CONTRACT.md).

---

## 1. Cấu Trúc
- `src/server.ts`: Điểm khởi chạy chính (Port 5000).
- `src/app.ts`: Cấu hình Express, CORS, Middlewares.
- `src/routes/`: Bộ điều hướng các endpoint `/api/v1/auth`, `/api/v1/products`, `/api/v1/orders`...
- `src/services/`: Nghiệp vụ trừ tồn kho, tính toán đơn hàng.
- `src/config/`: Biến môi trường và cấu hình kết nối.

---

## 2. Khởi Chạy Nhanh

```bash
# 1. Cài đặt dependencies
npm install

# 2. Khởi chạy ở chế độ phát triển
npm run dev

# 3. Đóng gói production
npm run build
npm start
```

