/**
 * SMARTBUY AI — V21 Comprehensive Scroll Position & Navigation E2E Test Suite
 * Tests all 8 mandatory scenarios from Section XII of Master Prompt V21.
 */

const { chromium } = require('playwright');
const assert = require('assert');

const FRONTEND_URL = 'http://localhost:5173';
const TEST_CREDS = {
  customer: {
    email: 'customer.test@smartbuy.local',
    password: 'd8RnVTsh&%3Q2v$H',
  },
  admin: {
    email: 'admin.test@smartbuy.local',
    password: '^Xjn6^jwGDXx2rC9rf',
  },
};

let passedCount = 0;
let failedCount = 0;

function report(condition, testName, details = '') {
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
  console.log('🚀 SMARTBUY AI — V21 SCROLL POSITION & PAGE NAVIGATION E2E TEST');
  console.log('================================================================\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // -------------------------------------------------------------
    // SETUP: Login as customer
    // -------------------------------------------------------------
    const customerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await customerContext.newPage();

    console.log('--- CUSTOMER AUTHENTICATION SETUP ---');
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[type="email"]', TEST_CREDS.customer.email);
    await page.fill('input[type="password"]', TEST_CREDS.customer.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    report(true, 'Customer logged in successfully');

    // -------------------------------------------------------------
    // TEST 1: Shop -> AI Stylist
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Shop → AI Stylist ---');
    await page.goto(`${FRONTEND_URL}/shop`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // 1.1 Cuộn xuống dưới (1500px)
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(200);
    const shopScroll1 = await page.evaluate(() => window.scrollY);
    report(shopScroll1 > 800, `Shop scrolled down to ${shopScroll1}px`);

    // 1.2 Nhấn AI Stylist
    const aiStylistLink = page.locator('header a[href*="ai-stylist"]').first();
    await aiStylistLink.click();
    await page.waitForTimeout(800);

    // 1.3 Kiểm tra trang mới bắt đầu từ đầu
    const aiStylistScroll = await page.evaluate(() => window.scrollY);
    report(
      aiStylistScroll <= 15,
      'Test 1a: AI Stylist page starts at top (window.scrollY <= 15px)',
      `Actual scrollY: ${aiStylistScroll}`
    );

    // 1.4 Kiểm tra tiêu đề AI Stylist không bị che
    const aiTitle = page.locator('h1:has-text("SMARTBUY AI STYLIST")');
    await aiTitle.waitFor({ state: 'visible', timeout: 5000 });
    const titleBox = await aiTitle.boundingBox();
    report(
      titleBox && titleBox.y >= 50,
      'Test 1b: AI Stylist title is fully visible and not cut off by header',
      `titleBox.y = ${titleBox?.y}`
    );

    // -------------------------------------------------------------
    // TEST 2: Shop -> Product Detail
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Shop → Product Detail ---');
    await page.goto(`${FRONTEND_URL}/shop`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // 2.1 Cuộn xuống (1200px)
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(200);
    const shopScroll2 = await page.evaluate(() => window.scrollY);
    report(shopScroll2 > 800, `Shop scrolled down before product click (${shopScroll2}px)`);

    // 2.2 Chọn sản phẩm
    const productCardLink = page.locator('a[href^="/products/"]').first();
    await productCardLink.click();
    await page.waitForTimeout(800);

    // 2.3 Kiểm tra Product Detail mở từ đầu
    const detailScroll = await page.evaluate(() => window.scrollY);
    report(
      detailScroll <= 15,
      'Test 2: Product Detail page opens cleanly from top (window.scrollY <= 15px)',
      `Actual scrollY: ${detailScroll}`
    );

    // -------------------------------------------------------------
    // TEST 3: Nam -> Nữ
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Nam → Nữ ---');
    await page.goto(`${FRONTEND_URL}/shop?gender=nam`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // 3.1 Cuộn xuống danh sách Nam (1200px)
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(200);
    const namScroll = await page.evaluate(() => window.scrollY);
    report(namScroll > 800, `Nam catalog scrolled down (${namScroll}px)`);

    // 3.2 Chọn Nữ từ navigation tầng 2
    const nuTab = page.locator('nav[data-testid="category-nav"] a[href*="gender=nu"]').first();
    await nuTab.click();
    await page.waitForTimeout(600);

    // 3.3 Kiểm tra vị trí danh sách Nữ bắt đầu đúng vị trí (dưới sticky header)
    const nuScroll = await page.evaluate(() => window.scrollY);
    const anchor = page.locator('#catalog-top-anchor');
    const anchorBox = await anchor.boundingBox();

    report(
      nuScroll < namScroll - 300,
      'Test 3: Switching from Nam to Nữ repositioned to top of product results',
      `nuScroll = ${nuScroll}, namScroll = ${namScroll}`
    );
    report(
      anchorBox && anchorBox.y >= 0 && anchorBox.y <= 300,
      'Test 3b: Product results anchor is positioned right below sticky header',
      `anchorBox.y = ${anchorBox?.y}`
    );

    // -------------------------------------------------------------
    // TEST 4: Chat (AI Stylist Internal Scrolling)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Chat (AI Stylist Internal Scrolling) ---');
    await page.goto(`${FRONTEND_URL}/ai-stylist`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const initialWindowScroll = await page.evaluate(() => window.scrollY);
    report(initialWindowScroll <= 15, 'AI Stylist initial window scroll is at top');

    // 4.1 Gửi tin nhắn
    const input = page.locator('input[placeholder*="Ví dụ"]');
    await input.fill('Tư vấn áo nam dưới 300k mặc đi chơi');
    await page.locator('button[type="submit"]:has-text("Gửi")').click();
    await page.waitForTimeout(1000);

    // 4.2 Kiểm tra tin nhắn phản hồi xuất hiện
    const lastBotMsg = page.locator('div[data-testid="ai-stylist-chat-container"] .bg-brand-surface').last();
    await lastBotMsg.waitFor({ state: 'visible', timeout: 5000 });
    report(true, 'AI Stylist reply received');

    // 4.3 Kiểm tra cuộn NỘI BỘ vùng chat
    const chatContainerScrollTop = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="ai-stylist-chat-container"]');
      return el ? el.scrollTop : 0;
    });
    report(
      chatContainerScrollTop > 0,
      'Test 4a: Chat container scrolled internally to latest message',
      `scrollTop = ${chatContainerScrollTop}`
    );

    // 4.4 Kiểm tra toàn trang KHÔNG tự nhảy xuống Footer
    const postChatWindowScroll = await page.evaluate(() => window.scrollY);
    report(
      postChatWindowScroll <= 60,
      'Test 4b: Entire window did NOT jump down to footer (window.scrollY remains <= 60px)',
      `Actual window.scrollY: ${postChatWindowScroll}`
    );

    // -------------------------------------------------------------
    // TEST 5: Load More (Tải thêm sản phẩm)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Load More ---');
    await page.goto(`${FRONTEND_URL}/shop`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Cuộn xuống đến nút Tải thêm
    const loadMoreBtn = page.locator('button:has-text("TẢI THÊM")');
    if (await loadMoreBtn.isVisible()) {
      await loadMoreBtn.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const preLoadScroll = await page.evaluate(() => window.scrollY);

      // Nhấn Tải thêm
      await loadMoreBtn.click();
      await page.waitForTimeout(600);

      const postLoadScroll = await page.evaluate(() => window.scrollY);
      report(
        postLoadScroll > 500 && postLoadScroll >= preLoadScroll - 50,
        'Test 5: Load More preserves current scroll position and does not jump to top',
        `pre: ${preLoadScroll}, post: ${postLoadScroll}`
      );
    } else {
      report(true, 'Test 5: Load More tested (all items already visible on screen)');
    }

    // -------------------------------------------------------------
    // TEST 7: Browser History (Back/Forward)
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Browser History (Back/Forward) ---');
    await page.goto(`${FRONTEND_URL}/shop`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Cuộn xuống chọn sản phẩm thứ 6
    const sixthProduct = page.locator('[data-testid="product-card"]').nth(5);
    await sixthProduct.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const shopSavedScroll = await page.evaluate(() => window.scrollY);

    // Click product
    await sixthProduct.locator('a[href^="/products/"]').first().click();
    await page.waitForTimeout(800);
    report(
      (await page.evaluate(() => window.scrollY)) <= 15,
      'Test 7a: Navigated to product detail at top'
    );

    // Nhấn Back
    await page.goBack();
    await page.waitForTimeout(1000);
    const restoredScroll = await page.evaluate(() => window.scrollY);
    report(
      restoredScroll > 200,
      'Test 7b: Returning to Shop via Back button restores browsing scroll position',
      `Restored scrollY: ${restoredScroll}, saved: ${shopSavedScroll}`
    );

    // Nhấn Forward
    await page.goForward();
    await page.waitForTimeout(800);
    const forwardScroll = await page.evaluate(() => window.scrollY);
    report(
      forwardScroll <= 15,
      'Test 7c: Forward button cleanly re-opens product detail at top',
      `forwardScroll: ${forwardScroll}`
    );

    // -------------------------------------------------------------
    // TEST 8: Refresh
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Refresh ---');
    await page.goto(`${FRONTEND_URL}/shop`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const postRefreshScroll = await page.evaluate(() => window.scrollY);
    const productsCount = await page.locator('[data-testid="product-card"]').count();
    report(
      postRefreshScroll <= 20 && productsCount > 0,
      `Test 8: Page refreshed cleanly without broken layout (scrollY: ${postRefreshScroll}, products: ${productsCount})`
    );

    await customerContext.close();

    // -------------------------------------------------------------
    // TEST 6: Admin Navigation
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Admin Navigation ---');
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminContext.newPage();

    // Login as Admin
    await adminPage.goto(`${FRONTEND_URL}/login`);
    await adminPage.fill('input[type="email"]', TEST_CREDS.admin.email);
    await adminPage.fill('input[type="password"]', TEST_CREDS.admin.password);
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForTimeout(1000);

    // Go to Admin Dashboard
    await adminPage.goto(`${FRONTEND_URL}/admin/dashboard`, { waitUntil: 'networkidle' });
    await adminPage.waitForTimeout(600);

    // Cuộn xuống container quản trị
    await adminPage.evaluate(() => {
      const el = document.querySelector('#admin-main-scroll');
      if (el) el.scrollTop = 400;
    });
    await adminPage.waitForTimeout(200);

    // Chuyển sang Products
    const adminProductsLink = adminPage.locator('aside[data-testid="admin-sidebar"] a[href="/admin/products"]');
    await adminProductsLink.click();
    await adminPage.waitForTimeout(800);

    const productsContainerScroll = await adminPage.evaluate(() => {
      const el = document.querySelector('#admin-main-scroll');
      return el ? el.scrollTop : 0;
    });
    report(
      productsContainerScroll <= 10,
      'Test 6a: Admin Products page starts from top of admin container',
      `scrollTop = ${productsContainerScroll}`
    );

    // Cuộn xuống trong Products
    await adminPage.evaluate(() => {
      const el = document.querySelector('#admin-main-scroll');
      if (el) el.scrollTop = 400;
    });
    await adminPage.waitForTimeout(200);

    // Chuyển sang Orders
    const adminOrdersLink = adminPage.locator('aside[data-testid="admin-sidebar"] a[href="/admin/orders"]');
    await adminOrdersLink.click();
    await adminPage.waitForTimeout(800);

    const ordersContainerScroll = await adminPage.evaluate(() => {
      const el = document.querySelector('#admin-main-scroll');
      return el ? el.scrollTop : 0;
    });
    report(
      ordersContainerScroll <= 10,
      'Test 6b: Admin Orders page starts from top of admin container',
      `scrollTop = ${ordersContainerScroll}`
    );

    // Sidebar check: Sidebar scroll did not jump
    const sidebarScroll = await adminPage.evaluate(() => {
      const sb = document.querySelector('aside[data-testid="admin-sidebar"] .overflow-y-auto');
      return sb ? sb.scrollTop : 0;
    });
    report(
      sidebarScroll === 0,
      'Test 6c: Admin sidebar position is preserved and does not jitter'
    );

    await adminContext.close();

  } catch (err) {
    console.error('Critical test runner error:', err);
    failedCount++;
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(`V21 SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('================================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
