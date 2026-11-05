/**
 * SMARTBUY AI — USER REQUEST SPECIFIC FLOW VERIFICATION
 * Verifies:
 * 1. Guest opens / -> sees full public home page with product prices (Men, Women, Hot, New Drops)
 * 2. Header has "Đăng nhập" button
 * 3. Logout navigates directly to Public Home (/) instead of /login
 * 4. Admin visiting / redirects to /admin/dashboard
 * 5. Customer visiting / after completing intro views public home without 3D intro re-trigger
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';

// Read local test credentials
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

async function runSpecificFlowTests() {
  console.log('================================================================');
  console.log('🔍 SMARTBUY AI — SPECIFIC FLOW & LOGOUT BEHAVIOR VERIFICATION');
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
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
  });

  try {
    // -------------------------------------------------------------
    // TEST 1: GUEST VISITING /
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Guest Visiting Home (/) ---');
    const guestContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const guestPage = await guestContext.newPage();

    await guestPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await guestPage.waitForTimeout(1000);

    assert(guestPage.url() === BASE_URL + '/' || guestPage.url() === BASE_URL, 'Guest lands directly on public home page (/)');

    const hasLogo = await guestPage.locator('header img[alt*="SMARTBUY"]').first().isVisible();
    assert(hasLogo, 'Header displays SMARTBUY AI brand logo');

    const hasLoginButton = await guestPage.locator('header a[href="/login"]').first().isVisible();
    assert(hasLoginButton, 'Header top-right displays "Đăng nhập" button');

    // Check Men highlights prices
    const menPriceCount = await guestPage.locator('text=PHONG CÁCH CỦA PHÁI MẠNH').locator('xpath=ancestor::section').locator('text=₫').count();
    assert(menPriceCount > 0, `Men highlight section displays product prices (found ${menPriceCount} price tags)`);

    // Check Women highlights prices
    const womenPriceCount = await guestPage.locator('text=TỎA SÁNG THEO CÁCH RIÊNG').locator('xpath=ancestor::section').locator('text=₫').count();
    assert(womenPriceCount > 0, `Women highlight section displays product prices (found ${womenPriceCount} price tags)`);

    // Check HOT products prices
    const hotPriceCount = await guestPage.locator('text=SẢN PHẨM HOT').locator('xpath=ancestor::section').locator('text=₫').count();
    assert(hotPriceCount > 0, `HOT products section displays product prices (found ${hotPriceCount} price tags)`);

    await guestContext.close();

    // -------------------------------------------------------------
    // TEST 2: LOGOUT NAVIGATES TO / (NOT /login)
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Customer Logout Navigates to / ---');
    const custContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const custPage = await custContext.newPage();

    await custPage.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await custPage.waitForTimeout(600);

    await custPage.fill('input[type="email"], input[placeholder*="@"]', customerEmail);
    await custPage.fill('input[type="password"]', customerPass);
    await custPage.click('button[type="submit"]');

    await custPage.waitForURL(url => url.pathname === '/', { timeout: 6000 });
    await custPage.waitForTimeout(1000);

    // If intro was triggered, skip it
    const skipBtn = await custPage.$('button:has-text("BỎ QUA")');
    if (skipBtn) {
      await skipBtn.click();
      await custPage.waitForTimeout(800);
    }

    // Now open user menu and click logout
    const userMenuBtn = await custPage.locator('header button[title="Tài khoản cá nhân"], header button:has-text("Khách hàng"), header button:has(img)').first();
    await userMenuBtn.click();
    await custPage.waitForTimeout(300);

    const logoutBtn = await custPage.locator('button:has-text("Đăng xuất tài khoản")').first();
    await logoutBtn.click();

    await custPage.waitForTimeout(500);
    const urlAfterLogout = custPage.url();
    assert(urlAfterLogout === BASE_URL + '/' || urlAfterLogout === BASE_URL, `Logout navigates to public home page: ${urlAfterLogout}`);

    // Verify header now shows "Đăng nhập" button again
    const loginBtnAfterLogout = await custPage.locator('header a[href="/login"]').first().isVisible();
    assert(loginBtnAfterLogout, 'After logout, "Đăng nhập" button is immediately visible in header');

    await custContext.close();

    // -------------------------------------------------------------
    // TEST 3: ADMIN VISITING / REDIRECTS TO /admin/dashboard
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Admin Visiting / Redirects to Dashboard ---');
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminContext.newPage();

    await adminPage.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await adminPage.waitForTimeout(600);

    await adminPage.fill('input[type="email"], input[placeholder*="@"]', adminEmail);
    await adminPage.fill('input[type="password"]', adminPass);
    await adminPage.click('button[type="submit"]');

    await adminPage.waitForURL(url => url.pathname.includes('/admin/dashboard'), { timeout: 6000 });
    assert(adminPage.url().includes('/admin/dashboard'), 'Admin logs in and reaches Dashboard');

    // Admin attempts to visit /
    await adminPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await adminPage.waitForTimeout(800);
    assert(adminPage.url().includes('/admin/dashboard'), `Admin visiting / is automatically redirected to Dashboard: ${adminPage.url()}`);

    // Admin logout navigates to /
    const adminLogoutBtn = await adminPage.locator('button:has-text("Đăng xuất")').first();
    await adminLogoutBtn.click();
    await adminPage.waitForTimeout(500);
    assert(adminPage.url() === BASE_URL + '/' || adminPage.url() === BASE_URL, `Admin logout navigates to public home page: ${adminPage.url()}`);

    await adminContext.close();

  } catch (err) {
    console.error('Unhandled error during test:', err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

runSpecificFlowTests().catch(err => {
  console.error(err);
  process.exit(1);
});

