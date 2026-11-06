const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  const looksInfo = await page.evaluate(() => {
    const results = {};
    for (let i = 1; i <= 4; i++) {
      const id = 'look-' + i;
      const sec = document.querySelector(`[data-testid="look-section-${id}"]`);
      if (!sec) {
        results[id] = { exists: false };
        continue;
      }
      const cards = Array.from(sec.querySelectorAll('[data-testid="home-product-card"]'));
      const cardDetails = cards.map(c => {
        const title = c.querySelector('h3')?.innerText;
        const img = c.querySelector('img')?.getAttribute('src');
        const imgLoaded = c.querySelector('img')?.complete;
        const naturalWidth = c.querySelector('img')?.naturalWidth;
        const isNullOrEmpty = c.innerText.trim();
        return { title, img, imgLoaded, naturalWidth, isNullOrEmpty };
      });
      const grid = sec.querySelector('.grid.grid-cols-2');
      results[id] = {
        exists: true,
        cardCount: cards.length,
        gridChildCount: grid ? grid.children.length : 0,
        gridHtml: grid ? grid.innerHTML : null,
        cardDetails
      };
    }
    return results;
  });

  console.log(JSON.stringify(looksInfo, null, 2));
  await browser.close();
})();

