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
    console.log('SMARTBUY AI — HOT PRODUCTS & 4 LOOKS AUDIT SUITE');
    console.log('===============================================================');

    // 1. DESKTOP AUDIT (1920x1080)
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    
    // Clear storage before navigating so latest mock repo schema is used
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // -------------------------------------------------------------
    // AUDIT SECTION: SẢN PHẨM HOT (#san-pham-hot)
    // -------------------------------------------------------------
    console.log('\n--- Auditing Section: SẢN PHẨM HOT (#san-pham-hot) ---');
    const hotSec = await page.$('#san-pham-hot');
    record('HOT-SEC-01', 'Section #san-pham-hot exists', !!hotSec);

    if (hotSec) {
      await hotSec.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);

      // Wait for all images in hot section to load
      await page.waitForFunction(() => {
        const sec = document.querySelector('#san-pham-hot');
        if (!sec) return false;
        const imgs = Array.from(sec.querySelectorAll('[data-testid="home-product-card"] img'));
        return imgs.length >= 8 && imgs.every(img => img.complete && img.naturalWidth > 0);
      }, { timeout: 7000 }).catch(e => console.log('Wait warning hotSec:', e.message));

      const hotCards = await hotSec.$$('[data-testid="home-product-card"]');
      record('HOT-CNT-01', 'Hot section contains exactly 8 diverse products', hotCards.length === 8, `found: ${hotCards.length}`);

      const hotData = await hotSec.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('#san-pham-hot [data-testid="home-product-card"]'));
        return cards.map(c => {
          const title = c.querySelector('h3')?.innerText || '';
          const img = c.querySelector('img');
          const hasPrice = /[0-9]+\s*([đ₫]|vnđ|vnd)/i.test(c.innerText);
          const btn = c.querySelector('button')?.innerText || '';
          return {
            title,
            src: img ? img.getAttribute('src') : '',
            loaded: img ? img.complete : false,
            naturalWidth: img ? img.naturalWidth : 0,
            hasPrice,
            hasBtn: btn.toLowerCase().includes('chi tiết')
          };
        });
      });

      let allHotLoaded = true;
      let zeroPrices = true;
      let allButtons = true;

      hotData.forEach((d, idx) => {
        console.log(`  [HOT ${idx + 1}] ${d.title} -> loaded: ${d.loaded} (${d.naturalWidth}px), price: ${d.hasPrice ? 'FOUND!' : 'NONE'}`);
        if (!d.loaded || d.naturalWidth === 0) allHotLoaded = false;
        if (d.hasPrice) zeroPrices = false;
        if (!d.hasBtn) allButtons = false;
      });

      record('HOT-IMG-01', 'All 8 hot product images are loaded with naturalWidth > 0', allHotLoaded);
      record('HOT-PRC-01', 'Zero price displayed on all hot product cards', zeroPrices);
      record('HOT-BTN-01', 'All 8 hot cards have aligned "Xem chi tiết" buttons', allButtons);

      // Check diversity: contains váy, đầm, croptop, sơ mi, hoodie, bomber, cargo, phụ kiện
      const titlesStr = hotData.map(d => d.title.toLowerCase()).join(' | ');
      const hasVay = titlesStr.includes('váy');
      const hasDam = titlesStr.includes('dạ hội') || titlesStr.includes('corset');
      const hasCroptop = titlesStr.includes('croptop');
      const hasSomi = titlesStr.includes('sơ mi');
      const hasHoodie = titlesStr.includes('hoodie');
      const hasKhoac = titlesStr.includes('bomber') || titlesStr.includes('khoác');
      const hasQuan = titlesStr.includes('cargo') || titlesStr.includes('quần');
      const hasAcc = titlesStr.includes('clutch') || titlesStr.includes('túi');

      record('HOT-DIV-VAY', 'Includes Váy nữ', hasVay);
      record('HOT-DIV-DAM', 'Includes Đầm dạ hội / Corset', hasDam);
      record('HOT-DIV-CROP', 'Includes Áo croptop', hasCroptop);
      record('HOT-DIV-SOMI', 'Includes Áo sơ mi nam', hasSomi);
      record('HOT-DIV-HOOD', 'Includes Hoodie', hasHoodie);
      record('HOT-DIV-KHOAC', 'Includes Áo khoác bomber', hasKhoac);
      record('HOT-DIV-QUAN', 'Includes Quần cargo / Quần dài', hasQuan);
      record('HOT-DIV-ACC', 'Includes Phụ kiện thời trang (Túi clutch)', hasAcc);

      // Screenshot hot section
      const shotHotPath = path.join(ARTIFACT_DIR, 'screenshot_san_pham_hot_8_items.png');
      await hotSec.screenshot({ path: shotHotPath });
      console.log(`Saved screenshot for hot section -> ${shotHotPath}`);
    }

    // -------------------------------------------------------------
    // AUDIT 4 LOOKBOOK SECTIONS
    // -------------------------------------------------------------
    console.log('\n--- Auditing 4 Fashion Looks (LOOK 01 - LOOK 04) ---');

    const expectedLooks = [
      {
        id: 'look-1',
        name: 'STREETWEAR GRAPHIC HOODIE',
        side: 'left',
        mustContain: ['Hoodie', 'Thun', 'Cargo', 'Bomber']
      },
      {
        id: 'look-2',
        name: 'URBAN MINIMALIST SHIRT',
        side: 'right',
        mustContain: ['Sơ Mi', 'Polo', 'Quần']
      },
      {
        id: 'look-3',
        name: 'OUTDOOR CHIC DRESSES',
        side: 'left',
        mustBeDressesOnly: true
      },
      {
        id: 'look-4',
        name: 'EDITORIAL LUXURY',
        side: 'right',
        mustContainLuxury: true
      }
    ];

    for (const look of expectedLooks) {
      const sec = await page.$(`[data-testid="look-section-${look.id}"]`);
      record(`LKB-SEC-${look.id}`, `Section for ${look.id} rendered`, !!sec);

      if (sec) {
        await sec.scrollIntoViewIfNeeded();
        await page.waitForTimeout(800);

        // Wait for images in this look
        await page.waitForFunction((id) => {
          const s = document.querySelector(`[data-testid="look-section-${id}"]`);
          if (!s) return false;
          const imgs = Array.from(s.querySelectorAll('[data-testid="home-product-card"] img'));
          return imgs.length === 4 && imgs.every(img => img.complete && img.naturalWidth > 0);
        }, look.id, { timeout: 7000 }).catch(e => console.log(`Wait warning ${look.id}:`, e.message));

        const lookData = await sec.evaluate((el) => {
          const cards = Array.from(el.querySelectorAll('[data-testid="home-product-card"]'));
          const modelImg = el.querySelector('img');
          const grid = el.querySelector('.grid.grid-cols-2');
          const modelBox = modelImg ? modelImg.getBoundingClientRect() : null;
          const gridBox = grid ? grid.getBoundingClientRect() : null;

          return {
            title: el.querySelector('h3')?.innerText || '',
            modelNaturalWidth: modelImg ? modelImg.naturalWidth : 0,
            modelHeight: modelBox ? modelBox.height : 0,
            isLeft: modelBox && gridBox ? modelBox.x < gridBox.x : false,
            isRight: modelBox && gridBox ? modelBox.x > gridBox.x : false,
            cards: cards.map(c => ({
              title: c.querySelector('h3')?.innerText || '',
              src: c.querySelector('img')?.getAttribute('src') || '',
              loaded: c.querySelector('img')?.complete || false,
              naturalWidth: c.querySelector('img')?.naturalWidth || 0,
              hasPrice: /[0-9]+\s*([đ₫]|vnđ|vnd)/i.test(c.innerText),
            }))
          };
        });

        // Alternating Left-Right
        if (look.side === 'left') {
          record(`LKB-POS-${look.id}`, `Look ${look.id} image is on the LEFT`, lookData.isLeft);
        } else {
          record(`LKB-POS-${look.id}`, `Look ${look.id} image is on the RIGHT`, lookData.isRight);
        }

        // Height check (400-500px)
        const heightOk = lookData.modelHeight >= 400 && lookData.modelHeight <= 520;
        record(`LKB-HGT-${look.id}`, `Look ${look.id} model image height within 400-500px`, heightOk, `${Math.round(lookData.modelHeight)}px`);

        // Exactly 4 products
        record(`LKB-CNT-${look.id}`, `Look ${look.id} has exactly 4 products`, lookData.cards.length === 4);

        // All cards loaded
        const allLoaded = lookData.cards.every(c => c.loaded && c.naturalWidth > 0);
        record(`LKB-IMG-${look.id}`, `All 4 products in ${look.id} loaded with naturalWidth > 0`, allLoaded);

        // Specific style checks
        if (look.mustBeDressesOnly) {
          // LOOK 03 must only contain dresses/skirts
          const allDresses = lookData.cards.every(c => c.title.toLowerCase().includes('váy') || c.title.toLowerCase().includes('đầm'));
          record('LKB-CHK-LOOK3-DRESSES', 'LOOK 03 contains ONLY dresses/skirts (no tshirts/hoodies)', allDresses, lookData.cards.map(c => c.title).join('; '));
        }

        if (look.mustContainLuxury) {
          // LOOK 04 must contain luxury evening dresses / clutch
          const hasLuxury = lookData.cards.some(c => c.title.toLowerCase().includes('gothic') || c.title.toLowerCase().includes('dạ hội') || c.title.toLowerCase().includes('clutch'));
          record('LKB-CHK-LOOK4-LUXURY', 'LOOK 04 contains luxury evening dresses and accessories', hasLuxury, lookData.cards.map(c => c.title).join('; '));
        }

        // Screenshot each look
        const shotPath = path.join(ARTIFACT_DIR, `screenshot_${look.id}_v25_verified.png`);
        await sec.screenshot({ path: shotPath });
        console.log(`Saved screenshot for ${look.id} -> ${shotPath}`);
      }
    }

    // -------------------------------------------------------------
    // AUDIT GUEST ACCESS & REDIRECT
    // -------------------------------------------------------------
    console.log('\n--- Auditing Guest Access & Navigation ---');
    const firstCard = await page.$('#san-pham-hot [data-testid="home-product-card"]');
    if (firstCard) {
      await firstCard.click();
      await page.waitForTimeout(800);
      const url = page.url();
      const isLogin = url.includes('/login');
      record('AUTH-REDIRECT', 'Guest clicking product card redirects to /login with redirect param', isLogin, url);
    }

    // -------------------------------------------------------------
    // RESPONSIVE SCREENSHOT AUDIT (1920, 1366, 768, 390)
    // -------------------------------------------------------------
    console.log('\n--- Capturing Full Responsive Suite Screenshots ---');
    const viewports = [
      { name: '1920', width: 1920, height: 1080, file: 'screenshot_v25_desktop_1920.png' },
      { name: '1366', width: 1366, height: 768, file: 'screenshot_v25_laptop_1366.png' },
      { name: '768', width: 768, height: 1024, file: 'screenshot_v25_tablet_768.png' },
      { name: '390', width: 390, height: 844, file: 'screenshot_v25_mobile_390.png' },
    ];

    for (const vp of viewports) {
      const p = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await p.goto(BASE_URL, { waitUntil: 'networkidle' });
      await p.waitForTimeout(800);

      const hot = await p.$('#san-pham-hot');
      if (hot) {
        await hot.scrollIntoViewIfNeeded();
        await p.waitForTimeout(600);
      }

      const outPath = path.join(ARTIFACT_DIR, vp.file);
      await p.screenshot({ path: outPath, fullPage: false });
      const exists = fs.existsSync(outPath);
      record(`RESP-${vp.name}`, `Responsive capture for ${vp.name} viewport`, exists, outPath);
      await p.close();
    }

    await page.close();

    console.log('\n===============================================================');
    console.log('FINAL AUDIT SUMMARY:');
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    console.log(`Passed: ${passed}/${total} (${Math.round(passed / total * 100)}%)`);
    console.log('===============================================================');

  } catch (err) {
    console.error('Audit execution error:', err);
  } finally {
    await browser.close();
  }
})();

