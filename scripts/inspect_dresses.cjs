const fs = require('fs');

const imported = JSON.parse(fs.readFileSync('src/mocks/importedProducts.json', 'utf8'));

// Filter dresses (vay)
const dresses = imported.filter(p => p.categorySlug === 'vay');
console.log('Total dresses in importedProducts.json:', dresses.length);

const realDresses = dresses.filter(p => {
  if (!p.images || !p.images[0]) return false;
  const pPath = 'public' + p.images[0];
  return fs.existsSync(pPath);
});

console.log('Dresses with REAL file existing on disk:', realDresses.length);
console.log('\nList of real dresses on disk:');
realDresses.forEach((d, idx) => {
  console.log(`${idx + 1}. [${d.id}] ${d.name} -> ${d.images[0]}`);
});

