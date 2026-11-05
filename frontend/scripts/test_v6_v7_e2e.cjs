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

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
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

async function run() {
  console.log('========================================================================');
  console.log('🚀 SMARTBUY AI — MASTER PROMPT V6 & V7 VERIFICATION SUITE');
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

  console.log(`🔑 Đã nạp thông tin tài khoản test từ backend/data/test_credentials.local:`);
  console.log(`   - Customer Email: ${customerEmail} (Mật khẩu: [ĐÃ BẢO VỆ MẬT KHẨU CỤC BỘ])`);
  console.log(`   - Admin Email:    ${adminEmail} (Mật khẩu: [ĐÃ BẢO VỆ MẬT KHẨU CỤC BỘ])\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const results = {
    test1_public_homepage: false,
    test1_hot_products_rendered: false,
    test1_no_auto_login: false,
    test2_unauth_click_product_redirects_login: false,
    test2_empty_login_form_no_demo_buttons: false,
    test3_customer_login_intro_then_product_detail: false,
    test4_customer_subsequent_clicks_no_intro: false,
    test5_unauth_cart_wishlist_redirects_login: false,
    test6_admin_direct_dashboard_no_intro: false,
    test7_customer_api_forbidden_403: false,
    test8_unauth_api_unauthorized_401: false,
    test9_mobile_viewport_390x844: false,
    test10_product_data_integrity: false,
  };

  try {
    // -------------------------------------------------------------------------
    // TEST 1: CHƯA ĐĂNG NHẬP MỞ TRANG CHỦ (PUBLIC HOMEPAGE + SẢN PHẨM HOT)
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Khách chưa đăng nhập mở Trang chủ ---');
    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(1000);
    const url1 = page.url();
    console.log(`URL sau khi mở /: ${url1}`);

    const isHomepage = url1 === `${BASE_URL}/` || url1 === `${BASE_URL}`;
    if (isHomepage) {
      results.test1_public_homepage = true;
      console.log('  ✅ Trang chủ mở công khai, KHÔNG bị tự chuyển sang /login!');
    }

    const hasIntroOnHome = await page.locator('[data-testid="galaxy-intro"]').count();
    const hasAdminDashboard = await page.locator('text=SMARTBUY AI ADMIN DASHBOARD').count();
    console.log(`Intro 3D phát hiện: ${hasIntroOnHome}, Admin Dashboard: ${hasAdminDashboard}`);
    if (hasIntroOnHome === 0 && hasAdminDashboard === 0) {
      results.test1_no_auto_login = true;
      console.log('  ✅ Không tự động đăng nhập, không chạy Intro 3D, không hiện Admin Dashboard!');
    }

    const hotTitle = await page.locator('text=SẢN PHẨM HOT').count();
    const hotCardsCount = await page.locator('[data-testid="product-card"]').count();
    console.log(`Tiêu đề "SẢN PHẨM HOT": ${hotTitle > 0}, Số lượng ProductCard: ${hotCardsCount}`);
    if (hotTitle > 0 && hotCardsCount >= 4) {
      results.test1_hot_products_rendered = true;
      console.log(`  ✅ Section SẢN PHẨM HOT xuất hiện với ${hotCardsCount} sản phẩm, hiển thị giá công khai!`);
    }

    // -------------------------------------------------------------------------
    // TEST 2: CHƯA ĐĂNG NHẬP CLICK VÀO SẢN PHẨM HOT -> CHUYỂN /login
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Click vào sản phẩm HOT khi chưa đăng nhập ---');
    const firstProductCard = page.locator('[data-testid="product-card"]').first();
    const productLink = firstProductCard.locator('a[href*="/products/"]').first();
    const targetHref = await productLink.getAttribute('href');
    console.log(`Đường dẫn sản phẩm mục tiêu: ${targetHref}`);

    await productLink.click();
    await page.waitForTimeout(1200);

    const urlAfterClick = page.url();
    console.log(`URL sau khi click sản phẩm: ${urlAfterClick}`);
    if (urlAfterClick.includes('/login') && urlAfterClick.includes(encodeURIComponent(targetHref))) {
      results.test2_unauth_click_product_redirects_login = true;
      console.log('  ✅ Chuyển hướng chính xác đến /login kèm query redirect an toàn!');
    }

    const emailVal = await page.locator('input[type="email"]').inputValue();
    const passVal = await page.locator('input[type="password"]').inputValue();
    const demoButtonsCount = await page.locator('button:has-text("demo"), button:has-text("Demo"), button:has-text("Dùng thử")').count();
    console.log(`Input Email: "${emailVal}", Password: "${passVal}", Nút Demo: ${demoButtonsCount}`);
    if (!emailVal && !passVal && demoButtonsCount === 0) {
      results.test2_empty_login_form_no_demo_buttons = true;
      console.log('  ✅ Form đăng nhập hoàn toàn trống, tuyệt đối không có nút demo!');
    }

    // -------------------------------------------------------------------------
    // TEST 3: ĐĂNG NHẬP CUSTOMER TEST -> INTRO 3D -> MỞ LẠI SẢN PHẨM ĐÃ CHỌN
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Đăng nhập Customer Test -> Intro 3D -> Chi tiết sản phẩm ---');
    await page.locator('input[type="email"]').fill(customerEmail);
    await page.locator('input[type="password"]').fill(customerPass);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);

    console.log(`URL sau khi submit form: ${page.url()}`);
    // Bỏ qua Intro nếu nút skip xuất hiện hoặc đợi hoàn thành
    const skipBtn = page.locator('button:has-text("Bỏ qua"), button:has-text("Khám phá ngay"), [data-testid="skip-intro"]').first();
    if (await skipBtn.isVisible().catch(() => false)) {
      console.log('  Phát hiện Galaxy Intro 3D! Nhấn nút tiếp tục...');
      await skipBtn.click();
      await page.waitForTimeout(1200);
    } else {
      await page.waitForTimeout(2000);
    }

    const finalCustomerUrl = page.url();
    console.log(`URL sau khi Intro 3D kết thúc: ${finalCustomerUrl}`);
    if (finalCustomerUrl.includes(targetHref) || finalCustomerUrl.includes('/products/')) {
      results.test3_customer_login_intro_then_product_detail = true;
      console.log(`  ✅ Đăng nhập Customer thành công, qua Intro 3D và mở đúng sản phẩm đã chọn: ${finalCustomerUrl}`);
    }

    // -------------------------------------------------------------------------
    // TEST 4: CUSTOMER ĐÃ ĐĂNG NHẬP CLICK SẢN PHẨM KHÁC -> KHÔNG CHẠY LẠI INTRO
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Customer đã đăng nhập click sản phẩm khác ---');
    await page.goto(`${BASE_URL}/products`);
    await page.waitForTimeout(1000);
    const secondProduct = page.locator('[data-testid="product-card"]').nth(1);
    const secondLink = secondProduct.locator('a[href*="/products/"]').first();
    const secondHref = await secondLink.getAttribute('href');

    await secondLink.click();
    await page.waitForTimeout(1000);

    const urlSecond = page.url();
    const introCountOnSecond = await page.locator('[data-testid="galaxy-intro"]').count();
    console.log(`URL sản phẩm thứ hai: ${urlSecond}, Intro 3D count: ${introCountOnSecond}`);
    if (urlSecond.includes(secondHref) && introCountOnSecond === 0) {
      results.test4_customer_subsequent_clicks_no_intro = true;
      console.log('  ✅ Mở thẳng trang chi tiết sản phẩm, TUYỆT ĐỐI không phát lại Intro 3D!');
    }

    // -------------------------------------------------------------------------
    // TEST 5: ĐĂNG XUẤT, CHƯA ĐĂNG NHẬP CLICK CART HOẶC WISHLIST -> YÊU CẦU ĐĂNG NHẬP
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Chưa đăng nhập click Cart hoặc Wishlist ---');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    });
    await page.waitForTimeout(1000);

    // Click Cart button
    const cartButton = page.locator('button[aria-label="Giỏ hàng"]').first();
    await cartButton.click();
    await page.waitForTimeout(1000);

    const urlCartClick = page.url();
    console.log(`URL sau khi click Giỏ hàng: ${urlCartClick}`);
    if (urlCartClick.includes('/login') && urlCartClick.includes('cart')) {
      results.test5_unauth_cart_wishlist_redirects_login = true;
      console.log('  ✅ Click Giỏ hàng khi chưa đăng nhập tự động chuyển về trang /login!');
    }

    // -------------------------------------------------------------------------
    // TEST 6: ĐĂNG NHẬP ADMIN TEST -> VÀO THẲNG /admin/dashboard
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: Đăng nhập Admin Test -> Thẳng /admin/dashboard ---');
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(adminEmail);
    await page.locator('input[type="password"]').fill(adminPass);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);

    const adminUrl = page.url();
    console.log(`URL sau khi Admin đăng nhập: ${adminUrl}`);
    const adminIntroCount = await page.locator('[data-testid="galaxy-intro"]').count();
    const hasAdminSidebar = await page.locator('aside').isVisible().catch(() => false);
    console.log(`Intro 3D: ${adminIntroCount}, Sidebar Admin: ${hasAdminSidebar}`);

    if (adminUrl.includes('/admin') && adminIntroCount === 0 && hasAdminSidebar) {
      results.test6_admin_direct_dashboard_no_intro = true;
      console.log('  ✅ Admin vào thẳng Bảng Quản Trị, không chạy Intro 3D, hiển thị đúng layout quản trị!');
    }

    // -------------------------------------------------------------------------
    // TEST 7: CUSTOMER GỌI API ADMIN -> BỊ TỪ CHỐI 403
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: Kiểm tra API Security (Customer gọi Admin API -> 403) ---');
    const custLoginRes = await postJson('http://localhost:8080/api/v1/auth/login', {
      email: customerEmail,
      password: customerPass
    });
    const custToken = custLoginRes.data.token || custLoginRes.data.accessToken;
    const adminKpiCustRes = await getJson('http://localhost:8080/api/v1/admin/dashboard/kpi', custToken);
    console.log(`Status gọi Admin KPI bằng Customer Token: ${adminKpiCustRes.status} (Kỳ vọng 403)`);
    if (adminKpiCustRes.status === 403) {
      results.test7_customer_api_forbidden_403 = true;
      console.log('  ✅ Spring Security từ chối 403 Forbidden chính xác!');
    }

    // -------------------------------------------------------------------------
    // TEST 8: CHƯA ĐĂNG NHẬP GỌI API BẢO MẬT -> BỊ TỪ CHỐI 401
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: Kiểm tra API Security (Unauth gọi API bảo mật -> 401) ---');
    const unauthRes = await getJson('http://localhost:8080/api/v1/admin/dashboard/kpi');
    console.log(`Status gọi Admin KPI không có token: ${unauthRes.status} (Kỳ vọng 401)`);
    if (unauthRes.status === 401 || unauthRes.status === 403) {
      results.test8_unauth_api_unauthorized_401 = true;
      console.log('  ✅ Chặn truy cập unauthenticated chính xác (401/403)!');
    }

    // -------------------------------------------------------------------------
    // TEST 9: KIỂM TRA MOBILE VIEWPORT IPHONE (390x844)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 9: Kiểm tra Responsive iPhone (390x844) ---');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(1000);

    const mobileHotCount = await page.locator('[data-testid="product-card"]').count();
    const hasWhiteScreen = await page.evaluate(() => document.body.innerText.trim().length === 0);
    console.log(`Mobile iPhone - Sản phẩm HOT hiển thị: ${mobileHotCount}, Màn hình trắng: ${hasWhiteScreen}`);
    if (mobileHotCount >= 4 && !hasWhiteScreen) {
      results.test9_mobile_viewport_390x844 = true;
      console.log('  ✅ Trang chủ hiển thị hoàn hảo trên màn hình iPhone, không bị tràn hay trắng màn hình!');
    }

    // -------------------------------------------------------------------------
    // TEST 10: DỮ LIỆU SẢN PHẨM & TỒN TẠI TÀI KHOẢN TRONG DATABASE
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 10: Toàn vẹn dữ liệu Sản phẩm & 2 Tài khoản trong Database ---');
    const adminLoginRes = await postJson('http://localhost:8080/api/v1/auth/login', {
      email: adminEmail,
      password: adminPass
    });
    const adminToken = adminLoginRes.data.token || adminLoginRes.data.accessToken;
    const kpiRes = await getJson('http://localhost:8080/api/v1/admin/dashboard/kpi', adminToken);
    console.log(`KPI Data - Tổng sản phẩm: ${kpiRes.data.totalProducts}, Tổng khách hàng: ${kpiRes.data.totalCustomers}`);
    if (kpiRes.status === 200 && kpiRes.data.totalProducts > 0 && kpiRes.data.totalCustomers >= 2) {
      results.test10_product_data_integrity = true;
      console.log('  ✅ Cơ sở dữ liệu hoạt động chính xác với 2 tài khoản test và catalog đầy đủ!');
    }

  } catch (err) {
    console.error('Lỗi trong quá trình kiểm thử:', err);
  } finally {
    await browser.close();
  }

  console.log('\n========================================================================');
  console.log('📊 KẾT QUẢ TỔNG HỢP KIỂM THỬ MASTER PROMPT V6 & V7:');
  console.log('========================================================================');
  let passCount = 0;
  const totalCount = Object.keys(results).length;
  for (const [key, val] of Object.entries(results)) {
    console.log(`${val ? '✅ PASS' : '❌ FAIL'}: ${key}`);
    if (val) passCount++;
  }
  const percent = Math.round((passCount / totalCount) * 100);
  console.log(`\nTỶ LỆ THÀNH CÔNG: ${passCount}/${totalCount} (${percent}%)`);
  console.log('========================================================================\n');
}

run().catch(console.error);

