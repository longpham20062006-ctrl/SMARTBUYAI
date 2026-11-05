import { ServerlessTryOnAdapter } from './apiAdapter';
import { DemoModel, TryOnGarment, TryOnRequestPayload, TryOnResult, GarmentCategoryType } from '../types/tryOn';
import { MockRepo } from '@/mocks/repository';
import { Product } from '@/types';

// Danh sách người mẫu mẫu chuẩn phong cách Gen Z để người dùng thử đồ nhanh không cần upload ảnh riêng
export const DEMO_MODELS: DemoModel[] = [
  {
    id: 'model-nam-01',
    name: 'Minh Khang (Nam - Streetwear Fit)',
    gender: 'nam',
    heightCm: 178,
    weightKg: 68,
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'model-nam-02',
    name: 'Đức Huy (Nam - Oversized / Asian Fit)',
    gender: 'nam',
    heightCm: 174,
    weightKg: 64,
    imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'model-nu-01',
    name: 'Khánh Linh (Nữ - Casual Y2K)',
    gender: 'nu',
    heightCm: 165,
    weightKg: 49,
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'model-nu-02',
    name: 'Bảo Anh (Nữ - Chic Streetwear)',
    gender: 'nu',
    heightCm: 168,
    weightKg: 52,
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  },
];

// Chuyển đổi sản phẩm thật từ MockRepo thành TryOnGarment
export function productToTryOnGarment(prod: Product): TryOnGarment {
  let category: GarmentCategoryType = 'upper_body';
  const slug = prod.categorySlug?.toLowerCase() || '';

  if (slug === 'ao-khoac') {
    category = 'outerwear';
  } else if (slug === 'quan-jeans' || slug === 'quan-cargo-ong-rong') {
    category = 'lower_body';
  } else if (slug === 'chan-vay-dam') {
    category = 'dresses';
  } else if (slug === 'phu-kien') {
    category = 'accessories';
  } else {
    category = 'upper_body';
  }

  return {
    id: prod.id,
    name: prod.name,
    category,
    subCategory: prod.categorySlug,
    imageUrl: prod.images[0],
    thumbnailUrl: prod.images[0],
    brand: prod.brand,
    sku: prod.variants?.[0]?.sku || prod.slug,
    color: prod.colors?.[0]?.name,
  };
}

class TryOnService {
  private adapter: ServerlessTryOnAdapter;

  constructor() {
    this.adapter = new ServerlessTryOnAdapter();
  }

  isAiConfigured(): boolean {
    return this.adapter.isConfigured();
  }

  getProviderName(): string {
    return this.adapter.getProviderName();
  }

  getDemoModels(): DemoModel[] {
    return DEMO_MODELS;
  }

  /**
   * Lấy toàn bộ sản phẩm THỰC TẾ từ website đã được phân loại chuẩn
   */
  getAllRealGarments(): TryOnGarment[] {
    const products = MockRepo.getProducts();
    return products.map(productToTryOnGarment);
  }

  getGarmentByProductId(idOrSlug: string): TryOnGarment | undefined {
    const products = MockRepo.getProducts();
    const found = products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
    return found ? productToTryOnGarment(found) : undefined;
  }

  getGarmentsByCategory(category: GarmentCategoryType): TryOnGarment[] {
    return this.getAllRealGarments().filter((g) => g.category === category);
  }

  async runTryOn(
    payload: TryOnRequestPayload,
    signal?: AbortSignal
  ): Promise<TryOnResult> {
    return this.adapter.executeTryOn(payload, signal);
  }
}

export const tryOnService = new TryOnService();
