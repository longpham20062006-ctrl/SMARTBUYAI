import { Product, AIStylistFilterCriteria, AIStylistMessage } from '@/types';
import { productService } from './productService';
import { fashionSalesAssistant } from './aiSalesAssistantEngine';

// Backward compatibility export for legacy parsers
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
  } else if (text.includes('phụ kiện') || text.includes('mũ') || text.includes('nón') || text.includes('vòng')) {
    criteria.category = 'phu-kien';
    reasons.push('Phụ kiện & Trang sức');
  }

  return {
    criteria,
    detectedText: reasons.length > 0 ? reasons.join(' • ') : 'Tất cả tiêu chí phong cách',
  };
}

/**
 * SMARTBUY AI STYLIST SERVICE
 * Được vận hành bởi FashionSalesAssistantEngine chuyên nghiệp theo Master Prompt V20.
 */
export const stylistService = {
  consult: async (userMessage: string): Promise<AIStylistMessage> => {
    return fashionSalesAssistant.consult(userMessage);
  },
  resetSession: (): void => {
    fashionSalesAssistant.resetSession();
  },
  getContext: () => {
    return fashionSalesAssistant.getContext();
  },
};
