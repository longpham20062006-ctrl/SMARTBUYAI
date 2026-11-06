const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  // clear storage completely
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  // reload to trigger fresh initDatabase()
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const result = await page.evaluate(() => {
    const raw = localStorage.getItem('sb_products');
    const arr = raw ? JSON.parse(raw) : [];
    const w1 = arr.find(p => p.id === 'W-DRESS-001');
    const w26 = arr.find(p => p.id === 'W-DRESS-026');
    const gothic5 = arr.find(p => p.id === 'W-DRESS-GOTHIC-005');
    return {
      totalProductsInStorage: arr.length,
      w1: w1 ? { id: w1.id, name: w1.name, images: w1.images } : null,
      w26: w26 ? { id: w26.id, name: w26.name, images: w26.images } : null,
      gothic5: gothic5 ? { id: gothic5.id, name: gothic5.name, images: gothic5.images } : null,
      schema: localStorage.getItem('sb_schema_version')
    };
  });
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();

