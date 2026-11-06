const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  const result = await page.evaluate(() => {
    const raw = localStorage.getItem('sb_products');
    let products = [];
    if (raw) {
      try { products = JSON.parse(raw); } catch (e) {}
    }
    const ids = ['W-DRESS-GOTHIC-005', 'W-DRESS-GOTHIC-001', 'W-DRESS-GOTHIC-007', 'W-DRESS-GOTHIC-002'];
    return ids.map(id => {
      const p = products.find(item => item.id.toLowerCase() === id.toLowerCase());
      return {
        id,
        found: !!p,
        name: p?.name,
        price: p?.price,
        images: p?.images
      };
    });
  });

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();

