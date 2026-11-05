const fs = require('fs');
const path = require('path');

const scanned = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'scanned_nu_images.json'), 'utf8'));
const products = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'mocks', 'importedProducts.json'), 'utf8'));

console.log('=== PRODUCT MAPPING ANALYSIS FOR 207 IMAGES ===');

// Map image path -> product(s)
const imgToProducts = new Map();
for (const p of products) {
  const allImgs = [...(p.images || []), ...(p.variants || []).map(v => v.image).filter(Boolean)];
  for (const img of allImgs) {
    const norm = img.toLowerCase();
    if (!imgToProducts.has(norm)) {
      imgToProducts.set(norm, []);
    }
    imgToProducts.get(norm).push(p);
  }
}

// Group images by folder / subfolder
const folderGroups = {};

for (const f of scanned.allFiles) {
  const norm = f.relPath.toLowerCase();
  const prods = imgToProducts.get(norm) || [];
  
  // Extract folder hierarchy
  const parts = f.relPath.split('/');
  // /images/san-pham/quan-ao-nu/ao/ao-cardigan/ao_1/...
  const subCat = parts[4] || ''; // ao, quan, vay
  const detailCat = parts[5] || ''; // ao-cardigan, quan_1, vay_01.webp
  const modelDir = parts[6] || ''; // ao_1, etc.

  const groupKey = `${subCat} > ${detailCat}${modelDir ? ' > ' + modelDir : ''}`;
  if (!folderGroups[groupKey]) {
    folderGroups[groupKey] = {
      count: 0,
      images: [],
      products: new Set(),
      categories: new Set(),
      genders: new Set(),
    };
  }
  folderGroups[groupKey].count++;
  folderGroups[groupKey].images.push(f.relPath);
  for (const p of prods) {
    folderGroups[groupKey].products.add(p.id + ' (' + p.name + ')');
    folderGroups[groupKey].categories.add(p.categorySlug);
    folderGroups[groupKey].genders.add(p.gender);
  }
}

console.log('Folder Groups count:', Object.keys(folderGroups).length);
for (const [k, v] of Object.entries(folderGroups)) {
  console.log(`\nGroup: [${k}] (Images: ${v.count})`);
  console.log(`  Categories in DB:`, Array.from(v.categories));
  console.log(`  Genders:`, Array.from(v.genders));
  console.log(`  Products mapped (${v.products.size}):`, Array.from(v.products).slice(0, 3));
}

