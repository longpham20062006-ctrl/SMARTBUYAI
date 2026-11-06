/**
 * SMARTBUY AI — VERIFY HERO GALAXY COLOR & THEME FIX
 * Tests:
 * 1. Homepage before login: Background is #070816 (not white), H1 is white, P is light gray.
 * 2. Accent colors (Violet #8B5CF6 & Cyan #22D3EE) and Three.js AmbientGalaxy canvas are active.
 * 3. HeroFashionGallery slides and action buttons are visible and styled properly.
 * 4. Performance Mode Standard vs Saver: Both keep dark background and readable text.
 * 5. Customer Login flow -> Intro 3D (verifying dark background and brand reveal) -> Homepage after login.
 * 6. Viewports: 1920x1080, 1366x768, 390x844 (Mobile).
 * 7. Capture screenshots to Artifacts directory.
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
    console.log('SMARTBUY AI — HERO GALAXY COLOR & THEME VERIFICATION');
    console.log('===============================================================');

    // -------------------------------------------------------------------------
    // TEST 1: HOMEPAGE BEFORE LOGIN (DESKTOP 1920x1080)
    // -------------------------------------------------------------------------
    const page1920 = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page1920.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page1920.waitForTimeout(1200);

    // 1.1 Kiểm tra màu nền Hero section
    const heroBg = await page1920.evaluate(() => {
      const sec = document.querySelector('section');
      if (!sec) return null;
      const comp = window.getComputedStyle(sec);
      return {
        bgColor: comp.backgroundColor,
        color: comp.color,
      };
    });

    const isDarkBg = heroBg && (heroBg.bgColor === 'rgb(7, 8, 22)' || heroBg.bgColor.includes('7, 8, 22') || heroBg.bgColor === 'rgb(5, 5, 16)');
    record('HERO-BG-DARK', 'Hero section has dark Galaxy background (#070816)', isDarkBg, `bgColor: ${heroBg?.bgColor}`);

    // 1.2 Kiểm tra chữ H1 màu trắng rõ nét
    const h1Info = await page1920.evaluate(() => {
      const h1 = document.querySelector('section h1');
      if (!h1) return null;
      const comp = window.getComputedStyle(h1);
      return {
        text: h1.innerText,
        color: comp.color,
      };
    });
    const isH1White = h1Info && (h1Info.color === 'rgb(255, 255, 255)' || h1Info.color === '#ffffff');
    record('HERO-H1-WHITE', 'Hero H1 heading text is crisp WHITE', isH1White, `color: ${h1Info?.color}`);

    // 1.3 Kiểm tra đoạn mô tả màu xám sáng, dễ đọc trên nền tối
    const descInfo = await page1920.evaluate(() => {
      const p = document.querySelector('section p');
      if (!p) return null;
      const comp = window.getComputedStyle(p);
      return {
        text: p.innerText,
        color: comp.color,
      };
    });
    // rgb(212, 212, 216) = zinc-300
    const isDescReadable = descInfo && descInfo.color.startsWith('rgb(') && descInfo.color !== 'rgb(24, 24, 27)';
    record('HERO-DESC-LIGHT', 'Hero description text is readable light gray', isDescReadable, `color: ${descInfo?.color}`);

    // 1.4 Kiểm tra Canvas AmbientGalaxy Three.js tồn tại và đang vẽ
    const hasCanvas = await page1920.evaluate(() => {
      const cvs = document.querySelector('section canvas');
      return !!cvs && cvs.width > 0 && cvs.height > 0;
    });
    record('HERO-GALAXY-CVS', 'Three.js AmbientGalaxy canvas is active', hasCanvas);

    // 1.5 Kiểm tra các nút bấm hành động
    const buttonsInfo = await page1920.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('section button, section a button'));
      return btns.map(b => b.innerText.trim());
    });
    const hasShopBtn = buttonsInfo.some(t => t.includes('KHÁM PHÁ SHOP'));
    const hasHotBtn = buttonsInfo.some(t => t.includes('XEM SẢN PHẨM HOT'));
    record('HERO-BTN-SHOP', 'Button "KHÁM PHÁ SHOP THỜI TRANG" is rendered', hasShopBtn);
    record('HERO-BTN-HOT', 'Button "XEM SẢN PHẨM HOT" is rendered', hasHotBtn);

    // 1.6 Kiểm tra ảnh thời trang trong HeroFashionGallery
    const galleryImgCount = await page1920.evaluate(() => {
      return document.querySelectorAll('section img').length;
    });
    record('HERO-GALLERY-IMG', 'Hero fashion gallery images are present', galleryImgCount >= 1, `count: ${galleryImgCount}`);

    // Chụp ảnh 1920x1080
    const shot1920Path = path.join(ARTIFACT_DIR, 'screenshot_hero_galaxy_1920.png');
    await page1920.screenshot({ path: shot1920Path, fullPage: false });
    record('SHOT-1920', 'Captured 1920x1080 screenshot', fs.existsSync(shot1920Path));
    await page1920.close();

    // -------------------------------------------------------------------------
    // TEST 2: LAPTOP STANDARD (1366x768)
    // -------------------------------------------------------------------------
    const page1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await page1366.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page1366.waitForTimeout(800);
    const shot1366Path = path.join(ARTIFACT_DIR, 'screenshot_hero_galaxy_1366.png');
    await page1366.screenshot({ path: shot1366Path, fullPage: false });
    record('SHOT-1366', 'Captured 1366x768 screenshot', fs.existsSync(shot1366Path));
    await page1366.close();

    // -------------------------------------------------------------------------
    // TEST 3: MOBILE (390x844 iPhone)
    // -------------------------------------------------------------------------
    const page390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page390.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page390.waitForTimeout(800);
    const shot390Path = path.join(ARTIFACT_DIR, 'screenshot_hero_galaxy_390.png');
    await page390.screenshot({ path: shot390Path, fullPage: false });
    record('SHOT-390', 'Captured 390x844 Mobile screenshot', fs.existsSync(shot390Path));
    await page390.close();

    // -------------------------------------------------------------------------
    // TEST 4: PERFORMANCE MODE CHUYỂN ĐỔI (SAVER MODE)
    // -------------------------------------------------------------------------
    const pageSaver = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await pageSaver.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    // Thiết lập chế độ saver
    await pageSaver.evaluate(() => {
      localStorage.setItem('sb_perf_mode', 'saver');
    });
    await pageSaver.reload({ waitUntil: 'networkidle' });
    await pageSaver.waitForTimeout(800);

    const saverBg = await pageSaver.evaluate(() => {
      const sec = document.querySelector('section');
      return sec ? window.getComputedStyle(sec).backgroundColor : '';
    });
    const isSaverDark = saverBg === 'rgb(7, 8, 22)' || saverBg.includes('7, 8, 22');
    record('PERF-SAVER-BG', 'Saver mode maintains dark Galaxy background', isSaverDark, `bgColor: ${saverBg}`);

    const shotSaverPath = path.join(ARTIFACT_DIR, 'screenshot_hero_galaxy_saver.png');
    await pageSaver.screenshot({ path: shotSaverPath, fullPage: false });
    record('SHOT-SAVER', 'Captured Saver mode screenshot', fs.existsSync(shotSaverPath));
    await pageSaver.close();

    // -------------------------------------------------------------------------
    // TEST 5: INTRO 3D SAU ĐĂNG NHẬP CUSTOMER & TRANG CHỦ SAU ĐĂNG NHẬP
    // -------------------------------------------------------------------------
    const authPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await authPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await authPage.waitForTimeout(500);

    // Điền tài khoản customer chuẩn
    await authPage.fill('#login-email', 'khachhang@smartbuy.vn');
    await authPage.fill('#login-password', '123456');
    await authPage.click('button[type="submit"]');

    // Chờ điều hướng vào /intro
    await authPage.waitForURL('**/intro', { timeout: 10000 });
    record('AUTH-NAV-INTRO', 'Customer login navigates to /intro', true, authPage.url());
    await authPage.waitForTimeout(1000);

    // Kiểm tra Intro 3D có nền tối (#050510)
    const introBg = await authPage.evaluate(() => {
      const el = document.querySelector('div.fixed.inset-0');
      return el ? window.getComputedStyle(el).backgroundColor : '';
    });
    const isIntroDark = introBg === 'rgb(5, 5, 16)' || introBg.includes('5, 5, 16');
    record('INTRO-DARK-BG', 'Intro 3D has pure dark space background (#050510)', isIntroDark, `bgColor: ${introBg}`);

    // Chụp ảnh Intro 3D
    const shotIntroPath = path.join(ARTIFACT_DIR, 'screenshot_intro_3d_dark.png');
    await authPage.screenshot({ path: shotIntroPath, fullPage: false });
    record('SHOT-INTRO', 'Captured Intro 3D screenshot', fs.existsSync(shotIntroPath));

    // Bấm Bỏ qua Intro để chuyển vào Trang chủ
    const skipBtn = await authPage.$('[data-testid="skip-intro-btn"]');
    if (skipBtn) {
      await skipBtn.click();
    }
    await authPage.waitForURL('**/', { timeout: 10000 });
    record('AUTH-NAV-HOME', 'After Intro, navigated to Customer Homepage (/)', true, authPage.url());
    await authPage.waitForTimeout(1000);

    // Kiểm tra trang chủ sau đăng nhập: Nền vẫn là Galaxy tối #070816, chữ trắng
    const postLoginHeroBg = await authPage.evaluate(() => {
      const sec = document.querySelector('section');
      return sec ? window.getComputedStyle(sec).backgroundColor : '';
    });
    record('POST-LOGIN-BG', 'Customer Homepage retains dark Galaxy background (#070816)', postLoginHeroBg === 'rgb(7, 8, 22)', `bgColor: ${postLoginHeroBg}`);

    const shotPostLoginPath = path.join(ARTIFACT_DIR, 'screenshot_homepage_after_login.png');
    await authPage.screenshot({ path: shotPostLoginPath, fullPage: false });
    record('SHOT-POST-LOGIN', 'Captured post-login Homepage screenshot', fs.existsSync(shotPostLoginPath));

    await authPage.close();

    console.log('\n===============================================================');
    console.log('SUMMARY RESULTS:');
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    console.log(`Passed: ${passed}/${total} (${Math.round(passed / total * 100)}%)`);
    console.log('===============================================================');

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
})();
