import { MockRepo } from '@/mocks/repository';
import { Product } from '@/types';

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
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.material.toLowerCase().includes(q) ||
          p.style.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q)
      );
    }

    // Gender
    if (filters.gender && filters.gender !== 'all') {
      list = list.filter((p) => p.gender === filters.gender || p.gender === 'unisex');
    }

    // Category
    if (filters.categorySlug && filters.categorySlug !== 'all') {
      list = list.filter((p) => p.categorySlug === filters.categorySlug);
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
      list = list.filter((p) => p.colors.some((c) => filters.colors!.includes(c.slug)));
    }

    // Sizes
    if (filters.sizes && filters.sizes.length > 0) {
      list = list.filter((p) => p.sizes.some((s) => filters.sizes!.includes(s)));
    }

    // Fits
    if (filters.fits && filters.fits.length > 0) {
      list = list.filter((p) => filters.fits!.some((f) => p.fit.toLowerCase().includes(f.toLowerCase())));
    }

    // Styles
    if (filters.styles && filters.styles.length > 0) {
      list = list.filter((p) => filters.styles!.some((s) => p.style.toLowerCase().includes(s.toLowerCase())));
    }

    // Materials
    if (filters.materials && filters.materials.length > 0) {
      list = list.filter((p) => filters.materials!.some((m) => p.material.toLowerCase().includes(m.toLowerCase())));
    }

    // Seasons (Bốn mùa)
    if (filters.season && filters.season !== 'all') {
      const s = filters.season.toLowerCase();
      list = list.filter((p) => {
        if (p.season && p.season.toLowerCase().includes(s)) return true;
        if (s === 'he' || s === 'summer') {
          return ['ao-thun', 'ao-croptop-tank', 'so-mi-polo', 'chan-vay'].includes(p.categorySlug);
        }
        if (s === 'dong' || s === 'winter') {
          return ['hoodie-sweater', 'ao-khoac', 'quan-cargo-parachute'].includes(p.categorySlug);
        }
        if (s === 'xuan-thu' || s === 'spring-autumn') {
          return ['quan-jeans', 'so-mi-polo', 'ao-thun'].includes(p.categorySlug);
        }
        return true;
      });
    }

    // Occasions
    if (filters.occasions && filters.occasions.length > 0) {
      list = list.filter((p) => p.occasion.some((o) => filters.occasions!.includes(o)));
    }

    // In Stock Only
    if (filters.inStockOnly) {
      list = list.filter((p) => p.variants.some((v) => v.stock > 0));
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

    return list;
  },

  getBySlug: (slug: string): Product | undefined => {
    return MockRepo.getProductBySlug(slug);
  },

  getRelated: (product: Product, limit: number = 4): Product[] => {
    return MockRepo.getProducts()
      .filter((p) => p.id !== product.id && p.isActive && (p.categorySlug === product.categorySlug || p.brand === product.brand))
      .slice(0, limit);
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
          (['ao-thun', 'ao-croptop-tank', 'so-mi-polo', 'chan-vay'].includes(p.categorySlug) ||
            p.material.toLowerCase().includes('cotton') ||
            p.shortDescription.toLowerCase().includes('mát'))
      )
      .slice(0, limit);
  },

  getWinterCollection: (limit: number = 8): Product[] => {
    return MockRepo.getProducts()
      .filter(
        (p) =>
          p.isActive &&
          (['hoodie-sweater', 'ao-khoac', 'quan-cargo-parachute'].includes(p.categorySlug) ||
            p.material.toLowerCase().includes('nỉ') ||
            p.shortDescription.toLowerCase().includes('ấm'))
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
    const tops = all.filter((p) => ['ao-thun', 'hoodie-sweater', 'so-mi-polo'].includes(p.categorySlug));
    const bottoms = all.filter((p) => ['quan-jeans', 'quan-cargo-parachute', 'chan-vay'].includes(p.categorySlug));
    const accessories = all.filter((p) => p.categorySlug === 'phu-kien');

    return [
      {
        id: 'look-1',
        title: 'Cyber Streetwear Matrix Fit',
        style: 'Streetwear / Cyber',
        tagline: 'Set áo thun graphic oversize kết hợp quần jeans baggy wash và vòng cổ bạc layer',
        lookImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&auto=format&fit=crop&q=80',
        items: [
          tops[0] || all[0],
          bottoms[0] || all[1],
          accessories[0] || all[2],
        ].filter(Boolean),
        discountPercent: 10,
      },
      {
        id: 'look-2',
        title: 'Korean Campus Warm Cozy',
        style: 'Korean Casual / Winter',
        tagline: 'Hoodie nỉ bông trùm đầu phối cùng quần cargo túi hộp và mũ beanie ấm áp',
        lookImage: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1000&auto=format&fit=crop&q=80',
        items: [
          tops.find((p) => p.categorySlug === 'hoodie-sweater') || tops[1] || all[3],
          bottoms.find((p) => p.categorySlug === 'quan-cargo-parachute') || bottoms[1] || all[4],
          accessories[1] || all[5],
        ].filter(Boolean),
        discountPercent: 12,
      },
      {
        id: 'look-3',
        title: 'Y2K Retro Vintage Summer',
        style: 'Y2K Girl Aesthetic',
        tagline: 'Baby tee in họa tiết retro ôm dáng phối chân váy xếp ly và túi kẹp nách',
        lookImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=80',
        items: [
          all.find((p) => p.categorySlug === 'ao-croptop-tank' || p.categorySlug === 'ao-thun') || tops[2],
          all.find((p) => p.categorySlug === 'chan-vay') || bottoms[2],
          accessories[2] || accessories[0],
        ].filter(Boolean),
        discountPercent: 15,
      },
    ];
  },
};
