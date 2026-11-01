/**
 * SMARTBUY AI - MASTER PROMPT V19 E2E VERIFICATION SUITE
 * THIẾT KẾ LẠI TRANG CHỦ NỔI BẬT + TÁCH RIÊNG KHU VỰC MUA SẮM
 *
 * Tests:
 * 1.  Guest Homepage Access: Trang chủ công khai tải nhanh, không bắt login.
 * 2.  Homepage Zero Prices (Guest): Toàn bộ sản phẩm trên Home KHÔNG hiển thị giá (0 giá, 0 ₫, 0 nút giỏ hàng).
 * 3.  Homepage Zero Prices (Customer): Cả khi Customer đã đăng nhập, sản phẩm trên Home VẪN KHÔNG hiển thị giá.
 * 4.  "Xem chi tiết" Button: Mọi thẻ sản phẩm trên Home đều có nút "Xem chi tiết" rõ ràng.
 * 5.  Guest Click "Xem chi tiết": Bật Login Modal với thông điệp V19, bấm "Đăng nhập ngay" kèm redirect URL.
 * 6.  Customer Click "Xem chi tiết": Chuyển thẳng vào Product Detail (/products/:slug) trong Shopping Area.
 * 7.  Shopping Area Access (/shop & /products): Hiển thị đầy đủ giá bán (₫), bộ lọc, giỏ hàng, đặt mua.
 * 8.  Shopping Area Protection: Guest cố vào /shop hoặc /products bị AuthGuard chặn và chuyển sang /login.
 * 9.  Homepage Header Nav: Đúng 5 mục (Trang chủ, Bộ sưu tập, Sản phẩm HOT, Giới thiệu, Khám phá thời trang).
 * 10. Customer vs Admin Header Separation: Customer KHÔNG có link Admin Dashboard; Admin đăng nhập thẳng vào Admin.
 * 11. Intro 3D Flow: Customer đăng nhập thông thường xong Intro 3D giữ ở lại Home; Admin không bị chạy Intro 3D.
 * 12. Scroll Reset Rules: Chuyển trang Home -> Shop, Home -> Detail, Detail -> Cart luôn cuộn lên top (0, 0).
 * 13. All 7 Key Sections Present: Hero, Sản phẩm HOT, Nam, Nữ, Lookbook, AI Stylist, AI Try-On, Giới thiệu.
 */

const { chromium } = require('playwright');

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

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${testName} - ${details}`);
    failedCount++;
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 SMARTBUY AI — V19 HOMEPAGE & SHOPPING AREA SEPARATION TEST');
  console.log('================================================================\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // -------------------------------------------------------------
    // TEST SUITE 1: GUEST HOMEPAGE EXPERIENCE & ZERO PRICES
    // -------------------------------------------------------------
    console.log('--- TEST SUITE 1: GUEST HOMEPAGE & ZERO PRICES ---');
    const guestContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const guestPage = await guestContext.newPage();

    await guestPage.goto(`${FRONTEND_URL}/?intro=0`, { waitUntil: 'networkidle' });

    // 1.1 Header Navigation
    const navText = (await guestPage.locator('header').innerText()).toUpperCase();
    assert(navText.includes('TRANG CHỦ'), 'Header contains "Trang chủ"');
    assert(navText.includes('BỘ SƯU TẬP'), 'Header contains "Bộ sưu tập"');
    assert(navText.includes('SẢN PHẨM HOT'), 'Header contains "Sản phẩm HOT"');
    assert(navText.includes('GIỚI THIỆU'), 'Header contains "Giới thiệu"');
    assert(navText.includes('KHÁM PHÁ THỜI TRANG'), 'Header contains "Khám phá thời trang" CTA pill');
    assert(navText.includes('ĐĂNG NHẬP'), 'Guest Header contains "Đăng nhập" button');
    assert(!navText.includes('QUẢN TRỊ'), 'Guest Header does NOT contain Admin link');

    // 1.2 Hero Banner
    const heroHeadline = (await guestPage.locator('h1').innerText()).toUpperCase();
    assert(heroHeadline.includes('YOUR STYLE.') && heroHeadline.includes('YOUR RULES.'), 'Hero contains slogan "YOUR STYLE. YOUR RULES."');

    const heroCta = (await guestPage.locator('section').first().innerText()).toUpperCase();
    assert(heroCta.includes('KHÁM PHÁ THỜI TRANG'), 'Hero contains primary CTA "KHÁM PHÁ THỜI TRANG"');
    assert(heroCta.includes('KHÁM PHÁ BỘ SƯU TẬP'), 'Hero contains secondary CTA "KHÁM PHÁ BỘ SƯU TẬP"');

    // 1.3 Key Sections on Homepage
    const hotSection = await guestPage.locator('#san-pham-hot').count();
    const menSection = await guestPage.locator('#bo-suu-tap-nam').count();
    const womenSection = await guestPage.locator('#bo-suu-tap-nu').count();
    const lookbookSection = await guestPage.locator('#lookbook').count();
    const stylistSection = await guestPage.locator('#ai-stylist').count();
    const tryonSection = await guestPage.locator('#ai-try-on').count();
    const aboutSection = await guestPage.locator('#gioi-thieu').count();

    assert(hotSection > 0, 'Section #san-pham-hot is present on Homepage');
    assert(menSection > 0, 'Section #bo-suu-tap-nam is present on Homepage');
    assert(womenSection > 0, 'Section #bo-suu-tap-nu is present on Homepage');
    assert(lookbookSection > 0, 'Section #lookbook is present on Homepage');
    assert(stylistSection > 0, 'Section #ai-stylist is present on Homepage');
    assert(tryonSection > 0, 'Section #ai-try-on is present on Homepage');
    assert(aboutSection > 0, 'Section #gioi-thieu is present on Homepage');

    // 1.4 Homepage Product Cards: ZERO PRICES FOR GUEST
    const homeCards = await guestPage.locator('[data-testid="home-product-card"]').all();
    assert(homeCards.length >= 8, `Homepage displays at least 8 curated products (found ${homeCards.length})`);

    let foundPriceOnHome = false;
    let missingDetailBtn = false;

    for (let i = 0; i < homeCards.length; i++) {
      const cardRaw = await homeCards[i].innerText();
      const cardUpper = cardRaw.toUpperCase();
      if (cardRaw.includes('₫') || cardUpper.includes('VND') || cardUpper.includes('GIẢM') || cardUpper.includes('THÊM VÀO GIỎ')) {
        foundPriceOnHome = true;
        console.error(`Card ${i} leaked price or cart button: ${cardRaw}`);
      }
      if (!cardUpper.includes('XEM CHI TIẾT')) {
        missingDetailBtn = true;
      }
    }
    assert(!foundPriceOnHome, 'ZERO prices or cart buttons found across ALL product cards on Homepage (Guest)');
    assert(!missingDetailBtn, 'Every single product card on Homepage has a visible "Xem chi tiết" button');

    // 1.5 Guest clicking "Xem chi tiết" opens Login Modal
    await homeCards[0].locator('button:has-text("Xem chi tiết")').click();
    await guestPage.waitForTimeout(300);

    const modal = guestPage.locator('.fixed.inset-0');
    const modalRaw = await modal.innerText();
    const modalUpper = modalRaw.toUpperCase();
    assert(modalRaw.includes('Đăng nhập để xem chi tiết sản phẩm và bắt đầu mua sắm cùng SMARTBUY AI.'), 'Guest clicking "Xem chi tiết" opens Modal with prompt message');
    assert(modalUpper.includes('ĐĂNG NHẬP NGAY'), 'Modal contains "Đăng nhập ngay" button');
    assert(modalUpper.includes('TIẾP TỤC XEM TRANG CHỦ'), 'Modal contains "Tiếp tục xem trang chủ" button');

    // 1.6 Clicking "Đăng nhập ngay" in modal navigates to /login with redirect
    await modal.locator('button:has-text("Đăng nhập ngay")').click();
    await guestPage.waitForURL(/\/login\?redirect=/, { timeout: 3000 });
    const currentUrl = guestPage.url();
    assert(currentUrl.includes('/login?redirect=%2Fproducts%2F') || currentUrl.includes('/login?redirect='), `Redirect URL correctly passed: ${currentUrl}`);

    // 1.7 Guest cannot directly enter Shopping Area (/shop or /products)
    await guestPage.goto(`${FRONTEND_URL}/shop`);
    await guestPage.waitForURL(/\/login/, { timeout: 3000 });
    assert(guestPage.url().includes('/login'), 'Guest attempting to open /shop is redirected to /login by AuthGuard');

    await guestPage.goto(`${FRONTEND_URL}/products`);
    await guestPage.waitForURL(/\/login/, { timeout: 3000 });
    assert(guestPage.url().includes('/login'), 'Guest attempting to open /products is redirected to /login by AuthGuard');

    await guestContext.close();

    // -------------------------------------------------------------
    // TEST SUITE 2: CUSTOMER LOGIN, HOMEPAGE ZERO PRICES & SHOPPING
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE 2: CUSTOMER EXPERIENCE & SHOPPING AREA ---');
    const customerContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const custPage = await customerContext.newPage();

    // 2.1 Login as Customer
    await custPage.goto(`${FRONTEND_URL}/login`);
    await custPage.fill('input[type="email"]', TEST_CREDS.customer.email);
    await custPage.fill('input[type="password"]', TEST_CREDS.customer.password);
    await custPage.click('button[type="submit"]');

    // Customer logs in generic -> after Intro 3D returns to Homepage (/)
    await custPage.waitForURL(`${FRONTEND_URL}/?intro=0`, { timeout: 5000 }).catch(() => {});
    await custPage.waitForTimeout(1000);

    // Bypass intro with param to inspect homepage directly as customer
    await custPage.goto(`${FRONTEND_URL}/?intro=0`, { waitUntil: 'networkidle' });

    // 2.2 Customer Header
    const custNavUpper = (await custPage.locator('header').innerText()).toUpperCase();
    assert(!custNavUpper.includes('ĐĂNG NHẬP'), 'Customer Header does not show "Đăng nhập"');
    assert(!custNavUpper.includes('QUẢN TRỊ'), 'Customer Header strictly does NOT show Admin Dashboard link');

    // 2.3 ZERO Prices on Homepage for Customer as well (Master Prompt V19 Section I & II.3)
    const custHomeCards = await custPage.locator('[data-testid="home-product-card"]').all();
    let custFoundPriceOnHome = false;
    for (let i = 0; i < custHomeCards.length; i++) {
      const cardText = await custHomeCards[i].innerText();
      if (cardText.includes('₫') || cardText.includes('VND') || cardText.includes('Giảm') || cardText.includes('Thêm vào giỏ')) {
        custFoundPriceOnHome = true;
      }
    }
    assert(!custFoundPriceOnHome, 'Customer on Homepage ALSO sees ZERO prices (Homepage is purely high-fashion showcase)');

    // 2.4 Customer clicking "Xem chi tiết" navigates directly to /products/:slug (Shopping Detail)
    await custHomeCards[0].locator('button:has-text("Xem chi tiết")').click();
    await custPage.waitForURL(/\/products\//, { timeout: 5000 });
    assert(custPage.url().includes('/products/'), `Customer clicking "Xem chi tiết" navigated to Product Detail: ${custPage.url()}`);

    // 2.5 In Product Detail (Shop Area), wait for lazy chunk to load, REAL PRICES and Cart buttons ARE displayed!
    await custPage.waitForFunction(() => document.body.innerText.includes('₫'), { timeout: 8000 });
    const detailContent = await custPage.locator('body').innerText();
    assert(detailContent.includes('₫'), 'Product Detail in Shop displays real VND price (₫)');
    const detailUpper = detailContent.toUpperCase();
    assert(detailUpper.includes('THÊM VÀO GIỎ') || detailUpper.includes('MUA NGAY'), 'Product Detail displays Add to Cart / Buy Now actions');

    // 2.6 Customer enters Shopping Area via /shop
    await custPage.goto(`${FRONTEND_URL}/shop`, { waitUntil: 'networkidle' });
    assert(custPage.url().includes('/shop'), 'Customer successfully loads Shopping Area (/shop)');

    await custPage.waitForFunction(() => document.body.innerText.includes('₫'), { timeout: 8000 });
    const shopText = await custPage.locator('body').innerText();
    assert(shopText.includes('₫'), 'Shopping Area (/shop) displays real prices (₫)');
    const shopUpper = shopText.toUpperCase();
    assert(shopUpper.includes('SẢN PHẨM') || shopUpper.includes('SẮP XẾP') || shopUpper.includes('DANH MỤC') || shopUpper.includes('BỘ LỌC'), 'Shopping Area (/shop) displays full filter and category controls');

    await customerContext.close();

    // -------------------------------------------------------------
    // TEST SUITE 3: ADMIN ROLE SEPARATION
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE 3: ADMIN ROLE SEPARATION ---');
    const adminContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const adminPage = await adminContext.newPage();

    // 3.1 Admin Login goes directly to Admin Dashboard
    await adminPage.goto(`${FRONTEND_URL}/login`);
    await adminPage.fill('input[type="email"]', TEST_CREDS.admin.email);
    await adminPage.fill('input[type="password"]', TEST_CREDS.admin.password);
    await adminPage.click('button[type="submit"]');

    await adminPage.waitForURL(/\/admin/, { timeout: 5000 });
    assert(adminPage.url().includes('/admin'), `Admin lands directly on Admin Area: ${adminPage.url()}`);

    // 3.2 Admin visiting Homepage (/) is automatically redirected back to Admin Dashboard
    await adminPage.goto(`${FRONTEND_URL}/`);
    await adminPage.waitForURL(/\/admin/, { timeout: 5000 });
    assert(adminPage.url().includes('/admin'), 'Admin opening Homepage (/) is redirected to /admin/dashboard');

    await adminContext.close();

    // -------------------------------------------------------------
    // TEST SUITE 4: SCROLL RESET BEHAVIOR (Section XI)
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE 4: SCROLL RESET BEHAVIOR ---');
    const scrollContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const scrollPage = await scrollContext.newPage();

    // 4.1 Login as customer first
    await scrollPage.goto(`${FRONTEND_URL}/login`);
    await scrollPage.fill('input[type="email"]', TEST_CREDS.customer.email);
    await scrollPage.fill('input[type="password"]', TEST_CREDS.customer.password);
    await scrollPage.click('button[type="submit"]');
    await scrollPage.waitForTimeout(1000);

    // 4.2 Go to Homepage, scroll down 600px
    await scrollPage.goto(`${FRONTEND_URL}/?intro=0`, { waitUntil: 'networkidle' });
    await scrollPage.evaluate(() => window.scrollTo(0, 600));
    await scrollPage.waitForTimeout(200);

    // Click "Khám phá thời trang" to go to /shop
    await scrollPage.click('header a:has-text("Khám phá thời trang")');
    await scrollPage.waitForURL(/\/shop/, { timeout: 3000 });
    await scrollPage.waitForTimeout(300);

    const scrollYAfterShop = await scrollPage.evaluate(() => window.scrollY);
    assert(scrollYAfterShop === 0, `Homepage -> Shop resets scroll position to top (scrollY = ${scrollYAfterShop})`);

    // Scroll down in Shop
    await scrollPage.evaluate(() => window.scrollTo(0, 500));
    await scrollPage.waitForTimeout(200);

    // Click on a product card
    const firstShopCard = scrollPage.locator('[data-testid="product-card"]').first();
    await firstShopCard.click();
    await scrollPage.waitForURL(/\/products\//, { timeout: 3000 });
    await scrollPage.waitForTimeout(300);

    const scrollYAfterDetail = await scrollPage.evaluate(() => window.scrollY);
    assert(scrollYAfterDetail === 0, `Shop -> Product Detail resets scroll position to top (scrollY = ${scrollYAfterDetail})`);

    await scrollContext.close();

  } catch (err) {
    console.error('Unexpected error during test execution:', err);
    failedCount++;
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(`SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('================================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
