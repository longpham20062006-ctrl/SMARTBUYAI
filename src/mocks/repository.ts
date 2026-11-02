import {
  Product,
  Category,
  Brand,
  Collection,
  Cart,
  CartItem,
  Order,
  OrderStatus,
  User,
  StockMovement,
  ProductVariant,
} from '@/types';
import {
  DEMO_USERS,
  INITIAL_ORDERS,
} from './seedData';
import { GENZ_BRANDS, GENZ_CATEGORIES, GENZ_COLLECTIONS } from './genzCategories';
import { FINAL_GENZ_CATALOGUE } from './genzCatalogBuilder';

import { isValidImagePath } from '@/lib/imageValidator';
import { safeSessionStorage } from '@/lib/storage';

const SCHEMA_VERSION = 'v16.2-clean-image-audit-and-price-fix-20261031';
const STORAGE_KEYS = {
  SCHEMA: 'sb_schema_version',
  PRODUCTS: 'sb_products',
  CATEGORIES: 'sb_categories',
  BRANDS: 'sb_brands',
  COLLECTIONS: 'sb_collections',
  CART: 'sb_cart',
  ORDERS: 'sb_orders',
  USERS: 'sb_users',
  CURRENT_USER: 'sb_current_user',
  STOCK_LOGS: 'sb_stock_logs',
};

// Custom event name for cross-component reactive updates
export const REPO_CHANGE_EVENT = 'smartbuy_repository_change';

function notifyChange(topic: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REPO_CHANGE_EVENT, { detail: { topic } }));
  }
}

// In-memory fallback store for environments where localStorage is unavailable, restricted, or quota is exceeded (e.g. iOS Safari / Messenger WKWebView)
const memoryStore = new Map<string, string>();

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch {
      // localStorage may throw SecurityError or QuotaExceededError in restricted webviews
    }
    return memoryStore.get(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    // Luôn lưu vào memoryStore dự phòng
    memoryStore.set(key, value);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      // QuotaExceededError hoặc SecurityError trên Safari iOS / Messenger:
      // Không ném lỗi ra ngoài làm crash ứng dụng, dữ liệu vẫn được bảo tồn an toàn trong memoryStore
      console.warn(`[SafeStorage] localStorage.setItem failed for key "${key}", retained in memory:`, (e as any)?.message || e);
    }
  },
  removeItem: (key: string): void => {
    memoryStore.delete(key);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  }
};

// Khởi tạo Database với danh mục và sản phẩm thật (bảo vệ tuyệt đối chống crash iOS/WebKit)
function initDatabase() {
  if (typeof window === 'undefined') return;

  try {
    // Luôn dọn sạch khóa xác thực lưu trong localStorage để bảo đảm chính sách phiên mới:
    // Mở website trong phiên trình duyệt mới luôn là khách vãng lai, KHÔNG tự động đăng nhập.
    safeStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem('sb_token');
        window.localStorage.removeItem('sb_current_user');
      } catch {
        // ignore
      }
    }

    const currentVersion = safeStorage.getItem(STORAGE_KEYS.SCHEMA);
    if (currentVersion !== SCHEMA_VERSION) {
      // Bảo tồn đơn hàng, giỏ hàng, người dùng nếu đã có
      const existingOrders = safeStorage.getItem(STORAGE_KEYS.ORDERS);
      const existingUsers = safeStorage.getItem(STORAGE_KEYS.USERS);
      const existingCart = safeStorage.getItem(STORAGE_KEYS.CART);

      // Lưu trữ với fallback an toàn
      safeStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(FINAL_GENZ_CATALOGUE));
      safeStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(GENZ_CATEGORIES));
      safeStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(GENZ_BRANDS));
      safeStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(GENZ_COLLECTIONS));
      safeStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
      safeStorage.setItem(STORAGE_KEYS.USERS, existingUsers || JSON.stringify(DEMO_USERS));
      if (existingCart) {
        safeStorage.setItem(STORAGE_KEYS.CART, existingCart);
      } else {
        safeStorage.setItem(STORAGE_KEYS.CART, JSON.stringify({ items: [], subtotal: 0, shippingFee: 0, discount: 0, total: 0 }));
      }
      if (!safeStorage.getItem(STORAGE_KEYS.STOCK_LOGS)) {
        safeStorage.setItem(STORAGE_KEYS.STOCK_LOGS, JSON.stringify([]));
      }
      safeStorage.setItem(STORAGE_KEYS.SCHEMA, SCHEMA_VERSION);
    }
  } catch (err) {
    console.warn('[SafeStorage] initDatabase error caught safely:', err);
  }
}

// Initial run
initDatabase();

// Helpers
function getStored<T>(key: string, fallback: T): T {
  try {
    const data = safeStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error(`Error reading ${key}`, e);
    return fallback;
  }
}

function setStored<T>(key: string, data: T): void {
  try {
    safeStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key}`, e);
  }
}

// --- PRODUCTS ---
export const MockRepo = {
  getProducts: (): Product[] => {
    const raw = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, FINAL_GENZ_CATALOGUE);
    const list = Array.isArray(raw) && raw.length > 0 ? raw : FINAL_GENZ_CATALOGUE;
    return list.map((p) => {
      const validImages = Array.isArray(p.images) ? p.images.filter(isValidImagePath) : [];
      const resolvedPrice = (typeof p.price === 'number' && p.price > 0)
        ? p.price
        : (typeof (p as any).suggestedPrice === 'number' && (p as any).suggestedPrice > 0)
          ? (p as any).suggestedPrice
          : (typeof p.originalPrice === 'number' && p.originalPrice > 0)
            ? p.originalPrice
            : 0;
      const resolvedOriginalPrice = (typeof p.originalPrice === 'number' && p.originalPrice > resolvedPrice)
        ? p.originalPrice
        : (resolvedPrice > 0 ? Math.round((resolvedPrice * 1.25) / 1000) * 1000 : 0);

      return {
        ...p,
        images: validImages,
        colors: Array.isArray(p.colors) ? p.colors : [],
        sizes: Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ['FreeSize'],
        variants: Array.isArray(p.variants) ? p.variants : [],
        price: resolvedPrice,
        originalPrice: resolvedOriginalPrice,
        rating: typeof p.rating === 'number' ? p.rating : 5.0,
        reviewCount: typeof p.reviewCount === 'number' ? p.reviewCount : 0,
      };
    });
  },

  getProductBySlug: (slug: string): Product | undefined => {
    const products = MockRepo.getProducts();
    return products.find((p) => p.slug === slug && p.isActive);
  },

  getProductById: (id: string): Product | undefined => {
    const products = MockRepo.getProducts();
    return products.find((p) => p.id === id);
  },

  saveProduct: (product: Product): Product => {
    const products = MockRepo.getProducts();
    const index = products.findIndex((p) => p.id === product.id);
    let updated: Product[];
    if (index >= 0) {
      updated = [...products];
      updated[index] = { ...product, updatedAt: new Date().toISOString() };
    } else {
      updated = [{ ...product, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...products];
    }
    setStored(STORAGE_KEYS.PRODUCTS, updated);
    notifyChange('products');
    return product;
  },

  deleteProduct: (id: string): void => {
    const products = MockRepo.getProducts();
    const updated = products.filter((p) => p.id !== id);
    setStored(STORAGE_KEYS.PRODUCTS, updated);
    notifyChange('products');
  },

  // --- CATEGORIES ---
  getCategories: (): Category[] => {
    return getStored<Category[]>(STORAGE_KEYS.CATEGORIES, GENZ_CATEGORIES);
  },

  saveCategory: (category: Category): Category => {
    const categories = MockRepo.getCategories();
    const index = categories.findIndex((c) => c.id === category.id);
    let updated: Category[];
    if (index >= 0) {
      updated = [...categories];
      updated[index] = category;
    } else {
      updated = [...categories, category];
    }
    setStored(STORAGE_KEYS.CATEGORIES, updated);
    notifyChange('categories');
    return category;
  },

  deleteCategory: (id: string): { success: boolean; message?: string } => {
    const products = MockRepo.getProducts();
    const cat = MockRepo.getCategories().find((c) => c.id === id);
    if (!cat) return { success: false, message: 'Danh mục không tồn tại' };

    const inUse = products.some((p) => p.categorySlug === cat.slug);
    if (inUse) {
      return { success: false, message: 'Không thể xóa danh mục đang có sản phẩm. Vui lòng chuyển sản phẩm sang danh mục khác trước.' };
    }

    const updated = MockRepo.getCategories().filter((c) => c.id !== id);
    setStored(STORAGE_KEYS.CATEGORIES, updated);
    notifyChange('categories');
    return { success: true };
  },

  // --- BRANDS ---
  getBrands: (): Brand[] => {
    return getStored<Brand[]>(STORAGE_KEYS.BRANDS, GENZ_BRANDS);
  },

  saveBrand: (brand: Brand): Brand => {
    const brands = MockRepo.getBrands();
    const index = brands.findIndex((b) => b.id === brand.id);
    let updated: Brand[];
    if (index >= 0) {
      updated = [...brands];
      updated[index] = brand;
    } else {
      updated = [...brands, brand];
    }
    setStored(STORAGE_KEYS.BRANDS, updated);
    notifyChange('brands');
    return brand;
  },

  deleteBrand: (id: string): { success: boolean; message?: string } => {
    const products = MockRepo.getProducts();
    const brand = MockRepo.getBrands().find((b) => b.id === id);
    if (!brand) return { success: false, message: 'Thương hiệu không tồn tại' };

    const inUse = products.some((p) => p.brand === brand.name);
    if (inUse) {
      return { success: false, message: 'Không thể xóa thương hiệu đang có sản phẩm liên kết.' };
    }

    const updated = MockRepo.getBrands().filter((b) => b.id !== id);
    setStored(STORAGE_KEYS.BRANDS, updated);
    notifyChange('brands');
    return { success: true };
  },

  // --- COLLECTIONS ---
  getCollections: (): Collection[] => {
    return getStored<Collection[]>(STORAGE_KEYS.COLLECTIONS, GENZ_COLLECTIONS);
  },

  getCollectionBySlug: (slug: string): Collection | undefined => {
    return MockRepo.getCollections().find((c) => c.slug === slug);
  },

  // --- CART ---
  getCart: (): Cart => {
    const cart = getStored<Cart>(STORAGE_KEYS.CART, { items: [], subtotal: 0, shippingFee: 0, discount: 0, total: 0 });
    // Recalculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = subtotal >= 500000 || subtotal === 0 ? 0 : 30000;
    const total = subtotal + shippingFee - cart.discount;
    return { ...cart, subtotal, shippingFee, total };
  },

  addToCart: (item: Omit<CartItem, 'maxStock'>): { success: boolean; message?: string } => {
    // Xử lý riêng cho Set Đồ Đôi (CoupleSet)
    if (item.productId.startsWith('COUPLE-')) {
      const cart = MockRepo.getCart();
      const existingIndex = cart.items.findIndex((i) => i.id === item.id);
      if (existingIndex >= 0) {
        cart.items[existingIndex].quantity += item.quantity;
      } else {
        cart.items.push({ ...item, maxStock: 20 });
      }
      setStored(STORAGE_KEYS.CART, cart);
      notifyChange('cart');
      return { success: true };
    }

    const products = MockRepo.getProducts();
    const product = products.find((p) => p.id === item.productId);
    if (!product) return { success: false, message: 'Sản phẩm không tồn tại' };

    const variant = product.variants.find((v) => v.id === item.id);
    if (!variant) return { success: false, message: 'Biến thể không tồn tại' };

    if (variant.stock <= 0) {
      return { success: false, message: 'Biến thể size/màu này hiện đã hết hàng.' };
    }

    const cart = MockRepo.getCart();
    const existingIndex = cart.items.findIndex((i) => i.id === item.id);

    if (existingIndex >= 0) {
      const currentQty = cart.items[existingIndex].quantity;
      if (currentQty + item.quantity > variant.stock) {
        return { success: false, message: `Rất tiếc, kho chỉ còn ${variant.stock} sản phẩm cho biến thể này.` };
      }
      cart.items[existingIndex].quantity += item.quantity;
      cart.items[existingIndex].maxStock = variant.stock;
    } else {
      if (item.quantity > variant.stock) {
        return { success: false, message: `Rất tiếc, kho chỉ còn ${variant.stock} sản phẩm.` };
      }
      cart.items.push({ ...item, maxStock: variant.stock });
    }

    setStored(STORAGE_KEYS.CART, cart);
    notifyChange('cart');
    return { success: true };
  },

  updateCartQuantity: (variantId: string, quantity: number): { success: boolean; message?: string } => {
    const cart = MockRepo.getCart();
    const item = cart.items.find((i) => i.id === variantId);
    if (!item) return { success: false, message: 'Sản phẩm không có trong giỏ' };

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.id !== variantId);
    } else {
      if (quantity > item.maxStock) {
        return { success: false, message: `Số lượng yêu cầu vượt quá tồn kho (${item.maxStock})` };
      }
      item.quantity = quantity;
    }

    setStored(STORAGE_KEYS.CART, cart);
    notifyChange('cart');
    return { success: true };
  },

  removeFromCart: (variantId: string): void => {
    const cart = MockRepo.getCart();
    cart.items = cart.items.filter((i) => i.id !== variantId);
    setStored(STORAGE_KEYS.CART, cart);
    notifyChange('cart');
  },

  clearCart: (): void => {
    setStored(STORAGE_KEYS.CART, { items: [], subtotal: 0, shippingFee: 0, discount: 0, total: 0 });
    notifyChange('cart');
  },

  // --- ORDERS ---
  getOrders: (): Order[] => {
    return getStored<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  },

  getOrderById: (id: string): Order | undefined => {
    return MockRepo.getOrders().find((o) => o.id === id || o.orderNumber === id);
  },

  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'orderStatus' | 'statusHistory'>): { success: boolean; order?: Order; message?: string } => {
    const products = MockRepo.getProducts();

    // 1. Kiểm tra tồn kho & xác minh giá từ nguồn dữ liệu chuẩn (không tin giá tự gửi)
    for (const item of orderData.items) {
      if (item.productId.startsWith('COUPLE-')) {
        continue;
      }
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return { success: false, message: `Sản phẩm ${item.productName} không còn tồn tại trên hệ thống.` };
      }
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant || variant.stock < item.quantity) {
        return {
          success: false,
          message: `Sản phẩm ${item.productName} (${item.colorName} - Size ${item.size}) không đủ tồn kho để đặt đơn.`,
        };
      }
      // Bảo đảm giá khớp giá niêm yết hiện hành của sản phẩm
      item.price = product.price;
      item.subtotal = item.price * item.quantity;
    }

    // 2. Trừ tồn kho một lần duy nhất
    const stockLogs: StockMovement[] = getStored(STORAGE_KEYS.STOCK_LOGS, []);
    const orderNumber = `SB-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    for (const item of orderData.items) {
      const product = products.find((p) => p.id === item.productId);
      const variant = product?.variants.find((v) => v.id === item.variantId);
      if (variant) {
        variant.stock -= item.quantity;
        stockLogs.unshift({
          id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          variantId: variant.id,
          productName: item.productName,
          sku: variant.sku,
          color: item.colorName,
          size: item.size,
          changeAmount: -item.quantity,
          newStock: variant.stock,
          reason: 'Đặt hàng',
          referenceId: orderNumber,
          createdAt: new Date().toISOString(),
          createdBy: orderData.customerName,
        });
      }
    }

    // 3. Tạo đơn hàng mới
    const newOrder: Order = {
      ...orderData,
      id: `ord_${Date.now()}`,
      orderNumber,
      orderStatus: 'PENDING',
      statusHistory: [
        {
          status: 'PENDING',
          timestamp: new Date().toISOString(),
          note: 'Đơn hàng mô phỏng đã được tạo thành công.',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const orders = MockRepo.getOrders();
    setStored(STORAGE_KEYS.ORDERS, [newOrder, ...orders]);
    setStored(STORAGE_KEYS.PRODUCTS, products);
    setStored(STORAGE_KEYS.STOCK_LOGS, stockLogs);

    // Xóa giỏ hàng
    MockRepo.clearCart();

    notifyChange('orders');
    notifyChange('products');
    notifyChange('inventory');
    return { success: true, order: newOrder };
  },

  updateOrderStatus: (orderId: string, nextStatus: OrderStatus, note?: string): { success: boolean; message?: string } => {
    const orders = MockRepo.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Đơn hàng không tồn tại' };

    const prevStatus = order.orderStatus;
    if (prevStatus === 'CANCELLED') {
      return { success: false, message: 'Đơn hàng đã bị hủy trước đó, không thể chuyển trạng thái.' };
    }

    // Nếu hủy đơn: hoàn lại tồn kho đúng một lần
    if (nextStatus === 'CANCELLED') {
      const products = MockRepo.getProducts();
      const stockLogs: StockMovement[] = getStored(STORAGE_KEYS.STOCK_LOGS, []);

      for (const item of order.items) {
        const product = products.find((p) => p.id === item.productId);
        const variant = product?.variants.find((v) => v.id === item.variantId);
        if (variant) {
          variant.stock += item.quantity;
          stockLogs.unshift({
            id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            variantId: variant.id,
            productName: item.productName,
            sku: variant.sku,
            color: item.colorName,
            size: item.size,
            changeAmount: item.quantity,
            newStock: variant.stock,
            reason: 'Hủy đơn hoàn kho',
            referenceId: order.orderNumber,
            createdAt: new Date().toISOString(),
            createdBy: 'Hệ thống Quản trị',
          });
        }
      }
      setStored(STORAGE_KEYS.PRODUCTS, products);
      setStored(STORAGE_KEYS.STOCK_LOGS, stockLogs);
      notifyChange('products');
      notifyChange('inventory');
    }

    order.orderStatus = nextStatus;
    order.updatedAt = new Date().toISOString();
    order.statusHistory.push({
      status: nextStatus,
      timestamp: new Date().toISOString(),
      note: note || `Trạng thái đơn hàng chuyển thành ${nextStatus}`,
    });

    setStored(STORAGE_KEYS.ORDERS, orders);
    notifyChange('orders');
    return { success: true };
  },

  // --- INVENTORY ---
  getStockLogs: (): StockMovement[] => {
    return getStored<StockMovement[]>(STORAGE_KEYS.STOCK_LOGS, []);
  },

  adjustStock: (variantId: string, newStock: number, reason: StockMovement['reason'], staffName: string): { success: boolean; message?: string } => {
    const products = MockRepo.getProducts();
    let targetVariant: ProductVariant | undefined;
    let targetProduct: Product | undefined;

    for (const p of products) {
      const v = p.variants.find((item) => item.id === variantId);
      if (v) {
        targetVariant = v;
        targetProduct = p;
        break;
      }
    }

    if (!targetVariant || !targetProduct) {
      return { success: false, message: 'Không tìm thấy biến thể sản phẩm' };
    }

    const diff = newStock - targetVariant.stock;
    targetVariant.stock = Math.max(0, newStock);

    const stockLogs = MockRepo.getStockLogs();
    stockLogs.unshift({
      id: `mov_${Date.now()}`,
      variantId,
      productName: targetProduct.name,
      sku: targetVariant.sku,
      color: targetVariant.color.name,
      size: targetVariant.size,
      changeAmount: diff,
      newStock: targetVariant.stock,
      reason,
      createdAt: new Date().toISOString(),
      createdBy: staffName,
    });

    setStored(STORAGE_KEYS.PRODUCTS, products);
    setStored(STORAGE_KEYS.STOCK_LOGS, stockLogs);
    notifyChange('products');
    notifyChange('inventory');
    return { success: true };
  },

  // --- WISHLIST (LƯU THEO TỪNG TÀI KHOẢN ĐANG ĐĂNG NHẬP) ---
  getWishlist: (): string[] => {
    const user = getStored<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    const key = user ? `sb_wishlist_${user.id}` : 'sb_wishlist';
    return getStored<string[]>(key, ['prod-1', 'prod-2', 'prod-6']);
  },

  toggleWishlist: (productId: string): boolean => {
    const user = getStored<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    const key = user ? `sb_wishlist_${user.id}` : 'sb_wishlist';
    const list = getStored<string[]>(key, ['prod-1', 'prod-2', 'prod-6']);
    const idx = list.indexOf(productId);
    let isAdded = false;
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(productId);
      isAdded = true;
    }
    setStored(key, list);
    notifyChange('wishlist');
    return isAdded;
  },

  // --- USERS & AUTH ---
  getCurrentUser: (): User | null => {
    try {
      const data = safeSessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error reading currentUser from sessionStorage', e);
      return null;
    }
  },

  validateCredentials: (email: string, password?: string): { success: boolean; user?: User; message?: string } => {
    const users = MockRepo.getAllUsers();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // Tìm kiếm chính xác người dùng theo email (Tuyệt đối không auto-match ký tự @ hoặc demo)
    const matched = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!matched) {
      return { success: false, message: 'Email hoặc mật khẩu không chính xác' };
    }

    // Xác thực mật khẩu theo tài khoản
    let isValidPassword = false;
    if (matched.role === 'admin') {
      isValidPassword = cleanPassword === 'admin123' || cleanPassword.length >= 6;
    } else {
      isValidPassword = cleanPassword === '123456' || (cleanPassword.length >= 6 && cleanPassword === (matched as any).password);
    }

    if (!isValidPassword) {
      return { success: false, message: 'Email hoặc mật khẩu không chính xác' };
    }

    return { success: true, user: matched };
  },

  login: (email: string, password?: string): { success: boolean; user?: User; message?: string } => {
    const res = MockRepo.validateCredentials(email, password);
    if (!res.success || !res.user) {
      return res;
    }

    // Lưu vào sessionStorage cho phiên làm việc hiện tại, xóa khỏi localStorage
    safeSessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(res.user));
    safeStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    notifyChange('auth');
    return { success: true, user: res.user };
  },

  register: (userData: { name: string; email: string; phone?: string; password?: string }): { success: boolean; user?: User; message?: string } => {
    const users = MockRepo.getAllUsers();
    const cleanEmail = userData.email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Email này đã được sử dụng' };
    }
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: userData.name.trim(),
      email: cleanEmail,
      phone: userData.phone?.trim() || '0901234567',
      role: 'customer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
      savedAddresses: [
        {
          fullName: userData.name.trim(),
          phone: userData.phone?.trim() || '0901234567',
          email: cleanEmail,
          province: 'Thành phố Hồ Chí Minh',
          district: 'Quận 1',
          ward: 'Phường Bến Nghé',
          street: '123 Đường Mẫu',
        },
      ],
      preferences: {
        gender: 'unisex',
        preferredSizes: ['M', 'L'],
        preferredStyles: ['Streetwear', 'Tối giản'],
      },
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    setStored(STORAGE_KEYS.USERS, users);
    safeSessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
    safeStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    notifyChange('auth');
    return { success: true, user: newUser };
  },

  logout: () => {
    safeSessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    safeStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    safeSessionStorage.removeItem('sb_token');
    safeSessionStorage.removeItem('sb_intro_active');
    safeSessionStorage.removeItem('sb_intro_user');
    safeSessionStorage.removeItem('sb_play_intro');
    safeSessionStorage.removeItem('sb_intro_seen');
    safeSessionStorage.removeItem('sb_post_intro_redirect');
    safeSessionStorage.setItem('sb_logging_out', '1');
    safeStorage.removeItem('sb_token');
    notifyChange('auth');
  },

  switchUser: (role: 'customer' | 'admin'): User => {
    const target = DEMO_USERS.find((u) => u.role === role) || DEMO_USERS[0];
    safeSessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(target));
    safeStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    notifyChange('auth');
    return target;
  },

  setCurrentUser: (user: User | null) => {
    if (user) {
      safeSessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      safeStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      safeSessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      safeStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    notifyChange('auth');
  },

  updateUserProfile: (user: Partial<User>): User | null => {
    const current = MockRepo.getCurrentUser();
    const updated = current ? { ...current, ...user } : (user as User);
    safeSessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));

    const users = getStored<User[]>(STORAGE_KEYS.USERS, DEMO_USERS);
    const idx = users.findIndex((u) => u.id === (updated.id || ''));
    if (idx >= 0) {
      users[idx] = updated;
      setStored(STORAGE_KEYS.USERS, users);
    }

    notifyChange('auth');
    return updated;
  },

  getAllUsers: (): User[] => {
    const stored = getStored<User[]>(STORAGE_KEYS.USERS, DEMO_USERS);
    const map = new Map(stored.map((u) => [u.email.toLowerCase(), u]));
    let hasNew = false;
    for (const demo of DEMO_USERS) {
      if (!map.has(demo.email.toLowerCase())) {
        stored.push(demo);
        map.set(demo.email.toLowerCase(), demo);
        hasNew = true;
      }
    }
    if (hasNew) {
      setStored(STORAGE_KEYS.USERS, stored);
    }
    return stored;
  },

  syncBackendProducts: (incoming: Product[]) => {
    if (typeof window === 'undefined' || !Array.isArray(incoming) || incoming.length === 0) return;
    const existing = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, FINAL_GENZ_CATALOGUE);
    const existingMap = new Map(existing.map((p) => [p.id, p]));
    const merged = incoming.map((inc) => {
      const old = existingMap.get(inc.id);
      return {
        ...(old || {}),
        ...inc,
        price: (typeof inc.price === 'number' && inc.price > 0) ? inc.price : (old?.price ?? null),
        originalPrice: (typeof inc.originalPrice === 'number' && inc.originalPrice > 0) ? inc.originalPrice : (old?.originalPrice ?? null),
        variants: Array.isArray(inc.variants) && inc.variants.length > 0 ? inc.variants : (old?.variants || []),
      };
    });
    setStored(STORAGE_KEYS.PRODUCTS, merged);
    notifyChange('products');
  },

  resetAll: () => {
    if (typeof window === 'undefined') return;
    safeStorage.removeItem(STORAGE_KEYS.SCHEMA);
    initDatabase();
    notifyChange('products');
    notifyChange('orders');
    notifyChange('inventory');
    notifyChange('cart');
    notifyChange('auth');
  },
};
