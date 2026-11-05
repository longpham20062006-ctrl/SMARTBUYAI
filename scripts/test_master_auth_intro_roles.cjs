/**
 * SMARTBUY AI — MASTER E2E TEST: AUTHENTICATION, 3D INTRO, AND ROLE SEPARATION
 * Verifies all 15 mandatory scenarios from Section VII.
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

async function runTests() {
  console.log('================================================================');
  console.log('🚀 SMARTBUY AI — MASTER AUTH, 3D INTRO & ROLE SEPARATION TEST');
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
    // -------------------------------------------------------------
    // SCENARIO 1: Mở website chưa đăng nhập -> Hiện trang chủ công khai
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 1: Guest Homepage ---');
    const guestContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const guestPage = await guestContext.newPage();
    await guestPage.goto(FRONTEND_URL, { waitUntil: 'networkidle' });

    const loginButton = guestPage.locator('a[href="/login"]').first();
    const isLoginVisible = await loginButton.isVisible();
    const url1 = guestPage.url();
    report(
      isLoginVisible && (url1 === `${FRONTEND_URL}/` || url1 === `${FRONTEND_URL}`),
      'Scenario 1: Mở website chưa đăng nhập hiển thị trang chủ công khai có nút Đăng nhập',
      `URL: ${url1}, loginBtn: ${isLoginVisible}`
    );
    await guestContext.close();

    // -------------------------------------------------------------
    // SCENARIO 2 & 3: Đăng nhập CUSTOMER -> Chạy Intro 3D -> Vào trang chủ
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 2 & 3: Customer Login → Intro 3D → Homepage ---');
    const custContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const custPage = await custContext.newPage();
    await custPage.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });

    await custPage.fill('input[type="email"]', CUSTOMER_USER.email);
    await custPage.fill('input[type="password"]', CUSTOMER_USER.pass);
    await custPage.click('button[type="submit"]');

    // Chờ điều hướng đến /intro
    await custPage.waitForURL('**/intro', { timeout: 6000 });
    const onIntro = custPage.url().includes('/intro');
    const introCanvas = custPage.locator('canvas').first();
    await introCanvas.waitFor({ state: 'visible', timeout: 5000 });
    const hasCanvas = await introCanvas.isVisible();
    const skipBtn = custPage.locator('button:has-text("Bỏ qua Intro")');
    const hasSkipBtn = await skipBtn.isVisible();

    report(
      onIntro && hasCanvas && hasSkipBtn,
      'Scenario 2: Đăng nhập CUSTOMER thành công chuyển ngay đến /intro và chạy Intro 3D với nút Bỏ qua Intro',
      `url: ${custPage.url()}, hasCanvas: ${hasCanvas}, hasSkipBtn: ${hasSkipBtn}`
    );

    // Chờ intro tự động hoàn thành animation và chuyển về trang chủ /
    console.log('  Waiting for Intro 3D animation to complete automatically (~5.5s)...');
    await custPage.waitForURL(`${FRONTEND_URL}/`, { timeout: 10000 });
    const postIntroUrl = custPage.url();
    const heroBanner = custPage.locator('text=SMARTBUY AI // STREETWEAR 2026').first();
    await heroBanner.waitFor({ state: 'visible', timeout: 6000 });
    const heroBannerVisible = await heroBanner.isVisible();
    report(
      postIntroUrl === `${FRONTEND_URL}/` && heroBannerVisible,
      'Scenario 3: Intro 3D chạy xong tự động chuyển đến đầu trang chủ khách hàng',
      `url: ${postIntroUrl}`
    );

    // -------------------------------------------------------------
    // SCENARIO 5: Khách nhấn lại Trang chủ -> Không chạy lại Intro
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 5: Customer Clicks "Trang chủ" ---');
    const homeLink = custPage.locator('a[href="/"]').first();
    await homeLink.click();
    await custPage.waitForTimeout(500);
    const urlAfterHomeClick = custPage.url();
    const notOnIntro5 = !urlAfterHomeClick.includes('/intro');
    report(
      notOnIntro5 && urlAfterHomeClick === `${FRONTEND_URL}/`,
      'Scenario 5: Khách nhấn lại Trang chủ không chạy lại Intro',
      `url: ${urlAfterHomeClick}`
    );

    // -------------------------------------------------------------
    // SCENARIO 6: Khách F5 -> Không chạy lại Intro
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 6: Customer F5 (Reload) ---');
    await custPage.reload({ waitUntil: 'networkidle' });
    await custPage.waitForTimeout(500);
    const urlAfterReload = custPage.url();
    const notOnIntro6 = !urlAfterReload.includes('/intro');
    report(
      notOnIntro6 && urlAfterReload === `${FRONTEND_URL}/`,
      'Scenario 6: Khách F5 làm mới trang không chạy lại Intro',
      `url: ${urlAfterReload}`
    );

    // -------------------------------------------------------------
    // SCENARIO 11: Khách nhập URL Admin -> Bị từ chối truy cập (/403)
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 11: Customer Enters Admin URL ---');
    await custPage.goto(`${FRONTEND_URL}/admin/dashboard`, { waitUntil: 'networkidle' });
    await custPage.waitForTimeout(600);
    const custAdminUrl = custPage.url();
    const isDenied = custAdminUrl.includes('/403') || custAdminUrl === `${FRONTEND_URL}/`;
    report(
      isDenied,
      'Scenario 11: Khách hàng cố nhập URL /admin/dashboard bị từ chối truy cập (403)',
      `url: ${custAdminUrl}`
    );

    // -------------------------------------------------------------
    // SCENARIO 7: Khách đăng xuất, đăng nhập lại -> Chạy Intro mới
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 7: Customer Logout & Re-login ---');
    // Thực hiện đăng xuất
    await custPage.goto(`${FRONTEND_URL}/account`, { waitUntil: 'networkidle' });
    const logoutBtn = custPage.locator('button:has-text("Đăng xuất")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await custPage.waitForTimeout(1000);
    } else {
      await custPage.evaluate(() => {
        sessionStorage.clear();
        window.location.href = '/';
      });
      await custPage.waitForTimeout(600);
    }

    // Đăng nhập lại
    await custPage.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    await custPage.fill('input[type="email"]', CUSTOMER_USER.email);
    await custPage.fill('input[type="password"]', CUSTOMER_USER.pass);
    await custPage.click('button[type="submit"]');

    await custPage.waitForURL('**/intro', { timeout: 6000 });
    report(
      custPage.url().includes('/intro'),
      'Scenario 7: Khách đăng xuất rồi đăng nhập lại được chạy Intro mới'
    );

    // -------------------------------------------------------------
    // SCENARIO 4: Nhấn "Bỏ qua Intro" -> Vào trang chủ ngay
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 4: Skip Intro Button ---');
    const skipBtnElem = custPage.locator('button:has-text("Bỏ qua Intro")');
    await skipBtnElem.click();
    await custPage.waitForURL(`${FRONTEND_URL}/`, { timeout: 4000 });
    report(
      custPage.url() === `${FRONTEND_URL}/`,
      'Scenario 4: Nhấn nút Bỏ qua Intro lập tức chuyển thẳng vào trang chủ'
    );
    await custContext.close();

    // -------------------------------------------------------------
    // SCENARIO 8: Đăng nhập ADMIN -> Vào Dashboard ngay, KHÔNG có Intro
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 8: Admin Login → Dashboard (NO INTRO) ---');
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminContext.newPage();
    await adminPage.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });

    await adminPage.fill('input[type="email"]', ADMIN_USER.email);
    await adminPage.fill('input[type="password"]', ADMIN_USER.pass);
    await adminPage.click('button[type="submit"]');

    await adminPage.waitForURL('**/admin/dashboard', { timeout: 6000 });
    const adminUrl8 = adminPage.url();
    const adminSidebar = adminPage.locator('[data-testid="admin-sidebar"]');
    await adminSidebar.waitFor({ state: 'visible', timeout: 5000 });
    const hasAdminSidebar = await adminSidebar.isVisible();
    const hasCustomerStoreHeader = await adminPage.locator('text=SMARTBUY AI // STREETWEAR 2026').isVisible();

    report(
      adminUrl8.includes('/admin/dashboard') && hasAdminSidebar && !hasCustomerStoreHeader,
      'Scenario 8: Admin đăng nhập chuyển thẳng vào Dashboard quản trị, tuyệt đối không có Intro hay giao diện khách hàng',
      `url: ${adminUrl8}`
    );

    // -------------------------------------------------------------
    // SCENARIO 9: Admin F5 -> Vẫn ở giao diện quản trị
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 9: Admin F5 (Reload) ---');
    await adminPage.reload({ waitUntil: 'networkidle' });
    await adminPage.waitForTimeout(500);
    const adminUrl9 = adminPage.url();
    const stillAdminSidebar = await adminPage.locator('[data-testid="admin-sidebar"]').isVisible();
    report(
      adminUrl9.includes('/admin/dashboard') && stillAdminSidebar,
      'Scenario 9: Admin F5 giữ nguyên giao diện quản trị Dashboard',
      `url: ${adminUrl9}`
    );

    // -------------------------------------------------------------
    // SCENARIO 10: Admin nhập URL Shop -> Chuyển về Dashboard
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 10: Admin Enters Customer URL (/shop) ---');
    await adminPage.goto(`${FRONTEND_URL}/shop`, { waitUntil: 'networkidle' });
    await adminPage.waitForTimeout(600);
    const redirectedUrl10 = adminPage.url();
    report(
      redirectedUrl10.includes('/admin/dashboard'),
      'Scenario 10: Admin nhập URL /shop của khách hàng tự động chuyển về Dashboard quản trị',
      `url: ${redirectedUrl10}`
    );

    // Test Admin typing homepage URL /
    await adminPage.goto(`${FRONTEND_URL}/`, { waitUntil: 'networkidle' });
    await adminPage.waitForTimeout(600);
    report(
      adminPage.url().includes('/admin/dashboard'),
      'Scenario 10b: Admin nhập URL trang chủ / tự động chuyển về Dashboard quản trị'
    );

    // -------------------------------------------------------------
    // SCENARIO 13: Admin đăng xuất rồi nhấn Back -> Không truy cập lại được
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 13: Admin Logout & Browser Back Button ---');
    const adminLogoutBtn = adminPage.locator('button:has-text("Đăng xuất")').first();
    await adminLogoutBtn.click();
    await adminPage.waitForTimeout(1000);

    const postLogoutUrl = adminPage.url();
    report(
      postLogoutUrl === `${FRONTEND_URL}/` || postLogoutUrl === `${FRONTEND_URL}`,
      'Scenario 13a: Admin đăng xuất thành công trở về trang chủ công khai',
      `url: ${postLogoutUrl}`
    );

    // Nhấn Back trình duyệt
    await adminPage.goBack();
    await adminPage.waitForTimeout(1000);
    const postBackUrl = adminPage.url();
    const cannotAccessDashboard = !postBackUrl.includes('/admin/dashboard');
    report(
      cannotAccessDashboard,
      'Scenario 13b: Nhấn nút Back trình duyệt sau khi đăng xuất không thể truy cập lại Dashboard',
      `postBackUrl: ${postBackUrl}`
    );
    await adminContext.close();

    // -------------------------------------------------------------
    // SCENARIO 12: Người chưa đăng nhập vào Admin -> Yêu cầu đăng nhập
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 12: Unauthenticated User Accesses Admin ---');
    const guestContext2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const guestPage2 = await guestContext2.newPage();
    await guestPage2.goto(`${FRONTEND_URL}/admin/dashboard`, { waitUntil: 'networkidle' });
    await guestPage2.waitForTimeout(600);
    const guestRedirectUrl = guestPage2.url();
    report(
      guestRedirectUrl.includes('/login'),
      'Scenario 12: Người chưa đăng nhập truy cập /admin/dashboard bị chuyển đến trang đăng nhập',
      `url: ${guestRedirectUrl}`
    );
    await guestContext2.close();

    // -------------------------------------------------------------
    // SCENARIO 14: Intro trên điện thoại (Mobile Viewport 390x844)
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 14: Mobile Intro Viewport Compatibility ---');
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });

    await mobilePage.fill('input[type="email"]', CUSTOMER_USER.email);
    await mobilePage.fill('input[type="password"]', CUSTOMER_USER.pass);
    await mobilePage.click('button[type="submit"]');

    await mobilePage.waitForURL('**/intro', { timeout: 6000 });
    const mobileCanvas = mobilePage.locator('canvas').first();
    await mobileCanvas.waitFor({ state: 'visible', timeout: 5000 });
    const isMobileCanvasVisible = await mobileCanvas.isVisible();
    const mobileSkipBtn = mobilePage.locator('button:has-text("Bỏ qua Intro")');
    const isMobileSkipVisible = await mobileSkipBtn.isVisible();

    // Kiểm tra không bị crash, không bị white screen
    const isWhiteScreen = await mobilePage.evaluate(() => {
      const bg = window.getComputedStyle(document.body).backgroundColor;
      return bg === 'rgb(255, 255, 255)' && !document.querySelector('canvas');
    });

    report(
      isMobileCanvasVisible && isMobileSkipVisible && !isWhiteScreen,
      'Scenario 14: Intro chạy mượt trên màn hình điện thoại (390x844), không trắng màn hình hay treo',
      `canvas: ${isMobileCanvasVisible}, skip: ${isMobileSkipVisible}, whiteScreen: ${isWhiteScreen}`
    );

    await mobileSkipBtn.click();
    await mobilePage.waitForURL(`${FRONTEND_URL}/`, { timeout: 4000 });
    report(
      mobilePage.url() === `${FRONTEND_URL}/`,
      'Scenario 14b: Bỏ qua Intro trên Mobile chuyển ngay vào trang chủ mượt mà'
    );
    await mobileContext.close();

    // -------------------------------------------------------------
    // SCENARIO 15: Backend / API gặp lỗi -> Báo lỗi, không chuyển trang sai
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 15: Invalid Login / API Error Handling ---');
    const errorContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const errorPage = await errorContext.newPage();
    await errorPage.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });

    await errorPage.fill('input[type="email"]', 'wrong.account@nonexistent.local');
    await errorPage.fill('input[type="password"]', 'wrongpassword123');
    await errorPage.click('button[type="submit"]');

    await errorPage.waitForTimeout(1000);
    const stillOnLogin = errorPage.url().includes('/login');
    const hasErrorMessage = await errorPage.locator('text=Email hoặc mật khẩu không chính xác').first().isVisible();

    report(
      stillOnLogin && hasErrorMessage,
      'Scenario 15: Đăng nhập sai tài khoản hiển thị thông báo lỗi rõ ràng, không điều hướng trang sai',
      `url: ${errorPage.url()}, hasError: ${hasErrorMessage}`
    );
    await errorContext.close();

  } catch (err) {
    console.error('Test Suite encountered an error:', err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(`MASTER AUTH & INTRO SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
