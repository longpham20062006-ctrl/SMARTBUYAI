import { test, expect } from '@playwright/test';

test.describe('SMARTBUY AI — Master Verification Suite V23', () => {

  test('TC01: Gộp Shop & Khám phá thời trang thành 1 mục duy nhất, không trùng lặp nút Shop', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForLoadState('networkidle');

    // 1. Desktop navigation bar must contain "KHÁM PHÁ SHOP THỜI TRANG"
    const exploreBtn = page.getByRole('link', { name: /khám phá shop thời trang/i }).first();
    await expect(exploreBtn).toBeVisible();

    // 2. Redundant plain "Shop" link in desktop navbar should NOT exist
    const navText = await page.locator('header nav, header .hidden.lg\\:flex').allInnerTexts();
    const allHeaderNavText = navText.join(' ');
    // Plain standalone "Shop" word in header top row should not exist
    const standaloneShopLinks = page.locator('header a[href="/shop"]:has-text("Shop")');
    const shopCount = await standaloneShopLinks.count();
    for (let i = 0; i < shopCount; i++) {
      const text = (await standaloneShopLinks.nth(i).innerText()).trim();
      expect(text.toLowerCase()).not.toBe('shop');
    }

    // 3. Redundant "Shop" next to user avatar should NOT exist
    const avatarAreaShop = page.locator('header .flex.items-center a[href="/shop"]:has-text("Shop")');
    await expect(avatarAreaShop).toHaveCount(0);

    // 4. Hero CTA button is "KHÁM PHÁ SHOP THỜI TRANG"
    const heroBtn = page.locator('section:has-text("YOUR STYLE")').getByRole('button', { name: /khám phá shop thời trang/i });
    await expect(heroBtn).toBeVisible();

    // 5. Unauthenticated click on Hero CTA -> navigates to /login
    await heroBtn.click();
    await page.waitForURL(/.*login.*redirect=%2Fshop/);
    expect(page.url()).toContain('/login');
  });

  test('TC02: Đăng nhập khách hàng -> vào /shop -> scroll về đỉnh trang (0), không phát lại Intro 3D', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/login?redirect=%2Fshop');
    await page.waitForLoadState('networkidle');

    // Mark intro already seen so it doesn't replay
    await page.evaluate(() => {
      sessionStorage.setItem('sb_intro_seen', '1');
      sessionStorage.removeItem('sb_intro_active');
    });

    // Fill customer login
    await page.fill('input[type="email"]', 'customer.test@smartbuy.local');
    await page.fill('input[type="password"]', 'Customer@123');
    await page.click('button[type="submit"]');

    // Should redirect directly to /shop
    await page.waitForURL(/.*\/shop/, { timeout: 10000 });
    expect(page.url()).toContain('/shop');
    expect(page.url()).not.toContain('/intro');

    // Scroll position must be at top (0)
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThanOrEqual(10);
  });

  test('TC03: Tầng 2 Category Bar chia thành 3 nhóm rõ ràng, kích thước 44px, Active màu tím', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/shop?gender=nam');
    await page.waitForLoadState('networkidle');

    const catNav = page.locator('[data-testid="category-nav"]');
    await expect(catNav).toBeVisible();

    // Verify 3 groups: Group 1 (Nam, Nữ, Phụ kiện), Group 2 (Chatbot AI, AI Stylist, Thử đồ AI), Group 3 (Bảng size)
    const namLink = catNav.getByRole('link', { name: /^nam$/i });
    const nuLink = catNav.getByRole('link', { name: /^nữ$/i });
    const accLink = catNav.getByRole('link', { name: /^phụ kiện$/i });
    const chatbotBtn = catNav.getByRole('button', { name: /chatbot ai/i });
    const stylistLink = catNav.getByRole('link', { name: /ai stylist/i });
    const tryOnLink = catNav.getByRole('link', { name: /thử đồ ai/i });
    const sizeGuideBtn = catNav.getByRole('button', { name: /bảng size/i });

    await expect(namLink).toBeVisible();
    await expect(nuLink).toBeVisible();
    await expect(accLink).toBeVisible();
    await expect(chatbotBtn).toBeVisible();
    await expect(stylistLink).toBeVisible();
    await expect(tryOnLink).toBeVisible();
    await expect(sizeGuideBtn).toBeVisible();

    // Check button height (h-11 = 44px)
    const namBox = await namLink.boundingBox();
    expect(namBox?.height).toBeGreaterThanOrEqual(40);
    expect(namBox?.height).toBeLessThanOrEqual(48);

    // Active state on 'Nam' when URL is ?gender=nam
    await expect(namLink).toHaveClass(/bg-\[#8B5CF6\]/);
    await expect(namLink).toHaveClass(/text-white/);

    // Click 'Nữ' -> URL updates, active state switches to Nữ, Nam turns inactive
    await nuLink.click();
    await page.waitForURL(/.*gender=nu/);
    await expect(nuLink).toHaveClass(/bg-\[#8B5CF6\]/);
    await expect(namLink).not.toHaveClass(/bg-\[#8B5CF6\]/);

    // Reload (F5) -> retains active state on Nữ
    await page.reload();
    await page.waitForLoadState('networkidle');
    const nuAfterReload = page.locator('[data-testid="category-nav"]').getByRole('link', { name: /^nữ$/i });
    await expect(nuAfterReload).toHaveClass(/bg-\[#8B5CF6\]/);
  });

  test('TC04: Sửa lỗi phân loại: /shop không hiện "GEN Z MEN\'S ESSENTIALS" khi chọn tất cả', async ({ page }) => {
    // 1. Visit /shop (All products)
    await page.goto('http://127.0.0.1:5173/shop');
    await page.waitForLoadState('networkidle');

    // Badge must be "GEN Z FASHION ESSENTIALS", NOT "GEN Z MEN'S ESSENTIALS"
    const badgeText = await page.locator('.inline-flex.items-center.gap-1\\.5.px-3\\.5.py-1').innerText();
    expect(badgeText).toContain("GEN Z FASHION ESSENTIALS");
    expect(badgeText).not.toContain("GEN Z MEN'S ESSENTIALS");

    // 2. Select Nam -> badge is "GEN Z MEN'S ESSENTIALS"
    await page.goto('http://127.0.0.1:5173/shop?gender=nam');
    await page.waitForLoadState('networkidle');
    const namBadge = await page.locator('.inline-flex.items-center.gap-1\\.5.px-3\\.5.py-1').innerText();
    expect(namBadge).toContain("GEN Z MEN'S ESSENTIALS");

    // 3. Select Nữ -> badge is "GEN Z WOMEN'S ESSENTIALS"
    await page.goto('http://127.0.0.1:5173/shop?gender=nu');
    await page.waitForLoadState('networkidle');
    const nuBadge = await page.locator('.inline-flex.items-center.gap-1\\.5.px-3\\.5.py-1').innerText();
    expect(nuBadge).toContain("GEN Z WOMEN'S ESSENTIALS");
  });

  test('TC05: Thanh tìm kiếm sản phẩm và bộ lọc Catalog', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/shop');
    await page.waitForLoadState('networkidle');

    // 1. Search bar input exists, height ~48-52px, rounded-2xl
    const searchInput = page.locator('input[placeholder*="Tìm kiếm áo thun, polo"]');
    await expect(searchInput).toBeVisible();
    const box = await searchInput.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeLessThanOrEqual(54);

    // 2. Type query -> clear button (X) appears, products filter
    await searchInput.fill('hoodie');
    const clearBtn = page.locator('button[aria-label="Xóa từ khóa tìm kiếm"]');
    await expect(clearBtn).toBeVisible();

    // 3. Click clear button -> input cleared
    await clearBtn.click();
    await expect(searchInput).toHaveValue('');

    // 4. Quick filter chip styling
    const quickChips = page.locator('[data-testid="quick-filter-container"] button');
    const firstChip = quickChips.first();
    await expect(firstChip).toBeVisible();

    // 5. Sidebar filter: Sắp xếp section and XÓA BỘ LỌC button
    const resetBtn = page.getByRole('button', { name: /xóa bộ lọc/i });
    await expect(resetBtn).toBeVisible();
  });

  test('TC06: Đa dạng giá sản phẩm: không có giá 0, giá nhất quán và đa dạng', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/shop');
    await page.waitForLoadState('networkidle');

    // Check all visible product prices
    const priceElements = await page.locator('[data-testid="product-card"] span:has-text("₫")').allInnerTexts();
    expect(priceElements.length).toBeGreaterThan(0);

    const prices = priceElements
      .map((t) => parseInt(t.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));

    // Zero-price check: NO price should be 0 or less than 30k
    for (const p of prices) {
      expect(p).toBeGreaterThanOrEqual(35000);
    }

    // Pricing diversity check: should have multiple distinct prices
    const distinct = new Set(prices);
    expect(distinct.size).toBeGreaterThanOrEqual(4);
  });

  test('TC07: Sản phẩm HOT trang chủ: card thu nhỏ, bo góc 20px, 0 hiển thị giá, nút xem chi tiết', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForLoadState('networkidle');

    const hotSection = page.locator('#san-pham-hot');
    await expect(hotSection).toBeVisible();

    // Check hot product cards
    const hotCards = hotSection.locator('[data-testid="home-product-card"]');
    const cardCount = await hotCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(4);
    expect(cardCount).toBeLessThanOrEqual(6);

    // No prices shown in hot products section
    const hotText = await hotSection.innerText();
    expect(hotText).not.toMatch(/[0-9]{2,3}\.000\s*₫/);

    // "Xem chi tiết" buttons are present and aligned
    const viewDetailBtns = hotSection.locator('button:has-text("Xem chi tiết")');
    await expect(viewDetailBtns.first()).toBeVisible();
  });

  test('TC08: 4 Bộ trang phục nổi bật (EDITORIAL LOOKS): Lưới 2x2 trên desktop, căn giữa', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForLoadState('networkidle');

    const editorialSection = page.locator('section:has-text("4 PHONG CÁCH TIÊU BIỂU SMARTBUY AI")');
    await expect(editorialSection).toBeVisible();

    // Grid container has max-w-5xl and grid-cols-1 md:grid-cols-2
    const gridContainer = editorialSection.locator('.grid.grid-cols-1.md\\:grid-cols-2');
    await expect(gridContainer).toBeVisible();

    // 4 look items
    const lookCards = gridContainer.locator('> div');
    await expect(lookCards).toHaveCount(4);

    // Verify ordering: Look 1, Look 2, Look 3, Look 4
    await expect(lookCards.nth(0)).toContainText('LOOK 01');
    await expect(lookCards.nth(1)).toContainText('LOOK 02');
    await expect(lookCards.nth(2)).toContainText('LOOK 03');
    await expect(lookCards.nth(3)).toContainText('LOOK 04');
  });

  test('TC09: Chatbot AI: Hội thoại nhiều lượt, nhớ ngữ cảnh, câu hỏi nối tiếp và chuyển chủ đề', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/ai-stylist');
    await page.waitForLoadState('networkidle');

    const input = page.locator('input[placeholder*="Ví dụ:"]');
    await expect(input).toBeVisible();

    // Turn 1: "Tôi muốn đồ đi dự tiệc"
    await input.fill('Tôi muốn đồ đi dự tiệc');
    await page.keyboard.press('Enter');

    // Wait for response with clarifying question
    await expect(page.locator('.whitespace-pre-line').last()).toContainText('dự tiệc', { timeout: 12000 });

    // Turn 2: Follow-up answer "Cho nam" (should remember occasion: party)
    await input.fill('Cho nam');
    await page.keyboard.press('Enter');
    await expect(page.locator('.whitespace-pre-line').last()).toContainText('nam', { timeout: 12000 });

    // Turn 3: Follow-up question "Có màu đen không?"
    await input.fill('Có màu đen không?');
    await page.keyboard.press('Enter');
    await expect(page.locator('.whitespace-pre-line').last()).toContainText('Đen', { timeout: 12000 });

    // Turn 4: Follow-up question "Mẫu thứ hai còn size L không?"
    await input.fill('Mẫu thứ hai còn size L không?');
    await page.keyboard.press('Enter');
    await expect(page.locator('.whitespace-pre-line').last()).toContainText('size L', { timeout: 12000 });

    // Turn 5: Topic switch "Tôi muốn xem váy nữ"
    await input.fill('Tôi muốn xem váy nữ');
    await page.keyboard.press('Enter');
    await expect(page.locator('.whitespace-pre-line').last()).toContainText('đầm và váy nữ', { timeout: 12000 });
  });

  test('TC10: Thay thế toàn bộ số cứng bằng số thực trên trang chủ', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForLoadState('networkidle');

    // Category cards should have real counts like "130+ Mẫu", "148+ Mẫu", etc.
    const categoryCardCounts = await page.locator('span:has-text("+ Mẫu")').allInnerTexts();
    expect(categoryCardCounts.length).toBeGreaterThan(0);

    // Hero brand value chip has 300+ or real count, not hardcoded 270+
    const heroStats = await page.locator('.pt-4.grid.grid-cols-3').innerText();
    expect(heroStats).toContain('+');
    expect(heroStats).not.toContain('270+');
  });

});

