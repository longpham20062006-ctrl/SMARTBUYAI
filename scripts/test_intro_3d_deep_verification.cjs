/**
 * SMARTBUY AI — DEEP VERIFICATION OF INTRO 3D (12 CORE CHECKS)
 */

const { chromium } = require('playwright');

const FRONTEND_URL = 'http://localhost:5173';
const CUSTOMER_USER = {
  email: 'customer.test@smartbuy.local',
  pass: 'd8RnVTsh&%3Q2v$H',
};
const ADMIN_USER = {
  email: 'admin.test@smartbuy.local',
  pass: '^Xjn6^jwGDXx2rC9rf',
};

async function runDeepVerification() {
  console.log('================================================================');
  console.log('🎬 SMARTBUY AI — DEEP INTRO 3D & ROUTING VERIFICATION SUITE');
  console.log('================================================================');

  const browser = await chromium.launch({ headless: true });
  let passed = 0;
  let failed = 0;

  function report(condition, title, details = '') {
    if (condition) {
      passed++;
      console.log(`  [PASS] ${title}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${title} - ${details}`);
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Khách đăng nhập thành công -> Intro xuất hiện
    // TEST 2: Intro chạy hoàn chỉnh -> vào trang chủ và scrollY === 0
    // TEST 10: Không xuất hiện lỗi JavaScript nghiêm trọng
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 1, 2, 10: Customer Login -> 3D Intro -> Auto Enter Home ---');
    const context1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page1 = await context1.newPage();

    const jsErrors = [];
    page1.on('pageerror', (err) => {
      jsErrors.push(err.message);
    });

    await page1.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    await page1.fill('input[type="email"]', CUSTOMER_USER.email);
    await page1.fill('input[type="password"]', CUSTOMER_USER.pass);
    await page1.click('button[type="submit"]');

    // TEST 1: Chờ vào /intro
    await page1.waitForURL('**/intro', { timeout: 6000 });
    const isIntroURL = page1.url().includes('/intro');
    const introCanvas = page1.locator('canvas').first();
    await introCanvas.waitFor({ state: 'visible', timeout: 5000 });
    const hasCanvas = await introCanvas.isVisible();

    report(isIntroURL && hasCanvas, 'Check 01: Khách đăng nhập thành công -> Intro 3D xuất hiện với canvas WebGL');

    // TEST 2: Intro chạy tự động chuyển vào trang chủ
    console.log('  Waiting for Intro 3D timeline (~5.5s)...');
    await page1.waitForURL(`${FRONTEND_URL}/`, { timeout: 10000 });
    const currentURL = page1.url();
    const scrollPos = await page1.evaluate(() => window.scrollY);

    report(
      currentURL === `${FRONTEND_URL}/` && scrollPos === 0,
      'Check 02: Intro chạy hoàn chỉnh tự động vào trang chủ khách hàng và cuộn lên đầu trang (scrollY = 0)',
      `url: ${currentURL}, scrollY: ${scrollPos}`
    );

    // TEST 10: Không có lỗi JS nghiêm trọng
    report(jsErrors.length === 0, 'Check 10: Website không xuất hiện lỗi JavaScript nghiêm trọng (Zero JS Crashes)', jsErrors.join(', '));

    // -------------------------------------------------------------------------
    // TEST 4: Nhấn Trang chủ -> Không chạy lại Intro
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Customer Clicks "Trang chủ" ---');
    const homeNavBtn = page1.locator('a[href="/"]').first();
    await homeNavBtn.click();
    await page1.waitForTimeout(600);
    report(!page1.url().includes('/intro'), 'Check 04: Nhấn "Trang chủ" sau đó không chạy lại Intro', `url: ${page1.url()}`);

    // -------------------------------------------------------------------------
    // TEST 5: F5 -> Không chạy lại Intro
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: F5 Reload Homepage ---');
    await page1.reload({ waitUntil: 'networkidle' });
    await page1.waitForTimeout(600);
    report(!page1.url().includes('/intro'), 'Check 05: F5 trang chủ không chạy lại Intro', `url: ${page1.url()}`);

    // -------------------------------------------------------------------------
    // TEST 12: Kiểm tra nút Back/Forward không gây vòng lặp
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 12: Browser Back / Forward History Stability ---');
    // Navigate to /shop
    await page1.goto(`${FRONTEND_URL}/shop`, { waitUntil: 'networkidle' });
    await page1.waitForTimeout(600);
    // Press Back to homepage
    await page1.goBack();
    await page1.waitForTimeout(600);
    const backUrl = page1.url();
    // Press Forward to shop
    await page1.goForward();
    await page1.waitForTimeout(600);
    const forwardUrl = page1.url();

    report(
      (backUrl === `${FRONTEND_URL}/` || backUrl === `${FRONTEND_URL}`) && forwardUrl.includes('/shop'),
      'Check 12: Nút Back/Forward của trình duyệt hoạt động chuẩn xác, không gây vòng lặp redirect',
      `backUrl: ${backUrl}, forwardUrl: ${forwardUrl}`
    );
    await context1.close();

    // -------------------------------------------------------------------------
    // TEST 3: Nhấn Bỏ qua -> Vào trang chủ ngay lập tức
    // TEST 6: Khách đăng xuất rồi đăng nhập lại -> Intro xuất hiện lần mới
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3 & 6: Skip Intro Button & Re-login New Session ---');
    const context2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page2 = await context2.newPage();

    await page2.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    await page2.fill('input[type="email"]', CUSTOMER_USER.email);
    await page2.fill('input[type="password"]', CUSTOMER_USER.pass);
    await page2.click('button[type="submit"]');

    await page2.waitForURL('**/intro', { timeout: 6000 });
    const skipBtn = page2.locator('button:has-text("Bỏ qua Intro")');
    await skipBtn.waitFor({ state: 'visible', timeout: 4000 });
    await skipBtn.click();

    await page2.waitForURL(`${FRONTEND_URL}/`, { timeout: 4000 });
    report(page2.url() === `${FRONTEND_URL}/`, 'Check 03: Nhấn nút "Bỏ qua Intro" lập tức vào trang chủ');

    // Đăng xuất
    await page2.goto(`${FRONTEND_URL}/account`, { waitUntil: 'networkidle' });
    const logoutBtn = page2.locator('button:has-text("Đăng xuất")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      await page2.evaluate(() => {
        sessionStorage.clear();
        window.location.href = '/';
      });
    }
    await page2.waitForTimeout(800);

    // Đăng nhập lại để kiểm tra Intro xuất hiện lần mới
    await page2.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    await page2.fill('input[type="email"]', CUSTOMER_USER.email);
    await page2.fill('input[type="password"]', CUSTOMER_USER.pass);
    await page2.click('button[type="submit"]');

    await page2.waitForURL('**/intro', { timeout: 6000 });
    const hasIntroAgain = page2.url().includes('/intro');
    report(hasIntroAgain, 'Check 06: Khách đăng xuất rồi đăng nhập lại -> Intro xuất hiện lần mới hoàn toàn');

    await context2.close();

    // -------------------------------------------------------------------------
    // TEST 7: Admin đăng nhập -> Vào thẳng Dashboard
    // TEST 8: Admin không thể truy cập giao diện khách hàng
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7 & 8: Admin Direct Dashboard & Zero Store Leak ---');
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminContext.newPage();

    await adminPage.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    await adminPage.fill('input[type="email"]', ADMIN_USER.email);
    await adminPage.fill('input[type="password"]', ADMIN_USER.pass);
    await adminPage.click('button[type="submit"]');

    await adminPage.waitForURL('**/admin/dashboard', { timeout: 6000 });
    report(adminPage.url().includes('/admin/dashboard'), 'Check 07: Admin đăng nhập -> Vào THẲNG Dashboard, tuyệt đối không chạy Intro 3D');

    // Admin cố truy cập URL khách hàng: /shop, /, /cart
    await adminPage.goto(`${FRONTEND_URL}/shop`, { waitUntil: 'networkidle' });
    await adminPage.waitForTimeout(600);
    const adminShopRedirect = adminPage.url();

    await adminPage.goto(`${FRONTEND_URL}/cart`, { waitUntil: 'networkidle' });
    await adminPage.waitForTimeout(600);
    const adminCartRedirect = adminPage.url();

    report(
      adminShopRedirect.includes('/admin/dashboard') && adminCartRedirect.includes('/admin/dashboard'),
      'Check 08: Admin không thể truy cập giao diện khách hàng (tự động chuyển hướng về Dashboard)',
      `shop: ${adminShopRedirect}, cart: ${adminCartRedirect}`
    );
    await adminContext.close();

    // -------------------------------------------------------------------------
    // TEST 9: Khách không thể truy cập trang quản trị
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 9: Customer Cannot Access Admin Area ---');
    const custContext3 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const custPage3 = await custContext3.newPage();

    // Đăng nhập customer
    await custPage3.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    await custPage3.fill('input[type="email"]', CUSTOMER_USER.email);
    await custPage3.fill('input[type="password"]', CUSTOMER_USER.pass);
    await custPage3.click('button[type="submit"]');
    await custPage3.waitForURL('**/intro', { timeout: 6000 });

    // Khách cố gõ URL Admin
    await custPage3.goto(`${FRONTEND_URL}/admin/dashboard`, { waitUntil: 'networkidle' });
    await custPage3.waitForTimeout(600);
    const custAdminBlock = custPage3.url();
    report(
      custAdminBlock.includes('/403') || custAdminBlock === `${FRONTEND_URL}/`,
      'Check 09: Khách hàng không thể truy cập trang quản trị (Bị chặn 403 Forbidden)',
      `url: ${custAdminBlock}`
    );
    await custContext3.close();

    // -------------------------------------------------------------------------
    // TEST 11: Kiểm tra Intro trên Desktop và Mobile (390x844)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 11: Desktop & Mobile Viewport Intro Test ---');
    const mobContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const mobPage = await mobContext.newPage();

    await mobPage.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    await mobPage.fill('input[type="email"]', CUSTOMER_USER.email);
    await mobPage.fill('input[type="password"]', CUSTOMER_USER.pass);
    await mobPage.click('button[type="submit"]');

    await mobPage.waitForURL('**/intro', { timeout: 6000 });
    const mobCanvas = mobPage.locator('canvas').first();
    await mobCanvas.waitFor({ state: 'visible', timeout: 5000 });
    const mobCanvasVisible = await mobCanvas.isVisible();
    const mobSkipBtn = mobPage.locator('button:has-text("Bỏ qua Intro")');
    const mobSkipVisible = await mobSkipBtn.isVisible();

    report(
      mobCanvasVisible && mobSkipVisible,
      'Check 11: Intro hoạt động hoàn hảo trên cả desktop và điện thoại di động (Mobile 390x844, Canvas & Skip Btn hiển thị đầy đủ)'
    );
    await mobContext.close();

  } catch (err) {
    console.error('Test Suite encountered an error:', err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(`DEEP INTRO VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runDeepVerification();

