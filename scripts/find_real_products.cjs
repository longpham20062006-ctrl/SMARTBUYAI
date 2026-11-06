const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  const catalogSummary = await page.evaluate(() => {
    // We can access products via window or inspect DOM or test productService
    // Let's see what products are in localStorage or window
    const raw = localStorage.getItem('sb_products');
    let products = [];
    if (raw) {
      try { products = JSON.parse(raw); } catch (e) {}
    }
    
    // Look 4 target: dresses (vay, dam, luxury, etc)
    const dresses = products.filter(p => 
      p.categorySlug === 'vay' || 
      p.categorySlug === 'dam' || 
      p.categorySlug?.includes('vay') ||
      p.name?.toLowerCase().includes('váy') ||
      p.name?.toLowerCase().includes('đầm')
    );

    // Look 3 target: croptop, chic, nu
    const womenChic = products.filter(p =>
      p.gender === 'nu' && (
        p.categorySlug === 'ao-croptop' ||
        p.categorySlug === 'ao-hai-day' ||
        p.name?.toLowerCase().includes('croptop') ||
        p.name?.toLowerCase().includes('hai dây')
      )
    );

    // Look 1 target: streetwear, hoodie, bomber
    const streetwear = products.filter(p =>
      p.categorySlug === 'ao-hoodie' ||
      p.categorySlug === 'ao-khoac' ||
      p.name?.toLowerCase().includes('hoodie') ||
      p.name?.toLowerCase().includes('bomber')
    );

    // Look 2 target: shirt, polo, casual
    const casual = products.filter(p =>
      p.categorySlug === 'ao-so-mi' ||
      p.categorySlug === 'ao-polo' ||
      p.name?.toLowerCase().includes('sơ mi') ||
      p.name?.toLowerCase().includes('polo')
    );

    return {
      totalInStorage: products.length,
      sampleDresses: dresses.slice(0, 10).map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        categorySlug: p.categorySlug,
        gender: p.gender,
        images: p.images,
        badge: p.badge,
        isFeatured: p.isFeatured
      })),
      sampleChic: womenChic.slice(0, 5).map(p => ({ id: p.id, name: p.name, images: p.images })),
      sampleStreetwear: streetwear.slice(0, 5).map(p => ({ id: p.id, name: p.name, images: p.images })),
      sampleCasual: casual.slice(0, 5).map(p => ({ id: p.id, name: p.name, images: p.images }))
    };
  });

  console.log(JSON.stringify(catalogSummary, null, 2));
  await browser.close();
})();

