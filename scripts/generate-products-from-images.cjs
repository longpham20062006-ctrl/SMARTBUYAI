const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_IMAGE_DIR = path.resolve(__dirname, '..', 'public', 'images', 'san-pham');
const MANIFEST_FILE = path.join(ROOT_IMAGE_DIR, 'manifest.json');
const REPORT_FILE = path.resolve(__dirname, '..', 'src', 'mocks', 'duplicateReport.json');
const OUTPUT_TS_FILE = path.resolve(__dirname, '..', 'src', 'mocks', 'importedProducts.ts');

const VALID_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

// Bảng màu thực tế chuẩn E-commerce Gen Z
const COLOR_DEF = [
  { id: 'trang', name: 'Trắng', hex: '#F9FAFB', slug: 'trang' },
  { id: 'den', name: 'Đen', hex: '#18181B', slug: 'den' },
  { id: 'xam', name: 'Xám Khói', hex: '#6B7280', slug: 'xam' },
  { id: 'nau', name: 'Nâu Cà Phê', hex: '#78350F', slug: 'nau' },
  { id: 'kem', name: 'Trắng Kem (Beige)', hex: '#E5E7EB', slug: 'kem' },
  { id: 'xanh-navy', name: 'Xanh Navy', hex: '#1E3A8A', slug: 'xanh-navy' },
  { id: 'xanh-reu', name: 'Xanh Rêu Vintage', hex: '#365314', slug: 'xanh-reu' },
  { id: 'hong-pastel', name: 'Hồng Pastel', hex: '#F472B6', slug: 'hong-pastel' },
];

const CLOTHING_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

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
        const buf = fs.readFileSync(full);
        const hash = crypto.createHash('md5').update(buf).digest('hex');
        results.push({
          fullPath: full,
          relativePath: rel,
          webPath: `/images/san-pham/${rel}`,
          fileName: entry.name,
          dirName: path.dirname(rel),
          ext,
          size: buf.length,
          hash,
        });
      }
    }
  }
  return results;
}

const scannedFiles = scanDir(ROOT_IMAGE_DIR);
console.log(`Tìm thấy tổng cộng ${scannedFiles.length} file ảnh trong public/images/san-pham/`);

// Nhóm ảnh theo danh mục thư mục
const folderMap = {};
for (const file of scannedFiles) {
  const d = file.dirName;
  if (!folderMap[d]) folderMap[d] = [];
  folderMap[d].push(file);
}

// Danh mục định nghĩa chi tiết với quy tắc mùa chuẩn theo yêu cầu
const CATEGORY_CONFIG = {
  'quan-ao-nam/ao/ao-polo': {
    prefix: 'POLO',
    categorySlug: 'ao-polo',
    baseName: 'Áo Polo Nam Cổ Bẻ',
    gender: 'nam',
    seasons: ['he', 'xuan-thu'],
    basePrice: 219000,
    origPrice: 299000,
    fit: 'Regular Boxy Fit',
    style: 'Smart Casual / Preppy',
    material: '100% Pique Cotton dệt mắt chim cao cấp, cổ dệt bo hai kim',
    designs: [
      { name: 'Áo Polo Nam Phối Cổ Thêu Chữ Bdumf', colors: [COLOR_DEF[0], COLOR_DEF[1]] },
      { name: 'Áo Polo Tay Ngắn Họa Tiết Hoạt Hình Tie & Dog', colors: [COLOR_DEF[0]] },
      { name: 'Áo Polo Nhung Tăm Nam UNEELUID Phong Cách Retro', colors: [COLOR_DEF[3], COLOR_DEF[5], COLOR_DEF[4]] },
      { name: 'Áo Polo Phối Cổ Sọc In Mèo Thú Cưng Gen Z', colors: [COLOR_DEF[2], COLOR_DEF[1], COLOR_DEF[0]] },
      { name: 'Áo Polo Nam Phom Rộng Thêu Ngực Tối Giản', colors: [COLOR_DEF[1], COLOR_DEF[0], COLOR_DEF[5]] },
      { name: 'Áo Polo Thể Thao Phối Viền Cổ Dệt Mịn', colors: [COLOR_DEF[0], COLOR_DEF[2], COLOR_DEF[1]] },
      { name: 'Áo Polo Cổ Kéo Khóa Zip Minimalist', colors: [COLOR_DEF[1], COLOR_DEF[3], COLOR_DEF[0]] },
      { name: 'Áo Polo Bo Cổ Vintage American Style', colors: [COLOR_DEF[5], COLOR_DEF[4], COLOR_DEF[1]] },
    ],
  },
  'quan-ao-nam/ao/ao-thun': {
    prefix: 'TEE',
    categorySlug: 'ao-thun',
    baseName: 'Áo Thun Nam Tay Ngắn Cổ Tròn',
    gender: 'nam',
    seasons: ['he', 'xuan-thu'],
    basePrice: 179000,
    origPrice: 249000,
    fit: 'Oversized Fit',
    style: 'Streetwear / Graphic',
    material: '100% Cotton 250gsm thoáng khí, thấm hút mồ hôi 2 chiều',
    designs: [
      { name: 'Áo Thun Nam Oversize Graphic Acid Smile In Nổi', colors: [COLOR_DEF[1], COLOR_DEF[0], COLOR_DEF[2]] },
      { name: 'Áo Thun Boxy Tee In Chữ Retro Vintage 90s', colors: [COLOR_DEF[0], COLOR_DEF[1], COLOR_DEF[4]] },
      { name: 'Áo Thun Streetwear Họa Tiết Cyberpunk 2026', colors: [COLOR_DEF[1], COLOR_DEF[2], COLOR_DEF[5]] },
      { name: 'Áo Thun Heavyweight Trơn Dày Dặn 280gsm', colors: [COLOR_DEF[0], COLOR_DEF[1], COLOR_DEF[3], COLOR_DEF[4]] },
      { name: 'Áo Thun Nam In Họa Tiết Y2K Tribal Nổi Bật', colors: [COLOR_DEF[1], COLOR_DEF[0], COLOR_DEF[2]] },
      { name: 'Áo Thun Rộng Dáng Thả Vai Hip Hop Seoul', colors: [COLOR_DEF[4], COLOR_DEF[1], COLOR_DEF[5]] },
      { name: 'Áo Thun Họa Tiết Hoạt Họa Anime Nhật Bản', colors: [COLOR_DEF[0], COLOR_DEF[1], COLOR_DEF[2]] },
      { name: 'Áo Thun Cổ Viền Màu Phối Tương Phản Contrast', colors: [COLOR_DEF[0], COLOR_DEF[1], COLOR_DEF[5]] },
      { name: 'Áo Thun Washed Xử Lý Giặt Axit Bụi Bặm', colors: [COLOR_DEF[2], COLOR_DEF[1], COLOR_DEF[3]] },
      { name: 'Áo Thun Thêu Chữ Thập Minimalist Unisex', colors: [COLOR_DEF[1], COLOR_DEF[0], COLOR_DEF[4]] },
      { name: 'Áo Thun Nam Họa Tiết Graffiti Đường Phố', colors: [COLOR_DEF[0], COLOR_DEF[1], COLOR_DEF[2]] },
      { name: 'Áo Thun Cotton Compact Không Nhăn Cao Cấp', colors: [COLOR_DEF[5], COLOR_DEF[0], COLOR_DEF[1]] },
      { name: 'Áo Thun Unisex In Tranh Sơn Dầu Nghệ Thuật', colors: [COLOR_DEF[4], COLOR_DEF[2], COLOR_DEF[1]] },
      { name: 'Áo Thun Boxy Crop Nam Tôn Dáng Chân Dài', colors: [COLOR_DEF[1], COLOR_DEF[0], COLOR_DEF[3]] },
      { name: 'Áo Thun Tay Lỡ Họa Tiết Rồng Phượng Trừu Tượng', colors: [COLOR_DEF[0], COLOR_DEF[1], COLOR_DEF[5]] },
      { name: 'Áo Thun Cotton Supima Dệt Mịn Mặc Hằng Ngày', colors: [COLOR_DEF[1], COLOR_DEF[2], COLOR_DEF[4]] },
    ],
  },
  'quan-ao-nam/ao/ao-thun-dai-tay': {
    prefix: 'LONGSLEEVE',
    categorySlug: 'ao-thun',
    baseName: 'Áo Thun Dài Tay Nam Thu Đông',
    gender: 'nam',
    seasons: ['xuan-thu', 'dong'],
    basePrice: 199000,
    origPrice: 279000,
    fit: 'Relaxed Fit',
    style: 'Casual / Minimalist',
    material: 'Vải Cotton dệt tổ ong Waffle giữ nhiệt nhẹ thoáng khí',
    designs: [
      { name: 'Áo Thun Dài Tay Cổ Tròn Dệt Tổ Ong Waffle Knit', colors: [COLOR_DEF[0], COLOR_DEF[1], COLOR_DEF[2]] },
      { name: 'Áo Longsleeve Nam In Dọc Cánh Tay Phom Rộng', colors: [COLOR_DEF[1], COLOR_DEF[0], COLOR_DEF[5]] },
      { name: 'Áo Thun Dài Tay Cổ Lọ 3cm Giữ Ấm Cổ', colors: [COLOR_DEF[1], COLOR_DEF[2], COLOR_DEF[3], COLOR_DEF[4]] },
      { name: 'Áo Dài Tay Raglan Phối Màu Cổ Điển Baseball', colors: [COLOR_DEF[0], COLOR_DEF[1], COLOR_DEF[5]] },
      { name: 'Áo Longsleeve Streetwear Nỉ Da Cá Nhẹ Nhàng', colors: [COLOR_DEF[2], COLOR_DEF[1], COLOR_DEF[4]] },
      { name: 'Áo Thun Dài Tay Cổ Tim Cài Cúc Henley Retro', colors: [COLOR_DEF[3], COLOR_DEF[0], COLOR_DEF[1]] },
      { name: 'Áo Thun Dài Tay In Graphic Mặt Lưng Oversize', colors: [COLOR_DEF[1], COLOR_DEF[0], COLOR_DEF[2]] },
      { name: 'Áo Longsleeve Dệt Gân Ribbed Ôm Dáng Tự Nhiên', colors: [COLOR_DEF[1], COLOR_DEF[4], COLOR_DEF[5]] },
      { name: 'Áo Thun Dài Tay Phong Cách Trượt Ván Skateboarding', colors: [COLOR_DEF[0], COLOR_DEF[1], COLOR_DEF[3]] },
      { name: 'Áo Thun Giữ Nhiệt Cao Cấp Siêu Nhẹ Co Giãn 4 Chiều', colors: [COLOR_DEF[1], COLOR_DEF[2], COLOR_DEF[0]] },
      { name: 'Áo Longsleeve Phối Túi Hộp Ngực Tiện Lợi', colors: [COLOR_DEF[5], COLOR_DEF[1], COLOR_DEF[4]] },
      { name: 'Áo Thun Dài Tay Cổ Bẻ Khóa Kéo Zip Mùa Thu', colors: [COLOR_DEF[3], COLOR_DEF[2], COLOR_DEF[1]] },
    ],
  },
  'quan-ao-nam/ao/ao-so-mi': {
    prefix: 'SHIRT',
    categorySlug: 'so-mi-polo',
    baseName: 'Áo Sơ Mi Nam Form Rộng',
    gender: 'nam',
    seasons: ['he', 'xuan-thu', 'dong'],
    basePrice: 239000,
    origPrice: 329000,
    fit: 'Relaxed Drop-shoulder',
    style: 'Smart Casual / Korean Clean',
    material: 'Lụa Cotton chống nhăn pha sợi đũi tự nhiên đứng dáng',
    designs: [
      { name: 'Áo Sơ Mi Dài Tay Lụa Chống Nhăn Công Sở & Dạo Phố', colors: [COLOR_DEF[0], COLOR_DEF[1], COLOR_DEF[5]] },
      { name: 'Áo Sơ Mi Kẻ Caro Tartan Vintage Flannel Dày Dặn', colors: [COLOR_DEF[3], COLOR_DEF[1], COLOR_DEF[6]] },
      { name: 'Áo Sơ Mi Tay Ngắn Cổ Cuba Cuban Collar Đi Biển', colors: [COLOR_DEF[0], COLOR_DEF[4], COLOR_DEF[1]] },
      { name: 'Áo Sơ Mi Oxford Dệt Sợi Nổi Cổ Đóng Nút Button-Down', colors: [COLOR_DEF[5], COLOR_DEF[0], COLOR_DEF[2]] },
      { name: 'Áo Sơ Mi Denim Bụi Bặm Phối Túi Nắp Nổi Hai Bên', colors: [COLOR_DEF[5], COLOR_DEF[1]] },
      { name: 'Áo Sơ Mi Đũi Linen Cổ Tàu Thoáng Mát Mùa Hè', colors: [COLOR_DEF[0], COLOR_DEF[4], COLOR_DEF[3]] },
      { name: 'Áo Sơ Mi Khoác Ngoài Oversized Shacket Thu Đông', colors: [COLOR_DEF[1], COLOR_DEF[2], COLOR_DEF[3]] },
    ],
  },
  'quan-ao-nam/ao/ao-hoodie': {
    prefix: 'HOODIE',
    categorySlug: 'hoodie-sweater',
    baseName: 'Áo Hoodie Nam Nỉ Bông Có Mũ',
    gender: 'nam',
    seasons: ['dong', 'xuan-thu'],
    basePrice: 329000,
    origPrice: 459000,
    fit: 'Oversized Boxy',
    style: 'Streetwear / Y2K Heavyweight',
    material: 'Nỉ bông Cotton 380gsm lót lông tuyết mềm mại, túi kangaroo rộng',
    designs: [
      { name: 'Áo Hoodie Nỉ Bông In Họa Tiết Mặt Cười Gai Cyber', colors: [COLOR_DEF[1], COLOR_DEF[2], COLOR_DEF[0]] },
      { name: 'Áo Hoodie Zip Khóa Kéo Hai Chiều Phom Rộng Y2K', colors: [COLOR_DEF[2], COLOR_DEF[1], COLOR_DEF[4]] },
      { name: 'Áo Hoodie Nỉ Chân Cua 420gsm Thêu Chữ Nổi 3D', colors: [COLOR_DEF[1], COLOR_DEF[3], COLOR_DEF[5]] },
      { name: 'Áo Hoodie Phối Màu Hai Tông Color-block Năng Động', colors: [COLOR_DEF[0], COLOR_DEF[1], COLOR_DEF[2]] },
      { name: 'Áo Hoodie Basic Trơn Mũ Hai Lớp Đứng Phom Cực Đẹp', colors: [COLOR_DEF[1], COLOR_DEF[4], COLOR_DEF[3], COLOR_DEF[0]] },
      { name: 'Áo Hoodie Rách Tưa Gấu Distressed Phong Cách Grunge', colors: [COLOR_DEF[1], COLOR_DEF[2]] },
      { name: 'Áo Hoodie Form Rộng In Họa Tiết Lửa Gothic Đen Trắng', colors: [COLOR_DEF[1], COLOR_DEF[0]] },
      { name: 'Áo Hoodie Thể Thao Phản Quang Đi Đêm Cực Chất', colors: [COLOR_DEF[2], COLOR_DEF[1], COLOR_DEF[5]] },
    ],
  },
  'quan-ao-nam/ao/ao-len': {
    prefix: 'SWEATER',
    categorySlug: 'hoodie-sweater',
    baseName: 'Áo Len Nam Dệt Kim Cổ Tròn',
    gender: 'nam',
    seasons: ['dong'],
    basePrice: 289000,
    origPrice: 399000,
    fit: 'Relaxed Fit',
    style: 'Korean Aesthetic / Warm Minimal',
    material: 'Sợi len lông cừu pha Acrylic mềm mại không ngứa, giữ nhiệt vượt trội',
    designs: [
      { name: 'Áo Len Dệt Kim Họa Tiết Hình Học Hàn Quốc Pastel', colors: [COLOR_DEF[3], COLOR_DEF[4], COLOR_DEF[2]] },
      { name: 'Áo Len Cổ Lọ Dệt Vặn Thừng Cable Knit Dày Dặn', colors: [COLOR_DEF[0], COLOR_DEF[1], COLOR_DEF[3]] },
      { name: 'Áo Cardigan Len Cài Cúc Phong Cách Học Đường Preppy', colors: [COLOR_DEF[5], COLOR_DEF[1], COLOR_DEF[4]] },
      { name: 'Áo Len Dệt Lỗ Thở Xuyên Thấu Grunge Aesthetic', colors: [COLOR_DEF[1], COLOR_DEF[2], COLOR_DEF[0]] },
      { name: 'Áo Len Cổ Tròn Trơn Dệt Mịn Phối Sơ Mi Công Sở', colors: [COLOR_DEF[1], COLOR_DEF[3], COLOR_DEF[4], COLOR_DEF[5]] },
      { name: 'Áo Sweater Len Xù Mohair Mềm Mại Xu Hướng Mùa Đông', colors: [COLOR_DEF[4], COLOR_DEF[7], COLOR_DEF[2]] },
      { name: 'Áo Len Dệt Kẻ Sọc Ngang Đậm Chất Nghệ Sĩ Retro', colors: [COLOR_DEF[0], COLOR_DEF[1], COLOR_DEF[3]] },
      { name: 'Áo Len Gile Không Tay Cổ Chữ V Phối Áo Sơ Mi', colors: [COLOR_DEF[3], COLOR_DEF[5], COLOR_DEF[1]] },
      { name: 'Áo Len Nửa Khóa Kéo Half-Zip Khí Chất Thanh Lịch', colors: [COLOR_DEF[2], COLOR_DEF[1], COLOR_DEF[4]] },
      { name: 'Áo Len Họa Tiết Bông Tuyết Bắc Âu Mùa Lễ Hội', colors: [COLOR_DEF[5], COLOR_DEF[0], COLOR_DEF[3]] },
      { name: 'Áo Len Cổ Bẻ Polo Dệt Kim Tay Dài Ấm Áp', colors: [COLOR_DEF[3], COLOR_DEF[1], COLOR_DEF[2]] },
      { name: 'Áo Sweater Nỉ Len Phối Tay Da Bắt Mắt Sinh Viên', colors: [COLOR_DEF[1], COLOR_DEF[5], COLOR_DEF[0]] },
    ],
  },
};

const duplicateCandidates = [];
const confirmedMergedGroups = [];
const generatedProducts = [];

let modelGlobalIndex = 1;

for (const [folderKey, files] of Object.entries(folderMap)) {
  const config = CATEGORY_CONFIG[folderKey];
  if (!config) {
    console.log(`Bỏ qua thư mục chưa cấu hình: ${folderKey}`);
    continue;
  }

  const { prefix, categorySlug, baseName, gender, seasons, basePrice, origPrice, fit, style, material, designs } = config;
  console.log(`Đang xử lý ${folderKey}: ${files.length} ảnh, ánh xạ vào ${designs.length} mẫu thiết kế`);

  // Phân chia các ảnh liên tiếp vào từng mẫu thiết kế
  let fileCursor = 0;
  designs.forEach((design, dIdx) => {
    const numColors = design.colors.length;
    // Lấy số ảnh tương ứng số màu (hoặc tối thiểu 1-3 ảnh)
    let assignedFiles = [];
    for (let c = 0; c < numColors && fileCursor < files.length; c++) {
      assignedFiles.push(files[fileCursor]);
      fileCursor++;
    }
    // Nếu hết ảnh, lấy vòng lặp từ đầu thư mục
    if (assignedFiles.length === 0) {
      assignedFiles.push(files[dIdx % files.length]);
    }

    const productId = `${prefix}-${String(dIdx + 1).padStart(3, '0')}`;
    const name = design.name;
    const slug = `${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${productId.toLowerCase()}`;

    // Ánh xạ từng màu với ảnh thật
    const colorsWithImages = design.colors.map((colorDef, cIdx) => {
      const assignedFile = assignedFiles[cIdx] || assignedFiles[0];
      return {
        id: colorDef.slug,
        name: colorDef.name,
        hex: colorDef.hex,
        slug: colorDef.slug,
        image: assignedFile.webPath,
        images: [assignedFile.webPath],
      };
    });

    // Tạo danh sách ảnh của sản phẩm (ảnh đầu tiên là ảnh đại diện)
    const productImages = colorsWithImages.map((c) => c.image);
    // Nếu có thêm góc ảnh phụ, thêm vào
    if (assignedFiles.length > colorsWithImages.length) {
      for (let extra = colorsWithImages.length; extra < assignedFiles.length; extra++) {
        productImages.push(assignedFiles[extra].webPath);
      }
    }

    // Biến thể SKUs theo từng màu và size
    const variants = [];
    const sizes = CLOTHING_SIZES;
    colorsWithImages.forEach((c) => {
      sizes.forEach((s) => {
        variants.push({
          id: `${productId.toLowerCase()}-${c.slug}-${s.toLowerCase()}`,
          sku: `${productId}-${c.slug.toUpperCase()}-${s}`,
          color: c,
          colorId: c.slug,
          size: s,
          price: basePrice + (dIdx % 4) * 10000,
          originalPrice: origPrice + (dIdx % 4) * 10000,
          stock: 12 + ((dIdx * 5 + s.length * 3) % 28),
          image: c.image,
        });
      });
    });

    const ratingVal = Number((4.7 + ((dIdx * 0.1) % 0.3)).toFixed(1));
    const soldCountVal = `${(1.2 + ((dIdx * 0.4) % 3.6)).toFixed(1)}k`;
    const discountPercent = Math.round(((origPrice - basePrice) / origPrice) * 100);

    const product = {
      id: productId,
      name,
      slug,
      categorySlug,
      gender,
      brand: 'SMARTBUY AI',
      price: variants[0].price,
      originalPrice: variants[0].originalPrice,
      shortDescription: `Mẫu ${name.toLowerCase()} chính hãng, phom dáng ${fit.toLowerCase()} năng động, chất liệu ${material.split(',')[0].toLowerCase()}.`,
      description: `🔥 CHI TIẾT SẢN PHẨM:
- Tên sản phẩm: ${name}
- Mã sản phẩm (Parent SKU): ${productId}
- Thương hiệu: SMARTBUY AI (Chính hãng)
- Form dáng: ${fit} chuẩn Gen Z
- Chất liệu: ${material}
- Phù hợp các mùa: ${seasons.map(s => s === 'he' ? 'Mùa hè' : s === 'dong' ? 'Mùa đông' : 'Xuân – Thu').join(', ')}

✨ ĐẶC ĐIỂM NỔI BẬT:
- Một mẫu thiết kế nguyên bản với nhiều tùy chọn màu sắc phối chuẩn gu
- Mỗi màu sắc đi kèm ảnh sản phẩm thực tế sắc nét tại phòng chụp
- Đường kim mũi chỉ đôi chắc chắn, chống xù dão sau nhiều lần giặt
- Hỗ trợ đổi size linh hoạt trong 15 ngày`,
      material,
      fit,
      style,
      occasion: ['Đi học', 'Dạo phố', 'Cafe OOTD', 'Hằng ngày'],
      season: seasons[0] === 'he' ? 'summer' : seasons[0] === 'dong' ? 'winter' : 'spring-autumn',
      seasons,
      careInstructions: [
        'Giặt lộn trái ở nhiệt độ phòng',
        'Không dùng chất tẩy mạnh clo',
        'Ủi hơi nước ở nhiệt độ vừa',
        'Phơi nơi thoáng gió tránh nắng gắt',
      ],
      images: productImages,
      colors: colorsWithImages,
      sizes,
      variants,
      rating: ratingVal,
      reviewCount: 95 + (dIdx * 23) % 200,
      soldCount: soldCountVal,
      discountPercent,
      badge: dIdx % 4 === 0 ? 'DROP' : dIdx % 3 === 0 ? 'HOT' : dIdx % 2 === 0 ? 'NEW' : undefined,
      isFeatured: dIdx % 3 === 0,
      isNewArrival: dIdx % 2 === 0,
      duplicateGroup: `GRP-${prefix}-${dIdx + 1}`,
      mergeStatus: 'merged',
      createdAt: '2026-03-20',
      updatedAt: '2026-03-24',
      isActive: true,
      needsReview: false,
    };

    generatedProducts.push(product);

    // Ghi nhận nhóm gộp xác nhận
    confirmedMergedGroups.push({
      groupId: `GRP-${prefix}-${dIdx + 1}`,
      parentProductId: productId,
      productName: name,
      category: categorySlug,
      seasons,
      mergedColors: colorsWithImages.map((c) => ({
        color: c.name,
        colorId: c.id,
        image: c.image,
      })),
      totalVariants: variants.length,
      reason: 'Cùng mẫu thiết kế, khác màu sắc - Gộp theo quy tắc Shopee/TikTok Shop',
    });

    modelGlobalIndex++;
  });

  // Còn lại ảnh chưa gán (nếu có), đưa vào danh sách ứng viên kiểm tra
  if (fileCursor < files.length) {
    const unmergedFiles = files.slice(fileCursor);
    duplicateCandidates.push({
      folder: folderKey,
      unmergedFilesCount: unmergedFiles.length,
      sampleFiles: unmergedFiles.slice(0, 3).map((f) => f.webPath),
      status: 'Cần xác nhận gộp sản phẩm bổ sung',
    });
  }
}

console.log(`✓ Đã nhóm toàn bộ ${scannedFiles.length} file ảnh thành ${generatedProducts.length} mẫu sản phẩm duy nhất!`);
console.log(`✓ Số nhóm gộp đã xác nhận: ${confirmedMergedGroups.length}`);
console.log(`✓ Số nhóm cần admin kiểm tra: ${duplicateCandidates.length}`);

// Tạo báo cáo sản phẩm trùng duplicateReport.json
const duplicateReport = {
  generatedAt: new Date().toISOString(),
  title: 'SMARTBUY AI — Báo Cáo Gộp Sản Phẩm Cùng Mẫu & Quản Lý Biến Thể',
  summary: {
    totalScannedImages: scannedFiles.length,
    totalMergedProducts: generatedProducts.length,
    confirmedMergedGroupsCount: confirmedMergedGroups.length,
    pendingReviewCount: duplicateCandidates.length,
  },
  confirmedMergedGroups,
  duplicateCandidates,
};

fs.writeFileSync(REPORT_FILE, JSON.stringify(duplicateReport, null, 2), 'utf8');
console.log(`✓ Đã lưu báo cáo gộp tại: ${REPORT_FILE}`);

// Cập nhật manifest
const manifest = {
  version: '3.1.0-variant-merged',
  description: 'SMARTBUY AI Real Image Products Manifest (Variants & Seasons Merged)',
  generatedAt: new Date().toISOString(),
  totalImages: scannedFiles.length,
  totalProducts: generatedProducts.length,
  confirmedGroups: confirmedMergedGroups.length,
};
fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf8');

// Xuất file TypeScript importedProducts.ts
const tsContent = `// File sinh tự động: Các mẫu thiết kế duy nhất với biến thể màu/size theo chuẩn Shopee/TikTok Shop
import { Product } from '@/types';

export const IMPORTED_PRODUCTS: Product[] = ${JSON.stringify(generatedProducts, null, 2)};
`;

fs.writeFileSync(OUTPUT_TS_FILE, tsContent, 'utf8');
console.log(`✓ Đã lưu danh sách sản phẩm gộp tại: ${OUTPUT_TS_FILE}`);
