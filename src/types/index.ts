export type GenderCategory = 'nam' | 'nu' | 'unisex';

export type FashionCategorySlug =
  | 'ao-thun'
  | 'ao-baby-tee'
  | 'ao-hoodie-sweater'
  | 'ao-so-mi-polo'
  | 'ao-khoac-bomber'
  | 'quan-jeans-baggy'
  | 'quan-cargo-parachute'
  | 'quan-short-jorts'
  | 'chan-vay-dam'
  | 'phu-kien'
  | 'ao-so-mi'
  | 'ao-polo'
  | 'quan-tay'
  | 'quan-jeans'
  | 'quan-short'
  | 'vay-dam'
  | 'chan-vay'
  | 'ao-khoac-blazer'
  | string;

export interface Category {
  id: string;
  name: string;
  slug: FashionCategorySlug | string;
  gender: GenderCategory[];
  description: string;
  image: string;
  itemCount: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  origin: string;
  description: string;
  logo?: string;
}

export interface Collection {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  bannerImage: string;
  thumbnail: string;
  season: string;
  isFeatured: boolean;
}

export interface ColorOption {
  id?: string;
  name: string;
  hex: string;
  slug: string;
  image?: string;
  images?: string[];
}

export type SizeCode = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'FreeSize' | 'Tiêu chuẩn' | string;

export interface ProductVariant {
  id: string;
  sku: string;
  color: ColorOption;
  colorId?: string;
  size: SizeCode;
  price: number;
  originalPrice?: number;
  stock: number;
  image?: string;
  isVerified?: boolean;
}

export interface SizeMeasurement {
  size: SizeCode;
  chest?: string;
  waist?: string;
  hip?: string;
  length?: string;
  shoulder?: string;
  fitHeight?: string;
  fitWeight?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categorySlug: FashionCategorySlug | string;
  gender: GenderCategory;
  brand: string;
  price: number;
  originalPrice?: number;
  shortDescription: string;
  description: string;
  material: string; // ví dụ: "100% Cotton hữu cơ Supima", "Vải Lanh Linen tự nhiên thoáng khí"
  fit: string; // ví dụ: "Regular Fit", "Relaxed Fit", "Tailored Fit", "Oversized"
  style: string; // ví dụ: "Tối giản", "Công sở", "Dạo phố", "Smart Casual"
  occasion: string[]; // ví dụ: ["Đi làm", "Hẹn hò", "Dự tiệc", "Hằng ngày"]
  season?: 'summer' | 'winter' | 'spring-autumn' | 'all' | string; // Bốn mùa thời trang
  seasons?: string[]; // Mảng các mùa: ['he', 'xuan-thu', 'dong']
  careInstructions: string[]; // ví dụ: ["Giặt máy chế độ nhẹ 30°C", "Ủi hơi nước nhiệt độ trung bình"]
  images: string[]; // Tối thiểu 2-4 ảnh thời trang 3:4 chân thực
  colors: ColorOption[];
  colorVariants?: any[];
  sizes: SizeCode[];
  variants: ProductVariant[];
  skuVariants?: any[];
  sizeMeasurements?: SizeMeasurement[];
  rating: number; // Điểm đánh giá (4.7 - 5.0)
  reviewCount: number;
  soldCount?: string | number; // Số lượng đã bán kiểu Shopee / TikTok Shop
  discountPercent?: number;
  needsReview?: boolean;
  duplicateGroup?: string;
  mergeStatus?: 'pending' | 'merged' | 'rejected';
  badge?: 'Mới' | 'Tuyển chọn' | 'Bán chạy' | 'Hữu cơ' | 'NEW' | 'DROP' | 'TRENDING' | 'UNISEX' | 'HOT' | 'SALE' | string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// Giỏ hàng
export interface CartItem {
  id: string; // variantId
  productId: string;
  productSlug: string;
  productName: string;
  brand: string;
  image: string;
  color: ColorOption;
  size: SizeCode;
  price: number;
  originalPrice?: number;
  quantity: number;
  maxStock: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
}

// Đơn hàng
export type OrderStatus =
  | 'PENDING'      // Chờ xác nhận
  | 'CONFIRMED'    // Đã duyệt
  | 'PROCESSING'   // Đang đóng gói
  | 'SHIPPED'      // Đang vận chuyển
  | 'COMPLETED'    // Đã giao hàng
  | 'CANCELLED';   // Đã hủy (hoàn tồn)

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  note?: string;
}

export interface OrderItem {
  variantId: string;
  productId: string;
  productName: string;
  brand: string;
  image: string;
  colorName: string;
  size: SizeCode;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string; // SB-2026-XXXX
  userId: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: 'COD' | 'DEMO_TRANSFER' | 'DEMO_MOMO';
  paymentStatus: 'PENDING' | 'PAID';
  orderStatus: OrderStatus;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// Người dùng
export type UserRole = 'guest' | 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  savedAddresses?: ShippingAddress[];
  preferences?: {
    gender?: GenderCategory;
    preferredSizes?: SizeCode[];
    preferredStyles?: string[];
  };
  createdAt: string;
}

// AI Stylist
export interface AIStylistFilterCriteria {
  gender?: GenderCategory;
  category?: string;
  style?: string;
  occasion?: string;
  colorTone?: string;
  maxBudget?: number;
  minBudget?: number;
  fit?: string;
}

export interface AIStylistMessage {
  id: string;
  sender: 'user' | 'stylist';
  text: string;
  timestamp: string;
  parsedCriteria?: AIStylistFilterCriteria;
  recommendedProducts?: Product[];
  explanation?: string;
  quickReplies?: string[];
}

// Inventory & Logs
export interface StockMovement {
  id: string;
  variantId: string;
  productName: string;
  sku: string;
  color: string;
  size: SizeCode;
  changeAmount: number; // dương hoặc âm
  newStock: number;
  reason: 'Nhập hàng mới' | 'Đặt hàng' | 'Hủy đơn hoàn kho' | 'Kiểm kê định kỳ' | 'Điều chỉnh thủ công';
  referenceId?: string; // mã đơn hàng nếu có
  createdAt: string;
  createdBy: string;
}
