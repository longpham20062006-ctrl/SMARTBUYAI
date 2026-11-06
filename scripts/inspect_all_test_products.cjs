const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  const testProducts = await page.evaluate(() => {
    const raw = localStorage.getItem('sb_products');
    let products = [];
    if (raw) {
      try { products = JSON.parse(raw); } catch (e) {}
    }

    const testIds = [
      'W-DRESS-001', 'W-DRESS-002', 'W-DRESS-003', 'W-DRESS-007',
      'W-DRESS-GOTHIC-005', 'W-DRESS-GOTHIC-001', 'W-DRESS-GOTHIC-007', 'W-DRESS-GOTHIC-002',
      'HOODIE-001', 'HOODIE-002', 'JACKET-002', 'JACKET-004',
      'SHIRT-001', 'SHIRT-003', 'POLO-001', 'POLO-003',
      'W-CROPTOP-001', 'W-CROPTOP-002', 'W-CROPTOP-003', 'W-CROPTOP-005'
    ];

    return testIds.map(id => {
      const p = products.find(prod => prod.id.toLowerCase() === id.toLowerCase());
      return {
        id,
        found: !!p,
        name: p?.name,
        price: p?.price,
        isActive: p?.isActive,
        images: p?.images,
        badge: p?.badge,
        categorySlug: p?.categorySlug,
        gender: p?.gender
      };
    });
  });

  console.log(JSON.stringify(testProducts, null, 2));
  await browser.close();
})();

