/**
 * SMARTBUY AI — REAL INTRO 3D SCREENSHOTS & ANIMATION VERIFICATION
 * Captures 3 visual proof points required by the user:
 * 1. Intro vừa bắt đầu (Starfield / Hyperspace).
 * 2. Hiệu ứng logo xuất hiện (Brand Reveal).
 * 3. Trang chủ sau khi Intro hoàn thành.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const FRONTEND_URL = 'http://localhost:5173';
const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\1740427a-d3f3-4847-8779-e5836f36995a';
const CUSTOMER_USER = {
  email: 'customer.test@smartbuy.local',
  pass: 'd8RnVTsh&%3Q2v$H',
};

async function captureIntroVerification() {
  console.log('================================================================');
  console.log('📸 SMARTBUY AI — CAPTURING INTRO 3D VISUAL PROOFS');
  console.log('================================================================');

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  try {
    // 1. Mở trang đăng nhập
    console.log('Step 1: Navigating to login page...');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });

    // 2. Điền thông tin Customer
    console.log('Step 2: Submitting Customer credentials...');
    await page.fill('input[type="email"]', CUSTOMER_USER.email);
    await page.fill('input[type="password"]', CUSTOMER_USER.pass);
    await page.click('button[type="submit"]');

    // 3. Chờ chuyển hướng đến /intro
    console.log('Step 3: Waiting for navigation to /intro...');
    await page.waitForURL('**/intro', { timeout: 6000 });
    console.log('  Successfully arrived at:', page.url());

    // Chờ canvas xuất hiện
    const canvas = page.locator('canvas').first();
    await canvas.waitFor({ state: 'visible', timeout: 5000 });

    // Moment 1: Intro vừa bắt đầu (~1.2s - Starfield / Hyperspace)
    console.log('Step 4: Capturing Moment 1 (Intro vừa bắt đầu)...');
    await page.waitForTimeout(1200);
    const shot1Path = path.join(ARTIFACT_DIR, 'intro_moment_1_starfield.png');
    await page.screenshot({ path: shot1Path });
    console.log('  Saved shot 1 to:', shot1Path);

    // Moment 2: Hiệu ứng logo xuất hiện (Brand Reveal ~3.8s)
    console.log('Step 5: Capturing Moment 2 (Brand Reveal & Logo)...');
    await page.waitForTimeout(2600); // cumulative ~3.8s
    const shot2Path = path.join(ARTIFACT_DIR, 'intro_moment_2_brand_reveal.png');
    await page.screenshot({ path: shot2Path });
    console.log('  Saved shot 2 to:', shot2Path);

    // Moment 3: Chờ Intro kết thúc (~5.5s) và chuyển vào Trang chủ (/)
    console.log('Step 6: Waiting for Intro to complete and transition to Homepage (/)...');
    await page.waitForURL(`${FRONTEND_URL}/`, { timeout: 10000 });
    console.log('  Successfully arrived at Homepage:', page.url());

    // Chờ trang chủ render hoàn chỉnh
    await page.waitForSelector('text=SMARTBUY AI // STREETWEAR 2026', { timeout: 6000 });
    const scrollY = await page.evaluate(() => window.scrollY);
    console.log('  Homepage scrollY position:', scrollY);

    const shot3Path = path.join(ARTIFACT_DIR, 'intro_moment_3_homepage_ready.png');
    await page.screenshot({ path: shot3Path });
    console.log('  Saved shot 3 to:', shot3Path);

    console.log('\n================================================================');
    console.log('✅ ALL 3 SCREENSHOTS CAPTURED SUCCESSFULLY!');
    console.log('1. ' + shot1Path);
    console.log('2. ' + shot2Path);
    console.log('3. ' + shot3Path);
    console.log('Zero page crashes:', pageErrors.length === 0);
    console.log('================================================================');

  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

captureIntroVerification();

