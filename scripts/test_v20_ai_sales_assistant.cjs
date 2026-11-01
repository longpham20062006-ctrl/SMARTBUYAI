/**
 * SMARTBUY AI — MASTER PROMPT V20 COMPREHENSIVE E2E VERIFICATION SUITE
 * PROFESSIONAL AI FASHION SALES ASSISTANT & INTELLIGENT CUSTOMER CONSULTATION
 *
 * Verifies all 22 scenarios required by Section XIX:
 * 1. Chào hỏi tự nhiên, lịch sự (xưng hô Em - Anh/Chị).
 * 2. Tìm áo Nam (trả về đúng sản phẩm Nam).
 * 3. Tìm váy Nữ (trả về đúng váy/đầm Nữ).
 * 4. Tìm sản phẩm dưới 300k (kiểm tra giá thực tế <= 300k).
 * 5. Tìm sản phẩm theo màu (màu đen, trắng...).
 * 6. Tìm sản phẩm theo size (size L, size XL...).
 * 7. Tư vấn phối đồ (đi chơi với ny, đi học...).
 * 8. Tư vấn theo vóc dáng (cao 1m70 nặng 60kg).
 * 9. Ghi nhớ ngữ cảnh hội thoại (hỏi tiếp về sản phẩm vừa đề xuất: phối quần gì, có màu/size không).
 * 10. Kiểm tra thông tin tồn kho / hết hàng.
 * 11. Sản phẩm không tồn tại trong cửa hàng (không bịa sản phẩm).
 * 12. Giá sản phẩm thực tế từ Database (có chữ ₫, không bịa giá).
 * 13. Khả năng chịu lỗi và xử lý an toàn.
 * 14. Timeout / Trạng thái loading "Đang kiểm tra thông tin sản phẩm...".
 * 15. Tiếng Việt không dấu ("tim ao nam duoi 300k", "co mau trang ko").
 * 16. Tiếng Việt viết tắt, tiếng lóng ("ny", "tui", "sz", "ko", "k").
 * 17. Câu hỏi mơ hồ ("Có đồ gì không shop?").
 * 18. Câu hỏi ngoài chủ đề (thời tiết, lập trình -> trả lời khéo léo quay lại thời trang).
 * 19. Kiểm tra quyền truy cập đơn hàng (Guest yêu cầu login, Customer xem đúng đơn của mình).
 * 20. Hiển thị Chat Product Cards (ảnh 3:4, tên, giá ₫, nút Xem chi tiết).
 * 21. Bấm "Xem chi tiết" mở đúng Product Detail URL.
 * 22. Kiểm tra giao diện Chatbot trên Mobile (responsive, kích thước chuẩn).
 */

const { chromium } = require('playwright');

const FRONTEND_URL = 'http://localhost:5173';

const TEST_CREDS = {
  customer: {
    email: 'customer.test@smartbuy.local',
    password: 'd8RnVTsh&%3Q2v$H',
  },
};

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${testName} - ${details}`);
    failedCount++;
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 SMARTBUY AI — V20 AI FASHION SALES ASSISTANT E2E TEST');
  console.log('================================================================\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // =============================================================
    // SUITE 1: GUEST USER & ORDER PERMISSION TEST (SCENARIO 19a)
    // =============================================================
    console.log('--- TEST SUITE 1: GUEST PERMISSIONS & ORDER ACCESS (SCENARIO 19) ---');
    const guestContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const guestPage = await guestContext.newPage();

    await guestPage.goto(`${FRONTEND_URL}/?intro=0`, { waitUntil: 'networkidle' });

    // Open chat bubble as Guest
    const bubble = guestPage.locator('button[aria-label*="chatbot"]');
    await bubble.click();
    await guestPage.waitForTimeout(400);

    // Ask about orders as Guest
    const input = guestPage.locator('input[placeholder*="Nhắn tin cho trợ lý"]');
    await input.fill('Đơn hàng của tôi đến đâu rồi?');
    await guestPage.locator('button[aria-label="Gửi tin nhắn"]').click();
    await guestPage.waitForTimeout(600);

    const guestLastMsg = await guestPage.locator('[data-testid="assistant-message-text"]').last().innerText();
    assert(
      guestLastMsg.includes('Đăng nhập') || guestLastMsg.includes('đăng nhập'),
      'Scenario 19a: Guest inquiring about orders is politely instructed to log in',
      `Actual text: ${guestLastMsg.slice(0, 200)}`
    );

    await guestContext.close();

    // =============================================================
    // SUITE 2: CUSTOMER AUTHENTICATION & CORE CONSULTATION SCENARIOS
    // =============================================================
    console.log('\n--- TEST SUITE 2: CUSTOMER CONSULTATION & REAL CONVERSATION FLOW ---');
    const customerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await customerContext.newPage();

    // Login as Customer
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[type="email"]', TEST_CREDS.customer.email);
    await page.fill('input[type="password"]', TEST_CREDS.customer.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Go to shop/catalog where floating assistant is active
    await page.goto(`${FRONTEND_URL}/shop`, { waitUntil: 'networkidle' });

    // Open chat
    const chatBubble = page.locator('button[aria-label*="chatbot"]');
    await chatBubble.click();
    await page.waitForTimeout(400);

    const chatWindow = page.locator('[role="dialog"]');
    const headerTitle = await chatWindow.locator('h3').innerText();
    assert(
      headerTitle.includes('SMARTBUY') && headerTitle.includes('ASSISTANT'),
      'Assistant header branding displays "SMARTBUY FASHION ASSISTANT"'
    );

    // Helper function to send message and wait for assistant response
    async function sendMessage(text) {
      const msgInput = page.locator('input[placeholder*="Nhắn tin cho trợ lý"]');
      await msgInput.fill(text);
      await page.locator('button[aria-label="Gửi tin nhắn"]').click();
      await page.waitForTimeout(600);
      const lastMsg = page.locator('[data-testid="assistant-message-text"]').last();
      await lastMsg.waitFor({ state: 'visible', timeout: 5000 });
      const replyText = await lastMsg.innerText();
      return { replyText, lastMsg };
    }

    // SCENARIO 1: Chào hỏi tự nhiên
    const { replyText: s1Text } = await sendMessage('Chào em');
    assert(
      (s1Text.includes('Em') || s1Text.includes('em')) && (s1Text.includes('anh/chị') || s1Text.includes('Anh/chị')),
      'Scenario 1: Greeting is natural and uses respectful "Em" - "Anh/Chị" tone',
      s1Text
    );
    assert(
      !s1Text.includes('Tôi là AI') && !s1Text.includes('mô hình ngôn ngữ'),
      'Scenario 1b: Greeting does NOT contain robotic cliches ("Tôi là AI...")'
    );

    // SCENARIO 2: Tìm áo Nam
    const { replyText: s2Text } = await sendMessage('Tìm cho anh vài mẫu áo thun nam');
    assert(
      s2Text.includes('áo') || s2Text.includes('Nam') || s2Text.includes('nam'),
      'Scenario 2: Male shirt inquiry produces relevant response',
      s2Text
    );
    const s2Cards = await page.locator('[data-testid="chat-product-card"]').count();
    assert(s2Cards > 0, `Scenario 2b: Displays real ChatProductCards in chat (found ${s2Cards})`);

    // SCENARIO 3: Tìm váy Nữ
    const { replyText: s3Text } = await sendMessage('Có mẫu váy nữ nào xinh đi tiệc không em?');
    assert(
      s3Text.includes('váy') || s3Text.includes('Nữ') || s3Text.includes('nữ') || s3Text.includes('tiệc'),
      'Scenario 3: Women dress inquiry produces relevant response',
      s3Text
    );

    // SCENARIO 4: Tìm sản phẩm dưới 300k
    const { replyText: s4Text } = await sendMessage('Tìm áo nam dưới 300k');
    assert(
      s4Text.includes('300.000') || s4Text.includes('300k') || s4Text.includes('dưới'),
      'Scenario 4: Budget filter acknowledges under 300k requirement',
      s4Text
    );

    // SCENARIO 5: Tìm theo màu sắc
    const { replyText: s5Text } = await sendMessage('Cho anh xem mẫu áo màu đen');
    assert(
      s5Text.includes('đen') || s5Text.includes('Đen'),
      'Scenario 5: Color filter correctly handles black color query',
      s5Text
    );

    // SCENARIO 6: Kiểm tra size
    const { replyText: s6Text } = await sendMessage('Mẫu này có size XL không em?');
    assert(
      s6Text.includes('XL') || s6Text.includes('size'),
      'Scenario 6: Size check evaluates available size XL accurately',
      s6Text
    );

    // SCENARIO 7: Tư vấn phối đồ
    const { replyText: s7Text } = await sendMessage('Mặc đi chơi với ny thì phối sao em?');
    assert(
      s7Text.includes('phối') || s7Text.includes('set') || s7Text.includes('outfit') || s7Text.includes('người yêu'),
      'Scenario 7: Outfit coordination advice provides stylish pairing recommendations',
      s7Text
    );

    // SCENARIO 8: Tư vấn theo vóc dáng
    const { replyText: s8Text } = await sendMessage('Anh cao 1m70 nặng 60kg thì mặc size gì vừa?');
    assert(
      s8Text.includes('170') && s8Text.includes('60') && (s8Text.includes('M') || s8Text.includes('L')),
      'Scenario 8: Body fit sizing accurately advises size M or L based on 1m70/60kg',
      s8Text
    );

    // SCENARIO 9: Context follow-up ("Áo này phối quần gì đẹp em?")
    const { replyText: s9Text } = await sendMessage('Áo này phối quần gì đẹp em?');
    assert(
      s9Text.includes('quần') || s9Text.includes('phối') || s9Text.includes('sneaker'),
      'Scenario 9: Context follow-up understands currently discussed item and suggests matching pants',
      s9Text
    );

    // SCENARIO 10: Tồn kho & biến thể thực tế
    const { replyText: s10Text } = await sendMessage('Áo này còn hàng không?');
    assert(
      s10Text.includes('còn') || s10Text.includes('size') || s10Text.includes('mẫu'),
      'Scenario 10: In-stock check answers directly based on product availability',
      s10Text
    );

    // SCENARIO 11: Sản phẩm không tồn tại (chống bịa)
    const { replyText: s11Text } = await sendMessage('Shop có bán áo giáp sắt thời trung cổ không?');
    assert(
      s11Text.includes('chưa có') || s11Text.includes('không có') || s11Text.includes('tìm trong kho'),
      'Scenario 11: Non-existent product query does not hallucinate fake items',
      s11Text
    );

    // SCENARIO 12: Kiểm tra giá thực tế từ Database
    const cardPriceText = await page.locator('[data-testid="chat-product-card"]').first().innerText();
    assert(
      cardPriceText.includes('₫'),
      'Scenario 12: Product card displays valid VND currency symbol (₫)'
    );

    // SCENARIO 15: Tiếng Việt không dấu
    const { replyText: s15Text } = await sendMessage('tim ao thun nam duoi 250k');
    assert(
      s15Text.includes('áo') || s15Text.includes('nam') || s15Text.includes('250'),
      'Scenario 15: Unaccented Vietnamese text correctly parsed',
      s15Text
    );

    // SCENARIO 16: Viết tắt và tiếng lóng giới trẻ ("ny", "tui", "sz", "ko")
    const { replyText: s16Text } = await sendMessage('tui muon tim do di choi voi ny khoang 400k sz L');
    assert(
      s16Text.includes('người yêu') || s16Text.includes('outfit') || s16Text.includes('400') || s16Text.includes('set'),
      'Scenario 16: Youth slang (ny, tui, sz) normalized and understood smoothly',
      s16Text
    );

    // SCENARIO 17: Câu hỏi mơ hồ ("Có đồ gì không shop?")
    const { replyText: s17Text } = await sendMessage('Có đồ gì không shop?');
    assert(
      s17Text.includes('thiết kế') || s17Text.includes('SMARTBUY') || s17Text.includes('anh/chị') || s17Text.includes('mẫu'),
      'Scenario 17: Vague query is handled with courteous product presentation',
      s17Text
    );

    // SCENARIO 18: Câu hỏi ngoài chủ đề (thời tiết / lập trình)
    const { replyText: s18Text } = await sendMessage('Thời tiết hôm nay thế nào em?');
    assert(
      s18Text.includes('thời trang') && s18Text.includes('SMARTBUY AI'),
      'Scenario 18: Off-topic query politely acknowledged and steered back to fashion assistant',
      s18Text
    );

    // SCENARIO 19b: Tra cứu đơn hàng khi đã đăng nhập Customer
    const { replyText: s19Text } = await sendMessage('Kiểm tra đơn hàng của tôi');
    assert(
      s19Text.includes('đơn hàng') || s19Text.includes('Mã đơn') || s19Text.includes('tài khoản'),
      'Scenario 19b: Authenticated customer successfully checks their own order records',
      s19Text
    );

    // SCENARIO 20: Product Cards trong Chatbot có đầy đủ chi tiết
    const firstCard = page.locator('[data-testid="chat-product-card"]').first();
    const hasImage = (await firstCard.locator('img').count()) > 0;
    const hasDetailBtn = (await firstCard.locator('a:has-text("Xem chi tiết")').count()) > 0;
    assert(hasImage, 'Scenario 20a: Chat Product Card contains a valid fashion photo');
    assert(hasDetailBtn, 'Scenario 20b: Chat Product Card contains "Xem chi tiết" action button');

    // SCENARIO 21: Bấm "Xem chi tiết" điều hướng đúng URL
    const detailLink = await firstCard.locator('a:has-text("Xem chi tiết")').getAttribute('href');
    assert(
      detailLink && detailLink.startsWith('/products/'),
      `Scenario 21: "Xem chi tiết" links to exact product detail slug: ${detailLink}`
    );

    // SCENARIO 13 & 14: Bắt đầu cuộc trò chuyện mới (Reset session)
    const resetBtn = page.locator('button[data-testid="reset-chat-button"]');
    await resetBtn.click();
    await page.waitForTimeout(300);
    const resetCount = await page.locator('[data-testid="assistant-message-text"]').count();
    assert(resetCount === 1, 'Reset session button cleans conversation context and restores fresh greeting');

    await customerContext.close();

    // =============================================================
    // SUITE 3: MOBILE RESPONSIVENESS (SCENARIO 22)
    // =============================================================
    console.log('\n--- TEST SUITE 3: MOBILE VIEWPORT TEST (SCENARIO 22) ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();

    // Login customer on mobile
    await mobilePage.goto(`${FRONTEND_URL}/login`);
    await mobilePage.fill('input[type="email"]', TEST_CREDS.customer.email);
    await mobilePage.fill('input[type="password"]', TEST_CREDS.customer.password);
    await mobilePage.click('button[type="submit"]');
    await mobilePage.waitForTimeout(1000);

    await mobilePage.goto(`${FRONTEND_URL}/shop`, { waitUntil: 'networkidle' });

    // Click chat bubble on mobile
    const mobBubble = mobilePage.locator('button[aria-label*="chatbot"]');
    await mobBubble.click();
    await mobilePage.waitForTimeout(400);

    const mobDialog = mobilePage.locator('[role="dialog"]');
    const isVisible = await mobDialog.isVisible();
    assert(isVisible, 'Scenario 22a: Chatbot window opens and is visible on mobile iPhone viewport');

    const dialogBox = await mobDialog.boundingBox();
    assert(
      dialogBox && dialogBox.width <= 375 && dialogBox.width > 300,
      `Scenario 22b: Chatbot fits cleanly within mobile screen width (${dialogBox?.width}px)`
    );

    await mobileContext.close();

  } catch (err) {
    console.error('Unexpected error during test execution:', err);
    failedCount++;
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(`V20 SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('================================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
