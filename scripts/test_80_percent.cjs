const fs = require('fs');

const products = JSON.parse(fs.readFileSync('src/mocks/importedProducts.json', 'utf8'));
console.log('Total catalog products:', products.length);

function isDressOrSkirt(product) {
  if (product.gender !== 'nu') return false;
  const cat = (product.categorySlug || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  return (
    cat === 'vay' ||
    cat === 'nu-vay' ||
    cat.includes('vay') ||
    name.includes('váy') ||
    name.includes('đầm')
  );
}

function getDiscoveryOrderedProducts(products, isDefaultDiscoveryMode) {
  if (!isDefaultDiscoveryMode || products.length === 0) return products;

  const dresses = [];
  const others = [];

  for (const p of products) {
    if (isDressOrSkirt(p)) {
      dresses.push(p);
    } else {
      others.push(p);
    }
  }

  if (dresses.length === 0 || others.length === 0) return products;

  const result = [];
  const seenIds = new Set();
  let dIdx = 0;
  let oIdx = 0;

  while (dIdx < dresses.length && oIdx < others.length) {
    for (let i = 0; i < 4 && dIdx < dresses.length; i++) {
      const d = dresses[dIdx++];
      if (!seenIds.has(d.id)) {
        seenIds.add(d.id);
        result.push(d);
      }
    }
    if (oIdx < others.length) {
      const o = others[oIdx++];
      if (!seenIds.has(o.id)) {
        seenIds.add(o.id);
        result.push(o);
      }
    }
  }

  while (dIdx < dresses.length) {
    const d = dresses[dIdx++];
    if (!seenIds.has(d.id)) {
      seenIds.add(d.id);
      result.push(d);
    }
  }

  while (oIdx < others.length) {
    const o = others[oIdx++];
    if (!seenIds.has(o.id)) {
      seenIds.add(o.id);
      result.push(o);
    }
  }

  return result;
}

const ordered = getDiscoveryOrderedProducts(products, true);
console.log('Ordered list length:', ordered.length);

const first20 = ordered.slice(0, 20);
const dressCount = first20.filter(isDressOrSkirt).length;
const otherCount = 20 - dressCount;
console.log(`First 20 items: ${dressCount} Dresses (${(dressCount / 20) * 100}%) | ${otherCount} Other items (${(otherCount / 20) * 100}%)`);

// Verify interleaving
console.log('Sample pattern (first 10 items):');
first20.slice(0, 10).forEach((p, idx) => {
  console.log(`  [${idx + 1}] ${isDressOrSkirt(p) ? '👗 DRESS' : '👕 OTHER'}: ${p.name}`);
});

// Check duplicates
const idSet = new Set(ordered.map(p => p.id));
console.log('Unique ID check:', idSet.size === ordered.length ? 'PASS (No duplicates)' : 'FAIL');
console.log('Catalog preservation check:', ordered.length === products.length ? 'PASS (All 273 products preserved)' : 'FAIL');
