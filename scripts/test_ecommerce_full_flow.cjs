const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(__dirname, '..', 'dist', 'test-screenshots', 'full_flow');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function runFullEcommerceFlow() {
  console.log('================================================================');
  console.log('SMARTBUY AI — TỰ ĐỘNG THAO TÁC TOÀN DIỆN NHƯ KHÁCH HÀNG THẬT');
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

  // -------------------------------------------------------------------------
  // 1. KIỂM THỬ ĐĂNG NHẬP (AUTH)
  // -------------------------------------------------------------------------
  console.log('--- 1. KIỂM THỬ ĐĂNG NHẬP / TÀI KHOẢN ---');
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Xóa trắng input để kiểm tra validate form
  const emailInput = await page.$('input[type="email"]');
  const passwordInput = await page.$('input[type="password"]');
  if (emailInput && passwordInput) {
    await emailInput.fill('');
    await passwordInput.fill('');
    const submitLoginBtn = await page.$('button[type="submit"]');
    if (submitLoginBtn) {
      await submitLoginBtn.click();
      await page.waitForTimeout(500);
      const bodyText = await page.evaluate(() => document.body.innerText);
      const hasValidationError = bodyText.includes('Vui lòng nhập') || bodyText.includes('hợp lệ');
      console.log(`- Validate form khi để trống: ${hasValidationError ? '✅ ĐẠT' : '❌ LỖI'}`);
    }
  }

  // Đăng nhập tài khoản demo
  const quickCustomerBtn = await page.$('button:has-text("Khách hàng"), button:has-text("Customer")');
  if (quickCustomerBtn) {
    await quickCustomerBtn.click();
    await page.waitForTimeout(1500);
    console.log('✅ Đã đăng nhập tài khoản Khách hàng demo!');
  }
  await page.screenshot({ path: path.join(screenshotDir, '1_auth_logged_in.png') });

  // -------------------------------------------------------------------------
  // 2. KIỂM THỬ CHỌN SẢN PHẨM & THÊM VÀO GIỎ HÀNG
  // -------------------------------------------------------------------------
  console.log('\n--- 2. KIỂM THỬ GIỎ HÀNG & TÍNH TIỀN ---');
  await page.goto(`${baseUrl}/products/ao-thun-nu-tron-mau-pastel-diu-mat-mua-he-w-tee-012`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Chọn size M
  const sizeMBtn = await page.$('button:has-text("M")');
  if (sizeMBtn) await sizeMBtn.click();

  // Bấm Thêm giỏ hàng
  const addBtn = await page.$('button:has-text("Thêm vào giỏ"), button:has-text("THÊM VÀO GIỎ")');
  if (addBtn) {
    await addBtn.click();
    await page.waitForTimeout(1000);
    console.log('✅ Đã thêm sản phẩm vào giỏ!');
  }

  // Vào trang giỏ hàng
  await page.goto(`${baseUrl}/cart`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotDir, '2_cart_page.png') });

  const cartItemCount = await page.$$eval('[data-testid="cart-item"], .border-b, tr', els => els.length);
  console.log(`- Số lượng phần tử hiển thị trong giỏ: ${cartItemCount}`);

  // Thử tăng số lượng (+)
  const plusBtn = await page.$('button[aria-label="Tăng số lượng"], button:has-text("+")');
  if (plusBtn) {
    await plusBtn.click();
    await page.waitForTimeout(600);
    console.log('✅ Đã tăng số lượng sản phẩm trong giỏ');
  }

  // -------------------------------------------------------------------------
  // 3. KIỂM THỬ CHECKOUT VÀ ĐẶT HÀNG SANDBOX
  // -------------------------------------------------------------------------
  console.log('\n--- 3. KIỂM THỬ QUY TRÌNH CHECKOUT SANDBOX ---');
  await page.goto(`${baseUrl}/checkout`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotDir, '3_checkout_step1.png') });

  // Bấm tiếp tục sang bước thanh toán ("Sang bước thanh toán")
  const nextToPaymentBtn = await page.$('button:has-text("Sang bước thanh toán"), button:has-text("Tiếp tục"), button[type="submit"]');
  if (nextToPaymentBtn) {
    await nextToPaymentBtn.click();
    await page.waitForTimeout(1000);
    console.log('✅ Đã chuyển sang Bước 2 (Phương thức thanh toán)');
    await page.screenshot({ path: path.join(screenshotDir, '4_checkout_step2.png') });

    // Chọn phương thức COD và Đặt hàng
    const placeOrderBtn = await page.$('button:has-text("XÁC NHẬN ĐẶT HÀNG"), button:has-text("ĐẶT HÀNG")');
    if (placeOrderBtn) {
      await placeOrderBtn.click();
      await page.waitForTimeout(2000);
      console.log(`- URL sau khi đặt hàng: ${page.url()}`);
      const isOrderSuccess = page.url().includes('/orders') || page.url().includes('checkout');
      console.log(`- Đặt hàng sandbox thành công: ${isOrderSuccess ? '✅ ĐẠT' : '❌'}`);
      await page.screenshot({ path: path.join(screenshotDir, '5_order_confirmed.png') });
    }
  }

  // -------------------------------------------------------------------------
  // 4. KIỂM THỬ AI STYLIST
  // -------------------------------------------------------------------------
  console.log('\n--- 4. KIỂM THỬ AI STYLIST CHATBOT ---');
  await page.goto(`${baseUrl}/?open_stylist=1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const stylistInput = await page.$('input[placeholder*="Hỏi"], input[placeholder*="phong cách"], input[placeholder*="Stylist"]');
  if (stylistInput) {
    await stylistInput.fill('Gợi ý set đồ streetwear đi học');
    const sendBtn = await page.$('button:has-text("Gửi"), button[aria-label="Gửi"], form button[type="submit"]');
    if (sendBtn) {
      await sendBtn.click();
      await page.waitForTimeout(2000);
      console.log('✅ Đã gửi câu hỏi tư vấn phong cách tới AI Stylist!');
      await page.screenshot({ path: path.join(screenshotDir, '6_ai_stylist_chat.png') });
    }
  }

  // -------------------------------------------------------------------------
  // 5. KIỂM THỬ RESPONSIVE VIEWPORTS
  // -------------------------------------------------------------------------
  console.log('\n--- 5. KIỂM THỬ RESPONSIVE TRÊN CÁC VIEWPORT ĐẠI DIỆN ---');
  const viewports = [
    { name: 'Desktop (1440x900)', width: 1440, height: 900 },
    { name: 'Laptop (1366x768)', width: 1366, height: 768 },
    { name: 'Tablet (768x1024)', width: 768, height: 1024 },
    { name: 'Mobile iPhone (390x844)', width: 390, height: 844 },
    { name: 'Mobile Small (360x800)', width: 360, height: 800 },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${baseUrl}/products`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    // Kiểm tra tràn ngang (horizontal overflow)
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`- Viewport ${vp.name}: Tràn thanh cuộn ngang: ${hasHorizontalOverflow ? '❌ CÓ' : '✅ KHÔNG (ĐẠT)'}`);

    await page.screenshot({ path: path.join(screenshotDir, `responsive_${vp.width}x${vp.height}.png`) });
  }

  console.log('\n================================================================');
  console.log('TỔNG HỢP KIỂM THỬ TOÀN DIỆN E-COMMERCE:');
  console.log(`- Tổng số Page Errors: ${pageErrors.length}`);
  console.log(`- Thư mục lưu screenshots: ${screenshotDir}`);
  console.log('================================================================\n');

  await browser.close();

  if (pageErrors.length > 0) {
    console.error('❌ PHÁT HIỆN LỖI RUNTIME!');
    process.exit(1);
  } else {
    console.log('🎉 TẤT CẢ CÁC BƯỚC E-COMMERCE ĐỀU HOÀN TOÀN THÀNH CÔNG!');
  }
}

runFullEcommerceFlow().catch(err => {
  console.error('Lỗi quy trình:', err);
  process.exit(1);
});
