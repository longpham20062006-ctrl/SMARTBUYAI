import { Category, Product } from '@/types';

export type ParentCategoryGroup = 'ao' | 'ao-khoac' | 'quan' | 'do-bo' | 'chan-vay-dam' | 'phu-kien' | 'khac';

export interface CategoryMetadata {
  id: string;
  slug: string;
  name: string;
  englishName: string;
  folderName: string;
  parentGroup: ParentCategoryGroup;
  parentGroupName: string;
  gender: ('nam' | 'nu' | 'unisex')[];
  image?: string;
  description: string;
  order: number;
}

// Bảng cấu hình ánh xạ danh mục chuẩn 3 cấp từ thư mục thực tế
export const CATEGORY_DEFINITIONS: Record<string, CategoryMetadata> = {
  // Cấp 2: ÁO (public/images/san-pham/quan-ao-nam/ao/) - Gồm 6 loại riêng biệt
  'ao-hoodie': {
    id: 'c-ao-hoodie',
    slug: 'ao-hoodie',
    name: 'Hoodie',
    englishName: 'Hoodies',
    folderName: 'ao-hoodie',
    parentGroup: 'ao',
    parentGroupName: 'Áo',
    gender: ['nam', 'nu', 'unisex'],
    image: '/images/san-pham/quan-ao-nam/ao/ao-hoodie/ao_hoodie_1/1792767146076_348043404565674403_5540743654312280467_a02ae46e3d9a651cf26099b281a34465.jpg',
    description: 'Áo hoodie nỉ bông mũ trùm 2 lớp dày dặn, phom boxy đậm chất streetwear.',
    order: 1,
  },
  'ao-len': {
    id: 'c-ao-len',
    slug: 'ao-len',
    name: 'Áo len',
    englishName: 'Knitwear',
    folderName: 'ao-len',
    parentGroup: 'ao',
    parentGroupName: 'Áo',
    gender: ['nam', 'nu', 'unisex'],
    image: '/images/san-pham/quan-ao-nam/ao/ao-len/ao_len_1/1792767424915_348043404565674403_5540743654312280467_b57790b9f91a5668dc44f0c744c84dbd.jpg',
    description: 'Áo len dệt kim sợi mềm mịn giữ nhiệt, phong cách Preppy học đường Hàn Quốc.',
    order: 2,
  },
  'ao-polo': {
    id: 'c-ao-polo',
    slug: 'ao-polo',
    name: 'Polo',
    englishName: 'Polo Shirts',
    folderName: 'ao-polo',
    parentGroup: 'ao',
    parentGroupName: 'Áo',
    gender: ['nam', 'unisex'],
    image: '/images/san-pham/quan-ao-nam/ao/ao-polo/ao_polo_1/1792765355609_348043404565674403_5540743654312280467_fcaef8652cae4438b45ea1e342207b5a.jpg',
    description: 'Áo polo cổ bẻ chất vải pique dệt mắt chim thoáng khí, bo cổ sắc nét.',
    order: 3,
  },
  'ao-so-mi': {
    id: 'c-ao-so-mi',
    slug: 'ao-so-mi',
    name: 'Sơ mi',
    englishName: 'Shirts',
    folderName: 'ao-so-mi',
    parentGroup: 'ao',
    parentGroupName: 'Áo',
    gender: ['nam', 'nu', 'unisex'],
    image: '/images/san-pham/quan-ao-nam/ao/ao-so-mi/ao_somi_1/1792765790479_348043404565674403_5540743654312280467_d37119e83ec50f6820556e9c6061c028.jpg',
    description: 'Sơ mi phom rộng lụa cotton chống nhăn, phù hợp đi học, đi làm và dạo phố.',
    order: 4,
  },
  'ao-thun': {
    id: 'c-ao-thun',
    slug: 'ao-thun',
    name: 'Áo thun',
    englishName: 'T-Shirts',
    folderName: 'ao-thun',
    parentGroup: 'ao',
    parentGroupName: 'Áo',
    gender: ['nam', 'nu', 'unisex'],
    image: '/images/san-pham/quan-ao-nam/ao/ao-thun/ao_thun_1/1792737335787_348043404565674403_5540743654312280467_b52994e6371efcb0693a02799c0879cf.jpg',
    description: 'Áo thun cổ tròn oversized 250gsm, cotton compact thoáng mát thấm hút mồ hôi.',
    order: 5,
  },
  'ao-thun-dai-tay': {
    id: 'c-ao-thun-dai-tay',
    slug: 'ao-thun-dai-tay',
    name: 'Áo thun dài tay',
    englishName: 'Longsleeve',
    folderName: 'ao-thun-dai-tay',
    parentGroup: 'ao',
    parentGroupName: 'Áo',
    gender: ['nam', 'nu', 'unisex'],
    image: '/images/san-pham/quan-ao-nam/ao/ao-thun-dai-tay/ao_thun_dai_tay_1/1792770146313_348043404565674403_5540743654312280467_4050212f8615e44e231121d508920158.jpg',
    description: 'Áo thun tay dài cổ tròn giữ nhiệt, phom dáng rộng thoải mái mùa thu đông.',
    order: 6,
  },

  // Cấp 2: ÁO KHOÁC (public/images/san-pham/quan-ao-nam/ao-khoac/) - Nhánh độc lập ngoài ao/
  'ao-khoac': {
    id: 'c-ao-khoac',
    slug: 'ao-khoac',
    name: 'Áo khoác',
    englishName: 'Jackets',
    folderName: 'ao-khoac',
    parentGroup: 'ao-khoac',
    parentGroupName: 'Áo khoác',
    gender: ['nam', 'nu', 'unisex'],
    image: '/images/san-pham/quan-ao-nam/ao-khoac/ao_khoac_1/1792798150493_348043404565674403_5540743654312280467_60fcf14a1a09d6ea8e932ef6e9b81180.jpg',
    description: 'Áo khoác gió dù 2 lớp cản gió chống nước nhẹ, thiết kế bomber dạo phố.',
    order: 7,
  },

  // Cấp 2: QUẦN (public/images/san-pham/quan-ao-nam/quan/)
  'quan-short': {
    id: 'c-quan-short',
    slug: 'quan-short',
    name: 'Quần short',
    englishName: 'Shorts',
    folderName: 'quan-short',
    parentGroup: 'quan',
    parentGroupName: 'Quần',
    gender: ['nam', 'nu', 'unisex'],
    image: '/images/san-pham/quan-ao-nam/quan/quan-short/quan_short_1/1792777849810_348043404565674403_5540743654312280467_d320372a8583d18826976ded99538a04.jpg',
    description: 'Quần short kaki và dù gió thể thao thoáng mát, độ dài trên gối năng động.',
    order: 8,
  },
  'quan-dai': {
    id: 'c-quan-dai',
    slug: 'quan-dai',
    name: 'Quần dài',
    englishName: 'Pants',
    folderName: 'quan-dai',
    parentGroup: 'quan',
    parentGroupName: 'Quần',
    gender: ['nam', 'nu', 'unisex'],
    image: '/images/san-pham/quan-ao-nam/quan/quan-dai/quan_dai_1/1792798442761_348043404565674403_5540743654312280467_b52994e6371efcb0693a02799c0879cf.jpg',
    description: 'Quần dài ống suông đứng dáng, chất vải tuyết mưa hoặc kaki co giãn nhẹ.',
    order: 9,
  },
  'quan-jeans': {
    id: 'c-quan-jeans',
    slug: 'quan-jeans',
    name: 'Quần jeans',
    englishName: 'Jeans',
    folderName: 'quan-jeans',
    parentGroup: 'quan',
    parentGroupName: 'Quần',
    gender: ['nam', 'nu', 'unisex'],
    description: 'Quần jeans denim 13oz bền chắc, phom baggy và suông thời thượng.',
    order: 10,
  },

  // Cấp 2: ĐỒ BỘ (public/images/san-pham/quan-ao-nam/do-bo/) - Set đồ thể thao và dạo phố
  'do-bo': {
    id: 'c-do-bo',
    slug: 'do-bo',
    name: 'Đồ bộ',
    englishName: 'Sets & Tracksuits',
    folderName: 'do-bo',
    parentGroup: 'do-bo',
    parentGroupName: 'Đồ bộ',
    gender: ['nam', 'nu', 'unisex'],
    image: '/images/san-pham/quan-ao-nam/do-bo/do_bo_1/1792815868582_348043404565674403_5540743654312280467_220b72458c928eec2908c6a704d6b993.jpg',
    description: 'Set trang phục thể thao và dạo phố đồng điệu gồm áo và quần, tiện lợi và năng động.',
    order: 11,
  },

  // Cấp 2: VÁY & ĐẦM (dành cho thời trang nữ khi có ảnh)
  'chan-vay': {
    id: 'c-chan-vay',
    slug: 'chan-vay',
    name: 'Chân váy',
    englishName: 'Skirts',
    folderName: 'chan-vay',
    parentGroup: 'chan-vay-dam',
    parentGroupName: 'Váy & Đầm',
    gender: ['nu'],
    description: 'Chân váy xếp ly và váy denim chữ A thời trang nữ.',
    order: 11,
  },
  'dam': {
    id: 'c-dam',
    slug: 'dam',
    name: 'Đầm / Váy liền',
    englishName: 'Dresses',
    folderName: 'dam',
    parentGroup: 'chan-vay-dam',
    parentGroupName: 'Váy & Đầm',
    gender: ['nu'],
    description: 'Đầm dạ tiệc và váy liền dạo phố phong cách nữ tính.',
    order: 12,
  },

  // Cấp 2: PHỤ KIỆN
  'phu-kien': {
    id: 'c-phu-kien',
    slug: 'phu-kien',
    name: 'Phụ kiện',
    englishName: 'Accessories',
    folderName: 'phu-kien',
    parentGroup: 'phu-kien',
    parentGroupName: 'Phụ kiện',
    gender: ['nam', 'nu', 'unisex'],
    description: 'Trang sức titan, vòng tay, dây chuyền, nhẫn và mũ nón Gen Z.',
    order: 13,
  },
};

/**
 * Trả về danh sách danh mục có sản phẩm thực tế, tự động đếm số Product ID theo bộ lọc
 */
export function getActiveCategories(
  products: Product[],
  options?: {
    gender?: string;
    season?: string;
  }
): Category[] {
  const { gender = 'all', season = 'all' } = options || {};

  // Lọc sản phẩm theo giới tính & mùa
  const filteredProducts = products.filter((p) => {
    if (gender !== 'all') {
      if (gender === 'unisex' && p.gender !== 'unisex') return false;
      if (gender !== 'unisex' && p.gender !== gender && p.gender !== 'unisex') return false;
    }
    if (season !== 'all') {
      const pSeasons = p.seasons || (p.season ? [p.season] : []);
      if (!pSeasons.includes(season)) return false;
    }
    return true;
  });

  // Đếm số lượng Product ID duy nhất theo từng categorySlug
  const counts: Record<string, number> = {};
  filteredProducts.forEach((p) => {
    counts[p.categorySlug] = (counts[p.categorySlug] || 0) + 1;
  });

  // Chỉ trả về các danh mục có count > 0, sắp xếp theo order
  const activeSlugs = Object.keys(counts).filter((slug) => counts[slug] > 0);

  return activeSlugs
    .map((slug) => {
      const meta = CATEGORY_DEFINITIONS[slug] || {
        id: `c-${slug}`,
        slug,
        name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        englishName: slug,
        folderName: slug,
        parentGroup: 'khac' as ParentCategoryGroup,
        parentGroupName: 'Khác',
        gender: ['nam', 'nu', 'unisex'],
        description: '',
        order: 99,
      };

      return {
        id: meta.id,
        name: meta.name,
        slug: meta.slug,
        gender: meta.gender,
        description: meta.description,
        image: meta.image || '',
        itemCount: counts[slug],
      };
    })
    .sort((a, b) => {
      const orderA = CATEGORY_DEFINITIONS[a.slug]?.order ?? 99;
      const orderB = CATEGORY_DEFINITIONS[b.slug]?.order ?? 99;
      return orderA - orderB;
    });
}

export interface CategoryGroup {
  groupKey: ParentCategoryGroup;
  groupName: string;
  totalCount: number;
  categories: Category[];
}

/**
 * Trả về danh sách danh mục nhóm theo Nhóm Lớn (Cấp 2: Áo, Quần, ...)
 * Chỉ trả về nhóm và danh mục con có sản phẩm thực tế (itemCount > 0)
 */
export function getActiveGroupedCategories(
  products: Product[],
  options?: {
    gender?: string;
    season?: string;
  }
): CategoryGroup[] {
  const activeCategories = getActiveCategories(products, options);
  const groupMap: Partial<Record<ParentCategoryGroup, CategoryGroup>> = {};

  activeCategories.forEach((cat) => {
    const meta = CATEGORY_DEFINITIONS[cat.slug];
    const groupKey: ParentCategoryGroup = meta?.parentGroup || 'khac';
    const groupName = meta?.parentGroupName || 'Khác';

    if (!groupMap[groupKey]) {
      groupMap[groupKey] = {
        groupKey,
        groupName,
        totalCount: 0,
        categories: [],
      };
    }

    groupMap[groupKey]!.categories.push(cat);
    groupMap[groupKey]!.totalCount += cat.itemCount;
  });

  // Thứ tự hiển thị chuẩn: Áo -> Áo khoác -> Quần -> Đồ bộ -> Váy & Đầm -> Phụ kiện -> Khác
  const groupOrder: ParentCategoryGroup[] = ['ao', 'ao-khoac', 'quan', 'do-bo', 'chan-vay-dam', 'phu-kien', 'khac'];

  return groupOrder
    .filter((gk) => groupMap[gk] && groupMap[gk]!.categories.length > 0)
    .map((gk) => groupMap[gk]!);
}

/**
 * Lấy tên hiển thị tiếng Việt hoặc tiếng Anh của một danh mục
 */
export function getCategoryDisplayName(slug: string, lang: 'vi' | 'en' = 'vi'): string {
  const meta = CATEGORY_DEFINITIONS[slug];
  if (!meta) return slug;
  return lang === 'en' ? meta.englishName : meta.name;
}
