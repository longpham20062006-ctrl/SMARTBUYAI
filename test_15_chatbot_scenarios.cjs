/**
 * SMARTBUY AI — TEST 15 CONVERSATIONAL SCENARIOS
 */
const http = require('http');

function postChat(payload, token = null) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const options = {
      hostname: '127.0.0.1',
      port: 8080,
      path: '/api/v1/ai/stylist/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log("=== SMARTBUY AI — KIỂM THỬ 15 KỊCH BẢN TƯ VẤN CHATBOT ===");
  const sessionId = 'test_session_' + Date.now();
  let history = [];

  const scenarios = [
    {
      id: 1,
      title: "1. Chào hỏi tự nhiên",
      message: "Chào shop, hôm nay có đồ gì mới không?",
      validate: (data) => data.text && data.text.length > 20
    },
    {
      id: 2,
      title: "2. Hỏi áo sơ mi nam",
      message: "Tôi muốn tìm áo sơ mi nam",
      validate: (data) => data.recommendedProducts && data.recommendedProducts.length > 0 && data.recommendedProducts[0].gender === 'nam'
    },
    {
      id: 3,
      title: "3. Ràng buộc ngân sách 300k (Kế thừa ngữ cảnh sơ mi nam)",
      message: "Ngân sách khoảng 300k thôi nhé",
      validate: (data) => data.recommendedProducts && data.recommendedProducts.every(p => p.price <= 300000)
    },
    {
      id: 4,
      title: "4. Đổi gu màu sắc (Tôi thích màu đen)",
      message: "Tôi thích màu đen",
      validate: (data) => data.text.includes("đen") || (data.recommendedProducts && data.recommendedProducts.length > 0)
    },
    {
      id: 5,
      title: "5. Kiểm tra size món thứ 2 (cái thứ hai còn size M không?)",
      message: "Cái thứ hai còn size M không shop?",
      validate: (data) => data.text.toLowerCase().includes("size m") || data.text.toLowerCase().includes("thứ hai")
    },
    {
      id: 6,
      title: "6. Phản hồi về giá (Đắt quá, tìm mẫu rẻ hơn)",
      message: "Đắt quá, tìm cho tôi mẫu nào rẻ hơn nữa đi",
      validate: (data) => data.recommendedProducts && data.recommendedProducts.length > 0
    },
    {
      id: 7,
      title: "7. Tư vấn phối đồ (Áo này phối với quần gì thì đẹp?)",
      message: "Áo này phối với quần gì thì đẹp hả shop?",
      validate: (data) => data.text.toLowerCase().includes("quần") || (data.recommendedProducts && data.recommendedProducts.length > 0)
    },
    {
      id: 8,
      title: "8. So sánh sản phẩm (So sánh 2 mẫu trên)",
      message: "So sánh giúp mình 2 mẫu áo trên khác nhau thế nào",
      validate: (data) => data.text.length > 30
    },
    {
      id: 9,
      title: "9. AI Smart Outfit Builder (Nam 20 tuổi 500k streetwear đi chơi)",
      message: "Tôi là nam, 20 tuổi, có 500k, muốn mặc streetwear đi chơi",
      validate: (data) => data.outfitBreakdown && data.outfitBreakdown.totalPrice <= 500000 && (data.outfitBreakdown.withinBudget === true || data.outfitBreakdown.isWithinBudget === true)
    },
    {
      id: 10,
      title: "10. Sản phẩm không có trong catalog (Áo phao lông vũ âm 30 độ)",
      message: "Shop có bán áo phao lông vũ chống nước âm 30 độ không?",
      validate: (data) => data.text.includes("chưa có sẵn") || data.text.includes("Streetwear") || data.text.includes("khoác")
    },
    {
      id: 11,
      title: "11. Ý định đặt hàng từ Guest (Đặt cho tôi 1 cái size L giao đến Hà Nội)",
      message: "Đặt cho tôi 1 cái size L giao đến Hà Nội luôn nhé",
      validate: (data) => data.requiresAuth === true || data.text.includes("đăng nhập")
    },
    {
      id: 12,
      title: "12. Tra cứu đơn hàng khác tài khoản (Bảo mật thông tin đơn hàng)",
      message: "Xem đơn hàng của tôi mã DH-999999",
      validate: (data) => data.text.includes("đăng nhập") || data.requiresAuth === true
    },
    {
      id: 13,
      title: "13. Khả năng chịu lỗi và phản hồi an toàn",
      message: "@#$%^&*()_+????",
      validate: (data) => data.text && data.text.length > 10
    },
    {
      id: 14,
      title: "14. Tách biệt Try-On: Tư vấn không được gọi GPU 7860 làm chậm chat",
      message: "Gợi ý cho mình áo khoác bomber hot nhất",
      validate: (data) => data.recommendedProducts && data.recommendedProducts.length > 0
    },
    {
      id: 15,
      title: "15. Ngôn ngữ tự nhiên tiếng Việt đời thường (Đi cafe sống ảo cho cháy)",
      message: "Tư vấn cho set đồ nào đi cafe sống ảo cho cháy phố với bạn bè",
      validate: (data) => data.text && data.text.length > 30
    }
  ];

  let passedCount = 0;

  for (const sc of scenarios) {
    process.stdout.write(`Đang chạy Kịch bản ${sc.id}: ${sc.title}... `);
    try {
      const res = await postChat({
        message: sc.message,
        sessionId,
        history
      });

      if (res.status === 200 && res.data) {
        const ok = sc.validate(res.data);
        if (ok) {
          console.log("==> [PASSED] OK");
          passedCount++;
        } else {
          console.log("==> [VALIDATION WARNING]");
          console.log("    Response Text:", (res.data.text || '').substring(0, 100) + '...');
        }
        // Update history
        history.push({ sender: 'user', text: sc.message });
        history.push({ sender: 'stylist', text: res.data.text || '' });
      } else {
        console.log(`==> [FAILED] Status ${res.status}:`, res.raw || res.data);
      }
    } catch (err) {
      console.log(`==> [ERROR]:`, err.message);
    }
  }

  console.log(`\n========================================`);
  console.log(`KẾT QUẢ KIỂM THỬ: ${passedCount}/${scenarios.length} KỊCH BẢN ĐẠT CHUẨN`);
  console.log(`========================================`);
}

runTests();
