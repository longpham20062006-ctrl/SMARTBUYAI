# SMARTBUY AI - DATABASE MODULE

Mô-đun Cơ sở dữ liệu chuẩn quan hệ (Relational Database) cho hệ sinh thái Thương mại điện tử Thời trang SMARTBUY AI.

---

## 1. Cấu Trúc Thư Mục
- `schema/schema.sql`: Toàn bộ định nghĩa bảng (DDL), khóa ngoại, chỉ mục hiệu năng (Indexes), và ràng buộc toàn vẹn.
- `seeds/`: Dữ liệu ban đầu (Tài khoản mẫu, Danh mục, Thương hiệu, Sản phẩm thời trang).
- `migrations/`: Quản lý các phiên bản cập nhật cấu trúc cơ sở dữ liệu.
- `docker-compose.yml`: Khởi chạy nhanh PostgreSQL 16 qua Docker.

---

## 2. Hướng Dẫn Khởi Chạy Nhanh (Docker)

```bash
# Khởi chạy PostgreSQL 16
docker compose up -d

# Kiểm tra logs
docker compose logs -f postgres
```

### Thông số kết nối mặc định:
- **Host**: `localhost` (hoặc `127.0.0.1`)
- **Port**: `5432`
- **Database**: `smartbuy_fashion`
- **User**: `smartbuy`
- **Password**: `smartbuy_secret_password`
- **Connection String**: `postgresql://smartbuy:smartbuy_secret_password@localhost:5432/smartbuy_fashion`

