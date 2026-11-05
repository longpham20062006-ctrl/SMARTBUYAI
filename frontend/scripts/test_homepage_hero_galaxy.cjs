const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(__dirname, '..', 'dist', 'test-screenshots', 'phase5_6');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function testHomepageHeroGalaxy() {
  console.log('================================================================');
  console.log('GIAI ĐOẠN 6: KIỂM THỬ TRANG CHỦ, HERO SLIDER & GALAXY ANIMATION');
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

  // 1. MỞ TRANG CHỦ VÀ KIỂM TRA HEADER
  console.log('--- 1. MỞ TRANG CHỦ & KIỂM TRA HEADER HOVER / DROPDOWN ---');
  await page.goto(`${baseUrl}/?intro=0`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Hover BỘ SƯU TẬP
  const collectionNav = await page.$('button:has-text("BỘ SƯU TẬP"), a:has-text("BỘ SƯU TẬP")');
  if (collectionNav) {
    await collectionNav.hover();
    await page.waitForTimeout(500);
    console.log('✅ Đã di chuột vào menu BỘ SƯU TẬP');
  }

  // Hover NỮ
  const nuNav = await page.$('a:has-text("NỮ")');
  if (nuNav) {
    await nuNav.hover();
    await page.waitForTimeout(500);
    console.log('✅ Đã di chuột vào menu NỮ');
  }

  // 2. KIỂM TRA HERO FASHION GALLERY VÀ 4 ẢNH TRANG CHỦ
  console.log('\n--- 2. KIỂM TRA HERO FASHION GALLERY & ẢNH TRANG CHỦ ---');
  const homeImages = [
    '/images/anh_trangchu/0fb1b05f-e815-4159-8fe5-abe2c079b9e1.png',
    '/images/anh_trangchu/3b35766f-f734-4c5a-9990-3223433700dd.png',
    '/images/anh_trangchu/421e2c20-a146-443d-b809-4ab18442b461.png',
    '/images/anh_trangchu/68818615-3bdd-4a63-bf3f-cc3bb5bde4aa.png'
  ];

  for (const imgUrl of homeImages) {
    const res = await page.request.get(`${baseUrl}${imgUrl}`);
    console.log(`- Ảnh Hero "${imgUrl.split('/').pop()}": HTTP ${res.status()} ${res.status() === 200 ? '✅ ĐẠT' : '❌ LỖI'}`);
  }

  // 3. KIỂM TRA THREE.JS AMBIENT GALAXY CANVAS
  console.log('\n--- 3. KIỂM TRA HIỆU ỨNG THREE.JS GALAXY VŨ TRỤ NỀN ---');
  const canvasCount = await page.$$eval('canvas', els => els.length);
  console.log(`- Số lượng thẻ Canvas 3D hoạt động trên trang chủ: ${canvasCount}`);
  console.log(`- Hiệu ứng Ambient Galaxy render: ${canvasCount > 0 ? '✅ ĐẠT' : '❌'}`);

  // 4. KIỂM TRA CÁC PHẦN HOMEPAGE: BESTSELLERS, NEW ARRIVALS, LOOKBOOK
  console.log('\n--- 4. KIỂM TRA CÁC SECTION TRANG CHỦ ---');
  const productCardsCount = await page.$$eval('article, [data-testid="product-card"], a[href^="/products/"]', els => els.length);
  console.log(`- Số lượng thẻ sản phẩm hiển thị trên trang chủ: ${productCardsCount}`);

  await page.screenshot({ path: path.join(screenshotDir, 'homepage_verified.png') });

  console.log('\n================================================================');
  console.log('KẾT QUẢ KIỂM THỬ TRANG CHỦ:');
  console.log(`- Tổng số Page Errors: ${pageErrors.length}`);
  console.log('================================================================\n');

  await browser.close();

  if (pageErrors.length > 0) {
    console.error('❌ PHÁT HIỆN LỖI TRANG CHỦ!');
    process.exit(1);
  } else {
    console.log('🎉 TRANG CHỦ VÀ HIỆU ỨNG HOẠT ĐỘNG HOÀN HẢO!');
  }
}

testHomepageHeroGalaxy().catch(err => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});

