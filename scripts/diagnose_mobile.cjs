const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
  });

  console.log('=== TEST 1: DESKTOP CONSOLE LOGS ===');
  const desktopPage = await browser.newPage();
  desktopPage.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`PC [${msg.type()}]: ${msg.text()}`);
    }
  });
  desktopPage.on('pageerror', err => console.error('PC UNCAUGHT ERROR:', err));
  await desktopPage.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  console.log('\n=== TEST 2: MOBILE IPHONE 13 (SAFARI / WEBKIT EMULATION) ===');
  const iPhone = devices['iPhone 13'];
  const mobileContext = await browser.newContext({
    ...iPhone,
    // Simulate real mobile characteristics
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  
  const mobileLogs = [];
  mobilePage.on('console', msg => {
    mobileLogs.push(`[${msg.type()}] ${msg.text()}`);
    console.log(`MOBILE [${msg.type()}]: ${msg.text()}`);
  });
  mobilePage.on('pageerror', err => console.error('MOBILE UNCAUGHT PAGE ERROR:', err));
  
  await mobilePage.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  
  const rootText = await mobilePage.evaluate(() => {
    const root = document.getElementById('root');
    return {
      childrenCount: root ? root.children.length : 0,
      innerTextPreview: root ? root.innerText.slice(0, 200) : 'NO_ROOT',
      bodyBg: window.getComputedStyle(document.body).backgroundColor,
    };
  });
  console.log('Mobile root state:', rootText);

  // Take screenshot of mobile page
  await mobilePage.screenshot({ path: 'scripts/mobile_test_screenshot.png' });
  console.log('Screenshot saved to scripts/mobile_test_screenshot.png');

  await browser.close();
})();

