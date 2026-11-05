const { webkit } = require('playwright');

async function testIPhoneWebKit() {
  console.log('=== KHỞI CHẠY PLAYWRIGHT WEBKIT (SAFARI/IOS ENGINE) TRÊN IPHONE VIEWPORT ===\n');

  const browser = await webkit.launch({
    headless: true,
  });

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
  const consoleMessages = [];
  const failedRequests = [];
  const httpErrors = [];

  page.on('pageerror', (err) => {
    console.error('❌ [PAGE ERROR]:', err.message);
    pageErrors.push(err.message + '\n' + (err.stack || ''));
  });

  page.on('console', (msg) => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(text);
    if (msg.type() === 'error') {
      console.error('⚠️  [CONSOLE ERROR]:', text);
    }
  });

  page.on('requestfailed', (req) => {
    const failure = `${req.method()} ${req.url()} - ${req.failure()?.errorText || 'Failed'}`;
    failedRequests.push(failure);
    console.error('❌ [REQUEST FAILED]:', failure);
  });

  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('favicon.ico')) {
      const err = `${res.status()} ${res.url()}`;
      httpErrors.push(err);
      console.error('❌ [HTTP ERROR]:', err);
    }
  });

  // Kiểm tra cổng 5174 trước (theo yêu cầu user: http://192.168.1.139:5174/)
  const testUrls = [
    'http://192.168.1.139:5174/',
    'http://192.168.1.139:5173/'
  ];

  for (const url of testUrls) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`Đang kiểm tra URL: ${url}`);
    console.log(`------------------------------------------------------------`);
    try {
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      console.log(`HTTP Status: ${response?.status()}`);

      // Chờ React render
      await page.waitForTimeout(3000);

      const htmlContent = await page.content();
      const bodyInner = await page.evaluate(() => document.body.innerHTML);
      const rootChildren = await page.evaluate(() => document.getElementById('root')?.children.length || 0);
      const isWhiteScreen = rootChildren === 0 || bodyInner.trim() === '<div id="root"></div>' || bodyInner.trim() === '';

      console.log(`- Độ dài HTML: ${htmlContent.length} bytes`);
      console.log(`- Số element con trong #root: ${rootChildren}`);
      console.log(`- Tình trạng màn hình: ${isWhiteScreen ? '🔴 MÀN HÌNH TRẮNG (WHITE SCREEN)' : '🟢 ĐÃ RENDER GIAO DIỆN'}`);

      if (isWhiteScreen) {
        console.log(`- Nội dung thẻ body:`, bodyInner.substring(0, 500));
      } else {
        const title = await page.title();
        const headerText = await page.evaluate(() => document.querySelector('header')?.innerText || 'N/A');
        console.log(`- Tiêu đề trang: ${title}`);
        console.log(`- Header text trích xuất: ${headerText.substring(0, 100)}...`);
      }
    } catch (e) {
      console.error(`Lỗi khi mở ${url}:`, e.message);
    }
  }

  console.log('\n============================================================');
  console.log('TỔNG HỢP CÁC LỖI THU THẬP ĐƯỢC:');
  console.log(`- Page Errors: ${pageErrors.length}`);
  console.log(`- Console Errors: ${consoleMessages.filter(m => m.startsWith('[error]')).length}`);
  console.log(`- Request Failed: ${failedRequests.length}`);
  console.log(`- HTTP Errors: ${httpErrors.length}`);
  console.log('============================================================\n');

  await browser.close();
}

testIPhoneWebKit().catch((err) => {
  console.error('Lỗi thực thi:', err);
  process.exit(1);
});

