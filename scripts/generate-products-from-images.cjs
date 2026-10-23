const fs = require('fs');
const path = require('path');

const ROOT_IMAGE_DIR = path.resolve(__dirname, '..', 'public', 'images', 'san-pham');
const MANIFEST_FILE = path.join(ROOT_IMAGE_DIR, 'manifest.json');
const OUTPUT_TS_FILE = path.resolve(__dirname, '..', 'src', 'mocks', 'importedProducts.ts');

const VALID_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

// Bảng màu chuẩn Gen Z TMĐT
const COLOR_PALETTE = [
  { name: 'Đen Basic', hex: '#111111', slug: 'den' },
  { name: 'Trắng Sữa', hex: '#F9FAFB', slug: 'trang' },
  { name: 'Xám Khói', hex: '#6B7280', slug: 'xam' },
  { name: 'Beige Cát', hex: '#E5E7EB', slug: 'be' },
  { name: 'Nâu Đất', hex: '#78350F', slug: 'nau' },
  { name: 'Xanh Navy', hex: '#1E3A8A', slug: 'xanh-navy' },
  { name: 'Cyber Pink', hex: '#FF007F', slug: 'pink' },
  { name: 'Bạc Kim', hex: '#D1D5DB', slug: 'bac' },
];

const CLOTHING_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const ACC_SIZES = ['FreeSize'];

function scanDir(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(scanDir(full));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (VALID_EXTENSIONS.has(ext)) {
        const rel = path.relative(ROOT_IMAGE_DIR, full).replace(/\\/g, '/');
        results.push({
          fullPath: full,
          relativePath: rel,
          webPath: `/images/san-pham/${rel}`,
          fileName: entry.name,
          dirName: path.dirname(rel),
          ext,
        });
      }
    }
  }
  return results;
}

const scannedFiles = scanDir(ROOT_IMAGE_DIR);
console.log(`Tìm thấy tổng cộng ${scannedFiles.length} file ảnh trong public/images/san-pham/`);

// Nhóm ảnh theo thư mục
const folderMap = {};
for (const file of scannedFiles) {
  const d = file.dirName;
  if (!folderMap[d]) folderMap[d] = [];
  folderMap[d].push(file);
}

// Hàm sinh metadata kiểu TikTok Shop / Shopee
let productCounter = 1;
const generatedProducts = [];

for (const [folderKey, files] of Object.entries(folderMap)) {
  const parts = folderKey.split('/');
  
  // Xác định giới tính
  let gender = 'nam';
  if (parts.includes('quan-ao-nu')) gender = 'nu';
  else if (parts.includes('unisex')) gender = 'unisex';
  else if (parts.includes('phu-kien')) gender = 'unisex';

  // Xác định danh mục
  let categorySlug = 'ao-thun';
  let categoryName = 'Áo thun';
  let isAccessory = false;
  let basePrice = 189000;
  let originalPrice = 259000;
  let defaultStyle = 'Streetwear';
  let defaultFit = 'Oversized';
  let season = 'all';

  if (parts.includes('ao-thun')) {
    categorySlug = 'ao-thun';
    categoryName = gender === 'nam' ? 'Áo Thun Nam' : gender === 'nu' ? 'Áo Baby Tee Nữ' : 'Áo Thun Unisex';
    basePrice = 179000;
    originalPrice = 249000;
    season = 'summer';
  } else if (parts.includes('ao-thun-dai-tay')) {
    categorySlug = 'ao-thun';
    categoryName = gender === 'nam' ? 'Áo Thun Dài Tay Nam' : 'Áo Thun Dài Tay Unisex';
    basePrice = 199000;
    originalPrice = 279000;
    season = 'spring-autumn';
  } else if (parts.includes('ao-polo')) {
    categorySlug = 'so-mi-polo';
    categoryName = 'Áo Polo Nam Cổ Bẻ';
    basePrice = 219000;
    originalPrice = 299000;
    defaultFit = 'Boxy Regular';
    season = 'summer';
  } else if (parts.includes('ao-so-mi')) {
    categorySlug = 'so-mi-polo';
    categoryName = 'Áo Sơ Mi Nam Form Rộng';
    basePrice = 239000;
    originalPrice = 329000;
    defaultFit = 'Relaxed Fit';
    season = 'all';
  } else if (parts.includes('ao-hoodie')) {
    categorySlug = 'hoodie-sweater';
    categoryName = 'Áo Hoodie Nỉ Bông Có Mũ';
    basePrice = 329000;
    originalPrice = 459000;
    season = 'winter';
  } else if (parts.includes('ao-len')) {
    categorySlug = 'hoodie-sweater';
    categoryName = 'Áo Len Dệt Kim Cổ Tròn';
    basePrice = 289000;
    originalPrice = 399000;
    season = 'winter';
  } else if (parts.includes('ao-khoac')) {
    categorySlug = 'ao-khoac';
    categoryName = gender === 'nam' ? 'Áo Khoác Bomber Nam' : 'Áo Khoác Nữ';
    basePrice = 369000;
    originalPrice = 499000;
    season = 'winter';
  } else if (parts.includes('quan-jeans')) {
    categorySlug = 'quan-jeans';
    categoryName = gender === 'nam' ? 'Quần Jeans Baggy Nam' : 'Quần Jeans Ống Suông Nữ';
    basePrice = 299000;
    originalPrice = 419000;
    defaultFit = 'Baggy';
  } else if (parts.includes('quan-short')) {
    categorySlug = 'quan-jeans';
    categoryName = gender === 'nam' ? 'Quần Short Kaki Nam' : 'Quần Short Nữ';
    basePrice = 169000;
    originalPrice = 239000;
    season = 'summer';
  } else if (parts.includes('quan-dai') || parts.includes('quan')) {
    categorySlug = 'quan-cargo-parachute';
    categoryName = 'Quần Cargo Ống Rộng Túi Hộp';
    basePrice = 279000;
    originalPrice = 389000;
    defaultFit = 'Ống rộng (Wide Leg)';
  } else if (parts.includes('chan-vay')) {
    categorySlug = 'chan-vay';
    categoryName = 'Chân Váy Xếp Ly Cạp Cao';
    gender = 'nu';
    basePrice = 189000;
    originalPrice = 259000;
    defaultFit = 'Regular';
  } else if (parts.includes('dam')) {
    categorySlug = 'chan-vay';
    categoryName = 'Đầm Nữ Dáng Suông Dạo Phố';
    gender = 'nu';
    basePrice = 269000;
    originalPrice = 369000;
  } else if (parts.includes('phu-kien') || parts.includes('trang-suc') || parts.includes('tui-xach') || parts.includes('mu-non')) {
    categorySlug = 'phu-kien';
    isAccessory = true;
    categoryName = parts.includes('tui-xach') ? 'Túi Xách Canvas Đeo Chéo' : parts.includes('mu-non') ? 'Mũ Beanie Len Streetwear' : 'Vòng Cổ Titan Unisex';
    basePrice = 99000;
    originalPrice = 159000;
  }

  // Tiêu đề phụ TikTok Shop / Shopee đa dạng
  const TITLES_SUFFIX = [
    'Basic Form Rộng Phong Cách Streetwear',
    'Chất Liệu Cotton Cao Cấp Thấm Hút Tốt',
    'In Họa Tiết Retro Hàn Quốc Hot Trend 2026',
    'Thiết Kế Tối Giản Mặc Hằng Ngày Đi Học Đi Chơi',
    'Dáng Rộng Unisex Trẻ Trung Năng Động',
    'Dệt Mịn Đứng Phom Bền Màu Không Xù',
    'Phối Màu Pastel Cực Nghệ Chuẩn Gu Gen Z',
    'Phong Cách Korean Casual Dễ Phối Đồ',
  ];

  // Mỗi ảnh trong thư mục là một sản phẩm thực tế
  files.forEach((file, idx) => {
    const id = `sb-real-${productCounter}`;
    const suffix = TITLES_SUFFIX[idx % TITLES_SUFFIX.length];
    const name = `${categoryName} ${suffix} #${productCounter}`;
    const slug = `smartbuy-${gender}-${categorySlug}-${productCounter}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Giá ngẫu nhiên hợp lý
    const priceVariance = (idx % 5) * 10000;
    const finalPrice = basePrice + priceVariance;
    const finalOrigPrice = originalPrice + priceVariance + 20000;
    const discountPercent = Math.round(((finalOrigPrice - finalPrice) / finalOrigPrice) * 100);

    // Màu sắc
    const chosenColors = [
      COLOR_PALETTE[idx % COLOR_PALETTE.length],
      COLOR_PALETTE[(idx + 1) % COLOR_PALETTE.length],
      COLOR_PALETTE[(idx + 2) % COLOR_PALETTE.length],
    ];

    const sizes = isAccessory ? ACC_SIZES : CLOTHING_SIZES;

    // Sinh biến thể variants
    const variants = [];
    chosenColors.forEach((c) => {
      sizes.forEach((s) => {
        variants.push({
          id: `${id}-${c.slug}-${s.toLowerCase()}`,
          sku: `SB-${gender.toUpperCase()}-${id.toUpperCase()}-${c.slug.toUpperCase()}-${s}`,
          color: c,
          size: s,
          price: finalPrice,
          originalPrice: finalOrigPrice,
          stock: 15 + ((idx * 3 + s.length) % 25),
          image: file.webPath,
        });
      });
    });

    const badges = ['NEW', 'HOT', 'BÁN CHẠY', 'DROP', 'SALE 30%', 'TRENDING'];
    const badge = badges[idx % badges.length];
    const rating = 4.8 + Number(((idx % 3) * 0.1).toFixed(1));
    const reviewCount = 95 + (idx * 17) % 500;
    const soldCount = `${(1.2 + (idx * 0.3) % 4.5).toFixed(1)}k`;

    const product = {
      id,
      name,
      slug,
      categorySlug,
      gender,
      brand: 'SMARTBUY AI',
      price: finalPrice,
      originalPrice: finalOrigPrice,
      shortDescription: `Thiết kế ${categoryName.toLowerCase()} basic dễ phối đồ, chất liệu mềm mại thoáng khí, phom dáng chuẩn phong cách Gen Z năng động.`,
      description: `🔥 MÔ TẢ SẢN PHẨM:
- Tên sản phẩm: ${name}
- Thương hiệu: SMARTBUY AI (Chính hãng)
- Chất liệu: Vải cao cấp chọn lọc, mềm mịn, co giãn nhẹ và thấm hút mồ hôi tối ưu
- Form dáng: ${defaultFit} phóng khoáng, che khuyết điểm tốt
- Phù hợp: Đi học, đi làm, dạo phố, chụp ảnh OOTD

✨ ĐẶC ĐIỂM NỔI BẬT:
- Thiết kế basic hiện đại, dễ dàng phối cùng quần jeans, short hoặc cargo
- Đường may hai kim chắc chắn, bo viền dệt sắc nét không bai dão
- Bền màu sau nhiều lần giặt, không xù lông

📋 BẢNG SIZE GỢI Ý:
- Size S: 45kg - 55kg (Cao 1m55 - 1m65)
- Size M: 55kg - 65kg (Cao 1m65 - 1m72)
- Size L: 65kg - 75kg (Cao 1m70 - 1m78)
- Size XL: 75kg - 85kg (Cao 1m75 - 1m85)
- Size XXL: 85kg - 95kg (Cao 1m80 - 1m90)

🧼 HƯỚNG DẪN BẢO QUẢN:
- Giặt lộn trái với nước lạnh ở chế độ nhẹ
- Không dùng nước tẩy clo mạnh
- Phơi trong bóng râm thoáng mát

⭐ CHÍNH SÁCH BÁN HÀNG SMARTBUY:
- Ảnh thật 100% từ kho hàng SMARTBUY AI
- Đổi size linh hoạt trong 15 ngày tận nhà
- Hoàn tiền 100% nếu sản phẩm có lỗi từ nhà sản xuất`,
      material: isAccessory ? 'Titanium / Canvas bền bỉ' : 'Cotton 100% Compact cao cấp',
      fit: defaultFit,
      style: defaultStyle,
      occasion: ['Đi học', 'Dạo phố', 'Hằng ngày', 'Chụp OOTD'],
      season,
      careInstructions: [
        'Giặt lộn trái ở nhiệt độ phòng',
        'Không dùng chất tẩy mạnh',
        'Ủi ở nhiệt độ thấp hoặc vừa',
      ],
      images: [file.webPath],
      colors: chosenColors,
      sizes,
      variants,
      rating,
      reviewCount,
      soldCount,
      discountPercent,
      badge,
      isFeatured: idx % 3 === 0,
      isNewArrival: idx % 2 === 0,
      createdAt: '2026-03-20',
      updatedAt: '2026-03-23',
      isActive: true,
      needsReview: true,
    };

    generatedProducts.push(product);
    productCounter++;
  });
}

console.log(`✓ Đã tạo thành công ${generatedProducts.length} sản phẩm thực tế từ kho ảnh!`);

// Lưu manifest JSON
const manifest = {
  version: '3.0.0',
  description: 'SMARTBUY AI Real Image Products Manifest',
  generatedAt: new Date().toISOString(),
  totalImages: scannedFiles.length,
  totalProducts: generatedProducts.length,
  folders: Object.keys(folderMap),
};
fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf8');
console.log(`✓ Đã lưu manifest tại: ${MANIFEST_FILE}`);

// Lưu file TypeScript importedProducts.ts
const tsContent = `// File tự động sinh từ toàn bộ ảnh thật trong public/images/san-pham/
import { Product } from '@/types';

export const IMPORTED_PRODUCTS: Product[] = ${JSON.stringify(generatedProducts, null, 2)};
`;

fs.writeFileSync(OUTPUT_TS_FILE, tsContent, 'utf8');
console.log(`✓ Đã lưu danh sách sản phẩm thực tế tại: ${OUTPUT_TS_FILE}`);
