/**
 * SMARTBUY AI — JAVA SPRING BOOT API CLIENT
 * Endpoint gốc: /api/v1 (chuyển tiếp tới http://localhost:8080 qua Vite Proxy)
 */

import { Product } from '@/types';
import { MockRepo } from '@/mocks/repository';

const API_BASE = '/api/v1';

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export const apiClient = {
  /**
   * Đồng bộ dữ liệu sản phẩm mới nhất từ Java Spring Boot Database vào ứng dụng
   */
  syncWithBackend: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/products?size=500`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) return false;
      const data: PagedResponse<Product> = await res.json();
      if (data && Array.isArray(data.content) && data.content.length > 0) {
        MockRepo.syncBackendProducts(data.content);
        return true;
      }
      return false;
    } catch {
      // Backend đang khởi động hoặc chưa kết nối - giữ nguyên trạng thái UI an toàn
      return false;
    }
  },

  /**
   * Lấy danh sách sản phẩm với phân trang và bộ lọc từ Java REST API
   */
  getProducts: async (params?: {
    gender?: string;
    category?: string;
    query?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<Product> | null> => {
    try {
      const q = new URLSearchParams();
      if (params?.gender && params.gender !== 'all') q.set('gender', params.gender);
      if (params?.category && params.category !== 'all') q.set('category', params.category);
      if (params?.query) q.set('q', params.query);
      if (params?.minPrice) q.set('minPrice', params.minPrice.toString());
      if (params?.maxPrice) q.set('maxPrice', params.maxPrice.toString());
      if (params?.sort) q.set('sort', params.sort);
      q.set('page', (params?.page ?? 0).toString());
      q.set('size', (params?.size ?? 40).toString());

      const res = await fetch(`${API_BASE}/products?${q.toString()}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Lấy chi tiết sản phẩm theo Product ID từ Java Backend
   */
  getProductById: async (id: string): Promise<Product | null> => {
    try {
      const res = await fetch(`${API_BASE}/products/${id}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Lấy danh mục chuẩn từ Java Backend
   */
  getCategories: async (): Promise<any[]> => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  /**
   * Quản lý giỏ hàng trên máy chủ Java
   */
  getCart: async (sessionId?: string) => {
    const q = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
    const res = await fetch(`${API_BASE}/cart${q}`);
    return res.ok ? await res.json() : null;
  },

  addToCart: async (data: {
    sessionId?: string;
    cartId?: string;
    productId: string;
    variantId?: string;
    size?: string;
    colorName?: string;
    quantity: number;
  }) => {
    const res = await fetch(`${API_BASE}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok ? await res.json() : null;
  },

  updateCartItem: async (itemId: number, quantity: number) => {
    const res = await fetch(`${API_BASE}/cart/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    return res.ok ? await res.json() : null;
  },

  removeCartItem: async (itemId: number) => {
    const res = await fetch(`${API_BASE}/cart/items/${itemId}`, {
      method: 'DELETE',
    });
    return res.ok ? await res.json() : null;
  },

  /**
   * Wishlist
   */
  getWishlist: async (userId: string = 'user-demo-1'): Promise<Product[]> => {
    try {
      const res = await fetch(`${API_BASE}/wishlist?userId=${encodeURIComponent(userId)}`);
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  },

  toggleWishlist: async (productId: string, userId: string = 'user-demo-1') => {
    const res = await fetch(`${API_BASE}/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, userId }),
    });
    return res.ok ? await res.json() : null;
  },

  /**
   * Tạo đơn hàng với kiểm tra giá phía máy chủ Java
   */
  createOrder: async (orderData: any) => {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Lỗi tạo đơn hàng' }));
      throw new Error(err.message || 'Lỗi tạo đơn hàng');
    }
    return await res.json();
  },

  /**
   * AI Stylist qua Java Spring Boot
   */
  getStylistRecommendation: async (req: {
    occasion: string;
    style: string;
    gender: string;
    budget?: number;
  }) => {
    const res = await fetch(`${API_BASE}/ai/stylist/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return res.ok ? await res.json() : null;
  },

  /**
   * AI Virtual Try-On qua Java Backend Orchestrator
   */
  submitTryOn: async (req: {
    modelImage: string;
    garmentImage: string;
    garmentType?: string;
  }) => {
    const res = await fetch(`${API_BASE}/ai/try-on`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return res.ok ? await res.json() : null;
  },

  getTryOnStatus: async (jobId: string) => {
    const res = await fetch(`${API_BASE}/ai/try-on/${jobId}`);
    return res.ok ? await res.json() : null;
  },

  /**
   * Quản trị sản phẩm và cập nhật giá đã duyệt
   */
  adminUpdatePrice: async (productId: string, price: number, stock?: number, token?: string) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/admin/products/${productId}/pricing`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ price, stock }),
    });
    return res.ok ? await res.json() : null;
  },
};
