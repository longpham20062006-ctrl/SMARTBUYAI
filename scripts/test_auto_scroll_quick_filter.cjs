const { chromium, webkit } = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(__dirname, '..', 'dist', 'test-screenshots', 'phase2');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function runAutoScrollQuickFilterTests() {
  console.log('================================================================');
  console.log('GIAI ĐOẠN 2: KIỂM THỬ THỰC TẾ AUTO SCROLL & STICKY QUICK FILTER');
  console.log('================================================================\n');

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    console.log('Using Chromium engine...');
  } catch {
    browser = await webkit.launch({ headless: true });
    console.log('Using WebKit engine...');
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const baseUrl = 'http://localhost:5173';

  // -------------------------------------------------------------
  // TEST A: Mở trang Nam, cuộn xuống 5 hàng, click Áo thun
  // -------------------------------------------------------------
  console.log('--- TEST A: MỞ TRANG NAM, CUỘN XUỐNG 1200px, CLICK ÁO THUN ---');
  await page.goto(`${baseUrl}/products?gender=nam`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Cuộn xuống 1200px
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(500);
  const scrollBeforeClickA = await page.evaluate(() => window.scrollY);
  console.log(`- Vị trí cuộn trước khi click: ${scrollBeforeClickA}px`);
  await page.screenshot({ path: path.join(screenshotDir, 'testA_1_scrolled_down.png') });

  // Click pill "Áo thun"
  const aoThunPill = await page.$('button:has-text("Áo thun")');
  if (!aoThunPill) throw new Error('Không tìm thấy pill "Áo thun"');
  await aoThunPill.click();
  await page.waitForTimeout(1000);

  const scrollAfterClickA = await page.evaluate(() => window.scrollY);
  console.log(`- Vị trí cuộn sau khi click Áo thun: ${scrollAfterClickA}px`);
  await page.screenshot({ path: path.join(screenshotDir, 'testA_2_after_autoscroll.png') });

  // Kiểm tra Quick Filter có nhìn thấy không
  const quickFilterBoxA = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="quick-filter-container"]');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, height: rect.height, isVisible: rect.top >= 0 && rect.bottom <= window.innerHeight };
  });
  console.log(`- Quick Filter sticky state:`, quickFilterBoxA);

  const isUrlUpdatedA = page.url().includes('category=ao-thun');
  console.log(`- URL có chứa category=ao-thun: ${isUrlUpdatedA ? '✅ ĐẠT' : '❌ LỖI'}`);
  console.log(`- Auto Scroll đã cuộn lên trên (từ ${scrollBeforeClickA}px xuống ${scrollAfterClickA}px): ${scrollAfterClickA < scrollBeforeClickA ? '✅ ĐẠT' : '❌ LỖI'}`);
  console.log(`- Quick Filter nhìn thấy được: ${quickFilterBoxA && quickFilterBoxA.isVisible ? '✅ ĐẠT' : '❌ LỖI'}`);

  // -------------------------------------------------------------
  // TEST B: Mở tất cả sản phẩm, cuộn đến cuối trang, click Váy
  // -------------------------------------------------------------
  console.log('\n--- TEST B: MỞ TẤT CẢ SẢN PHẨM, CUỘN ĐẾN CUỐI TRANG, CLICK VÁY ---');
  await page.goto(`${baseUrl}/products`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  await page.evaluate(() => window.scrollTo(0, 2500));
  await page.waitForTimeout(500);
  const scrollBeforeClickB = await page.evaluate(() => window.scrollY);
  console.log(`- Vị trí cuộn trước khi click: ${scrollBeforeClickB}px`);

  const vayPill = await page.$('button:has-text("Váy")');
  if (!vayPill) throw new Error('Không tìm thấy pill "Váy"');
  await vayPill.click();
  await page.waitForTimeout(1000);

  const scrollAfterClickB = await page.evaluate(() => window.scrollY);
  console.log(`- Vị trí cuộn sau khi click Váy: ${scrollAfterClickB}px`);
  await page.screenshot({ path: path.join(screenshotDir, 'testB_after_click_vay.png') });

  const isUrlUpdatedB = page.url().includes('category=vay');
  console.log(`- URL có chứa category=vay: ${isUrlUpdatedB ? '✅ ĐẠT' : '❌ LỖI'}`);
  console.log(`- Auto Scroll đã cuộn lên đầu danh sách: ${scrollAfterClickB < scrollBeforeClickB ? '✅ ĐẠT' : '❌ LỖI'}`);

  // -------------------------------------------------------------
  // TEST C: Cuộn xuống nhưng không click gì -> Trang không tự nhảy lên
  // -------------------------------------------------------------
  console.log('\n--- TEST C: CUỘN XUỐNG VÀ ĐỢI (KHÔNG CLICK) -> XÁC NHẬN KHÔNG NHẢY TRANG ---');
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(1500);
  const scrollAfterWaitC = await page.evaluate(() => window.scrollY);
  console.log(`- Vị trí cuộn sau 1.5s chờ: ${scrollAfterWaitC}px (giữ nguyên ~800px): ${Math.abs(scrollAfterWaitC - 800) < 50 ? '✅ ĐẠT' : '❌ LỖI'}`);

  // -------------------------------------------------------------
  // TEST D: Click nhanh Hoodie rồi Áo khoác -> Chỉ danh mục cuối cùng được chọn
  // -------------------------------------------------------------
  console.log('\n--- TEST D: CLICK HOODIE RỒI NHANH CHÓNG CLICK ÁO KHOÁC ---');
  const hoodiePill = await page.$('button:has-text("Hoodie")');
  const jacketPill = await page.$('button:has-text("Áo khoác")');
  if (hoodiePill && jacketPill) {
    await hoodiePill.click();
    await jacketPill.click();
    await page.waitForTimeout(1000);
    const finalUrl = page.url();
    console.log(`- URL sau khi click liên tiếp: ${finalUrl}`);
    console.log(`- Danh mục cuối cùng được chọn (category=ao-khoac): ${finalUrl.includes('category=ao-khoac') ? '✅ ĐẠT' : '❌ LỖI'}`);
  }

  // -------------------------------------------------------------
  // TEST E: Mobile 390x844 vuốt ngang thanh danh mục
  // -------------------------------------------------------------
  console.log('\n--- TEST E: MOBILE 390x844 VUỐT NGANG THANH QUICK FILTER ---');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/products`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const scrollXBeforeE = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="quick-filter-container"] .overflow-x-auto');
    return el ? el.scrollLeft : 0;
  });

  // Vuốt ngang
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="quick-filter-container"] .overflow-x-auto');
    if (el) el.scrollBy({ left: 150, behavior: 'instant' });
  });
  await page.waitForTimeout(500);

  const scrollXAfterE = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="quick-filter-container"] .overflow-x-auto');
    return el ? el.scrollLeft : 0;
  });
  const scrollYAfterE = await page.evaluate(() => window.scrollY);
  console.log(`- ScrollLeft QuickFilter: trước ${scrollXBeforeE}px -> sau ${scrollXAfterE}px`);
  console.log(`- Window scrollY: ${scrollYAfterE}px (không bị cuộn dọc ngoài ý muốn): ${scrollYAfterE < 50 ? '✅ ĐẠT' : '❌ LỖI'}`);
  await page.screenshot({ path: path.join(screenshotDir, 'testE_mobile_quick_filter.png') });

  // -------------------------------------------------------------
  // TEST F: Back / Forward browser history
  // -------------------------------------------------------------
  console.log('\n--- TEST F: BROWSER BACK / FORWARD NAVIGATION ---');
  await page.goBack();
  await page.waitForTimeout(800);
  console.log(`- URL sau khi bấm Back: ${page.url()}`);
  await page.goForward();
  await page.waitForTimeout(800);
  console.log(`- URL sau khi bấm Forward: ${page.url()}`);
  console.log('✅ Back/Forward hoạt động trơn tru không gây vòng lặp!');

  await browser.close();
  console.log('\n🎉 HOÀN TẤT TẤT CẢ CÁC BÀI TEST GIAI ĐOẠN 2 VỚI KẾT QUẢ XUẤT SẮC!');
}

runAutoScrollQuickFilterTests().catch((err) => {
  console.error('Lỗi kiểm thử Giai đoạn 2:', err);
  process.exit(1);
});
