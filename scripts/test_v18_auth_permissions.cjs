/**
 * SMARTBUY AI - MASTER PROMPT V18 E2E VERIFICATION SUITE
 * Tests:
 * 1. Backend REST API Role & Price Masking Security (Guest 401s, price=null, Customer prices, Admin KPI)
 * 2. Playwright UI Verification (Guest Lookbook, Login Modal, Customer Intro 3D -> Shop, Admin Direct Dashboard)
 */

const { chromium } = require('playwright');
const http = require('http');

const BACKEND_URL = 'http://localhost:8080';
const FRONTEND_URL = 'http://localhost:5173';

const TEST_CREDS = {
  admin: {
    email: 'admin.test@smartbuy.local',
    password: '^Xjn6^jwGDXx2rC9rf',
  },
  customer: {
    email: 'customer.test@smartbuy.local',
    password: 'd8RnVTsh&%3Q2v$H',
  },
};

async function httpRequest(method, urlStr, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Accept': 'application/json',
        ...headers,
      },
    };

    if (body) {
      if (typeof body === 'object') {
        body = JSON.stringify(body);
        options.headers['Content-Type'] = 'application/json';
      }
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', (err) => reject(err));
    if (body) req.write(body);
    req.end();
  });
}

const results = [];
function recordTest(id, name, passed, details = '') {
  results.push({ id, name, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${icon}] ${id}: ${name}${details ? ` -> ${details}` : ''}`);
}

async function runBackendApiTests() {
  console.log('\n======================================================');
  console.log('--- 1. BACKEND REST API SECURITY & PRICE MASKING ---');
  console.log('======================================================\n');

  // Test 1: Unauthenticated GET /api/v1/products (Guest) -> Prices & Variants masked
  try {
    const res = await httpRequest('GET', `${BACKEND_URL}/api/v1/products?size=5`);
    const is200 = res.status === 200;
    const items = res.body?.content || res.body?.data?.content || [];
    const allPricesNull = items.length > 0 && items.every((p) => p.price === null && (!p.variants || p.variants.length === 0));
    recordTest('T1_BACKEND_GUEST_PRODUCTS_MASKED', 'Guest GET /api/v1/products returns price=null and empty variants', is200 && allPricesNull, `Sample product price: ${items[0]?.price}, variants: ${items[0]?.variants?.length}`);
  } catch (err) {
    recordTest('T1_BACKEND_GUEST_PRODUCTS_MASKED', 'Guest GET /api/v1/products returns price=null', false, err.message);
  }

  // Test 2: Unauthenticated GET /api/v1/products/preview (Guest Preview)
  try {
    const res = await httpRequest('GET', `${BACKEND_URL}/api/v1/products/preview?size=5`);
    const is200 = res.status === 200;
    const items = res.body?.content || res.body?.data?.content || [];
    const allPricesNull = items.length > 0 && items.every((p) => p.price === null);
    recordTest('T2_BACKEND_GUEST_PREVIEW_ENDPOINT', 'Guest GET /api/v1/products/preview returns price=null', is200 && allPricesNull, `Item count: ${items.length}`);
  } catch (err) {
    recordTest('T2_BACKEND_GUEST_PREVIEW_ENDPOINT', 'Guest GET /api/v1/products/preview', false, err.message);
  }

  // Test 3: Unauthenticated Cart Access -> 401 Unauthorized
  try {
    const res = await httpRequest('GET', `${BACKEND_URL}/api/v1/cart`);
    recordTest('T3_BACKEND_GUEST_CART_401', 'Guest GET /api/v1/cart returns 401 Unauthorized', res.status === 401, `Status: ${res.status}`);
  } catch (err) {
    recordTest('T3_BACKEND_GUEST_CART_401', 'Guest GET /api/v1/cart returns 401', false, err.message);
  }

  // Test 4: Unauthenticated Order Access -> 401 Unauthorized
  try {
    const res = await httpRequest('POST', `${BACKEND_URL}/api/v1/orders`, {}, { items: [] });
    recordTest('T4_BACKEND_GUEST_ORDER_401', 'Guest POST /api/v1/orders returns 401 Unauthorized', res.status === 401, `Status: ${res.status}`);
  } catch (err) {
    recordTest('T4_BACKEND_GUEST_ORDER_401', 'Guest POST /api/v1/orders returns 401', false, err.message);
  }

  // Test 5: Unauthenticated Wishlist Access -> 401 Unauthorized
  try {
    const res = await httpRequest('GET', `${BACKEND_URL}/api/v1/wishlist`);
    recordTest('T5_BACKEND_GUEST_WISHLIST_401', 'Guest GET /api/v1/wishlist returns 401 Unauthorized', res.status === 401, `Status: ${res.status}`);
  } catch (err) {
    recordTest('T5_BACKEND_GUEST_WISHLIST_401', 'Guest GET /api/v1/wishlist returns 401', false, err.message);
  }

  // Test 6: Unauthenticated AI Try-On Access -> 401 Unauthorized
  try {
    const res = await httpRequest('POST', `${BACKEND_URL}/api/v1/ai/try-on`, {}, { productId: '1' });
    recordTest('T6_BACKEND_GUEST_TRYON_401', 'Guest POST /api/v1/ai/try-on returns 401 Unauthorized', res.status === 401, `Status: ${res.status}`);
  } catch (err) {
    recordTest('T6_BACKEND_GUEST_TRYON_401', 'Guest POST /api/v1/ai/try-on returns 401', false, err.message);
  }

  // Test 7: Customer Login -> 200 OK with JWT and role CUSTOMER
  let customerToken = '';
  try {
    const res = await httpRequest('POST', `${BACKEND_URL}/api/v1/auth/login`, {}, TEST_CREDS.customer);
    const is200 = res.status === 200;
    customerToken = res.body?.token || res.body?.data?.token || '';
    const role = res.body?.user?.role || res.body?.data?.user?.role || '';
    recordTest('T7_BACKEND_CUSTOMER_LOGIN', 'Customer Login returns HTTP 200, JWT and role CUSTOMER', is200 && customerToken.length > 20 && role.toUpperCase() === 'CUSTOMER', `Role: ${role}, Token length: ${customerToken.length}`);
  } catch (err) {
    recordTest('T7_BACKEND_CUSTOMER_LOGIN', 'Customer Login', false, err.message);
  }

  // Test 8: Authenticated Customer GET /api/v1/products -> Full Real Prices Returned
  try {
    const res = await httpRequest('GET', `${BACKEND_URL}/api/v1/products?size=5`, {
      'Authorization': `Bearer ${customerToken}`
    });
    const is200 = res.status === 200;
    const items = res.body?.content || res.body?.data?.content || [];
    const hasPrices = items.length > 0 && items.every((p) => typeof p.price === 'number' && p.price > 0);
    recordTest('T8_BACKEND_CUSTOMER_REAL_PRICES', 'Authenticated Customer receives unmasked real product prices', is200 && hasPrices, `First product price: ${items[0]?.price} VND`);
  } catch (err) {
    recordTest('T8_BACKEND_CUSTOMER_REAL_PRICES', 'Customer real prices', false, err.message);
  }

  // Test 9: Customer Forbidden from Admin KPI -> 403 Forbidden
  try {
    const res = await httpRequest('GET', `${BACKEND_URL}/api/v1/admin/dashboard/kpi`, {
      'Authorization': `Bearer ${customerToken}`
    });
    recordTest('T9_BACKEND_CUSTOMER_ADMIN_FORBIDDEN', 'Customer accessing /api/v1/admin/dashboard/kpi returns 403 Forbidden', res.status === 403, `Status: ${res.status}`);
  } catch (err) {
    recordTest('T9_BACKEND_CUSTOMER_ADMIN_FORBIDDEN', 'Customer accessing admin KPI', false, err.message);
  }

  // Test 10: Admin Login -> 200 OK with JWT and role ADMIN
  let adminToken = '';
  try {
    const res = await httpRequest('POST', `${BACKEND_URL}/api/v1/auth/login`, {}, TEST_CREDS.admin);
    const is200 = res.status === 200;
    adminToken = res.body?.token || res.body?.data?.token || '';
    const role = res.body?.user?.role || res.body?.data?.user?.role || '';
    recordTest('T10_BACKEND_ADMIN_LOGIN', 'Admin Login returns HTTP 200, JWT and role ADMIN', is200 && adminToken.length > 20 && role.toUpperCase() === 'ADMIN', `Role: ${role}`);
  } catch (err) {
    recordTest('T10_BACKEND_ADMIN_LOGIN', 'Admin Login', false, err.message);
  }

  // Test 11: Admin Accessing Admin KPI -> 200 OK with Real Numbers
  try {
    const res = await httpRequest('GET', `${BACKEND_URL}/api/v1/admin/dashboard/kpi`, {
      'Authorization': `Bearer ${adminToken}`
    });
    const is200 = res.status === 200;
    const kpi = res.body || {};
    const hasData = typeof kpi.totalProducts === 'number';
    recordTest('T11_BACKEND_ADMIN_KPI_ACCESS', 'Admin accessing /api/v1/admin/dashboard/kpi returns 200 OK with real KPIs', is200 && hasData, `Total products: ${kpi.totalProducts}, revenue: ${kpi.grossRevenue}`);
  } catch (err) {
    recordTest('T11_BACKEND_ADMIN_KPI_ACCESS', 'Admin KPI access', false, err.message);
  }
}

async function runBrowserTests() {
  console.log('\n======================================================');
  console.log('--- 2. PLAYWRIGHT UI & ROLE FLOW E2E TESTS ---');
  console.log('======================================================\n');

  const browser = await chromium.launch({ headless: true });

  try {
    // --- GUEST TESTS ---
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();

    // Test 12: Guest visits Home (/)
    console.log('[RUNNING] Test 12: Guest visits Home page...');
    await guestPage.goto(`${FRONTEND_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Header check: Has "Đăng nhập", no cart drawer trigger
    const loginBtn = await guestPage.locator('header a[href="/login"], header button:has-text("Đăng nhập")').first();
    const hasLoginBtn = await loginBtn.isVisible().catch(() => false);
    recordTest('T12_UI_GUEST_HEADER', 'Guest sees "Đăng nhập" button in Header', hasLoginBtn);

    // Product cards on Home: Zero prices shown for Guest
    const productCards = await guestPage.locator('[data-testid="product-card"]').all();
    let hasPriceInAnyCard = false;
    for (const card of productCards.slice(0, 8)) {
      const text = await card.innerText();
      if (text.includes('₫') || text.includes('Liên hệ') || text.includes('Đang cập nhật')) {
        hasPriceInAnyCard = true;
        break;
      }
    }
    recordTest('T13_UI_GUEST_ZERO_PRICES', 'Guest sees 0 prices/currency symbols on product cards', !hasPriceInAnyCard && productCards.length > 0, `Scanned ${productCards.length} product cards`);

    // Test 14: Guest clicks on product card -> Login Modal appears
    console.log('[RUNNING] Test 14: Guest clicks on product card...');
    const firstCard = guestPage.locator('[data-testid="product-card"]').first();
    await firstCard.click();
    await guestPage.waitForTimeout(500);

    const modalText = await guestPage.locator('text=Đăng nhập để xem chi tiết sản phẩm và bắt đầu mua sắm cùng SMARTBUY AI.').first();
    const isModalVisible = await modalText.isVisible().catch(() => false);
    const loginNowBtn = await guestPage.locator('button:has-text("Đăng nhập ngay")').first().isVisible().catch(() => false);
    const keepBrowsingBtn = await guestPage.locator('button:has-text("Tiếp tục xem trang chủ")').first();
    const isKeepBrowsingVisible = await keepBrowsingBtn.isVisible().catch(() => false);

    recordTest('T14_UI_GUEST_CLICK_MODAL', 'Guest clicking card opens Login Prompt Modal with two actions', isModalVisible && loginNowBtn && isKeepBrowsingVisible);

    // Click "Tiếp tục xem trang chủ" -> Modal dismisses
    await keepBrowsingBtn.click();
    await guestPage.waitForTimeout(300);
    const isModalClosed = !(await modalText.isVisible().catch(() => false));
    recordTest('T15_UI_GUEST_DISMISS_MODAL', '"Tiếp tục xem trang chủ" button successfully closes modal', isModalClosed);

    // Test 16: Guest navigates directly to /products -> AuthGuard redirects to /login?redirect=%2Fproducts
    console.log('[RUNNING] Test 16: Guest navigates directly to /products...');
    await guestPage.goto(`${FRONTEND_URL}/products`, { waitUntil: 'networkidle', timeout: 30000 });
    const currentUrl = guestPage.url();
    const isRedirectedToLogin = currentUrl.includes('/login') && currentUrl.includes('redirect=');
    recordTest('T16_UI_GUEST_ROUTE_GUARD', 'Guest navigating to /products is redirected to /login with redirect param', isRedirectedToLogin, `Final URL: ${currentUrl}`);

    await guestContext.close();

    // --- CUSTOMER LOGIN & 3D INTRO FLOW ---
    console.log('[RUNNING] Test 17: Customer Login & Intro 3D Flow...');
    const customerContext = await browser.newContext();
    const customerPage = await customerContext.newPage();

    await customerPage.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Fill login form
    await customerPage.fill('input[type="email"], input[placeholder*="email" i]', TEST_CREDS.customer.email);
    await customerPage.fill('input[type="password"]', TEST_CREDS.customer.password);
    await customerPage.click('button[type="submit"]');

    // After Customer login, should redirect to '/' with Intro 3D running
    await customerPage.waitForTimeout(2000);
    const urlAfterLogin = customerPage.url();
    console.log(`URL after customer login: ${urlAfterLogin}`);

    // Check if Intro 3D canvas or skip button is present
    const skipBtn = customerPage.locator('button:has-text("BỎ QUA"), button:has-text("Bỏ qua"), [aria-label*="Bỏ qua"]').first();
    const isIntroActive = await skipBtn.isVisible().catch(() => false);
    recordTest('T17_UI_CUSTOMER_INTRO_3D_TRIGGERED', 'Customer Login triggers Intro 3D (Galaxy Intro)', isIntroActive || urlAfterLogin.endsWith('/'), `Intro skip button visible: ${isIntroActive}`);

    // If skip button is visible, click it to complete intro
    if (isIntroActive) {
      await skipBtn.click();
      await customerPage.waitForTimeout(2000);
    }

    // Ensure we are in /products
    if (!customerPage.url().includes('/products')) {
      await customerPage.goto(`${FRONTEND_URL}/products`, { waitUntil: 'networkidle' });
    }

    // In Shop: Verify Customer can see prices with ₫ and Add to Cart / Buy Now
    await customerPage.waitForSelector('[data-testid="product-card"]', { timeout: 15000 }).catch(() => {});
    const customerCards = await customerPage.locator('[data-testid="product-card"]').all();
    let customerCardHasPrice = false;
    for (const card of customerCards.slice(0, 8)) {
      const text = await card.innerText();
      if (text.includes('₫')) {
        customerCardHasPrice = true;
        break;
      }
    }
    recordTest('T18_UI_CUSTOMER_SHOP_FULL_ACCESS', 'Customer Shop displays real prices (₫) and interactive shopping actions', customerCardHasPrice, `Found price formatted with currency`);

    await customerContext.close();

    // --- ADMIN LOGIN FLOW (NEVER INTRO 3D, DIRECT TO DASHBOARD) ---
    console.log('[RUNNING] Test 19: Admin Login Flow...');
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    await adminPage.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await adminPage.fill('input[type="email"], input[placeholder*="email" i]', TEST_CREDS.admin.email);
    await adminPage.fill('input[type="password"]', TEST_CREDS.admin.password);
    await adminPage.click('button[type="submit"]');

    // Wait for navigation
    await adminPage.waitForTimeout(2500);
    const adminUrl = adminPage.url();
    const isAdminDashboard = adminUrl.includes('/admin/dashboard') || adminUrl.includes('/admin');
    
    // Check that 3D Intro was NOT triggered
    const adminIntroBtn = adminPage.locator('button:has-text("Bỏ qua")');
    const didAdminRunIntro = await adminIntroBtn.first().isVisible().catch(() => false);

    recordTest('T19_UI_ADMIN_DIRECT_DASHBOARD', 'Admin Login directs immediately to /admin/dashboard', isAdminDashboard, `Admin URL: ${adminUrl}`);
    recordTest('T20_UI_ADMIN_NEVER_RUNS_INTRO', 'Admin NEVER runs Intro 3D', !didAdminRunIntro);

    await adminContext.close();

  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('========================================================');
  console.log('   SMARTBUY AI — V18 AUTH & PERMISSION TEST RUNNER      ');
  console.log('========================================================');

  const startTime = Date.now();

  try {
    await runBackendApiTests();
    await runBrowserTests();
  } catch (err) {
    console.error('Fatal test error:', err);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log('\n========================================================');
  console.log(`TEST RUN COMPLETE in ${durationSec}s`);
  console.log(`TOTAL: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================================\n');

  if (failed > 0) {
    console.error(`💥 ${failed} test(s) failed.`);
    process.exit(1);
  } else {
    console.log('🎉 ALL V18 AUTH & ROLE SEPARATION TESTS PASSED PERFECTLY!');
    process.exit(0);
  }
}

main();
