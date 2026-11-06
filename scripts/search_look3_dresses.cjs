const fs = require('fs');
const imported = JSON.parse(fs.readFileSync('src/mocks/importedProducts.json', 'utf8'));

const dresses = imported.filter(p => p.categorySlug === 'vay');

console.log('--- FINDING LOOK 03 DRESSES (Váy ngắn, xòe, corset, Gen Z chic) ---');
dresses.forEach(d => {
  const n = d.name.toLowerCase();
  if (
    n.includes('xòe') ||
    n.includes('ngắn') ||
    n.includes('corset') ||
    n.includes('gen z') ||
    n.includes('chữ a') ||
    n.includes('tiểu thư') ||
    n.includes('dạo phố') ||
    n.includes('pastel') ||
    n.includes('hoa') ||
    n.includes('bodycon') ||
    n.includes('aesthetic')
  ) {
    console.log(`[${d.id}] ${d.name} -> ${d.images[0]}`);
  }
});

