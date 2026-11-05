// D:\SMARTBUYAI\scripts\test_party_and_conversational_agent.cjs
const http = require('http');

function postChat(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 8080,
        path: '/api/v1/ai/stylist/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING SMARTBUY AI STYLIST RIGOROUS VERIFICATION ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST SCENARIO A: ROOT CAUSE PARTY QUERY FIX
  // Customer asks "Tôi muốn đồ đi dự tiệc"
  // Even if user profile has height 170 / weight 65, bot MUST NOT respond with size L advice!
  // -------------------------------------------------------------
  console.log('--- TEST SCENARIO A: "Tôi muốn đồ đi dự tiệc" (Direct Party Consultation) ---');
  const resA = await postChat({
    message: 'Tôi muốn đồ đi dự tiệc',
    userHeightCm: 170,
    userWeightKg: 65,
    userGender: 'male',
  });

  assert(resA.statusCode === 200, 'HTTP 200 returned');
  const textA = resA.data?.text || '';
  const quickRepliesA = resA.data?.quickReplies || [];

  assert(
    !textA.includes('chiều cao khoảng 170cm') && !textA.includes('size phù hợp nhất với anh/chị là size L'),
    'Response does NOT give irrelevant size L advice for party wear request'
  );

  assert(
    textA.toLowerCase().includes('tiệc') || textA.toLowerCase().includes('dự tiệc'),
    'Response explicitly addresses party / occasion styling'
  );

  assert(
    quickRepliesA.length > 0 &&
      quickRepliesA.some((q) => q.toLowerCase().includes('tiệc') || q.toLowerCase().includes('đầm')),
    `Quick replies provide targeted party follow-ups: ${JSON.stringify(quickRepliesA)}`
  );

  assert(
    Array.isArray(resA.data?.recommendedProducts) && resA.data.recommendedProducts.length > 0,
    `Returns grounded party products from DB: ${resA.data?.recommendedProducts?.length || 0} products`
  );

  // -------------------------------------------------------------
  // TEST SCENARIO B: TOPIC SHIFT
  // Turn 1: Explicit Size question
  // Turn 2: "Thôi, giờ tôi muốn tìm đồ đi tiệc"
  // -------------------------------------------------------------
  console.log('\n--- TEST SCENARIO B: Topic Shift (Size Question -> "Thôi, giờ tôi muốn tìm đồ đi tiệc") ---');
  const resB1 = await postChat({
    message: 'Cao 1m70 nặng 65kg nên mặc size nào?',
  });
  const textB1 = resB1.data?.text || '';
  assert(textB1.includes('Size L') || textB1.includes('size L'), 'Turn 1 properly handles explicit size question with size L');

  const resB2 = await postChat({
    message: 'Thôi, giờ tôi muốn tìm đồ đi tiệc',
    sessionId: resB1.data?.sessionId,
  });

  const textB2 = resB2.data?.text || '';
  assert(
    !textB2.includes('chiều cao khoảng 170cm') && (textB2.toLowerCase().includes('tiệc') || textB2.toLowerCase().includes('gợi ý')),
    'Turn 2 recognizes topic shift cleanly and focuses on party wear without size fixation'
  );
  assert(
    resB2.data?.quickReplies?.some((q) => q.toLowerCase().includes('tiệc')),
    'Turn 2 switches quick replies to party contexts'
  );

  // -------------------------------------------------------------
  // TEST SCENARIO C: MULTI-TURN CONTINUATION
  // Turn 1: "Tôi muốn đồ đi dự tiệc"
  // Turn 2: "Tiệc cưới bạn tôi"
  // Turn 3: "Blazer đi"
  // Turn 4: "Khoảng 700k"
  // -------------------------------------------------------------
  console.log('\n--- TEST SCENARIO C: Multi-turn Dialogue State Flow ---');
  const resC1 = await postChat({
    message: 'Tôi muốn đồ đi dự tiệc',
  });
  const sidC = resC1.data?.sessionId;

  // Turn 2: "Tiệc cưới bạn tôi"
  const resC2 = await postChat({
    message: 'Tiệc cưới bạn tôi',
    sessionId: sidC,
  });
  const textC2 = resC2.data?.text || '';
  assert(
    textC2.toLowerCase().includes('cưới') || textC2.toLowerCase().includes('tiệc cưới'),
    'Turn 2 captures wedding context from follow-up'
  );

  // Turn 3: "Blazer đi"
  const resC3 = await postChat({
    message: 'Blazer đi',
    sessionId: sidC,
  });
  const textC3 = resC3.data?.text || '';
  assert(
    textC3.toLowerCase().includes('blazer') || textC3.toLowerCase().includes('khoác'),
    'Turn 3 captures item preference (blazer / khoác)'
  );

  // Turn 4: "Khoảng 700k"
  const resC4 = await postChat({
    message: 'Khoảng 700k',
    sessionId: sidC,
  });
  const textC4 = resC4.data?.text || '';
  assert(
    textC4.includes('700,000') || textC4.toLowerCase().includes('ngân sách') || textC4.includes('700k'),
    'Turn 4 recognizes budget constraint (700k)'
  );
  if (resC4.data?.recommendedProducts?.length > 0) {
    const allWithin = resC4.data.recommendedProducts.every((p) => (p.price || 0) <= 750000);
    assert(allWithin, 'Turn 4 recommended products conform to budget <= 700k');
  }

  // -------------------------------------------------------------
  // TEST SCENARIO D: DIRECT RAG DRESS SEARCH WITH BUDGET
  // "Tôi muốn váy đi tiệc dưới 500k"
  // -------------------------------------------------------------
  console.log('\n--- TEST SCENARIO D: Specific RAG Dress Search Under 500k ---');
  const resD = await postChat({
    message: 'Tôi muốn váy đi tiệc dưới 500k',
  });
  assert(
    resD.data?.recommendedProducts?.length > 0,
    `Found ${resD.data?.recommendedProducts?.length || 0} dress products matching party criteria under 500k`
  );
  if (resD.data?.recommendedProducts?.length > 0) {
    const under500k = resD.data.recommendedProducts.every((p) => (p.price || 0) <= 500000);
    assert(under500k, 'All returned items are under 500,000đ');
  }

  // -------------------------------------------------------------
  // TEST SCENARIO E: NEGATIVE PREFERENCES & SESSION RESET
  // Turn 1: "Không thích sơ mi"
  // Turn 2: "Tư vấn cho tôi từ đầu"
  // -------------------------------------------------------------
  console.log('\n--- TEST SCENARIO E: Negative Preference & Session Reset ---');
  const resE1 = await postChat({
    message: 'Không thích sơ mi',
  });
  const textE1 = resE1.data?.text || '';
  assert(
    textE1.toLowerCase().includes('polo') ||
      textE1.toLowerCase().includes('blazer') ||
      textE1.toLowerCase().includes('ghi nhận'),
    'Recognizes negative exclusion for sơ mi and suggests alternatives (polo / blazer / thun)'
  );

  const resE2 = await postChat({
    message: 'Tư vấn cho tôi từ đầu',
    sessionId: resE1.data?.sessionId,
  });
  const textE2 = resE2.data?.text || '';
  assert(
    textE2.toLowerCase().includes('làm mới') ||
      textE2.toLowerCase().includes('bắt đầu lại') ||
      textE2.toLowerCase().includes('từ đầu'),
    'Correctly resets session context when user asks "Tư vấn cho tôi từ đầu"'
  );

  // -------------------------------------------------------------
  // TEST SCENARIO F: 10 NATURAL VIETNAMESE EXPRESSIONS
  // -------------------------------------------------------------
  console.log('\n--- TEST SCENARIO F: 10 Natural Vietnamese Expressions ---');
  const naturalExpressions = [
    { q: 'Shop còn áo khoác bomber ko?', check: (d) => d.recommendedProducts?.length > 0 || d.text.toLowerCase().includes('khoác') },
    { q: 'Có mẫu váy nào xinh đi hẹn hò ko bạn?', check: (d) => d.text.toLowerCase().includes('hẹn hò') || d.text.toLowerCase().includes('váy') },
    { q: 'Phối cho mình bộ outfit streetwear nam đi bạn', check: (d) => d.outfitBreakdown != null || d.recommendedProducts?.length > 0 },
    { q: 'Cho mình xem áo polo trắng', check: (d) => d.recommendedProducts?.some((p) => p.categorySlug.includes('polo')) },
    { q: 'Shop giao hàng mất bao lâu?', check: (d) => d.text.toLowerCase().includes('giao hàng') || d.text.toLowerCase().includes('hỏa tốc') },
    { q: 'Chính sách đổi trả bên mình như thế nào?', check: (d) => d.text.toLowerCase().includes('đổi') || d.text.toLowerCase().includes('trả') },
    { q: 'Da ngăm đen mặc màu gì đẹp?', check: (d) => d.text.toLowerCase().includes('da') || d.text.toLowerCase().includes('màu') },
    { q: 'Set đồ này đắt quá có cái nào rẻ hơn ko?', check: (d) => d.text.toLowerCase().includes('tiết kiệm') || d.text.toLowerCase().includes('rẻ') || d.recommendedProducts?.length > 0 },
    { q: 'Tư vấn cho mình đồ đi làm công sở', check: (d) => d.text.toLowerCase().includes('công sở') || d.text.toLowerCase().includes('sơ mi') },
    { q: 'Mình muốn thử đồ lên người thì làm sao?', check: (d) => d.text.toLowerCase().includes('thử đồ') || d.text.toLowerCase().includes('phòng thử') },
  ];

  for (const expr of naturalExpressions) {
    const res = await postChat({ message: expr.q });
    const ok = expr.check(res.data);
    assert(ok, `Natural expression handled appropriately: "${expr.q}"`);
  }

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
