const fs = require('fs');

const imported = JSON.parse(fs.readFileSync('src/mocks/importedProducts.json', 'utf8'));
const validCode = fs.readFileSync('src/constants/validImagePaths.ts', 'utf8');

// Extract all strings in validImagePaths
const validPaths = new Set(validCode.match(/\/images\/[^\'\"]+/g));

const p1 = imported.find(p => p.id === 'W-DRESS-001');
console.log('p1:', p1 ? { id: p1.id, name: p1.name, price: p1.price, images: p1.images, isActive: p1.isActive } : 'NOT FOUND');

if (p1) {
  const img = p1.images[0];
  console.log('Image:', img);
  console.log('Exists in validPaths:', validPaths.has(img));
  console.log('Exists on disk:', fs.existsSync('public' + img));
}

