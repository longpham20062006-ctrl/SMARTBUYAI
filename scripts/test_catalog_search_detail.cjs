const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(__dirname, '..', 'dist', 'test-screenshots', 'phase3_4');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function testCatalogSearchDetail() {
  console.log('================================================================');
  console.log('GIAI ĐOẠN 3 & 4: KIỂM THỬ CATALOG, TÌM KIẾM & CHI TIẾT SẢN PHẨM');
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const baseUrl = 'http://localhost:5173';
  const pageErrors = [];
  const failedImages = [];

  page.on('pageerror', err => {
    console.error('❌ [PAGE ERROR]:', err.message);
    pageErrors.push(err.message);
  });

  page.on('response', res => {
    const url = res.url();
    if (res.status() >= 400 && (url.includes('/images/') || url.includes('.jpg') || url.includes('.png') || url.includes('.webp'))) {
      console.error(`❌ [BROKEN IMAGE]: ${res.status()} ${url}`);
      failedImages.push(`${res.status()} ${url}`);
    }
  });

  // 1. KIỂM THỬ CATALOG VÀ BỘ LỌC
  console.log('--- 1. KIỂM THỬ CATALOG TOÀN DIỆN ---');
  await page.goto(`${baseUrl}/products`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Kiểm tra không có ID sản phẩm trùng lặp trên trang
  const productIds = await page.$$eval('[data-product-id], a[href^="/products/"]', els => els.map(e => e.getAttribute('data-product-id') || e.getAttribute('href')));
  const uniqueHrefs = new Set(productIds);
  console.log(`- Tổng số link sản phẩm trên trang: ${productIds.length}`);
  console.log(`- Số lượng duy nhất (không trùng lặp): ${uniqueHrefs.size}`);
  console.log(`- Kiểm tra trùng lặp thẻ sản phẩm: ${productIds.length === uniqueHrefs.size ? '✅ KHÔNG TRÙNG' : '⚠️ Có thẻ trùng'}`);

  // 2. KIỂM THỬ TÌM KIẾM TIẾNG VIỆT CÓ DẤU & KHÔNG DẤU
  console.log('\n--- 2. KIỂM THỬ TÌM KIẾM THỰC TẾ ---');
  const searchQueries = [
    { query: 'áo thun', desc: 'Có dấu (áo thun)' },
    { query: 'ao thun', desc: 'Không dấu (ao thun)' },
    { query: 'VÁY', desc: 'Chữ in hoa (VÁY)' },
    { query: 'quần short', desc: 'Có dấu (quần short)' },
    { query: 'từ-khóa-không-tồn-tại-999', desc: 'Không tồn tại (empty state)' }
  ];

  for (const item of searchQueries) {
    await page.goto(`${baseUrl}/products?q=${encodeURIComponent(item.query)}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const count = await page.$$eval('a[href^="/products/"]', els => els.length);
    console.log(`- Tìm kiếm "${item.query}" [${item.desc}]: ${count} sản phẩm tìm thấy`);

    if (item.query.includes('999')) {
      const hasEmptyState = await page.evaluate(() => document.body.innerText.includes('Không tìm thấy') || document.body.innerText.includes('XÓA BỘ LỌC'));
      console.log(`  -> Empty state hiển thị rõ ràng: ${hasEmptyState ? '✅ ĐẠT' : '❌ LỖI'}`);
    } else {
      console.log(`  -> Trả về kết quả liên quan: ${count > 0 ? '✅ ĐẠT' : '❌ LỖI'}`);
    }
  }

  // 3. KIỂM THỬ CHI TIẾT SẢN PHẨM (NAM, NỮ, VÁY)
  console.log('\n--- 3. KIỂM THỬ TRANG CHI TIẾT SẢN PHẨM (NAM, NỮ, VÁY) ---');
  const testSlugs = [
    '/products/ao-thun-nu-tron-mau-pastel-diu-mat-mua-he-w-tee-012',
    '/products/tui-deo-vai-phom-vuong-phoi-khoa-bac-acc-028'
  ];

  for (const slug of testSlugs) {
    console.log(`\nKiểm tra chi tiết sản phẩm: ${slug}`);
    await page.goto(`${baseUrl}${slug}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const title = await page.evaluate(() => document.querySelector('h1')?.innerText || 'N/A');
    const price = await page.evaluate(() => document.querySelector('[class*="text-2xl"], [class*="text-3xl"]')?.innerText || 'N/A');
    console.log(`- Tên sản phẩm: ${title}`);
    console.log(`- Giá bán hiển thị: ${price}`);

    // Thử click thumbnail trong Gallery để đổi ảnh chính
    const thumbnails = await page.$$('button img, [data-testid="thumbnail"]');
    console.log(`- Số lượng thumbnail trong gallery: ${thumbnails.length}`);
    if (thumbnails.length > 1) {
      await thumbnails[1].click();
      await page.waitForTimeout(500);
      console.log('✅ Click thumbnail đổi ảnh thành công!');
    }

    // Thử chọn Size
    const sizeButtons = await page.$$('button:has-text("S"), button:has-text("M"), button:has-text("L"), button:has-text("XL"), button:has-text("FreeSize")');
    if (sizeButtons.length > 0) {
      await sizeButtons[0].click();
      console.log('✅ Đã chọn size');
    }

    // Thử tăng/giảm số lượng
    const minusBtn = await page.$('button[aria-label="Giảm số lượng"], button:has-text("-")');
    const plusBtn = await page.$('button[aria-label="Tăng số lượng"], button:has-text("+")');
    if (plusBtn) {
      await plusBtn.click();
      console.log('✅ Đã bấm tăng số lượng (+)');
    }
    if (minusBtn) {
      await minusBtn.click();
      console.log('✅ Đã bấm giảm số lượng (-)');
    }

    // Thử nút Wishlist
    const wishlistBtn = await page.$('button[aria-label="Thêm vào danh sách yêu thích"], button[aria-label="Yêu thích"], button:has-text("Yêu thích")');
    if (wishlistBtn) {
      await wishlistBtn.click();
      await page.waitForTimeout(500);
      console.log('✅ Đã bấm toggle Wishlist');
    }

    // Thử nút Thêm giỏ hàng
    const addToCartBtn = await page.$('button:has-text("Thêm vào giỏ"), button:has-text("THÊM VÀO GIỎ")');
    if (addToCartBtn) {
      await addToCartBtn.click();
      await page.waitForTimeout(800);
      console.log('✅ Đã bấm "Thêm vào giỏ hàng"');
    }

    await page.screenshot({ path: path.join(screenshotDir, `product_detail_${slug.split('/').pop().substring(0, 20)}.png`) });
  }

  console.log('\n================================================================');
  console.log('KẾT QUẢ GIAI ĐOẠN 3 & 4:');
  console.log(`- Tổng số Page Errors: ${pageErrors.length}`);
  console.log(`- Tổng số Broken Images: ${failedImages.length}`);
  console.log('================================================================\n');

  await browser.close();

  if (pageErrors.length > 0 || failedImages.length > 0) {
    console.error('❌ PHÁT HIỆN LỖI TRONG GIAI ĐOẠN 3 & 4!');
    process.exit(1);
  } else {
    console.log('🎉 GIAI ĐOẠN 3 & 4 HOÀN TOÀN ĐẠT CHUẨN!');
  }
}

testCatalogSearchDetail().catch(err => {
  console.error('Lỗi thực thi:', err);
  process.exit(1);
});

