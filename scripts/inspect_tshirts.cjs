const fs = require('fs');
const imported = JSON.parse(fs.readFileSync('src/mocks/importedProducts.json', 'utf8'));

console.log('--- ÁO THUN ---');
imported.filter(p => p.categorySlug === 'ao-thun').slice(0, 10).forEach(p => {
  console.log('[' + p.id + '] ' + p.name + ' -> ' + p.images[0]);
});

