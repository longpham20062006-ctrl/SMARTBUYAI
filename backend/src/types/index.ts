export type UserRole = 'ADMIN' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  gender: string;
  description?: string;
  image?: string;
  itemCount: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  origin?: string;
  description?: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  colorName: string;
  colorHex: string;
  colorSlug?: string;
  size: string;
  price: number;
  stock: number;
  image: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  brandId: string;
  basePrice: number;
  originalPrice?: number;
  gender: 'nam' | 'nu' | 'unisex';
  material?: string;
  fit?: string;
  style?: string;
  careInstructions?: string;
  variants: ProductVariant[];
  isFeatured?: boolean;
  isActive: boolean;
  createdAt: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantSku: string;
  colorName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  code: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  finalAmount: number;
  status: OrderStatus;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  variantId: string;
  movementType: 'PURCHASE' | 'ORDER_DEDUCT' | 'ORDER_CANCEL_RESTORE' | 'MANUAL_ADJUST' | 'INVENTORY_AUDIT';
  quantityDelta: number;
  previousStock: number;
  newStock: number;
  orderId?: string;
  reason: string;
  createdAt: string;
}

