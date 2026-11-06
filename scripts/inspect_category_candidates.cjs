const fs = require('fs');

const imported = JSON.parse(fs.readFileSync('src/mocks/importedProducts.json', 'utf8'));

// Filter only items with images existing on disk
const verified = imported.filter(p => {
  if (!p.images || p.images.length === 0) return false;
  return fs.existsSync('public' + p.images[0]);
});

console.log(`Verified products on disk: ${verified.length} / ${imported.length}`);

// Group by categorySlug
const byCat = {};
verified.forEach(p => {
  const cat = p.categorySlug || 'other';
  if (!byCat[cat]) byCat[cat] = [];
  byCat[cat].push(p);
});

console.log('\nCategories breakdown:');
for (const [cat, items] of Object.entries(byCat)) {
  console.log(`- ${cat}: ${items.length} products`);
}

// Inspect specific categories
console.log('\n--- VÁY (nu) ---');
byCat['vay']?.slice(0, 15).forEach(p => {
  console.log(`[${p.id}] ${p.name} | badge: ${p.badge} | img: ${p.images[0]}`);
});

console.log('\n--- CROPTOP & HAI DÂY (nu) ---');
byCat['ao-croptop']?.forEach(p => {
  console.log(`[${p.id}] ${p.name} | badge: ${p.badge} | img: ${p.images[0]}`);
});
byCat['ao-hai-day']?.forEach(p => {
  console.log(`[${p.id}] ${p.name} | badge: ${p.badge} | img: ${p.images[0]}`);
});

console.log('\n--- PHỤ KIỆN ---');
byCat['phu-kien']?.slice(0, 10).forEach(p => {
  console.log(`[${p.id}] ${p.name} | badge: ${p.badge} | img: ${p.images[0]}`);
});

console.log('\n--- QUẦN (nam & nu) ---');
byCat['quan-dai']?.forEach(p => {
  console.log(`[${p.id}] ${p.name} | gender: ${p.gender} | badge: ${p.badge} | img: ${p.images[0]}`);
});
byCat['quan']?.forEach(p => {
  console.log(`[${p.id}] ${p.name} | gender: ${p.gender} | badge: ${p.badge} | img: ${p.images[0]}`);
});

console.log('\n--- SƠ MI & POLO (nam) ---');
byCat['ao-so-mi']?.slice(0, 5).forEach(p => {
  console.log(`[${p.id}] ${p.name} | badge: ${p.badge} | img: ${p.images[0]}`);
});
byCat['ao-polo']?.slice(0, 5).forEach(p => {
  console.log(`[${p.id}] ${p.name} | badge: ${p.badge} | img: ${p.images[0]}`);
});

console.log('\n--- HOODIE & KHOÁC (nam) ---');
byCat['ao-hoodie']?.slice(0, 5).forEach(p => {
  console.log(`[${p.id}] ${p.name} | badge: ${p.badge} | img: ${p.images[0]}`);
});
byCat['ao-khoac']?.slice(0, 5).forEach(p => {
  console.log(`[${p.id}] ${p.name} | badge: ${p.badge} | img: ${p.images[0]}`);
});

