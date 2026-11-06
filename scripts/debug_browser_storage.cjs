const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  const debugInfo = await page.evaluate(() => {
    // Check what is in localStorage sb_products
    const raw = localStorage.getItem('sb_products');
    let parsedCount = 0;
    let foundW1 = null;
    if (raw) {
      try {
        const arr = JSON.parse(raw);
        parsedCount = arr.length;
        foundW1 = arr.find(p => p.id === 'W-DRESS-001');
      } catch (e) {}
    }
    const sec = document.querySelector('[data-testid="look-section-look-3"]');
    return {
      localStorageSchema: localStorage.getItem('sb_schema_version'),
      productsInStorage: parsedCount,
      foundW1InStorage: foundW1 ? { id: foundW1.id, name: foundW1.name, images: foundW1.images } : null,
      secExists: !!sec,
      secHtml: sec ? sec.innerHTML.substring(0, 500) : null
    };
  });
  console.log(JSON.stringify(debugInfo, null, 2));
  await browser.close();
})();

