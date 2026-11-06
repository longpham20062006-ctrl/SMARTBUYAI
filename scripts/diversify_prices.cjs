const fs = require('fs');
const path = require('path');

const inputPath = path.resolve('D:/SMARTBUYAI/src/mocks/importedProducts.json');
const backendPath = path.resolve('D:/SMARTBUYAI/backend/src/main/resources/data/importedProducts.json');

const products = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// Natural deterministic pseudo-random price variation based on string hash
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Pricing tiers
const accessoryPrices = [39000, 48000, 59000, 68000, 75000, 84000, 95000, 115000];
const teeCroptopPrices = [135000, 148000, 162000, 175000, 189000, 195000, 215000, 228000, 245000];
const shirtSkirtShortPrices = [218000, 235000, 248000, 265000, 278000, 295000, 315000];
const jeansPantsPrices = [285000, 298000, 315000, 338000, 355000, 372000, 385000];
const dressPrices = [268000, 285000, 315000, 338000, 355000, 378000, 395000, 425000, 465000];
const jacketHoodiePrices = [325000, 348000, 368000, 395000, 415000, 438000, 468000, 495000, 525000];
const setComboPrices = [345000, 368000, 385000, 415000, 445000, 475000, 515000];

let updatedCount = 0;
let zeroFixedCount = 0;

for (const p of products) {
  const hash = hashString(p.id || p.name);
  const nameLower = (p.name || '').toLowerCase();
  const cat = (p.categorySlug || '').toLowerCase();

  let targetPrice = p.price;
  const isZero = !p.price || p.price === 0;

  if (isZero || p.price % 10000 === 9000 || p.price % 10000 === 0) {
    // Diversify price according to category
    if (cat === 'phu-kien' || nameLower.includes('nón') || nameLower.includes('mũ') || nameLower.includes('tất') || nameLower.includes('kẹp') || nameLower.includes('túi tote')) {
      targetPrice = accessoryPrices[hash % accessoryPrices.length];
    } else if (cat === 'do-bo' || cat === 'do-doi' || p.isSetItem) {
      targetPrice = setComboPrices[hash % setComboPrices.length];
    } else if (cat === 'ao-khoac' || cat === 'ao-hoodie' || cat === 'ao-len' || nameLower.includes('khoác') || nameLower.includes('hoodie') || nameLower.includes('bomber') || nameLower.includes('blazer')) {
      targetPrice = jacketHoodiePrices[hash % jacketHoodiePrices.length];
    } else if (cat === 'vay' || nameLower.includes('váy') || nameLower.includes('đầm')) {
      targetPrice = dressPrices[hash % dressPrices.length];
    } else if (cat === 'quan-jeans' || cat === 'quan' || nameLower.includes('jeans') || nameLower.includes('kaki') || nameLower.includes('quần dài') || nameLower.includes('parachute') || nameLower.includes('cargo')) {
      targetPrice = jeansPantsPrices[hash % jeansPantsPrices.length];
    } else if (cat === 'so-mi' || cat === 'ao-polo' || cat === 'chan-vay' || cat === 'quan-short' || nameLower.includes('sơ mi') || nameLower.includes('polo') || nameLower.includes('chân váy') || nameLower.includes('short')) {
      targetPrice = shirtSkirtShortPrices[hash % shirtSkirtShortPrices.length];
    } else {
      // Default tees & tops
      targetPrice = teeCroptopPrices[hash % teeCroptopPrices.length];
    }
  }

  if (isZero) zeroFixedCount++;
  if (targetPrice !== p.price) updatedCount++;

  p.price = targetPrice;
  p.originalPrice = Math.round((targetPrice * 1.25) / 1000) * 1000 - 1000; // e.g. 175k -> 219k
  if (p.originalPrice <= p.price) {
    p.originalPrice = p.price + 40000;
  }

  // Update variants
  if (Array.isArray(p.variants)) {
    for (const v of p.variants) {
      v.price = p.price;
      v.originalPrice = p.originalPrice;
    }
  }
}

fs.writeFileSync(inputPath, JSON.stringify(products, null, 2), 'utf8');
if (fs.existsSync(backendPath)) {
  fs.writeFileSync(backendPath, JSON.stringify(products, null, 2), 'utf8');
}

console.log(`Successfully diversified prices for ${products.length} products!`);
console.log(`Fixed zero-price items: ${zeroFixedCount}`);
console.log(`Updated items: ${updatedCount}`);

