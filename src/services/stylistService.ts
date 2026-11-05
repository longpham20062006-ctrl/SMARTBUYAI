import { Product, AIStylistFilterCriteria, AIStylistMessage, OutfitBreakdown } from '@/types';
import { productService } from './productService';

const API_BASE = '/api/v1';

// Key lưu trữ session ID trong browser
const SESSION_STORAGE_KEY = 'sb_stylist_session_id';

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'session_default';
  let id = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!id) {
    id = `sb_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(SESSION_STORAGE_KEY, id);
  }
  return id;
}

export function resetLocalSession(): string {
  if (typeof window !== 'undefined') {
    const newId = `sb_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(SESSION_STORAGE_KEY, newId);
    return newId;
  }
  return 'session_default';
}

function getAuthHeader(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('sb_token') || localStorage.getItem('sb_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

// =========================================================================
// FALLBACK RULE-BASED ENGINE (Khi Backend chưa sẵn sàng hoặc rớt mạng)
// =========================================================================
export function parseStylistPrompt(input: string): {
  criteria: AIStylistFilterCriteria;
  detectedText: string;
} {
  const text = input.toLowerCase();
  const criteria: AIStylistFilterCriteria = {};
  const reasons: string[] = [];

  // Giới tính
  if (text.includes('nam') || text.includes('quý ông') || text.includes('con trai') || text.includes('cho anh')) {
    criteria.gender = 'nam';
    reasons.push('Dành cho Nam');
  } else if (text.includes('nữ') || text.includes('nàng') || text.includes('con gái') || text.includes('cho chị') || text.includes('cho em')) {
    criteria.gender = 'nu';
    reasons.push('Dành cho Nữ');
  } else if (text.includes('unisex') || text.includes('cặp đôi') || text.includes('đồ đôi')) {
    criteria.gender = 'unisex';
    reasons.push('Phong cách Unisex');
  }

  // Danh mục
  if (text.includes('sơ mi') || text.includes('so mi')) {
    criteria.category = 'so-mi-polo';
    reasons.push('Sơ mi & Polo');
  } else if (text.includes('váy') || text.includes('đầm') || text.includes('dam') || text.includes('skirt')) {
    criteria.category = 'chan-vay';
    reasons.push('Chân váy & Đầm Y2K');
  } else if (text.includes('khoác') || text.includes('bomber') || text.includes('varsity') || text.includes('jacket')) {
    criteria.category = 'ao-khoac';
    reasons.push('Áo khoác & Bomber');
  } else if (text.includes('hoodie') || text.includes('sweater') || text.includes('rugby')) {
    criteria.category = 'hoodie-sweater';
    reasons.push('Hoodie & Sweater');
  } else if (text.includes('baby tee') || text.includes('croptop') || text.includes('tank top') || text.includes('trễ vai')) {
    criteria.category = 'ao-croptop-tank';
    reasons.push('Baby Tee & Croptop');
  } else if (text.includes('áo thun') || text.includes('t-shirt') || text.includes('tee') || text.includes('graphic')) {
    criteria.category = 'ao-thun';
    reasons.push('Áo thun Streetwear');
  } else if (text.includes('cargo') || text.includes('parachute') || text.includes('túi hộp') || text.includes('jogger')) {
    criteria.category = 'quan-cargo-parachute';
    reasons.push('Quần Cargo & Parachute');
  } else if (text.includes('jeans') || text.includes('jean') || text.includes('baggy') || text.includes('jorts')) {
    criteria.category = 'quan-jeans';
    reasons.push('Quần Jeans & Jorts');
  } else if (text.includes('túi') || text.includes('mũ') || text.includes('nón') || text.includes('vòng') || text.includes('nhẫn') || text.includes('xích') || text.includes('kính') || text.includes('phụ kiện')) {
    criteria.category = 'phu-kien';
    reasons.push('Phụ kiện & Trang sức');
  }

  // Phong cách
  if (text.includes('streetwear') || text.includes('đường phố') || text.includes('bụi')) {
    criteria.style = 'Streetwear';
    reasons.push('Phong cách Streetwear');
  } else if (text.includes('y2k') || text.includes('cyber') || text.includes('2000s')) {
    criteria.style = 'Y2K';
    reasons.push('Phong cách Y2K');
  } else if (text.includes('korean') || text.includes('hàn quốc') || text.includes('k-vibe') || text.includes('ulzzang')) {
    criteria.style = 'Korean Casual';
    reasons.push('Phong cách Hàn Quốc');
  } else if (text.includes('vintage') || text.includes('retro') || text.includes('grunge')) {
    criteria.style = 'Vintage';
    reasons.push('Phong cách Vintage');
  } else if (text.includes('minimal') || text.includes('tối giản') || text.includes('basic')) {
    criteria.style = 'Minimal';
    reasons.push('Phong cách Tối giản');
  }

  // Dịp
  if (text.includes('dự tiệc') || text.includes('di tiec') || text.includes('tiệc cưới') || text.includes('dam cuoi') || text.includes('party')) {
    criteria.occasion = 'Dự tiệc';
    reasons.push('Dịp Dự tiệc & Sự kiện');
  } else if (text.includes('đi chơi') || text.includes('dạo phố') || text.includes('cafe')) {
    criteria.occasion = 'Dạo phố';
    reasons.push('Dịp Dạo phố & Cafe');
  } else if (text.includes('đi học') || text.includes('sinh viên') || text.includes('đến trường')) {
    criteria.occasion = 'Đi học';
    reasons.push('Dịp Đi học');
  } else if (text.includes('hẹn hò') || text.includes('crush') || text.includes('người yêu')) {
    criteria.occasion = 'Hẹn hò';
    reasons.push('Dịp Hẹn hò');
  } else if (text.includes('chụp ảnh') || text.includes('ootd')) {
    criteria.occasion = 'Chụp ảnh';
    reasons.push('Chụp ảnh Lookbook / OOTD');
  }

  // Ngân sách
  const budgetMatch =
    text.match(/(?:ngân sách|tầm|khoảng|có|dưới|trong tầm)\s*([0-9.,]+)\s*(k|nghìn|ngan|tr|triệu|đ|vnd)?/i) ||
    text.match(/([0-9.,]+)\s*(k|nghìn|ngan|tr|triệu|đ|vnd)/i);
  if (budgetMatch) {
    const rawVal = budgetMatch[1].replace(/[.,]/g, '');
    let num = parseInt(rawVal, 10);
    const unit = budgetMatch[2]?.toLowerCase();
    if (unit === 'k' || unit === 'nghìn' || unit === 'ngan') {
      num = num * 1000;
    } else if (unit === 'tr' || unit === 'triệu') {
      num = num * 1000000;
    } else if (num > 0 && num < 2000) {
      num = num * 1000;
    }
    criteria.maxBudget = num;
    reasons.push(`Ngân sách: ${new Intl.NumberFormat('vi-VN').format(num)} ₫`);
  }

  return {
    criteria,
    detectedText: reasons.length > 0 ? reasons.join(' • ') : 'Tất cả tiêu chí',
  };
}

function runLocalFallback(
  userMessage: string,
  history: Array<{ sender: 'user' | 'stylist'; text: string }> = []
): AIStylistMessage {
  const text = userMessage.toLowerCase().trim();
  const allProducts = productService.getAll();
  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' ₫';

  // Lấy lịch sử hội thoại trước đó
  const historyText = history.map((h) => h.text.toLowerCase()).join(' ');
  const lastBotMessage = [...history].reverse().find((h) => h.sender === 'stylist')?.text || '';

  // 1. Chuyển đổi chủ đề sang váy/đầm nữ ("tôi muốn xem váy nữ", "váy nữ", "đầm nữ")
  if (
    text.includes('váy nữ') ||
    text.includes('đầm nữ') ||
    (text.includes('váy') && text.includes('nữ')) ||
    (text.includes('đầm') && text.includes('nữ'))
  ) {
    const dresses = allProducts.filter(
      (p) =>
        p.gender === 'nu' &&
        (p.categorySlug === 'vay' ||
          p.categorySlug === 'chan-vay' ||
          (p.name || '').toLowerCase().includes('váy') ||
          (p.name || '').toLowerCase().includes('đầm'))
    );
    const recommended = dresses.slice(0, 4);
    return {
      id: `msg_${Date.now()}`,
      sender: 'stylist',
      text: `Dạ em chuyển ngay sang các mẫu đầm và váy nữ xinh xắn cho bạn đây ạ! Dưới đây là những thiết kế đầm nữ dáng xòe, chữ A và đầm dạ hội đang được các bạn Gen Z cực kỳ yêu thích:`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      recommendedProducts: recommended,
      quickReplies: ['Váy dự tiệc nhẹ nhàng', 'Đầm xòe hoa nhí', 'Có màu đen không?', 'Mẫu thứ hai còn size L không?'],
      provider: 'smartbuy-assistant',
    };
  }

  // 2. Câu hỏi nối tiếp về màu sắc ("có màu đen không?", "có màu trắng không?")
  if (text.includes('màu đen') || text.includes('màu trắng') || text.includes('có màu') || text.includes('màu khác')) {
    const requestedColor = text.includes('đen') ? 'den' : text.includes('trắng') ? 'trang' : text.includes('xám') ? 'xam' : text.includes('hồng') ? 'pink' : '';
    const colorLabel = text.includes('đen') ? 'Đen' : text.includes('trắng') ? 'Trắng' : 'nhiều màu sắc';

    const matched = allProducts
      .filter((p) => Array.isArray(p.colors) && p.colors.some((c) => c.slug === requestedColor || (c.name || '').toLowerCase().includes(requestedColor)))
      .slice(0, 4);

    return {
      id: `msg_${Date.now()}`,
      sender: 'stylist',
      text: `Dạ có ạ! Cửa hàng có các thiết kế phiên bản màu ${colorLabel} cực kỳ tôn dáng và dễ phối đồ. Bạn có thể xem ngay các mẫu có sẵn màu ${colorLabel} dưới đây:`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      recommendedProducts: matched.length > 0 ? matched : allProducts.slice(0, 3),
      quickReplies: ['Mẫu thứ hai còn size L không?', 'Phối thêm phụ kiện', 'Xem bảng size chuẩn'],
      provider: 'smartbuy-assistant',
    };
  }

  // 3. Câu hỏi nối tiếp về size ("mẫu thứ hai còn size L không?", "còn size l không?", "có size m không?")
  if (
    text.includes('size l') ||
    text.includes('size m') ||
    text.includes('size s') ||
    text.includes('size xl') ||
    text.includes('còn size')
  ) {
    const sizeWanted = text.includes('size l') ? 'L' : text.includes('size m') ? 'M' : text.includes('size s') ? 'S' : text.includes('size xl') ? 'XL' : 'M';
    const isSecond = text.includes('thứ hai') || text.includes('thứ 2') || text.includes('mẫu 2');
    const candidates = allProducts.filter((p) => Array.isArray(p.sizes) && p.sizes.includes(sizeWanted as any));
    const target = isSecond && candidates.length > 1 ? candidates[1] : candidates[0];

    return {
      id: `msg_${Date.now()}`,
      sender: 'stylist',
      text: target
        ? `Dạ mẫu "${target.name}" hiện tại vẫn CÒN size ${sizeWanted} trong kho (form rộng thoải mái chuẩn Gen Z) bạn nhé! Bạn có thể thêm ngay vào giỏ hàng hoặc bấm "Thử đồ AI" để xem trước phom dáng khi mặc lên người ạ.`
        : `Dạ hiện tại size ${sizeWanted} của mẫu này đang có sẵn trong kho SMARTBUY AI với số lượng vừa đủ. Bạn có thể đặt sớm để nhận ưu đãi nhé!`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      recommendedProducts: target ? [target] : candidates.slice(0, 2),
      quickReplies: ['Tư vấn thêm size theo cân nặng', 'Có màu đen không?', 'Thêm vào giỏ hàng'],
      provider: 'smartbuy-assistant',
    };
  }

  // 4. Nhớ ngữ cảnh câu trả lời nối tiếp ("cho nam", "nam", "đồ nam") khi câu trước đang hỏi về tiệc
  if (
    (text === 'cho nam' || text === 'nam' || text === 'đồ nam' || text.includes('cho bạn nam')) &&
    (historyText.includes('tiệc') || lastBotMessage.includes('tiệc'))
  ) {
    const malePartyTops = allProducts.filter(
      (p) =>
        p.gender === 'nam' &&
        (p.categorySlug === 'so-mi' ||
          p.categorySlug === 'ao-polo' ||
          (p.name || '').toLowerCase().includes('sơ mi') ||
          (p.name || '').toLowerCase().includes('polo'))
    );
    const malePartyPants = allProducts.filter(
      (p) =>
        p.gender === 'nam' &&
        (p.categorySlug === 'quan-jeans' ||
          p.categorySlug === 'quan' ||
          (p.name || '').toLowerCase().includes('tây') ||
          (p.name || '').toLowerCase().includes('kaki') ||
          (p.name || '').toLowerCase().includes('suông'))
    );

    const top = malePartyTops[0];
    const bottom = malePartyPants[0];
    const recommended = [top, bottom].filter(Boolean) as Product[];

    return {
      id: `msg_${Date.now()}`,
      sender: 'stylist',
      text: `Dạ vâng! Với các buổi tiệc dành cho bạn nam, SMARTBUY AI gợi ý bạn set đồ lịch sự nhưng vẫn trẻ trung, năng động:\n\n• Áo: Sơ mi cộc tay hoặc Polo dệt kim phom Regular/Oversized sang trọng.\n• Quần: Quần tây xếp ly hoặc quần kaki suông ống đứng hack dáng.\n\nDưới đây là những mẫu nổi bật chuẩn tiệc cưới, sinh nhật cho nam giới:`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      recommendedProducts: recommended,
      quickReplies: ['Có màu đen không?', 'Mẫu thứ hai còn size L không?', 'Ngân sách dưới 400k'],
      provider: 'smartbuy-assistant',
    };
  }

  // 5. Câu hỏi chung chung về dịp dự tiệc ("Tôi muốn đồ đi dự tiệc")
  if (text.includes('dự tiệc') || text.includes('di tiec') || text.includes('tiệc cưới') || text.includes('party')) {
    const samplePartyItems = allProducts
      .filter((p) => (p.name || '').toLowerCase().includes('sơ mi') || (p.name || '').toLowerCase().includes('váy') || (p.name || '').toLowerCase().includes('đầm'))
      .slice(0, 3);

    return {
      id: `msg_${Date.now()}`,
      sender: 'stylist',
      text: `Được chứ ạ! Nếu bạn đang tìm đồ đi dự tiệc, mình có thể gợi ý phong cách lịch sự hoặc trẻ trung, hiện đại.\n\n• Bạn có thể cân nhắc sơ mi kết hợp quần tây hoặc blazer phối cùng quần ống suông để tạo vẻ ngoài đĩnh đạc, sang trọng.\n• Nếu là đồ nữ, các mẫu đầm dạ hội/váy ren thanh lịch sẽ giúp bạn nổi bật trong mọi bữa tiệc.\n\nBạn chuẩn bị đi tiệc cưới, sinh nhật hay tiệc công ty? Bạn thích phong cách lịch sự hay trẻ trung để mình gợi ý set đồ chuẩn gu nhất nhé!`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      recommendedProducts: samplePartyItems,
      quickReplies: ['Cho nam', 'Cho nữ', 'Tiệc cưới bạn tôi', 'Tiệc sinh nhật cùng bạn bè'],
      provider: 'smartbuy-assistant',
    };
  }

  const { criteria, detectedText } = parseStylistPrompt(userMessage);

  const isOutfitRequest =
    userMessage.toLowerCase().includes('phối') ||
    userMessage.toLowerCase().includes('set') ||
    userMessage.toLowerCase().includes('outfit') ||
    userMessage.toLowerCase().includes('combo') ||
    !criteria.category;

  let recommended: Product[] = [];
  let explanation = '';
  let outfitBreakdown: OutfitBreakdown | undefined = undefined;

  if (isOutfitRequest) {
    const topCandidates = allProducts.filter(
      (p) =>
        ['ao-thun', 'ao-croptop-tank', 'so-mi-polo', 'hoodie-sweater', 'ao-khoac'].includes(p.categorySlug) &&
        (criteria.gender ? p.gender === criteria.gender || p.gender === 'unisex' : true) &&
        (criteria.style ? p.style === criteria.style : true)
    );
    const top = topCandidates[Math.floor(Math.random() * Math.min(5, topCandidates.length))] || topCandidates[0];

    const bottomCandidates = allProducts.filter(
      (p) =>
        ['quan-jeans', 'quan-cargo-parachute', 'chan-vay'].includes(p.categorySlug) &&
        (criteria.gender ? p.gender === criteria.gender || p.gender === 'unisex' : true)
    );
    const bottom = bottomCandidates[Math.floor(Math.random() * Math.min(5, bottomCandidates.length))] || bottomCandidates[0];

    const accCandidates = allProducts.filter((p) => p.categorySlug === 'phu-kien');
    const accessory = accCandidates[Math.floor(Math.random() * Math.min(6, accCandidates.length))] || accCandidates[0];

    const outfitItems = [top, bottom, accessory].filter(Boolean) as Product[];
    const totalFitPrice = outfitItems.reduce((sum, item) => sum + (item?.price || 0), 0);

    recommended = outfitItems;

    if (top && bottom) {
      outfitBreakdown = {
        top,
        bottom,
        accessory: accessory || undefined,
        totalPrice: totalFitPrice,
        maxBudget: criteria.maxBudget,
        isWithinBudget: criteria.maxBudget ? totalFitPrice <= criteria.maxBudget : true,
        style: criteria.style || 'Streetwear',
        occasion: criteria.occasion || 'Dạo phố',
        stylingRationale: `Bộ outfit hài hòa với áo ${top.name} phối cùng quần ${bottom.name}, tạo tỉ lệ cân đối và phom dáng thời thượng.`,
      };
    }

    if (criteria.occasion === 'Dự tiệc') {
      explanation = `Được chứ ạ! Nếu bạn đang tìm đồ đi dự tiệc, mình có thể gợi ý phong cách lịch sự hoặc trẻ trung, hiện đại.\n\n• Bạn có thể cân nhắc sơ mi kết hợp quần tây hoặc blazer phối cùng quần ống suông để tạo vẻ ngoài đĩnh đạc, sang trọng.\n• Nếu là đồ nữ, các mẫu đầm dạ hội/váy ren thanh lịch sẽ giúp bạn nổi bật trong mọi bữa tiệc.\n\nBạn chuẩn bị đi tiệc cưới, sinh nhật hay tiệc công ty? Bạn thích phong cách lịch sự hay trẻ trung để mình gợi ý set đồ chuẩn gu nhất nhé!`;
    } else if (criteria.maxBudget) {
      if (totalFitPrice <= criteria.maxBudget) {
        explanation = `🔥 Đã phối xong set OUTFIT chuẩn gu (${detectedText})!\n\n• Gồm: 1 Áo (${top?.name || ''}) + 1 Quần (${bottom?.name || ''}) + 1 Phụ kiện (${accessory?.name || ''}).\n• Tổng giá trọn bộ: ${formatVND(totalFitPrice)} (Vừa vặn trong ngân sách ${formatVND(criteria.maxBudget)} của bạn!). Bạn có thể bấm Thử đồ AI hoặc thêm từng món vào giỏ hàng ngay:`;
      } else {
        explanation = `⚡ Set OUTFIT đề xuất có tổng giá ${formatVND(totalFitPrice)}, vượt nhẹ ngân sách ${formatVND(criteria.maxBudget)} của bạn.\n• Gợi ý: Bạn có thể chọn các mẫu áo thun basic học sinh sinh viên hoặc bỏ bớt phụ kiện để tối ưu chi tiêu!`;
      }
    } else {
      explanation = `🔥 Đã phối xong bộ OUTFIT (${detectedText}) trọn bộ Áo + Quần + Phụ kiện tổng ${formatVND(totalFitPrice)} cực chất cho bạn:`;
    }
  } else {
    let matches = productService.getAll({
      gender: criteria.gender,
      categorySlug: criteria.category,
      maxPrice: criteria.maxBudget,
      styles: criteria.style ? [criteria.style] : undefined,
    });

    if (matches.length === 0) {
      matches = productService.getAll({
        gender: criteria.gender,
        categorySlug: criteria.category,
      });
    }

    recommended = matches.slice(0, 4);
    explanation = `Dựa trên yêu cầu của bạn (${detectedText}), SMARTBUY AI Stylist đề xuất ${recommended.length} sản phẩm hot trend giá học sinh sinh viên phù hợp nhất:`;
  }

  return {
    id: `msg_${Date.now()}`,
    sender: 'stylist',
    text: explanation,
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    parsedCriteria: criteria,
    recommendedProducts: recommended,
    outfitBreakdown,
    explanation: detectedText,
    provider: 'smartbuy-local-fallback',
    quickReplies:
      criteria.occasion === 'Dự tiệc'
        ? ['Tiệc cưới bạn tôi', 'Tiệc sinh nhật cùng bạn bè', 'Đầm dự tiệc nữ', 'Set sơ mi + quần âu nam']
        : [
            'Phối đồ streetwear nam đi chơi dưới 400k',
            'Outfit baby tee + chân váy xếp ly đi cafe',
            'Set đồ unisex phong cách Korean Casual',
            'Cái thứ hai còn size M không?',
          ],
  };
}

// =========================================================================
// SMARTBUY AI CONVERSATIONAL STYLIST SERVICE
// =========================================================================
export const stylistService = {
  /**
   * Tư vấn đa lượt trò chuyện kết nối trực tiếp với Spring Boot RAG / LLM Backend
   */
  consult: async (
    userMessage: string,
    history: Array<{ sender: 'user' | 'stylist'; text: string }> = [],
    activeProductId?: string
  ): Promise<AIStylistMessage> => {
    const sessionId = getOrCreateSessionId();

    try {
      const response = await fetch(`${API_BASE}/ai/stylist/chat`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          message: userMessage,
          sessionId,
          history: history.map((h) => ({
            sender: h.sender,
            text: h.text,
          })),
          activeProductId: activeProductId || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend error HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        id: `msg_${Date.now()}`,
        sender: 'stylist',
        text: data.text || 'Dạ SMARTBUY AI có thể hỗ trợ bạn tìm mẫu áo, quần hoặc phối đồ gì tiếp theo ạ?',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        recommendedProducts: Array.isArray(data.recommendedProducts) ? data.recommendedProducts : [],
        outfitBreakdown: data.outfitBreakdown || undefined,
        quickReplies: Array.isArray(data.quickReplies) && data.quickReplies.length > 0 ? data.quickReplies : [
          'Phối set streetwear nam dưới 500k',
          'Tư vấn size theo chiều cao cân nặng',
          'Mẫu rẻ hơn dưới 200k',
        ],
        provider: data.provider || 'smartbuy-rag',
        requiresAuth: !!data.requiresAuth,
      };
    } catch (err) {
      console.warn('[StylistService] Backend chat failed, falling back to local engine:', err);
      return runLocalFallback(userMessage, history);
    }
  },

  /**
   * Reset phiên hội thoại trên cả Backend và Local
   */
  resetSession: async (): Promise<void> => {
    const sessionId = getOrCreateSessionId();
    try {
      await fetch(`${API_BASE}/ai/stylist/reset-session`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ sessionId }),
      });
    } catch (e) {
      console.warn('[StylistService] Backend reset session error:', e);
    }
    resetLocalSession();
  },

  /**
   * Lấy trạng thái hoạt động của AI Stylist Engine từ Spring Boot
   */
  getStatus: async (): Promise<{
    engine: string;
    externalLlmConfigured: boolean;
    activeProvider: string;
    status: string;
  } | null> => {
    try {
      const res = await fetch(`${API_BASE}/ai/stylist/status`);
      if (res.ok) return await res.json();
      return null;
    } catch {
      return null;
    }
  },
};
