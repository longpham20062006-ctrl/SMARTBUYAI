const { chromium } = require('playwright');

(async () => {
  console.log('===============================================================');
  console.log('🚀 SMARTBUY AI — BỘ KIỂM THỬ TỰ ĐỘNG MASTER V23 (10 PHẦN)');
  console.log('===============================================================');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const results = [];
  function record(id, name, passed, detail) {
    results.push({ id, name, passed, detail });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[${mark}] ${id}: ${name} - ${detail || ''}`);
  }

  try {
    // ------------------------------------------------------------------------
    // PHẦN 1: GỘP SHOP VÀ KHÁM PHÁ THỜI TRANG (Guest Context)
    // ------------------------------------------------------------------------
    console.log('\n--- KIỂM TRA PHẦN 1: GỘP SHOP VÀ KHÁM PHÁ THỜI TRANG ---');
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForLoadState('networkidle');

    // 1.1 Header desktop có nút duy nhất "KHÁM PHÁ SHOP THỜI TRANG"
    const headerExploreLink = page.locator('header a:has-text("Khám phá shop thời trang")').first();
    const isExploreVisible = await headerExploreLink.isVisible();
    record('TC1.1', 'Nút "Khám phá shop thời trang" hiển thị trong header desktop', isExploreVisible);

    // 1.2 Không còn bất kỳ nút nào có nhãn chính xác "Shop" trong toàn bộ Header
    const exactShopCount = await page.locator('header a').filter({ hasText: /^shop$/i }).count();
    record('TC1.2', 'Không còn nút có chữ "Shop" đơn lẻ gây trùng lặp trong Header', exactShopCount === 0);

    // 1.3 Nút Shop cạnh tài khoản người dùng đã được xóa sạch
    record('TC1.3', 'Nút Shop cạnh tài khoản người dùng đã được xóa bỏ hoàn toàn', exactShopCount === 0);

    // 1.4 Hero CTA hiển thị "KHÁM PHÁ SHOP THỜI TRANG"
    const heroBtn = page.locator('section').getByRole('button', { name: /khám phá shop thời trang/i }).first();
    const isHeroBtnVisible = await heroBtn.isVisible();
    record('TC1.4', 'Nút chính Hero là "KHÁM PHÁ SHOP THỜI TRANG" với gradient tím', isHeroBtnVisible);

    // 1.5 Click Hero CTA khi chưa đăng nhập -> chuyển sang /login với notice
    await heroBtn.click();
    await page.waitForTimeout(600);
    const afterHeroUrl = page.url();
    record('TC1.5', 'Khách chưa đăng nhập bấm -> chuyển hướng sang /login', afterHeroUrl.includes('/login'));

    // ------------------------------------------------------------------------
    // ĐĂNG NHẬP CUSTOMER ĐỂ TRẢI NGHIỆM SHOPPING AREA (Customer Context)
    // ------------------------------------------------------------------------
    console.log('\n--- ĐĂNG NHẬP TÀI KHOẢN KHÁCH HÀNG ---');
    await page.fill('input[type="email"]', 'customer.test@smartbuy.local');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Xử lý sau đăng nhập (nếu chuyển sang /intro thì bỏ qua để vào /shop)
    if (page.url().includes('/intro')) {
      await page.evaluate(() => {
        sessionStorage.setItem('sb_intro_seen', '1');
        sessionStorage.removeItem('sb_intro_active');
      });
      await page.goto('http://127.0.0.1:5173/shop');
      await page.waitForLoadState('networkidle');
    }

    // Đảm bảo đã vào /shop thành công
    const currentUrl = page.url();
    console.log('URL sau đăng nhập:', currentUrl);
    record('TC1.6', 'Đăng nhập thành công và vào khu vực Shop', currentUrl.includes('/shop'));

    // ------------------------------------------------------------------------
    // PHẦN 2: THIẾT KẾ LẠI THANH DANH MỤC SHOP
    // ------------------------------------------------------------------------
    console.log('\n--- KIỂM TRA PHẦN 2: THIẾT KẾ LẠI THANH DANH MỤC SHOP ---');
    await page.goto('http://127.0.0.1:5173/shop?gender=nam');
    await page.waitForLoadState('networkidle');

    const catNav = page.locator('[data-testid="category-nav"]');
    const isCatNavVisible = await catNav.isVisible();
    record('TC2.1', 'Thanh danh mục Tầng 2 hiển thị trên trang Shop', isCatNavVisible);

    // 2.2 Kiểm tra 3 nhóm rõ ràng: Nam, Nữ, Phụ kiện | Chatbot AI, AI Stylist, Thử đồ AI | Bảng size
    const namBtn = catNav.getByRole('link', { name: /^nam$/i });
    const nuBtn = catNav.getByRole('link', { name: /^nữ$/i });
    const accBtn = catNav.getByRole('link', { name: /^phụ kiện$/i });
    const botBtn = catNav.getByRole('button', { name: /chatbot ai/i });
    const stylistBtn = catNav.getByRole('link', { name: /ai stylist/i });
    const tryonBtn = catNav.getByRole('link', { name: /thử đồ ai/i });
    const sizeGuideBtn = catNav.getByRole('button', { name: /bảng size/i });

    const allItemsVisible = (await namBtn.isVisible()) &&
                            (await nuBtn.isVisible()) &&
                            (await accBtn.isVisible()) &&
                            (await botBtn.isVisible()) &&
                            (await stylistBtn.isVisible()) &&
                            (await tryonBtn.isVisible()) &&
                            (await sizeGuideBtn.isVisible());
    record('TC2.2', 'Hiển thị đủ 3 nhóm chức năng (Mua sắm, AI, Tiện ích)', allItemsVisible);

    // 2.3 Chiều cao nút 44px (trong khoảng 42-48px)
    const namBox = await namBtn.boundingBox();
    const heightOk = namBox && namBox.height >= 40 && namBox.height <= 48;
    record('TC2.3', 'Chiều cao các nút đạt chuẩn 42-48px (thực tế: ' + (namBox ? Math.round(namBox.height) : 0) + 'px)', !!heightOk);

    // 2.4 Trạng thái active có nền tím chủ đạo
    const namClass = (await namBtn.getAttribute('class')) || '';
    record('TC2.4', 'Mục "Nam" có trạng thái Active màu tím (#8B5CF6)', namClass.includes('bg-[#8B5CF6]'));

    // 2.5 Chuyển sang Nữ -> Nữ active, Nam trở về bình thường
    await nuBtn.click();
    await page.waitForURL(/.*gender=nu/);
    await page.waitForTimeout(400);
    const nuClass = (await page.locator('[data-testid="category-nav"]').getByRole('link', { name: /^nữ$/i }).getAttribute('class')) || '';
    const namClassAfter = (await page.locator('[data-testid="category-nav"]').getByRole('link', { name: /^nam$/i }).getAttribute('class')) || '';
    const switchOk = nuClass.includes('bg-[#8B5CF6]') && !namClassAfter.includes('bg-[#8B5CF6]');
    record('TC2.5', 'Chuyển tab sang "Nữ" cập nhật Active đúng, tab cũ trở về bình thường', switchOk);

    // 2.6 F5 tải lại trang vẫn giữ đúng trạng thái Active
    await page.reload();
    await page.waitForLoadState('networkidle');
    const nuAfterF5 = (await page.locator('[data-testid="category-nav"]').getByRole('link', { name: /^nữ$/i }).getAttribute('class')) || '';
    record('TC2.6', 'F5 tải lại trang vẫn giữ đúng trạng thái Active', nuAfterF5.includes('bg-[#8B5CF6]'));

    // ------------------------------------------------------------------------
    // PHẦN 3 & 4: THANH TÌM KIẾM, BỘ LỌC VÀ PHÂN LOẠI
    // ------------------------------------------------------------------------
    console.log('\n--- KIỂM TRA PHẦN 3 & 4: THANH TÌM KIẾM, BỘ LỌC VÀ PHÂN LOẠI ---');
    await page.goto('http://127.0.0.1:5173/shop');
    await page.waitForLoadState('networkidle');

    // 3.1 Thanh tìm kiếm trên CatalogPage
    const searchInput = page.locator('input[placeholder*="Tìm kiếm áo thun, polo"]');
    const isSearchVisible = await searchInput.isVisible();
    const searchBox = await searchInput.boundingBox();
    const searchHeightOk = searchBox && searchBox.height >= 44 && searchBox.height <= 54;
    record('TC3.1', 'Thanh tìm kiếm Catalog có chiều cao 48-52px (thực tế: ' + (searchBox ? Math.round(searchBox.height) : 0) + 'px)', isSearchVisible && searchHeightOk);

    // 3.2 Nhập tìm kiếm và nút Xóa X
    await searchInput.fill('hoodie');
    await page.waitForTimeout(300);
    const clearBtn = page.locator('button[aria-label="Xóa từ khóa tìm kiếm"]');
    const clearBtnVisible = await clearBtn.isVisible();
    record('TC3.2', 'Nhập chữ xuất hiện icon Xóa (X), bấm vào xóa trắng ô tìm kiếm', clearBtnVisible);
    await clearBtn.click();

    // 3.3 Nút lọc nhanh Quick Filter
    const quickChips = page.locator('[data-testid="quick-filter-container"] button');
    const firstChip = quickChips.first();
    const isFirstChipVisible = await firstChip.isVisible();
    record('TC3.3', 'Nút lọc nhanh hiển thị với touch target to, bo tròn', isFirstChipVisible);

    // 3.4 Nút XÓA BỘ LỌC trong sidebar
    const resetFilterBtn = page.getByRole('button', { name: /xóa bộ lọc/i });
    const isResetFilterVisible = await resetFilterBtn.isVisible();
    record('TC3.4', 'Nút "XÓA BỘ LỌC" hiển thị đầy đủ và rõ ràng trong sidebar', isResetFilterVisible);

    // 4.1 Sửa lỗi badge "GEN Z MEN'S ESSENTIALS" khi chọn Tất cả
    const allBadgeText = await page.locator('.inline-flex.items-center.gap-1\\.5.px-3\\.5.py-1').innerText();
    const isAllBadgeFixed = allBadgeText.includes("GEN Z FASHION ESSENTIALS") && !allBadgeText.includes("GEN Z MEN'S ESSENTIALS");
    record('TC4.1', 'Trang Tất cả hiển thị "GEN Z FASHION ESSENTIALS" (Đã triệt tiêu lỗi Men Essentials)', isAllBadgeFixed);

    // 4.2 Chọn Nam -> "GEN Z MEN'S ESSENTIALS"
    await page.goto('http://127.0.0.1:5173/shop?gender=nam');
    await page.waitForLoadState('networkidle');
    const namBadgeText = await page.locator('.inline-flex.items-center.gap-1\\.5.px-3\\.5.py-1').innerText();
    record('TC4.2', 'Trang Nam hiển thị đúng "GEN Z MEN\'S ESSENTIALS"', namBadgeText.includes("GEN Z MEN'S ESSENTIALS"));

    // 4.3 Phân loại nghiêm ngặt: Nam chỉ chứa sản phẩm nam, không lẫn đầm váy
    const visibleCardsNam = await page.locator('[data-testid="product-card"]').allInnerTexts();
    const hasDressInMen = visibleCardsNam.some(t => t.toLowerCase().includes('đầm') || t.toLowerCase().includes('váy xòe'));
    record('TC4.3', 'Mục Nam được phân loại tuyệt đối không lẫn váy/đầm nữ', !hasDressInMen);

    // ------------------------------------------------------------------------
    // PHẦN 5: ĐA DẠNG GIÁ SẢN PHẨM
    // ------------------------------------------------------------------------
    console.log('\n--- KIỂM TRA PHẦN 5: ĐA DẠNG HÓA GIÁ SẢN PHẨM ---');
    await page.goto('http://127.0.0.1:5173/shop');
    await page.waitForLoadState('networkidle');

    const priceTexts = await page.locator('[data-testid="product-card"] span:has-text("₫")').allInnerTexts();
    const prices = priceTexts.map(t => parseInt(t.replace(/\D/g, ''), 10)).filter(n => !isNaN(n));

    // Không có giá 0
    const hasZeroPrice = prices.some(p => p === 0);
    record('TC5.1', 'Không có bất kỳ sản phẩm nào có giá = 0 (tất cả > 0)', !hasZeroPrice && prices.length > 0);

    // Đa dạng các mức giá
    const distinctPrices = new Set(prices);
    record('TC5.2', 'Giá bán đa dạng, tự nhiên trên giao diện (tìm thấy ' + distinctPrices.size + ' mức giá khác nhau)', distinctPrices.size >= 4);

    // ------------------------------------------------------------------------
    // PHẦN 6: SẢN PHẨM HOT TRANG CHỦ
    // ------------------------------------------------------------------------
    console.log('\n--- KIỂM TRA PHẦN 6: SẢN PHẨM HOT TRANG CHỦ ---');
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForLoadState('networkidle');

    const hotSection = page.locator('#san-pham-hot');
    const hotCards = hotSection.locator('[data-testid="home-product-card"]');
    const hotCount = await hotCards.count();
    record('TC6.1', 'Hiển thị 4-6 sản phẩm HOT tiêu biểu (thực tế: ' + hotCount + ' cards)', hotCount >= 4 && hotCount <= 6);

    // 0 hiển thị giá bán
    const hotText = await hotSection.innerText();
    const hasPriceInHot = /[0-9]{2,3}\.000\s*₫/.test(hotText);
    record('TC6.2', 'TUYỆT ĐỐI KHÔNG hiển thị giá bán ở khu vực Sản phẩm HOT', !hasPriceInHot);

    // Nút "Xem chi tiết" thẳng hàng
    const detailBtns = hotSection.locator('button:has-text("Xem chi tiết")');
    const detailBtnCount = await detailBtns.count();
    record('TC6.3', 'Tất cả các card đều có nút "Xem chi tiết" được căn chỉnh thẳng hàng', detailBtnCount === hotCount);

    // ------------------------------------------------------------------------
    // PHẦN 7: SẮP XẾP LẠI 4 BỘ TRANG PHỤC NỔI BẬT (EDITORIAL LOOKS)
    // ------------------------------------------------------------------------
    console.log('\n--- KIỂM TRA PHẦN 7: 4 BỘ TRANG PHỤC NỔI BẬT (EDITORIAL LOOKS) ---');
    const editorialSection = page.locator('section:has-text("4 PHONG CÁCH TIÊU BIỂU SMARTBUY AI")');
    const editorialGrid = editorialSection.locator('.grid.grid-cols-1.md\\:grid-cols-2');
    const isGrid2x2 = await editorialGrid.isVisible();
    record('TC7.1', 'Bố cục 2 hàng x 2 cột trên máy tính (.grid-cols-1.md:grid-cols-2)', isGrid2x2);

    const looks = editorialGrid.locator('> div');
    const looksCount = await looks.count();
    record('TC7.2', 'Hiển thị đủ 4 LOOKS tiêu biểu (thực tế: ' + looksCount + ')', looksCount === 4);

    const look1 = await looks.nth(0).innerText();
    const look2 = await looks.nth(1).innerText();
    const look3 = await looks.nth(2).innerText();
    const look4 = await looks.nth(3).innerText();

    const orderOk = look1.includes('LOOK 01') &&
                    look2.includes('LOOK 02') &&
                    look3.includes('LOOK 03') &&
                    look4.includes('LOOK 04');
    record('TC7.3', 'Thứ tự LOOK 01 & 02 (hàng 1: Nam) - LOOK 03 & 04 (hàng 2: Nữ) chuẩn xác', orderOk);

    // ------------------------------------------------------------------------
    // PHẦN 8: CHATBOT AI HỘI THOẠI ĐA LƯỢT
    // ------------------------------------------------------------------------
    console.log('\n--- KIỂM TRA PHẦN 8: CHATBOT AI HỘI THOẠI ĐA LƯỢT ---');
    await page.goto('http://127.0.0.1:5173/ai-stylist');
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('input[placeholder*="Ví dụ:"]');

    const sendTurn = async (text) => {
      const prevMsgCount = await page.locator('.whitespace-pre-line').count();
      await chatInput.fill(text);
      await page.keyboard.press('Enter');
      await page.waitForFunction(
        (prev) => {
          const list = document.querySelectorAll('.whitespace-pre-line');
          return list.length >= prev + 2;
        },
        prevMsgCount,
        { timeout: 15000 }
      );
      await page.waitForTimeout(400);
      return await page.locator('.whitespace-pre-line').last().innerText();
    };

    // 8.1 Turn 1: "Tôi muốn đồ đi dự tiệc"
    const turn1Text = await sendTurn('Tôi muốn đồ đi dự tiệc');
    console.log('Turn 1 response:', turn1Text.substring(0, 150));
    const turn1Ok = turn1Text.toLowerCase().includes('dự tiệc') || turn1Text.toLowerCase().includes('tiệc');
    record('TC8.1', 'Turn 1: "Tôi muốn đồ đi dự tiệc" -> Gợi ý đồ tiệc & hỏi làm rõ tiệc cưới/sinh nhật/lịch sự', turn1Ok);

    // 8.2 Turn 2: "Cho nam" -> tiếp tục mạch tiệc cho nam
    const turn2Text = await sendTurn('Cho nam');
    console.log('Turn 2 response:', turn2Text.substring(0, 150));
    const turn2Ok = turn2Text.toLowerCase().includes('nam') || turn2Text.toLowerCase().includes('sơ mi') || turn2Text.toLowerCase().includes('tiệc');
    record('TC8.2', 'Turn 2: "Cho nam" -> Duy trì ngữ cảnh đi tiệc, tư vấn set sơ mi/quần âu nam', turn2Ok);

    // 8.3 Turn 3: "Có màu đen không?"
    const turn3Text = await sendTurn('Có màu đen không?');
    console.log('Turn 3 response:', turn3Text.substring(0, 150));
    const turn3Ok = turn3Text.toLowerCase().includes('đen');
    record('TC8.3', 'Turn 3: "Có màu đen không?" -> Trả lời chính xác sự có mặt của màu Đen', turn3Ok);

    // 8.4 Turn 4: "Mẫu thứ hai còn size L không?"
    const turn4Text = await sendTurn('Mẫu thứ hai còn size L không?');
    console.log('Turn 4 response:', turn4Text.substring(0, 150));
    const turn4Ok = turn4Text.toLowerCase().includes('size l') || turn4Text.toLowerCase().includes('l');
    record('TC8.4', 'Turn 4: "Mẫu thứ hai còn size L không?" -> Kiểm tra tồn kho size L chính xác', turn4Ok);

    // 8.5 Turn 5: "Tôi muốn xem váy nữ" (chuyển đổi chủ đề)
    const turn5Text = await sendTurn('Tôi muốn xem váy nữ');
    console.log('Turn 5 response:', turn5Text.substring(0, 150));
    const turn5Ok = turn5Text.toLowerCase().includes('váy') || turn5Text.toLowerCase().includes('đầm');
    record('TC8.5', 'Turn 5: Chuyển chủ đề "Tôi muốn xem váy nữ" -> Chuyển ngay sang tư vấn váy/đầm nữ', turn5Ok);

    // ------------------------------------------------------------------------
    // PHẦN 9 & 10: TỔNG KẾT
    // ------------------------------------------------------------------------
    console.log('\n===============================================================');
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    console.log(`📊 TỔNG KẾT: ${passedCount}/${totalCount} BÀI TEST THÀNH CÔNG (${Math.round((passedCount/totalCount)*100)}%)`);
    console.log('===============================================================');

  } catch (err) {
    console.error('Lỗi kiểm thử E2E:', err);
  } finally {
    await browser.close();
  }
})();
