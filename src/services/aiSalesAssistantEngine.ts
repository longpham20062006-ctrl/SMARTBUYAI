import { Product, AIStylistMessage, AIStylistFilterCriteria, User, Order } from '@/types';
import { productService } from './productService';
import { MockRepo } from '@/mocks/repository';
import { formatPrice } from '@/lib/utils';
import { isProductEligibleForPublicDisplay } from '@/lib/imageValidator';

/**
 * SMARTBUY AI — MASTER PROMPT V20
 * PROFESSIONAL AI FASHION SALES ASSISTANT & INTELLIGENT CUSTOMER CONSULTATION
 *
 * System Prompt chuẩn theo Section XVII:
 * "Bạn là trợ lý tư vấn thời trang và bán hàng của SMARTBUY AI.
 *  Nhiệm vụ của bạn là hỗ trợ khách tìm kiếm, lựa chọn, phối đồ và mua sắm các sản phẩm đang được bán tại SMARTBUY AI.
 *  Bạn giao tiếp bằng tiếng Việt tự nhiên, thân thiện và chuyên nghiệp.
 *  Ưu tiên xưng hô 'Em' - 'Anh/Chị'.
 *  Bạn phải ưu tiên trả lời trực tiếp câu hỏi của khách.
 *  Chỉ đưa ra thông tin sản phẩm, giá, màu, size, tồn kho và chính sách khi có dữ liệu đáng tin cậy.
 *  Nếu không có thông tin, nói rõ chưa thể xác nhận. Không tự tạo sản phẩm hoặc giá ảo.
 *  Ghi nhớ ngữ cảnh hội thoại, tránh hỏi lại thông tin khách đã cung cấp.
 *  Đưa ra lời khuyên phối đồ có ích, giải thích ngắn gọn vì sao sản phẩm phù hợp.
 *  Không ép khách mua hàng. Không trả lời dài dòng khi không cần thiết."
 */

export interface ChatSessionContext {
  activeProduct: Product | null;
  lastSuggestedProducts: Product[];
  targetGender?: 'nam' | 'nu' | 'unisex';
  targetCategory?: string;
  targetStyle?: string;
  targetOccasion?: string;
  targetColor?: string;
  targetSize?: string;
  maxBudget?: number;
  minBudget?: number;
  userMeasurements?: {
    heightCm?: number;
    weightKg?: number;
    fitPreference?: string;
  };
  history: { sender: 'user' | 'stylist'; text: string; timestamp: string }[];
}

// Bỏ dấu tiếng Việt để đối chiếu linh hoạt không dấu / có dấu
export function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

// Chuẩn hóa từ viết tắt và tiếng lóng của giới trẻ
export function normalizeSlang(input: string): string {
  let s = input.toLowerCase();
  s = s.replace(/\b(ko|k|khong|hok|kô)\b/g, 'không');
  s = s.replace(/\b(ny)\b/g, 'người yêu');
  s = s.replace(/\b(tui|t)\b/g, 'tôi');
  s = s.replace(/\b(dc|đc)\b/g, 'được');
  s = s.replace(/\b(sz)\b/g, 'size');
  s = s.replace(/\b(form|phom)\b/g, 'phom');
  s = s.replace(/\b(vs)\b/g, 'với');
  s = s.replace(/\b(rep|ib)\b/g, 'nhắn tin');
  return s;
}

// Trích xuất số đo chiều cao & cân nặng
export function extractMeasurements(raw: string): { heightCm?: number; weightKg?: number } {
  const norm = removeVietnameseTones(raw.toLowerCase());
  let heightCm: number | undefined;
  let weightKg: number | undefined;

  // Chiều cao: 1m7, 1m70, 1m65, 1m75, 170cm, 165cm, m7, m65
  const heightMatch = norm.match(/(?:cao\s*)?(?:1m([0-9]{1,2})|([0-9]{3})\s*cm|m([0-9]{2}))/i);
  if (heightMatch) {
    if (heightMatch[1]) {
      const dec = heightMatch[1].length === 1 ? heightMatch[1] + '0' : heightMatch[1];
      heightCm = 100 + parseInt(dec, 10);
    } else if (heightMatch[2]) {
      heightCm = parseInt(heightMatch[2], 10);
    } else if (heightMatch[3]) {
      heightCm = 100 + parseInt(heightMatch[3], 10);
    }
  }

  // Cân nặng: 60kg, 60 kg, 60 can, 60 ki, 60 kgs, nang 60, nang khoang 60
  const weightMatch =
    norm.match(/nang\s*(?:khoang|tam)?\s*([0-9]{2,3})/i) ||
    norm.match(/([0-9]{2,3})\s*(?:kg|kilo|can|ki|kgs)\b/i);
  if (weightMatch) {
    const val = parseInt(weightMatch[1], 10);
    if (val >= 35 && val <= 160) {
      weightKg = val;
    }
  }

  return { heightCm, weightKg };
}

// Trích xuất ngân sách
export function extractBudget(raw: string): { maxBudget?: number; minBudget?: number } {
  const norm = removeVietnameseTones(raw.toLowerCase());
  let maxBudget: number | undefined;
  let minBudget: number | undefined;

  // Dưới 300k, tầm 300k, khoảng 300k, <300k, duoi 300k, 300k do lai
  const budgetMatch =
    norm.match(/(?:duoi|tam|khoang|tam khoang|co|trong tam|tam gia|ngan sach|gia|toi da)\s*([0-9.,]+)\s*(k|nghin|ngan|tr|trieu|d|vnd)?/i) ||
    norm.match(/([0-9.,]+)\s*(k|nghin|ngan|tr|trieu|d|vnd)/i);

  if (budgetMatch) {
    const rawVal = budgetMatch[1].replace(/[.,]/g, '');
    let num = parseInt(rawVal, 10);
    const unit = budgetMatch[2]?.toLowerCase();
    if (unit === 'k' || unit === 'nghin' || unit === 'ngan') {
      num = num * 1000;
    } else if (unit === 'tr' || unit === 'trieu') {
      num = num * 1000000;
    } else if (num > 0 && num < 2000) {
      num = num * 1000;
    }
    maxBudget = num;
  }

  // Khoảng từ A đến B (ví dụ: từ 200k đến 400k)
  const rangeMatch = norm.match(/(?:tu|khoang)\s*([0-9.,]+)\s*(?:k|nghin)?\s*(?:den|to)\s*([0-9.,]+)\s*(k|nghin|tr|trieu)?/i);
  if (rangeMatch) {
    let min = parseInt(rangeMatch[1].replace(/[.,]/g, ''), 10);
    let max = parseInt(rangeMatch[2].replace(/[.,]/g, ''), 10);
    if (min < 2000) min *= 1000;
    if (max < 2000) max *= 1000;
    minBudget = min;
    maxBudget = max;
  }

  return { maxBudget, minBudget };
}

// Màu sắc trích xuất
export function extractColor(raw: string): string | undefined {
  const lower = raw.toLowerCase();
  const norm = removeVietnameseTones(lower);

  // 1. Tiếng Việt có dấu (chuẩn xác cao nhất)
  if (lower.includes('màu đen') || lower.includes('đen')) return 'Đen';
  if (lower.includes('màu trắng') || lower.includes('trắng')) return 'Trắng';
  if (lower.includes('màu xám') || lower.includes('xám') || lower.includes('ghi')) return 'Xám';
  if (lower.includes('màu be') || /\bmàu be\b/i.test(lower) || /\bbe\b/i.test(lower)) return 'Be';
  if (lower.includes('màu kem') || lower.includes('kem')) return 'Kem';
  if (lower.includes('màu nâu') || lower.includes('nâu')) return 'Nâu';
  if (lower.includes('màu xanh') || lower.includes('xanh')) return 'Xanh';
  if (lower.includes('màu rêu') || lower.includes('rêu')) return 'Rêu';
  if (lower.includes('màu hồng') || lower.includes('hồng')) return 'Hồng';
  if (lower.includes('màu vàng') || lower.includes('vàng')) return 'Vàng';
  if (lower.includes('màu đỏ') || lower.includes('đỏ')) return 'Đỏ';
  if (lower.includes('pastel')) return 'Pastel';

  // 2. Tiếng Việt không dấu (an toàn với word boundaries và ngữ cảnh màu)
  if (/\b(mau den|tone den|den)\b/i.test(norm) && !norm.includes('den dau')) return 'Đen';
  if (/\b(mau trang|tone trang|trang tinh)\b/i.test(norm)) return 'Trắng';
  if (/\b(mau xam|tone xam|ghi)\b/i.test(norm)) return 'Xám';
  if (/\b(mau be|tone be)\b/i.test(norm)) return 'Be';
  if (/\b(mau kem|tone kem)\b/i.test(norm)) return 'Kem';
  if (/\b(mau nau|tone nau)\b/i.test(norm)) return 'Nâu';
  if (/\b(mau xanh|tone xanh|xanh la|xanh duong|navy)\b/i.test(norm)) return 'Xanh';
  if (/\b(mau reu|tone reu)\b/i.test(norm)) return 'Rêu';
  if (/\b(mau hong|tone hong)\b/i.test(norm) || (/\bhong\b/i.test(norm) && !norm.includes('khong'))) return 'Hồng';
  if (/\b(mau vang|tone vang)\b/i.test(norm)) return 'Vàng';
  if (/\b(mau do|tone do)\b/i.test(norm)) return 'Đỏ';

  return undefined;
}

// Size trích xuất
export function extractSize(raw: string): string | undefined {
  const upper = raw.toUpperCase();
  if (/\bXXL\b/i.test(upper)) return 'XXL';
  if (/\bXL\b/i.test(upper)) return 'XL';
  if (/\bL\b/i.test(upper) && (upper.includes('SIZE L') || upper.includes('SZ L') || upper.includes('CỠ L') || upper.includes('CO SIZE L'))) return 'L';
  if (/\bM\b/i.test(upper) && (upper.includes('SIZE M') || upper.includes('SZ M') || upper.includes('CỠ M') || upper.includes('CO SIZE M'))) return 'M';
  if (/\bS\b/i.test(upper) && (upper.includes('SIZE S') || upper.includes('SZ S') || upper.includes('CỠ S') || upper.includes('CO SIZE S'))) return 'S';
  if (/\bXS\b/i.test(upper)) return 'XS';
  if (/\bFREESIZE\b/i.test(upper) || /\bFREE SIZE\b/i.test(upper)) return 'FreeSize';
  return undefined;
}

export class FashionSalesAssistantEngine {
  private context: ChatSessionContext;

  constructor() {
    this.context = this.createEmptyContext();
  }

  public createEmptyContext(): ChatSessionContext {
    return {
      activeProduct: null,
      lastSuggestedProducts: [],
      history: [],
    };
  }

  public resetSession(): void {
    this.context = this.createEmptyContext();
  }

  public getContext(): ChatSessionContext {
    return this.context;
  }

  /**
   * Xử lý tin nhắn người dùng và trả về phản hồi thông minh chuẩn mực
   */
  public async consult(rawQuery: string): Promise<AIStylistMessage> {
    const raw = rawQuery.trim();
    const slangNormalized = normalizeSlang(raw);
    const textNorm = removeVietnameseTones(slangNormalized);

    // Lưu vào history
    this.context.history.push({
      sender: 'user',
      text: raw,
      timestamp: new Date().toISOString(),
    });

    // Lấy thông tin user hiện tại nếu có
    const currentUser = MockRepo.getCurrentUser();

    // 1. CHỦ ĐỀ: ĐƠN HÀNG (ORDER CHECK)
    if (this.isOrderQuery(textNorm)) {
      return this.handleOrderQuery(currentUser);
    }

    // 2. CHỦ ĐỀ: CHÀO HỎI (GREETING)
    if (this.isGreeting(textNorm)) {
      return this.handleGreeting();
    }

    // 3. CHỦ ĐỀ: NGOÀI LỀ (OFF-TOPIC)
    if (this.isOffTopic(textNorm)) {
      return this.handleOffTopic();
    }

    // 4. CHỦ ĐỀ: HƯỚNG DẪN MUA HÀNG / CHÍNH SÁCH / VOUCHER / AI TRY-ON
    if (this.isStorePolicyOrHelp(textNorm)) {
      return this.handleStorePolicy(textNorm);
    }

    // 5. CHỦ ĐỀ: TƯ VẤN VÓC DÁNG & TƯ VẤN CHỌN SIZE (BODY FIT & SIZING)
    const measurements = extractMeasurements(raw);
    if (this.isBodyFitSizingQuery(textNorm) || Boolean(measurements.heightCm || measurements.weightKg)) {
      return this.handleBodyFitSizing(raw, textNorm);
    }

    // 6. CHỦ ĐỀ: TƯ VẤN MÀU SẮC THEO TONE DA (SKIN TONE COLOR CONSULTATION)
    if (textNorm.includes('da ngam') || textNorm.includes('da trang') || textNorm.includes('da vang') || textNorm.includes('ton da')) {
      return this.handleSkinToneColorConsultation(textNorm);
    }

    // 7. CHỦ ĐỀ: HỎI PHỐI ĐỒ VỚI SẢN PHẨM ĐANG QUAN TÂM ("Áo này phối quần gì đẹp?")
    if (this.context.activeProduct && (textNorm.includes('phoi quan') || textNorm.includes('phoi ao') || textNorm.includes('phoi gi') || textNorm.includes('mac voi gi') || textNorm.includes('ket hop voi'))) {
      return this.handleCoordinationWithActiveProduct(this.context.activeProduct);
    }

    // 8. CHỦ ĐỀ: TƯ VẤN PHỐI ĐỒ TỔNG QUAN (OUTFIT COORDINATION / SET ĐỒ)
    if (this.isOutfitCoordination(textNorm)) {
      return this.handleOutfitCoordination(raw, textNorm);
    }

    // 9. CHỦ ĐỀ: HỎI MÀU SẮC CỦA SẢN PHẨM HIỆN TẠI (COLOR QUERY)
    if (this.isColorQuery(raw, textNorm)) {
      const colorResp = this.handleColorQuery(raw, textNorm);
      if (colorResp) return colorResp;
    }

    // 10. CHỦ ĐỀ: HỎI SIZE SẢN PHẨM HIỆN TẠI (SIZE IN STOCK QUERY)
    if (this.isSizeCheckQuery(raw, textNorm)) {
      const sizeResp = this.handleSizeCheckQuery(raw, textNorm);
      if (sizeResp) return sizeResp;
    }

    // 11. CHỦ ĐỀ: TÌM KIẾM THEO NGÂN SÁCH HOẶC DANH MỤC CỤ THỂ
    return this.handleProductSearch(raw, textNorm);
  }

  // --- CÁC BỘ PHÂN LOẠI Ý ĐỊNH (INTENT CLASSIFIERS) ---

  private isGreeting(norm: string): boolean {
    const greetings = ['chao', 'hello', 'hi', 'alo', 'shop oi', 'ad oi', 'xin chao', 'hey'];
    return greetings.some((g) => norm === g || norm.startsWith(g + ' ') || norm.endsWith(' ' + g));
  }

  private isOrderQuery(norm: string): boolean {
    return (
      norm.includes('don hang') ||
      norm.includes('kiem tra don') ||
      norm.includes('tinh trang don') ||
      norm.includes('ma don') ||
      norm.includes('don cua toi') ||
      norm.includes('tra cuu don') ||
      norm.includes('hang den dau roi')
    );
  }

  private isOffTopic(norm: string): boolean {
    const offtopicKeywords = [
      'thoi tiet', 'troi mua', 'nang qua', 'lap trinh', 'code python', 'viet code',
      'lam tho', 'chinh tri', 'tin tuc the gioi', 'bitcoin', 'crypto', 'gia vang',
      'ban may tuoi', 'ai tao ra ban', 'ai la tong thong', 'bai tap hoa hoc',
    ];
    return offtopicKeywords.some((k) => norm.includes(k));
  }

  private isStorePolicyOrHelp(norm: string): boolean {
    return (
      norm.includes('doi size') ||
      norm.includes('doi tra') ||
      norm.includes('phi ship') ||
      norm.includes('freeship') ||
      norm.includes('bao lau nhan duoc') ||
      norm.includes('thu do ao') ||
      norm.includes('ai try on') ||
      norm.includes('cach mua hang') ||
      norm.includes('huong dan mua')
    );
  }

  private isColorQuery(raw: string, norm: string): boolean {
    const lower = raw.toLowerCase();
    // Nếu có từ "mẫu" (mẫu áo, mẫu váy, mẫu mới...) thì KHÔNG phải hỏi màu sắc
    if (
      lower.includes('mẫu') ||
      norm.includes('mau vay') ||
      norm.includes('mau ao') ||
      norm.includes('mau quan') ||
      norm.includes('mau moi') ||
      norm.includes('mau san pham') ||
      norm.includes('mau thiet ke') ||
      norm.includes('co mau vay') ||
      norm.includes('co mau ao')
    ) {
      return false;
    }

    const colorKeywords = ['màu', 'mau sac', 'bang mau', 'tone mau', 'màu gì', 'mau gi', 'mau khac', 'màu khác', 'con mau', 'còn màu'];
    const hasColorContext = colorKeywords.some((k) => lower.includes(k) || norm.includes(k));
    const hasSpecificColor = Boolean(extractColor(raw));

    return (
      (hasColorContext || hasSpecificColor) &&
      (norm.includes('co ') || norm.includes('con ') || norm.includes('xem ') || norm.includes('nhung ') || norm.includes('mau gi') || norm.includes('khong')) &&
      !norm.includes('da ngam') &&
      !norm.includes('da trang') &&
      !norm.includes('da vang') &&
      !norm.includes('ton da')
    );
  }

  private isSizeCheckQuery(raw: string, norm: string): boolean {
    // Không phải size check nếu đang tìm đồ hoặc phối đồ
    if (
      norm.includes('tim') ||
      norm.includes('muon') ||
      norm.includes('phoi') ||
      norm.includes('set') ||
      norm.includes('outfit') ||
      norm.includes('di choi') ||
      norm.includes('di hoc') ||
      norm.includes('di tiec') ||
      norm.includes('nguoi yeu')
    ) {
      return false;
    }

    return (
      norm.includes('co size') ||
      norm.includes('con size') ||
      norm.includes('size xl') ||
      norm.includes('size l') ||
      norm.includes('size m') ||
      norm.includes('size s') ||
      norm.includes('size xxl') ||
      norm.includes('size gi') ||
      norm.includes('nhung size nao') ||
      norm.includes('con hang') ||
      norm.includes('het hang')
    );
  }

  private isBodyFitSizingQuery(norm: string): boolean {
    return (
      (norm.includes('cao') && (norm.includes('nang') || norm.includes('kg') || norm.includes('can'))) ||
      norm.includes('mac size gi') ||
      norm.includes('vua size gi') ||
      norm.includes('size gi vua') ||
      norm.includes('bung to') ||
      norm.includes('nguoi gay') ||
      norm.includes('nguoi map') ||
      norm.includes('chieu cao') ||
      norm.includes('can nang')
    );
  }

  private isOutfitCoordination(norm: string): boolean {
    return (
      norm.includes('phoi do') ||
      norm.includes('phoi sao') ||
      norm.includes('set do') ||
      norm.includes('combo') ||
      norm.includes('outfit') ||
      norm.includes('di choi voi ny') ||
      norm.includes('di choi voi nguoi yeu') ||
      norm.includes('do di choi') ||
      norm.includes('mac di choi') ||
      norm.includes('do doi') ||
      norm.includes('mac di hoc') ||
      norm.includes('mac di tiec')
    );
  }

  // --- CÁC HÀM XỬ LÝ CHUYÊN MÔN (INTENT HANDLERS) ---

  private handleGreeting(): AIStylistMessage {
    const greetingText =
      'Dạ em chào anh/chị! Em là trợ lý tư vấn thời trang của SMARTBUY AI ạ. ' +
      'Anh/chị đang muốn tìm trang phục Nam hay Nữ, và mình định mặc đi học, đi chơi hay đi tiệc để em tư vấn mẫu chuẩn đẹp nhất cho mình nhé ạ?';

    return {
      id: `msg_${Date.now()}`,
      sender: 'stylist',
      text: greetingText,
      timestamp: this.getTimestamp(),
      quickReplies: [
        'Tư vấn phối đồ đi chơi cá tính',
        'Tìm áo nam dưới 300k',
        'Gợi ý váy nữ đi tiệc Y2K',
        'Tư vấn chọn size theo chiều cao cân nặng',
      ],
    };
  }

  private handleOffTopic(): AIStylistMessage {
    return {
      id: `msg_${Date.now()}`,
      sender: 'stylist',
      text:
        'Dạ em là trợ lý thời trang của SMARTBUY AI, em chuyên hỗ trợ tư vấn chọn đồ, phối outfit và giải đáp thông tin sản phẩm tại shop ạ. ' +
        'Anh/chị đang có nhu cầu tìm trang phục hay phụ kiện nào thì cứ nhắn em hỗ trợ ngay nhé!',
      timestamp: this.getTimestamp(),
      quickReplies: [
        'Xem sản phẩm HOT hôm nay',
        'Tìm áo thun streetwear',
        'Tư vấn phối đồ đi chơi',
      ],
    };
  }

  private handleStorePolicy(norm: string): AIStylistMessage {
    let policyText = '';

    if (norm.includes('doi size') || norm.includes('doi tra')) {
      policyText =
        'Dạ tại SMARTBUY AI, anh/chị được hỗ trợ **đổi size tận nơi trong vòng 15 ngày** hoàn toàn thuận tiện ạ. ' +
        'Shipper sẽ mang size mới đến tận nhà đổi cho mình, anh/chị chỉ cần giữ sản phẩm còn nguyên tem mác giúp em là được nhé!';
    } else if (norm.includes('phi ship') || norm.includes('freeship')) {
      policyText =
        'Dạ shop áp dụng chính sách **FREESHIP toàn quốc cho mọi đơn hàng từ 299.000đ** ạ. ' +
        'Với đơn dưới 299k, phí vận chuyển đồng giá toàn quốc chỉ 25.000đ và giao nhanh từ 2 - 3 ngày làm việc ạ.';
    } else if (norm.includes('thu do') || norm.includes('try on')) {
      policyText =
        'Dạ anh/chị có thể bấm vào mục **"AI Try-On"** trên thanh menu hoặc nút ✨ ở từng sản phẩm để tải ảnh cá nhân và ngắm trước outfit mặc lên người mình nhé. ' +
        'Tính năng này hoàn toàn miễn phí và không lưu ảnh cá nhân của mình đâu ạ!';
    } else {
      policyText =
        'Dạ để mua hàng trên website, anh/chị chỉ cần chọn sản phẩm ưng ý, chọn size/màu và bấm **"Thêm vào giỏ"**. ' +
        'Sau đó vào Giỏ hàng bấm **"Tiến hành thanh toán"**, điền địa chỉ là xong ạ. Anh/chị có cần em tìm giúp mẫu nào không ạ?';
    }

    return {
      id: `msg_${Date.now()}`,
      sender: 'stylist',
      text: policyText,
      timestamp: this.getTimestamp(),
      quickReplies: ['Khám phá thời trang Nam', 'Khám phá thời trang Nữ', 'Phòng thử đồ ảo AI'],
    };
  }

  private handleOrderQuery(currentUser: User | null): AIStylistMessage {
    if (!currentUser) {
      return {
        id: `msg_${Date.now()}`,
        sender: 'stylist',
        text:
          'Dạ để kiểm tra tình trạng đơn hàng chính xác và bảo mật thông tin cá nhân, ' +
          'anh/chị vui lòng bấm **Đăng nhập** tài khoản mua hàng ở góc trên website giúp em nhé ạ!',
        timestamp: this.getTimestamp(),
        quickReplies: ['Đăng nhập tài khoản', 'Tư vấn mua sắm'],
      };
    }

    // Lấy các đơn hàng thuộc về chính tài khoản này (Bảo mật: Customer A không xem được đơn của Customer B)
    const allOrders = MockRepo.getOrders();
    const myOrders = allOrders.filter(
      (o) => o.userId === currentUser.id || o.customerEmail === currentUser.email
    );

    if (myOrders.length === 0) {
      return {
        id: `msg_${Date.now()}`,
        sender: 'stylist',
        text:
          `Dạ em đã kiểm tra tài khoản của anh/chị **${currentUser.name}** (${currentUser.email}) nhưng hiện tại mình chưa có đơn hàng nào ạ. ` +
          'Anh/chị có muốn em tư vấn những mẫu thiết kế mới nhất đang có ưu đãi không ạ?',
        timestamp: this.getTimestamp(),
        quickReplies: ['Xem áo HOT hôm nay', 'Xem các mẫu váy mới về'],
      };
    }

    const latest = myOrders[0];
    const statusMap: Record<string, string> = {
      PENDING: 'Đang chờ xác nhận',
      CONFIRMED: 'Đã xác nhận đơn hàng',
      SHIPPED: 'Đang vận chuyển giao hàng',
      DELIVERED: 'Đã giao thành công',
      CANCELLED: 'Đã hủy',
    };
    const statusText = statusMap[latest.orderStatus] || latest.orderStatus;
    const itemCount = latest.items.reduce((sum, it) => sum + it.quantity, 0);

    const reply =
      `Dạ em kiểm tra thấy tài khoản của anh/chị có đơn hàng gần nhất:\n\n` +
      `• **Mã đơn**: #${latest.orderNumber}\n` +
      `• **Ngày đặt**: ${new Date(latest.createdAt).toLocaleDateString('vi-VN')}\n` +
      `• **Số lượng**: ${itemCount} món trang phục\n` +
      `• **Tổng thanh toán**: ${formatPrice(latest.totalAmount)}\n` +
      `• **Tình trạng**: ${statusText}\n\n` +
      `Anh/chị có thể bấm vào phần **"Lịch sử đơn hàng"** trong trang cá nhân để xem chi tiết lộ trình nhé ạ!`;

    return {
      id: `msg_${Date.now()}`,
      sender: 'stylist',
      text: reply,
      timestamp: this.getTimestamp(),
      quickReplies: ['Xem trang cá nhân', 'Tìm thêm trang phục khác'],
    };
  }

  private handleColorQuery(raw: string, norm: string): AIStylistMessage | null {
    // Cần có sản phẩm đang nói đến (activeProduct hoặc sản phẩm vừa gợi ý)
    const targetProduct = this.context.activeProduct || this.context.lastSuggestedProducts[0];
    if (!targetProduct) {
      return null; // Không có sản phẩm nào đang nói đến -> chuyển tiếp sang search
    }

    const askedColor = extractColor(raw);
    const availableColors = targetProduct.colors || [];
    const colorNames = availableColors.map((c) => c.name.toLowerCase());

    if (!askedColor) {
      // Khách hỏi chung chung: "Có những màu nào?"
      if (availableColors.length > 0) {
        const listStr = availableColors.map((c) => c.name).join(', ');
        return {
          id: `msg_${Date.now()}`,
          sender: 'stylist',
          text: `Dạ mẫu **${targetProduct.name}** hiện có các màu: **${listStr}** ạ. Anh/chị thích gam màu nào hơn để em tư vấn cách phối nhé?`,
          timestamp: this.getTimestamp(),
          recommendedProducts: [targetProduct],
        };
      }
      return {
        id: `msg_${Date.now()}`,
        sender: 'stylist',
        text: `Dạ mẫu **${targetProduct.name}** hiện đang có màu tiêu chuẩn như hình hiển thị ạ.`,
        timestamp: this.getTimestamp(),
        recommendedProducts: [targetProduct],
      };
    }

    // Khách hỏi cụ thể 1 màu: "Có màu đen không?"
    const hasColor = colorNames.some((c) => c.includes(askedColor.toLowerCase()) || askedColor.toLowerCase().includes(c));

    if (hasColor) {
      return {
        id: `msg_${Date.now()}`,
        sender: 'stylist',
        text: `Dạ có ạ! Mẫu **${targetProduct.name}** hiện có màu **${askedColor}**. Anh/chị có thể bấm "Xem chi tiết" để xem ảnh màu ${askedColor} và chọn size nhé ạ!`,
        timestamp: this.getTimestamp(),
        recommendedProducts: [targetProduct],
      };
    } else {
      // Tìm sản phẩm tương tự có màu khách hỏi
      const similarWithColor = productService.getAll({
        gender: targetProduct.gender,
        categorySlug: targetProduct.categorySlug,
      }).filter((p) =>
        p.id !== targetProduct.id &&
        isProductEligibleForPublicDisplay(p) &&
        p.colors?.some((c) => c.name.toLowerCase().includes(askedColor.toLowerCase()))
      ).slice(0, 2);

      let text = `Dạ mẫu **${targetProduct.name}** hiện chưa có màu **${askedColor}** ạ.`;
      if (similarWithColor.length > 0) {
        text += ` Nhưng em tìm thấy mẫu tương tự đang có màu ${askedColor} rất đẹp này, anh/chị xem thử nhé:`;
        this.context.activeProduct = similarWithColor[0];
      }

      return {
        id: `msg_${Date.now()}`,
        sender: 'stylist',
        text,
        timestamp: this.getTimestamp(),
        recommendedProducts: similarWithColor.length > 0 ? similarWithColor : undefined,
      };
    }
  }

  private handleSizeCheckQuery(raw: string, norm: string): AIStylistMessage | null {
    const targetProduct = this.context.activeProduct || this.context.lastSuggestedProducts[0];
    if (!targetProduct) return null;

    if (norm.includes('con hang') || norm.includes('het hang')) {
      const availableSizes = targetProduct.sizes || ['S', 'M', 'L', 'XL'];
      return {
        id: `msg_${Date.now()}`,
        sender: 'stylist',
        text: `Dạ mẫu **${targetProduct.name}** hiện vẫn **còn hàng sẵn tại kho** với các size: **${availableSizes.join(', ')}** ạ. Anh/chị có muốn đặt giữ size hoặc xem thêm cách phối đồ không ạ?`,
        timestamp: this.getTimestamp(),
        recommendedProducts: [targetProduct],
      };
    }

    const askedSize = extractSize(raw);
    const availableSizes = targetProduct.sizes || ['S', 'M', 'L', 'XL'];

    if (!askedSize) {
      // Khách hỏi chung: "Áo này có những size nào?"
      return {
        id: `msg_${Date.now()}`,
        sender: 'stylist',
        text: `Dạ mẫu **${targetProduct.name}** hiện có đầy đủ các size: **${availableSizes.join(', ')}** ạ. Anh/chị cho em xin chiều cao và cân nặng để em chọn size vừa vặn nhất nhé!`,
        timestamp: this.getTimestamp(),
        recommendedProducts: [targetProduct],
      };
    }

    const hasSize = availableSizes.includes(askedSize as any);
    if (hasSize) {
      return {
        id: `msg_${Date.now()}`,
        sender: 'stylist',
        text: `Dạ có ạ! Mẫu **${targetProduct.name}** hiện vẫn còn **size ${askedSize}** ạ. Phom áo này mặc rất chuẩn dáng, anh/chị bấm "Xem chi tiết" để xem thêm thông số đo nhé!`,
        timestamp: this.getTimestamp(),
        recommendedProducts: [targetProduct],
      };
    } else {
      return {
        id: `msg_${Date.now()}`,
        sender: 'stylist',
        text: `Dạ hiện tại mẫu **${targetProduct.name}** tạm hết **size ${askedSize}**, shop còn các size **${availableSizes.join(', ')}** ạ. Nếu anh/chị cần em có thể tìm mẫu khác tương tự có size ${askedSize} nhé ạ!`,
        timestamp: this.getTimestamp(),
        recommendedProducts: [targetProduct],
      };
    }
  }

  private handleBodyFitSizing(raw: string, norm: string): AIStylistMessage {
    const { heightCm, weightKg } = extractMeasurements(raw);

    if (heightCm) this.context.userMeasurements = { ...this.context.userMeasurements, heightCm };
    if (weightKg) this.context.userMeasurements = { ...this.context.userMeasurements, weightKg };

    const h = heightCm || this.context.userMeasurements?.heightCm;
    const w = weightKg || this.context.userMeasurements?.weightKg;

    if (!h && !w) {
      return {
        id: `msg_${Date.now()}`,
        sender: 'stylist',
        text: 'Dạ để tư vấn size chuẩn xác nhất, anh/chị có thể cho em xin **chiều cao và cân nặng** (ví dụ: 1m70, 60kg) và sở thích mặc vừa vặn hay phom rộng rãi ạ?',
        timestamp: this.getTimestamp(),
        quickReplies: ['Cao 1m70 nặng 60kg', 'Cao 1m62 nặng 50kg', 'Cao 1m75 nặng 72kg'],
      };
    }

    // Logic tính toán size theo tiêu chuẩn thời trang Streetwear Việt Nam Gen Z
    let recommendedSize = 'M';
    let alternativeSize = 'L';
    let explanation = '';

    if (h && w) {
      if (h < 162 && w < 52) {
        recommendedSize = 'S';
        alternativeSize = 'M';
      } else if (h <= 172 && w <= 65) {
        recommendedSize = 'M';
        alternativeSize = 'L';
      } else if (h <= 180 && w <= 76) {
        recommendedSize = 'L';
        alternativeSize = 'XL';
      } else {
        recommendedSize = 'XL';
        alternativeSize = 'XXL';
      }

      explanation =
        `Dạ với chiều cao **${h}cm** và cân nặng **${w}kg**, em tư vấn:\n\n` +
        `• Nếu anh/chị thích mặc **vừa vặn, gọn gàng**: Chọn **Size ${recommendedSize}** là vừa chuẩn phom.\n` +
        `• Nếu anh/chị thích phong cách **Oversized / Boxy phom rộng tự do** chuẩn Gen Z: Nên chọn **Size ${alternativeSize}** nhé ạ!\n\n` +
        `Sản phẩm tại SMARTBUY AI đều được may bằng vải Cotton Heavyweight giữ phom đứng rất tốt và không bị co rút khi giặt.`;
    } else if (h) {
      explanation = `Dạ với chiều cao **${h}cm**, thông thường sẽ mặc đẹp nhất ở khoảng size **M** hoặc **L**. Nếu anh/chị cho em xin thêm số cân nặng thì em sẽ chọn size chính xác nhất ạ!`;
    } else {
      explanation = `Dạ với cân nặng **${w}kg**, thông thường sẽ tương ứng khoảng size **M** hoặc **L**. Anh/chị cao khoảng bao nhiêu để em chốt size chuẩn nhất nhé!`;
    }

    // Nếu đang có activeProduct, giữ lại để khách xem
    const recs = this.context.activeProduct ? [this.context.activeProduct] : undefined;

    return {
      id: `msg_${Date.now()}`,
      sender: 'stylist',
      text: explanation,
      timestamp: this.getTimestamp(),
      recommendedProducts: recs,
      quickReplies: ['Thích mặc phom rộng Oversized', 'Thích mặc vừa người Regular', 'Xem mẫu áo phù hợp'],
    };
  }

  private handleSkinToneColorConsultation(norm: string): AIStylistMessage {
    let advice = '';
    let filterColor = '';

    if (norm.includes('da ngam') || norm.includes('da banh mat')) {
      advice =
        'Dạ với làn da ngăm khỏe khoắn, bí quyết là chọn các gam màu **trung tính và ấm áp** như:\n\n' +
        '• **Đen, Trắng kem (Off-white), Xám tiêu**: Tôn da tự nhiên, cực kỳ nam tính và thanh lịch.\n' +
        '• **Xanh rêu (Olive), Nâu đất, Be**: Mang lại diện mạo vintage đường phố thu hút.\n' +
        '• **Nên hạn chế**: Các màu neon dạ quang hoặc màu quá chói vì dễ làm xỉn da ạ.\n\n' +
        'Dưới đây là một số mẫu trang phục tone màu trầm ấm tôn da rất được yêu thích tại shop:';
      filterColor = 'den';
    } else {
      advice =
        'Dạ với làn da sáng, anh/chị hầu như có thể tự tin diện mọi bảng màu! Đặc biệt các gam màu Pastel, Xanh Navy, Đen tương phản hoặc Trắng sữa sẽ làm nổi bật vẻ tươi trẻ và năng động.';
      filterColor = 'trang';
    }

    const matchedProducts = productService.getAll({
      colors: [filterColor],
    }).filter(isProductEligibleForPublicDisplay).slice(0, 3);

    return {
      id: `msg_${Date.now()}`,
      sender: 'stylist',
      text: advice,
      timestamp: this.getTimestamp(),
      recommendedProducts: matchedProducts,
      quickReplies: ['Tìm áo thun đen', 'Tìm áo sơ mi be', 'Tư vấn phối quần'],
    };
  }

  private handleCoordinationWithActiveProduct(active: Product): AIStylistMessage {
    const isTop = ['ao-thun', 'ao-croptop-tank', 'so-mi-polo', 'hoodie-sweater', 'ao-khoac', 'ao'].some(
      (c) => active.categorySlug.includes(c)
    );

    let pairCategory = isTop ? 'quan-jeans' : 'ao-thun';
    let pairGender = active.gender;

    // Tìm các món đồ phối hợp trong catalog
    let pairCandidates = productService.getAll({
      gender: pairGender,
      categorySlug: pairCategory,
    }).filter((p) => p.id !== active.id && isProductEligibleForPublicDisplay(p));

    if (pairCandidates.length === 0) {
      pairCandidates = productService.getAll({
        categorySlug: isTop ? 'quan' : 'ao',
      }).filter((p) => p.id !== active.id && isProductEligibleForPublicDisplay(p));
    }

    const bottom = pairCandidates[0] || pairCandidates[1];
    const recommendedList = [active];
    if (bottom) recommendedList.push(bottom);

    const totalPrice = recommendedList.reduce((sum, p) => sum + p.price, 0);

    const advice =
      `Dạ với mẫu **${active.name}** (${active.brand}), em gợi ý bản phối:\n\n` +
      `• Phối cùng **quần jeans ống suông hoặc quần cargo túi hộp** dáng rộng để tạo tỷ lệ cơ thể chuẩn Streetwear Gen Z.\n` +
      `• Đi kèm một đôi sneaker cổ thấp màu trắng hoặc đen để tổng thể liền mạch và năng động.\n` +
      `• Tổng set đồ 2 món này là **${formatPrice(totalPrice)}** ạ! Anh/chị xem chi tiết bên dưới nhé:`;

    return {
      id: `msg_${Date.now()}`,
      sender: 'stylist',
      text: advice,
      timestamp: this.getTimestamp(),
      recommendedProducts: recommendedList,
      quickReplies: ['Tìm thêm quần ống rộng khác', 'Xem phụ kiện phối cùng', 'Tư vấn chọn size'],
    };
  }

  private handleOutfitCoordination(raw: string, norm: string): AIStylistMessage {
    // Xác định giới tính từ query hoặc context
    let gender: 'nam' | 'nu' | 'unisex' | undefined = this.context.targetGender;
    if (norm.includes('nam') || norm.includes('con trai') || norm.includes('cho anh')) gender = 'nam';
    else if (norm.includes('nu') || norm.includes('con gai') || norm.includes('cho chi') || norm.includes('vay')) gender = 'nu';
    else if (norm.includes('do doi') || norm.includes('cap doi') || norm.includes('unisex')) gender = 'unisex';

    if (gender) this.context.targetGender = gender;

    // Ngân sách
    const { maxBudget } = extractBudget(raw);
    const budget = maxBudget || this.context.maxBudget;

    // Tìm Top + Bottom + Phụ kiện từ Database thực tế
    const all = productService.getAll().filter(isProductEligibleForPublicDisplay);

    const tops = all.filter(
      (p) =>
        ['ao-thun', 'so-mi-polo', 'hoodie-sweater', 'ao-khoac', 'ao-croptop-tank'].some((c) => p.categorySlug.includes(c)) &&
        (!gender || p.gender === gender || p.gender === 'unisex')
    );

    const bottoms = all.filter(
      (p) =>
        ['quan-jeans', 'quan-cargo-parachute', 'chan-vay', 'quan'].some((c) => p.categorySlug.includes(c)) &&
        (!gender || p.gender === gender || p.gender === 'unisex')
    );

    const accessories = all.filter((p) => p.categorySlug.includes('phu-kien'));

    const topItem = tops[0] || tops[1];
    const bottomItem = bottoms[0] || bottoms[1];
    const accItem = accessories[0];

    const outfitItems = [topItem, bottomItem, accItem].filter(Boolean);
    const totalSetPrice = outfitItems.reduce((s, it) => s + it.price, 0);

    if (outfitItems.length > 0) {
      this.context.activeProduct = outfitItems[0];
      this.context.lastSuggestedProducts = outfitItems;
    }

    let occasionText = 'đi chơi và dạo phố';
    if (norm.includes('di hoc')) occasionText = 'đi học giảng đường thanh lịch';
    else if (norm.includes('di tiec')) occasionText = 'dự tiệc nổi bật sang chảnh';
    else if (norm.includes('hen ho') || norm.includes('nguoi yeu')) occasionText = 'hẹn hò lãng mạn cùng người yêu';
    else if (norm.includes('do doi')) occasionText = 'đồ đôi đồng điệu cho hai bạn';

    let text =
      `Dạ em đã chọn set outfit chuẩn gu cho dịp **${occasionText}** từ các sản phẩm bán chạy nhất tại shop:\n\n` +
      `• **Áo**: ${topItem ? topItem.name : 'Áo thun basic'}\n` +
      `• **Quần/Váy**: ${bottomItem ? bottomItem.name : 'Quần ống rộng'}\n` +
      `• **Phụ kiện**: ${accItem ? accItem.name : 'Phụ kiện cá tính'}\n\n` +
      `• **Tổng giá trọn bộ**: **${formatPrice(totalSetPrice)}**`;

    if (budget) {
      if (totalSetPrice <= budget) {
        text += ` (Vừa vặn trong ngân sách ${formatPrice(budget)} của anh/chị ạ!).`;
      } else {
        text += ` (Hơi vượt nhẹ ngân sách ${formatPrice(budget)}, anh/chị có thể bỏ bớt phụ kiện hoặc đổi sang áo thun basic để tiết kiệm hơn nhé ạ).`;
      }
    }

    return {
      id: `msg_${Date.now()}`,
      sender: 'stylist',
      text,
      timestamp: this.getTimestamp(),
      recommendedProducts: outfitItems,
      quickReplies: ['Đổi sang mẫu áo khác', 'Tư vấn chọn size set này', 'Xem thêm mẫu quần'],
    };
  }

  private handleProductSearch(raw: string, norm: string): AIStylistMessage {
    // 0. Kiểm tra các mặt hàng ngoài danh mục thời trang của shop (Chống bịa sản phẩm Section XVI)
    const nonCatalogItems = [
      'giap sat', 'ao giap', 'trung co', 'ao cuoi', 'vay cuoi', 'do boi', 'bikini', 'noi y',
      'dien thoai', 'laptop', 'may tinh', 'xe may', 'oto', 'dong ho thuy si', 'kim cuong'
    ];
    if (nonCatalogItems.some((k) => norm.includes(k))) {
      return {
        id: `msg_${Date.now()}`,
        sender: 'stylist',
        text:
          'Dạ em đã tìm trong kho hàng nhưng hiện shop em chưa có các sản phẩm này ạ! ' +
          'SMARTBUY AI chuyên về các dòng thời trang Streetwear và Casual hiện đại như áo thun, sơ mi, hoodie, quần jeans và chân váy. ' +
          'Anh/chị có muốn em tư vấn những mẫu thiết kế thời trang đang có sẵn tại shop không ạ?',
        timestamp: this.getTimestamp(),
        quickReplies: ['Xem áo thun nam hot', 'Xem chân váy nữ hot', 'Tư vấn phối đồ đi chơi'],
      };
    }

    // 1. Phân tích giới tính
    let gender: 'nam' | 'nu' | 'unisex' | undefined = this.context.targetGender;
    if (norm.includes('nam') || norm.includes('con trai') || norm.includes('cho anh')) gender = 'nam';
    else if (norm.includes('nu') || norm.includes('con gai') || norm.includes('cho chi') || norm.includes('nang')) gender = 'nu';
    else if (norm.includes('unisex') || norm.includes('do doi')) gender = 'unisex';
    if (gender) this.context.targetGender = gender;

    // 2. Phân tích danh mục
    let categorySlug: string | undefined = undefined;
    if (norm.includes('hoodie')) categorySlug = 'ao-hoodie';
    else if (norm.includes('so mi') || norm.includes('polo')) categorySlug = 'so-mi-polo';
    else if (norm.includes('ao khoac') || norm.includes('khoac') || norm.includes('bomber') || norm.includes('jacket')) categorySlug = 'ao-khoac';
    else if (norm.includes('vay') || norm.includes('dam') || norm.includes('skirt')) {
      categorySlug = 'vay';
      gender = 'nu';
      this.context.targetGender = 'nu';
    }
    else if (norm.includes('baby tee') || norm.includes('croptop')) categorySlug = 'ao-croptop-tank';
    else if (norm.includes('jeans') || norm.includes('jean') || norm.includes('baggy')) categorySlug = 'quan-jeans';
    else if (norm.includes('cargo') || norm.includes('tui hop')) categorySlug = 'quan-cargo-parachute';
    else if (norm.includes('ao thun') || norm.includes('tee') || norm.includes('ao')) categorySlug = 'ao-thun';
    else if (norm.includes('quan')) categorySlug = 'quan-jeans';
    else if (norm.includes('phu kien') || norm.includes('non') || norm.includes('mu') || norm.includes('vong')) categorySlug = 'phu-kien';

    // 3. Phân tích ngân sách
    const { maxBudget, minBudget } = extractBudget(raw);
    if (maxBudget) {
      this.context.maxBudget = maxBudget;
    } else if (norm.includes('vay') || norm.includes('dam') || norm.includes('quan')) {
      // Khi chuyển sang danh mục lớn mới, không ép ngân sách cũ của danh mục trước
      this.context.maxBudget = undefined;
    }
    if (minBudget) this.context.minBudget = minBudget;

    // 4. Phân tích màu sắc
    const color = extractColor(raw);
    const colorSlugs = color ? [removeVietnameseTones(color.toLowerCase())] : undefined;

    // 5. Query sản phẩm thực tế từ Database thông qua productService
    let results = productService.getAll({
      gender,
      categorySlug,
      maxPrice: this.context.maxBudget,
      minPrice: this.context.minBudget,
      colors: colorSlugs,
    }).filter(isProductEligibleForPublicDisplay);

    // Fallback: nếu lọc quá hẹp dẫn tới 0 kết quả, nới lỏng ngân sách hoặc danh mục
    if (results.length === 0 && this.context.maxBudget) {
      results = productService.getAll({
        gender,
        categorySlug,
      }).filter(isProductEligibleForPublicDisplay);
    }

    if (results.length === 0) {
      // Thông báo rõ ràng không bịa sản phẩm
      return {
        id: `msg_${Date.now()}`,
        sender: 'stylist',
        text:
          'Dạ em đã tìm trong kho hàng nhưng hiện chưa có sản phẩm nào khớp hoàn toàn với các tiêu chí này ạ. ' +
          'Anh/chị có muốn em mở rộng mức giá hoặc gợi ý các mẫu thiết kế hot trend khác không ạ?',
        timestamp: this.getTimestamp(),
        quickReplies: ['Xem tất cả sản phẩm HOT', 'Tìm áo thun nam bán chạy', 'Tìm váy nữ thiết kế'],
      };
    }

    // Giới hạn 4 sản phẩm tiêu biểu
    const topMatches = results.slice(0, 4);
    this.context.activeProduct = topMatches[0];
    this.context.lastSuggestedProducts = topMatches;

    // Xây dựng câu trả lời thân thiện, lịch sự và đúng trọng tâm
    let criteriaDesc = '';
    if (categorySlug) criteriaDesc += (categorySlug.includes('ao') ? 'áo' : (categorySlug.includes('vay') || categorySlug === 'vay') ? 'váy' : 'quần');
    if (gender) criteriaDesc += ` ${gender === 'nam' ? 'Nam' : gender === 'nu' ? 'Nữ' : 'Unisex'}`;
    if (color) criteriaDesc += ` màu ${color}`;
    if (this.context.maxBudget) criteriaDesc += ` giá dưới ${formatPrice(this.context.maxBudget)}`;

    const leadText = criteriaDesc.trim()
      ? `Dạ em đã tìm thấy các mẫu **${criteriaDesc.trim()}** đẹp và chất lượng nhất từ kho hàng của shop ạ:`
      : 'Dạ em gợi ý một số mẫu thiết kế nổi bật được các bạn trẻ yêu thích nhất tại SMARTBUY AI ạ:';

    return {
      id: `msg_${Date.now()}`,
      sender: 'stylist',
      text: leadText,
      timestamp: this.getTimestamp(),
      recommendedProducts: topMatches,
      quickReplies: ['Mẫu này có màu khác không?', 'Cao 1m7 nặng 60kg mặc size gì?', 'Áo này phối quần gì đẹp?'],
    };
  }

  private getTimestamp(): string {
    return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
}

// Singleton Engine instance
export const fashionSalesAssistant = new FashionSalesAssistantEngine();
