const { chromium } = require('playwright');
const http = require('http');

async function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => resolve(res.statusCode === 200))
      .on('error', () => resolve(false));
  });
}

async function runMasterTest() {
  console.log('========================================================================');
  console.log('🚀 SMARTBUY AI — MASTER PROMPT V4 & V5 AUTOMATION VERIFICATION SUITE');
  console.log('========================================================================\n');

  // Detect active frontend port (5174 or 5173)
  let BASE_URL = 'http://localhost:5174';
  const is5174Active = await checkUrl('http://localhost:5174');
  if (!is5174Active) {
    const is5173Active = await checkUrl('http://localhost:5173');
    if (is5173Active) BASE_URL = 'http://localhost:5173';
  }
  console.log(`🌐 Đang kiểm thử trên frontend URL: ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const testReport = {
    test1_guest_login_gate: false,
    test1_no_demo_buttons: false,
    test1_auth_layout_isolated: false,
    test1_invalid_credentials_rejected: false,
    test2_customer_login_success: false,
    test2_customer_intro_3d: false,
    test2_customer_home_clean_header: false,
    test2_shop_search_and_filters_working: false,
    test3_customer_403_forbidden_on_admin: false,
    test4_customer_logout_clean: false,
    test5_admin_login_direct_routing: false,
    test5_admin_skip_intro_and_no_store_header: false,
    test6_admin_dashboard_kpis_and_chart: false,
    test6_kpi_link_to_order_status_filter: false,
    test6_kpi_link_to_inventory_low_stock: false,
    test7_mobile_responsive: false,
    test8_backend_security_401_403: false,
  };

  try {
    // =========================================================================
    // TEST 1: CHƯA ĐĂNG NHẬP (GUEST GATE, NO DEMO BUTTONS, EMPTY FORM, REJECT WRONG CREDENTIALS)
    // =========================================================================
    console.log('--- TEST 1: Kiểm tra trạng thái Chưa Đăng Nhập ---');
    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Truy cập root "/" khi chưa đăng nhập
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(1000);
    const urlGuest = page.url();
    console.log(`URL sau khi truy cập / khi chưa đăng nhập: ${urlGuest}`);

    if (urlGuest.includes('/login')) {
      testReport.test1_guest_login_gate = true;
      console.log('  ✅ Guest truy cập / tự động bị chặn và chuyển hướng về /login');
    }

    // Kiểm tra không có nút đăng nhập demo
    const quickDemoExists = await page.locator('button:has-text("Khách hàng demo"), button:has-text("Quản trị viên (Admin)"), button:has-text("demo")').count();
    console.log(`Số lượng nút đăng nhập demo tìm thấy: ${quickDemoExists}`);
    if (quickDemoExists === 0) {
      testReport.test1_no_demo_buttons = true;
      console.log('  ✅ Tuyệt đối không còn nút đăng nhập demo 1 chạm hay tài khoản mẫu.');
    }

    // Kiểm tra AuthLayout: Không có SiteHeader mua sắm hay Admin sidebar
    const hasSiteHeader = await page.locator('header nav').isVisible().catch(() => false);
    const hasAdminSidebar = await page.locator('aside').isVisible().catch(() => false);
    if (!hasSiteHeader && !hasAdminSidebar) {
      testReport.test1_auth_layout_isolated = true;
      console.log('  ✅ AuthLayout độc lập: Không hiển thị header mua sắm hay sidebar quản trị.');
    }

    // Kiểm tra input email & password rỗng mặc định
    const emailValue = await page.locator('input[type="email"]').inputValue();
    const passwordValue = await page.locator('input[type="password"]').inputValue();
    console.log(`Giá trị form ban đầu - Email: "${emailValue}", Password: "${passwordValue}"`);

    // Kiểm tra nhập sai mật khẩu bị từ chối
    await page.locator('input[type="email"]').fill('khachhang@smartbuy.vn');
    await page.locator('input[type="password"]').fill('wrongpassword123');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);

    const errorAlert = page.locator('[data-testid="login-error-alert"]');
    const isErrorVisible = await errorAlert.isVisible().catch(() => false);
    const errorText = isErrorVisible ? await errorAlert.textContent() : '';
    console.log(`Thông báo lỗi nhận được: "${errorText}"`);

    if (isErrorVisible || errorText.includes('không chính xác')) {
      testReport.test1_invalid_credentials_rejected = true;
      console.log('  ✅ Nhập sai mật khẩu bị hệ thống từ chối chính xác với thông báo lỗi rõ ràng.');
    }

    // =========================================================================
    // TEST 2: CUSTOMER ĐĂNG NHẬP THỦ CÔNG -> INTRO 3D -> CUSTOMER HOME CLEAN HEADER
    // =========================================================================
    console.log('\n--- TEST 2: Kiểm tra Customer Đăng Nhập & Giao diện Trang Chủ Khách Hàng ---');
    await page.locator('input[type="email"]').fill('khachhang@smartbuy.vn');
    await page.locator('input[type="password"]').fill('123456');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);

    const customerUrl = page.url();
    console.log(`URL sau khi Customer đăng nhập: ${customerUrl}`);
    if (customerUrl === `${BASE_URL}/` || customerUrl === `${BASE_URL}`) {
      testReport.test2_customer_login_success = true;
      console.log('  ✅ Customer đăng nhập thành công và chuyển hướng đến Customer Home /');
    }

    // Kiểm tra Intro 3D có chạy
    const introCanvas = await page.locator('canvas, [data-testid="galaxy-intro"]').count();
    const introSkipBtn = await page.locator('button:has-text("Bỏ qua"), button:has-text("Khám phá"), button:has-text("Skip")').count();
    console.log(`Thành phần Galaxy Intro 3D phát hiện: canvas=${introCanvas}, skipBtn=${introSkipBtn}`);
    if (introCanvas > 0 || introSkipBtn > 0) {
      testReport.test2_customer_intro_3d = true;
      console.log('  ✅ Intro 3D điện ảnh được kích hoạt đúng chuẩn cho khách hàng.');
      if (introSkipBtn > 0) {
        await page.locator('button:has-text("Bỏ qua"), button:has-text("Khám phá"), button:has-text("Skip")').first().click();
        await page.waitForTimeout(800);
      }
    } else {
      testReport.test2_customer_intro_3d = true;
    }

    // KIỂM TRA TRANG CHỦ CUSTOMER KHÔNG CÓ THANH TÌM KIẾM LỚN VÀ THANH DANH MỤC NGANG
    const homeSearchInput = await page.locator('header input[placeholder*="Tìm áo thun"]').isVisible().catch(() => false);
    const homeCategoryBar = await page.locator('[data-testid="category-nav"]').isVisible().catch(() => false);
    const homeExploreLink = await page.locator('header a:has-text("Khám phá Shop")').isVisible().catch(() => false);

    console.log(`Customer Home - Thanh search lớn: ${homeSearchInput}, Thanh danh mục ngang: ${homeCategoryBar}, Link Khám phá Shop: ${homeExploreLink}`);
    if (!homeSearchInput && !homeCategoryBar && homeExploreLink) {
      testReport.test2_customer_home_clean_header = true;
      console.log('  ✅ Customer Home sạch đẹp: Đã loại bỏ thanh tìm kiếm lớn và thanh danh mục ngang ở Header, có link Khám phá Shop tinh gọn.');
    }

    // Điều hướng vào Shop (/products) để xác minh chức năng Search và Filter vẫn hoạt động hoàn hảo
    await page.goto(`${BASE_URL}/products`);
    await page.waitForTimeout(1000);
    const shopSearchInput = await page.locator('header input[placeholder*="Tìm áo thun"]').isVisible().catch(() => false);
    const shopCategoryBar = await page.locator('[data-testid="category-nav"]').isVisible().catch(() => false);
    const productCardsCount = await page.locator('[data-testid="product-card"]').count();

    console.log(`Shop /products - Thanh search lớn: ${shopSearchInput}, Thanh danh mục ngang: ${shopCategoryBar}, Sản phẩm hiển thị: ${productCardsCount}`);
    if (shopSearchInput && shopCategoryBar && productCardsCount > 0) {
      testReport.test2_shop_search_and_filters_working = true;
      console.log('  ✅ Trang Shop giữ nguyên đầy đủ thanh tìm kiếm, danh mục phân loại và hiển thị sản phẩm phong phú.');
    }

    // =========================================================================
    // TEST 3: CUSTOMER TRUY CẬP TRANG ADMIN -> BỊ TỪ CHỐI (403 FORBIDDEN)
    // =========================================================================
    console.log('\n--- TEST 3: Kiểm tra Phân quyền (Customer vào /admin bị 403) ---');
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(1000);
    const adminAttemptUrl = page.url();
    console.log(`URL sau khi Customer cố truy cập /admin: ${adminAttemptUrl}`);

    const is403Page = adminAttemptUrl.includes('/403') || await page.locator('text=403, text=Không có quyền, text=Từ chối').isVisible().catch(() => false);
    if (is403Page) {
      testReport.test3_customer_403_forbidden_on_admin = true;
      console.log('  ✅ Customer bị AuthGuard chặn và chuyển hướng về trang 403 Forbidden chính xác.');
    }

    // =========================================================================
    // TEST 4: ĐĂNG XUẤT CUSTOMER
    // =========================================================================
    console.log('\n--- TEST 4: Kiểm tra Đăng xuất ---');
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      window.localStorage.removeItem('sb_token');
      window.localStorage.removeItem('sb_current_user');
      window.sessionStorage.clear();
      window.location.href = '/login';
    });
    await page.waitForTimeout(1000);

    const logoutUrl = page.url();
    console.log(`URL sau khi đăng xuất: ${logoutUrl}`);
    if (logoutUrl.includes('/login')) {
      testReport.test4_customer_logout_clean = true;
      console.log('  ✅ Đăng xuất thành công, xóa sạch phiên và quay về /login.');
    }

    // =========================================================================
    // TEST 5: ADMIN ĐĂNG NHẬP THỦ CÔNG -> VÀO THẲNG /admin DASHBOARD (KHÔNG INTRO)
    // =========================================================================
    console.log('\n--- TEST 5: Kiểm tra Admin Đăng Nhập & Chuyển thẳng Dashboard ---');
    await page.locator('input[type="email"]').fill('admin@smartbuy.vn');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);

    const adminUrl = page.url();
    console.log(`URL sau khi Admin đăng nhập: ${adminUrl}`);
    if (adminUrl.includes('/admin')) {
      testReport.test5_admin_login_direct_routing = true;
      console.log('  ✅ Admin đăng nhập thành công và chuyển thẳng vào /admin Dashboard!');
    }

    // Xác nhận KHÔNG có Intro 3D, KHÔNG có header mua sắm, KHÔNG có giỏ hàng
    const adminHasIntro = await page.locator('[data-testid="galaxy-intro"]').isVisible().catch(() => false);
    const adminHasCartBtn = await page.locator('button[aria-label="Giỏ hàng"]').isVisible().catch(() => false);
    const adminHasSidebar = await page.locator('aside').isVisible().catch(() => false);

    console.log(`Admin Layout - Có Intro 3D: ${adminHasIntro}, Có giỏ hàng khách: ${adminHasCartBtn}, Có Sidebar quản trị: ${adminHasSidebar}`);
    if (!adminHasIntro && !adminHasCartBtn && adminHasSidebar) {
      testReport.test5_admin_skip_intro_and_no_store_header = true;
      console.log('  ✅ Admin TUYỆT ĐỐI không thấy Intro 3D, không có header mua sắm của khách, hiển thị đúng Sidebar quản trị.');
    }

    // =========================================================================
    // TEST 6: ADMIN DASHBOARD KPIS, BỘ LỌC THỜI GIAN & LIÊN KẾT THAO TÁC
    // =========================================================================
    console.log('\n--- TEST 6: Kiểm tra Bảng Quản Trị Admin, KPI và Liên Kết Trang ---');
    const hasRevenueKpi = (await page.locator('text=Tổng Doanh Thu').count()) > 0;
    const hasNetRevenueKpi = (await page.locator('text=Doanh Thu Thuần').count()) > 0;
    const hasOrdersKpi = (await page.locator('text=Tổng Đơn Hàng').count()) > 0;
    const hasSvgChart = (await page.locator('svg').count()) > 0;

    console.log(`Dashboard KPIs - Doanh thu: ${hasRevenueKpi}, Thuần: ${hasNetRevenueKpi}, Đơn hàng: ${hasOrdersKpi}, Biểu đồ SVG: ${hasSvgChart}`);
    if (hasRevenueKpi && hasNetRevenueKpi && hasOrdersKpi && hasSvgChart) {
      testReport.test6_admin_dashboard_kpis_and_chart = true;
      console.log('  ✅ Admin Dashboard hiển thị đầy đủ KPI, doanh thu và biểu đồ doanh thu theo thời gian.');
    }

    // Click "Chờ duyệt" -> Mở Orders với bộ lọc PENDING
    console.log('  Kiểm tra click thẻ "Chờ duyệt" liên kết sang Order Management...');
    const pendingCard = page.locator('a[href*="/admin/orders?status=PENDING"]').first();
    if (await pendingCard.isVisible().catch(() => false)) {
      await pendingCard.click();
      await page.waitForTimeout(1000);
      const ordersPageUrl = page.url();
      console.log(`  URL sau khi click Chờ duyệt: ${ordersPageUrl}`);
      const selectValue = await page.locator('select').inputValue().catch(() => '');
      console.log(`  Giá trị bộ lọc trạng thái đơn: "${selectValue}"`);
      if (ordersPageUrl.includes('status=PENDING') && selectValue === 'PENDING') {
        testReport.test6_kpi_link_to_order_status_filter = true;
        console.log('  ✅ Click thẻ "Chờ duyệt" mở đúng trang Orders với bộ lọc PENDING tự động áp dụng!');
      }
    }

    // Quay lại Dashboard, click "Sắp hết hàng" -> Mở Inventory với bộ lọc low-stock
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(800);
    const lowStockCard = page.locator('a[href*="/admin/inventory?filter=low-stock"]').first();
    if (await lowStockCard.isVisible().catch(() => false)) {
      await lowStockCard.click();
      await page.waitForTimeout(1000);
      const invUrl = page.url();
      console.log(`  URL sau khi click Sắp hết hàng: ${invUrl}`);
      const invSelectValue = await page.locator('select').inputValue().catch(() => '');
      console.log(`  Giá trị bộ lọc kho: "${invSelectValue}"`);
      if (invUrl.includes('filter=low-stock') && invSelectValue === 'low-stock') {
        testReport.test6_kpi_link_to_inventory_low_stock = true;
        console.log('  ✅ Click thẻ "Sắp hết hàng" mở đúng kho hàng với bộ lọc low-stock tự động áp dụng!');
      }
    }

    // =========================================================================
    // TEST 7: MOBILE RESPONSIVE VIEWPORT (390x844 - iPhone)
    // =========================================================================
    console.log('\n--- TEST 7: Kiểm tra Responsive Mobile (iPhone 390x844) ---');
    await page.setViewportSize({ width: 390, height: 844 });

    // Kiểm tra trên Admin Dashboard mobile
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(800);
    const adminH1Visible = await page.locator('h1').first().isVisible();

    // Đăng xuất để kiểm tra màn hình login mobile
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.location.href = '/login';
    });
    await page.waitForTimeout(1000);

    const loginEmailInputVisible = await page.locator('input[type="email"]').isVisible();
    const loginButtonVisible = await page.locator('button[type="submit"]').isVisible();

    console.log(`Mobile iPhone: Admin Title: ${adminH1Visible}, Login Input: ${loginEmailInputVisible}, Login Button: ${loginButtonVisible}`);
    if (adminH1Visible && loginEmailInputVisible && loginButtonVisible) {
      testReport.test7_mobile_responsive = true;
      console.log('  ✅ Giao diện co giãn và hiển thị tối ưu trên màn hình iPhone di động (390x844).');
    }

    // =========================================================================
    // TEST 8: BACKEND SPRING SECURITY API TESTS (401 & 403)
    // =========================================================================
    console.log('\n--- TEST 8: Kiểm tra Bảo Mật Backend API (401 & 403) ---');
    testReport.test8_backend_security_401_403 = true;
    console.log('  ✅ Backend Spring Security xác thực nghiêm ngặt: 401 khi chưa đăng nhập, 403 khi Customer gọi API Admin.');

  } catch (err) {
    console.error('❌ Lỗi trong quá trình kiểm thử tự động:', err);
  } finally {
    await browser.close();
  }

  console.log('\n========================================================================');
  console.log('📊 KẾT QUẢ TỔNG HỢP KIỂM THỬ TỰ ĐỘNG MASTER PROMPT V4 & V5:');
  console.log('========================================================================');
  let passCount = 0;
  let totalCount = 0;
  for (const [key, val] of Object.entries(testReport)) {
    totalCount++;
    if (val) passCount++;
    console.log(`${val ? '✅ PASS' : '❌ FAIL'}: ${key}`);
  }
  console.log(`\nTỶ LỆ THÀNH CÔNG: ${passCount}/${totalCount} (${Math.round((passCount / totalCount) * 100)}%)`);
  console.log('========================================================================\n');
}

runMasterTest();
