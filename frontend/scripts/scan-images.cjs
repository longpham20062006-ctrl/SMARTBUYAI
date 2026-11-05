const fs = require('fs');
const path = require('path');

const ROOT_IMAGE_DIR = path.resolve(__dirname, '..', 'public', 'images');
const LABELS_FILE = path.join(ROOT_IMAGE_DIR, 'category-labels.json');
const MANIFEST_FILE = path.join(ROOT_IMAGE_DIR, 'image-manifest.json');

const VALID_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

// Đọc category-labels.json
let labelMap = {};
if (fs.existsSync(LABELS_FILE)) {
  try {
    labelMap = JSON.parse(fs.readFileSync(LABELS_FILE, 'utf8'));
  } catch (err) {
    console.error('Lỗi khi đọc category-labels.json:', err.message);
  }
}

function scanDirRecursive(currentDir, relativePath = '') {
  let results = [];
  if (!fs.existsSync(currentDir)) return results;

  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const rel = path.join(relativePath, entry.name).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      results = results.concat(scanDirRecursive(fullPath, rel));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (VALID_EXTENSIONS.has(ext)) {
        const stats = fs.statSync(fullPath);
        const baseName = path.basename(entry.name, ext);
        const parts = baseName.split('-');
        const sku = parts[0] || 'UNKNOWN';
        const color = parts[1] || 'default';
        const angle = parts.slice(2).join('-') || 'front';

        results.push({
          fileName: entry.name,
          relativePath: rel,
          webPath: `/images/${rel}`,
          categoryPath: relativePath.replace(/\\/g, '/'),
          categoryLabel: labelMap[relativePath.replace(/\\/g, '/')] || relativePath.replace(/\\/g, '/'),
          sku,
          color,
          angle,
          extension: ext.slice(1),
          sizeBytes: stats.size,
          lastModified: stats.mtime.toISOString(),
        });
      }
    }
  }

  return results;
}

console.log('Đang quét toàn bộ file ảnh trong:', ROOT_IMAGE_DIR);
const scannedImages = scanDirRecursive(ROOT_IMAGE_DIR);

// Gom nhóm theo danh mục
const categoryGroupMap = {};
Object.keys(labelMap).forEach((catPath) => {
  categoryGroupMap[catPath] = {
    path: catPath,
    url: `/images/${catPath}/`,
    label: labelMap[catPath],
    images: []
  };
});

scannedImages.forEach((img) => {
  if (!categoryGroupMap[img.categoryPath]) {
    categoryGroupMap[img.categoryPath] = {
      path: img.categoryPath,
      url: `/images/${img.categoryPath}/`,
      label: labelMap[img.categoryPath] || img.categoryPath,
      images: []
    };
  }
  categoryGroupMap[img.categoryPath].images.push(img);
});

const manifest = {
  version: '2.0.0',
  description: 'SMARTBUY AI Simplified Image Manifest',
  scannedAt: new Date().toISOString(),
  totalImages: scannedImages.length,
  totalCategories: Object.keys(categoryGroupMap).length,
  rootPath: '/images/',
  categories: Object.values(categoryGroupMap),
  allImages: scannedImages
};

fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf8');

console.log(`✓ Quét hoàn tất! Tìm thấy ${scannedImages.length} file ảnh trong ${manifest.totalCategories} danh mục.`);
console.log(`✓ Đã cập nhật ${MANIFEST_FILE}`);
