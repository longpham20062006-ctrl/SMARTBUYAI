const fs = require('fs');
const path = require('path');

const ROOT_IMAGE_DIR = path.resolve(__dirname, '..', 'public', 'images');
const PRODUCTS_DIR = path.join(ROOT_IMAGE_DIR, 'products');

// Danh mục đơn giản hóa chuẩn xác theo yêu cầu
const SIMPLIFIED_CATEGORIES = [
  // 1. QUẦN ÁO NAM
  { group: 'quan-ao-nam', slug: 'ao-thun', label: 'Quần áo nam → Áo thun' },
  { group: 'quan-ao-nam', slug: 'ao-thun-dai-tay', label: 'Quần áo nam → Áo thun dài tay' },
  { group: 'quan-ao-nam', slug: 'ao-so-mi', label: 'Quần áo nam → Áo sơ mi' },
  { group: 'quan-ao-nam', slug: 'ao-polo', label: 'Quần áo nam → Áo polo' },
  { group: 'quan-ao-nam', slug: 'ao-ba-lo', label: 'Quần áo nam → Áo ba lỗ' },
  { group: 'quan-ao-nam', slug: 'ao-hoodie', label: 'Quần áo nam → Áo hoodie' },
  { group: 'quan-ao-nam', slug: 'ao-sweater', label: 'Quần áo nam → Áo sweater' },
  { group: 'quan-ao-nam', slug: 'ao-len', label: 'Quần áo nam → Áo len' },
  { group: 'quan-ao-nam', slug: 'ao-cardigan', label: 'Quần áo nam → Áo cardigan' },
  { group: 'quan-ao-nam', slug: 'ao-khoac', label: 'Quần áo nam → Áo khoác' },
  { group: 'quan-ao-nam', slug: 'quan-jeans', label: 'Quần áo nam → Quần jeans' },
  { group: 'quan-ao-nam', slug: 'quan-dai', label: 'Quần áo nam → Quần dài' },
  { group: 'quan-ao-nam', slug: 'quan-ngan', label: 'Quần áo nam → Quần ngắn' },
  { group: 'quan-ao-nam', slug: 'quan-cargo', label: 'Quần áo nam → Quần cargo' },
  { group: 'quan-ao-nam', slug: 'quan-jogger', label: 'Quần áo nam → Quần jogger' },
  { group: 'quan-ao-nam', slug: 'do-bo', label: 'Quần áo nam → Đồ bộ' },

  // 2. QUẦN ÁO NỮ
  { group: 'quan-ao-nu', slug: 'ao-thun', label: 'Quần áo nữ → Áo thun' },
  { group: 'quan-ao-nu', slug: 'ao-thun-dai-tay', label: 'Quần áo nữ → Áo thun dài tay' },
  { group: 'quan-ao-nu', slug: 'ao-croptop', label: 'Quần áo nữ → Áo croptop' },
  { group: 'quan-ao-nu', slug: 'ao-hai-day', label: 'Quần áo nữ → Áo hai dây' },
  { group: 'quan-ao-nu', slug: 'ao-quay', label: 'Quần áo nữ → Áo quây' },
  { group: 'quan-ao-nu', slug: 'ao-kieu', label: 'Quần áo nữ → Áo kiểu' },
  { group: 'quan-ao-nu', slug: 'ao-so-mi', label: 'Quần áo nữ → Áo sơ mi' },
  { group: 'quan-ao-nu', slug: 'ao-polo', label: 'Quần áo nữ → Áo polo' },
  { group: 'quan-ao-nu', slug: 'ao-hoodie', label: 'Quần áo nữ → Áo hoodie' },
  { group: 'quan-ao-nu', slug: 'ao-sweater', label: 'Quần áo nữ → Áo sweater' },
  { group: 'quan-ao-nu', slug: 'ao-len', label: 'Quần áo nữ → Áo len' },
  { group: 'quan-ao-nu', slug: 'ao-cardigan', label: 'Quần áo nữ → Áo cardigan' },
  { group: 'quan-ao-nu', slug: 'ao-khoac', label: 'Quần áo nữ → Áo khoác' },
  { group: 'quan-ao-nu', slug: 'quan-jeans', label: 'Quần áo nữ → Quần jeans' },
  { group: 'quan-ao-nu', slug: 'quan-dai', label: 'Quần áo nữ → Quần dài' },
  { group: 'quan-ao-nu', slug: 'quan-ngan', label: 'Quần áo nữ → Quần ngắn' },
  { group: 'quan-ao-nu', slug: 'quan-cargo', label: 'Quần áo nữ → Quần cargo' },
  { group: 'quan-ao-nu', slug: 'quan-jogger', label: 'Quần áo nữ → Quần jogger' },
  { group: 'quan-ao-nu', slug: 'chan-vay', label: 'Quần áo nữ → Chân váy' },
  { group: 'quan-ao-nu', slug: 'vay-lien', label: 'Quần áo nữ → Váy liền' },
  { group: 'quan-ao-nu', slug: 'do-bo', label: 'Quần áo nữ → Đồ bộ' },

  // 3. QUẦN ÁO UNISEX
  { group: 'quan-ao-unisex', slug: 'ao-thun', label: 'Quần áo Unisex → Áo thun' },
  { group: 'quan-ao-unisex', slug: 'ao-dai-tay', label: 'Quần áo Unisex → Áo dài tay' },
  { group: 'quan-ao-unisex', slug: 'ao-so-mi', label: 'Quần áo Unisex → Áo sơ mi' },
  { group: 'quan-ao-unisex', slug: 'ao-hoodie', label: 'Quần áo Unisex → Áo hoodie' },
  { group: 'quan-ao-unisex', slug: 'ao-sweater', label: 'Quần áo Unisex → Áo sweater' },
  { group: 'quan-ao-unisex', slug: 'ao-khoac', label: 'Quần áo Unisex → Áo khoác' },
  { group: 'quan-ao-unisex', slug: 'quan-jeans', label: 'Quần áo Unisex → Quần jeans' },
  { group: 'quan-ao-unisex', slug: 'quan-dai', label: 'Quần áo Unisex → Quần dài' },
  { group: 'quan-ao-unisex', slug: 'quan-ngan', label: 'Quần áo Unisex → Quần ngắn' },
  { group: 'quan-ao-unisex', slug: 'quan-cargo', label: 'Quần áo Unisex → Quần cargo' },
  { group: 'quan-ao-unisex', slug: 'quan-jogger', label: 'Quần áo Unisex → Quần jogger' },
  { group: 'quan-ao-unisex', slug: 'do-bo', label: 'Quần áo Unisex → Đồ bộ' },

  // 4. PHỤ KIỆN
  { group: 'phu-kien', slug: 'vong-co', label: 'Phụ kiện → Vòng cổ' },
  { group: 'phu-kien', slug: 'day-chuyen', label: 'Phụ kiện → Dây chuyền' },
  { group: 'phu-kien', slug: 'vong-tay', label: 'Phụ kiện → Vòng tay' },
  { group: 'phu-kien', slug: 'lac-tay', label: 'Phụ kiện → Lắc tay' },
  { group: 'phu-kien', slug: 'nhan', label: 'Phụ kiện → Nhẫn' },
  { group: 'phu-kien', slug: 'khuyen-tai', label: 'Phụ kiện → Khuyên tai' },
  { group: 'phu-kien', slug: 'lac-chan', label: 'Phụ kiện → Lắc chân' },
  { group: 'phu-kien', slug: 'tui-xach', label: 'Phụ kiện → Túi xách' },
  { group: 'phu-kien', slug: 'balo', label: 'Phụ kiện → Balo' },
  { group: 'phu-kien', slug: 'mu', label: 'Phụ kiện → Mũ' },
  { group: 'phu-kien', slug: 'kinh', label: 'Phụ kiện → Kính' },
  { group: 'phu-kien', slug: 'that-lung', label: 'Phụ kiện → Thắt lưng' },
  { group: 'phu-kien', slug: 'khan', label: 'Phụ kiện → Khăn' },
  { group: 'phu-kien', slug: 'phu-kien-toc', label: 'Phụ kiện → Phụ kiện tóc' },
  { group: 'phu-kien', slug: 'moc-khoa', label: 'Phụ kiện → Móc khóa' },
];

function ensureDirAndGitkeep(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  const gitkeepPath = path.join(dirPath, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '# Keep directory\n', 'utf8');
  }
}

// 1. Tạo thư mục `public/images/products/...`
console.log('Đang khởi tạo thư mục sản phẩm chuẩn hóa tại:', PRODUCTS_DIR);
const labelMap = {};

SIMPLIFIED_CATEGORIES.forEach((cat) => {
  const relPath = `products/${cat.group}/${cat.slug}`;
  const fullPath = path.join(PRODUCTS_DIR, cat.group, cat.slug);
  ensureDirAndGitkeep(fullPath);
  labelMap[relPath] = cat.label;
});

// Thêm các nhóm phụ trợ
const AUX_GROUPS = [
  { path: 'try-on/models', label: 'Phòng thử đồ → Người mẫu' },
  { path: 'try-on/garments', label: 'Phòng thử đồ → Trang phục mẫu' },
  { path: 'try-on/results', label: 'Phòng thử đồ → Kết quả' },
  { path: 'categories', label: 'Ảnh danh mục' },
  { path: 'banners', label: 'Ảnh banner' },
  { path: 'lookbook', label: 'Ảnh lookbook' },
  { path: 'placeholders', label: 'Ảnh mặc định' },
];

AUX_GROUPS.forEach((aux) => {
  const fullPath = path.join(ROOT_IMAGE_DIR, aux.path);
  ensureDirAndGitkeep(fullPath);
  labelMap[aux.path] = aux.label;
});

// Lưu category-labels.json
const labelsJsonPath = path.join(ROOT_IMAGE_DIR, 'category-labels.json');
fs.writeFileSync(labelsJsonPath, JSON.stringify(labelMap, null, 2), 'utf8');
console.log('✓ Đã cập nhật category-labels.json với', Object.keys(labelMap).length, 'danh mục đơn giản hóa.');

// Cập nhật image-manifest.json
const manifest = {
  version: '2.0.0',
  description: 'SMARTBUY AI Simplified Fashion Categories Manifest',
  updatedAt: new Date().toISOString(),
  totalMainCategories: SIMPLIFIED_CATEGORIES.length,
  rootPath: '/images/products/',
  categories: SIMPLIFIED_CATEGORIES.map((c) => ({
    group: c.group,
    slug: c.slug,
    path: `products/${c.group}/${c.slug}`,
    url: `/images/products/${c.group}/${c.slug}/`,
    label: c.label,
  })),
};

const manifestJsonPath = path.join(ROOT_IMAGE_DIR, 'image-manifest.json');
fs.writeFileSync(manifestJsonPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log('✓ Đã tạo image-manifest.json chuẩn phiên bản 2.0.0');
console.log('Hoàn thành đơn giản hóa toàn bộ danh mục!');
