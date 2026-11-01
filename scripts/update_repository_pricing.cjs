const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'mocks', 'repository.ts');
let content = fs.readFileSync(targetPath, 'utf8');

const target = `  getProducts: (): Product[] => {
    const raw = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, FINAL_GENZ_CATALOGUE);
    const list = Array.isArray(raw) && raw.length > 0 ? raw : FINAL_GENZ_CATALOGUE;
    return list.map((p) => ({
      ...p,
      images: Array.isArray(p.images) ? p.images.filter(Boolean) : [],
      colors: Array.isArray(p.colors) ? p.colors : [],
      sizes: Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ['FreeSize'],
      variants: Array.isArray(p.variants) ? p.variants : [],
      price: typeof p.price === 'number' ? p.price : 0,
      originalPrice: typeof p.originalPrice === 'number' ? p.originalPrice : (p.price ?? 0),
      rating: typeof p.rating === 'number' ? p.rating : 5.0,
      reviewCount: typeof p.reviewCount === 'number' ? p.reviewCount : 0,
    }));
  },`;

const replacement = `  getProducts: (): Product[] => {
    const raw = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, FINAL_GENZ_CATALOGUE);
    const list = Array.isArray(raw) && raw.length > 0 ? raw : FINAL_GENZ_CATALOGUE;
    return list.map((p) => {
      const validImages = Array.isArray(p.images) ? p.images.filter(isValidImagePath) : [];
      const resolvedPrice = (typeof p.price === 'number' && p.price > 0)
        ? p.price
        : (typeof (p as any).suggestedPrice === 'number' && (p as any).suggestedPrice > 0)
          ? (p as any).suggestedPrice
          : (typeof p.originalPrice === 'number' && p.originalPrice > 0)
            ? p.originalPrice
            : 0;
      const resolvedOriginalPrice = (typeof p.originalPrice === 'number' && p.originalPrice > resolvedPrice)
        ? p.originalPrice
        : (resolvedPrice > 0 ? Math.round((resolvedPrice * 1.25) / 1000) * 1000 : 0);

      return {
        ...p,
        images: validImages,
        colors: Array.isArray(p.colors) ? p.colors : [],
        sizes: Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ['FreeSize'],
        variants: Array.isArray(p.variants) ? p.variants : [],
        price: resolvedPrice,
        originalPrice: resolvedOriginalPrice,
        rating: typeof p.rating === 'number' ? p.rating : 5.0,
        reviewCount: typeof p.reviewCount === 'number' ? p.reviewCount : 0,
      };
    });
  },`;

// Normalize CRLF to LF for matching
const normContent = content.replace(/\r\n/g, '\n');
const normTarget = target.replace(/\r\n/g, '\n');

if (normContent.includes(normTarget)) {
  const isCRLF = content.includes('\r\n');
  const newNormContent = normContent.replace(normTarget, replacement.replace(/\r\n/g, '\n'));
  const finalContent = isCRLF ? newNormContent.replace(/\n/g, '\r\n') : newNormContent;
  fs.writeFileSync(targetPath, finalContent, 'utf8');
  console.log('Successfully updated src/mocks/repository.ts');
} else {
  console.error('Target not found in src/mocks/repository.ts');
  process.exit(1);
}

