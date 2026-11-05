const fs = require('fs');
const path = require('path');

const SAN_PHAM_DIR = path.resolve('public/images/san-pham');
const MANIFEST_PATH = path.resolve('public/images/san-pham/manifest.json');
const IMPORTED_JSON_PATH = path.resolve('src/mocks/importedProducts.json');
const BACKEND_JSON_PATH = path.resolve('backend/src/main/resources/data/importedProducts.json');

// 1. Recursive scan of all image files in public/images/san-pham
function getAllImageFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      getAllImageFiles(fullPath, fileList);
    } else if (item.isFile()) {
      const ext = path.extname(item.name).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) {
        const relFromPublic = path.relative(path.resolve('public'), fullPath).replace(/\\/g, '/');
        const webPath = '/' + relFromPublic;
        const stats = fs.statSync(fullPath);
        fileList.push({
          fullPath,
          webPath,
          sizeBytes: stats.size,
          fileName: item.name,
          dir: path.dirname(fullPath)
        });
      }
    }
  }
  return fileList;
}

console.log('=== 1. SCANNING DISK IMAGES ===');
const allDiskImages = getAllImageFiles(SAN_PHAM_DIR);
console.log(`Found ${allDiskImages.length} image files on disk in public/images/san-pham/`);

const diskWebPathSet = new Set(allDiskImages.map(img => img.webPath));

// Also map by lowercased path and by filename to identify potential slight path discrepancies
const diskByLowerPath = new Map();
const diskByFilename = new Map();
for (const img of allDiskImages) {
  diskByLowerPath.set(img.webPath.toLowerCase(), img.webPath);
  if (!diskByFilename.has(img.fileName)) {
    diskByFilename.set(img.fileName, []);
  }
  diskByFilename.get(img.fileName).push(img.webPath);
}

// 2. Read importedProducts.json
console.log('\n=== 2. READING IMPORTED PRODUCTS ===');
let products = [];
if (fs.existsSync(IMPORTED_JSON_PATH)) {
  products = JSON.parse(fs.readFileSync(IMPORTED_JSON_PATH, 'utf8'));
  console.log(`Loaded ${products.length} products from ${IMPORTED_JSON_PATH}`);
} else if (fs.existsSync(BACKEND_JSON_PATH)) {
  products = JSON.parse(fs.readFileSync(BACKEND_JSON_PATH, 'utf8'));
  console.log(`Loaded ${products.length} products from ${BACKEND_JSON_PATH}`);
}

// 3. Audit each product
let validProducts = 0;
let missingImageProducts = [];
let pathFixedProducts = [];
let totalImagesReferenced = 0;
let validImagesReferenced = 0;
let brokenImagesReferenced = 0;

for (const p of products) {
  const images = Array.isArray(p.images) ? p.images : [];
  totalImagesReferenced += images.length;
  
  const validImagesForP = [];
  const fixedImagesForP = [];
  
  for (const imgPath of images) {
    if (typeof imgPath !== 'string') continue;
    
    // Check if directly exists on disk
    if (diskWebPathSet.has(imgPath)) {
      validImagesForP.push(imgPath);
      validImagesReferenced++;
    } else if (diskByLowerPath.has(imgPath.toLowerCase())) {
      // Case mismatch
      const correctPath = diskByLowerPath.get(imgPath.toLowerCase());
      validImagesForP.push(correctPath);
      fixedImagesForP.push({ original: imgPath, fixed: correctPath });
      validImagesReferenced++;
    } else {
      // Check if filename exists anywhere in diskByFilename
      const fileName = path.basename(imgPath);
      if (diskByFilename.has(fileName)) {
        const matches = diskByFilename.get(fileName);
        const bestMatch = matches[0];
        validImagesForP.push(bestMatch);
        fixedImagesForP.push({ original: imgPath, fixed: bestMatch });
        validImagesReferenced++;
      } else {
        brokenImagesReferenced++;
      }
    }
  }

  // Check variants images
  const variants = Array.isArray(p.variants) ? p.variants : [];
  let validVariantsCount = 0;
  for (const v of variants) {
    if (v.image) {
      if (diskWebPathSet.has(v.image) || diskByLowerPath.has(v.image.toLowerCase())) {
        validVariantsCount++;
      }
    }
  }

  if (validImagesForP.length > 0) {
    validProducts++;
    if (fixedImagesForP.length > 0) {
      pathFixedProducts.push({
        id: p.id,
        name: p.name,
        fixes: fixedImagesForP
      });
    }
  } else {
    missingImageProducts.push({
      id: p.id,
      name: p.name,
      category: p.categorySlug || p.category,
      gender: p.gender,
      originalImages: images
    });
  }
}

console.log('\n==================================================');
console.log('📊 AUDIT SUMMARY:');
console.log(`- Total image files on disk: ${allDiskImages.length}`);
console.log(`- Total products in catalog: ${products.length}`);
console.log(`- Products with VALID images: ${validProducts}`);
console.log(`- Products with MISSING images: ${missingImageProducts.length}`);
console.log(`- Products with fixable paths: ${pathFixedProducts.length}`);
console.log(`- Total product image references: ${totalImagesReferenced}`);
console.log(`  -> Valid: ${validImagesReferenced}`);
console.log(`  -> Broken: ${brokenImagesReferenced}`);
console.log('==================================================');

if (missingImageProducts.length > 0) {
  console.log('\n❌ PRODUCTS WITH MISSING IMAGES (FIRST 10):');
  missingImageProducts.slice(0, 10).forEach(p => {
    console.log(`- [${p.id}] ${p.name} (${p.category}, ${p.gender}) -> ${JSON.stringify(p.originalImages)}`);
  });
}

if (pathFixedProducts.length > 0) {
  console.log('\n🔧 PRODUCTS WITH FIXABLE PATHS (FIRST 5):');
  pathFixedProducts.slice(0, 5).forEach(p => {
    console.log(`- [${p.id}] ${p.name} -> ${JSON.stringify(p.fixes)}`);
  });
}

// Check unused images on disk (images on disk not referenced by any product)
const usedImagesSet = new Set();
for (const p of products) {
  if (Array.isArray(p.images)) {
    p.images.forEach(img => usedImagesSet.add(img));
  }
}
const unusedDiskImages = allDiskImages.filter(img => !usedImagesSet.has(img.webPath));
console.log(`\n- Unused images on disk: ${unusedDiskImages.length} files`);

