const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: BROKEN PRODUCT IMAGES & INVALID CARDS FIX AUDIT ===\n');

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

// 1. Verify validImagePaths.ts
const validPathsFile = path.join(__dirname, '..', 'src', 'constants', 'validImagePaths.ts');
assert(fs.existsSync(validPathsFile), 'src/constants/validImagePaths.ts exists');
const validPathsContent = fs.readFileSync(validPathsFile, 'utf8');
const matchPaths = validPathsContent.match(/export const REAL_DISK_IMAGE_PATHS: string\[\] = \[([\s\S]*?)\];/);
assert(matchPaths !== null, 'REAL_DISK_IMAGE_PATHS array exported');

// Parse image paths using JSON.parse
const imagePaths = JSON.parse(`[${matchPaths[1].replace(/,\s*$/, '')}]`);

assert(imagePaths.length === 606, `Exactly 606 disk images indexed (found ${imagePaths.length})`);

// 2. Check 100% of these 606 files physically exist on disk
let allExist = true;
let missingSample = null;
for (const relPath of imagePaths) {
  const diskPath = path.join(__dirname, '..', 'public', relPath.replace(/^\//, ''));
  if (!fs.existsSync(diskPath)) {
    allExist = false;
    missingSample = diskPath;
    break;
  }
}
assert(allExist, `All 606 images physically exist on disk in public/images/san-pham (sample missing: ${missingSample})`);

// 3. Verify importedProducts.json
const importedProductsFile = path.join(__dirname, '..', 'src', 'mocks', 'importedProducts.json');
const products = JSON.parse(fs.readFileSync(importedProductsFile, 'utf8'));
assert(products.length === 308, `Total products preserved: 308 (found ${products.length})`);

// Check the 30 missing image products
const expectedMissing = [
  'W-DRESS-031', 'W-DRESS-053', 'W-DRESS-054', 'W-DRESS-055', 'W-DRESS-056',
  'W-DRESS-057', 'W-DRESS-058', 'W-DRESS-059', 'W-DRESS-060', 'W-DRESS-061',
  'W-DRESS-062', 'W-DRESS-073', 'W-DRESS-074', 'W-DRESS-075', 'W-DRESS-076',
  'W-DRESS-077', 'W-DRESS-078', 'W-DRESS-079', 'W-DRESS-080', 'W-DRESS-081',
  'W-DRESS-082', 'W-DRESS-083', 'W-DRESS-084', 'W-DRESS-085', 'W-DRESS-086',
  'W-DRESS-087', 'W-DRESS-088', 'W-DRESS-089', 'W-DRESS-090', 'W-DRESS-091'
];

const missingInProducts = products.filter(p => !p.images || p.images.length === 0);
assert(missingInProducts.length === 30, `Exactly 30 products have no images (found ${missingInProducts.length})`);

const missingIds = missingInProducts.map(p => p.id).sort();
const sortedExpected = [...expectedMissing].sort();
assert(JSON.stringify(missingIds) === JSON.stringify(sortedExpected), 'Missing product IDs match expected list exactly');

// Check that these 30 products are isActive: false
const allInactive = missingInProducts.every(p => p.isActive === false);
assert(allInactive, 'All 30 missing image products are marked isActive: false');

// Check valid products (278)
const validProducts = products.filter(p => p.images && p.images.length > 0);
assert(validProducts.length === 278, `Exactly 278 products have valid images (found ${validProducts.length})`);

// Check that all 278 valid products have price > 0
const validHavePrices = validProducts.every(p => typeof p.price === 'number' && p.price > 0);
assert(validHavePrices, 'All 278 valid products have positive selling prices (> 0)');

// Check that NO product has price 0 with valid images
const zeroPriceWithImgs = products.filter(p => (!p.price || p.price === 0) && p.images && p.images.length > 0);
assert(zeroPriceWithImgs.length === 0, `Zero products have price 0 with images (found ${zeroPriceWithImgs.length})`);

// 4. Verify ProductCard.tsx fixes
const productCardFile = path.join(__dirname, '..', 'src', 'components', 'common', 'ProductCard.tsx');
const productCardContent = fs.readFileSync(productCardFile, 'utf8');

assert(productCardContent.includes('isProductEligibleForPublicDisplay'), 'ProductCard imports and checks isProductEligibleForPublicDisplay');
assert(productCardContent.includes('Boolean(currentPrice > 0 && originalPrice > currentPrice)'), 'ProductCard uses Boolean(...) to prevent literal 0 text rendering');
assert(!productCardContent.includes('{currentPrice && currentPrice > 0 && originalPrice && originalPrice > currentPrice && ('), 'Old faulty JSX comparison eliminated from ProductCard');

// 5. Verify CatalogPage.tsx fixes
const catalogPageFile = path.join(__dirname, '..', 'src', 'features', 'catalog', 'pages', 'CatalogPage.tsx');
const catalogPageContent = fs.readFileSync(catalogPageFile, 'utf8');

assert(catalogPageContent.includes('displayedProducts.filter(isProductEligibleForPublicDisplay).map'), 'CatalogPage filters grid items so no empty cells or holes exist');

// 6. Verify repository.ts
const repoFile = path.join(__dirname, '..', 'src', 'mocks', 'repository.ts');
const repoContent = fs.readFileSync(repoFile, 'utf8');

assert(repoContent.includes('v16.2-clean-image-audit-and-price-fix-20261031'), 'Schema version bumped to trigger browser cache refresh');
assert(repoContent.includes('p.images.filter(isValidImagePath)'), 'Repository sanitizes images against disk whitelist');

// 7. Verify backend ProductRepository.java
const javaRepoFile = path.join(__dirname, '..', 'backend', 'src', 'main', 'java', 'com', 'smartbuyai', 'repository', 'ProductRepository.java');
const javaRepoContent = fs.readFileSync(javaRepoFile, 'utf8');

assert(javaRepoContent.includes('AND p.price > 0'), 'Backend ProductRepository enforces p.price > 0 in search and highlight queries');
assert(javaRepoContent.includes('AND SIZE(p.images) > 0'), 'Backend ProductRepository enforces SIZE(p.images) > 0 in queries');

console.log(`\n=== AUDIT SUMMARY: ${passCount} PASSED, ${failCount} FAILED ===`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL VERIFICATIONS SUCCESSFUL!');
}
