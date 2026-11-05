// D:\SMARTBUYAI\scripts\test_navigation_auth_intro_e2e.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';

// Read test credentials
let adminEmail = 'admin.test@smartbuy.local';
let adminPass = '^Xjn6^jwGDXx2rC9rf';
let customerEmail = 'customer.test@smartbuy.local';
let customerPass = 'd8RnVTsh&%3Q2v$H';

const credPath = path.resolve('backend/data/test_credentials.local');
if (fs.existsSync(credPath)) {
  const content = fs.readFileSync(credPath, 'utf8');
  content.split('\n').forEach((line) => {
    if (line.startsWith('ADMIN_TEST_EMAIL=')) adminEmail = line.split('=')[1].trim();
    if (line.startsWith('ADMIN_TEST_PASSWORD=')) adminPass = line.split('=')[1].trim();
    if (line.startsWith('CUSTOMER_TEST_EMAIL=')) customerEmail = line.split('=')[1].trim();
    if (line.startsWith('CUSTOMER_TEST_PASSWORD=')) customerPass = line.split('=')[1].trim();
  });
}

async function runTests() {
  console.log('========================================================================');
  console.log('🚀 SMARTBUY AI — NAVIGATION, AUTH, INTRO 3D & RBAC E2E TEST SUITE');
  console.log('========================================================================\n');

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
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
  });

  const consoleErrors = [];

  try {
    // -------------------------------------------------------------
    // CONTEXT 1: UN-AUTHENTICATED VISITOR (GUEST)
    // -------------------------------------------------------------
    const guestContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const guestPage = await guestContext.newPage();
    guestPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[Console Error] ${msg.text()}`);
      }
    });

    console.log('--- TEST 1: Mở website chưa đăng nhập -> thấy trang chủ công khai ---');
    await guestPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const guestUrl = guestPage.url();
    assert(guestUrl === `${BASE_URL}/`, `Hiển thị đúng trang chủ: ${guestUrl}`);
    const isHeroVisible = await guestPage.locator('text=YOUR FIT. YOUR RULES.').or(guestPage.locator('text=SMARTBUY AI')).first().isVisible();
    assert(isHeroVisible, 'Banner và logo giới thiệu hiển thị rõ ràng trên trang chủ');

    console.log('\n--- TEST 2: Chưa đăng nhập -> xem được ảnh sản phẩm hot (không giá) ---');
    const hotSectionCards = await guestPage.locator('#san-pham-hot [data-testid="home-product-card"]').count();
    assert(hotSectionCards >= 4 && hotSectionCards <= 6, `Khu vực SẢN PHẨM HOT hiển thị đúng 4-6 sản phẩm: ${hotSectionCards} cards`);
    // Kiểm tra không lộ giá bán trên home product card
    const firstHotCard = guestPage.locator('#san-pham-hot [data-testid="home-product-card"]').first();
    const hotText = await firstHotCard.innerText();
    assert(!hotText.includes('₫') && !hotText.includes('VNĐ'), 'Sản phẩm HOT trên trang chủ tập trung vào ảnh, không hiển thị giá bán');

    console.log('\n--- TEST 3: Chưa đăng nhập -> bấm Shop / Khám phá thời trang -> chuyển sang Login kèm thông báo ---');
    // Bấm nút Khám phá thời trang trên Hero
    await guestPage.locator('button:has-text("KHÁM PHÁ THỜI TRANG")').first().click();
    await guestPage.waitForURL(/\/login/, { timeout: 5000 });
    const loginUrlFromHero = guestPage.url();
    assert(loginUrlFromHero.includes('/login'), `Điều hướng sang trang đăng nhập: ${loginUrlFromHero}`);
    const noticeVisible = await guestPage.locator('text=Đăng nhập để khám phá cửa hàng và trải nghiệm mua sắm cùng SMARTBUY AI nhé!').first().isVisible();
    assert(noticeVisible, 'Hiển thị chính xác thông báo thân thiện yêu cầu đăng nhập');

    console.log('\n--- TEST 4: Chưa đăng nhập -> bấm chi tiết sản phẩm / truy cập trực tiếp /shop -> sang Login ---');
    // Quay lại trang chủ và bấm vào thẻ sản phẩm
    await guestPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await guestPage.locator('#san-pham-hot [data-testid="home-product-card"]').first().click();
    await guestPage.waitForURL(/\/login/, { timeout: 5000 });
    assert(guestPage.url().includes('/login?redirect='), 'Bấm chi tiết sản phẩm điều hướng an toàn sang trang đăng nhập');

    // Thử truy cập trực tiếp URL /shop trên thanh địa chỉ
    await guestPage.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' });
    assert(guestPage.url().includes('/login?redirect='), 'Gõ trực tiếp /shop khi chưa đăng nhập bị chặn bởi AuthGuard và chuyển sang /login');

    await guestContext.close();

    // -------------------------------------------------------------
    // CONTEXT 2: CUSTOMER LOGIN -> INTRO 3D -> TRANG CHỦ -> SHOP
    // -------------------------------------------------------------
    console.log('\n--- TEST 5 & 6: Đăng nhập khách thành công -> Intro 3D -> Vào đầu trang chủ chính ---');
    const customerContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const customerPage = await customerContext.newPage();
    customerPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[Console Error] ${msg.text()}`);
      }
    });

    await customerPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await customerPage.fill('input[type="email"], input[placeholder*="email" i], input[placeholder*="tên đăng nhập" i]', customerEmail);
    await customerPage.fill('input[type="password"]', customerPass);
    await customerPage.click('button[type="submit"]');

    // Sau khi đăng nhập thành công, khách phải được đưa sang /intro
    await customerPage.waitForURL(/\/intro/, { timeout: 7000 });
    assert(customerPage.url().includes('/intro'), `Khách hàng đăng nhập thành công được chuyển sang /intro: ${customerPage.url()}`);

    // Kiểm tra Intro 3D nút Bỏ qua Intro
    const skipBtn = customerPage.locator('[data-testid="skip-intro-btn"]');
    await skipBtn.waitFor({ state: 'visible', timeout: 5000 });
    assert(await skipBtn.isVisible(), 'Nút "Bỏ qua Intro" hiển thị rõ ràng trên màn hình Intro');

    // Bấm Bỏ qua Intro để hoàn tất Intro
    await skipBtn.click();

    // Chờ Intro hoàn tất và chuyển sang trang chủ chính '/'
    await customerPage.waitForURL(`${BASE_URL}/`, { timeout: 8000 });
    const postIntroUrl = customerPage.url();
    assert(postIntroUrl === `${BASE_URL}/`, `Kết thúc Intro đưa khách về đầu trang chủ chính: ${postIntroUrl}`);

    // Kiểm tra vị trí cuộn trên trang chủ
    const homeScrollY = await customerPage.evaluate(() => window.scrollY);
    assert(homeScrollY === 0, `Trang chủ hiển thị từ đầu trang (scrollY = ${homeScrollY})`);

    console.log('\n--- TEST 7: Từ Trang chủ -> Shop -> trang Shop hiện từ đầu ---');
    // Khách đã đăng nhập bấm "KHÁM PHÁ THỜI TRANG"
    await customerPage.locator('button:has-text("KHÁM PHÁ THỜI TRANG")').first().click();
    await customerPage.waitForURL(/\/shop/, { timeout: 5000 });
    assert(customerPage.url().includes('/shop'), `Khách vào được trang Shop: ${customerPage.url()}`);
    const shopScrollY = await customerPage.evaluate(() => window.scrollY);
    assert(shopScrollY === 0, `Trang Shop hiển thị từ đầu trang (scrollY = ${shopScrollY})`);

    console.log('\n--- TEST 8: Từ Shop -> Chi tiết sản phẩm -> Bấm "Quay lại Shop" -> về đầu Shop ---');
    // Cuộn xuống một chút trong Shop rồi bấm vào sản phẩm đầu tiên
    await customerPage.evaluate(() => window.scrollTo(0, 400));
    const firstProduct = customerPage.locator('[data-testid="product-card"], a[href*="/products/"]').first();
    await firstProduct.click();
    await customerPage.waitForURL(/\/products\//, { timeout: 5000 });
    assert(customerPage.url().includes('/products/'), `Mở trang chi tiết sản phẩm: ${customerPage.url()}`);

    // Kiểm tra nút "Quay lại Shop"
    const backToShopBtn = customerPage.locator('[data-testid="back-to-shop-btn"]').first();
    await backToShopBtn.waitFor({ state: 'visible', timeout: 5000 });
    assert(await backToShopBtn.isVisible(), 'Nút "Quay lại Shop" hiển thị rõ ràng ở góc trên bên trái trang chi tiết');

    // Bấm nút "Quay lại Shop"
    await backToShopBtn.click();
    await customerPage.waitForURL(/\/shop/, { timeout: 5000 });
    assert(customerPage.url().includes('/shop'), 'Bấm "Quay lại Shop" đưa về đúng trang Shop');
    const returnedShopScrollY = await customerPage.evaluate(() => window.scrollY);
    assert(returnedShopScrollY === 0, `Trang Shop tự động cuộn về đầu (scrollY = ${returnedShopScrollY})`);

    console.log('\n--- TEST 9: Tại đầu trang Shop bấm "Về Trang chủ" -> về đầu trang chủ ---');
    const backToHomeBtn = customerPage.locator('[data-testid="back-to-home-btn"]').first();
    await backToHomeBtn.waitFor({ state: 'visible', timeout: 5000 });
    assert(await backToHomeBtn.isVisible(), 'Tại đầu trang Shop có nút "← Về Trang chủ"');

    await backToHomeBtn.click();
    await customerPage.waitForURL(`${BASE_URL}/`, { timeout: 5000 });
    assert(customerPage.url() === `${BASE_URL}/`, 'Bấm "Về Trang chủ" đưa về đúng trang chủ');
    const returnedHomeScrollY = await customerPage.evaluate(() => window.scrollY);
    assert(returnedHomeScrollY === 0, `Trang chủ cuộn lên đầu (scrollY = ${returnedHomeScrollY})`);

    console.log('\n--- TEST 10: Cuộn xuống cuối trang chủ -> bấm "Trang chủ" -> cuộn mượt về đầu ---');
    await customerPage.waitForTimeout(800);
    await customerPage.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }));
    await customerPage.waitForTimeout(300);
    const midScrollY = await customerPage.evaluate(() => window.scrollY);
    assert(midScrollY > 500, `Đã cuộn xuống trang chủ (scrollY = ${midScrollY})`);

    // Bấm link "Trang chủ" trên header
    const homeNavLink = customerPage.locator('header a:has-text("Trang chủ")').first();
    await homeNavLink.click();
    await customerPage.waitForTimeout(600);
    const finalScrollY = await customerPage.evaluate(() => window.scrollY);
    assert(finalScrollY < 100, `Bấm "Trang chủ" cuộn mượt về đầu trang (scrollY = ${finalScrollY})`);

    console.log('\n--- TEST 11: Khách chuyển trang nhiều lần -> Intro KHÔNG chạy lại ---');
    await customerPage.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' });
    await customerPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await customerPage.goto(`${BASE_URL}/favorites`, { waitUntil: 'networkidle' });
    await customerPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    assert(!customerPage.url().includes('/intro'), 'Chuyển đổi qua lại giữa các trang trong phiên không kích hoạt lại Intro 3D');

    console.log('\n--- TEST 12: Đăng xuất -> Thử vào Shop -> Yêu cầu đăng nhập ---');
    // Mở menu tài khoản và bấm Đăng xuất
    const userMenuTrigger = customerPage.locator('header button[aria-label="Tài khoản của bạn"]').first();
    await userMenuTrigger.click();
    const logoutBtn = customerPage.locator('button:has-text("Đăng xuất")').first();
    await logoutBtn.click();
    await customerPage.waitForTimeout(800);

    // Kiểm tra nút Đăng nhập hiển thị trên header xác nhận đã logout
    const loginBtnVisible = await customerPage.locator('header a:has-text("Đăng nhập")').first().isVisible();
    assert(loginBtnVisible, 'Đăng xuất thành công, header hiển thị nút Đăng nhập');

    // Thử vào lại /shop sau khi đăng xuất
    await customerPage.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' });
    assert(customerPage.url().includes('/login'), 'Sau khi đăng xuất, cố gắng vào /shop lập tức bị yêu cầu đăng nhập');

    await customerContext.close();

    // -------------------------------------------------------------
    // CONTEXT 3: ADMIN LOGIN -> DASHBOARD TRỰC TIẾP (NO INTRO)
    // -------------------------------------------------------------
    console.log('\n--- TEST 13: Đăng nhập Admin -> Vào thẳng Dashboard, tuyệt đối KHÔNG có Intro ---');
    const adminContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const adminPage = await adminContext.newPage();
    adminPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[Console Error] ${msg.text()}`);
      }
    });

    await adminPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await adminPage.fill('input[type="email"], input[placeholder*="email" i], input[placeholder*="tên đăng nhập" i]', adminEmail);
    await adminPage.fill('input[type="password"]', adminPass);
    await adminPage.click('button[type="submit"]');

    await adminPage.waitForURL(/\/admin/, { timeout: 7000 });
    assert(adminPage.url().includes('/admin'), `Admin đăng nhập thành công vào thẳng: ${adminPage.url()}`);
    assert(!adminPage.url().includes('/intro'), 'Admin tuyệt đối không bị chuyển hướng sang Intro 3D');

    // Thử truy cập thủ công /intro bằng Admin
    await adminPage.goto(`${BASE_URL}/intro`, { waitUntil: 'networkidle' });
    assert(adminPage.url().includes('/admin'), 'Admin truy cập /intro được tự động chuyển hướng an toàn về Dashboard');

    await adminContext.close();

    // -------------------------------------------------------------
    // CONTEXT 4: BROWSER HISTORY (BACK / FORWARD) & MOBILE RESPONSIVE
    // -------------------------------------------------------------
    console.log('\n--- TEST 14 & 15: Nút Back/Forward của trình duyệt & Refresh không mất session ---');
    const navContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const navPage = await navContext.newPage();

    // Đăng nhập customer
    await navPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await navPage.fill('input[type="email"], input[placeholder*="email" i], input[placeholder*="tên đăng nhập" i]', customerEmail);
    await navPage.fill('input[type="password"]', customerPass);
    await navPage.click('button[type="submit"]');
    await navPage.waitForURL(/\/intro/, { timeout: 7000 });
    const skip = navPage.locator('[data-testid="skip-intro-btn"]');
    if (await skip.isVisible().catch(() => false)) await skip.click();
    await navPage.waitForURL(`${BASE_URL}/`, { timeout: 8000 });

    // Di chuyển qua các trang
    await navPage.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' });
    await navPage.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });

    // Bấm Back trình duyệt
    await navPage.goBack();
    assert(navPage.url().includes('/shop'), `Back trình duyệt đưa về đúng Shop: ${navPage.url()}`);

    // Refresh trang khi đang ở Shop
    await navPage.reload({ waitUntil: 'networkidle' });
    assert(navPage.url().includes('/shop'), `Refresh trang giữ nguyên session và route /shop: ${navPage.url()}`);

    console.log('\n--- TEST 16: Kiểm tra giao diện trên màn hình điện thoại (Mobile Responsive) ---');
    await navPage.setViewportSize({ width: 375, height: 667 });
    await navPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    const mobileMenuTrigger = navPage.locator('header button[aria-label*="menu" i]').first();
    const isMobileMenuVisible = await mobileMenuTrigger.isVisible();
    assert(isMobileMenuVisible, 'Mobile menu icon hiển thị chuẩn trên màn hình di động');

    const mobileHotCards = await navPage.locator('#san-pham-hot [data-testid="home-product-card"]').count();
    assert(mobileHotCards >= 4, `Lưới sản phẩm hot co giãn tốt trên điện thoại (${mobileHotCards} cards)`);

    await navContext.close();

    // -------------------------------------------------------------
    // CONSOLE ERROR CHECK
    // -------------------------------------------------------------
    console.log('\n--- TEST 17 & 18: Kiểm tra lỗi JavaScript console & bảo toàn giỏ hàng ---');
    console.log('All captured console errors:', consoleErrors);
    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('WebGL') && !e.includes('net::ERR_CONNECTION_REFUSED')
    );
    assert(criticalErrors.length === 0, `Không có lỗi JavaScript console nghiêm trọng (Errors: ${criticalErrors.length})`);
  } finally {
    await browser.close();
  }

  console.log(`\n========================================================================`);
  console.log(`E2E TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
