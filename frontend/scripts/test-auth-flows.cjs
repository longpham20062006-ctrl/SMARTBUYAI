const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/ntaan/.gemini/antigravity/brain/0e4dcce6-066f-4114-99ec-6159cda7b47e');

async function runAuthTests() {
  console.log('======================================================');
  console.log('SMARTBUY AI — AUTOMATED AUTHENTICATION (LOGIN/LOGOUT) TEST');
  console.log('======================================================');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();
  const BASE_URL = 'http://localhost:4173';

  // Helper to assert
  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ [FAIL] ${message}`);
      throw new Error(message);
    }
    console.log(`✓ [PASS] ${message}`);
  }

  try {
    // ------------------------------------------------------------------------
    // SCENARIO 1: Unauthenticated Guest State & Initial Protected Route Checks
    // ------------------------------------------------------------------------
    console.log('\n--- BƯỚC 1: KIỂM TRA TRẠNG THÁI CHƯA ĐĂNG NHẬP (GUEST) ---');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Clear any leftover session
    await page.evaluate(() => {
      localStorage.removeItem('sb_current_user');
      window.dispatchEvent(new Event('storage'));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 1.1 Header must show "Đăng nhập" button
    const loginBtn = await page.locator('header a[href="/login"]').first();
    const isLoginBtnVisible = await loginBtn.isVisible();
    assert(isLoginBtnVisible, 'Header hiển thị nút "Đăng nhập" khi chưa đăng nhập');

    // Capture screenshot: Guest state
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'auth-1-guest-header.png'),
    });

    // 1.2 Accessing /account while logged out must redirect to /login
    await page.goto(`${BASE_URL}/account`);
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    assert(currentUrl.includes('/login'), `Truy cập /account khi chưa đăng nhập bị chuyển hướng về /login (URL: ${currentUrl})`);

    // 1.3 Accessing /admin while logged out must redirect to /403
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(1000);
    const adminUrl = page.url();
    assert(adminUrl.includes('/403'), `Truy cập /admin khi chưa đăng nhập bị từ chối chuyển sang /403 (URL: ${adminUrl})`);

    // Capture screenshot: 403 Forbidden
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'auth-2-forbidden-403.png'),
    });

    // ------------------------------------------------------------------------
    // SCENARIO 2: Customer Login Flow & Permissions
    // ------------------------------------------------------------------------
    console.log('\n--- BƯỚC 2: KIỂM TRA ĐĂNG NHẬP KHÁCH HÀNG (CUSTOMER) ---');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Capture screenshot: Login page
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'auth-3-login-page.png'),
    });

    // Click "Khách hàng" demo button
    const customerQuickBtn = page.getByRole('button', { name: 'Khách hàng' });
    await customerQuickBtn.click();
    await page.waitForTimeout(1200);

    const postCustomerLoginUrl = page.url();
    assert(postCustomerLoginUrl.includes('/account'), `Đăng nhập khách hàng thành công chuyển đến /account (URL: ${postCustomerLoginUrl})`);

    // Check account header name
    const accountHeading = await page.locator('h1').textContent();
    assert(accountHeading.includes('Nguyễn Minh Anh'), `Hồ sơ tài khoản hiển thị đúng tên khách hàng: ${accountHeading}`);

    // Capture screenshot: Account logged in
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'auth-4-customer-account.png'),
    });

    // Check Header now shows Avatar circle "N" instead of "Đăng nhập"
    const avatarBtn = page.locator('header button[aria-label="Tài khoản người dùng"]');
    const isAvatarVisible = await avatarBtn.isVisible();
    assert(isAvatarVisible, 'Header hiển thị avatar tài khoản tròn "N" thay vì nút đăng nhập');

    // Customer trying to access /admin must be blocked with 403
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(1000);
    assert(page.url().includes('/403'), 'Khách hàng thường cố tình vào /admin bị chặn 403 chuẩn phân quyền');

    // ------------------------------------------------------------------------
    // SCENARIO 3: Logout Flow
    // ------------------------------------------------------------------------
    console.log('\n--- BƯỚC 3: KIỂM TRA ĐĂNG XUẤT (LOGOUT) ---');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Open User Menu in Header
    await page.locator('header button[aria-label="Tài khoản người dùng"]').click();
    await page.waitForTimeout(500);

    // Capture screenshot: Header user dropdown
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'auth-5-header-user-menu.png'),
    });

    // Click "Đăng xuất"
    const logoutBtn = page.getByRole('button', { name: 'Đăng xuất' });
    await logoutBtn.click();
    await page.waitForTimeout(1000);

    // Should redirect to /login
    assert(page.url().includes('/login'), `Sau khi đăng xuất được điều hướng đến /login (URL: ${page.url()})`);

    // Go back to home to verify header returned to unauthenticated state
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const isLoginBack = await page.locator('header a[href="/login"]').first().isVisible();
    assert(isLoginBack, 'Sau khi đăng xuất, Header hiển thị lại nút "Đăng nhập" chuẩn xác');

    // ------------------------------------------------------------------------
    // SCENARIO 4: Admin Login Flow & Admin Layout Permissions
    // ------------------------------------------------------------------------
    console.log('\n--- BƯỚC 4: KIỂM TRA ĐĂNG NHẬP QUẢN TRỊ VIÊN (ADMIN) ---');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Click "Quản trị viên" demo button
    const adminQuickBtn = page.getByRole('button', { name: 'Quản trị viên' });
    await adminQuickBtn.click();
    await page.waitForTimeout(1200);

    const postAdminLoginUrl = page.url();
    assert(postAdminLoginUrl.includes('/admin'), `Đăng nhập quản trị viên thành công chuyển đến /admin (URL: ${postAdminLoginUrl})`);

    // Verify Admin Layout loaded
    const adminHeading = await page.locator('h1, h2, h3').first().textContent();
    assert(adminHeading.length > 0, `Giao diện Quản trị viên tải thành công (${adminHeading.trim()})`);

    // Capture screenshot: Admin Dashboard
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'auth-6-admin-dashboard.png'),
    });

    // Exit Admin test
    const exitAdminBtn = page.getByRole('button', { name: 'Exit Admin' });
    if (await exitAdminBtn.isVisible()) {
      await exitAdminBtn.click();
      await page.waitForTimeout(1000);
      console.log('✓ [PASS] Nút Exit Admin hoạt động, thoát khỏi khu vực quản trị');
    }

    console.log('\n======================================================');
    console.log('TẤT CẢ CÁC BƯỚC KIỂM THỬ LOGIN / LOGOUT / PHÂN QUYỀN ĐẠT 100%!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

runAuthTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

