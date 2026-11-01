/**
 * SMARTBUY AI — IMAGE SYNC & INTEGRITY AUDIT TEST SUITE
 * 
 * Verifies:
 * 1. Physical disk audit in public/images/san-pham/
 * 2. Total catalog products (308 preserved)
 * 3. Eligible public products (278 with valid real images)
 * 4. Hidden missing-image products (30 W-DRESS items)
 * 5. Public storefront isolation (0 broken/missing image items on customer pages)
 * 6. Admin visibility (308 accessible with missing image badges)
 * 7. Zero placeholder / fake image injection
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const IMAGE_DIR = path.join(ROOT_DIR, 'public', 'images', 'san-pham');
const PRODUCTS_JSON = path.join(ROOT_DIR, 'src', 'mocks', 'importedProducts.json');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    testsFailed++;
  }
}

console.log('====================================================');
console.log('🧪 SMARTBUY AI — PRODUCT IMAGE AUDIT TEST SUITE');
console.log('====================================================\n');

// 1. Physical Disk Images Audit
console.log('1. Scanning physical image directory: public/images/san-pham/');
function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const diskImages = getAllFiles(IMAGE_DIR).filter((f) => /\.(jpg|jpeg|png|webp|avif)$/i.test(f));
console.log(`   Found ${diskImages.length} physical product images on disk.`);
assert(diskImages.length === 606, `Physical disk images count matches exact manifest: ${diskImages.length} (expected 606)`);

// 2. Catalog Products Data Audit
console.log('\n2. Reading catalog database / mock repository:');
assert(fs.existsSync(PRODUCTS_JSON), 'importedProducts.json exists');
const rawProducts = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf-8'));
console.log(`   Total products in catalog: ${rawProducts.length}`);
assert(rawProducts.length === 308, `Total product count preserved in database: ${rawProducts.length} (expected 308)`);

// 3. Validation Logic Simulation
console.log('\n3. Validating image existence and validity:');
const validProducts = [];
const missingImageProducts = [];

for (const p of rawProducts) {
  const images = Array.isArray(p.images) ? p.images : [];
  const validImages = images.filter((img) => {
    if (!img || typeof img !== 'string') return false;
    if (img.includes('unsplash.com') || img.includes('placeholder')) return false;
    if (img.startsWith('/images/san-pham/')) {
      const diskPath = path.join(ROOT_DIR, 'public', img.replace(/\//g, path.sep));
      return fs.existsSync(diskPath);
    }
    return false;
  });

  if (validImages.length > 0) {
    validProducts.push({ ...p, validImages });
  } else {
    missingImageProducts.push(p);
  }
}

console.log(`   Products with valid real images: ${validProducts.length}`);
console.log(`   Products with missing images: ${missingImageProducts.length}`);
assert(validProducts.length === 278, `Products with valid real images = 278 (actual: ${validProducts.length})`);
assert(missingImageProducts.length === 30, `Products with missing images = 30 (actual: ${missingImageProducts.length})`);

// 4. Missing Products ID Check
console.log('\n4. Verifying missing products list:');
const expectedMissingPrefixes = ['W-DRESS-'];
const allMissingAreDress = missingImageProducts.every((p) => p.id.startsWith('W-DRESS-'));
assert(allMissingAreDress, 'All 30 missing image products belong to W-DRESS collection');
assert(missingImageProducts.some((p) => p.id === 'W-DRESS-031'), 'W-DRESS-031 identified as missing image');
assert(missingImageProducts.some((p) => p.id === 'W-DRESS-053'), 'W-DRESS-053 identified as missing image');
assert(missingImageProducts.some((p) => p.id === 'W-DRESS-091'), 'W-DRESS-091 identified as missing image');

// 5. Codebase placeholder check
console.log('\n5. Checking for fake Unsplash placeholders in repository & services:');
const repoContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'mocks', 'repository.ts'), 'utf-8');
const hasRepoUnsplash = repoContent.includes('images.unsplash.com/photo-1490481651871');
assert(!hasRepoUnsplash, 'MockRepo does not inject Unsplash fallback into product.images');

const serviceContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'services', 'productService.ts'), 'utf-8');
assert(serviceContent.includes('isProductEligibleForPublicDisplay'), 'productService enforces isProductEligibleForPublicDisplay filter');

const cardContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'components', 'common', 'ProductCard.tsx'), 'utf-8');
assert(cardContent.includes('hasValidProductImage'), 'ProductCard guards against products without valid images');
assert(!cardContent.includes('images.unsplash.com/photo-1490481651871'), 'ProductCard has zero Unsplash image injections');

// 6. Admin Panel Inspection
console.log('\n6. Checking Admin Products Page features:');
const adminPageContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'features', 'admin', 'products', 'pages', 'AdminProductsPage.tsx'), 'utf-8');
assert(adminPageContent.includes('validProductsCount'), 'AdminProductsPage displays count of valid products (278)');
assert(adminPageContent.includes('missingProductsCount'), 'AdminProductsPage displays count of missing image products (30)');
assert(adminPageContent.includes('Thiếu ảnh sản phẩm'), 'AdminProductsPage displays clear status for missing images');
assert(adminPageContent.includes('imageStatusFilter'), 'AdminProductsPage provides filter for image status');

// 7. Backend query check
console.log('\n7. Checking Java Spring Boot Backend queries:');
const backendRepoContent = fs.readFileSync(path.join(ROOT_DIR, 'backend', 'src', 'main', 'java', 'com', 'smartbuyai', 'repository', 'ProductRepository.java'), 'utf-8');
assert(backendRepoContent.includes('SIZE(p.images) > 0'), 'ProductRepository.java enforces SIZE(p.images) > 0 for active public queries');

console.log('\n====================================================');
console.log(`🏁 TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log('====================================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

