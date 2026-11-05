const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testLuxuryLogin() {
  console.log('========================================================================');
  console.log('💎 SMARTBUY AI — LUXURY FASHION LOGIN V7.1 VERIFICATION SUITE');
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const screenshotDir = path.resolve(__dirname, '../playwright-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  let passedCount = 0;
  let totalCount = 0;

  function assert(title, condition, detail = '') {
    totalCount++;
    if (condition) {
      console.log(`✅ PASS: ${title} ${detail ? '(' + detail + ')' : ''}`);
      passedCount++;
    } else {
      console.error(`❌ FAIL: ${title} ${detail ? '(' + detail + ')' : ''}`);
    }
  }

  // --- 1. Desktop Experience (1440x900) ---
  console.log('--- 1. Desktop Viewport (1440x900) ---');
  const desktopCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await desktopCtx.newPage();

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });

  // A. Check Brand Logo & Badge
  const hasBrandLogo = await page.locator('text=SMARTBUY AI').first().isVisible();
  assert('Brand Logo is visible', hasBrandLogo);

  const hasSecureBadge = await page.locator('text=SECURE ACCESS').first().isVisible();
  assert('Secure Access badge is rendered', hasSecureBadge);

  const hasAtelierBadge = await page.locator('text=AI-POWERED LUXURY ATELIER').first().isVisible();
  assert('AI Atelier badge is rendered', hasAtelierBadge);

  // B. Check Canvas Particles
  const canvasCount = await page.locator('canvas').count();
  assert('Luxury particle background canvas is mounted', canvasCount > 0);

  // C. Check Editorial Visual Showcase
  const editorialImages = await page.locator('img[alt*="RUNWAY"], img[alt*="COUTURE"], img[alt*="MINIMALIST"], img[alt*="LOOKBOOK"]').count();
  assert('All 4 editorial runway images are mounted in DOM', editorialImages >= 4, `found ${editorialImages}`);

  const activeSlideTitle = await page.locator('text=STREETWEAR RUNWAY 2026').first().isVisible();
  assert('Active slide editorial title is visible', activeSlideTitle);

  // D. Inputs empty by default
  const emailVal = await page.locator('#login-email').inputValue();
  const passVal = await page.locator('#login-password').inputValue();
  assert('Email input is empty by default', emailVal === '');
  assert('Password input is empty by default', passVal === '');

  // E. Password Visibility Toggle
  const passTypeBefore = await page.locator('#login-password').getAttribute('type');
  assert('Password input defaults to type="password"', passTypeBefore === 'password');

  const toggleBtn = page.locator('button[aria-label="Hiện mật khẩu"]');
  if (await toggleBtn.isVisible()) {
    await toggleBtn.click();
    const passTypeAfter = await page.locator('#login-password').getAttribute('type');
    assert('Toggling eye icon changes input to type="text"', passTypeAfter === 'text');

    // Toggle back
    const hideBtn = page.locator('button[aria-label="Ẩn mật khẩu"]');
    await hideBtn.click();
    const passTypeRestored = await page.locator('#login-password').getAttribute('type');
    assert('Toggling eye icon back restores type="password"', passTypeRestored === 'password');
  }

  // F. Error Alert Styling on invalid credentials
  await page.fill('#login-email', 'wrong.user@smartbuy.local');
  await page.fill('#login-password', 'wrong_password_123');
  await page.click('button[type="submit"]');

  await page.waitForSelector('[data-testid="login-error-alert"]', { timeout: 8000 });
  const hasErrorAlert = await page.locator('[data-testid="login-error-alert"]').isVisible();
  const errorText = await page.locator('[data-testid="login-error-alert"]').textContent();
  assert('Luxury error alert displays on invalid credentials', hasErrorAlert, errorText.trim());

  // Screenshot Desktop
  const desktopShot = path.join(screenshotDir, 'luxury_login_desktop.png');
  await page.screenshot({ path: desktopShot, fullPage: true });
  console.log(`📸 Desktop Screenshot captured: ${desktopShot}`);
  await desktopCtx.close();

  // --- 2. Mobile Viewport: iPhone 14 / Safari (390x844) ---
  console.log('\n--- 2. Mobile Viewport (iPhone 390x844) ---');
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });
  const mPage = await mobileCtx.newPage();

  await mPage.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });

  // A. Check for horizontal overflow (must not have horizontal scrollbar)
  const overflowX = await mPage.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  assert('No horizontal scroll overflow on mobile viewport', !overflowX);

  // B. Input font size >= 16px to prevent iOS auto-zoom
  const emailFontSize = await mPage.locator('#login-email').evaluate(el => window.getComputedStyle(el).fontSize);
  const emailFontSizeNum = parseFloat(emailFontSize);
  assert('Input font-size is at least 16px (prevents iOS auto-zoom)', emailFontSizeNum >= 16, `${emailFontSize}`);

  // C. Form and CTA visibility
  const submitBtnVisible = await mPage.locator('button[type="submit"]').isVisible();
  assert('Submit CTA button is clearly visible and accessible on mobile', submitBtnVisible);

  // Screenshot Mobile
  const mobileShot = path.join(screenshotDir, 'luxury_login_mobile_iphone.png');
  await mPage.screenshot({ path: mobileShot, fullPage: true });
  console.log(`📸 Mobile Screenshot captured: ${mobileShot}`);
  await mobileCtx.close();

  await browser.close();

  console.log('\n========================================================================');
  console.log(`💎 KẾT QUẢ KIỂM THỬ GIAO DIỆN LUXURY LOGIN V7.1: ${passedCount}/${totalCount} (${Math.round(passedCount / totalCount * 100)}%)`);
  console.log('========================================================================\n');
}

testLuxuryLogin().catch(err => {
  console.error('Lỗi khi chạy kiểm thử:', err);
  process.exit(1);
});
