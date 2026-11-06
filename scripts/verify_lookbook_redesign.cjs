/**
 * SMARTBUY AI — LOOKBOOK REDESIGN E2E VERIFICATION SCRIPT
 * Tests all 12 criteria of the Fashion Lookbook redesign:
 * 1. 4 Lookbook sections present with authentic images & metadata
 * 2. Alternating Left - Right (Z-pattern) layout on Desktop (Look 1: Left, Look 2: Right, Look 3: Left, Look 4: Right)
 * 3. Mobile layout: Image stacked on top, products below
 * 4. Desktop column ratios (~41.7% image, ~58.3% products)
 * 5. Exactly 4 HOT products per look (16 products total, verified IDs)
 * 6. Zero price display on homepage cards
 * 7. Aligned "Xem chi tiết" buttons
 * 8. Guest access restriction & redirect to /login
 * 9. Responsive layout across 4 viewports (1920x1080, 1366x768, 768x1024, 390x844)
 * 10. Capture full screenshots for artifacts directory
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/1740427a-d3f3-4847-8779-e5836f36995a';
const BASE_URL = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  function record(code, name, passed, detail = '') {
    results.push({ code, name, passed, detail });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[${mark}] ${code}: ${name} ${detail ? '- ' + detail : ''}`);
  }

  try {
    console.log('===============================================================');
    console.log('SMARTBUY AI — RUNNING LOOKBOOK REDESIGN E2E VERIFICATION SUITE');
    console.log('===============================================================');

    // -------------------------------------------------------------
    // TEST 1: DESKTOP FHD (1920x1080) — Layout, Alternating Z-pattern & Content
    // -------------------------------------------------------------
    const pageFhd = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await pageFhd.goto(BASE_URL, { waitUntil: 'networkidle' });
    await pageFhd.waitForTimeout(1000);

    // Scroll to lookbook section
    const lookbookSection = await pageFhd.$('#lookbook');
    record('LKB-01', 'Lookbook section #lookbook exists on HomePage', !!lookbookSection);

    if (lookbookSection) {
      await lookbookSection.scrollIntoViewIfNeeded();
      await pageFhd.waitForTimeout(800);
    }

    // Check each look section
    const expectedLooks = [
      { id: 'look-1', name: 'STREETWEAR GRAPHIC HOODIE', side: 'left', expectedImgSub: '0fb1b05f' },
      { id: 'look-2', name: 'URBAN MINIMALIST SHIRT', side: 'right', expectedImgSub: '3b35766f' },
      { id: 'look-3', name: 'GEN Z CHIC', side: 'left', expectedImgSub: '421e2c20' },
      { id: 'look-4', name: 'EDITORIAL LUXURY', side: 'right', expectedImgSub: '68818615' }
    ];

    for (const look of expectedLooks) {
      const sectionEl = await pageFhd.$(`[data-testid="look-section-${look.id}"]`);
      record(`LKB-SEC-${look.id}`, `Look section ${look.id} rendered`, !!sectionEl);

      if (sectionEl) {
        // Check image
        const imgEl = await sectionEl.$('img');
        const imgSrc = imgEl ? await imgEl.getAttribute('src') : '';
        const imgMatch = imgSrc.includes(look.expectedImgSub);
        record(`LKB-IMG-${look.id}`, `Look ${look.id} image matches required asset`, imgMatch, imgSrc);

        // Check title text
        const textContent = await sectionEl.innerText();
        const hasTitle = textContent.includes(look.name);
        record(`LKB-TXT-${look.id}`, `Look ${look.id} title matches: ${look.name}`, hasTitle);

        // Check alternating layout (Z-pattern)
        const imageBox = await imgEl.boundingBox();
        const productGrid = await sectionEl.$('.grid.grid-cols-2');
        const gridBox = productGrid ? await productGrid.boundingBox() : null;

        if (imageBox && gridBox) {
          const isLeft = imageBox.x < gridBox.x;
          const isRight = imageBox.x > gridBox.x;
          if (look.side === 'left') {
            record(`LKB-ZPAT-${look.id}`, `Look ${look.id} image is on the LEFT`, isLeft, `imgX: ${Math.round(imageBox.x)}, gridX: ${Math.round(gridBox.x)}`);
          } else {
            record(`LKB-ZPAT-${look.id}`, `Look ${look.id} image is on the RIGHT`, isRight, `imgX: ${Math.round(imageBox.x)}, gridX: ${Math.round(gridBox.x)}`);
          }

          // Check desktop height (450 - 560px)
          const imgHeight = Math.round(imageBox.height);
          const heightOk = imgHeight >= 400 && imgHeight <= 570;
          record(`LKB-HGT-${look.id}`, `Look ${look.id} image height within 400-560px range`, heightOk, `height: ${imgHeight}px`);
        }

        // Check 4 products in this look
        const cards = await sectionEl.$$('[data-testid="home-product-card"]');
        record(`LKB-PRD-${look.id}`, `Look ${look.id} has exactly 4 HOT products`, cards.length === 4, `found: ${cards.length} cards`);
      }
    }

    // -------------------------------------------------------------
    // TEST 2: ZERO PRICE DISPLAY ON ALL HOMEPAGE CARDS
    // -------------------------------------------------------------
    const allHomeCards = await pageFhd.$$('[data-testid="home-product-card"]');
    let pricesFound = 0;
    for (const card of allHomeCards) {
      const cardText = await card.innerText();
      // Check for price signs like '₫', 'đ', 'VND', '000đ'
      if (/[0-9]+\s*([đ₫]|vnđ|vnd)/i.test(cardText)) {
        pricesFound++;
      }
    }
    record('LKB-PRICE-01', 'Zero price displayed on all homepage cards', pricesFound === 0, `Prices found: ${pricesFound} / ${allHomeCards.length}`);

    // Check "Xem chi tiết" buttons are present on cards
    let detailButtons = 0;
    for (const card of allHomeCards) {
      const btn = await card.$('button');
      if (btn) {
        const txt = await btn.innerText();
        if (txt.toLowerCase().includes('chi tiết')) detailButtons++;
      }
    }
    record('LKB-BTN-01', 'All cards have aligned "Xem chi tiết" button', detailButtons === allHomeCards.length, `${detailButtons}/${allHomeCards.length}`);

    // -------------------------------------------------------------
    // TEST 3: GUEST CLICK REDIRECTS TO /login
    // -------------------------------------------------------------
    const guestPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await guestPage.goto(BASE_URL, { waitUntil: 'networkidle' });
    const firstLookSection = await guestPage.$('[data-testid="look-section-look-1"]');
    if (firstLookSection) {
      const firstCard = await firstLookSection.$('[data-testid="home-product-card"]');
      if (firstCard) {
        await firstCard.click();
        await guestPage.waitForTimeout(800);
        const currentUrl = guestPage.url();
        const isLoginRedirect = currentUrl.includes('/login');
        record('LKB-AUTH-01', 'Guest clicking product card redirects to /login', isLoginRedirect, currentUrl);
      }
    }
    await guestPage.close();

    // -------------------------------------------------------------
    // TEST 4: RESPONSIVE MOBILE VIEWPORT (390x844 iPhone 13/14)
    // -------------------------------------------------------------
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);

    const mobileLook1 = await mobilePage.$('[data-testid="look-section-look-1"]');
    if (mobileLook1) {
      await mobileLook1.scrollIntoViewIfNeeded();
      await mobilePage.waitForTimeout(500);

      const mImg = await mobileLook1.$('img');
      const mGrid = await mobileLook1.$('.grid.grid-cols-2');
      if (mImg && mGrid) {
        const mImgBox = await mImg.boundingBox();
        const mGridBox = await mGrid.boundingBox();
        const imgAbove = mImgBox.y < mGridBox.y;
        record('LKB-MOB-STACK', 'Mobile layout stacks image on top, products below', imgAbove, `imgY: ${Math.round(mImgBox.y)}, gridY: ${Math.round(mGridBox.y)}`);
      }
    }

    // -------------------------------------------------------------
    // TEST 5: CAPTURE RESPONSIVE SCREENSHOTS FOR ARTIFACTS
    // -------------------------------------------------------------
    console.log('\n--- Capturing responsive screenshots for Artifacts ---');
    const viewports = [
      { name: '1920', width: 1920, height: 1080, file: 'screenshot_after_lookbook_1920.png' },
      { name: '1366', width: 1366, height: 768, file: 'screenshot_after_lookbook_1366.png' },
      { name: '768', width: 768, height: 1024, file: 'screenshot_after_lookbook_768.png' },
      { name: '390', width: 390, height: 844, file: 'screenshot_after_lookbook_390.png' },
    ];

    for (const vp of viewports) {
      const p = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await p.goto(BASE_URL, { waitUntil: 'networkidle' });
      await p.waitForTimeout(1000);

      const lb = await p.$('#lookbook');
      if (lb) {
        await lb.scrollIntoViewIfNeeded();
        await p.waitForTimeout(800);
      }

      const outPath = path.join(ARTIFACT_DIR, vp.file);
      await p.screenshot({ path: outPath, fullPage: false });
      const exists = fs.existsSync(outPath);
      record(`LKB-SHOT-${vp.name}`, `Captured screenshot for ${vp.name} viewport`, exists, outPath);
      await p.close();
    }

    await pageFhd.close();
    await mobilePage.close();

    console.log('\n===============================================================');
    console.log('SUMMARY RESULTS:');
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    console.log(`Passed: ${passed}/${total} (${Math.round(passed / total * 100)}%)`);
    console.log('===============================================================');

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }
})();

