import { Category, Product } from '@/types';

export interface CategoryMetadata {
  id: string;
  slug: string;
  name: string;
  englishName: string;
  folderName: string;
  gender: ('nam' | 'nu' | 'unisex')[];
  image?: string;
  description: string;
  order: number;
}

// Bảng cấu hình ánh xạ danh mục chuẩn từ thư mục thực tế
export const CATEGORY_DEFINITIONS: Record<string, CategoryMetadata> = {
  'ao-thun': {
    id: 'c-ao-thun',
    slug: 'ao-thun',
    name: 'Áo thun',
    englishName: 'T-Shirts',
    folderName: 'ao-thun',
    gender: ['nam', 'nu', 'unisex'],
    image: '/images/san-pham/quan-ao-nam/ao/ao-thun/ao_thun_1/1792737335787_348043404565674403_5540743654312280467_b52994e6371efcb0693a02799c0879cf.jpg',
    description: 'Áo thun cổ tròn oversized 250gsm, cotton compact thoáng mát thấm hút mồ hôi.',
    order: 1,
  },
  'ao-thun-dai-tay': {
    id: 'c-ao-thun-dai-tay',
    slug: 'ao-thun-dai-tay',
    name: 'Áo thun dài tay',
    englishName: 'Longsleeve',
    folderName: 'ao-thun-dai-tay',
    gender: ['nam', 'nu', 'unisex'],
    image: '/images/san-pham/quan-ao-nam/ao/ao-thun-dai-tay/ao_thun_dai_tay_1/1792770146313_348043404565674403_5540743654312280467_4050212f8615e44e231121d508920158.jpg',
    description: 'Áo thun tay dài cổ tròn giữ nhiệt, phom dáng rộng thoải mái mùa thu đông.',
    order: 2,
  },
  'ao-polo': {
    id: 'c-ao-polo',
    slug: 'ao-polo',
    name: 'Polo',
    englishName: 'Polo Shirts',
    folderName: 'ao-polo',
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
    gender: ['nam', 'nu', 'unisex'],
    image: '/images/san-pham/quan-ao-nam/ao/ao-so-mi/ao_somi_1/1792765790479_348043404565674403_5540743654312280467_d37119e83ec50f6820556e9c6061c028.jpg',
    description: 'Sơ mi phom rộng lụa cotton chống nhăn, phù hợp đi học, đi làm và dạo phố.',
    order: 4,
  },
  'ao-hoodie': {
    id: 'c-ao-hoodie',
    slug: 'ao-hoodie',
    name: 'Hoodie',
    englishName: 'Hoodies',
    folderName: 'ao-hoodie',
    gender: ['nam', 'nu', 'unisex'],
    image: '/images/san-pham/quan-ao-nam/ao/ao-hoodie/ao_hoodie_1/1792767146076_348043404565674403_5540743654312280467_a02ae46e3d9a651cf26099b281a34465.jpg',
    description: 'Áo hoodie nỉ bông mũ trùm 2 lớp dày dặn, phom boxy đậm chất streetwear.',
    order: 5,
  },
  'ao-len': {
    id: 'c-ao-len',
    slug: 'ao-len',
    name: 'Áo len',
    englishName: 'Knitwear',
    folderName: 'ao-len',
    gender: ['nam', 'nu', 'unisex'],
    image: '/images/san-pham/quan-ao-nam/ao/ao-len/ao_len_1/1792767424915_348043404565674403_5540743654312280467_b57790b9f91a5668dc44f0c744c84dbd.jpg',
    description: 'Áo len dệt kim sợi mềm mịn giữ nhiệt, phong cách Preppy học đường Hàn Quốc.',
    order: 6,
  },
  'ao-khoac': {
    id: 'c-ao-khoac',
    slug: 'ao-khoac',
    name: 'Áo khoác',
    englishName: 'Jackets',
    folderName: 'ao-khoac',
    gender: ['nam', 'nu', 'unisex'],
    image: '/images/san-pham/quan-ao-nam/ao-khoac/ao_khoac_1/1792798150493_348043404565674403_5540743654312280467_60fcf14a1a09d6ea8e932ef6e9b81180.jpg',
    description: 'Áo khoác gió dù 2 lớp cản gió chống nước nhẹ, thiết kế bomber dạo phố.',
    order: 7,
  },
  'quan-short': {
    id: 'c-quan-short',
    slug: 'quan-short',
    name: 'Quần short',
    englishName: 'Shorts',
    folderName: 'quan-short',
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
    gender: ['nam', 'nu', 'unisex'],
    description: 'Quần jeans denim 13oz bền chắc, phom baggy và suông thời thượng.',
    order: 10,
  },
  'chan-vay': {
    id: 'c-chan-vay',
    slug: 'chan-vay',
    name: 'Chân váy',
    englishName: 'Skirts',
    folderName: 'chan-vay',
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
    gender: ['nu'],
    description: 'Đầm dạ tiệc và váy liền dạo phố phong cách nữ tính.',
    order: 12,
  },
  'phu-kien': {
    id: 'c-phu-kien',
    slug: 'phu-kien',
    name: 'Phụ kiện',
    englishName: 'Accessories',
    folderName: 'phu-kien',
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

/**
 * Lấy tên hiển thị tiếng Việt hoặc tiếng Anh của một danh mục
 */
export function getCategoryDisplayName(slug: string, lang: 'vi' | 'en' = 'vi'): string {
  const meta = CATEGORY_DEFINITIONS[slug];
  if (!meta) return slug;
  return lang === 'en' ? meta.englishName : meta.name;
}
