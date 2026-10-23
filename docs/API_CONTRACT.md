# API CONTRACT & SERVICE INTERFACES
# SMARTBUY AI FASHION

> Tài liệu đặc tả hợp đồng giao tiếp giữa Frontend và Backend trong tương lai.  
> Hiện tại toàn bộ được đóng gói qua `src/services/` và `src/mocks/repository.ts` (Mock Adapter). Khi kết nối Backend thật, chỉ cần thay đổi adapter mà không phải viết lại UI components.

---

## 1. Authentication & Users (`/api/v1/auth`, `/api/v1/users`)

### `GET /api/v1/auth/me`
- **Mô tả**: Lấy thông tin tài khoản người dùng hiện tại
- **Response**:
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "role": "customer | admin",
  "avatar": "string | null",
  "savedAddresses": [
    {
      "fullName": "string",
      "phone": "string",
      "email": "string",
      "province": "string",
      "district": "string",
      "ward": "string",
      "street": "string",
      "note": "string"
    }
  ],
  "preferences": {
    "gender": "nam | nu | unisex",
    "preferredSizes": ["S", "M", "L"],
    "preferredStyles": ["Tối giản", "Công sở"]
  }
}
```

---

## 2. Products & Catalog (`/api/v1/products`)

### `GET /api/v1/products`
- **Query Parameters**:
  - `gender`: `nam | nu | unisex | all`
  - `categorySlug`: string
  - `brand`: string
  - `minPrice`: number
  - `maxPrice`: number
  - `sizes`: string[]
  - `styles`: string[]
  - `occasions`: string[]
  - `inStockOnly`: boolean
  - `q`: string (Search query)
  - `sort`: `newest | price-asc | price-desc | name-asc | rating-desc`
- **Response**: `Product[]`

### `GET /api/v1/products/:slug`
- **Response**: `Product` (đầy đủ variants, bảng số đo, hướng dẫn bảo quản)

### `POST /api/v1/products` (Admin Only)
- **Body**: `Omit<Product, 'id' | 'createdAt' | 'updatedAt'>`
- **Response**: `Product`

---

## 3. Cart & Orders (`/api/v1/cart`, `/api/v1/orders`)

### `POST /api/v1/orders`
- **Body**:
```json
{
  "customerName": "string",
  "customerEmail": "string",
  "shippingAddress": {
    "fullName": "string",
    "phone": "string",
    "email": "string",
    "province": "string",
    "district": "string",
    "ward": "string",
    "street": "string",
    "note": "string"
  },
  "items": [
    {
      "variantId": "string",
      "productId": "string",
      "productName": "string",
      "brand": "string",
      "image": "string",
      "colorName": "string",
      "size": "string",
      "price": 520000,
      "quantity": 1,
      "subtotal": 520000
    }
  ],
  "subtotal": 520000,
  "shippingFee": 0,
  "totalAmount": 520000,
  "paymentMethod": "COD | DEMO_TRANSFER | DEMO_MOMO"
}
```
- **Response**:
```json
{
  "id": "ord_123456",
  "orderNumber": "SB-2026-8801",
  "orderStatus": "PENDING",
  "createdAt": "2026-10-22T00:00:00Z"
}
```

### `PATCH /api/v1/orders/:id/status` (Admin Only)
- **Body**: `{ "status": "CONFIRMED | PROCESSING | COMPLETED | CANCELLED", "note": "string" }`
- **Lưu ý nghiệp vụ**: Nếu trạng thái là `CANCELLED`, hệ thống Backend phải hoàn lại số lượng tồn kho tự động.

---

## 4. Inventory & Stock Logs (`/api/v1/inventory`)

### `POST /api/v1/inventory/adjust` (Admin Only)
- **Body**:
```json
{
  "variantId": "string",
  "newStock": 25,
  "reason": "Nhập hàng mới | Kiểm kê định kỳ | Điều chỉnh thủ công"
}
```
