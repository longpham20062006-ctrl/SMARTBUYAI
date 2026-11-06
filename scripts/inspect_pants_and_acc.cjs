const fs = require('fs');

const imported = JSON.parse(fs.readFileSync('src/mocks/importedProducts.json', 'utf8'));

console.log('--- QUẦN ---');
imported.filter(p => p.categorySlug === 'quan-dai' || p.categorySlug === 'quan' || p.categorySlug === 'quan-short').forEach(p => {
  console.log(`[${p.id}] ${p.name} (${p.categorySlug}, ${p.gender}) -> ${p.images[0]}`);
});

console.log('\n--- PHỤ KIỆN ---');
imported.filter(p => p.categorySlug === 'phu-kien').forEach(p => {
  console.log(`[${p.id}] ${p.name} (${p.gender}) -> ${p.images[0]}`);
});

