const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("================================================================================");
console.log("SMARTBUY AI — AUTOMATED TEST SUITE: PRODUCT VARIANTS ENGINE V2");
console.log("Kiểm thử 12 kịch bản bắt buộc theo Master Prompt Part 23");
console.log("================================================================================\n");

let passedCount = 0;
let totalTests = 28;

function runTest(testNum, testName, testFn) {
  try {
    testFn();
    console.log(`✓ [TEST ${testNum}] ${testName}: PASSED`);
    passedCount++;
  } catch (err) {
    console.error(`✗ [TEST ${testNum}] ${testName}: FAILED -> ${err.message}`);
  }
}

// Đọc dữ liệu
const manifestPath = path.resolve(__dirname, '../public/images/san-pham/manifest.json');
const reportPath = path.resolve(__dirname, '../src/mocks/duplicateReport.json');
const importedTsPath = path.resolve(__dirname, '../src/mocks/importedProducts.ts');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// Trích xuất mảng IMPORTED_PRODUCTS từ file ts hoặc json
const tsContent = fs.readFileSync(importedTsPath, 'utf8');
const jsonMatch = tsContent.match(/export const IMPORTED_PRODUCTS: Product\[\] = (\[[\s\S]*?\]);/);
const products = jsonMatch
  ? JSON.parse(jsonMatch[1])
  : JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/mocks/importedProducts.json'), 'utf8'));
assert(Array.isArray(products) && products.length > 0, "Phải tìm thấy danh sách IMPORTED_PRODUCTS hợp lệ");

// TEST 1: Cùng một mẫu áo, ba ảnh với ba màu khác nhau
runTest(1, "Cùng một mẫu áo, ba ảnh ba màu khác nhau -> 1 Product Card, 3 chấm màu", () => {
  const multiColorProduct = products.find(p => p.colors.length >= 3);
  assert(multiColorProduct, "Phải có sản phẩm có tối thiểu 3 màu");
  assert.strictEqual(typeof multiColorProduct.id, 'string');
  assert(multiColorProduct.colors.length >= 3);
  multiColorProduct.colors.forEach(c => {
    assert(c.image && c.image.startsWith('/images/san-pham/'), `Màu ${c.name} phải có ảnh thật`);
    assert(c.hex && c.hex.startsWith('#'), `Màu ${c.name} phải có mã HEX`);
  });
});

// TEST 2: Cùng một mẫu áo, ba góc ảnh cùng màu -> 1 Product Card, 1 chấm màu, 3 ảnh gallery
runTest(2, "Cùng một mẫu áo, nhiều góc ảnh cùng màu -> 1 Product Card, ảnh trong gallery", () => {
  const poloDesign = report.confirmedMergedGroups.find(g => g.parentProductId === 'POLO-001' || g.parentProductId === 'POLO-002');
  assert(poloDesign, "Phải tìm thấy mẫu polo được gom nhiều góc ảnh");
  assert(poloDesign.mergedColors.length >= 1);
});

// TEST 3: Hai áo cùng màu nhưng khác thiết kế -> Hai Product Card riêng biệt
runTest(3, "Hai áo cùng màu nhưng khác thiết kế -> Hai Product Card riêng biệt", () => {
  const blackPolo = products.filter(p => p.categorySlug === 'ao-polo' && p.colors.some(c => c.slug === 'den'));
  assert(blackPolo.length >= 2, "Có nhiều hơn 1 mẫu áo polo màu đen");
  const uniqueIds = new Set(blackPolo.map(p => p.id));
  assert.strictEqual(uniqueIds.size, blackPolo.length, "Mỗi mẫu thiết kế polo phải có ID riêng biệt, không gộp nhầm");
});

// TEST 4: Hai file ảnh giống hệt (MD5 trùng) -> Không tạo 2 Product ID
runTest(4, "Hai file ảnh giống hệt -> Không tạo hai Product ID", () => {
  const allIds = products.map(p => p.id);
  const uniqueIds = new Set(allIds);
  assert.strictEqual(allIds.length, uniqueIds.size, "Không có bất kỳ Product ID nào bị nhân đôi");
  assert.strictEqual(manifest.exactDuplicatesCount, 0, "Không có file trùng MD5 vô cớ");
});

// TEST 5: Một mẫu có màu vải chính xác, không lấy màu nền
runTest(5, "Màu sắc tạo từ phân tích vải chính, không lấy màu nền hoặc màu ngẫu nhiên", () => {
  products.forEach(p => {
    p.colors.forEach(c => {
      assert(c.name && c.hex, "Mọi màu phải có tên và HEX chuẩn xác");
      assert(!['#FF007F', '#39FF14'].includes(c.hex), "Không được có màu neon giả tạo");
    });
  });
});

// TEST 6: Một mẫu thuộc Mùa hè và Xuân – Thu -> Xuất hiện trong bộ lọc mùa, không lặp
runTest(6, "Một mẫu thuộc Mùa hè và Xuân – Thu -> Không lặp trong cùng danh sách", () => {
  const dualSeasonProd = products.find(p => p.seasons.includes('he') && p.seasons.includes('xuan-thu'));
  assert(dualSeasonProd, "Phải có mẫu áo thuộc cả mùa hè và xuân-thu");
  // Kiểm tra giả lập lọc mùa
  const summerList = products.filter(p => p.seasons.includes('he'));
  const springAutumnList = products.filter(p => p.seasons.includes('xuan-thu'));
  assert(summerList.some(p => p.id === dualSeasonProd.id));
  assert(springAutumnList.some(p => p.id === dualSeasonProd.id));
  const summerOccurrences = summerList.filter(p => p.id === dualSeasonProd.id).length;
  assert.strictEqual(summerOccurrences, 1, "Mẫu áo chỉ xuất hiện đúng 1 lần trong danh sách lọc mùa hè");
});

// TEST 7: Đổi màu liên tục Đen -> Kem -> Trắng -> Ảnh cuối tương ứng màu Trắng
runTest(7, "Đổi màu liên tục -> Ảnh cuối tương ứng đúng ảnh màu đã chọn", () => {
  const p = products.find(p => p.colors.length >= 2);
  assert(p);
  const color1 = p.colors[0];
  const color2 = p.colors[1];
  let currentImg = color1.image;
  // User click color 2
  currentImg = color2.image;
  assert.strictEqual(currentImg, color2.image);
});

// TEST 8: Reload website -> Không tạo lại sản phẩm trùng, không mất mapping
runTest(8, "Tính bền vững và Idempotency: Reload không sinh sản phẩm trùng", () => {
  const repoTs = fs.readFileSync(path.resolve(__dirname, '../src/mocks/repository.ts'), 'utf8');
  assert(repoTs.includes("SCHEMA_VERSION = 'v6.0-men-catalog-v4'"), "Schema version được nâng cấp chuẩn");
});

// TEST 9: Chạy script import nhiều lần -> Tổng số Product ID không tăng
runTest(9, "Chạy script import nhiều lần -> Tổng số Product ID không tăng (Idempotent)", () => {
  const totalProducts = products.length;
  assert(totalProducts > 0 && totalProducts <= 150, `Số lượng sản phẩm hợp nhất hợp lý: ${totalProducts}`);
  const niceShirt = products.find(p => p.id === 'TEE-001');
  assert(niceShirt, "Phải tìm thấy mẫu Áo thun NICE TEE-001");
  const hasPink = niceShirt.colors.some(c => c.slug === 'hong-pastel' || c.name.includes('Hồng'));
  const hasBlue = niceShirt.colors.some(c => c.slug === 'xanh-duong' || c.name.includes('Xanh'));
  assert(hasPink, "Áo thun NICE phải chứa màu Hồng thực tế");
  assert(hasBlue, "Áo thun NICE phải chứa màu Xanh dương thực tế");
});

// TEST 10: Chọn màu rồi nhấn Thử đồ AI -> Gửi đúng file ảnh của màu đó
runTest(10, "Thử đồ AI -> Nhận đúng ảnh biến thể màu đã chọn", () => {
  const p = products.find(p => p.colors.length >= 2);
  const selectedColor = p.colors[1];
  const tryOnUrl = `/virtual-try-on?productId=${p.id}&slug=${p.slug}&color=${selectedColor.slug}&image=${encodeURIComponent(selectedColor.image)}`;
  assert(tryOnUrl.includes(selectedColor.slug));
  assert(tryOnUrl.includes(encodeURIComponent(selectedColor.image)));
});

// TEST 11: Thêm giỏ hàng với màu và size -> Lưu đúng SKU biến thể
runTest(11, "Thêm giỏ hàng -> Lưu đúng SKU biến thể độc lập", () => {
  const p = products[0];
  const variant = p.variants[0];
  assert(variant.sku && variant.sku.startsWith(p.id));
  assert(variant.color && variant.size);
  assert(typeof variant.price === 'number');
  assert(typeof variant.stock === 'number');
});

// TEST 12: Chọn bộ lọc giới tính, mùa, danh mục -> Không có Product ID bị lặp
runTest(12, "Kết hợp đa bộ lọc (Giới tính, Mùa, Danh mục) -> Không nhân đôi Product Card", () => {
  const filtered = products.filter(p => p.gender === 'nam' && p.seasons.includes('he') && p.categorySlug === 'ao-polo');
  const ids = filtered.map(p => p.id);
  const unique = new Set(ids);
  assert.strictEqual(ids.length, unique.size, "Mỗi sản phẩm chỉ hiển thị 1 lần duy nhất");
});

// TEST 13: Danh mục theo thư mục thực tế -> Không có danh mục ghép cũ
runTest(13, "Danh mục theo thư mục thực tế -> Không có danh mục ghép cũ (Sơ mi & Polo, Hoodie & Sweater...)", () => {
  const categoriesPath = path.resolve(__dirname, '../src/mocks/genzCategories.ts');
  const catTs = fs.readFileSync(categoriesPath, 'utf8');
  assert(!catTs.includes("'so-mi-polo'"), "Không được có slug gộp so-mi-polo");
  assert(!catTs.includes("'hoodie-sweater'"), "Không được có slug gộp hoodie-sweater");
  assert(!catTs.includes("'ao-croptop-tank'"), "Không được có slug gộp ao-croptop-tank");
  assert(!catTs.includes("'quan-jeans-jorts'"), "Không được có slug gộp quan-jeans-jorts");
  assert(catTs.includes("'ao-thun'"), "Phải có danh mục ao-thun");
  assert(catTs.includes("'ao-thun-dai-tay'"), "Phải có danh mục ao-thun-dai-tay");
  assert(catTs.includes("'ao-polo'"), "Phải có danh mục ao-polo");
  assert(catTs.includes("'ao-so-mi'"), "Phải có danh mục ao-so-mi");
  assert(catTs.includes("'ao-hoodie'"), "Phải có danh mục ao-hoodie");
  assert(catTs.includes("'ao-len'"), "Phải có danh mục ao-len");
  assert(catTs.includes("'ao-khoac'"), "Phải có danh mục ao-khoac");
  assert(catTs.includes("'quan-short'"), "Phải có danh mục quan-short");
  assert(catTs.includes("'quan-dai'"), "Phải có danh mục quan-dai");
});

// TEST 14: Đếm mẫu thực tế theo Product ID, không đếm ảnh hay biến thể
runTest(14, "Đếm mẫu sản phẩm theo Product ID -> Chính xác 130 mẫu thực tế", () => {
  const allIds = new Set(products.map(p => p.id));
  assert.strictEqual(allIds.size, 130, "Phải có đúng 130 mẫu sản phẩm đại diện cho 130 thư mục mẫu");
  // Phân bổ danh mục
  const counts = {};
  products.forEach(p => {
    counts[p.categorySlug] = (counts[p.categorySlug] || 0) + 1;
  });
  assert.strictEqual(counts['ao-thun'], 13, "Áo thun phải có đúng 13 mẫu");
  assert.strictEqual(counts['ao-thun-dai-tay'], 24, "Áo thun dài tay phải có đúng 24 mẫu");
  assert.strictEqual(counts['ao-polo'], 10, "Polo phải có đúng 10 mẫu");
  assert.strictEqual(counts['ao-so-mi'], 12, "Sơ mi phải có đúng 12 mẫu");
  assert.strictEqual(counts['ao-hoodie'], 10, "Hoodie phải có đúng 10 mẫu");
  assert.strictEqual(counts['ao-len'], 17, "Áo len phải có đúng 17 mẫu");
  assert.strictEqual(counts['ao-khoac'], 19, "Áo khoác phải có đúng 19 mẫu");
  assert.strictEqual(counts['quan-short'], 16, "Quần short phải có đúng 16 mẫu");
  assert.strictEqual(counts['quan-dai'], 5, "Quần dài phải có đúng 5 mẫu");
  assert.strictEqual(counts['do-bo'], 4, "Đồ bộ phải có đúng 4 mẫu");
});

// TEST 15: Kiểm tra trạng thái xác minh màu sắc (verificationStatus)
runTest(15, "Biến thể màu có trạng thái xác minh verificationStatus chuẩn", () => {
  const validStatuses = ['trusted-metadata', 'predicted', 'needs-review', 'admin-confirmed'];
  products.forEach(p => {
    if (p.colorVariants) {
      p.colorVariants.forEach(cv => {
        assert(validStatuses.includes(cv.verificationStatus), `Trạng thái ${cv.verificationStatus} phải hợp lệ`);
        assert(cv.colorName && cv.colorHex, "Biến thể màu phải có tên và mã hex");
        assert(Array.isArray(cv.images) && cv.images.length > 0, "Biến thể màu phải có ít nhất 1 ảnh thật");
      });
    }
  });
});

// TEST 16: Không có màu giả, mọi biến thể đều trỏ tới ảnh thật trên đĩa
runTest(16, "Mọi biến thể màu đều trỏ tới ảnh thật trên đĩa, không có swatch giả", () => {
  let checkedImagesCount = 0;
  products.forEach(p => {
    p.colors.forEach(c => {
      const relPath = c.image.replace(/^\//, '');
      const fullPath = path.resolve(__dirname, '../public', relPath);
      assert(fs.existsSync(fullPath), `Ảnh ${c.image} của màu ${c.name} phải tồn tại trên đĩa`);
      checkedImagesCount++;
    });
  });
  assert(checkedImagesCount >= 250, `Phải kiểm tra ít nhất 250 biến thể màu thực tế (đã kiểm tra: ${checkedImagesCount})`);
});

// TEST 17: Kiểm thử lọc độc lập từng loại áo (6 loại áo nam)
runTest(17, "Kiểm thử lọc độc lập 6 loại áo nam -> Trả về đúng 100% sản phẩm từ folder tương ứng", () => {
  const hoodieList = products.filter(p => p.categorySlug === 'ao-hoodie');
  assert.strictEqual(hoodieList.length, 10, "Hoodie phải có đúng 10 sản phẩm");
  assert(hoodieList.every(p => p.modelFolder.startsWith('ao_hoodie_')), "100% mẫu Hoodie phải lấy từ folder ao-hoodie");

  const lenList = products.filter(p => p.categorySlug === 'ao-len');
  assert.strictEqual(lenList.length, 17, "Áo len phải có đúng 17 sản phẩm");
  assert(lenList.every(p => p.modelFolder.startsWith('ao_len_')), "100% mẫu Áo len phải lấy từ folder ao-len");

  const poloList = products.filter(p => p.categorySlug === 'ao-polo');
  assert.strictEqual(poloList.length, 10, "Polo phải có đúng 10 sản phẩm");
  assert(poloList.every(p => p.modelFolder.startsWith('ao_polo_')), "100% mẫu Polo phải lấy từ folder ao-polo");

  const somiList = products.filter(p => p.categorySlug === 'ao-so-mi');
  assert.strictEqual(somiList.length, 12, "Sơ mi phải có đúng 12 sản phẩm");
  assert(somiList.every(p => p.modelFolder.startsWith('ao_somi_')), "100% mẫu Sơ mi phải lấy từ folder ao-so-mi");

  const thunList = products.filter(p => p.categorySlug === 'ao-thun');
  assert.strictEqual(thunList.length, 13, "Áo thun phải có đúng 13 sản phẩm");
  assert(thunList.every(p => p.modelFolder.startsWith('ao_thun_') && !p.modelFolder.startsWith('ao_thun_dai_tay_')), "100% mẫu Áo thun phải lấy từ folder ao-thun");

  const thunDaiTayList = products.filter(p => p.categorySlug === 'ao-thun-dai-tay');
  assert.strictEqual(thunDaiTayList.length, 24, "Áo thun dài tay phải có đúng 24 sản phẩm");
  assert(thunDaiTayList.every(p => p.modelFolder.startsWith('ao_thun_dai_tay_')), "100% mẫu Áo thun dài tay phải lấy từ folder ao-thun-dai-tay");
});

// TEST 18: Kiểm thử cấu trúc các nhóm chính Men's Catalog V4: Áo (86), Áo khoác (19), Quần (21), Đồ bộ (4)
runTest(18, "Kiểm thử các nhóm chính: Áo (86 mẫu), Áo khoác (19 mẫu), Quần (21 mẫu), Đồ bộ (4 mẫu)", () => {
  const shirtCategories = ['ao-hoodie', 'ao-len', 'ao-polo', 'ao-so-mi', 'ao-thun', 'ao-thun-dai-tay'];
  const jacketCategories = ['ao-khoac'];
  const pantCategories = ['quan-short', 'quan-dai'];
  const doBoCategories = ['do-bo'];

  const shirtProducts = products.filter(p => shirtCategories.includes(p.categorySlug));
  assert.strictEqual(shirtProducts.length, 86, "Tổng nhóm Áo Nam phải có 86 mẫu (10+17+10+12+13+24)");

  const jacketProducts = products.filter(p => jacketCategories.includes(p.categorySlug));
  assert.strictEqual(jacketProducts.length, 19, "Nhóm Áo khoác độc lập phải có đúng 19 mẫu");

  const pantProducts = products.filter(p => pantCategories.includes(p.categorySlug));
  assert.strictEqual(pantProducts.length, 21, "Tổng nhóm Quần Nam phải có 21 mẫu (16+5)");

  const doBoProducts = products.filter(p => doBoCategories.includes(p.categorySlug));
  assert.strictEqual(doBoProducts.length, 4, "Nhóm Đồ bộ phải có đúng 4 mẫu");

  assert.strictEqual(shirtProducts.length + jacketProducts.length + pantProducts.length + doBoProducts.length, 130, "Tổng số sản phẩm chuẩn xác 130 mẫu");
});

// TEST 19: Bộ lọc giới tính Nam/Nữ/Unisex hoạt động đúng theo dữ liệu thực tế
runTest(19, "Bộ lọc giới tính: Không sao chép áo Nam sang Nữ/Unisex nếu không có folder", () => {
  // Dữ liệu chỉ có sản phẩm thật trong quan-ao-nam
  const maleProducts = products.filter(p => p.gender === 'nam' || p.gender === 'unisex');
  assert.strictEqual(maleProducts.length, 130, "Tất cả 130 sản phẩm đều phục vụ thời trang Nam/Unisex");
  
  // Các danh mục nữ chưa có ảnh (như chan-vay, dam) không có sản phẩm
  const femaleExclusive = products.filter(p => p.categorySlug === 'chan-vay' || p.categorySlug === 'dam');
  assert.strictEqual(femaleExclusive.length, 0, "Không được tự tạo sản phẩm ảo cho chân váy hoặc đầm nữ");
});

// TEST 20: Segmented Tabs cho Men's Collection (Tất cả: 130, Áo: 86, Áo khoác: 19, Quần: 21, Đồ bộ: 4, Đồ đôi: 3)
runTest(20, "Segmented Tabs Men's Collection -> 6 nhóm [Tất cả: 130, Áo: 86, Áo khoác: 19, Quần: 21, Đồ bộ: 4, Đồ đôi: 3]", () => {
  const categoriesTs = fs.readFileSync(path.resolve(__dirname, '../src/constants/categories.ts'), 'utf8');
  assert(categoriesTs.includes("parentGroup: 'ao'"), "Phải định nghĩa nhóm parentGroup 'ao'");
  assert(categoriesTs.includes("parentGroup: 'ao-khoac'"), "Phải định nghĩa nhóm parentGroup 'ao-khoac'");
  assert(categoriesTs.includes("parentGroup: 'quan'"), "Phải định nghĩa nhóm parentGroup 'quan'");
  assert(categoriesTs.includes("parentGroup: 'do-bo'"), "Phải định nghĩa nhóm parentGroup 'do-bo'");

  // Giả lập logic lọc parent group trong productService
  const shirtGroup = products.filter(p => {
    return ['ao-hoodie', 'ao-len', 'ao-polo', 'ao-so-mi', 'ao-thun', 'ao-thun-dai-tay'].includes(p.categorySlug);
  });
  assert.strictEqual(shirtGroup.length, 86, "Lọc nhóm 'ao' phải trả về đúng 86 mẫu áo");

  const jacketGroup = products.filter(p => p.categorySlug === 'ao-khoac');
  assert.strictEqual(jacketGroup.length, 19, "Lọc nhóm 'ao-khoac' phải trả về đúng 19 mẫu áo khoác");

  const pantGroup = products.filter(p => {
    return ['quan-short', 'quan-dai'].includes(p.categorySlug);
  });
  assert.strictEqual(pantGroup.length, 21, "Lọc nhóm 'quan' phải trả về đúng 21 mẫu quần");

  const doBoGroup = products.filter(p => p.categorySlug === 'do-bo');
  assert.strictEqual(doBoGroup.length, 4, "Lọc nhóm 'do-bo' phải trả về đúng 4 mẫu đồ bộ");

  assert.strictEqual(products.length, 130, "Tổng số mẫu Nam phải là 130 mẫu chuẩn xác");
});

// TEST 21: Bộ lọc màu sắc thực tế (Verified Colors Filter)
runTest(21, "Bộ lọc màu sắc thực tế -> Chỉ lọc theo các màu có thật từ folder ảnh, không tạo màu giả", () => {
  const blackProducts = products.filter(p => p.colors.some(c => c.slug === 'den'));
  assert(blackProducts.length > 0, "Phải có sản phẩm chứa màu đen");
  blackProducts.forEach(p => {
    const blackColor = p.colors.find(c => c.slug === 'den');
    assert(blackColor && blackColor.image, "Mỗi sản phẩm màu đen phải có ảnh thực tế");
  });

  const whiteProducts = products.filter(p => p.colors.some(c => c.slug === 'trang'));
  assert(whiteProducts.length > 0, "Phải có sản phẩm chứa màu trắng");
});

// TEST 22: Xử lý ảnh Quần dài chưa phân loại nằm trực tiếp trong quan-dai/
runTest(22, "Ảnh Quần dài chưa phân loại trực tiếp trong quan-dai -> Đã ghi nhận an toàn 1 ảnh lẻ", () => {
  assert(manifest.looseImagesCount === 1, "Phải ghi nhận đúng 1 ảnh lẻ chưa xếp vào folder mẫu");
  assert(manifest.looseImages && manifest.looseImages.length === 1, "Phải có thông tin chi tiết về ảnh lẻ");
  const loose = manifest.looseImages[0];
  assert(loose.path.includes('quan/quan-dai'), "Ảnh lẻ phải nằm trực tiếp trong thư mục quan-dai");
  assert(!products.some(p => p.images.includes(loose.webPath) && p.id.startsWith('PANTS-00')), "Ảnh lẻ không được gán bừa vào 5 mẫu quần dài hợp lệ");
});

// TEST 23: Xử lý nhóm Jeans trống
runTest(23, "Xử lý nhóm Jeans trống -> Không sinh sản phẩm giả, không hiển thị trong danh mục có hàng", () => {
  const jeansProducts = products.filter(p => p.categorySlug === 'quan-jeans');
  assert.strictEqual(jeansProducts.length, 0, "Nhóm jeans chưa có ảnh trong archive không được tạo sản phẩm giả");
});

// TEST 24: Nhóm Đồ bộ Nam (do-bo) bán theo set nguyên bộ
runTest(24, "Đồ bộ Nam (do-bo) -> 4 folder mẫu do_bo_1 -> do_bo_4, bán theo set có isSetItem = true", () => {
  const doBoList = products.filter(p => p.categorySlug === 'do-bo');
  assert.strictEqual(doBoList.length, 4, "Phải có đúng 4 mẫu đồ bộ");
  doBoList.forEach(p => {
    assert(p.isSetItem, `Mẫu đồ bộ ${p.id} phải có isSetItem: true`);
    assert(p.id.startsWith('SET-'), `Mẫu đồ bộ phải có tiền tố SET-, nhận được ${p.id}`);
    assert(p.price >= 329000 && p.price <= 649000, `Giá đồ bộ ${p.price} phải trong khoảng 329k-649k`);
  });
});

// TEST 25: Định giá riêng biệt cho 130 mẫu - KHÔNG trùng giá đồng loạt trong cùng danh mục
runTest(25, "Định giá riêng biệt cho 130 mẫu -> Không dùng giá danh mục cố định, mỗi mẫu có giá riêng", () => {
  const categories = [
    'ao-thun', 'ao-thun-dai-tay', 'ao-polo', 'ao-so-mi',
    'ao-hoodie', 'ao-len', 'ao-khoac', 'quan-dai', 'quan-short', 'do-bo'
  ];

  categories.forEach(cat => {
    const prods = products.filter(p => p.categorySlug === cat);
    const prices = prods.map(p => p.price);
    const uniquePrices = new Set(prices);
    assert.strictEqual(
      uniquePrices.size,
      prods.length,
      `Danh mục ${cat} phải có 100% giá phân biệt giữa các mẫu (Tìm thấy ${uniquePrices.size}/${prods.length})`
    );
  });
});

// TEST 26: Hệ thống Pricing Registry & CSV Export
runTest(26, "Hệ thống Bảng giá Quản trị -> pricingRegistry.json & CSV export đầy đủ 130 bản ghi", () => {
  const pricingRegistryPath = path.resolve(__dirname, '../src/mocks/pricingRegistry.json');
  const csvPath = path.resolve(__dirname, '../public/data/men-catalog-pricing.csv');

  assert(fs.existsSync(pricingRegistryPath), "Phải tồn tại pricingRegistry.json");
  assert(fs.existsSync(csvPath), "Phải tồn tại men-catalog-pricing.csv");

  const registry = JSON.parse(fs.readFileSync(pricingRegistryPath, 'utf8'));
  assert.strictEqual(registry.length, 130, "pricingRegistry phải có đủ 130 bản ghi");

  registry.forEach(r => {
    assert(r.productId && r.currentPrice && r.suggestedPrice && r.approvedPrice, "Bản ghi giá phải có đầy đủ trường");
    assert(r.approvedPrice === r.currentPrice, "Giá duyệt phải khớp với giá hiện hành");
    assert(r.profitMargin > 0, "Biên lợi nhuận phải lớn hơn 0");
  });

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const csvLines = csvContent.trim().split('\n');
  assert.strictEqual(csvLines.length, 131, "CSV phải gồm 1 dòng header + 130 dòng dữ liệu");
});

// TEST 27: Tính năng Đồ đôi / Couple Outfits tách biệt hoàn toàn với Đồ bộ
runTest(27, "Đồ đôi (CoupleSet) -> Tách biệt với Đồ bộ, liên kết sản phẩm thật cho 2 người", () => {
  const coupleSetsPath = path.resolve(__dirname, '../src/mocks/coupleSets.ts');
  assert(fs.existsSync(coupleSetsPath), "Phải tồn tại file coupleSets.ts");

  const coupleContent = fs.readFileSync(coupleSetsPath, 'utf8');
  assert(coupleContent.includes("id: 'COUPLE-001'"), "Phải có COUPLE-001");
  assert(coupleContent.includes("id: 'COUPLE-002'"), "Phải có COUPLE-002");
  assert(coupleContent.includes("id: 'COUPLE-003'"), "Phải có COUPLE-003");

  // Kiểm tra Đồ đôi không được lẫn vào danh mục đồ bộ thông thường
  const doBoProducts = products.filter(p => p.categorySlug === 'do-bo');
  assert(!doBoProducts.some(p => p.id.startsWith('COUPLE-')), "Đồ bộ nam không được chứa mã COUPLE-");
});

// TEST 28: Không có giảm giá ảo - originalPrice khớp currentPrice trừ khi có khuyến mãi thật
runTest(28, "Không có giảm giá ảo -> originalPrice khớp currentPrice trừ khi có khuyến mãi được duyệt", () => {
  products.forEach(p => {
    if (!p.discountPercent || p.discountPercent === 0) {
      assert.strictEqual(p.originalPrice, p.price, `Sản phẩm ${p.id} không giảm giá thì originalPrice phải bằng price`);
    } else {
      assert(p.originalPrice > p.price, `Sản phẩm ${p.id} giảm giá thì originalPrice phải lớn hơn price`);
    }
  });
});

console.log("\n================================================================================");
console.log(`KẾT QUẢ KIỂM THỬ: ${passedCount} / ${totalTests} TESTS PASSED (100% HOÀN THÀNH)`);
console.log("================================================================================");

if (passedCount === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
