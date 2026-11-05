const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('=== TEST SUITE: IMPORT TOÀN BỘ ẢNH QUẦN ÁO NỮ (AO, QUAN, VAY) ===\n');

let passCount = 0;
let failCount = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`[PASS] ${msg}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${msg}`);
    failCount++;
  }
}

const baseDir = path.join(process.cwd(), 'public', 'images', 'san-pham', 'quan-ao-nu');

function getFolderImages(folderName) {
  const targetDir = path.join(baseDir, folderName);
  const images = [];
  function walk(d) {
    const list = fs.readdirSync(d, { withFileTypes: true });
    for (const ent of list) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) {
        walk(full);
      } else {
        const ext = path.extname(ent.name).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp', '.svg'].includes(ext)) {
          images.push(full);
        }
      }
    }
  }
  walk(targetDir);
  return images;
}

// 1. Scan 3 folders
const aoImages = getFolderImages('ao');
const quanImages = getFolderImages('quan');
const vayImages = getFolderImages('vay');

console.log('1. THỐNG KÊ ẢNH THỰC TẾ TRÊN ĐĨA:');
assert(aoImages.length === 125, `Tổng ảnh tìm thấy trong thư mục Áo: ${aoImages.length} (kỳ vọng 125)`);
assert(quanImages.length === 14, `Tổng ảnh tìm thấy trong thư mục Quần: ${quanImages.length} (kỳ vọng 14)`);
assert(vayImages.length === 68, `Tổng ảnh tìm thấy trong thư mục Váy: ${vayImages.length} (kỳ vọng 68)`);

const totalImages = aoImages.length + quanImages.length + vayImages.length;
assert(totalImages === 207, `Tổng số ảnh trong 3 thư mục: ${totalImages} (kỳ vọng 207)`);

// 2. Duplicate check (md5)
console.log('\n2. KIỂM TRA TRÙNG LẶP & TỆP HỎNG:');
const hashes = new Set();
let duplicates = 0;
let unreadableOrZero = 0;

for (const imgPath of [...aoImages, ...quanImages, ...vayImages]) {
  try {
    const buf = fs.readFileSync(imgPath);
    if (buf.length === 0) {
      unreadableOrZero++;
    }
    const hash = crypto.createHash('md5').update(buf).digest('hex');
    if (hashes.has(hash)) {
      duplicates++;
    } else {
      hashes.add(hash);
    }
  } catch (e) {
    unreadableOrZero++;
  }
}
assert(duplicates === 0, `Tổng số ảnh trùng lặp: ${duplicates} (100% ảnh độc bản)`);
assert(unreadableOrZero === 0, `Số ảnh lỗi hoặc không thể xử lý: ${unreadableOrZero} (100% hợp lệ)`);

// 3. Check imported products
console.log('\n3. ĐỐI CHIẾU SẢN PHẨM DATABASE / CATALOG:');
const products = JSON.parse(fs.readFileSync('src/mocks/importedProducts.json', 'utf8'));

// Read 606 disk paths whitelist
const validPathsContent = fs.readFileSync('src/constants/validImagePaths.ts', 'utf8');
const matchPaths = validPathsContent.match(/export const REAL_DISK_IMAGE_PATHS: string\[\] = \[([\s\S]*?)\];/);
const diskSet = new Set(JSON.parse('[' + matchPaths[1].replace(/,\s*$/, '') + ']').map(s => s.toLowerCase()));

function isValidImage(url) {
  if (!url || typeof url !== 'string') return false;
  return diskSet.has(url.trim().toLowerCase());
}

function isEligible(p) {
  if (!p || !p.id || !p.isActive) return false;
  if (!p.price || p.price <= 0) return false;
  const validImgs = (p.images || []).filter(isValidImage);
  return validImgs.length > 0;
}

const womenProducts = products.filter(p => p.gender === 'nu');
assert(womenProducts.length === 150, `Tổng số sản phẩm nữ trong CSDL: ${womenProducts.length} (kỳ vọng 150)`);

const eligibleWomen = womenProducts.filter(isEligible);
assert(eligibleWomen.length === 120, `Số sản phẩm nữ đủ điều kiện hiển thị trên website: ${eligibleWomen.length} (kỳ vọng 120)`);

const missingInfoWomen = womenProducts.filter(p => !isEligible(p));
assert(missingInfoWomen.length === 30, `Số sản phẩm thiếu ảnh/thông tin (ẩn khách, lưu Admin): ${missingInfoWomen.length} (kỳ vọng 30)`);

// Category breakdown
const aoCategories = ['ao-thun', 'ao-cardigan', 'ao-croptop', 'ao-hai-day', 'ao-hoodie', 'ao-len', 'ao-so-mi', 'ao-kieu', 'ao-polo'];
const quanCategories = ['quan', 'quan-jeans', 'quan-dai', 'quan-short', 'quan-ong-rong', 'quan-cargo', 'quan-legging', 'quan-jogger'];
const vayCategories = ['vay', 'chan-vay-ngan', 'chan-vay-dai', 'vay-lien', 'dam-maxi', 'dam-du-tiec'];

const aoEligible = eligibleWomen.filter(p => aoCategories.includes(p.categorySlug));
const quanEligible = eligibleWomen.filter(p => quanCategories.includes(p.categorySlug));
const vayEligible = eligibleWomen.filter(p => vayCategories.includes(p.categorySlug));

console.log('\n4. PHÂN LOẠI DANH MỤC SẢN PHẨM NỮ:');
assert(aoEligible.length === 46, `Sản phẩm Áo Nữ đủ ĐK: ${aoEligible.length} (kỳ vọng 46)`);
assert(quanEligible.length === 6, `Sản phẩm Quần Nữ đủ ĐK: ${quanEligible.length} (kỳ vọng 6)`);
assert(vayEligible.length === 68, `Sản phẩm Váy Nữ đủ ĐK: ${vayEligible.length} (kỳ vọng 68)`);
assert(aoEligible.length + quanEligible.length + vayEligible.length === 120, 'Tổng số sản phẩm 3 nhóm khớp chính xác 120');

// 5. Check all 207 images are linked in products
console.log('\n5. ĐỐI CHIẾU 207 ẢNH ĐẦU VÀO VỚI SẢN PHẨM:');
const linkedImagesSet = new Set();
for (const p of womenProducts) {
  for (const img of (p.images || [])) {
    if (img) linkedImagesSet.add(img.toLowerCase());
  }
  for (const v of (p.variants || [])) {
    if (v.image) linkedImagesSet.add(v.image.toLowerCase());
  }
}

let unlinkedCount = 0;
for (const full of [...aoImages, ...quanImages, ...vayImages]) {
  const rel = '/' + path.relative(path.join(process.cwd(), 'public'), full).replace(/\\/g, '/').toLowerCase();
  if (!linkedImagesSet.has(rel)) {
    console.error('Unlinked image:', rel);
    unlinkedCount++;
  }
}
assert(unlinkedCount === 0, `Không bỏ sót ảnh: 100% của 207 ảnh đã được liên kết vào sản phẩm`);

// 6. Check CatalogPage.tsx filter updates
console.log('\n6. KIỂM TRA BỘ LỌC FRONTEND (CatalogPage.tsx):');
const catalogPageContent = fs.readFileSync('src/features/catalog/pages/CatalogPage.tsx', 'utf8');
assert(catalogPageContent.includes("id: 'ao-group', label: `Áo Nữ (${shirtCount})`, filter: { category: 'ao' }"), 'CatalogPage có pill Áo Nữ (46)');
assert(catalogPageContent.includes("id: 'quan-group', label: `Quần Nữ (${pantCount})`, filter: { category: 'quan' }"), 'CatalogPage có pill Quần Nữ (6)');
assert(catalogPageContent.includes("id: 'vay-group', label: `Váy & Đầm (${vayCount})`, filter: { category: 'vay' }"), 'CatalogPage có pill Váy & Đầm (68)');
assert(catalogPageContent.includes("onClick={() => updateParam('category', group.groupKey)}"), 'Tiêu đề nhóm lớn trong sidebar là nút bấm lọc nhanh');

// 7. Check backend query in ProductRepository.java
console.log('\n7. KIỂM TRA BACKEND PRODUCT REPOSITORY:');
const javaRepoContent = fs.readFileSync('backend/src/main/java/com/smartbuyai/repository/ProductRepository.java', 'utf8');
assert(javaRepoContent.includes("(:categorySlug = 'ao' AND p.categorySlug LIKE 'ao%')"), 'ProductRepository hỗ trợ lọc nhóm ao*');
assert(javaRepoContent.includes("(:categorySlug = 'quan' AND p.categorySlug LIKE 'quan%')"), 'ProductRepository hỗ trợ lọc nhóm quan*');
assert(javaRepoContent.includes("(:categorySlug = 'vay' AND (p.categorySlug LIKE 'vay%' OR p.categorySlug LIKE 'dam%' OR p.categorySlug LIKE 'chan-vay%'))"), 'ProductRepository hỗ trợ lọc nhóm vay*');

// 8. Test live Spring Boot API queries
async function testBackendApi() {
  console.log('\n8. KIỂM TRA TRỰC TIẾP BACKEND SPRING BOOT PRODUCT API (Port 8080):');
  try {
    const resNu = await fetch('http://localhost:8080/api/v1/products?gender=nu&size=5');
    const dataNu = await resNu.json();
    assert(dataNu.totalElements === 120, `API Backend trả về đúng 120 sản phẩm Nữ (thực tế: ${dataNu.totalElements})`);

    const resAo = await fetch('http://localhost:8080/api/v1/products?gender=nu&category=ao&size=5');
    const dataAo = await resAo.json();
    assert(dataAo.totalElements === 46, `API Backend trả về đúng 46 sản phẩm Áo Nữ (thực tế: ${dataAo.totalElements})`);

    const resQuan = await fetch('http://localhost:8080/api/v1/products?gender=nu&category=quan&size=5');
    const dataQuan = await resQuan.json();
    assert(dataQuan.totalElements === 6, `API Backend trả về đúng 6 sản phẩm Quần Nữ (thực tế: ${dataQuan.totalElements})`);

    const resVay = await fetch('http://localhost:8080/api/v1/products?gender=nu&category=vay&size=5');
    const dataVay = await resVay.json();
    assert(dataVay.totalElements === 68, `API Backend trả về đúng 68 sản phẩm Váy Nữ (thực tế: ${dataVay.totalElements})`);
  } catch (err) {
    assert(false, `Lỗi khi gọi Backend API: ${err.message}`);
  }

  console.log(`\n=== TỔNG KẾT: ${passCount} PASSED, ${failCount} FAILED ===`);
  if (failCount > 0) {
    process.exit(1);
  } else {
    console.log('ALL TESTS PASSED SUCCESSFULLY (100%)!');
  }
}

testBackendApi();