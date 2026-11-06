const fs = require('fs');
const imported = JSON.parse(fs.readFileSync('src/mocks/importedProducts.json', 'utf8'));

const hotItems = imported.filter(p => p.badge === 'HOT' || p.badge === 'DROP' || p.badge === 'TRENDING' || p.isFeatured || p.isHot);
console.log('Total hot items in importedProducts.json:', hotItems.length);
hotItems.slice(0, 20).forEach(p => {
  console.log(`[${p.id}] ${p.name} | category: ${p.categorySlug} | badge: ${p.badge}`);
});

