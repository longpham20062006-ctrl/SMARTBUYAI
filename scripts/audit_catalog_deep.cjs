const fs = require('fs');

const products = JSON.parse(fs.readFileSync('src/mocks/importedProducts.json', 'utf8'));
console.log('Total products in importedProducts.json:', products.length);

// 1. Audit Gender vs Category/Name
const suspiciousMen = [];
const suspiciousWomen = [];

const womenKeywords = ['váy', 'đầm', 'croptop', 'hai dây', 'yếm', 'chân váy', 'tutu', 'corset', 'nữ'];
const menKeywords = ['nam', 'quần đùi nam', 'sơ mi nam'];

products.forEach((p) => {
  const nameLower = (p.name || '').toLowerCase();
  const slugLower = (p.slug || '').toLowerCase();
  const catLower = (p.categorySlug || '').toLowerCase();
  const pathLower = (p.images?.[0] || p.image || '').toLowerCase();

  // If gender is nam, but has female keywords or female folder
  if (p.gender === 'nam') {
    if (
      catLower.includes('vay') ||
      catLower.includes('dam') ||
      catLower.includes('croptop') ||
      catLower.includes('hai-day') ||
      pathLower.includes('quan-ao-nu') ||
      nameLower.includes('váy') ||
      nameLower.includes('đầm') ||
      nameLower.includes('croptop')
    ) {
      suspiciousMen.push({
        id: p.id,
        name: p.name,
        gender: p.gender,
        categorySlug: p.categorySlug,
        image: p.images?.[0],
      });
    }
  }

  // If gender is nu, but has male folder or keywords
  if (p.gender === 'nu') {
    if (pathLower.includes('quan-ao-nam') && !pathLower.includes('quan-ao-nu')) {
      suspiciousWomen.push({
        id: p.id,
        name: p.name,
        gender: p.gender,
        categorySlug: p.categorySlug,
        image: p.images?.[0],
      });
    }
  }
});

console.log('Suspicious Men (contains female traits):', suspiciousMen.length);
if (suspiciousMen.length > 0) {
  console.log('Samples of suspicious men products:', suspiciousMen.slice(0, 10));
}

console.log('Suspicious Women (contains male path):', suspiciousWomen.length);
if (suspiciousWomen.length > 0) {
  console.log('Samples of suspicious women products:', suspiciousWomen.slice(0, 10));
}

// 2. Audit Price Distribution
const priceMap = {};
products.forEach((p) => {
  const pr = p.price;
  priceMap[pr] = (priceMap[pr] || 0) + 1;
});
console.log('Top 15 price frequencies:');
console.log(
  Object.entries(priceMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
);

// 3. Category distribution
const catMap = {};
products.forEach((p) => {
  catMap[p.categorySlug] = (catMap[p.categorySlug] || 0) + 1;
});
console.log('Categories count:', Object.keys(catMap).length);
console.log('Top categories:', Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 15));

