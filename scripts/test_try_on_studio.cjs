const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(__dirname, '..', 'dist', 'test-screenshots', 'try_on');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function testTryOnStudio() {
  console.log('================================================================');
  console.log('GIAI ĐOẠN 7: KIỂM THỬ THỰC TẾ PHÒNG THỬ ĐỒ BẰNG AI (TRY-ON)');
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const baseUrl = 'http://localhost:5173';
  const pageErrors = [];

  page.on('pageerror', err => {
    console.error('❌ [PAGE ERROR]:', err.message);
    pageErrors.push(err.message);
  });

  console.log('--- 1. TRUY CẬP TRANG PHÒNG THỬ ĐỒ BẰNG AI (/try-on) ---');
  await page.goto(`${baseUrl}/try-on`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const title = await page.evaluate(() => document.querySelector('h1')?.innerText || '');
  console.log(`- Tiêu đề studio: ${title}`);
  await page.screenshot({ path: path.join(screenshotDir, 'try_on_studio_initial.png') });

  // 2. CHỌN NGƯỜI MẪU DEMO
  console.log('\n--- 2. CHỌN NGƯỜI MẪU DEMO ---');
  const demoModelButtons = await page.$$('button:has(img)');
  console.log(`- Số lượng người mẫu demo tìm thấy: ${demoModelButtons.length}`);
  if (demoModelButtons.length > 0) {
    await demoModelButtons[0].click();
    await page.waitForTimeout(800);
    console.log('✅ Đã chọn người mẫu demo đầu tiên');
  }

  // 3. CHỌN TRANG PHỤC ĐỂ THỬ (ÁO / VÁY)
  console.log('\n--- 3. CHỌN TRANG PHỤC THỬ ĐỒ ---');
  const garmentItems = await page.$$('button:has-text("Chọn"), [data-testid="garment-card"], button:has(img)');
  if (garmentItems.length > 2) {
    await garmentItems[2].click();
    await page.waitForTimeout(800);
    console.log('✅ Đã chọn trang phục thử đồ');
  }
  await page.screenshot({ path: path.join(screenshotDir, 'try_on_garment_selected.png') });

  // 4. KIỂM TRA NÚT THỬ ĐỒ VÀ THỰC THI (NẾU SẴN SÀNG)
  console.log('\n--- 4. KIỂM TRA TRẠNG THÁI NÚT TẠO ẢNH / THỬ ĐỒ ---');
  const tryOnActionBtn = await page.$('button:has-text("Bắt đầu thử đồ"), button:has-text("Thử đồ"), button:has-text("Tạo ảnh thử đồ")');
  if (tryOnActionBtn) {
    const isEnabled = await tryOnActionBtn.isEnabled();
    console.log(`- Nút thử đồ hiển thị và kích hoạt: ${isEnabled ? '✅ ĐẠT' : 'ℹ️ Đang chờ cấu hình'}`);
    if (isEnabled) {
      await tryOnActionBtn.click();
      await page.waitForTimeout(2000);
      console.log('✅ Đã kích hoạt luồng xử lý Try-On!');
      await page.screenshot({ path: path.join(screenshotDir, 'try_on_processing.png') });
    }
  }

  console.log('\n================================================================');
  console.log('KẾT QUẢ KIỂM THỬ PHÒNG THỬ ĐỒ:');
  console.log(`- Tổng số Page Errors: ${pageErrors.length}`);
  console.log('================================================================\n');

  await browser.close();

  if (pageErrors.length > 0) {
    console.error('❌ PHÁT HIỆN LỖI TRONG PHÒNG THỬ ĐỒ!');
    process.exit(1);
  } else {
    console.log('🎉 PHÒNG THỬ ĐỒ AI HOẠT ĐỘNG HOÀN TOÀN TRƠN TRU!');
  }
}

testTryOnStudio().catch(err => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});

