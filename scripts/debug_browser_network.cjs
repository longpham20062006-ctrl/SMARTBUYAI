const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('request', req => {
    if (req.url().includes('products') || req.url().includes('api')) {
      console.log('REQUEST:', req.method(), req.url());
    }
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const storageDump = await page.evaluate(() => {
    const p = localStorage.getItem('sb_products');
    return {
      schema: localStorage.getItem('sb_schema_version'),
      pLength: p ? JSON.parse(p).length : 0,
    };
  });
  console.log('STORAGE DUMP:', storageDump);

  await browser.close();
})();

