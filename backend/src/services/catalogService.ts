import { Product, Category, Brand, Order, StockMovement } from '../types/index.js';

// In-memory persistent state for initial backend runtime
export class CatalogService {
  private static categories: Category[] = [
    {
      id: 'c-1',
      name: 'Áo sơ mi',
      slug: 'ao-so-mi',
      gender: 'unisex',
      description: 'Sơ mi Oxford, Linen và Lụa cao cấp với đường may tỉ mỉ, tôn dáng trong mọi khoảnh khắc.',
      image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=80',
      itemCount: 8,
    },
    {
      id: 'c-2',
      name: 'Áo thun & Polo',
      slug: 'ao-thun',
      gender: 'unisex',
      description: 'Cotton Supima 100% mềm mịn thoáng khí, không xù lông và giữ phom bền đẹp sau nhiều lần giặt.',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      itemCount: 7,
    },
    {
      id: 'c-3',
      name: 'Quần tây & Chino',
      slug: 'quan-tay',
      gender: 'unisex',
      description: 'Phom Relaxed và Tailored tôn dáng, đường xếp ly tinh tế phù hợp cả công sở và dạo phố.',
      image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80',
      itemCount: 6,
    },
    {
      id: 'c-4',
      name: 'Đầm & Váy liền',
      slug: 'dam-vay',
      gender: 'nu',
      description: 'Thiết kế bay bổng từ lụa tơ tằm và linen cao cấp, tôn vinh nét duyên dáng thanh lịch.',
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80',
      itemCount: 6,
    },
    {
      id: 'c-5',
      name: 'Áo khoác & Blazer',
      slug: 'ao-khoac',
      gender: 'unisex',
      description: 'Blazer may đo cấu trúc nhẹ, phom dáng hiện đại sang trọng.',
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop&q=80',
      itemCount: 5,
    },
  ];

  private static brands: Brand[] = [
    {
      id: 'b-1',
      name: 'Atelier Minimalist',
      slug: 'atelier-minimalist',
      origin: 'Việt Nam & Pháp',
      description: 'Thương hiệu theo đuổi phong cách tối giản đương đại với chất liệu cao cấp và phom dáng chuẩn mực.',
    },
    {
      id: 'b-2',
      name: 'The Urban Tailor',
      slug: 'the-urban-tailor',
      origin: 'Việt Nam',
      description: 'Nghệ thuật may đo may sẵn hiện đại, tối ưu cho vóc dáng người Việt trong môi trường công sở năng động.',
    },
    {
      id: 'b-3',
      name: 'Linen & Co.',
      slug: 'linen-and-co',
      origin: 'Pháp',
      description: 'Chuyên các trang phục dệt từ sợi lanh tự nhiên vùng Normandy, thoáng mát và tôn vinh vẻ đẹp nguyên bản.',
    },
  ];

  private static products: Product[] = [];
  private static orders: Order[] = [];
  private static stockMovements: StockMovement[] = [];

  static getCategories(): Category[] {
    return this.categories;
  }

  static getBrands(): Brand[] {
    return this.brands;
  }

  static getProducts(query?: { category?: string; gender?: string; search?: string }): Product[] {
    let list = [...this.products];
    if (query?.category) {
      list = list.filter((p) => p.categoryId === query.category);
    }
    if (query?.gender) {
      list = list.filter((p) => p.gender === query.gender || p.gender === 'unisex');
    }
    if (query?.search) {
      const term = query.search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
    }
    return list;
  }

  static getProductBySlug(slug: string): Product | undefined {
    return this.products.find((p) => p.slug === slug);
  }

  static getOrders(): Order[] {
    return this.orders;
  }

  static getOrderById(id: string): Order | undefined {
    return this.orders.find((o) => o.id === id || o.code === id);
  }

  static createOrder(orderData: Omit<Order, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Order {
    const code = `SB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      code,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.orders.unshift(newOrder);
    return newOrder;
  }

  static updateOrderStatus(id: string, status: Order['status']): Order | undefined {
    const order = this.orders.find((o) => o.id === id || o.code === id);
    if (!order) return undefined;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    return order;
  }
}

