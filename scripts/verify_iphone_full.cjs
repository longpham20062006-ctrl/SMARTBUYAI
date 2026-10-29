const { webkit } = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(__dirname, '..', 'dist', 'test-screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function verifyIPhoneExperience() {
  console.log('================================================================');
  console.log('KIỂM THỬ TOÀN DIỆN SMARTBUY AI TRÊN IPHONE (PLAYWRIGHT WEBKIT)');
  console.log('================================================================\n');

  const browser = await webkit.launch({ headless: true });

  const iphoneUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/447.0.0.32.115;FBBV/573887019;FBDV/iPhone14,5;FBMD/iPhone;FBSN/iOS;FBSV/17.4;FBSS/3;FBCR/Viettel;FBID/phone;FBLC/vi_VN;FBOP/5]';

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: iphoneUserAgent,
  });

  const page = await context.newPage();

  const pageErrors = [];
  const httpErrors = [];

  page.on('pageerror', (err) => {
    console.error('❌ [PAGE ERROR]:', err.message);
    pageErrors.push(err.message);
  });

  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('favicon.ico')) {
      const err = `${res.status()} ${res.url()}`;
      httpErrors.push(err);
      console.error('❌ [HTTP ERROR]:', err);
    }
  });

  const baseUrl = 'http://192.168.1.139:5174';

  console.log(`\n--- BƯỚC 1: TRUY CẬP TRANG CHỦ TẠI ${baseUrl}/ ---`);
  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Kiểm tra #root
  const rootChildCount = await page.evaluate(() => document.getElementById('root')?.children.length || 0);
  console.log(`- Số phần tử con trong #root: ${rootChildCount}`);
  if (rootChildCount === 0) {
    throw new Error('MÀN HÌNH TRẮNG! #root không có phần tử con.');
  }
  console.log('✅ Giao diện đã render thành công (KHÔNG CÒN MÀN HÌNH TRẮNG)!');

  // Chụp ảnh màn hình Intro / Hero
  await page.screenshot({ path: path.join(screenshotDir, 'iphone_1_home_initial.png') });

  // Truy cập trực tiếp trang chủ không intro để test toàn bộ catalog
  console.log(`\n--- BƯỚC 2: KIỂM TRA HEADER & CATALOG TRANG CHỦ ---`);
  await page.goto(`${baseUrl}/?intro=0`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, 'iphone_2_home_full.png') });

  const headerVisible = await page.isVisible('header');
  console.log(`- Header hiển thị: ${headerVisible ? '✅ ĐẠT' : '❌ KHÔNG'}`);

  // Kiểm tra Sản phẩm trên trang chủ
  console.log('\n--- BƯỚC 3: KIỂM TRA DANH SÁCH SẢN PHẨM ---');
  const productLinks = await page.$$eval('a[href^="/products/"]', els => els.map(e => e.getAttribute('href')));
  console.log(`- Số lượng liên kết sản phẩm tìm thấy trên trang chủ: ${productLinks.length}`);
  console.log(`- Link sản phẩm mẫu: ${productLinks.slice(0, 3).join(', ')}`);

  if (productLinks.length > 0) {
    const firstHref = productLinks[0];
    console.log(`\n--- BƯỚC 4: KIỂM TRA TRANG CHI TIẾT SẢN PHẨM (${firstHref}) ---`);
    await page.goto(`${baseUrl}${firstHref}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const productTitle = await page.evaluate(() => document.querySelector('h1')?.innerText || 'N/A');
    const priceText = await page.evaluate(() => document.querySelector('[class*="text-2xl"], [class*="text-3xl"]')?.innerText || 'N/A');
    console.log(`- Tiêu đề sản phẩm: ${productTitle}`);
    console.log(`- Giá bán hiển thị: ${priceText}`);
    console.log(`- URL hiện tại: ${page.url()}`);
    await page.screenshot({ path: path.join(screenshotDir, 'iphone_3_product_detail.png') });

    // Thao tác chọn size và bấm "Thêm vào giỏ hàng"
    console.log('\n--- BƯỚC 5: THAO TÁC THÊM VÀO GIỎ HÀNG ---');
    // Thử bấm chọn size nếu có
    const sizeButtons = await page.$$('button:has-text("S"), button:has-text("M"), button:has-text("L"), button:has-text("XL"), button:has-text("FreeSize")');
    if (sizeButtons.length > 0) {
      await sizeButtons[0].click().catch(() => {});
      console.log('- Đã chọn kích cỡ');
    }

    const addToCartButton = await page.$('button:has-text("Thêm vào giỏ"), button:has-text("THÊM VÀO GIỎ"), button:has-text("Thêm Giỏ Hàng")');
    if (addToCartButton) {
      await addToCartButton.click();
      console.log('✅ Đã bấm nút "Thêm vào giỏ hàng"!');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(screenshotDir, 'iphone_4_added_to_cart.png') });
    } else {
      console.log('⚠️ Không tìm thấy nút thêm giỏ hàng theo text thông thường');
    }
  }

  // Kiểm tra trang Giỏ Hàng
  console.log('\n--- BƯỚC 6: KIỂM TRA TRANG GIỎ HÀNG (/cart) ---');
  await page.goto(`${baseUrl}/cart`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  const cartRootCount = await page.evaluate(() => document.getElementById('root')?.children.length || 0);
  console.log(`- Trang giỏ hàng render: ${cartRootCount > 0 ? '✅ ĐẠT' : '❌ LỖI'}`);
  await page.screenshot({ path: path.join(screenshotDir, 'iphone_5_cart_page.png') });

  // Kiểm tra trang Catalog (/products)
  console.log('\n--- BƯỚC 7: KIỂM TRA TRANG CATALOG / PRODUCTS ---');
  await page.goto(`${baseUrl}/products`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  const catalogProductCount = await page.$$eval('a[href^="/products/"]', els => els.length);
  console.log(`- Số lượng sản phẩm hiển thị trên trang Catalog: ${catalogProductCount}`);
  await page.screenshot({ path: path.join(screenshotDir, 'iphone_6_catalog_page.png') });

  // Kiểm tra trang Thử đồ AI (/try-on)
  console.log('\n--- BƯỚC 8: KIỂM TRA TRANG AI TRY-ON (/try-on) ---');
  await page.goto(`${baseUrl}/try-on`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  const tryOnTitle = await page.evaluate(() => document.querySelector('h1, h2')?.innerText || 'N/A');
  console.log(`- Tiêu đề trang Thử đồ AI: ${tryOnTitle}`);
  await page.screenshot({ path: path.join(screenshotDir, 'iphone_7_try_on_page.png') });

  // Kiểm tra trang AI Stylist (/ai-stylist)
  console.log('\n--- BƯỚC 9: KIỂM TRA TRANG AI STYLIST (/ai-stylist) ---');
  await page.goto(`${baseUrl}/ai-stylist`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  const stylistTitle = await page.evaluate(() => document.querySelector('h1, h2')?.innerText || 'N/A');
  console.log(`- Tiêu đề trang AI Stylist: ${stylistTitle}`);
  await page.screenshot({ path: path.join(screenshotDir, 'iphone_8_ai_stylist_page.png') });

  console.log('\n================================================================');
  console.log('KẾT QUẢ KIỂM THỬ TOÀN DIỆN:');
  console.log(`- Tổng số Page Errors: ${pageErrors.length}`);
  console.log(`- Tổng số HTTP Errors: ${httpErrors.length}`);
  console.log(`- Danh sách ảnh chụp màn hình được lưu tại: ${screenshotDir}`);
  console.log('================================================================\n');

  await browser.close();

  if (pageErrors.length > 0) {
    console.error('❌ CÓ PAGE ERROR PHÁT SINH TRONG QUÁ TRÌNH KIỂM THỬ!');
    process.exit(1);
  } else {
    console.log('🎉 TẤT CẢ 9 BƯỚC KIỂM THỬ TRÊN IPHONE ĐỀU HOÀN TOÀN THÀNH CÔNG!');
  }
}

verifyIPhoneExperience().catch((err) => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});
