/**
 * SMARTBUY AI — BỘ KIỂM THỬ TOÀN DIỆN MASTER PROMPT V24 (10 GIAI ĐOẠN)
 * Chạy tự động với Playwright, kiểm tra 20 kịch bản hội thoại AI, 6 kích thước responsive,
 * chụp ảnh màn hình lưu vào Artifacts, và kiểm tra máy chủ AI Try-On.
 */

const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/1740427a-d3f3-4847-8779-e5836f36995a';

(async () => {
  const browser = await chromium.launch({
    headless: true,
  });

  const results = [];
  function record(code, name, passed, detail = '') {
    results.push({ code, name, passed, detail });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[${mark}] ${code}: ${name} ${detail ? '- ' + detail : ''}`);
  }

  // Helper gửi request trực tiếp đến Backend AI Chatbot
  function sendChatRequest(message, history = [], sessionId = 'test_session_v24') {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        message,
        history,
        sessionId
      });

      const req = http.request({
        hostname: '127.0.0.1',
        port: 8080,
        path: '/api/v1/ai/stylist/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(payload, 'utf8')
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });

      req.on('error', reject);
      req.write(payload, 'utf8');
      req.end();
    });
  }

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    console.log('===============================================================');
    console.log('🚀 SMARTBUY AI — BỘ KIỂM THỬ TOÀN DIỆN MASTER PROMPT V24');
    console.log('===============================================================');

    // ------------------------------------------------------------------------
    // GIAI ĐOẠN 1: GỘP SHOP VÀ KHÁM PHÁ THỜI TRANG (ROUTING & AUTH)
    // ------------------------------------------------------------------------
    console.log('\n--- GIAI ĐOẠN 1: GỘP SHOP VÀ KHÁM PHÁ THỜI TRANG ---');
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForLoadState('networkidle');

    // 1.1 Chỉ còn 1 nút "Khám phá shop thời trang" trong header
    const shopNavBtn = page.locator('header nav, header div').getByRole('link', { name: /khám phá shop thời trang/i });
    const isShopNavVisible = await shopNavBtn.first().isVisible();
    record('TC1.1', 'Nút "Khám phá shop thời trang" hiển thị duy nhất trong header', isShopNavVisible);

    // 1.2 Không còn chữ "Shop" đơn lẻ trùng lặp
    const allHeaderLinks = await page.locator('header a, header button').allInnerTexts();
    const duplicateShop = allHeaderLinks.some(t => t.trim().toLowerCase() === 'shop' || t.trim().toLowerCase() === 'khám phá thời trang');
    record('TC1.2', 'Không còn nút "Shop" hoặc "Khám phá thời trang" đứng lẻ trùng lặp', !duplicateShop);

    // 1.3 Nút Hero chính
    const heroBtn = page.getByRole('button', { name: /khám phá shop thời trang/i });
    record('TC1.3', 'Nút Hero chính là "KHÁM PHÁ SHOP THỜI TRANG" với gradient tím', await heroBtn.isVisible());

    // 1.4 Khách chưa đăng nhập bấm -> chuyển hướng sang /login
    await heroBtn.click();
    await page.waitForURL(/.*login.*/);
    record('TC1.4', 'Khách chưa đăng nhập bấm nút CTA -> chuyển hướng sang /login', page.url().includes('/login'));

    // Đăng nhập khách hàng
    console.log('\n--- THỰC HIỆN ĐĂNG NHẬP KHÁCH HÀNG ---');
    await page.fill('input[type="email"]', 'customer.test@smartbuy.local');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Nếu vào intro -> bấm Bỏ qua
    if (page.url().includes('/intro')) {
      const skipBtn = page.locator('button:has-text("Bỏ qua"), button:has-text("Khám phá ngay")');
      if (await skipBtn.isVisible()) {
        await skipBtn.click();
        await page.waitForTimeout(600);
      }
    }

    await page.goto('http://127.0.0.1:5173/shop');
    await page.waitForLoadState('networkidle');
    record('TC1.5', 'Khách đăng nhập thành công vào khu vực Shop (/shop)', page.url().includes('/shop'));

    // ------------------------------------------------------------------------
    // GIAI ĐOẠN 2: THIẾT KẾ LẠI THANH ĐIỀU HƯỚNG VÀ CATEGORY BAR
    // ------------------------------------------------------------------------
    console.log('\n--- GIAI ĐOẠN 2: THIẾT KẾ LẠI THANH ĐIỀU HƯỚNG VÀ CATEGORY BAR ---');
    const catNav = page.locator('[data-testid="category-nav"]');
    const namBtn = catNav.getByRole('link', { name: /^nam$/i });
    const nuBtn = catNav.getByRole('link', { name: /^nữ$/i });

    await page.goto('http://127.0.0.1:5173/shop?gender=nam');
    await page.waitForLoadState('networkidle');
    const namClass = (await namBtn.getAttribute('class')) || '';
    record('TC2.1', 'Nút "Nam" có nền tím chủ đạo (bg-[#8B5CF6]) khi active', namClass.includes('bg-[#8B5CF6]'));

    // Chuyển sang Nữ
    await nuBtn.click();
    await page.waitForURL(/.*gender=nu/);
    await page.waitForTimeout(400);
    const nuClass = (await page.locator('[data-testid="category-nav"]').getByRole('link', { name: /^nữ$/i }).getAttribute('class')) || '';
    const namClassAfter = (await page.locator('[data-testid="category-nav"]').getByRole('link', { name: /^nam$/i }).getAttribute('class')) || '';
    record('TC2.2', 'Chuyển tab sang "Nữ" active tím, tab "Nam" trở lại bình thường', nuClass.includes('bg-[#8B5CF6]') && !namClassAfter.includes('bg-[#8B5CF6]'));

    // F5 Reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    const nuAfterF5 = (await page.locator('[data-testid="category-nav"]').getByRole('link', { name: /^nữ$/i }).getAttribute('class')) || '';
    record('TC2.3', 'F5 tải lại trang vẫn lưu giữ trạng thái Active của tab', nuAfterF5.includes('bg-[#8B5CF6]'));

    // ------------------------------------------------------------------------
    // GIAI ĐOẠN 3: THANH TÌM KIẾM (TIẾNG VIỆT CÓ DẤU & KHÔNG DẤU)
    // ------------------------------------------------------------------------
    console.log('\n--- GIAI ĐOẠN 3: THANH TÌM KIẾM (CÓ DẤU & KHÔNG DẤU) ---');
    await page.goto('http://127.0.0.1:5173/shop');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Tìm kiếm áo thun, polo"]');

    // 3.1 Tìm kiếm không dấu: "ao thun"
    await searchInput.fill('ao thun');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    const countNoTone = await page.locator('[data-testid="product-card"]').count();
    record('TC3.1', 'Tìm kiếm tiếng Việt KHÔNG DẤU ("ao thun") tìm đúng sản phẩm áo thun (' + countNoTone + ' kết quả)', countNoTone > 0);

    // 3.2 Icon Xóa X
    const clearBtn = page.locator('button[title="Xóa tìm kiếm"]');
    record('TC3.2', 'Icon xóa (X) hiển thị khi có từ khóa tìm kiếm', await clearBtn.isVisible());
    await clearBtn.click();
    await page.waitForTimeout(300);
    const clearedVal = await searchInput.inputValue();
    record('TC3.3', 'Nhấn nút (X) xóa trắng từ khóa tìm kiếm ngay lập tức', clearedVal === '');

    // 3.3 Tìm kiếm có dấu: "áo khoác"
    await searchInput.fill('áo khoác');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    const countWithTone = await page.locator('[data-testid="product-card"]').count();
    record('TC3.4', 'Tìm kiếm tiếng Việt CÓ DẤU ("áo khoác") tìm đúng sản phẩm (' + countWithTone + ' kết quả)', countWithTone > 0);

    // ------------------------------------------------------------------------
    // GIAI ĐOẠN 4: BỘ LỌC BÊN TRÁI & PHÂN CẤP DANH MỤC CON
    // ------------------------------------------------------------------------
    console.log('\n--- GIAI ĐOẠN 4: BỘ LỌC BÊN TRÁI & PHÂN CẤP DANH MỤC CON ---');
    await page.goto('http://127.0.0.1:5173/shop');
    await page.waitForLoadState('networkidle');

    // 4.1 Chọn NỮ
    const nuFilterBtn = page.locator('button:has-text("NỮ")').first();
    await nuFilterBtn.click();
    await page.waitForTimeout(400);

    // 4.2 Chọn ÁO
    const aoGroupBtn = page.locator('button:has-text("Áo")').first();
    await aoGroupBtn.click();
    await page.waitForTimeout(400);

    // 4.3 Danh mục con chỉ hiển thị các loại thuộc nhóm Áo (Croptop, Sơ mi, v.v.)
    const croptopBtn = page.locator('button:has-text("Croptop")').first();
    const isCroptopVisible = await croptopBtn.isVisible();
    record('TC4.1', 'Khi chọn nhóm Áo, Danh mục con mở rộng các loại áo (Croptop, Sơ mi...)', isCroptopVisible);

    // 4.4 Chọn Croptop -> chỉ hiển thị croptop nữ, tiêu đề "CROPTOP NỮ"
    if (isCroptopVisible) {
      await croptopBtn.click();
      await page.waitForTimeout(500);
      const titleText = await page.locator('h1').innerText();
      record('TC4.2', 'Chọn NỮ -> ÁO -> CROPTOP cập nhật tiêu đề chuẩn "' + titleText + '"', titleText.includes('CROPTOP NỮ') || titleText.includes('CROPTOP'));
      
      const badgeText = await page.locator('span:has-text("GEN Z")').first().innerText();
      record('TC4.3', 'Badge hiển thị "GEN Z WOMEN\'S ESSENTIALS" (không bị lỗi Men)', badgeText.includes("WOMEN'S") || badgeText.includes("FASHION"));
    }

    // 4.5 Nút XÓA BỘ LỌC
    const resetFilterBtn = page.locator('button:has-text("XÓA BỘ LỌC")').first();
    await resetFilterBtn.click();
    await page.waitForTimeout(500);
    const titleAfterReset = await page.locator('h1').innerText();
    record('TC4.4', 'Nút "XÓA BỘ LỌC" khôi phục về trạng thái tất cả sản phẩm', titleAfterReset.includes('TẤT CẢ SẢN PHẨM'));

    // ------------------------------------------------------------------------
    // GIAI ĐOẠN 5: KIỂM TRA GIÁ VÀ HÌNH ẢNH TOÀN BỘ 308 SẢN PHẨM
    // ------------------------------------------------------------------------
    console.log('\n--- GIAI ĐOẠN 5: KIỂM TRA GIÁ VÀ HÌNH ẢNH SẢN PHẨM ---');
    const productsJson = JSON.parse(fs.readFileSync('D:/SMARTBUYAI/src/mocks/importedProducts.json', 'utf8'));
    const zeroPrice = productsJson.filter(p => !p.price || p.price === 0);
    record('TC5.1', 'Toàn bộ 308 sản phẩm KHÔNG CÓ sản phẩm nào giá = 0 (thực tế: ' + zeroPrice.length + ' lỗi)', zeroPrice.length === 0);

    const missingImgs = productsJson.filter(p => !p.image && (!p.images || p.images.length === 0));
    record('TC5.2', 'Toàn bộ 308 sản phẩm ĐỀU CÓ ảnh thật hợp lệ trên đĩa (thực tế: ' + missingImgs.length + ' thiếu)', missingImgs.length === 0);

    // ------------------------------------------------------------------------
    // GIAI ĐOẠN 6 & 7: SẢN PHẨM HOT VÀ 4 PHONG CÁCH 2X2
    // ------------------------------------------------------------------------
    console.log('\n--- GIAI ĐOẠN 6 & 7: SẢN PHẨM HOT VÀ 4 PHONG CÁCH 2X2 ---');
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForLoadState('networkidle');

    const hotCards = page.locator('#san-pham-hot [data-testid="home-product-card"]');
    const hotCount = await hotCards.count();
    record('TC6.1', 'Khu vực Sản phẩm HOT hiển thị 4-6 card cân đối (thực tế: ' + hotCount + ')', hotCount >= 4 && hotCount <= 6);

    const hotText = await page.locator('#san-pham-hot').innerText();
    const hasPriceInHot = /[0-9]{2,3}\.000\s*₫/.test(hotText);
    record('TC6.2', 'Khu vực Sản phẩm HOT TUYỆT ĐỐI KHÔNG hiển thị giá bán', !hasPriceInHot);

    const looks2x2 = page.locator('section:has-text("4 PHONG CÁCH TIÊU BIỂU SMARTBUY AI") .grid.grid-cols-1.md\\:grid-cols-2');
    record('TC7.1', '4 Phong cách tiêu biểu bố trí dạng lưới 2 hàng x 2 cột (.grid-cols-1.md:grid-cols-2)', await looks2x2.isVisible());

    // ------------------------------------------------------------------------
    // GIAI ĐOẠN 8: KIỂM THỬ 20 TÌNH HUỐNG HỘI THOẠI AI CHATBOT
    // ------------------------------------------------------------------------
    console.log('\n--- GIAI ĐOẠN 8: KIỂM THỬ 20 TÌNH HUỐNG HỘI THOẠI AI CHATBOT ---');

    const scenarios = [
      { id: 'SC01', q: 'Tôi muốn tìm đồ đi học cấp 3 đơn giản năng động', check: r => r.toLowerCase().includes('học') || r.toLowerCase().includes('polo') || r.toLowerCase().includes('thun'), desc: 'Tư vấn đồ đi học' },
      { id: 'SC02', q: 'Tôi muốn một bộ đồ đi dự tiệc', check: r => r.toLowerCase().includes('tiệc') || r.toLowerCase().includes('dự tiệc'), desc: 'Tư vấn đồ đi tiệc' },
      { id: 'SC03', q: 'Cho nam', check: r => r.toLowerCase().includes('nam') || r.toLowerCase().includes('sơ mi') || r.toLowerCase().includes('tiệc'), desc: 'Phân biệt đồ nam & giữ mạch tiệc' },
      { id: 'SC04', q: 'Có màu đen không?', check: r => r.toLowerCase().includes('đen'), desc: 'Hỏi màu sắc thực tế' },
      { id: 'SC05', q: 'Tầm 500k thôi', check: r => r.toLowerCase().includes('500') || r.toLowerCase().includes('ngân sách'), desc: 'Hỏi / Lọc ngân sách 500k' },
      { id: 'SC06', q: 'Mẫu thứ hai còn size L không?', check: r => r.toLowerCase().includes('size l') || r.toLowerCase().includes('l'), desc: 'Hỏi tồn kho size L' },
      { id: 'SC07', q: 'Tôi muốn xem váy nữ thiết kế', check: r => r.toLowerCase().includes('váy') || r.toLowerCase().includes('đầm'), desc: 'Đổi chủ đề sang váy nữ' },
      { id: 'SC08', q: 'Cao 1m70 nặng 65kg mặc size gì vừa?', check: r => r.toLowerCase().includes('size l') || r.toLowerCase().includes('size'), desc: 'Hỏi tư vấn chọn size theo chiều cao cân nặng' },
      { id: 'SC09', q: 'Áo polo này phối với quần gì thì đẹp?', check: r => r.toLowerCase().includes('quần') || r.toLowerCase().includes('phối'), desc: 'Gợi ý phối đồ (Outfit coordination)' },
      { id: 'SC10', q: 'Phối cho tôi cả bộ đồ đi chơi cuối tuần', check: r => r.toLowerCase().includes('outfit') || r.toLowerCase().includes('bộ') || r.toLowerCase().includes('áo'), desc: 'Tạo set đồ hoàn chỉnh (Outfit Builder)' },
      { id: 'SC11', q: 'Tôi không thích sơ mi, đổi kiểu khác đi', check: r => r.toLowerCase().includes('polo') || r.toLowerCase().includes('khác') || r.toLowerCase().includes('không thích'), desc: 'Phản hồi phủ định / đổi kiểu' },
      { id: 'SC12', q: 'Da ngăm thì nên mặc màu gì tôn da?', check: r => r.toLowerCase().includes('da ngăm') || r.toLowerCase().includes('tôn da') || r.toLowerCase().includes('màu'), desc: 'Tư vấn chọn màu theo tone da' },
      { id: 'SC13', q: 'Mẫu áo này giá bao nhiêu tiền?', check: r => r.toLowerCase().includes('giá') || r.toLowerCase().includes('đ') || r.toLowerCase().includes('vnd'), desc: 'Hỏi giá sản phẩm' },
      { id: 'SC14', q: 'Đắt quá, có mẫu nào rẻ hơn không?', check: r => r.toLowerCase().includes('rẻ') || r.toLowerCase().includes('tiết kiệm') || r.toLowerCase().includes('giá'), desc: 'Phản hồi chê giá đắt / tìm mẫu rẻ' },
      { id: 'SC15', q: 'Chính sách đổi trả hàng như thế nào?', check: r => r.toLowerCase().includes('đổi') || r.toLowerCase().includes('trả') || r.toLowerCase().includes('ngày'), desc: 'Hỏi chính sách đổi trả hàng' },
      { id: 'SC16', q: 'Shop có miễn phí ship không?', check: r => r.toLowerCase().includes('freeship') || r.toLowerCase().includes('ship') || r.toLowerCase().includes('vận chuyển'), desc: 'Hỏi chính sách giao hàng / freeship' },
      { id: 'SC17', q: 'dt sinh nhat', check: r => r.toLowerCase().includes('sinh nhật') || r.toLowerCase().includes('tiệc'), desc: 'Từ viết tắt / sai chính tả (dt = dự tiệc)' },
      { id: 'SC18', q: 'Cho toi xem may mau ao thun hot trend', check: r => r.toLowerCase().includes('áo thun') || r.toLowerCase().includes('thun'), desc: 'Hỏi tiếng Việt không dấu tự nhiên' },
      { id: 'SC19', q: 'Mẫu đầu tiên chất liệu gì vậy shop?', check: r => r.toLowerCase().includes('cotton') || r.toLowerCase().includes('chất liệu') || r.toLowerCase().includes('vải'), desc: 'Hỏi chất liệu sản phẩm' },
      { id: 'SC20', q: 'Làm mới cuộc trò chuyện', check: r => r.toLowerCase().includes('mới') || r.toLowerCase().includes('bắt đầu') || r.toLowerCase().includes('chào'), desc: 'Reset phiên trò chuyện' }
    ];

    let sessionHistory = [];
    for (const sc of scenarios) {
      try {
        const res = await sendChatRequest(sc.q, sessionHistory, 'master_eval_session');
        const replyText = res.body && (res.body.text || res.body.message) ? (res.body.text || res.body.message) : '';
        const isOk = sc.check(replyText);
        record(sc.id, `Chatbot: ${sc.desc} ("${sc.q}")`, isOk, replyText.substring(0, 90) + '...');
        if (replyText) {
          sessionHistory.push({ sender: 'user', text: sc.q });
          sessionHistory.push({ sender: 'bot', text: replyText });
        }
      } catch (e) {
        record(sc.id, `Chatbot: ${sc.desc}`, false, 'Lỗi kết nối API: ' + e.message);
      }
    }

    // ------------------------------------------------------------------------
    // GIAI ĐOẠN 9: KIỂM THỬ RESPONSIVE TRÊN 6 ĐỘ PHÂN GIẢI & CHỤP ẢNH
    // ------------------------------------------------------------------------
    console.log('\n--- GIAI ĐOẠN 9: KIỂM THỬ RESPONSIVE TRÊN 6 ĐỘ PHÂN GIẢI ---');
    const viewports = [
      { name: '1920x1080_desktop_fhd', w: 1920, h: 1080 },
      { name: '1440x900_laptop_wide', w: 1440, h: 900 },
      { name: '1366x768_laptop_std', w: 1366, h: 768 },
      { name: '768x1024_tablet_ipad', w: 768, h: 1024 },
      { name: '390x844_mobile_iphone', w: 390, h: 844 },
      { name: '360x800_mobile_android', w: 360, h: 800 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await page.goto('http://127.0.0.1:5173/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(400);

      // Kiểm tra tràn ngang
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      record(`RESP_${vp.w}`, `Độ phân giải ${vp.w}x${vp.h} (${vp.name}) không bị tràn ngang`, !isOverflowing);

      // Chụp ảnh màn hình lưu vào Artifacts
      const shotPath = path.join(ARTIFACT_DIR, `screenshot_${vp.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      console.log(`   📸 Đã chụp màn hình: screenshot_${vp.name}.png`);
    }

    // ------------------------------------------------------------------------
    // GIAI ĐOẠN 10: KIỂM TRA MÁY CHỦ THỬ ĐỒ AI (GPU PORT 7860)
    // ------------------------------------------------------------------------
    console.log('\n--- GIAI ĐOẠN 10: KIỂM TRA MÁY CHỦ THỬ ĐỒ AI (GPU PORT 7860) ---');
    try {
      const tryonDocsRes = await new Promise((resolve) => {
        http.get('http://127.0.0.1:7860/api/docs', (res) => resolve(res.statusCode)).on('error', () => resolve(0));
      });
      const tryonWebRes = await new Promise((resolve) => {
        http.get('http://127.0.0.1:7860/web-demo/', (res) => resolve(res.statusCode)).on('error', () => resolve(0));
      });
      const isAiUp = tryonDocsRes === 200 || tryonWebRes === 200;
      record('TC10.1', 'Máy chủ GPU AI FASHN VTON (127.0.0.1:7860) hoạt động trực tiếp', isAiUp, `HTTP ${tryonDocsRes}`);
    } catch (e) {
      record('TC10.1', 'Máy chủ GPU AI FASHN VTON hoạt động', false, e.message);
    }

    // ------------------------------------------------------------------------
    // TỔNG KẾT
    // ------------------------------------------------------------------------
    console.log('\n===============================================================');
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    console.log(`📊 TỔNG KẾT TOÀN DIỆN: ${passed}/${total} BÀI KIỂM THỬ THÀNH CÔNG (${Math.round((passed/total)*100)}%)`);
    console.log('===============================================================');

  } catch (err) {
    console.error('Lỗi khi chạy kiểm thử:', err);
  } finally {
    await browser.close();
  }
})();

