const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'customer.test@smartbuy.local');
  await page.fill('input[type="password"]', 'd8RnVTsh&%3Q2v$H');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  // Test Shop -> Cart
  await page.goto('http://localhost:5173/shop');
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 1500));
  console.log('1. Shop scrollY:', await page.evaluate(() => window.scrollY));

  // Navigate to Cart by clicking cart or header link
  await page.evaluate(() => window.location.pathname = '/cart');
  await page.waitForTimeout(1000);
  console.log('2. Cart scrollY via window.location:', await page.evaluate(() => window.scrollY));

  // Test Shop -> Collections via Link
  await page.goto('http://localhost:5173/shop');
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 1500));

  // Find a Link to collections
  const collectionsLink = page.locator('a[href="/collections"]').first();
  if (await collectionsLink.isVisible()) {
    await collectionsLink.click();
    await page.waitForTimeout(1000);
    console.log('3. Collections scrollY via Link click:', await page.evaluate(() => window.scrollY));
  }

  // Test Shop -> About via Link
  await page.goto('http://localhost:5173/shop');
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 1500));

  const aboutLink = page.locator('a[href="/about"]').first();
  if (await aboutLink.isVisible()) {
    await aboutLink.click();
    await page.waitForTimeout(1000);
    console.log('4. About scrollY via Link click:', await page.evaluate(() => window.scrollY));
  }

  // Test Admin Dashboard -> Admin Products -> Admin Orders
  await page.goto('http://localhost:5173/admin/dashboard');
  await page.waitForTimeout(600);
  // Scroll admin main container
  await page.evaluate(() => {
    const main = document.querySelector('#admin-main-scroll');
    if (main) main.scrollTop = 800;
  });
  console.log('5. Admin Dashboard main scrollTop:', await page.evaluate(() => {
    const main = document.querySelector('#admin-main-scroll');
    return main ? main.scrollTop : 0;
  }));

  const adminProductsLink = page.locator('aside[data-testid="admin-sidebar"] a[href="/admin/products"]');
  await adminProductsLink.click();
  await page.waitForTimeout(1000);
  console.log('6. Admin Products main scrollTop:', await page.evaluate(() => {
    const main = document.querySelector('#admin-main-scroll');
    return main ? main.scrollTop : 0;
  }));

  await browser.close();
}

main().catch(console.error);
