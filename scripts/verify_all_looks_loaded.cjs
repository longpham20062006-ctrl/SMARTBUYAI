const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/1740427a-d3f3-4847-8779-e5836f36995a';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const lookbook = await page.$('#lookbook');
  if (lookbook) {
    await lookbook.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  }

  const results = {};

  for (let i = 1; i <= 4; i++) {
    const lookId = `look-${i}`;
    const sec = await page.$(`[data-testid="look-section-${lookId}"]`);
    if (!sec) {
      results[lookId] = { error: 'Section not found' };
      continue;
    }

    // Scroll into view
    await sec.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);

    // Wait for images to load inside this section
    await page.waitForFunction(
      (id) => {
        const s = document.querySelector(`[data-testid="look-section-${id}"]`);
        if (!s) return false;
        const imgs = Array.from(s.querySelectorAll('[data-testid="home-product-card"] img'));
        if (imgs.length < 4) return false;
        return imgs.every((img) => img.complete && img.naturalWidth > 0);
      },
      lookId,
      { timeout: 7000 }
    ).catch(e => console.log(`Wait timeout for images in ${lookId}: ${e.message}`));

    // Evaluate cards
    const data = await sec.evaluate((el) => {
      const cards = Array.from(el.querySelectorAll('[data-testid="home-product-card"]'));
      const modelImg = el.querySelector('img');
      return {
        modelImgSrc: modelImg ? modelImg.getAttribute('src') : null,
        modelImgNaturalWidth: modelImg ? modelImg.naturalWidth : 0,
        cards: cards.map(c => {
          const img = c.querySelector('img');
          const title = c.querySelector('h3')?.innerText;
          const button = c.querySelector('button')?.innerText;
          return {
            title,
            button,
            src: img ? img.getAttribute('src') : null,
            loaded: img ? img.complete : false,
            naturalWidth: img ? img.naturalWidth : 0,
            naturalHeight: img ? img.naturalHeight : 0,
          };
        })
      };
    });

    results[lookId] = data;

    // Take screenshot of each look
    const shotPath = path.join(ARTIFACT_DIR, `screenshot_${lookId}_verified.png`);
    await sec.screenshot({ path: shotPath });
    console.log(`Saved screenshot for ${lookId} -> ${shotPath}`);
  }

  console.log('Results summary:');
  for (const [id, res] of Object.entries(results)) {
    console.log(`\n=== ${id.toUpperCase()} ===`);
    console.log(`Model Img: ${res.modelImgSrc} (naturalWidth: ${res.modelImgNaturalWidth})`);
    console.log(`Products count: ${res.cards?.length}`);
    res.cards?.forEach((c, idx) => {
      console.log(`  [${idx + 1}] ${c.title} -> loaded: ${c.loaded}, naturalWidth: ${c.naturalWidth}x${c.naturalHeight}, button: "${c.button}"`);
    });
  }

  await browser.close();
})();

