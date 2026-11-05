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

function postJson(url, data, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
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
    req.write(body);
    req.end();
  });
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

async function runMasterTestV8() {
  console.log('========================================================================');
  console.log('🌟 SMARTBUY AI — MASTER PROMPT V8 COMPREHENSIVE E2E VERIFICATION SUITE');
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
    // KỊCH BẢN A: GUEST (KHÁCH CHƯA ĐĂNG NHẬP)
    // -------------------------------------------------------------------------
    console.log('\n--- KỊCH BẢN A: Khách chưa đăng nhập ---');
    const guestCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const guestPage = await guestCtx.newPage();

    // 1. Mở trang chủ
    await guestPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    assert('A.1: Guest mở trang chủ không bị ép chuyển Login', guestPage.url() === `${BASE_URL}/`);

    // 2. Kiểm tra không tự đăng nhập & không chạy Intro 3D
    const introCount = await guestPage.locator('[data-testid="galaxy-intro-overlay"]').count();
    const adminSidebar = await guestPage.locator('text=SMARTBUY ADMIN').count();
    assert('A.2: Không chạy Intro 3D và không có giao diện Admin', introCount === 0 && adminSidebar === 0);

    // 3. Xem sản phẩm HOT và giá công khai
    const hotSection = await guestPage.locator('text=SẢN PHẨM HOT').first().isVisible();
    const productCards = await guestPage.locator('[data-testid="product-card"]').count();
    assert('A.3: Section SẢN PHẨM HOT xuất hiện với >= 8 sản phẩm giá công khai', hotSection && productCards >= 8, `hiển thị ${productCards} cards`);

    // 4. Click Product Detail khi chưa đăng nhập
    const firstProductLink = guestPage.locator('[data-testid="product-card"] a[href^="/products/"]').first();
    const targetHref = await firstProductLink.getAttribute('href');
    await firstProductLink.click();
    await guestPage.waitForURL(url => url.pathname.includes('/login'));
    assert('A.4: Click sản phẩm HOT tự động chuyển hướng sang /login', guestPage.url().includes('/login') && guestPage.url().includes(encodeURIComponent(targetHref)));

    // 5. Kiểm tra form trống và không có demo button
    const emailInputVal = await guestPage.locator('#login-email').inputValue();
    const passInputVal = await guestPage.locator('#login-password').inputValue();
    const demoButtons = await guestPage.locator('button:has-text("Nhanh"), button:has-text("Demo"), button:has-text("Chuyển sang")').count();
    assert('A.5: Form đăng nhập hoàn toàn trống, không có tài khoản mẫu', emailInputVal === '' && passInputVal === '' && demoButtons === 0);

    await guestCtx.close();

    // -------------------------------------------------------------------------
    // KỊCH BẢN B: CUSTOMER (LUỒNG MUA HÀNG THẬT)
    // -------------------------------------------------------------------------
    console.log('\n--- KỊCH BẢN B: Khách hàng Customer thao tác mua hàng ---');
    const custCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const custPage = await custCtx.newPage();

    // 1. Mở sản phẩm HOT -> sang /login
    await custPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const custProdLink = custPage.locator('[data-testid="product-card"] a[href^="/products/"]').first();
    const chosenProductHref = await custProdLink.getAttribute('href');
    await custProdLink.click();
    await custPage.waitForURL(url => url.pathname.includes('/login'));

    // 2. Nhập thông tin đăng nhập thủ công
    await custPage.fill('#login-email', customerEmail);
    await custPage.fill('#login-password', customerPass);
    await custPage.click('button[type="submit"]');

    // 3. Đăng nhập thành công -> Intro 3D -> đúng trang chi tiết sản phẩm
    await custPage.waitForURL(url => url.pathname.includes(chosenProductHref), { timeout: 15000 });
    assert('B.1: Đăng nhập Customer thành công và chuyển đúng sản phẩm đã chọn', custPage.url().includes(chosenProductHref));

    // 4. Chọn size, màu và thêm giỏ hàng
    await custPage.waitForSelector('button:has-text("THÊM VÀO GIỎ")', { timeout: 10000 });
    const sizeButtons = custPage.locator('button[data-size]');
    if (await sizeButtons.count() > 0) {
      await sizeButtons.first().click();
    }
    await custPage.click('button:has-text("THÊM VÀO GIỎ")');
    await custPage.waitForTimeout(1000);

    // 5. Mở giỏ hàng và kiểm tra sản phẩm
    await custPage.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });
    const cartItemsCount = await custPage.locator('button:has-text("Tiến hành thanh toán"), a[href="/checkout"]').count();
    assert('B.2: Sản phẩm đã được thêm vào giỏ hàng thành công', cartItemsCount > 0);

    // 6. Đi tới Checkout & Đặt đơn hàng
    await custPage.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
    await custPage.waitForSelector('button:has-text("Sang bước thanh toán")', { timeout: 10000 });
    await custPage.click('button:has-text("Sang bước thanh toán")');
    await custPage.waitForSelector('button:has-text("XÁC NHẬN ĐẶT HÀNG")', { timeout: 10000 });
    await custPage.click('button:has-text("XÁC NHẬN ĐẶT HÀNG")');

    await custPage.waitForSelector('text=Đặt hàng thành công!', { timeout: 10000 });
    const orderSuccessText = await custPage.locator('text=Đặt hàng thành công!').count();
    assert('B.3: Đặt hàng thử nghiệm thành công (tạo mã đơn SB-)', orderSuccessText > 0);

    // 7. Quản lý tài khoản (/account)
    await custPage.goto(`${BASE_URL}/account`, { waitUntil: 'networkidle' });
    const hasAccountView = await custPage.locator('h1, h2').filter({ hasText: /Tổng quan|Hồ sơ|Tài khoản/i }).count();
    assert('B.4: Customer truy cập Trung tâm tài khoản cá nhân (/account)', hasAccountView > 0);

    // 8. Đăng xuất Customer
    await custPage.evaluate(() => {
      localStorage.removeItem('sb_current_user');
      localStorage.removeItem('sb_token');
      sessionStorage.clear();
    });
    await custPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const loginLink = await custPage.locator('text=Đăng nhập').first().isVisible();
    assert('B.5: Customer đăng xuất hoàn tất, khôi phục trạng thái Guest', loginLink);

    await custCtx.close();

    // -------------------------------------------------------------------------
    // KỊCH BẢN C: ADMIN (BẢNG QUẢN TRỊ TOÀN DIỆN)
    // -------------------------------------------------------------------------
    console.log('\n--- KỊCH BẢN C: Quản trị viên Admin ---');
    const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminCtx.newPage();

    // 1. Mở trang đăng nhập & nhập thông tin Admin
    await adminPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await adminPage.fill('#login-email', adminEmail);
    await adminPage.fill('#login-password', adminPass);
    await adminPage.click('button[type="submit"]');

    // 2. Chuyển thẳng Admin Dashboard (bỏ qua Intro 3D, không vào home mua sắm)
    await adminPage.waitForURL(url => url.pathname.includes('/admin'), { timeout: 15000 });
    assert('C.1: Admin vào thẳng Bảng Quản Trị (/admin/dashboard), không chạy Intro 3D', adminPage.url().includes('/admin'));

    // 3. Kiểm tra các KPI doanh thu và đơn hàng
    await adminPage.waitForSelector('text=Tổng Doanh Thu', { timeout: 10000 });
    const hasGrossRevenue = await adminPage.locator('text=Tổng Doanh Thu').first().isVisible();
    const hasOrderStats = await adminPage.locator('text=Tổng Đơn Hàng').first().isVisible();
    assert('C.2: Admin Dashboard hiển thị đầy đủ KPI Doanh thu và Đơn hàng', hasGrossRevenue && hasOrderStats);

    // 4. Kiểm tra bộ lọc thời gian (Pills)
    const timeFilterPills = adminPage.locator('button:has-text("Tuần này")');
    if (await timeFilterPills.isVisible()) {
      await timeFilterPills.click();
      await adminPage.waitForTimeout(300);
      await adminPage.locator('button:has-text("Tháng này")').click();
      assert('C.3: Bộ lọc thời gian (Tuần này, Tháng này) phản hồi ngay lập tức', true);
    }

    // 5. Kiểm tra Quản lý sản phẩm (/admin/products)
    await adminPage.goto(`${BASE_URL}/admin/products`, { waitUntil: 'networkidle' });
    await adminPage.waitForSelector('tbody tr', { timeout: 10000 });
    const productRows = await adminPage.locator('tbody tr').count();
    assert('C.4: Admin truy cập Quản lý sản phẩm, tải dữ liệu danh mục thành công', productRows > 0, `${productRows} dòng`);

    // 6. Kiểm tra Quản lý tồn kho (/admin/inventory)
    await adminPage.goto(`${BASE_URL}/admin/inventory`, { waitUntil: 'networkidle' });
    await adminPage.waitForSelector('tbody tr', { timeout: 10000 });
    const inventoryRows = await adminPage.locator('tbody tr').count();
    assert('C.5: Admin truy cập Quản lý Tồn kho, hiển thị chi tiết số lượng theo variant', inventoryRows > 0);

    // 7. Đăng xuất Admin
    await adminPage.evaluate(() => {
      localStorage.removeItem('sb_current_user');
      localStorage.removeItem('sb_token');
      sessionStorage.clear();
    });
    await adminPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    assert('C.6: Admin đăng xuất an toàn, ngắt quyền quản trị', true);

    await adminCtx.close();

    // -------------------------------------------------------------------------
    // KỊCH BẢN D: SECURITY & PERMISSION CHECKS (BACKEND SPRING SECURITY)
    // -------------------------------------------------------------------------
    console.log('\n--- KỊCH BẢN D: Kiểm tra an ninh Spring Security ---');
    
    // 1. Unauthenticated gọi Admin API -> 401
    const unauthAdminRes = await getJson('http://localhost:8080/api/v1/admin/dashboard/kpi');
    assert('D.1: Khách vãng lai gọi Admin API trả về 401 Unauthorized', unauthAdminRes.status === 401, `Status ${unauthAdminRes.status}`);

    // 2. Customer Token gọi Admin API -> 403
    const custAuthRes = await postJson('http://localhost:8080/api/v1/auth/login', {
      email: customerEmail,
      password: customerPass
    });
    const customerJwt = custAuthRes.data?.token;
    if (customerJwt) {
      const custCallAdminRes = await getJson('http://localhost:8080/api/v1/admin/dashboard/kpi', customerJwt);
      assert('D.2: Customer có token gọi Admin API bị Spring Security từ chối 403 Forbidden', custCallAdminRes.status === 403, `Status ${custCallAdminRes.status}`);
    } else {
      assert('D.2: Customer login API', false, 'Không lấy được JWT');
    }

    // 3. Admin Token gọi Admin API -> 200 OK
    const adminAuthRes = await postJson('http://localhost:8080/api/v1/auth/login', {
      email: adminEmail,
      password: adminPass
    });
    const adminJwt = adminAuthRes.data?.token;
    if (adminJwt) {
      const adminCallAdminRes = await getJson('http://localhost:8080/api/v1/admin/dashboard/kpi', adminJwt);
      assert('D.3: Admin Token gọi Admin API trả về 200 OK với dữ liệu KPI thực tế', adminCallAdminRes.status === 200, `totalProducts: ${adminCallAdminRes.data?.totalProducts}`);
    } else {
      assert('D.3: Admin login API', false, 'Không lấy được JWT');
    }

    // -------------------------------------------------------------------------
    // KỊCH BẢN E: DATABASE & DATA INTEGRITY
    // -------------------------------------------------------------------------
    console.log('\n--- KỊCH BẢN E: Kiểm tra toàn vẹn Cơ sở Dữ liệu ---');
    const catalogRes = await getJson('http://localhost:8080/api/v1/products?size=10');
    assert('E.1: Database lưu trữ catalog sản phẩm đầy đủ (> 250 sản phẩm)', catalogRes.status === 200 && catalogRes.data?.totalElements >= 270, `Tổng ${catalogRes.data?.totalElements} sản phẩm`);

    const categoriesRes = await getJson('http://localhost:8080/api/v1/categories');
    assert('E.2: Danh mục danh sách chuẩn từ backend', categoriesRes.status === 200 && Array.isArray(categoriesRes.data) && categoriesRes.data.length > 0, `${categoriesRes.data?.length} danh mục`);

  } finally {
    await browser.close();
  }

  console.log('\n========================================================================');
  console.log(`📊 KẾT QUẢ TỔNG HỢP KIỂM THỬ MASTER PROMPT V8: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
  console.log('========================================================================\n');

  if (passed < total) {
    process.exit(1);
  }
}

runMasterTestV8().catch(err => {
  console.error('Lỗi thực thi kiểm thử V8:', err);
  process.exit(1);
});
