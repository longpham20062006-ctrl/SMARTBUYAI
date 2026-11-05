const path = require('path');
const fs = require('fs');

const playwrightPath = 'C:\\Users\\ntaan\\AppData\\Local\\npm-cache\\_npx\\e41f203b7505f1fb\\node_modules\\playwright';
const { chromium } = require(playwrightPath);

const ARTIFACT_DIR = 'C:\\Users\\ntaan\\.gemini\\antigravity\\brain\\0e4dcce6-066f-4114-99ec-6159cda7b47e';

async function run() {
  console.log('--- STARTING VIRTUAL TRY-ON UI VERIFICATION ---');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });

  try {
    // 1. DESKTOP TEST (1440x960)
    const contextDesktop = await browser.newContext({
      viewport: { width: 1440, height: 960 },
      deviceScaleFactor: 2,
    });
    const pageDesktop = await contextDesktop.newPage();

    console.log('Navigating to http://localhost:4173/try-on on Desktop...');
    await pageDesktop.goto('http://localhost:4173/try-on', { waitUntil: 'networkidle' });
    await pageDesktop.waitForTimeout(1000);

    const desktopPath = path.join(ARTIFACT_DIR, 'tryon-desktop-1440.png');
    await pageDesktop.screenshot({ path: desktopPath, fullPage: false });
    console.log('Desktop viewport screenshot saved:', desktopPath);

    const fullpageDesktopPath = path.join(ARTIFACT_DIR, 'tryon-fullpage-1440.png');
    await pageDesktop.screenshot({ path: fullpageDesktopPath, fullPage: true });
    console.log('Desktop fullpage screenshot saved:', fullpageDesktopPath);

    // Verify key elements exist
    const heading = await pageDesktop.locator('h1').textContent();
    console.log('Desktop Heading:', heading);

    // Test clicking a model
    const secondModel = pageDesktop.locator('button:has-text("Đức Huy")');
    if (await secondModel.count() > 0) {
      await secondModel.click();
      await pageDesktop.waitForTimeout(500);
      console.log('Clicked demo model: Đức Huy');
    }

    // Test selecting a garment tab
    const shirtTab = pageDesktop.getByRole('button', { name: 'Sơ mi', exact: true });
    if (await shirtTab.count() > 0) {
      await shirtTab.first().click();
      await pageDesktop.waitForTimeout(500);
      console.log('Clicked garment tab: Sơ mi');
    }

    const desktopInteractionPath = path.join(ARTIFACT_DIR, 'tryon-desktop-interaction.png');
    await pageDesktop.screenshot({ path: desktopInteractionPath, fullPage: false });
    console.log('Desktop interaction screenshot saved:', desktopInteractionPath);

    await contextDesktop.close();

    // 2. MOBILE TEST (390x844 - iPhone 14 / Korean Minimal mobile view)
    const contextMobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
    });
    const pageMobile = await contextMobile.newPage();

    console.log('Navigating to http://localhost:4173/try-on on Mobile...');
    await pageMobile.goto('http://localhost:4173/try-on', { waitUntil: 'networkidle' });
    await pageMobile.waitForTimeout(1000);

    // Mobile Step 1 screenshot
    const mobileStep1Path = path.join(ARTIFACT_DIR, 'tryon-mobile-step1-390.png');
    await pageMobile.screenshot({ path: mobileStep1Path, fullPage: false });
    console.log('Mobile Step 1 screenshot saved:', mobileStep1Path);

    // Click Next to Step 2
    const btnNextStep2 = pageMobile.locator('button:has-text("Tiếp tục: Chọn trang phục")');
    if (await btnNextStep2.count() > 0) {
      await btnNextStep2.click();
      await pageMobile.waitForTimeout(500);
    } else {
      // Fallback click on stepper
      await pageMobile.locator('button:has-text("2. Chọn đồ")').click();
      await pageMobile.waitForTimeout(500);
    }

    const mobileStep2Path = path.join(ARTIFACT_DIR, 'tryon-mobile-step2-390.png');
    await pageMobile.screenshot({ path: mobileStep2Path, fullPage: false });
    console.log('Mobile Step 2 screenshot saved:', mobileStep2Path);

    // Click Next to Step 3
    const btnNextStep3 = pageMobile.locator('button:has-text("Xem kết quả")');
    if (await btnNextStep3.count() > 0) {
      await btnNextStep3.last().click();
      await pageMobile.waitForTimeout(500);
    } else {
      await pageMobile.locator('button:has-text("3. Kết quả")').click();
      await pageMobile.waitForTimeout(500);
    }

    const mobileStep3Path = path.join(ARTIFACT_DIR, 'tryon-mobile-step3-390.png');
    await pageMobile.screenshot({ path: mobileStep3Path, fullPage: false });
    console.log('Mobile Step 3 screenshot saved:', mobileStep3Path);

    await contextMobile.close();
    console.log('--- ALL TRY-ON UI VERIFICATIONS COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
