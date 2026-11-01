const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

function readCredentials() {
  const credPath = path.resolve(__dirname, '../backend/data/test_credentials.local');
  if (fs.existsSync(credPath)) {
    const content = fs.readFileSync(credPath, 'utf8');
    const creds = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        creds[trimmed.substring(0, eqIdx).trim()] = trimmed.substring(eqIdx + 1).trim();
      }
    }
    return creds;
  }
  return {
    ADMIN_TEST_EMAIL: 'admin.test@smartbuy.local',
    ADMIN_TEST_PASSWORD: 'Password123!',
    CUSTOMER_TEST_EMAIL: 'customer.test@smartbuy.local',
    CUSTOMER_TEST_PASSWORD: 'Password123!'
  };
}

async function runScrollTests() {
  console.log('======================================================================');
  console.log('   SMARTBUY AI — GLOBAL SCROLL POSITION FIX V11 COMPREHENSIVE QA      ');
  console.log('======================================================================');

  const creds = readCredentials();
  const adminEmail = creds['ADMIN_TEST_EMAIL'] || 'admin.test@smartbuy.local';
  const adminPass = creds['ADMIN_TEST_PASSWORD'];

  console.log(`Loaded test account: Admin=${adminEmail}`);

  const browser = await chromium.launch({
    headless: true,
  });

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  [PASS] ${message}`);
    } else {
      failedTests++;
      console.error(`  [FAIL] ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // SUITE 1: DESKTOP (1440x900)
    // -------------------------------------------------------------
    console.log('\n--- 1. DESKTOP VIEWPORT (1440x900) ---');
    const contextDesktop = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await contextDesktop.newPage();

    // 1.1 Home -> Scroll down -> Navigate to Shop (/products)
    console.log('\n[1.1] Testing Home -> Shop navigation scroll reset');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Scroll down 1200px
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(100);
    const homeScrollY = await page.evaluate(() => window.scrollY);
    console.log(`      Home scrolled to: ${homeScrollY}px`);
    assert(homeScrollY >= 1000, `Home page scrolled down properly (scrollY = ${homeScrollY})`);

    // Click "Shop" in header navigation
    const shopLink = page.locator('header a[href="/products"]').first();
    await shopLink.click();
    await page.waitForURL('**/products');
    await page.waitForTimeout(200);

    let shopScrollY = await page.evaluate(() => window.scrollY);
    console.log(`      Shop page scroll position immediately after navigation: ${shopScrollY}px`);
    assert(shopScrollY <= 20, `Shop page started at top (scrollY = ${shopScrollY})`);

    // Wait 350ms to verify NO delayed layout jump (preventing the old 50ms sessionStorage jump)
    await page.waitForTimeout(350);
    shopScrollY = await page.evaluate(() => window.scrollY);
    console.log(`      Shop page scroll position after 350ms: ${shopScrollY}px`);
    assert(shopScrollY <= 20, `Zero delayed layout jump on Shop page (scrollY = ${shopScrollY})`);

    // 1.2 Category / Gender Switching (/products?gender=nam -> /products?gender=nu)
    console.log('\n[1.2] Testing Category / Gender query navigation within Shop');
    const namLink = page.locator('nav[data-testid="category-nav"] a[href*="gender=nam"]').first();
    if (await namLink.isVisible()) {
      await namLink.click();
      await page.waitForURL('**/products?gender=nam');
    } else {
      await page.goto('http://localhost:5173/products?gender=nam', { waitUntil: 'networkidle' });
    }
    await page.waitForTimeout(300);

    // Scroll down 1000px on Nam
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(100);
    const namScrollY = await page.evaluate(() => window.scrollY);
    console.log(`      Nam catalog scrolled to: ${namScrollY}px`);
    assert(namScrollY >= 700, `Scrolled down on Nam catalog (scrollY = ${namScrollY})`);

    // Click "Nữ" tab in header
    const nuLink = page.locator('nav[data-testid="category-nav"] a[href*="gender=nu"]').first();
    await nuLink.click();
    await page.waitForURL('**/products?gender=nu');
    await page.waitForTimeout(200);

    const nuScrollY = await page.evaluate(() => window.scrollY);
    console.log(`      Nữ catalog scroll position: ${nuScrollY}px`);
    assert(nuScrollY <= 30, `Switching to Nữ category displays from top (scrollY = ${nuScrollY})`);

    // Click "Phụ kiện" tab in header
    const phuKienLink = page.locator('nav[data-testid="category-nav"] a[href*="category=phu-kien"]').first();
    if (await phuKienLink.isVisible()) {
      await page.evaluate(() => window.scrollTo(0, 800));
      await phuKienLink.click();
      await page.waitForURL('**/products?category=phu-kien');
      await page.waitForTimeout(200);
      const phuKienScrollY = await page.evaluate(() => window.scrollY);
      console.log(`      Phụ kiện catalog scroll position: ${phuKienScrollY}px`);
      assert(phuKienScrollY <= 30, `Switching to Phụ kiện category displays from top (scrollY = ${phuKienScrollY})`);
    }

    // 1.3 Shop -> Product Detail Navigation
    console.log('\n[1.3] Testing Shop -> Product Detail navigation');
    await page.goto('http://localhost:5173/products', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    // Scroll down 800px in catalog
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(100);

    // Click first product card
    const firstProductCard = page.locator('main a[href^="/products/"]').first();
    const productHref = await firstProductCard.getAttribute('href');
    await firstProductCard.click();
    await page.waitForURL(`**${productHref}`);
    await page.waitForTimeout(200);

    const productScrollY = await page.evaluate(() => window.scrollY);
    console.log(`      Product detail initial scroll: ${productScrollY}px`);
    assert(productScrollY <= 20, `Product detail page rendered at top (scrollY = ${productScrollY})`);

    // Verify no delayed jump on Product Detail
    await page.waitForTimeout(300);
    const productScrollYAfter = await page.evaluate(() => window.scrollY);
    assert(productScrollYAfter <= 20, `Zero delayed jump on Product Detail (scrollY = ${productScrollYAfter})`);

    // 1.4 In-page operations: Changing size / quantity must NOT reset scroll position
    console.log('\n[1.4] Testing in-page operations scroll stability (Requirement #5)');
    await page.evaluate(() => window.scrollTo(0, 450));
    await page.waitForTimeout(100);
    const beforeActionScroll = await page.evaluate(() => window.scrollY);

    // Click quantity increment button
    const plusButtons = page.locator('button:has(svg.lucide-plus), button:has-text("+")');
    if (await plusButtons.count() > 0) {
      await plusButtons.first().click();
      await page.waitForTimeout(100);
      const afterActionScroll = await page.evaluate(() => window.scrollY);
      console.log(`      Scroll before quantity click: ${beforeActionScroll}px, after: ${afterActionScroll}px`);
      assert(Math.abs(afterActionScroll - beforeActionScroll) < 30, `In-page quantity change did NOT jump scroll position`);
    }

    // 1.5 Product Detail -> Cart -> Account
    console.log('\n[1.5] Testing Product Detail -> Cart -> Account scroll reset');
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.goto('http://localhost:5173/cart', { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    const cartScrollY = await page.evaluate(() => window.scrollY);
    console.log(`      Cart page scroll position: ${cartScrollY}px`);
    assert(cartScrollY <= 20, `Cart page rendered at top (scrollY = ${cartScrollY})`);

    await page.evaluate(() => window.scrollTo(0, 400));
    await page.goto('http://localhost:5173/about', { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    const aboutScrollY = await page.evaluate(() => window.scrollY);
    console.log(`      About page scroll position: ${aboutScrollY}px`);
    assert(aboutScrollY <= 20, `About page rendered at top (scrollY = ${aboutScrollY})`);

    await contextDesktop.close();

    // -------------------------------------------------------------
    // SUITE 2: ADMIN DASHBOARD NESTED SCROLL CONTAINER
    // -------------------------------------------------------------
    console.log('\n--- 2. ADMIN DASHBOARD NESTED CONTAINER SCROLL RESET ---');
    const adminContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const adminPage = await adminContext.newPage();

    // Login as Admin
    console.log('[2.1] Logging in as Admin');
    await adminPage.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await adminPage.waitForTimeout(300);

    // Login with admin credentials using #login-email and #login-password
    await adminPage.fill('#login-email', adminEmail);
    await adminPage.fill('#login-password', adminPass);
    await adminPage.click('button[type="submit"]');

    // Wait for redirection to /admin
    await adminPage.waitForURL(url => url.pathname.includes('/admin'), { timeout: 15000 });
    await adminPage.waitForTimeout(500);

    // Check main container scroll reset
    console.log('[2.2] Testing Admin internal <main> container scroll reset');
    const adminMain = adminPage.locator('#admin-main-scroll');
    await adminMain.waitFor({ state: 'visible' });

    // Scroll admin down 600px
    await adminPage.evaluate(() => {
      window.scrollTo(0, 600);
      const el = document.getElementById('admin-main-scroll');
      if (el) el.scrollTop = 600;
    });
    await adminPage.waitForTimeout(100);

    const adminScrolledPos = await adminPage.evaluate(() => {
      const el = document.getElementById('admin-main-scroll');
      return Math.max(window.scrollY, el ? el.scrollTop : 0);
    });
    console.log(`      Admin page/container scrolled down: ${adminScrolledPos}px`);
    assert(adminScrolledPos >= 400, `Admin page/container scrolled down (scroll = ${adminScrolledPos})`);

    // Click "Catalog" (/admin/products)
    const catalogNav = adminPage.locator('aside a[href="/admin/products"]');
    await catalogNav.click();
    await adminPage.waitForURL('**/admin/products');
    await adminPage.waitForTimeout(500);

    const catalogScroll = await adminPage.evaluate(() => {
      const el = document.getElementById('admin-main-scroll');
      return Math.max(window.scrollY, el ? el.scrollTop : 0);
    });
    console.log(`      Admin Catalog scroll position after route change: ${catalogScroll}px`);
    assert(catalogScroll === 0, `Admin Catalog reset to top 0 (scroll = ${catalogScroll})`);

    // Scroll down on Catalog
    await adminPage.evaluate(() => {
      window.scrollTo(0, 500);
      const el = document.getElementById('admin-main-scroll');
      if (el) el.scrollTop = 500;
    });
    await adminPage.waitForTimeout(100);

    // Click "Customers" (/admin/users)
    const usersNav = adminPage.locator('aside a[href="/admin/users"]');
    await usersNav.click();
    await adminPage.waitForURL('**/admin/users');
    await adminPage.waitForTimeout(500);

    const usersScroll = await adminPage.evaluate(() => {
      const el = document.getElementById('admin-main-scroll');
      return Math.max(window.scrollY, el ? el.scrollTop : 0);
    });
    console.log(`      Admin Customers scroll position after route change: ${usersScroll}px`);
    assert(usersScroll === 0, `Admin Customers reset to top 0 (scroll = ${usersScroll})`);

    // Scroll down on Users
    await adminPage.evaluate(() => {
      window.scrollTo(0, 450);
      const el = document.getElementById('admin-main-scroll');
      if (el) el.scrollTop = 450;
    });
    await adminPage.waitForTimeout(100);

    // Click "Orders" (/admin/orders)
    const ordersNav = adminPage.locator('aside a[href="/admin/orders"]');
    await ordersNav.click();
    await adminPage.waitForURL('**/admin/orders');
    await adminPage.waitForTimeout(500);

    const ordersScroll = await adminPage.evaluate(() => {
      const el = document.getElementById('admin-main-scroll');
      return Math.max(window.scrollY, el ? el.scrollTop : 0);
    });
    console.log(`      Admin Orders scroll position after route change: ${ordersScroll}px`);
    assert(ordersScroll === 0, `Admin Orders reset to top 0 (scroll = ${ordersScroll})`);

    await adminContext.close();

    // -------------------------------------------------------------
    // SUITE 3: DESKTOP STANDARD (1366x768)
    // -------------------------------------------------------------
    console.log('\n--- 3. DESKTOP STANDARD VIEWPORT (1366x768) ---');
    const stdDesktopContext = await browser.newContext({
      viewport: { width: 1366, height: 768 },
    });
    const stdPage = await stdDesktopContext.newPage();

    await stdPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await stdPage.evaluate(() => window.scrollTo(0, 900));
    await stdPage.waitForTimeout(100);

    await stdPage.goto('http://localhost:5173/products', { waitUntil: 'networkidle' });
    await stdPage.waitForTimeout(200);

    const stdScroll = await stdPage.evaluate(() => window.scrollY);
    console.log(`      1366x768 Shop page scroll position: ${stdScroll}px`);
    assert(stdScroll <= 20, `1366x768 Shop page started at top (scrollY = ${stdScroll})`);

    await stdDesktopContext.close();

    // -------------------------------------------------------------
    // SUITE 4: TABLET VIEWPORT (768x1024)
    // -------------------------------------------------------------
    console.log('\n--- 4. TABLET VIEWPORT (768x1024) ---');
    const tabletContext = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    });
    const tabletPage = await tabletContext.newPage();

    await tabletPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await tabletPage.evaluate(() => window.scrollTo(0, 1000));
    await tabletPage.waitForTimeout(100);

    await tabletPage.goto('http://localhost:5173/products', { waitUntil: 'networkidle' });
    await tabletPage.waitForTimeout(200);

    const tabletScroll = await tabletPage.evaluate(() => window.scrollY);
    console.log(`      Tablet Shop page scroll position: ${tabletScroll}px`);
    assert(tabletScroll <= 20, `Tablet Shop page started at top (scrollY = ${tabletScroll})`);

    await tabletContext.close();

    // -------------------------------------------------------------
    // SUITE 5: MOBILE VIEWPORT (390x844 - iPhone 12/13/14)
    // -------------------------------------------------------------
    console.log('\n--- 5. MOBILE VIEWPORT (390x844 - iPhone) ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await mobilePage.evaluate(() => window.scrollTo(0, 800));
    await mobilePage.waitForTimeout(100);

    await mobilePage.goto('http://localhost:5173/products', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(250);

    const mobileScroll = await mobilePage.evaluate(() => window.scrollY);
    console.log(`      Mobile Shop page scroll position: ${mobileScroll}px`);
    assert(mobileScroll <= 20, `Mobile Shop page started at top (scrollY = ${mobileScroll})`);

    // Verify category switch on mobile
    await mobilePage.evaluate(() => window.scrollTo(0, 700));
    await mobilePage.goto('http://localhost:5173/products?gender=nu', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(250);
    const mobileNuScroll = await mobilePage.evaluate(() => window.scrollY);
    console.log(`      Mobile Nữ page scroll position: ${mobileNuScroll}px`);
    assert(mobileNuScroll <= 30, `Mobile Nữ page started at top (scrollY = ${mobileNuScroll})`);

    await mobileContext.close();

    // -------------------------------------------------------------
    // SUITE 6: MOBILE ANDROID VIEWPORT (360x800)
    // -------------------------------------------------------------
    console.log('\n--- 6. MOBILE ANDROID VIEWPORT (360x800) ---');
    const androidContext = await browser.newContext({
      viewport: { width: 360, height: 800 },
      isMobile: true,
      hasTouch: true,
    });
    const androidPage = await androidContext.newPage();

    await androidPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await androidPage.evaluate(() => window.scrollTo(0, 800));
    await androidPage.waitForTimeout(100);

    await androidPage.goto('http://localhost:5173/products', { waitUntil: 'networkidle' });
    await androidPage.waitForTimeout(250);

    const androidScroll = await androidPage.evaluate(() => window.scrollY);
    console.log(`      Android 360x800 Shop page scroll position: ${androidScroll}px`);
    assert(androidScroll <= 20, `Android Shop page started at top (scrollY = ${androidScroll})`);

    await androidContext.close();

  } catch (err) {
    console.error('Test Suite encountered an error:', err);
    failedTests++;
  } finally {
    await browser.close();
  }

  console.log('\n======================================================================');
  console.log(`   TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('======================================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runScrollTests();
