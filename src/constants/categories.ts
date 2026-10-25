import { Category, Product } from '@/types';

export type ParentCategoryGroup = 'ao' | 'quan' | 'vay' | 'ao-khoac' | 'do-bo' | 'chan-vay-dam' | 'phu-kien' | 'khac';

export interface CategoryMetadata {
  id: string;
  slug: string;
  name: string;
  englishName: string;
  folderName: string;
  folderPath?: string;
  parentGroup: ParentCategoryGroup;
  parentGroupName: string;
  gender: ('nam' | 'nu' | 'unisex')[];
  image?: string;
  description: string;
  order: number;
}

export interface MainCategoryGroupMeta {
  key: ParentCategoryGroup;
  name: string;
  slug: string;
  order: number;
}

// 5 nhóm lớn thời trang Nữ chuẩn
export const WOMEN_MAIN_GROUPS: MainCategoryGroupMeta[] = [
  { key: 'ao', name: 'Áo', slug: 'ao', order: 1 },
  { key: 'quan', name: 'Quần', slug: 'quan', order: 2 },
  { key: 'vay', name: 'Váy & Chân váy', slug: 'vay', order: 3 },
  { key: 'ao-khoac', name: 'Áo khoác', slug: 'ao-khoac', order: 4 },
  { key: 'do-bo', name: 'Đồ bộ', slug: 'do-bo', order: 5 },
];

// REGISTRY CHUẨN ĐÚNG 29 DANH MỤC THỜI TRANG NỮ
// Phân cấp: Giới tính (nu) -> Nhóm chính (5 nhóm) -> Danh mục con (29 loại) -> Folder mẫu -> Ảnh
export const WOMEN_CATEGORY_REGISTRY: Record<string, CategoryMetadata> = {
  // --- NHÓM 1: ÁO (10 danh mục) ---
  'ao-thun': {
    id: 'c-nu-ao-thun',
    slug: 'ao-thun',
    name: 'Áo thun',
    englishName: 'T-Shirts',
    folderName: 'ao-thun',
    folderPath: 'quan-ao-nu/ao/ao-thun',
    parentGroup: 'ao',
    parentGroupName: 'Áo',
    gender: ['nam', 'nu', 'unisex'],
    description: 'Áo thun nữ cotton thoáng mát, phom rộng oversize và baby tee năng động chuẩn Gen Z.',
    order: 1,
  },
  'ao-thun-dai-tay': {
    id: 'c-nu-ao-thun-dai-tay',
    slug: 'ao-thun-dai-tay',
    name: 'Áo thun dài tay',
    englishName: 'Longsleeve',
    folderName: 'ao-thun-dai-tay',
    folderPath: 'quan-ao-nu/ao/ao-thun-dai-tay',
    parentGroup: 'ao',
    parentGroupName: 'Áo',
    gender: ['nam', 'nu', 'unisex'],
    description: 'Áo thun tay dài nữ mỏng nhẹ, giữ nhiệt thu đông và phối layer thời thượng.',
    order: 2,
  },
  'ao-croptop': {
    id: 'c-nu-ao-croptop',
    slug: 'ao-croptop',
    name: 'Croptop',
    englishName: 'Croptop',
    folderName: 'ao-croptop',
    folderPath: 'quan-ao-nu/ao/ao-croptop',
    parentGroup: 'ao',
    parentGroupName: 'Áo',
    gender: ['nu'],
    description: 'Áo croptop dáng ngắn tôn eo, phong cách Y2K và streetwear trẻ trung năng động.',
    order: 3,
  },
  'ao-hai-day': {
    id: 'c-nu-ao-hai-day',
    slug: 'ao-hai-day',
    name: 'Áo hai dây / Tank Top',
    englishName: 'Tank Top',
    folderName: 'ao-hai-day',
    folderPath: 'quan-ao-nu/ao/ao-hai-day',
    parentGroup: 'ao',
    parentGroupName: 'Áo',
    gender: ['nu'],
    description: 'Áo hai dây, áo yếm, tank top lụa và cotton nhẹ nhàng, thoáng mát mùa hè.',
    order: 4,
  },
  'ao-so-mi': {
    id: 'c-nu-ao-so-mi',
    slug: 'ao-so-mi',
    name: 'Sơ mi',
    englishName: 'Shirts',
    folderName: 'ao-so-mi',
    folderPath: 'quan-ao-nu/ao/ao-so-mi',
    parentGroup: 'ao',
    parentGroupName: 'Áo',
    gender: ['nam', 'nu', 'unisex'],
    description: 'Sơ mi nữ phom rộng lụa tơ, sơ mi oxford và cuban cá tính dạo phố hoặc đi làm.',
    order: 5,
  },
  'ao-kieu': {
    id: 'c-nu-ao-kieu',
    slug: 'ao-kieu',
    name: 'Blouse / Áo kiểu',
    englishName: 'Blouse',
    folderName: 'ao-kieu',
    folderPath: 'quan-ao-nu/ao/ao-kieu',
    parentGroup: 'ao',
    parentGroupName: 'Áo',
    gender: ['nu'],
    description: 'Áo kiểu nữ, blouse cổ bèo tay bồng, phong cách tiểu thư Hàn Quốc thanh lịch.',
    order: 6,
  },
  'ao-polo': {
    id: 'c-nu-ao-polo',
    slug: 'ao-polo',
    name: 'Polo',
    englishName: 'Polo Shirts',
    folderName: 'ao-polo',
    folderPath: 'quan-ao-nu/ao/ao-polo',
    parentGroup: 'ao',
    parentGroupName: 'Áo',
    gender: ['nam', 'nu', 'unisex'],
    description: 'Áo polo nữ dệt pique cổ bẻ, phom croptop hoặc relaxed fit phong cách thể thao Preppy.',
    order: 7,
  },
  'ao-hoodie': {
    id: 'c-nu-ao-hoodie',
    slug: 'ao-hoodie',
    name: 'Hoodie',
    englishName: 'Hoodies',
    folderName: 'ao-hoodie',
    folderPath: 'quan-ao-nu/ao/ao-hoodie',
    parentGroup: 'ao',
    parentGroupName: 'Áo',
    gender: ['nam', 'nu', 'unisex'],
    description: 'Áo hoodie nữ nỉ bông mũ trùm 2 lớp ấm áp, phom lửng hoặc oversize cá tính.',
    order: 8,
  },
  'ao-len': {
    id: 'c-nu-ao-len',
    slug: 'ao-len',
    name: 'Áo len',
    englishName: 'Knitwear',
    folderName: 'ao-len',
    folderPath: 'quan-ao-nu/ao/ao-len',
    parentGroup: 'ao',
    parentGroupName: 'Áo',
    gender: ['nam', 'nu', 'unisex'],
    description: 'Áo len dệt kim sợi mềm mịn, giữ nhiệt tốt với họa tiết trẻ trung phong cách học đường.',
    order: 9,
  },
  'ao-cardigan': {
    id: 'c-nu-ao-cardigan',
    slug: 'ao-cardigan',
    name: 'Cardigan',
    englishName: 'Cardigan',
    folderName: 'ao-cardigan',
    folderPath: 'quan-ao-nu/ao/ao-cardigan',
    parentGroup: 'ao',
    parentGroupName: 'Áo',
    gender: ['nu', 'unisex'],
    description: 'Áo cardigan len mỏng khoác ngoài cài cúc, nhẹ nhàng dịu dàng phong cách Pháp & Hàn.',
    order: 10,
  },

  // --- NHÓM 2: QUẦN (7 danh mục) ---
  'quan-jeans': {
    id: 'c-nu-quan-jeans',
    slug: 'quan-jeans',
    name: 'Jeans',
    englishName: 'Jeans',
    folderName: 'quan-jeans',
    folderPath: 'quan-ao-nu/quan/quan-jeans',
    parentGroup: 'quan',
    parentGroupName: 'Quần',
    gender: ['nam', 'nu', 'unisex'],
    description: 'Quần jeans nữ denim cao cấp phom baggy, ống loe cạp cao tôn dáng dài chân.',
    order: 11,
  },
  'quan-dai': {
    id: 'c-nu-quan-dai',
    slug: 'quan-dai',
    name: 'Quần dài',
    englishName: 'Pants',
    folderName: 'quan-dai',
    folderPath: 'quan-ao-nu/quan/quan-dai',
    parentGroup: 'quan',
    parentGroupName: 'Quần',
    gender: ['nam', 'nu', 'unisex'],
    description: 'Quần tây suông nữ vải tuyết mưa, cạp cao hack dáng thanh lịch đi học và đi làm.',
    order: 12,
  },
  'quan-short': {
    id: 'c-nu-quan-short',
    slug: 'quan-short',
    name: 'Shorts',
    englishName: 'Shorts',
    folderName: 'quan-short',
    folderPath: 'quan-ao-nu/quan/quan-short',
    parentGroup: 'quan',
    parentGroupName: 'Quần',
    gender: ['nam', 'nu', 'unisex'],
    description: 'Quần short nữ jeans, kaki và dù gió năng động, thoáng mát dạo phố mùa hè.',
    order: 13,
  },
  'quan-ong-rong': {
    id: 'c-nu-quan-ong-rong',
    slug: 'quan-ong-rong',
    name: 'Quần ống rộng',
    englishName: 'Wide-Leg Pants',
    folderName: 'quan-ong-rong',
    folderPath: 'quan-ao-nu/quan/quan-ong-rong',
    parentGroup: 'quan',
    parentGroupName: 'Quần',
    gender: ['nu', 'unisex'],
    description: 'Quần ống rộng suông dài vải rũ mềm mại, thoải mái vận động và cực kỳ tôn dáng.',
    order: 14,
  },
  'quan-cargo': {
    id: 'c-nu-quan-cargo',
    slug: 'quan-cargo',
    name: 'Cargo',
    englishName: 'Cargo Pants',
    folderName: 'quan-cargo',
    folderPath: 'quan-ao-nu/quan/quan-cargo',
    parentGroup: 'quan',
    parentGroupName: 'Quần',
    gender: ['nu', 'unisex'],
    description: 'Quần túi hộp cargo nữ cá tính hầm hố, phong cách Gorpcore & Cyberpunk Gen Z.',
    order: 15,
  },
  'quan-legging': {
    id: 'c-nu-quan-legging',
    slug: 'quan-legging',
    name: 'Leggings',
    englishName: 'Leggings',
    folderName: 'quan-legging',
    folderPath: 'quan-ao-nu/quan/quan-legging',
    parentGroup: 'quan',
    parentGroupName: 'Quần',
    gender: ['nu'],
    description: 'Quần legging nữ ôm sát co giãn 4 chiều, chất liệu thun mềm mịn tôn đường cong cơ thể.',
    order: 16,
  },
  'quan-jogger': {
    id: 'c-nu-quan-jogger',
    slug: 'quan-jogger',
    name: 'Joggers',
    englishName: 'Joggers',
    folderName: 'quan-jogger',
    folderPath: 'quan-ao-nu/quan/quan-jogger',
    parentGroup: 'quan',
    parentGroupName: 'Quần',
    gender: ['nu', 'unisex'],
    description: 'Quần jogger bo gấu thể thao vải nỉ da cá thoáng khí, thoải mái tập luyện và dạo phố.',
    order: 17,
  },

  // --- NHÓM 3: VÁY (5 danh mục) ---
  'chan-vay-ngan': {
    id: 'c-nu-chan-vay-ngan',
    slug: 'chan-vay-ngan',
    name: 'Chân váy ngắn',
    englishName: 'Mini Skirts',
    folderName: 'chan-vay-ngan',
    folderPath: 'quan-ao-nu/vay/chan-vay-ngan',
    parentGroup: 'vay',
    parentGroupName: 'Váy & Chân váy',
    gender: ['nu'],
    description: 'Chân váy ngắn xếp ly tennis, váy chữ A denim và kaki trẻ trung, năng động.',
    order: 18,
  },
  'chan-vay-dai': {
    id: 'c-nu-chan-vay-dai',
    slug: 'chan-vay-dai',
    name: 'Chân váy dài',
    englishName: 'Midi & Maxi Skirts',
    folderName: 'chan-vay-dai',
    folderPath: 'quan-ao-nu/vay/chan-vay-dai',
    parentGroup: 'vay',
    parentGroupName: 'Váy & Chân váy',
    gender: ['nu'],
    description: 'Chân váy dài qua gối dáng xòe hoặc suông lụa tơ, phong cách vintage thướt tha.',
    order: 19,
  },
  'vay-lien': {
    id: 'c-nu-vay-lien',
    slug: 'vay-lien',
    name: 'Váy liền',
    englishName: 'One-piece Dress',
    folderName: 'vay-lien',
    folderPath: 'quan-ao-nu/vay/vay-lien',
    parentGroup: 'vay',
    parentGroupName: 'Váy & Chân váy',
    gender: ['nu'],
    description: 'Váy liền thân chữ A, đầm suông phối nơ thanh lịch tiện lợi mặc hằng ngày.',
    order: 20,
  },
  'dam-maxi': {
    id: 'c-nu-dam-maxi',
    slug: 'dam-maxi',
    name: 'Maxi Dress',
    englishName: 'Maxi Dress',
    folderName: 'dam-maxi',
    folderPath: 'quan-ao-nu/vay/dam-maxi',
    parentGroup: 'vay',
    parentGroupName: 'Váy & Chân váy',
    gender: ['nu'],
    description: 'Đầm maxi dáng dài thướt tha hoa nhí, hoàn hảo cho các chuyến du lịch biển và dã ngoại.',
    order: 21,
  },
  'dam-du-tiec': {
    id: 'c-nu-dam-du-tiec',
    slug: 'dam-du-tiec',
    name: 'Đầm dự tiệc',
    englishName: 'Evening Dress',
    folderName: 'dam-du-tiec',
    folderPath: 'quan-ao-nu/vay/dam-du-tiec',
    parentGroup: 'vay',
    parentGroupName: 'Váy & Chân váy',
    gender: ['nu'],
    description: 'Đầm dự tiệc sang trọng bodycon, đầm cúp ngực đính kết tinh tế cho các buổi dạ hội.',
    order: 22,
  },

  // --- NHÓM 4: ÁO KHOÁC (4 danh mục) ---
  'ao-khoac-jean': {
    id: 'c-nu-ao-khoac-jean',
    slug: 'ao-khoac-jean',
    name: 'Denim Jacket',
    englishName: 'Denim Jacket',
    folderName: 'ao-khoac-jean',
    folderPath: 'quan-ao-nu/ao-khoac/ao-khoac-jean',
    parentGroup: 'ao-khoac',
    parentGroupName: 'Áo khoác',
    gender: ['nu', 'unisex'],
    description: 'Áo khoác bò denim jacket phom lửng hoặc oversize bụi bặm cá tính.',
    order: 23,
  },
  'ao-khoac-bomber': {
    id: 'c-nu-ao-khoac-bomber',
    slug: 'ao-khoac-bomber',
    name: 'Bomber',
    englishName: 'Bomber',
    folderName: 'ao-khoac-bomber',
    folderPath: 'quan-ao-nu/ao-khoac/ao-khoac-bomber',
    parentGroup: 'ao-khoac',
    parentGroupName: 'Áo khoác',
    gender: ['nu', 'unisex'],
    description: 'Áo khoác bomber dù gió 2 lớp bo viền thể thao, phong cách đường phố streetwear năng động.',
    order: 24,
  },
  'ao-blazer': {
    id: 'c-nu-ao-blazer',
    slug: 'ao-blazer',
    name: 'Blazer',
    englishName: 'Blazer',
    folderName: 'ao-blazer',
    folderPath: 'quan-ao-nu/ao-khoac/ao-blazer',
    parentGroup: 'ao-khoac',
    parentGroupName: 'Áo khoác',
    gender: ['nu', 'unisex'],
    description: 'Áo khoác blazer nữ dáng suông hoặc croptop độn vai nhẹ, chuẩn gu thời thượng Hàn Quốc.',
    order: 25,
  },
  'ao-khoac-chong-nang': {
    id: 'c-nu-ao-khoac-chong-nang',
    slug: 'ao-khoac-chong-nang',
    name: 'Áo khoác chống nắng',
    englishName: 'Sun UV Jacket',
    folderName: 'ao-khoac-chong-nang',
    folderPath: 'quan-ao-nu/ao-khoac/ao-khoac-chong-nang',
    parentGroup: 'ao-khoac',
    parentGroupName: 'Áo khoác',
    gender: ['nu'],
    description: 'Áo khoác chống tia UV UPF 50+, chất thun lạnh thoáng khí che chắn bảo vệ làn da.',
    order: 26,
  },

  // --- NHÓM 5: ĐỒ BỘ (3 danh mục) ---
  'set-ao-quan': {
    id: 'c-nu-set-ao-quan',
    slug: 'set-ao-quan',
    name: 'Set áo & quần',
    englishName: 'Top & Pants Set',
    folderName: 'set-ao-quan',
    folderPath: 'quan-ao-nu/do-bo/set-ao-quan',
    parentGroup: 'do-bo',
    parentGroupName: 'Đồ bộ',
    gender: ['nu'],
    description: 'Set đồ bộ phối sẵn gồm áo và quần dài hoặc short đồng điệu, tiện lợi không cần nghĩ cách phối.',
    order: 27,
  },
  'set-ao-chan-vay': {
    id: 'c-nu-set-ao-chan-vay',
    slug: 'set-ao-chan-vay',
    name: 'Set áo & chân váy',
    englishName: 'Top & Skirt Set',
    folderName: 'set-ao-chan-vay',
    folderPath: 'quan-ao-nu/do-bo/set-ao-chan-vay',
    parentGroup: 'do-bo',
    parentGroupName: 'Đồ bộ',
    gender: ['nu'],
    description: 'Set áo croptop hoặc blazer phối cùng chân váy chữ A nữ tính, tôn dáng rạng rỡ.',
    order: 28,
  },
  'do-the-thao': {
    id: 'c-nu-do-the-thao',
    slug: 'do-the-thao',
    name: 'Set thể thao',
    englishName: 'Sportswear Set',
    folderName: 'do-the-thao',
    folderPath: 'quan-ao-nu/do-bo/do-the-thao',
    parentGroup: 'do-bo',
    parentGroupName: 'Đồ bộ',
    gender: ['nu'],
    description: 'Set trang phục thể thao nữ năng động, tập gym, yoga hoặc chạy bộ co giãn tối ưu.',
    order: 29,
  },
};

// BẢNG TOÀN DIỆN HỆ THỐNG DANH MỤC CHO TOÀN BỘ SMARTBUY AI (NAM, NỮ, UNISEX, PHỤ KIỆN)
export const CATEGORY_DEFINITIONS: Record<string, CategoryMetadata> = {
  // Toàn bộ 29 danh mục Nữ
  ...WOMEN_CATEGORY_REGISTRY,

  // Các danh mục đặc thù Nam / Chung khác trong kho ảnh thực tế
  'ao-khoac': {
    id: 'c-ao-khoac',
    slug: 'ao-khoac',
    name: 'Áo khoác',
    englishName: 'Jackets',
    folderName: 'ao-khoac',
    folderPath: 'quan-ao-nam/ao-khoac',
    parentGroup: 'ao-khoac',
    parentGroupName: 'Áo khoác',
    gender: ['nam', 'nu', 'unisex'],
    image: '/images/san-pham/quan-ao-nam/ao-khoac/ao_khoac_1/1792798150493_348043404565674403_5540743654312280467_60fcf14a1a09d6ea8e932ef6e9b81180.jpg',
    description: 'Áo khoác gió dù 2 lớp cản gió chống nước nhẹ, thiết kế bomber dạo phố.',
    order: 7,
  },
  'do-bo': {
    id: 'c-do-bo',
    slug: 'do-bo',
    name: 'Đồ bộ',
    englishName: 'Sets & Tracksuits',
    folderName: 'do-bo',
    folderPath: 'quan-ao-nam/do-bo',
    parentGroup: 'do-bo',
    parentGroupName: 'Đồ bộ',
    gender: ['nam', 'nu', 'unisex'],
    image: '/images/san-pham/quan-ao-nam/do-bo/do_bo_1/1792815868582_348043404565674403_5540743654312280467_220b72458c928eec2908c6a704d6b993.jpg',
    description: 'Set trang phục thể thao và dạo phố đồng điệu gồm áo và quần, tiện lợi và năng động.',
    order: 30,
  },
  'phu-kien': {
    id: 'c-phu-kien',
    slug: 'phu-kien',
    name: 'Phụ kiện',
    englishName: 'Accessories',
    folderName: 'phu-kien',
    folderPath: 'phu-kien',
    parentGroup: 'phu-kien',
    parentGroupName: 'Phụ kiện',
    gender: ['nam', 'nu', 'unisex'],
    description: 'Trang sức titan, vòng tay, dây chuyền, nhẫn và mũ nón Gen Z.',
    order: 31,
  },
  'quan': {
    id: 'c-nu-quan',
    slug: 'quan',
    name: 'Quần',
    englishName: 'Pants',
    folderName: 'quan',
    folderPath: 'quan-ao-nu/quan',
    parentGroup: 'quan',
    parentGroupName: 'Quần',
    gender: ['nu'],
    description: 'Quần nữ thời trang cao cấp tôn dáng (Chờ admin xác minh loại con).',
    order: 11,
  },
  'vay': {
    id: 'c-nu-vay',
    slug: 'vay',
    name: 'Váy',
    englishName: 'Dresses & Skirts',
    folderName: 'vay',
    folderPath: 'quan-ao-nu/vay',
    parentGroup: 'vay',
    parentGroupName: 'Váy & Chân váy',
    gender: ['nu'],
    description: 'Váy và đầm nữ đa dạng phong cách thời thượng (Chờ admin xác minh loại con).',
    order: 18,
  },
};

/**
 * Lấy danh sách 29 danh mục Nữ chuẩn theo đúng thứ tự
 */
export function getWomenCategoryList(): CategoryMetadata[] {
  return Object.values(WOMEN_CATEGORY_REGISTRY).sort((a, b) => a.order - b.order);
}

/**
 * Lấy danh sách danh mục Nữ theo nhóm chính
 */
export function getWomenCategoriesByGroup(groupKey: ParentCategoryGroup): CategoryMetadata[] {
  return getWomenCategoryList().filter((c) => c.parentGroup === groupKey);
}

/**
 * Trả về danh sách danh mục có sản phẩm thực tế, tự động đếm số Product ID theo bộ lọc
 * NẾU KHÔNG CÓ SẢN PHẨM: trả về danh sách rỗng, không tạo sản phẩm giả
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
      if (gender === 'nam' && p.gender !== 'nam') return false;
      if (gender === 'nu' && p.gender !== 'nu') return false;
      if (gender === 'unisex' && p.gender !== 'unisex') return false;
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
    const groupName = meta?.parentGroupName || (groupKey === 'vay' ? 'Váy & Chân váy' : 'Khác');

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

  // Thứ tự hiển thị chuẩn: Áo -> Quần -> Váy & Chân váy -> Áo khoác -> Đồ bộ -> Phụ kiện -> Khác
  const groupOrder: ParentCategoryGroup[] = ['ao', 'quan', 'vay', 'ao-khoac', 'do-bo', 'chan-vay-dam', 'phu-kien', 'khac'];

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
