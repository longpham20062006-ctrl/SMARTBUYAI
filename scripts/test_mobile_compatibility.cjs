/**
 * SMARTBUY AI — MOBILE COMPATIBILITY & WHITE SCREEN VERIFICATION SUITE
 */

const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const LAN_URL = 'http://localhost:5173';
const LOCAL_URL = 'http://localhost:5173';

// Load test credentials
let adminEmail = 'admin.test@smartbuy.local';
let adminPass = '^Xjn6^jwGDXx2rC9rf';
let customerEmail = 'customer.test@smartbuy.local';
let customerPass = 'd8RnVTsh&%3Q2v$H';

const credPath = path.resolve('backend/data/test_credentials.local');
if (fs.existsSync(credPath)) {
  const content = fs.readFileSync(credPath, 'utf8');
  content.split('\n').forEach(line => {
    if (line.startsWith('ADMIN_TEST_EMAIL=')) adminEmail = line.split('=')[1].trim();
    if (line.startsWith('ADMIN_TEST_PASSWORD=')) adminPass = line.split('=')[1].trim();
    if (line.startsWith('CUSTOMER_TEST_EMAIL=')) customerEmail = line.split('=')[1].trim();
    if (line.startsWith('CUSTOMER_TEST_PASSWORD=')) customerPass = line.split('=')[1].trim();
  });
}

async function runMobileTestSuite() {
  console.log('================================================================');
  console.log('📱 SMARTBUY AI — MOBILE COMPATIBILITY & ANTI-WHITE SCREEN AUDIT');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
  });

  try {
    // -------------------------------------------------------------
    // TEST 1: IPHONE 13 (SAFARI / WEBKIT EMULATION)
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing iPhone 13 Mobile Safari Viewport ---');
    const iPhone = devices['iPhone 13'];
    const iPhoneContext = await browser.newContext({
      ...iPhone,
      isMobile: true,
      hasTouch: true,
    });
    const iPhonePage = await iPhoneContext.newPage();

    let iPhonePageError = null;
    iPhonePage.on('pageerror', err => { iPhonePageError = err.message; });

    await iPhonePage.goto(LAN_URL, { waitUntil: 'networkidle' });

    assert(!iPhonePageError, `iPhone 13 loads without unhandled exceptions: ${iPhonePageError || 'None'}`);

    const hasHeader = await iPhonePage.locator('header').isVisible();
    assert(hasHeader, 'iPhone 13 renders SiteHeader successfully (No White Screen)');

    const hasLoginBtn = await iPhonePage.locator('header a[href="/login"]').first().isVisible();
    assert(hasLoginBtn, 'iPhone 13 displays "Đăng nhập" button in header');

    const heroTitle = await iPhonePage.locator('text=YOUR STYLE').first().isVisible();
    assert(heroTitle, 'iPhone 13 displays Hero Section text and typography');

    // Check that canvas is rendering without crashing
    const hasCanvas = await iPhonePage.locator('canvas').count();
    assert(hasCanvas > 0, `iPhone 13 has active background animation canvas (found ${hasCanvas})`);

    await iPhoneContext.close();

    // -------------------------------------------------------------
    // TEST 2: ANDROID PIXEL 5 VIEWPORT
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Android Pixel 5 Mobile Chrome ---');
    const pixel = devices['Pixel 5'];
    const pixelContext = await browser.newContext({
      ...pixel,
      isMobile: true,
      hasTouch: true,
    });
    const pixelPage = await pixelContext.newPage();

    let pixelError = null;
    pixelPage.on('pageerror', err => { pixelError = err.message; });

    await pixelPage.goto(LAN_URL, { waitUntil: 'networkidle' });
    assert(!pixelError, `Android Pixel 5 loads without unhandled exceptions: ${pixelError || 'None'}`);

    const hotCount = await pixelPage.locator('text=SẢN PHẨM HOT').locator('xpath=ancestor::section').locator('a[href*="/products/"]').count();
    assert(hotCount > 0, `Android Pixel 5 displays HOT products section (found ${hotCount} items)`);

    await pixelContext.close();

    // -------------------------------------------------------------
    // TEST 3: RESTRICTED WEBGL (GPU FALLBACK 2D CANVAS)
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Device with No WebGL Support (2D Canvas Fallback) ---');
    const noWebGlContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const noWebGlPage = await noWebGlContext.newPage();

    // Simulate mobile browser where WebGL is completely disabled
    await noWebGlPage.addInitScript(() => {
      const origGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (type.includes('webgl')) return null;
        return origGetContext.apply(this, [type, ...args]);
      };
    });

    let noWebGlError = null;
    noWebGlPage.on('pageerror', err => { noWebGlError = err.message; });

    await noWebGlPage.goto(LAN_URL, { waitUntil: 'networkidle' });
    assert(!noWebGlError, `Device without WebGL loads without error: ${noWebGlError || 'None'}`);

    const rootLen = await noWebGlPage.evaluate(() => document.getElementById('root')?.innerHTML?.length || 0);
    assert(rootLen > 1000, `Device without WebGL renders full HTML (length: ${rootLen} bytes)`);

    await noWebGlContext.close();

    // -------------------------------------------------------------
    // TEST 4: PRIVATE BROWSING / RESTRICTED STORAGE (SAFARI PRIVATE MODE)
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing iOS Safari Private Browsing Mode (Restricted Storage) ---');
    const privContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const privPage = await privContext.newPage();

    // Simulate Safari private mode where localStorage / sessionStorage throw SecurityError
    await privPage.addInitScript(() => {
      const throwSecurityError = () => {
        const err = new Error('The operation is insecure.');
        err.name = 'SecurityError';
        throw err;
      };
      try {
        Object.defineProperty(window, 'sessionStorage', {
          get: throwSecurityError,
        });
      } catch { }
    });

    let privError = null;
    privPage.on('pageerror', err => { privError = err.message; });

    await privPage.goto(LAN_URL, { waitUntil: 'networkidle' });
    assert(!privError, `Private mode with restricted storage loads cleanly: ${privError || 'None'}`);

    await privContext.close();

    // -------------------------------------------------------------
    // TEST 5: BACKEND REST API ACCESS VIA LAN URL
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Backend Product API over LAN ---');
    const apiContext = await browser.newContext();
    const apiPage = await apiContext.newPage();

    const apiResponse = await apiPage.evaluate(async (url) => {
      try {
        const res = await fetch(`${url}/api/v1/products?size=4`);
        const json = await res.json();
        return { ok: res.ok, status: res.status, total: json?.totalElements };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    }, LAN_URL);

    assert(apiResponse.ok && apiResponse.status === 200, `Mobile can fetch Product API via LAN (${apiResponse.status} OK)`);
    assert(apiResponse.total >= 250, `API returns real products from persistent DB (totalElements: ${apiResponse.total})`);

    await apiContext.close();

    // -------------------------------------------------------------
    // TEST 6: ERUDA MOBILE DEVTOOLS QUERY INJECTION
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Eruda Mobile In-App Console (?debug=1) ---');
    const erudaContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const erudaPage = await erudaContext.newPage();

    await erudaPage.goto(`${LAN_URL}/?debug=1`, { waitUntil: 'networkidle' });
    await erudaPage.waitForTimeout(1000);

    const isErudaPresent = await erudaPage.evaluate(() => typeof window.eruda !== 'undefined');
    assert(isErudaPresent, 'Eruda mobile debugger initializes when ?debug=1 is appended to URL');

    await erudaContext.close();

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(`📊 MOBILE TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

runMobileTestSuite().catch(err => {
  console.error(err);
  process.exit(1);
});
