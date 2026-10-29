import { MockRepo } from '@/mocks/repository';
import { Product } from '@/types';
import { CATEGORY_DEFINITIONS } from '@/constants/categories';

export interface ProductFilterOptions {
  gender?: string; // 'nam' | 'nu' | 'unisex' | 'all'
  categorySlug?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  sizes?: string[];
  materials?: string[];
  fits?: string[];
  styles?: string[];
  occasions?: string[];
  season?: string; // 'he' | 'dong' | 'xuan-thu' | 'all'
  seasons?: string[];
  inStockOnly?: boolean;
  searchQuery?: string;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'name-asc' | 'rating-desc';
}

export interface ShopTheLookOutfit {
  id: string;
  title: string;
  style: string;
  tagline: string;
  lookImage: string;
  items: Product[];
  discountPercent?: number;
}

export const productService = {
  getAll: (filters?: ProductFilterOptions): Product[] => {
    let list = MockRepo.getProducts().filter((p) => p.isActive);

    if (!filters) return list;

    // Search query
    if (filters.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.material && p.material.toLowerCase().includes(q)) ||
          (p.style && p.style.toLowerCase().includes(q)) ||
          (p.shortDescription && p.shortDescription.toLowerCase().includes(q))
      );
    }

    // Gender: Strict separation between Nam and Nữ per Requirement 3
    if (filters.gender && filters.gender !== 'all') {
      const targetGender = filters.gender.toLowerCase();
      list = list.filter((p) => p.gender === targetGender);
    }

    // Category & Parent Group matching
    if (filters.categorySlug && filters.categorySlug !== 'all') {
      const cat = filters.categorySlug.toLowerCase();
      list = list.filter((p) => {
        if (p.categorySlug === cat) return true;
        // Check if cat is a parent group (e.g. 'ao' -> matches all ao categories)
        const meta = CATEGORY_DEFINITIONS[p.categorySlug];
        if (meta && meta.parentGroup === cat) return true;
        return false;
      });
    }

    // Brand
    if (filters.brand && filters.brand !== 'all') {
      list = list.filter((p) => p.brand === filters.brand);
    }

    // Price range
    if (typeof filters.minPrice === 'number') {
      list = list.filter((p) => p.price >= filters.minPrice!);
    }
    if (typeof filters.maxPrice === 'number') {
      list = list.filter((p) => p.price <= filters.maxPrice!);
    }

    // Colors
    if (filters.colors && filters.colors.length > 0) {
      list = list.filter((p) => Array.isArray(p.colors) && p.colors.some((c) => filters.colors!.includes(c.slug)));
    }

    // Sizes
    if (filters.sizes && filters.sizes.length > 0) {
      list = list.filter((p) => Array.isArray(p.sizes) && p.sizes.some((s) => filters.sizes!.includes(s)));
    }

    // Fits
    if (filters.fits && filters.fits.length > 0) {
      list = list.filter((p) => p.fit && filters.fits!.some((f) => p.fit.toLowerCase().includes(f.toLowerCase())));
    }

    // Styles
    if (filters.styles && filters.styles.length > 0) {
      list = list.filter((p) => p.style && filters.styles!.some((s) => p.style.toLowerCase().includes(s.toLowerCase())));
    }

    // Materials
    if (filters.materials && filters.materials.length > 0) {
      list = list.filter((p) => p.material && filters.materials!.some((m) => p.material.toLowerCase().includes(m.toLowerCase())));
    }

    // Seasons (Bốn mùa thời trang)
    if (filters.season && filters.season !== 'all') {
      const s = filters.season.toLowerCase();
      const matchTag = s === 'summer' ? 'he' : s === 'winter' ? 'dong' : s === 'spring-autumn' ? 'xuan-thu' : s;
      list = list.filter((p) => {
        // 1. Ưu tiên kiểm tra mảng seasons đa mùa
        if (p.seasons && Array.isArray(p.seasons)) {
          return p.seasons.includes(matchTag) || p.seasons.includes(s);
        }
        // 2. Kiểm tra thuộc tính season
        if (p.season) {
          const pSeason = p.season.toLowerCase();
          if (pSeason === 'all') return true;
          if (matchTag === 'he' && (pSeason === 'he' || pSeason === 'summer')) return true;
          if (matchTag === 'dong' && (pSeason === 'dong' || pSeason === 'winter')) return true;
          if (matchTag === 'xuan-thu' && (pSeason === 'xuan-thu' || pSeason === 'spring-autumn')) return true;
        }
        return false;
      });
    }

    // Occasions
    if (filters.occasions && filters.occasions.length > 0) {
      list = list.filter((p) => Array.isArray(p.occasion) && p.occasion.some((o) => filters.occasions!.includes(o)));
    }

    // In Stock Only
    if (filters.inStockOnly) {
      list = list.filter((p) => Array.isArray(p.variants) && p.variants.some((v) => v.stock > 0));
    }

    // Sorting
    switch (filters.sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
        break;
      case 'rating-desc':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
      default:
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    // Đảm bảo nguyên tắc: Mỗi Product ID chỉ xuất hiện duy nhất 1 lần trong danh sách
    const seenIds = new Set<string>();
    const deduplicatedList: Product[] = [];
    for (const p of list) {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        deduplicatedList.push(p);
      }
    }

    return deduplicatedList;
  },

  getBySlug: (slug: string): Product | undefined => {
    return MockRepo.getProductBySlug(slug);
  },

  getRelated: (product: Product, limit: number = 4): Product[] => {
    return MockRepo.getProducts()
      .filter((p) => p.id !== product.id && p.isActive && (p.categorySlug === product.categorySlug || p.brand === product.brand))
      .slice(0, limit);
  },

  getHotProducts: (limit: number = 8): Product[] => {
    const all = MockRepo.getProducts().filter((p) => p.isActive);
    const hotList = all.filter((p) => p.badge === 'HOT' || p.badge === 'DROP' || p.badge === 'TRENDING' || p.isFeatured || (p as any).isHot);
    if (hotList.length >= limit) {
      return hotList.slice(0, limit);
    }
    const remaining = all
      .filter((p) => !hotList.some((h) => h.id === p.id))
      .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    return [...hotList, ...remaining].slice(0, limit);
  },

  getNewArrivals: (limit: number = 8): Product[] => {
    return MockRepo.getProducts()
      .filter((p) => p.isActive && (p.isNewArrival || p.badge === 'Mới' || p.badge === 'NEW' || p.badge === 'DROP'))
      .slice(0, limit);
  },

  getBestSellers: (limit: number = 8): Product[] => {
    return MockRepo.getProducts()
      .filter((p) => p.isActive)
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, limit);
  },

  getSummerCollection: (limit: number = 8): Product[] => {
    return MockRepo.getProducts()
      .filter(
        (p) =>
          p.isActive &&
          (['ao-thun', 'ao-croptop', 'ao-hai-day', 'ao-polo', 'vay', 'quan-short'].includes(p.categorySlug) ||
            p.material?.toLowerCase().includes('cotton') ||
            p.shortDescription?.toLowerCase().includes('mát'))
      )
      .slice(0, limit);
  },

  getWinterCollection: (limit: number = 8): Product[] => {
    return MockRepo.getProducts()
      .filter(
        (p) =>
          p.isActive &&
          (['ao-hoodie', 'ao-khoac', 'ao-cardigan', 'ao-len', 'quan', 'quan-dai'].includes(p.categorySlug) ||
            p.material?.toLowerCase().includes('nỉ') ||
            p.material?.toLowerCase().includes('len') ||
            p.shortDescription?.toLowerCase().includes('ấm'))
      )
      .slice(0, limit);
  },

  getFeatured: (limit: number = 6): Product[] => {
    return MockRepo.getProducts()
      .filter((p) => p.isActive && p.isFeatured)
      .slice(0, limit);
  },

  getAccessories: (limit: number = 8): Product[] => {
    return MockRepo.getProducts()
      .filter((p) => p.isActive && p.categorySlug === 'phu-kien')
      .slice(0, limit);
  },

  // PHẦN 11: SHOP THE LOOK OUTFITS
  getShopTheLookOutfits: (): ShopTheLookOutfit[] => {
    const all = MockRepo.getProducts().filter((p) => p.isActive);
    if (all.length === 0) return [];
    const tops = all.filter((p) => ['ao-thun', 'ao-hoodie', 'ao-polo', 'ao-so-mi', 'ao-croptop', 'ao-cardigan'].includes(p.categorySlug));
    const bottoms = all.filter((p) => ['quan', 'quan-dai', 'quan-short', 'vay'].includes(p.categorySlug));

    return [
      {
        id: 'look-1',
        title: 'Cyber Streetwear Matrix Fit',
        style: 'Streetwear / Cyber',
        tagline: 'Set áo graphic oversize kết hợp quần ống rộng wash cá tính',
        lookImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&auto=format&fit=crop&q=80',
        items: [
          tops[0] || all[0],
          bottoms[0] || all[1] || all[0],
          tops[1] || all[2] || all[0],
        ].filter(Boolean) as Product[],
        discountPercent: 10,
      },
      {
        id: 'look-2',
        title: 'Korean Campus Warm Cozy',
        style: 'Korean Casual / Winter',
        tagline: 'Hoodie nỉ bông trùm đầu phối cùng quần form rộng ấm áp chuẩn phong cách Hàn Quốc',
        lookImage: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1000&auto=format&fit=crop&q=80',
        items: [
          tops.find((p) => p.categorySlug === 'ao-hoodie' || p.categorySlug === 'ao-len') || tops[1] || all[1],
          bottoms.find((p) => p.categorySlug === 'quan-dai' || p.categorySlug === 'quan') || bottoms[1] || all[2],
          tops[2] || all[3] || all[0],
        ].filter(Boolean) as Product[],
        discountPercent: 12,
      },
      {
        id: 'look-3',
        title: 'Y2K Retro Vintage Summer',
        style: 'Y2K Girl Aesthetic',
        tagline: 'Baby tee / Croptop in họa tiết retro ôm dáng phối chân váy xếp ly xinh xắn',
        lookImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=80',
        items: [
          all.find((p) => p.categorySlug === 'ao-croptop' || p.categorySlug === 'ao-hai-day') || tops[2] || all[0],
          all.find((p) => p.categorySlug === 'vay') || bottoms[2] || all[1],
          tops[0] || all[2] || all[0],
        ].filter(Boolean) as Product[],
        discountPercent: 15,
      },
    ];
  },
};

