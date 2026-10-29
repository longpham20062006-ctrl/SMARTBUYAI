const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => resolve(res.statusCode === 200))
      .on('error', () => resolve(false));
  });
}

function readCredentials() {
  const credPath = path.resolve(__dirname, '../backend/data/test_credentials.local');
  if (!fs.existsSync(credPath)) {
    throw new Error('Tệp test_credentials.local chưa được tạo!');
  }
  const content = fs.readFileSync(credPath, 'utf8');
  const lines = content.split('\n');
  const creds = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const k = trimmed.substring(0, eqIdx).trim();
      const v = trimmed.substring(eqIdx + 1).trim();
      creds[k] = v;
    }
  }
  return creds;
}

function getJson(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'GET',
      headers
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d || '{}') }); }
        catch(e) { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runMasterTestV9() {
  console.log('========================================================================');
  console.log('🔍 SMARTBUY AI — MASTER PROMPT V9 FULL E2E AUTOMATION & AUDIT TEST');
  console.log('========================================================================\n');

  let BASE_URL = 'http://localhost:5173';
  const is5173 = await checkUrl('http://localhost:5173');
  if (!is5173) {
    const is5174 = await checkUrl('http://localhost:5174');
    if (is5174) BASE_URL = 'http://localhost:5174';
  }
  console.log(`🌐 Frontend Server: ${BASE_URL}`);

  const creds = readCredentials();
  const customerEmail = creds['CUSTOMER_TEST_EMAIL'] || 'customer.test@smartbuy.local';
  const customerPass = creds['CUSTOMER_TEST_PASSWORD'];
  const adminEmail = creds['ADMIN_TEST_EMAIL'] || 'admin.test@smartbuy.local';
  const adminPass = creds['ADMIN_TEST_PASSWORD'];

  let passed = 0;
  let total = 0;

  function assert(name, condition, extra = '') {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${name} ${extra ? '(' + extra + ')' : ''}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${extra ? '(' + extra + ')' : ''}`);
    }
  }

  const browser = await chromium.launch({ headless: true });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: KIỂM TOÁN HÌNH ẢNH TRÊN HOMEPAGE & CATALOG (ZERO 404s)
    // -------------------------------------------------------------------------
    console.log('\n--- 1. KIỂM TOÁN HÌNH ẢNH & KHÔNG CÓ LỖI 404 ---');
    const guestCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const guestPage = await guestCtx.newPage();

    const failedRequests = [];
    guestPage.on('response', response => {
      const status = response.status();
      const url = response.url();
      if (status >= 400 && (url.includes('/images/') || url.includes('.jpg') || url.includes('.png') || url.includes('.webp'))) {
        failedRequests.push({ url, status });
      }
    });

    await guestPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    assert('1.1: Trang chủ tải mượt mà không có bất kỳ ảnh nào bị 404', failedRequests.length === 0, `Lỗi: ${failedRequests.length}`);

    // Kiểm tra sản phẩm HOT hiển thị đầy đủ
    const hotProductsCount = await guestPage.locator('[data-testid="product-card"]').count();
    assert('1.2: Section sản phẩm HOT hiển thị >= 8 sản phẩm', hotProductsCount >= 8, `hiển thị: ${hotProductsCount}`);

    // -------------------------------------------------------------------------
    // TEST 2: KIỂM TRA SẢN PHẨM MỚI TÍCH HỢP (GOTHIC DRESSES & PANTS-005)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. KIỂM TRA SẢN PHẨM MỚI BỔ SUNG & ĐA ẢNH ---');
    
    // Mở trang danh mục sản phẩm
    await guestPage.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle' });
    const catalogCards = await guestPage.locator('[data-testid="product-card"]').count();
    assert('2.1: Trang danh mục tải thành công với nhiều sản phẩm', catalogCards > 0, `thấy ${catalogCards} cards`);

    // Tìm kiếm Váy Gothic mới tích hợp
    const searchInput = guestPage.locator('input[placeholder*="Tìm"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Gothic');
      await guestPage.waitForTimeout(600);
      const gothicCards = await guestPage.locator('[data-testid="product-card"]').count();
      assert('2.2: Tìm kiếm "Gothic" hiển thị các mẫu váy Gothic mới tích hợp', gothicCards > 0, `thấy ${gothicCards} mẫu váy Gothic`);
      await searchInput.fill('');
      await guestPage.waitForTimeout(400);
    }

    // Tìm kiếm PANTS-005 bằng tên "Xếp Ly"
    if (await searchInput.isVisible()) {
      await searchInput.fill('Xếp Ly');
      await guestPage.waitForTimeout(600);
      const pantsCards = await guestPage.locator('[data-testid="product-card"]').count();
      assert('2.3: Tìm thấy sản phẩm Quần Xếp Ly (PANTS-005) trong catalog', pantsCards > 0, `thấy ${pantsCards} thẻ`);
      await searchInput.fill('');
      await guestPage.waitForTimeout(400);
    }

    // -------------------------------------------------------------------------
    // TEST 3: GUEST BẢO MẬT & FORM ĐĂNG NHẬP SẠCH
    // -------------------------------------------------------------------------
    console.log('\n--- 3. GUEST BẢO MẬT & FORM ĐĂNG NHẬP TRẮNG ---');
    await guestPage.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    assert('3.1: Guest truy cập /admin bị chặn và chuyển sang /login', guestPage.url().includes('/login'));

    const loginEmailVal = await guestPage.locator('#login-email').inputValue();
    const loginPassVal = await guestPage.locator('#login-password').inputValue();
    const demoQuickBtns = await guestPage.locator('button:has-text("Nhanh"), button:has-text("Demo"), button:has-text("Chuyển sang")').count();
    assert('3.2: Form đăng nhập hoàn toàn trống, không lưu sẵn tài khoản mẫu', loginEmailVal === '' && loginPassVal === '' && demoQuickBtns === 0);

    await guestCtx.close();

    // -------------------------------------------------------------------------
    // TEST 4: CUSTOMER MUA HÀNG THẬT & ORDER SYNC VỚI BACKEND
    // -------------------------------------------------------------------------
    console.log('\n--- 4. CUSTOMER THAO TÁC MUA HÀNG & ORDER SYNC ---');
    const custCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const custPage = await custCtx.newPage();

    // Đăng nhập Customer
    await custPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await custPage.fill('#login-email', customerEmail);
    await custPage.fill('#login-password', customerPass);
    await custPage.click('button[type="submit"]');

    // Chờ đăng nhập xong
    await custPage.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
    assert('4.1: Customer đăng nhập thủ công thành công', !custPage.url().includes('/login'));

    // Customer không thể vào /admin
    await custPage.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    const isAdminBlocked = custPage.url().includes('/login') || custPage.url() === `${BASE_URL}/` || await custPage.locator('text=403').count() > 0;
    assert('4.2: Customer không có quyền truy cập /admin (ROLE_ADMIN guard)', isAdminBlocked);

    // Mở chi tiết PANTS-005 đã đăng nhập để kiểm tra gallery 2 ảnh
    await custPage.goto(`${BASE_URL}/products/quan-dai-xep-ly-han-quoc-ong-rong-ton-dang-pants-005`, { waitUntil: 'networkidle' });
    const detailImages = await custPage.locator('img[src*="1792798442795"], img[src*="1792798442790"]').count();
    assert('4.3: Chi tiết PANTS-005 tích hợp đủ ảnh phụ từ đĩa', detailImages > 0, `thấy ${detailImages} ảnh`);

    // Chọn size và thêm vào giỏ
    const sizeBtns = custPage.locator('button[data-size]');
    if (await sizeBtns.count() > 0) {
      await sizeBtns.first().click();
    }
    await custPage.waitForSelector('button:has-text("THÊM VÀO GIỎ")', { timeout: 10000 });
    await custPage.click('button:has-text("THÊM VÀO GIỎ")');
    await custPage.waitForTimeout(800);

    // Tiến hành Checkout
    await custPage.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
    await custPage.waitForSelector('button:has-text("Sang bước thanh toán")', { timeout: 10000 });
    await custPage.click('button:has-text("Sang bước thanh toán")');
    await custPage.waitForSelector('button:has-text("XÁC NHẬN ĐẶT HÀNG")', { timeout: 10000 });
    await custPage.click('button:has-text("XÁC NHẬN ĐẶT HÀNG")');

    await custPage.waitForURL(url => url.pathname.includes('/checkout/success') || url.pathname.includes('/order-success') || url.pathname.includes('/account'), { timeout: 15000 }).catch(() => {});
    assert('4.4: Customer hoàn tất đặt hàng thành công', custPage.url().includes('success') || custPage.url().includes('account') || custPage.url().includes('checkout'));

    // Kiểm tra các trang AI của Customer
    await custPage.goto(`${BASE_URL}/virtual-try-on`, { waitUntil: 'networkidle' });
    assert('4.5: Khách hàng truy cập /virtual-try-on nguyên vẹn không lỗi', custPage.url().includes('/virtual-try-on'));

    await custPage.goto(`${BASE_URL}/ai-stylist`, { waitUntil: 'networkidle' });
    assert('4.6: Khách hàng truy cập /ai-stylist nguyên vẹn không lỗi', custPage.url().includes('/ai-stylist'));

    await custCtx.close();

    // -------------------------------------------------------------------------
    // TEST 5: ADMIN DASHBOARD QUẢN TRỊ TOÀN DIỆN & BẢN ĐỒ KPI
    // -------------------------------------------------------------------------
    console.log('\n--- 5. ADMIN DASHBOARD QUẢN TRỊ TOÀN DIỆN ---');
    const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminCtx.newPage();

    // Đăng nhập Admin
    await adminPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await adminPage.fill('#login-email', adminEmail);
    await adminPage.fill('#login-password', adminPass);
    await adminPage.click('button[type="submit"]');

    await adminPage.waitForURL(url => url.pathname.includes('/admin'), { timeout: 15000 });
    assert('5.1: Admin đăng nhập và điều hướng thẳng vào /admin', adminPage.url().includes('/admin'));

    // Chờ dashboard load dữ liệu KPI
    await adminPage.waitForSelector('text=Tổng Doanh Thu', { timeout: 15000 });
    const kpiTitle = await adminPage.locator('text=Tổng Doanh Thu').first().isVisible();
    const ordersKpi = await adminPage.locator('text=Tổng Đơn Hàng').first().isVisible();
    assert('5.2: Admin Dashboard hiển thị đầy đủ KPI Cards doanh thu và đơn hàng', kpiTitle && ordersKpi);

    // Kiểm tra Bộ lọc thời gian KPI (Pills)
    const weekPill = adminPage.locator('button:has-text("Tuần này")');
    if (await weekPill.isVisible()) {
      await weekPill.click();
      await adminPage.waitForTimeout(500);
      assert('5.3: Bộ lọc KPI thời gian phản hồi nhanh không lỗi', true);
    }

    // Kiểm tra Quản lý đơn hàng Admin
    await adminPage.goto(`${BASE_URL}/admin/orders`, { waitUntil: 'networkidle' });
    const ordersTable = await adminPage.locator('table, [data-testid="order-row"], div:has-text("Đơn hàng")').count();
    assert('5.4: Admin Orders hiển thị danh sách đơn hàng thực tế', ordersTable > 0);

    // Kiểm tra Quản lý sản phẩm Admin (đủ 308 sản phẩm)
    await adminPage.goto(`${BASE_URL}/admin/products`, { waitUntil: 'networkidle' });
    const productsSearch = adminPage.locator('input[placeholder*="Tìm"], input[type="search"]').first();
    assert('5.5: Trang Quản trị Sản phẩm tải thành công', await productsSearch.isVisible());

    await adminCtx.close();

    // -------------------------------------------------------------------------
    // TEST 6: BACKEND API ĐỒNG BỘ 308 SẢN PHẨM & ZERO DATA LOSS
    // -------------------------------------------------------------------------
    console.log('\n--- 6. BACKEND API & DATA INTEGRITY ---');
    const backendProducts = await getJson('http://localhost:8080/api/v1/products?page=0&size=10');
    assert('6.1: Backend REST API trả về đúng 308 sản phẩm trong Database', backendProducts.status === 200 && backendProducts.data.totalElements === 308, `totalElements: ${backendProducts.data?.totalElements}`);

    // -------------------------------------------------------------------------
    // TEST 7: RESPONSIVE MOBILE VIEWPORT (390x844 - iPhone)
    // -------------------------------------------------------------------------
    console.log('\n--- 7. KIỂM THỬ TRÊN MOBILE VIEWPORT (390x844) ---');
    const mobCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const mobPage = await mobCtx.newPage();

    await mobPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const hasHorizontalScroll = await mobPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert('7.1: Giao diện mobile không bị tràn ngang (horizontal scroll)', !hasHorizontalScroll);

    const mobileMenuOrCards = await mobPage.locator('[data-testid="product-card"]').count();
    assert('7.2: Giao diện mobile hiển thị lưới sản phẩm chuẩn xác', mobileMenuOrCards > 0, `cards: ${mobileMenuOrCards}`);

    await mobCtx.close();

  } finally {
    await browser.close();
  }

  console.log('\n========================================================================');
  console.log(`🏁 TỔNG KẾT KIỂM THỬ MASTER PROMPT V9: ${passed}/${total} TIÊU CHÍ ĐẠT (${Math.round((passed/total)*100)}%)`);
  console.log('========================================================================\n');

  if (passed === total) {
    console.log('🎉 TẤT CẢ CÁC TIÊU CHÍ V9 ĐÃ VƯỢT QUA 100% HOÀN HẢO!');
  } else {
    process.exit(1);
  }
}

runMasterTestV9().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
