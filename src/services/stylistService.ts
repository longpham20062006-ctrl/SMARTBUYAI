import { Product, AIStylistFilterCriteria, AIStylistMessage } from '@/types';
import { productService } from './productService';

// Rule-based Natural Language Keyword Parser
export function parseStylistPrompt(input: string): {
  criteria: AIStylistFilterCriteria;
  detectedText: string;
} {
  const text = input.toLowerCase();
  const criteria: AIStylistFilterCriteria = {};
  const reasons: string[] = [];

  // 1. Giới tính
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

  // 2. Danh mục
  if (text.includes('sơ mi') || text.includes('so mi')) {
    criteria.category = 'so-mi-polo';
    reasons.push('Danh mục Sơ mi & Polo');
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
  } else if (text.includes('túi') || text.includes('mũ') || text.includes('nón') || text.includes('vòng') || text.includes('nhẫn') || text.includes('xích') || text.includes('kính') || text.includes('tất') || text.includes('khăn') || text.includes('phụ kiện')) {
    criteria.category = 'phu-kien';
    reasons.push('Phụ kiện & Trang sức');
  }

  // 3. Phong cách & Dịp
  if (text.includes('streetwear') || text.includes('đường phố') || text.includes('bụi')) {
    criteria.style = 'Streetwear';
    reasons.push('Phong cách Streetwear');
  } else if (text.includes('y2k') || text.includes('cyber') || text.includes('2000s')) {
    criteria.style = 'Y2K';
    reasons.push('Phong cách Y2K & Cyber');
  } else if (text.includes('korean') || text.includes('hàn quốc') || text.includes('k-vibe') || text.includes('ulzzang')) {
    criteria.style = 'Korean Casual';
    reasons.push('Phong cách Korean Casual');
  } else if (text.includes('vintage') || text.includes('retro') || text.includes('grunge') || text.includes('90s')) {
    criteria.style = 'Vintage';
    reasons.push('Phong cách Vintage Retro');
  } else if (text.includes('minimal') || text.includes('tối giản') || text.includes('basic')) {
    criteria.style = 'Minimal';
    reasons.push('Phong cách Minimal Tối giản');
  }

  if (text.includes('đi chơi') || text.includes('dạo phố') || text.includes('cafe') || text.includes('chém gió')) {
    criteria.occasion = 'Dạo phố';
    reasons.push('Dịp Dạo phố & Cafe');
  } else if (text.includes('đi học') || text.includes('sinh viên') || text.includes('đến trường') || text.includes('giảng đường')) {
    criteria.occasion = 'Đi học';
    reasons.push('Dịp Đi học giảng đường');
  } else if (text.includes('hẹn hò') || text.includes('crush') || text.includes('người yêu')) {
    criteria.occasion = 'Hẹn hò';
    reasons.push('Dịp Hẹn hò');
  } else if (text.includes('chụp ảnh') || text.includes('ootd') || text.includes('sống ảo')) {
    criteria.occasion = 'Chụp ảnh';
    reasons.push('Chụp ảnh Lookbook / OOTD');
  }

  // 4. Ngân sách
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
    detectedText: reasons.length > 0 ? reasons.join(' • ') : 'Tất cả tiêu chí phong cách',
  };
}

export const stylistService = {
  consult: async (userMessage: string): Promise<AIStylistMessage> => {
    // Giả lập độ trễ phản hồi tự nhiên 350ms
    await new Promise((r) => setTimeout(r, 350));

    const { criteria, detectedText } = parseStylistPrompt(userMessage);
    const allProducts = productService.getAll();

    // Phối Outfit hoàn chỉnh: 1 Áo + 1 Quần/Váy + 1 Phụ kiện
    const isOutfitRequest =
      userMessage.toLowerCase().includes('phối') ||
      userMessage.toLowerCase().includes('set') ||
      userMessage.toLowerCase().includes('outfit') ||
      userMessage.toLowerCase().includes('combo') ||
      !criteria.category;

    let recommended: Product[] = [];
    let explanation = '';

    if (isOutfitRequest) {
      // Tìm 1 Áo
      const topCandidates = allProducts.filter(
        (p) =>
          ['ao-thun', 'ao-croptop-tank', 'so-mi-polo', 'hoodie-sweater', 'ao-khoac'].includes(p.categorySlug) &&
          (criteria.gender ? (p.gender === criteria.gender || p.gender === 'unisex') : true) &&
          (criteria.style ? p.style === criteria.style : true)
      );
      const top = topCandidates[Math.floor(Math.random() * Math.min(5, topCandidates.length))] || topCandidates[0];

      // Tìm 1 Quần / Váy
      const bottomCandidates = allProducts.filter(
        (p) =>
          ['quan-jeans', 'quan-cargo-parachute', 'chan-vay'].includes(p.categorySlug) &&
          (criteria.gender ? (p.gender === criteria.gender || p.gender === 'unisex') : true)
      );
      const bottom = bottomCandidates[Math.floor(Math.random() * Math.min(5, bottomCandidates.length))] || bottomCandidates[0];

      // Tìm 1 Phụ kiện
      const accCandidates = allProducts.filter((p) => p.categorySlug === 'phu-kien');
      const accessory = accCandidates[Math.floor(Math.random() * Math.min(6, accCandidates.length))] || accCandidates[0];

      const outfitItems = [top, bottom, accessory].filter(Boolean);
      const totalFitPrice = outfitItems.reduce((sum, item) => sum + item.price, 0);

      recommended = outfitItems;

      const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' ₫';

      if (criteria.maxBudget) {
        if (totalFitPrice <= criteria.maxBudget) {
          explanation = `🔥 Đã phối xong bộ OUTFIT GEN Z chuẩn gu (${detectedText})!\n\n• Gồm: 1 Áo (${top.name}) + 1 Quần (${bottom.name}) + 1 Phụ kiện (${accessory.name}).\n• Tổng giá trọn bộ: ${formatVND(totalFitPrice)} (Vừa vặn trong ngân sách ${formatVND(criteria.maxBudget)} của bạn!). Bạn có thể bấm xem và thêm từng món vào giỏ hàng ngay:`;
        } else {
          explanation = `⚡ Set OUTFIT đề xuất có tổng giá ${formatVND(totalFitPrice)}, vượt nhẹ ngân sách ${formatVND(criteria.maxBudget)} của bạn.\n• Gợi ý: Bạn có thể chọn các mẫu áo thun basic từ 89k hoặc bỏ bớt phụ kiện để tối ưu chi tiêu sinh viên!`;
        }
      } else {
        explanation = `🔥 Đã phối xong bộ OUTFIT (${detectedText}) trọn bộ Áo + Quần + Phụ kiện tổng ${formatVND(totalFitPrice)} cực chất cho bạn:`;
      }
    } else {
      // Lọc theo danh mục cụ thể
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
      explanation: detectedText,
      quickReplies: [
        'Phối đồ streetwear nam đi chơi dưới 400k',
        'Outfit baby tee + chân váy xếp ly đi cafe',
        'Set đồ unisex phong cách Korean Casual',
        'Phụ kiện vòng cổ + nhẫn bạc Y2K dưới 150k',
      ],
    };
  },
};
