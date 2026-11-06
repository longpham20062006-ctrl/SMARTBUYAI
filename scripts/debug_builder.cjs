const fs = require('fs');

// We can read genzCatalogBuilder.ts and see what it does
const content = fs.readFileSync('src/mocks/genzCatalogBuilder.ts', 'utf8');

// Find all occurrences of W-DRESS-001 or vay_optimized or importedProducts in genzCatalogBuilder.ts
console.log('Does genzCatalogBuilder have vay_optimized?', content.includes('vay_optimized'));
console.log('Does genzCatalogBuilder have 278?', content.includes('278'));
console.log('Does genzCatalogBuilder have ALL_GENZ_PRODUCTS?', content.includes('ALL_GENZ_PRODUCTS'));

// What does ALL_GENZ_PRODUCTS have?
const allGenz = fs.readFileSync('src/mocks/allGenzProducts.ts', 'utf8');
console.log('Does allGenzProducts have vay_optimized?', allGenz.includes('vay_optimized'));

