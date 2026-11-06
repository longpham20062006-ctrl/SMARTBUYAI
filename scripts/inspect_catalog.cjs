const fs = require('fs');
const path = require('path');

// 1. Scan public/images/san-pham to find all real images on disk
function scanDir(dir) {
  let files = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        files = files.concat(scanDir(full));
      } else if (/\.(jpg|jpeg|png|webp)$/i.test(item.name)) {
        files.push(full.replace(/\\/g, '/'));
      }
    }
  } catch (e) {}
  return files;
}

const diskImages = scanDir('public/images/san-pham');
console.log('Total real images on disk under public/images/san-pham:', diskImages.length);

// Group disk images by category
const catGroups = {};
diskImages.forEach(f => {
  const rel = f.replace(/^public/, '');
  const parts = rel.split('/');
  const cat = parts.slice(0, 5).join('/');
  catGroups[cat] = (catGroups[cat] || 0) + 1;
});
console.log('\nDisk image distribution:');
console.log(JSON.stringify(catGroups, null, 2));

// 2. Check importedProducts.json
let imported = [];
try {
  imported = JSON.parse(fs.readFileSync('src/mocks/importedProducts.json', 'utf8'));
  console.log('\nimportedProducts.json count:', imported.length);
} catch (e) {
  console.log('Error reading importedProducts.json:', e.message);
}

// 3. Check products in imported that have real images on disk
const diskSet = new Set(diskImages.map(f => f.replace(/^public/, '').toLowerCase()));

const validProducts = imported.filter(p => {
  const img = (p.images && p.images[0]) ? p.images[0].toLowerCase() : '';
  return diskSet.has(img);
});

console.log('Products in importedProducts with real disk image:', validProducts.length);

// Check categories of valid products
const validCats = {};
validProducts.forEach(p => {
  const cat = p.categorySlug || p.category || 'other';
  validCats[cat] = (validCats[cat] || 0) + 1;
});
console.log('\nValid products by categorySlug:', validCats);

