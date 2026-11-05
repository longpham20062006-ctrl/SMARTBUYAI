const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const baseDir = path.join(process.cwd(), 'public', 'images', 'san-pham', 'quan-ao-nu');
const targets = ['ao', 'quan', 'vay'];

function md5File(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(buf).digest('hex');
  } catch (e) {
    return null;
  }
}

const allScannedFiles = [];
const hashMap = new Map(); // hash -> [filePaths]
const duplicates = [];

for (const cat of targets) {
  const catDir = path.join(baseDir, cat);
  if (!fs.existsSync(catDir)) continue;

  function walk(d) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const ent of entries) {
      const fullPath = path.join(d, ent.name);
      if (ent.isDirectory()) {
        walk(fullPath);
      } else {
        const ext = path.extname(ent.name).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp', '.svg'].includes(ext)) {
          const stats = fs.statSync(fullPath);
          const hash = md5File(fullPath);
          const relPath = '/' + path.relative(path.join(process.cwd(), 'public'), fullPath).replace(/\\/g, '/');

          const record = {
            categoryFolder: cat,
            fullPath,
            relPath,
            fileName: ent.name,
            ext,
            size: stats.size,
            hash,
          };
          allScannedFiles.push(record);

          if (hash) {
            if (!hashMap.has(hash)) {
              hashMap.set(hash, []);
            }
            hashMap.get(hash).push(record);
          }
        }
      }
    }
  }

  walk(catDir);
}

// Find duplicates
for (const [hash, fileList] of hashMap.entries()) {
  if (fileList.length > 1) {
    duplicates.push({ hash, fileList });
  }
}

// Check against existing products in importedProducts.json
const products = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'mocks', 'importedProducts.json'), 'utf8'));

// Build Set of images currently used by products
const usedImagesSet = new Set();
for (const p of products) {
  if (Array.isArray(p.images)) {
    for (const img of p.images) {
      if (img) usedImagesSet.add(img.toLowerCase());
    }
  }
  if (Array.isArray(p.variants)) {
    for (const v of p.variants) {
      if (v.image) usedImagesSet.add(v.image.toLowerCase());
    }
  }
}

const aoCount = allScannedFiles.filter(f => f.categoryFolder === 'ao').length;
const quanCount = allScannedFiles.filter(f => f.categoryFolder === 'quan').length;
const vayCount = allScannedFiles.filter(f => f.categoryFolder === 'vay').length;

console.log('=== SCAN SUMMARY ===');
console.log('Total images found in AO:', aoCount);
console.log('Total images found in QUAN:', quanCount);
console.log('Total images found in VAY:', vayCount);
console.log('Total images across 3 folders:', allScannedFiles.length);
console.log('Duplicate image groups found:', duplicates.length);

const unusedFiles = allScannedFiles.filter(f => !usedImagesSet.has(f.relPath.toLowerCase()));
const usedFiles = allScannedFiles.filter(f => usedImagesSet.has(f.relPath.toLowerCase()));

console.log('Images already referenced in existing products:', usedFiles.length);
console.log('Images NOT YET referenced in any product:', unusedFiles.length);

// Breakdown of unused files by folder
console.log('  Unused in AO:', unusedFiles.filter(f => f.categoryFolder === 'ao').length);
console.log('  Unused in QUAN:', unusedFiles.filter(f => f.categoryFolder === 'quan').length);
console.log('  Unused in VAY:', unusedFiles.filter(f => f.categoryFolder === 'vay').length);

fs.writeFileSync(path.join(process.cwd(), 'scripts', 'scanned_nu_images.json'), JSON.stringify({
  summary: {
    aoCount,
    quanCount,
    vayCount,
    totalCount: allScannedFiles.length,
    duplicateGroupsCount: duplicates.length,
    usedCount: usedFiles.length,
    unusedCount: unusedFiles.length,
  },
  duplicates,
  unusedFiles,
  allFiles: allScannedFiles
}, null, 2), 'utf8');

console.log('Wrote scripts/scanned_nu_images.json');

