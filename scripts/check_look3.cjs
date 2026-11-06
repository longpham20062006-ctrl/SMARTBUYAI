const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://localhost:5173');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const sec = await page.$('[data-testid="look-section-look-3"]');
  if (sec) {
    await sec.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
  }
  const count = await page.evaluate(() => {
    const s = document.querySelector('[data-testid="look-section-look-3"]');
    return s ? s.querySelectorAll('[data-testid="home-product-card"]').length : 0;
  });
  console.log('Count in look-3 after clear:', count);
  await browser.close();
})();
