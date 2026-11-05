package com.smartbuyai.service;

import com.smartbuyai.dto.*;
import com.smartbuyai.entity.*;
import com.smartbuyai.repository.OrderRepository;
import com.smartbuyai.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AiChatbotService {

    private static final Logger log = LoggerFactory.getLogger(AiChatbotService.class);

    private final ProductRepository productRepository;
    private final ProductService productService;
    private final OrderRepository orderRepository;
    private final OutfitBuilderService outfitBuilderService;
    private final LlmClientService llmClientService;

    // Quản lý ngữ cảnh theo Session (Context Memory)
    private final Map<String, SessionContext> sessions = new ConcurrentHashMap<>();

    public enum ChatIntent {
        ORDER_INQUIRY,
        STORE_POLICY,
        TRY_ON_REQUEST,
        OUT_OF_SCOPE,
        PURCHASE_INTENT,
        RESET_CONVERSATION,
        GREETING,
        STOCK_CHECK,
        PRODUCT_COMPARISON,
        FOLLOW_UP_ANSWER,
        OCCASION_CONSULTATION,
        OUTFIT_COORDINATION,
        SIZE_CONSULTATION,
        PRICE_OBJECTION_CHEAPER,
        COLOR_INQUIRY,
        SKIN_TONE_INQUIRY,
        MATERIAL_INQUIRY,
        BUDGET_UPDATE,
        STYLE_CONSULTATION,
        PRODUCT_SEARCH,
        GENERAL_QA
    }

    public static class SessionContext {
        public String sessionId;

        // Trạng thái hội thoại và chủ đề hiện tại
        public String currentTopic = "GENERAL"; // "OCCASION_PARTY", "OCCASION_WEDDING", "OCCASION_BIRTHDAY",
                                                // "OUTFIT_BUILDING", "CASUAL_WEAR", "SIZING"
        public String lastBotQuestionType; // "ASK_PARTY_TYPE", "ASK_ITEM_TYPE", "ASK_BUDGET", "ASK_STYLE",
                                           // "ASK_MEASUREMENTS"

        // Các thuộc tính người dùng đã xác nhận
        public String targetGender; // 'nam' | 'nu' | 'unisex'
        public String targetOccasion; // 'Dự tiệc' | 'Tiệc cưới' | 'Sinh nhật' | 'Đi học' | 'Đi chơi' | 'Hẹn hò' |
                                      // 'Công sở'
        public String targetStyle; // 'Lịch sự' | 'Streetwear' | 'Y2K' | 'Korean Casual' | 'Minimalist'
        public String targetCategory; // 'ao-so-mi' | 'ao-khoac' | 'vay' | 'quan-dai' | 'ao-polo' | 'ao-thun'
        public String targetColor; // 'Đen' | 'Trắng' | 'Be' | etc.
        public String targetSize; // 'S' | 'M' | 'L' | 'XL'
        public Long maxBudget;
        public Long minBudget;
        public Set<String> excludedCategories = new HashSet<>(); // Danh mục loại trừ (vd: "không thích sơ mi")

        // Thông tin vóc dáng (CHỈ dùng khi có ý định hỏi size hoặc chọn size, KHÔNG tự
        // động trigger)
        public Integer heightCm;
        public Integer weightKg;
        public String skinTone;

        // Ngữ cảnh sản phẩm gần nhất
        public ProductDto activeProduct;
        public List<ProductDto> lastRecommended = new ArrayList<>();
        public long lastAccessTime = System.currentTimeMillis();
    }

    public AiChatbotService(ProductRepository productRepository,
            ProductService productService,
            OrderRepository orderRepository,
            OutfitBuilderService outfitBuilderService,
            LlmClientService llmClientService) {
        this.productRepository = productRepository;
        this.productService = productService;
        this.orderRepository = orderRepository;
        this.outfitBuilderService = outfitBuilderService;
        this.llmClientService = llmClientService;
    }

    public SessionContext getOrCreateSession(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            sessionId = UUID.randomUUID().toString();
        }
        cleanupExpiredSessions();
        return sessions.computeIfAbsent(sessionId, k -> {
            SessionContext ctx = new SessionContext();
            ctx.sessionId = k;
            return ctx;
        });
    }

    public void resetSession(String sessionId) {
        if (sessionId != null) {
            sessions.remove(sessionId);
        }
    }

    private void cleanupExpiredSessions() {
        long now = System.currentTimeMillis();
        sessions.entrySet().removeIf(e -> (now - e.getValue().lastAccessTime) > 30 * 60 * 1000); // 30 phút
    }

    /**
     * Xử lý hội thoại tự nhiên đa lượt với ngữ cảnh, phân quyền và dữ liệu thực tế
     */
    public ChatResponse processChat(ChatRequest req, Authentication auth) {
        SessionContext ctx = getOrCreateSession(req.getSessionId());
        ctx.lastAccessTime = System.currentTimeMillis();

        String raw = req.getMessage() != null ? req.getMessage().trim() : "";
        if (raw.isEmpty()) {
            return new ChatResponse("Dạ anh/chị cần em hỗ trợ tìm kiếm hay phối đồ phong cách nào hôm nay ạ?",
                    Collections.emptyList(), List.of("Tìm áo thun nam", "Váy Y2K đi tiệc", "Outfit 500k"),
                    llmClientService.getActiveProviderName(), ctx.sessionId);
        }

        // Cập nhật active product nếu client truyền lên
        if (req.getActiveProductId() != null && !req.getActiveProductId().isBlank()) {
            productRepository.findById(req.getActiveProductId()).ifPresent(p -> {
                ctx.activeProduct = productService.mapToDto(p);
            });
        }

        String norm = removeTones(normalizeSlang(raw));

        // Phân loại ý định chính xác cho lượt hiện tại (Intent Classification)
        ChatIntent intent = classifyIntent(raw, norm, ctx);
        log.info("[AiChatbotService] Turn Intent: {}, Topic: {}, LastBotQ: {}", intent, ctx.currentTopic,
                ctx.lastBotQuestionType);

        // Trích xuất các thực thể cập nhật vào ngữ cảnh
        extractAndMergeContext(raw, norm, ctx, intent);

        // Định tuyến xử lý theo ý định
        switch (intent) {
            case ORDER_INQUIRY:
                return handleOrderQuery(auth, norm, ctx);

            case STORE_POLICY:
                return handleStorePolicy(norm, ctx);

            case TRY_ON_REQUEST:
                return handleTryOnRequest(ctx);

            case OUT_OF_SCOPE:
                return handleOutOfScopeItem(raw, ctx);

            case PURCHASE_INTENT:
                return handlePurchaseIntent(auth, ctx);

            case RESET_CONVERSATION:
                return handleResetConversation(ctx);

            case STOCK_CHECK:
                return handleStockCheck(raw, norm, ctx);

            case PRODUCT_COMPARISON:
                return handleProductComparison(ctx);

            case FOLLOW_UP_ANSWER:
                return handleFollowUpAnswer(raw, norm, ctx);

            case OCCASION_CONSULTATION:
                return handleOccasionConsultation(raw, norm, ctx);

            case OUTFIT_COORDINATION:
                return handleOutfitCoordination(raw, norm, ctx);

            case SIZE_CONSULTATION:
                return handleSizeConsultation(raw, norm, ctx);

            case PRICE_OBJECTION_CHEAPER:
                return handleCheaperOrSimilar(ctx);

            case COLOR_INQUIRY:
                return handleColorQuery(raw, norm, ctx);

            case MATERIAL_INQUIRY:
                return handleMaterialInquiry(raw, norm, ctx);

            case SKIN_TONE_INQUIRY:
                return handleSkinToneConsultation(norm, ctx);

            case BUDGET_UPDATE:
                return handleBudgetUpdate(raw, norm, ctx);

            case STYLE_CONSULTATION:
                return handleStyleConsultation(raw, norm, ctx);

            case GREETING:
                return handleGreeting(ctx);

            case PRODUCT_SEARCH:
            case GENERAL_QA:
            default:
                return handleProductSearch(raw, norm, req.getHistory(), ctx);
        }
    }

    // =========================================================================
    // 1. INTENT CLASSIFICATION & STATE MACHINE
    // =========================================================================

    public ChatIntent classifyIntent(String raw, String norm, SessionContext ctx) {
        // 1. Tra cứu đơn hàng
        if (isOrderQuery(norm))
            return ChatIntent.ORDER_INQUIRY;

        // 2. Chính sách cửa hàng
        if (isStorePolicy(norm))
            return ChatIntent.STORE_POLICY;

        // 3. Thử đồ AI
        if (isTryOnQuery(norm))
            return ChatIntent.TRY_ON_REQUEST;

        // 4. Sản phẩm ngoài danh mục (áo phao lông vũ âm 30 độ, bikini, vest cưới...)
        if (isOutOfScopeItem(norm))
            return ChatIntent.OUT_OF_SCOPE;

        // 5. Yêu cầu đặt hàng / thanh toán
        if (isPurchaseIntent(norm))
            return ChatIntent.PURCHASE_INTENT;

        // 6. Reset cuộc trò chuyện
        if (isResetQuery(norm))
            return ChatIntent.RESET_CONVERSATION;

        // 7. Hỏi tồn kho / size của sản phẩm cụ thể ("cái thứ hai còn size M không?",
        // "áo này còn hàng không?")
        if (isStockCheckQuery(norm))
            return ChatIntent.STOCK_CHECK;

        // 8. So sánh sản phẩm
        if (norm.contains("so sanh") || norm.contains("khac nhau"))
            return ChatIntent.PRODUCT_COMPARISON;

        // 9. Câu trả lời tiếp nối theo câu hỏi trước của bot (Follow-up)
        if (isFollowUpAnswer(raw, norm, ctx))
            return ChatIntent.FOLLOW_UP_ANSWER;

        // 10. Tư vấn trang phục theo dịp / sự kiện (Dự tiệc, đám cưới, sinh nhật, đi
        // học, đi chơi, đi date...)
        if (isOccasionQuery(norm))
            return ChatIntent.OCCASION_CONSULTATION;

        // 11. Tư vấn phối đồ (Outfit, combo, trọn bộ, phối áo này với quần gì)
        if (isOutfitCoordinationQuery(norm))
            return ChatIntent.OUTFIT_COORDINATION;

        // 12. Tư vấn size: CHỈ KÍCH HOẠT KHI TIN NHẮN HIỆN TẠI HỎI SIZE HOẶC CUNG CẤP
        // SỐ ĐO ĐỂ HỎI SIZE
        if (isSizeConsultationQuery(norm))
            return ChatIntent.SIZE_CONSULTATION;

        // 13. Phản hồi về giá / tìm mẫu rẻ hơn ("đắt quá", "tìm mẫu rẻ hơn", "giá cao
        // quá")
        if (isPriceTooHighOrSimilar(norm))
            return ChatIntent.PRICE_OBJECTION_CHEAPER;

        // 14. Hỏi tone da
        if (isSkinToneQuery(norm))
            return ChatIntent.SKIN_TONE_INQUIRY;

        // 15. Hỏi hoặc lọc màu sắc
        if (isColorQuery(norm))
            return ChatIntent.COLOR_INQUIRY;

        // 15.5. Hỏi về chất liệu vải
        if (isMaterialQuery(norm))
            return ChatIntent.MATERIAL_INQUIRY;

        // 16. Cập nhật ngân sách độc lập ("tầm 400k", "khoảng 700k", "ngân sách 500k")
        if (isStandaloneBudgetQuery(norm))
            return ChatIntent.BUDGET_UPDATE;

        // 17. Chào hỏi đơn thuần (ngắn gọn dưới 25 ký tự)
        if (isGreeting(norm) && norm.length() <= 25)
            return ChatIntent.GREETING;

        // 18. Tư vấn phong cách ("phong cách streetwear là gì", "tư vấn phong cách
        // Y2K")
        if (isStyleQuery(norm))
            return ChatIntent.STYLE_CONSULTATION;

        // Mặc định: Tìm kiếm sản phẩm trong database
        return ChatIntent.PRODUCT_SEARCH;
    }

    private boolean isFollowUpAnswer(String raw, String norm, SessionContext ctx) {
        if (isOutfitCoordinationQuery(norm) || isOccasionQuery(norm) || isSizeConsultationQuery(norm)
                || isStockCheckQuery(norm) || isMaterialQuery(norm) || isStorePolicy(norm) || isOrderQuery(norm)) {
            return false;
        }

        if (ctx.lastBotQuestionType == null) {
            // Nhận diện phản hồi phủ định: "không thích sơ mi", "cho tôi kiểu khác", "đổi
            // kiểu khác"
            return norm.contains("khong thich") || norm.contains("k thich") || norm.contains("kieu khac")
                    || norm.contains("mau khac");
        }

        switch (ctx.lastBotQuestionType) {
            case "ASK_PARTY_TYPE":
                return norm.contains("tiec cuoi") || norm.contains("dam cuoi") || norm.contains("sinh nhat")
                        || norm.contains("cong ty") || norm.contains("party") || norm.contains("ban toi")
                        || norm.contains("su kien")
                        || norm.contains("nam") || norm.contains("nu") || norm.contains("cho nam")
                        || norm.contains("cho nu");
            case "ASK_ITEM_TYPE":
                return norm.contains("blazer") || norm.contains("so mi") || norm.contains("polo")
                        || norm.contains("khoac") || norm.contains("dam") || norm.contains("vay")
                        || norm.contains("ca bo") || norm.contains("tron bo");
            case "ASK_BUDGET":
                return extractBudgetNumber(norm) != null || norm.contains("tam") || norm.contains("khoang")
                        || norm.contains("duoi");
            default:
                return false;
        }
    }

    private boolean isOccasionQuery(String norm) {
        return norm.contains("du tiec") || norm.contains("di tiec") || norm.contains("tiec cuoi")
                || norm.contains("dam cuoi")
                || norm.contains("sinh nhat") || norm.contains("di date") || norm.contains("hen ho")
                || norm.contains("di choi")
                || norm.contains("di hoc") || norm.contains("cong so") || norm.contains("di lam")
                || norm.contains("phong van")
                || norm.contains("chup anh") || norm.contains("song ao") || norm.contains("prom")
                || norm.contains("party")
                || norm.contains("do di tiec") || norm.contains("do di choi") || norm.contains("do di hoc");
    }

    private boolean isOutfitCoordinationQuery(String norm) {
        return norm.contains("phoi do") || norm.contains("set do") || norm.contains("outfit") || norm.contains("combo")
                || norm.contains("tron bo") || norm.contains("ca bo") || norm.contains("nguyen bo")
                || norm.contains("tron set")
                || norm.contains("phoi voi quan gi") || norm.contains("phoi ao gi")
                || norm.contains("mac voi quan gi") || norm.contains("mac voi ao gi") || norm.contains("mix do")
                || norm.contains("phoi gi dep");
    }

    private boolean isMaterialQuery(String norm) {
        return norm.contains("chat lieu") || norm.contains("vai gi") || norm.contains("chat vai")
                || norm.contains("vai nhu the nao");
    }

    private boolean isSizeConsultationQuery(String norm) {
        // Chỉ kích hoạt khi tin nhắn hiện tại thực sự hỏi về size
        boolean mentionsSize = norm.contains("size gi") || norm.contains("co nao") || norm.contains("vua size nao")
                || norm.contains("chon size") || norm.contains("tu van size") || norm.contains("bang size");
        boolean mentionsHeightWeightToFit = (norm.contains("cao") && norm.contains("nang"))
                && (norm.contains("size") || norm.contains("vua") || norm.contains("mac"));
        return (mentionsSize || mentionsHeightWeightToFit) && !isStockCheckQuery(norm);
    }

    private boolean isStockCheckQuery(String norm) {
        boolean hasStockTerm = norm.contains("con size") || norm.contains("co size") || norm.contains("het size")
                || norm.contains("con hang") || norm.contains("con ko") || norm.contains("con khong");
        boolean hasReferencedItem = norm.contains("cai thu") || norm.contains("chiec thu") || norm.contains("mau thu")
                || norm.contains("cai dau") || norm.contains("chiec dau") || norm.contains("cai nay")
                || norm.contains("ao nay")
                || norm.contains("quan nay") || norm.contains("mau nay");
        return hasStockTerm && (hasReferencedItem || norm.contains("size"));
    }

    private boolean isStandaloneBudgetQuery(String norm) {
        Long b = extractBudgetNumber(norm);
        return b != null && norm.length() <= 35 && !isOutfitCoordinationQuery(norm);
    }

    private boolean isResetQuery(String norm) {
        return norm.contains("tu van tu dau") || norm.contains("tu dau") || norm.contains("reset")
                || norm.contains("lam moi") || norm.contains("bat dau lai") || norm.contains("tro chuyen moi");
    }

    private boolean isStyleQuery(String norm) {
        return norm.contains("phong cach gi") || norm.contains("streetwear la gi") || norm.contains("y2k la gi")
                || norm.contains("korean casual la gi") || norm.contains("tu van phong cach");
    }

    private boolean isTryOnQuery(String norm) {
        return norm.contains("thu do the nao") || norm.contains("huong dan thu do") || norm.contains("thu do ai")
                || norm.contains("virtual try on") || norm.contains("phong thu do");
    }

    // =========================================================================
    // 2. OCCASION & PARTY CONSULTATION (FIX LỖI SAI TRỌNG TÂM)
    // =========================================================================

    private ChatResponse handleOccasionConsultation(String raw, String norm, SessionContext ctx) {
        // Cập nhật chủ đề
        ctx.currentTopic = "OCCASION_PARTY";

        // Nhận diện loại dịp cụ thể
        if (norm.contains("tiec cuoi") || norm.contains("dam cuoi")) {
            ctx.targetOccasion = "Tiệc cưới";
            ctx.targetStyle = "Lịch sự";
            ctx.lastBotQuestionType = "ASK_ITEM_TYPE";

            List<ProductEntity> weddingItems = findOccasionProducts(ctx,
                    List.of("ao-so-mi", "ao-polo", "ao-khoac", "vay", "quan-dai"));
            List<ProductDto> dtos = weddingItems.stream().map(productService::mapToDto).collect(Collectors.toList());
            ctx.lastRecommended = dtos;
            if (!dtos.isEmpty())
                ctx.activeProduct = dtos.get(0);

            String reply = "Dạ với dịp **tiệc cưới**, mình gợi ý bạn chọn phong cách lịch sự, chỉn chu nhưng vẫn trẻ trung và thoải mái khi di chuyển chụp ảnh.\n\n"
                    +
                    "• Bạn có thể chọn một chiếc áo sơ mi hoặc áo khoác blazer thanh lịch phối cùng quần âu ống suông tôn dáng.\n"
                    +
                    "• Nếu là đồ nữ, các mẫu đầm ren hoặc váy dạ hội nhã nhặn sẽ rất cuốn hút.\n\n" +
                    "Bạn muốn mặc áo sơ mi thanh lịch hay khoác thêm blazer/áo khoác sang trọng ạ?";

            return new ChatResponse(reply, dtos,
                    List.of("Blazer đi", "Sơ mi nhé", "Đầm dự tiệc nữ", "Tầm 700k"),
                    llmClientService.getActiveProviderName(), ctx.sessionId);
        }

        if (norm.contains("sinh nhat") || norm.contains("party")) {
            ctx.targetOccasion = "Sinh nhật";
            ctx.targetStyle = "Trẻ trung, Y2K";
            ctx.lastBotQuestionType = "ASK_ITEM_TYPE";

            List<ProductEntity> bdayItems = findOccasionProducts(ctx,
                    List.of("ao-polo", "ao-thun", "vay", "ao-croptop", "quan-dai"));
            List<ProductDto> dtos = bdayItems.stream().map(productService::mapToDto).collect(Collectors.toList());
            ctx.lastRecommended = dtos;
            if (!dtos.isEmpty())
                ctx.activeProduct = dtos.get(0);

            String reply = "Dạ đi **tiệc sinh nhật cùng bạn bè** thì phong cách trẻ trung, hiện đại và năng động sẽ giúp bạn cực kỳ tỏa sáng!\n\n"
                    +
                    "• Bạn có thể diện áo polo bo dệt hoặc áo thun graphic chất lượng phối quần ống rộng phóng khoáng.\n"
                    +
                    "• Với bạn nữ, một chiếc đầm baby tee hoặc chân váy Y2K kết hợp phụ kiện bạc sẽ rất 'cháy' phố.\n\n"
                    +
                    "Bạn thích phong cách cá tính hay tối giản nhẹ nhàng để mình tìm mẫu chuẩn nhất nhé?";

            return new ChatResponse(reply, dtos,
                    List.of("Phong cách cá tính Y2K", "Set đồ tối giản", "Đầm váy sinh nhật", "Tầm 500k"),
                    llmClientService.getActiveProviderName(), ctx.sessionId);
        }

        if (norm.contains("di date") || norm.contains("hen ho") || norm.contains("crush")) {
            ctx.targetOccasion = "Hẹn hò";
            ctx.targetStyle = "Korean Casual";
            ctx.lastBotQuestionType = "ASK_ITEM_TYPE";

            List<ProductEntity> dateItems = findOccasionProducts(ctx,
                    List.of("ao-polo", "ao-so-mi", "ao-cardigan", "vay"));
            List<ProductDto> dtos = dateItems.stream().map(productService::mapToDto).collect(Collectors.toList());
            ctx.lastRecommended = dtos;
            if (!dtos.isEmpty())
                ctx.activeProduct = dtos.get(0);

            String reply = "Dạ đi **hẹn hò cùng crush hoặc người yêu**, phong cách Korean Casual nhẹ nhàng, tinh tế và ấm áp sẽ ghi điểm tuyệt đối trong mắt đối phương ạ!\n\n"
                    +
                    "• Nam: Áo polo phối quần tây suông hoặc cardigan khoác nhẹ.\n" +
                    "• Nữ: Váy đầm nữ tính phối cardigan hoặc áo dệt kim mềm mại.\n\n" +
                    "Bạn dự kiến buổi hẹn tại quán cafe ấm cúng hay nhà hàng lãng mạn ạ?";

            return new ChatResponse(reply, dtos,
                    List.of("Cafe nhẹ nhàng", "Nhà hàng lãng mạn", "Set đồ Hàn Quốc", "Dưới 400k"),
                    llmClientService.getActiveProviderName(), ctx.sessionId);
        }

        if (norm.contains("di hoc") || norm.contains("cap 3") || norm.contains("sinh vien")
                || norm.contains("hoc sinh")) {
            ctx.targetOccasion = "Đi học";
            ctx.targetStyle = "Năng động";
            ctx.lastBotQuestionType = "ASK_ITEM_TYPE";

            List<ProductEntity> schoolItems = findOccasionProducts(ctx,
                    List.of("ao-thun", "ao-polo", "quan-dai", "ao-khoac"));
            List<ProductDto> dtos = schoolItems.stream().map(productService::mapToDto).collect(Collectors.toList());
            ctx.lastRecommended = dtos;
            if (!dtos.isEmpty())
                ctx.activeProduct = dtos.get(0);

            String reply = "Dạ với đồ đi học hoặc đến trường cấp 3 đơn giản, năng động, chuẩn gu học sinh sinh viên nhất là áo polo bo dệt hoặc áo thun basic phối cùng quần jean / quần suông tôn dáng và mang lại cảm giác thoải mái suốt cả ngày học tập.\n\n"
                    +
                    "Bạn thích áo polo có cổ chỉn chu hay áo thun cổ tròn trẻ trung phóng khoáng hơn ạ?";

            return new ChatResponse(reply, dtos,
                    List.of("Áo polo đi học", "Áo thun năng động", "Quần suông đi học", "Tầm 300k"),
                    llmClientService.getActiveProviderName(), ctx.sessionId);
        }

        if (norm.contains("di choi") || norm.contains("dao pho") || norm.contains("cuoi tuan")
                || norm.contains("cafe")) {
            ctx.targetOccasion = "Đi chơi";
            ctx.targetStyle = "Streetwear";
            ctx.lastBotQuestionType = "ASK_ITEM_TYPE";

            List<ProductEntity> outingItems = findOccasionProducts(ctx,
                    List.of("ao-thun", "ao-croptop", "quan-short", "quan-dai", "do-bo"));
            List<ProductDto> dtos = outingItems.stream().map(productService::mapToDto).collect(Collectors.toList());
            ctx.lastRecommended = dtos;
            if (!dtos.isEmpty())
                ctx.activeProduct = dtos.get(0);

            String reply = "Dạ với trang phục đi chơi cuối tuần cùng bạn bè, phong cách streetwear hoặc casual thoải mái, năng động là lựa chọn hoàn hảo nhất!\n\n"
                    +
                    "• Bạn có thể chọn một set áo thun phối quần short/quần dù cá tính.\n" +
                    "• Hoặc một set đồ bộ thời trang, vừa gọn gàng vừa thời thượng.\n\n" +
                    "Bạn muốn phối cả bộ outfit đi chơi hoàn chỉnh hay chọn áo trước ạ?";

            return new ChatResponse(reply, dtos,
                    List.of("Phối cả bộ đồ đi chơi", "Áo thun đi chơi", "Set đồ bộ năng động", "Tầm 500k"),
                    llmClientService.getActiveProviderName(), ctx.sessionId);
        }

        // TỔNG QUÁT: "Tôi muốn đồ đi dự tiệc"
        ctx.targetOccasion = "Dự tiệc";
        ctx.lastBotQuestionType = "ASK_PARTY_TYPE";

        List<ProductEntity> partyItems = findOccasionProducts(ctx,
                List.of("ao-so-mi", "ao-khoac", "vay", "ao-polo", "quan-dai"));
        List<ProductDto> dtos = partyItems.stream().map(productService::mapToDto).collect(Collectors.toList());
        ctx.lastRecommended = dtos;
        if (!dtos.isEmpty())
            ctx.activeProduct = dtos.get(0);

        String generalPartyReply = "Được chứ ạ! Nếu bạn đang tìm đồ đi dự tiệc, mình có thể gợi ý phong cách lịch sự hoặc trẻ trung, hiện đại.\n\n"
                +
                "Chẳng hạn:\n" +
                "• Bạn có thể cân nhắc sơ mi kết hợp quần tây hoặc blazer phối cùng quần ống suông để tạo vẻ ngoài đĩnh đạc, sang trọng.\n"
                +
                "• Nếu là đồ nữ, các mẫu đầm dạ hội/váy ren thanh lịch hoặc đầm corset Y2K sẽ giúp bạn nổi bật trong mọi bữa tiệc.\n\n"
                +
                "Bạn chuẩn bị đi tiệc cưới, sinh nhật hay tiệc công ty? Bạn thích phong cách lịch sự hay trẻ trung để mình gợi ý set đồ chuẩn gu nhất nhé!";

        return new ChatResponse(generalPartyReply, dtos,
                List.of("Tiệc cưới bạn tôi", "Tiệc sinh nhật cùng bạn bè", "Tiệc công ty trang trọng", "Đầm dạ hội nữ",
                        "Set sơ mi + quần âu nam"),
                llmClientService.getActiveProviderName(), ctx.sessionId);
    }

    private List<ProductEntity> findOccasionProducts(SessionContext ctx, List<String> preferredCategories) {
        List<ProductEntity> candidates = new ArrayList<>();
        PageRequest page = PageRequest.of(0, 4);

        for (String cat : preferredCategories) {
            if (ctx.excludedCategories.contains(cat))
                continue;
            List<ProductEntity> res = productRepository.searchProducts(
                    ctx.targetGender, cat, null, ctx.minBudget, ctx.maxBudget, page).getContent();
            candidates.addAll(res);
            if (candidates.size() >= 4)
                break;
        }

        if (candidates.isEmpty()) {
            candidates = productRepository.findTop8ByIsActiveTrueAndIsBestSellerTrueOrderByRatingDesc().stream()
                    .filter(p -> !ctx.excludedCategories.contains(p.getCategorySlug()))
                    .limit(3)
                    .collect(Collectors.toList());
        }

        return candidates.stream().distinct().limit(4).collect(Collectors.toList());
    }

    // =========================================================================
    // 3. FOLLOW-UP ANSWERS & MULTI-TURN CONVERSATION MANAGER
    // =========================================================================

    private ChatResponse handleFollowUpAnswer(String raw, String norm, SessionContext ctx) {
        // Xử lý phản hồi phủ định: "Không thích sơ mi", "Cho tôi kiểu khác"
        if (norm.contains("khong thich so mi") || norm.contains("k thich so mi")) {
            ctx.excludedCategories.add("ao-so-mi");
            List<ProductEntity> alternatives = findOccasionProducts(ctx,
                    List.of("ao-polo", "ao-khoac", "ao-len", "quan-dai"));
            List<ProductDto> dtos = alternatives.stream().map(productService::mapToDto).collect(Collectors.toList());
            ctx.lastRecommended = dtos;
            if (!dtos.isEmpty())
                ctx.activeProduct = dtos.get(0);

            String reply = "Dạ mình đã ghi nhận bạn không thích sơ mi rồi ạ! Thay vào đó, mình gợi ý các mẫu áo polo bo dệt cổ điển hoặc áo khoác blazer/cardigan thanh lịch trẻ trung này nhé:\n"
                    +
                    "Các mẫu này vẫn giữ trọn nét lịch sự chuẩn dự tiệc mà lại mang cảm giác thoải mái hơn rất nhiều ạ.";

            return new ChatResponse(reply, dtos,
                    List.of("Áo polo thanh lịch", "Áo khoác blazer", "Quần ống suông", "Tầm 500k"),
                    llmClientService.getActiveProviderName(), ctx.sessionId);
        }

        if (norm.contains("cho toi kieu khac") || norm.contains("kieu khac") || norm.contains("mau khac")) {
            List<ProductEntity> rotated = productRepository.findTop8ByIsActiveTrueAndIsNewDropTrueOrderByPriceAsc()
                    .stream()
                    .filter(p -> !ctx.excludedCategories.contains(p.getCategorySlug()))
                    .limit(3)
                    .collect(Collectors.toList());
            List<ProductDto> dtos = rotated.stream().map(productService::mapToDto).collect(Collectors.toList());
            ctx.lastRecommended = dtos;
            if (!dtos.isEmpty())
                ctx.activeProduct = dtos.get(0);

            return new ChatResponse(
                    "Dạ đây là các thiết kế phong cách mới về khác biệt tại shop để bạn đổi mới gu ăn mặc đây ạ:",
                    dtos, List.of("Phối cả bộ đồ", "Xem chi tiết mẫu 1", "Tư vấn chọn size"),
                    llmClientService.getActiveProviderName(), ctx.sessionId);
        }

        // Theo dõi câu hỏi trước đó của bot
        if ("ASK_PARTY_TYPE".equals(ctx.lastBotQuestionType)) {
            if (norm.contains("nam")) {
                ctx.targetGender = "nam";
                ctx.lastBotQuestionType = "ASK_ITEM_TYPE";
                List<ProductEntity> maleParty = findOccasionProducts(ctx,
                        List.of("ao-so-mi", "ao-khoac", "ao-polo", "quan-dai"));
                List<ProductDto> dtos = maleParty.stream().map(productService::mapToDto).collect(Collectors.toList());
                ctx.lastRecommended = dtos;
                if (!dtos.isEmpty())
                    ctx.activeProduct = dtos.get(0);

                String reply = "Dạ với đồ đi tiệc cho nam, phong cách lịch lãm, chỉn chu và tôn dáng nhất là kết hợp áo sơ mi cao cấp hoặc áo polo dệt kim cùng quần âu/quần tây ống suông.\n\n"
                        +
                        "Bạn thích phong cách sơ mi lịch thiệp hay phối thêm blazer/áo khoác nam tính ạ?";

                return new ChatResponse(reply, dtos,
                        List.of("Áo sơ mi nam đi tiệc", "Blazer nam lịch lãm", "Quần âu ống suông", "Tầm 500k"),
                        llmClientService.getActiveProviderName(), ctx.sessionId);
            }

            if (norm.contains("nu")) {
                ctx.targetGender = "nu";
                ctx.lastBotQuestionType = "ASK_ITEM_TYPE";
                List<ProductEntity> femaleParty = findOccasionProducts(ctx, List.of("dam-vay", "vay", "ao-khoac"));
                List<ProductDto> dtos = femaleParty.stream().map(productService::mapToDto).collect(Collectors.toList());
                ctx.lastRecommended = dtos;
                if (!dtos.isEmpty())
                    ctx.activeProduct = dtos.get(0);

                String reply = "Dạ với đồ đi tiệc cho nữ, các mẫu đầm thiết kế thanh lịch, váy xếp ly hoặc đầm cúp ngực sang trọng sẽ giúp bạn thu hút mọi ánh nhìn!\n\n"
                        +
                        "Bạn thích mẫu đầm dạ hội dài quyến rũ hay váy chữ A trẻ trung, hiện đại ạ?";

                return new ChatResponse(reply, dtos,
                        List.of("Đầm dạ hội sang trọng", "Váy chữ A trẻ trung", "Chân váy phối áo kiểu", "Dưới 600k"),
                        llmClientService.getActiveProviderName(), ctx.sessionId);
            }

            if (norm.contains("tiec cuoi") || norm.contains("dam cuoi") || norm.contains("ban toi")) {
                ctx.targetOccasion = "Tiệc cưới";
                ctx.targetStyle = "Lịch sự";
                ctx.lastBotQuestionType = "ASK_ITEM_TYPE";

                List<ProductEntity> weddingItems = findOccasionProducts(ctx,
                        List.of("ao-so-mi", "ao-khoac", "vay", "ao-polo", "quan-dai"));
                List<ProductDto> dtos = weddingItems.stream().map(productService::mapToDto)
                        .collect(Collectors.toList());
                ctx.lastRecommended = dtos;
                if (!dtos.isEmpty())
                    ctx.activeProduct = dtos.get(0);

                String reply = "Với tiệc cưới bạn bè, mình gợi ý phong cách lịch sự nhưng vẫn thoải mái và trẻ trung khi di chuyển hay chụp ảnh.\n\n"
                        +
                        "Bạn muốn mặc áo sơ mi thanh lịch hay khoác thêm blazer/áo khoác có gu ạ?";

                return new ChatResponse(reply, dtos,
                        List.of("Blazer đi", "Sơ mi nhé", "Gợi ý cả bộ", "Tầm 700k"),
                        llmClientService.getActiveProviderName(), ctx.sessionId);
            }
        }

        if ("ASK_ITEM_TYPE".equals(ctx.lastBotQuestionType)) {
            if (norm.contains("blazer") || norm.contains("khoac")) {
                ctx.targetCategory = "ao-khoac";
                ctx.lastBotQuestionType = "ASK_BUDGET";

                List<ProductEntity> blazers = findOccasionProducts(ctx, List.of("ao-khoac"));
                List<ProductDto> dtos = blazers.stream().map(productService::mapToDto).collect(Collectors.toList());
                ctx.lastRecommended = dtos;
                if (!dtos.isEmpty())
                    ctx.activeProduct = dtos.get(0);

                String reply = "Được nhé! Mình sẽ ưu tiên tìm các mẫu blazer và áo khoác thanh lịch trong cửa hàng cho bạn. Bạn dự kiến ngân sách chi khoảng bao nhiêu ạ?";
                return new ChatResponse(reply, dtos,
                        List.of("Khoảng 700k", "Dưới 500k", "Tầm 1 triệu", "Xem mẫu đẹp nhất"),
                        llmClientService.getActiveProviderName(), ctx.sessionId);
            }

            if (norm.contains("so mi")) {
                ctx.targetCategory = "ao-so-mi";
                ctx.lastBotQuestionType = "ASK_BUDGET";

                List<ProductEntity> somis = findOccasionProducts(ctx, List.of("ao-so-mi"));
                List<ProductDto> dtos = somis.stream().map(productService::mapToDto).collect(Collectors.toList());
                ctx.lastRecommended = dtos;
                if (!dtos.isEmpty())
                    ctx.activeProduct = dtos.get(0);

                String reply = "Sơ mi thanh lịch là lựa chọn kinh điển chuẩn tiệc cưới! Bạn dự kiến ngân sách chi khoảng bao nhiêu (ví dụ: tầm 300k, 500k) để mình lọc mẫu ưng ý nhất nhé?";
                return new ChatResponse(reply, dtos,
                        List.of("Tầm 300k", "Tầm 500k", "Sơ mi kẻ sọc", "Sơ mi trơn"),
                        llmClientService.getActiveProviderName(), ctx.sessionId);
            }
        }

        if ("ASK_BUDGET".equals(ctx.lastBotQuestionType)) {
            Long budget = extractBudgetNumber(norm);
            if (budget != null) {
                ctx.maxBudget = budget;
                ctx.lastBotQuestionType = null;
                return handleProductSearch(raw, norm, Collections.emptyList(), ctx);
            }
        }

        // Mặc định chuyển sang tìm kiếm sản phẩm theo ngữ cảnh tích lũy
        return handleProductSearch(raw, norm, Collections.emptyList(), ctx);
    }

    // =========================================================================
    // 4. SIZE CONSULTATION (CHỈ KÍCH HOẠT KHI HỎI SIZE)
    // =========================================================================

    private ChatResponse handleSizeConsultation(String raw, String norm, SessionContext ctx) {
        int height = ctx.heightCm != null ? ctx.heightCm : 170;
        int weight = ctx.weightKg != null ? ctx.weightKg : 65;

        String advisedSize = calculateSize(height, weight);
        boolean isBoxy = norm.contains("rong") || norm.contains("oversize") || norm.contains("thoai mai");
        if (isBoxy && !"XXL".equals(advisedSize)) {
            advisedSize = getNextSize(advisedSize);
        }

        String advice = String.format(
                "Dạ với số đo chiều cao khoảng %dcm và cân nặng %dkg:\n" +
                        "• Size phù hợp nhất với anh/chị là: **Size %s**.\n" +
                        "• %s\n" +
                        "⚠️ *Lưu ý: Bảng size mang tính đối chiếu chuẩn phom tại shop. SMARTBUY AI hỗ trợ đổi size miễn phí trong 7 ngày nên bạn hoàn toàn yên tâm thử đồ nhé!*",
                height, weight, advisedSize,
                isBoxy ? "Vì mình thích mặc phom rộng rãi thoải mái nên em đã chủ động gợi ý tăng 1 size để lên dáng đẹp nhất ạ."
                        : "Phom mặc vừa vặn, tôn dáng tự nhiên và không bị gò bó.");

        List<ProductDto> showProducts = ctx.activeProduct != null ? List.of(ctx.activeProduct) : ctx.lastRecommended;
        return new ChatResponse(advice, showProducts,
                List.of("Xem các mẫu có size " + advisedSize, "Thích mặc form rộng", "Xem bảng size chi tiết",
                        "Tư vấn đồ đi tiệc"),
                llmClientService.getActiveProviderName(), ctx.sessionId);
    }

    private String calculateSize(int height, int weight) {
        if (height < 160 && weight < 50)
            return "S";
        if (height <= 168 && weight <= 58)
            return "M";
        if (height <= 175 && weight <= 68)
            return "L";
        if (height <= 182 && weight <= 78)
            return "XL";
        return "XXL";
    }

    private String getNextSize(String s) {
        switch (s) {
            case "S":
                return "M";
            case "M":
                return "L";
            case "L":
                return "XL";
            case "XL":
                return "XXL";
            default:
                return s;
        }
    }

    // =========================================================================
    // 5. STOCK & VARIANT CHECK ("Cái thứ hai còn size M không?")
    // =========================================================================

    private ChatResponse handleStockCheck(String raw, String norm, SessionContext ctx) {
        int refIndex = extractReferencedIndex(norm);
        ProductDto target = null;
        if (refIndex >= 0 && refIndex < ctx.lastRecommended.size()) {
            target = ctx.lastRecommended.get(refIndex);
            ctx.activeProduct = target;
        } else if (ctx.activeProduct != null) {
            target = ctx.activeProduct;
        } else if (!ctx.lastRecommended.isEmpty()) {
            target = ctx.lastRecommended.get(0);
        }

        if (target == null) {
            return new ChatResponse(
                    "Dạ bạn đang muốn kiểm tra size hay màu của sản phẩm nào ạ? Bạn gửi tên hoặc chọn sản phẩm bên dưới để mình tra cứu tồn kho nhé!",
                    Collections.emptyList(), List.of("Áo sơ mi nam", "Áo khoác blazer", "Đầm dạ hội"),
                    llmClientService.getActiveProviderName(), ctx.sessionId);
        }

        String requestedSize = extractSize(raw);
        List<String> availableSizes = target.getSizes() != null ? target.getSizes() : List.of("S", "M", "L", "XL");

        if (requestedSize != null) {
            boolean hasSize = availableSizes.stream().anyMatch(s -> s.equalsIgnoreCase(requestedSize));
            if (hasSize) {
                return new ChatResponse(String.format("Dạ sản phẩm '%s' hiện CÒN size %s hàng sẵn tại kho ạ! " +
                        "Phom dáng chuẩn đẹp, bạn có thể nhấn Thử đồ AI để xem ngay hình ảnh mặc lên người hoặc thêm vào giỏ nhé.",
                        target.getName(), requestedSize.toUpperCase()),
                        List.of(target),
                        List.of("Thử đồ AI áo này", "Thêm vào giỏ hàng", "Xem màu khác", "Áo này phối quần gì đẹp?"),
                        llmClientService.getActiveProviderName(), ctx.sessionId);
            } else {
                return new ChatResponse(String.format(
                        "Dạ mẫu '%s' hiện tạm HẾT size %s rồi ạ. Hiện shop chỉ còn các size: %s. " +
                                "Bạn có muốn mình tìm mẫu tương tự còn size %s cho mình không?",
                        target.getName(), requestedSize.toUpperCase(), String.join(", ", availableSizes),
                        requestedSize.toUpperCase()),
                        List.of(target),
                        List.of("Tìm mẫu tương tự có size " + requestedSize.toUpperCase(), "Xem bảng size chi tiết"),
                        llmClientService.getActiveProviderName(), ctx.sessionId);
            }
        }

        return new ChatResponse(String.format(
                "Dạ mẫu '%s' hiện có sẵn các size: %s. Bạn cho mình xin chiều cao và cân nặng để mình đối chiếu chọn size chuẩn nhất nhé!",
                target.getName(), String.join(", ", availableSizes)),
                List.of(target), List.of("Cao 1m70 nặng 65kg", "Cao 1m60 nặng 48kg", "Thích mặc form rộng"),
                llmClientService.getActiveProviderName(), ctx.sessionId);
    }

    // =========================================================================
    // 6. OUTFIT COORDINATION & SMART OUTFIT BUILDER
    // =========================================================================

    private ChatResponse handleOutfitCoordination(String raw, String norm, SessionContext ctx) {
        // Phối đồ với sản phẩm đang quan tâm
        if (norm.contains("phoi voi quan gi") || norm.contains("mac voi quan gi") || norm.contains("phoi gi dep")) {
            return handlePairingWithActive(ctx);
        }

        // Xây dựng trọn bộ outfit theo ngân sách
        Long budget = (ctx.maxBudget != null && ctx.maxBudget >= 250000L) ? ctx.maxBudget : 600000L;
        String gender = ctx.targetGender != null ? ctx.targetGender : "nam";
        String style = ctx.targetStyle != null ? ctx.targetStyle : "Streetwear";
        String occasion = ctx.targetOccasion != null ? ctx.targetOccasion : "Đi chơi";

        OutfitBreakdownDto outfit = outfitBuilderService.buildSmartOutfit(gender, style, occasion, budget, null);

        List<ProductDto> prods = new ArrayList<>();
        if (outfit.getTop() != null)
            prods.add(outfit.getTop());
        if (outfit.getBottom() != null)
            prods.add(outfit.getBottom());
        if (outfit.getAccessory() != null)
            prods.add(outfit.getAccessory());

        ctx.lastRecommended = prods;
        if (!prods.isEmpty())
            ctx.activeProduct = prods.get(0);

        String replyText = String.format(
                "🔥 Em đã xây dựng xong trọn bộ OUTFIT %s dành cho dịp %s theo đúng ngân sách của bạn!\n\n%s",
                style.toUpperCase(), occasion, outfit.getStylingRationale());

        ChatResponse response = new ChatResponse(replyText, prods,
                List.of("Thử outfit này bằng AI", "Đổi sang mẫu quần khác", "Còn size khác không?",
                        "Thêm cả bộ vào giỏ"),
                llmClientService.getActiveProviderName(), ctx.sessionId);
        response.setOutfitBreakdown(outfit);
        return response;
    }

    private ChatResponse handlePairingWithActive(SessionContext ctx) {
        ProductDto active = ctx.activeProduct;
        if (active == null && !ctx.lastRecommended.isEmpty()) {
            active = ctx.lastRecommended.get(0);
        }
        if (active == null) {
            List<ProductEntity> fallback = productRepository
                    .searchProducts(ctx.targetGender, "ao-polo", null, null, null, PageRequest.of(0, 1)).getContent();
            if (!fallback.isEmpty()) {
                active = productService.mapToDto(fallback.get(0));
            }
        }

        if (active == null) {
            String advice = "Dạ với áo polo thời trang, bạn có thể dễ dàng phối cùng:\n" +
                    "• Quần tây ống suông hoặc quần âu cho phong cách Smart Casual thanh lịch.\n" +
                    "• Quần jeans ống đứng hoặc quần short cho phong cách năng động cuối tuần.\n" +
                    "Dưới đây là một số mẫu quần phối chuẩn gu nhất từ cửa hàng:";
            List<ProductEntity> pants = productRepository
                    .searchProducts(ctx.targetGender, "quan-dai", null, null, null, PageRequest.of(0, 3)).getContent();
            List<ProductDto> dtos = pants.stream().map(productService::mapToDto).collect(Collectors.toList());
            ctx.lastRecommended = dtos;
            return new ChatResponse(advice, dtos, List.of("Thử trọn bộ bằng AI", "Xem quần khác", "Tư vấn chọn size"),
                    llmClientService.getActiveProviderName(), ctx.sessionId);
        }

        String cat = active.getCategorySlug();
        List<ProductEntity> pairs;

        if (cat != null && cat.contains("quan")) {
            pairs = productRepository.searchProducts(ctx.targetGender, "ao", null, null, null, PageRequest.of(0, 3))
                    .getContent();
        } else {
            pairs = productRepository
                    .searchProducts(ctx.targetGender, "quan-dai", null, null, null, PageRequest.of(0, 3)).getContent();
        }

        List<ProductDto> dtos = pairs.stream().map(productService::mapToDto).collect(Collectors.toList());
        ctx.lastRecommended = dtos;

        String advice = String.format(
                "Dạ với thiết kế của mẫu '%s' (%s), mình gợi ý bạn phối cùng:\n" +
                        "• Một chiếc quần tây suông hoặc quần ống rộng tối màu để tạo tổng thể thanh lịch, kéo dài đôi chân.\n"
                        +
                        "• Đi kèm một đôi sneaker trắng tối giản hoặc giày tây chỉn chu.\n" +
                        "Dưới đây là các mẫu phối chuẩn gu nhất từ cửa hàng:",
                active.getName(), active.getStyle() != null ? active.getStyle() : "Phong cách hiện đại");

        return new ChatResponse(advice, dtos,
                List.of("Thử trọn bộ bằng AI", "Đổi sang mẫu khác", "Kiểm tra size mẫu 1", "Tầm 500k"),
                llmClientService.getActiveProviderName(), ctx.sessionId);
    }

    // =========================================================================
    // 7. PRODUCT SEARCH & GROUNDED RAG PIPELINE
    // =========================================================================

    private ChatResponse handleProductSearch(String raw, String norm, List<ChatMessageDto> history,
            SessionContext ctx) {
        PageRequest page = PageRequest.of(0, 4);

        // Lọc sản phẩm loại trừ
        List<ProductEntity> found = productRepository.searchProducts(
                ctx.targetGender,
                ctx.targetCategory,
                ctx.targetColor != null ? ctx.targetColor : null,
                ctx.minBudget,
                ctx.maxBudget,
                page).getContent().stream()
                .filter(p -> !ctx.excludedCategories.contains(p.getCategorySlug()))
                .collect(Collectors.toList());

        if (found.isEmpty() && ctx.targetColor != null) {
            found = productRepository.searchProducts(
                    ctx.targetGender, ctx.targetCategory, null, ctx.minBudget, ctx.maxBudget, page).getContent()
                    .stream()
                    .filter(p -> !ctx.excludedCategories.contains(p.getCategorySlug()))
                    .collect(Collectors.toList());
        }

        if (found.isEmpty()) {
            found = productRepository.findTop8ByIsActiveTrueAndIsBestSellerTrueOrderByRatingDesc().stream()
                    .filter(p -> !ctx.excludedCategories.contains(p.getCategorySlug()))
                    .limit(3)
                    .collect(Collectors.toList());
        }

        List<ProductDto> dtos = found.stream().map(productService::mapToDto).collect(Collectors.toList());
        ctx.lastRecommended = dtos;
        if (!dtos.isEmpty())
            ctx.activeProduct = dtos.get(0);

        // Chuẩn bị store context cho LLM
        StringBuilder storeContext = new StringBuilder();
        for (ProductDto p : dtos) {
            storeContext.append(String.format(
                    "- ID: %s | Tên: %s | Giá: %,d đ | Giới tính: %s | Danh mục: %s | Màu: %s | Sizes: %s\n",
                    p.getId(), p.getName(), p.getPrice() != null ? p.getPrice() : 0L,
                    p.getGender(), p.getCategorySlug(),
                    p.getColor() != null ? p.getColor() : "Đa dạng",
                    p.getSizes() != null ? String.join(",", p.getSizes()) : "S,M,L,XL"));
        }

        String systemPrompt = "Bạn là trợ lý tư vấn thời trang của SMARTBUY AI, phục vụ khách hàng trẻ và Gen Z Việt Nam.\n"
                +
                "Bạn giao tiếp thân thiện, xưng hô 'Em/Mình' - 'Bạn/Anh/Chị', tự nhiên và chuyên nghiệp như nhân viên bán hàng có gu.\n"
                +
                "CHỈ sử dụng thông tin từ danh sách sản phẩm có thật được cung cấp. Tuyệt đối không bịa giá hoặc tạo sản phẩm ảo.\n"
                +
                "Trả lời đúng trọng tâm câu hỏi của khách hàng. Không tự ý nói về chiều cao/cân nặng hay size nếu khách không hỏi.";

        String llmReply = llmClientService.generateChatReply(systemPrompt, history, raw, storeContext.toString());

        String finalText;
        if (llmReply != null && !llmReply.isBlank()) {
            finalText = llmReply.trim();
        } else {
            String budgetInfo = ctx.maxBudget != null ? String.format(" (ngân sách dưới %,d đ)", ctx.maxBudget) : "";
            String categoryDesc = "";
            if (norm.contains("vay") || norm.contains("dam")) {
                categoryDesc = " về các mẫu váy / đầm nữ thiết kế";
            } else if (norm.contains("ao thun") || norm.contains("tee")) {
                categoryDesc = " về áo thun thời trang";
            } else if (norm.contains("so mi")) {
                categoryDesc = " về áo sơ mi chuẩn form";
            } else if (ctx.targetGender != null && "nam".equalsIgnoreCase(ctx.targetGender)) {
                categoryDesc = " dành cho nam";
            } else if (ctx.targetGender != null && "nu".equalsIgnoreCase(ctx.targetGender)) {
                categoryDesc = " dành cho phái nữ";
            }
            finalText = String.format(
                    "Dạ dựa trên yêu cầu của bạn%s%s, mình đã chọn lọc ra %d mẫu hot trend chính hãng chuẩn gu nhất từ cửa hàng đây ạ. "
                            +
                            "Bạn ưng ý mẫu nào thì cứ nhắn mình kiểm tra size hoặc nhấn 'Thử đồ AI' để xem hình ảnh trực tiếp nhé!",
                    categoryDesc, budgetInfo, dtos.size());
        }

        return new ChatResponse(finalText, dtos,
                List.of("Cái đầu tiên còn size M không?", "Có màu đen không?", "Áo này phối quần gì đẹp?",
                        "Tư vấn chọn size"),
                llmClientService.getActiveProviderName(), ctx.sessionId);
    }

    // =========================================================================
    // 8. OTHER HANDLERS (BUDGET, COLOR, POLICY, ORDER, RESET)
    // =========================================================================

    private ChatResponse handleBudgetUpdate(String raw, String norm, SessionContext ctx) {
        Long budget = extractBudgetNumber(norm);
        if (budget != null) {
            ctx.maxBudget = budget;
        }
        return handleProductSearch(raw, norm, Collections.emptyList(), ctx);
    }

    private ChatResponse handleColorQuery(String raw, String norm, SessionContext ctx) {
        ProductDto target = ctx.activeProduct != null ? ctx.activeProduct
                : (!ctx.lastRecommended.isEmpty() ? ctx.lastRecommended.get(0) : null);
        String requestedColor = extractColor(raw);

        if (target != null && requestedColor != null) {
            List<String> availableColors = target.getColors() != null && !target.getColors().isEmpty()
                    ? target.getColors()
                    : List.of("Đen", "Trắng");
            boolean hasColor = availableColors.stream()
                    .anyMatch(c -> c.toLowerCase().contains(requestedColor.toLowerCase()));

            if (hasColor) {
                return new ChatResponse(
                        String.format("Dạ mẫu '%s' CÓ màu %s chuẩn đẹp như hình ạ! Màu này rất tôn da và dễ phối đồ.",
                                target.getName(), requestedColor),
                        List.of(target), List.of("Thử đồ AI màu này", "Còn size gì?", "Áo này phối quần gì?"),
                        llmClientService.getActiveProviderName(), ctx.sessionId);
            } else {
                return new ChatResponse(
                        String.format("Dạ sản phẩm '%s' hiện không có màu %s ạ. Bảng màu thực tế gồm: %s. " +
                                "Bạn có muốn mình tìm mẫu tương tự màu %s trong kho không?", target.getName(),
                                requestedColor, String.join(", ", availableColors), requestedColor),
                        List.of(target), List.of("Tìm mẫu khác màu " + requestedColor, "Xem bảng màu có sẵn"),
                        llmClientService.getActiveProviderName(), ctx.sessionId);
            }
        }

        ctx.targetColor = requestedColor;
        return handleProductSearch(raw, norm, Collections.emptyList(), ctx);
    }

    private ChatResponse handleMaterialInquiry(String raw, String norm, SessionContext ctx) {
        int refIndex = extractReferencedIndex(norm);
        ProductDto target = null;
        if (refIndex >= 0 && refIndex < ctx.lastRecommended.size()) {
            target = ctx.lastRecommended.get(refIndex);
            ctx.activeProduct = target;
        } else if (ctx.activeProduct != null) {
            target = ctx.activeProduct;
        } else if (!ctx.lastRecommended.isEmpty()) {
            target = ctx.lastRecommended.get(0);
        }

        if (target != null) {
            String mat = target.getMaterial() != null && !target.getMaterial().isBlank()
                    ? target.getMaterial()
                    : "Cotton cao cấp thoáng mát, co giãn nhẹ và thấm hút mồ hôi tối ưu";
            return new ChatResponse(String.format(
                    "Dạ mẫu '%s' được dệt từ chất liệu vải **%s**, bề mặt vải mềm mịn, thoáng khí, không xù lông và rất giữ form sau nhiều lần giặt ạ! Bạn có muốn mình tư vấn chọn size vừa vặn cho mẫu này không?",
                    target.getName(), mat),
                    List.of(target), List.of("Tư vấn chọn size", "Có những màu gì?", "Xem hình ảnh chi tiết"),
                    llmClientService.getActiveProviderName(), ctx.sessionId);
        }

        return new ChatResponse(
                "Dạ các sản phẩm áo và quần tại SMARTBUY AI đều được may từ chất liệu Cotton Compact, Poly-Spandex hoặc nỉ chân cua cao cấp, bề mặt vải thoáng mát, dày dặn và chống nhăn tối ưu ạ!",
                Collections.emptyList(), List.of("Tư vấn chọn size", "Gợi ý đồ hot trend"),
                llmClientService.getActiveProviderName(), ctx.sessionId);
    }

    private ChatResponse handleSkinToneConsultation(String norm, SessionContext ctx) {
        if (norm.contains("da ngam")) {
            return new ChatResponse(
                    "Dạ với làn da ngăm khỏe khoắn, các tông màu tôn da nhất là: Đen basic, Trắng kem, Xanh navy, Be sáng và Xám chì. "
                            +
                            "Nên hạn chế các màu quá chói như vàng neon để tôn lên vẻ nam tính/nữ tính tự nhiên nhất ạ!",
                    ctx.lastRecommended, List.of("Mẫu màu đen", "Mẫu màu be", "Mẫu màu navy"),
                    llmClientService.getActiveProviderName(), ctx.sessionId);
        }
        return new ChatResponse(
                "Dạ làn da sáng hoặc trung tính rất dễ phối đồ! Bạn có thể tự tin diện hầu hết các gam màu từ pastel thanh lịch đến tone đen cá tính ạ.",
                ctx.lastRecommended, List.of("Màu pastel", "Màu đen cá tính"),
                llmClientService.getActiveProviderName(), ctx.sessionId);
    }

    private ChatResponse handleProductComparison(SessionContext ctx) {
        if (ctx.lastRecommended.size() >= 2) {
            ProductDto p1 = ctx.lastRecommended.get(0);
            ProductDto p2 = ctx.lastRecommended.get(1);

            String comparison = String.format(
                    "Dạ em xin so sánh 2 mẫu trên cho mình dễ cân nhắc nhé ạ:\n\n" +
                            "1. **%s**:\n" +
                            "• Giá: %,d đ\n" +
                            "• Phong cách: %s\n" +
                            "• Điểm mạnh: Phom dáng trẻ trung, chất liệu %s thoáng mát.\n\n" +
                            "2. **%s**:\n" +
                            "• Giá: %,d đ\n" +
                            "• Phong cách: %s\n" +
                            "• Điểm mạnh: Thiết kế lịch thiệp, dễ mặc trong nhiều hoàn cảnh.\n\n" +
                            "Nếu bạn thích phong cách năng động nổi bật thì chọn mẫu 1, còn nếu cần sự thanh lịch chỉn chu thì mẫu 2 sẽ là lựa chọn tuyệt vời ạ!",
                    p1.getName(), p1.getPrice() != null ? p1.getPrice() : 0L,
                    p1.getStyle() != null ? p1.getStyle() : "Hiện đại",
                    p1.getMaterial() != null ? p1.getMaterial() : "Cotton cao cấp",
                    p2.getName(), p2.getPrice() != null ? p2.getPrice() : 0L,
                    p2.getStyle() != null ? p2.getStyle() : "Thanh lịch");

            return new ChatResponse(comparison, List.of(p1, p2),
                    List.of("Thử đồ AI mẫu 1", "Thử đồ AI mẫu 2", "Kiểm tra size mẫu 1"),
                    llmClientService.getActiveProviderName(), ctx.sessionId);
        }

        return new ChatResponse(
                "Dạ bạn muốn so sánh 2 sản phẩm nào ạ? Bạn nhắn tên sản phẩm để mình phân tích chất liệu, phom dáng và mức giá giúp bạn nhé!",
                ctx.lastRecommended, List.of("Tìm áo thun nam", "Tìm sơ mi nam"),
                llmClientService.getActiveProviderName(), ctx.sessionId);
    }

    private ChatResponse handleCheaperOrSimilar(SessionContext ctx) {
        ProductDto current = ctx.activeProduct != null ? ctx.activeProduct
                : (!ctx.lastRecommended.isEmpty() ? ctx.lastRecommended.get(0) : null);
        long maxPrice = (current != null && current.getPrice() != null && current.getPrice() > 0)
                ? (long) (current.getPrice() * 0.85)
                : 300000L;
        String cat = current != null ? current.getCategorySlug() : ctx.targetCategory;

        List<ProductEntity> cheaper = productRepository.searchProducts(
                ctx.targetGender,
                cat,
                null,
                null,
                maxPrice,
                PageRequest.of(0, 4)).getContent();

        if (cheaper.isEmpty()) {
            List<ProductEntity> fallbackCheaper = productRepository.searchProducts(
                    ctx.targetGender, "ao-thun", null, null, 250000L, PageRequest.of(0, 3)).getContent();
            List<ProductDto> dtos = fallbackCheaper.stream().map(productService::mapToDto).collect(Collectors.toList());
            ctx.lastRecommended = dtos;
            if (!dtos.isEmpty())
                ctx.activeProduct = dtos.get(0);
            return new ChatResponse(String.format(
                    "Dạ trong danh mục này mẫu %,d đ đã là mức giá học sinh sinh viên ưu đãi nhất tại shop rồi ạ. " +
                            "Tuy nhiên bạn có thể tham khảo thêm các mẫu áo thun basic từ 89k - 199k cực kỳ tiết kiệm này nhé:",
                    (current != null && current.getPrice() != null && current.getPrice() > 0) ? current.getPrice()
                            : 250000L),
                    dtos, List.of("Xem áo thun basic từ 89k", "Xem danh mục sale"),
                    llmClientService.getActiveProviderName(), ctx.sessionId);
        }

        List<ProductDto> dtos = cheaper.stream().map(productService::mapToDto).collect(Collectors.toList());
        ctx.lastRecommended = dtos;
        if (!dtos.isEmpty())
            ctx.activeProduct = dtos.get(0);

        return new ChatResponse(String.format(
                "Dạ mình đã lọc ra các mẫu tương tự có mức giá êm hơn (dưới %,d đ) vừa vặn với túi tiền sinh viên cho bạn đây ạ:",
                maxPrice),
                dtos, List.of("Mẫu đầu tiên còn size L không?", "Có màu đen không?", "Phối trọn bộ"),
                llmClientService.getActiveProviderName(), ctx.sessionId);
    }

    private ChatResponse handleStyleConsultation(String raw, String norm, SessionContext ctx) {
        String reply = "Dạ tại SMARTBUY AI, 3 phong cách được giới trẻ và Gen Z yêu thích nhất hiện nay là:\n\n" +
                "1. **Streetwear / Cyberpunk**: Áo thun oversized, quần túi hộp cargo hoặc quần gió dù cá tính, năng động.\n"
                +
                "2. **Korean Casual**: Sơ mi kẻ sọc, áo polo bo dệt phối cùng quần âu ống suông, tạo cảm giác lịch thiệp, thư sinh.\n"
                +
                "3. **Y2K / Vintage**: Đầm ren, áo baby tee, chân váy xếp ly phối trang sức titan mạ bạc độc đáo.\n\n" +
                "Bạn muốn định hình phong cách nào cho bản thân hôm nay ạ?";
        return new ChatResponse(reply, ctx.lastRecommended,
                List.of("Phong cách Streetwear", "Phong cách Korean Casual", "Phong cách Y2K", "Tư vấn đồ đi tiệc"),
                llmClientService.getActiveProviderName(), ctx.sessionId);
    }

    private ChatResponse handleOrderQuery(Authentication auth, String norm, SessionContext ctx) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            ChatResponse res = new ChatResponse(
                    "Dạ để kiểm tra thông tin và tình trạng đơn hàng của mình, anh/chị vui lòng đăng nhập tài khoản nhé ạ! "
                            +
                            "Sau khi đăng nhập, em sẽ tra cứu ngay lộ trình và mã vận đơn chính xác cho mình.",
                    Collections.emptyList(),
                    List.of("Đăng nhập tài khoản", "Xem chính sách giao hàng", "Tư vấn chọn đồ mới"),
                    llmClientService.getActiveProviderName(), ctx.sessionId);
            res.setRequiresAuth(true);
            return res;
        }

        String userId = auth.getName();
        List<OrderEntity> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);

        if (orders.isEmpty()) {
            return new ChatResponse(
                    "Dạ em đã kiểm tra tài khoản của anh/chị nhưng hiện tại mình chưa có đơn hàng nào tại SMARTBUY AI ạ. "
                            +
                            "Hôm nay shop đang có nhiều mẫu áo thun, hoodie và quần jeans mới về cực đẹp, anh/chị có muốn em tư vấn mẫu đang hot không?",
                    Collections.emptyList(),
                    List.of("Xem mẫu mới về", "Áo thun bán chạy", "Quần jeans hot trend"),
                    llmClientService.getActiveProviderName(), ctx.sessionId);
        }

        OrderEntity latest = orders.get(0);
        String statusText = mapOrderStatus(latest.getStatus());
        String orderMsg = String.format(
                "Dạ em tra cứu thấy anh/chị có đơn hàng gần nhất mã #%s (ngày đặt: %s).\n" +
                        "• Trạng thái hiện tại: %s\n" +
                        "• Tổng thanh toán: %,d đ\n" +
                        "• Địa chỉ nhận: %s\n" +
                        "Anh/chị có thể vào mục 'Đơn hàng của tôi' để theo dõi chi tiết hành trình vận chuyển nhé ạ!",
                latest.getId(),
                latest.getCreatedAt() != null ? latest.getCreatedAt().toString().substring(0, 10) : "Gần đây",
                statusText,
                latest.getTotalAmount() != null ? latest.getTotalAmount() : 0L,
                latest.getShippingAddress() != null ? latest.getShippingAddress() : "Địa chỉ đã lưu");

        return new ChatResponse(orderMsg, Collections.emptyList(),
                List.of("Kiểm tra mã vận đơn", "Mua sắm tiếp", "Liên hệ hỗ trợ"),
                llmClientService.getActiveProviderName(), ctx.sessionId);
    }

    private String mapOrderStatus(String s) {
        if (s == null)
            return "Đang xử lý";
        switch (s.toLowerCase()) {
            case "pending":
                return "Chờ xác nhận";
            case "processing":
                return "Đang chuẩn bị hàng";
            case "shipping":
                return "Đang vận chuyển";
            case "delivered":
            case "completed":
                return "Đã giao thành công";
            case "cancelled":
                return "Đã hủy";
            default:
                return s;
        }
    }

    private ChatResponse handleGreeting(SessionContext ctx) {
        String greeting = "Dạ xin chào! Em là trợ lý thời trang của SMARTBUY AI. " +
                "Hôm nay bạn đang muốn tìm trang phục theo dịp nào (dự tiệc, đi học, đi chơi) hay cần phối trọn bộ theo ngân sách ạ?";
        return new ChatResponse(greeting, Collections.emptyList(),
                List.of("Tôi muốn đồ đi dự tiệc", "Phối đồ nam đi chơi 500k", "Tìm áo thun đen dưới 200k",
                        "Tư vấn chọn size"),
                llmClientService.getActiveProviderName(), ctx.sessionId);
    }

    private ChatResponse handleStorePolicy(String norm, SessionContext ctx) {
        if (norm.contains("doi size") || norm.contains("doi tra")) {
            return new ChatResponse(
                    "Dạ SMARTBUY AI hỗ trợ đổi size và đổi mẫu miễn phí trong vòng 7 ngày kể từ khi nhận hàng (yêu cầu sản phẩm còn nguyên tem mác và chưa qua giặt ủi) ạ!",
                    Collections.emptyList(), List.of("Quy trình đổi hàng", "Xem bảng size", "Tư vấn đồ mới"),
                    llmClientService.getActiveProviderName(), ctx.sessionId);
        }
        if (norm.contains("ship") || norm.contains("giao hang") || norm.contains("bao lau")) {
            return new ChatResponse(
                    "Dạ cửa hàng miễn phí vận chuyển cho đơn hàng từ 250.000đ toàn quốc. Thời gian giao hàng từ 2 - 4 ngày làm việc tuỳ khu vực ạ!",
                    Collections.emptyList(), List.of("Chính sách thanh toán", "Xem sản phẩm mới"),
                    llmClientService.getActiveProviderName(), ctx.sessionId);
        }
        return new ChatResponse(
                "Dạ SMARTBUY AI cam kết 100% hình ảnh sản phẩm là thực tế từ studio, hỗ trợ kiểm hàng trước khi nhận và đổi trả linh hoạt trong 7 ngày ạ!",
                Collections.emptyList(), List.of("Tìm đồ nam", "Tìm đồ nữ", "Top bán chạy"),
                llmClientService.getActiveProviderName(), ctx.sessionId);
    }

    private ChatResponse handleTryOnRequest(SessionContext ctx) {
        return new ChatResponse(
                "Dạ tính năng Thử đồ AI (Virtual Try-On) của shop chạy trực tiếp trên GPU NVIDIA RTX 3060. " +
                        "Khi xem bất kỳ mẫu áo, quần hay váy nào trong chat, bạn chỉ cần bấm nút 'Thử đồ AI' có biểu tượng phát sáng ✨, hệ thống sẽ mở phòng thử và tự động mặc thử trang phục lên người bạn ngay nhé!",
                ctx.lastRecommended, List.of("Thử đồ ngay", "Xem mẫu áo hỗ trợ thử", "Gợi ý phối đồ"),
                llmClientService.getActiveProviderName(), ctx.sessionId);
    }

    private ChatResponse handleOutOfScopeItem(String raw, SessionContext ctx) {
        String reply = "Dạ hiện tại SMARTBUY AI chuyên sâu về các dòng thời trang Streetwear, Y2K và Korean Casual (áo thun, hoodie, áo khoác bomber, sơ mi, quần jeans/cargo và phụ kiện trẻ trung). "
                +
                "Các sản phẩm đặc thù như áo phao lông vũ chống nước âm 30 độ thì shop chưa có sẵn trong danh mục hiện tại ạ. "
                +
                "Tuy nhiên, nếu bạn cần trang phục giữ ấm mùa lạnh thời trang và năng động, mình có thể giới thiệu ngay các mẫu áo khoác bomber dày dặn hoặc hoodie nỉ lót bông cực ấm của shop nhé!";
        return new ChatResponse(reply, Collections.emptyList(),
                List.of("Áo khoác bomber ấm", "Áo hoodie nỉ bông", "Áo len Hàn Quốc", "Xem mẫu mới về"),
                llmClientService.getActiveProviderName(), ctx.sessionId);
    }

    private ChatResponse handlePurchaseIntent(Authentication auth, SessionContext ctx) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            ChatResponse res = new ChatResponse(
                    "Dạ để tiến hành đặt hàng và lưu lại thông tin nhận hàng, anh/chị vui lòng đăng nhập tài khoản trước nhé ạ! "
                            +
                            "Sau khi đăng nhập, anh/chị có thể nhấn nút 'Thêm vào giỏ' ở các thẻ sản phẩm bên dưới và vào Giỏ hàng để hoàn tất thanh toán an toàn.",
                    ctx.lastRecommended,
                    List.of("Đăng nhập tài khoản", "Xem lại giỏ hàng", "Tiếp tục xem đồ"),
                    llmClientService.getActiveProviderName(), ctx.sessionId);
            res.setRequiresAuth(true);
            return res;
        }

        return new ChatResponse(
                "Dạ để đảm bảo tính an toàn và minh bạch, em không tự động tạo hóa đơn hay trừ tiền khi chưa có xác nhận từ anh/chị ạ. "
                        +
                        "Anh/chị chỉ cần nhấn nút 'Thêm vào giỏ' tại sản phẩm ưng ý, sau đó vào mục Giỏ hàng (/cart) để chọn địa chỉ và phương thức thanh toán thuận tiện nhất nhé!",
                ctx.lastRecommended,
                List.of("Vào giỏ hàng", "Xem thêm mẫu khác"),
                llmClientService.getActiveProviderName(), ctx.sessionId);
    }

    private ChatResponse handleResetConversation(SessionContext ctx) {
        ctx.currentTopic = "GENERAL";
        ctx.lastBotQuestionType = null;
        ctx.targetCategory = null;
        ctx.targetOccasion = null;
        ctx.targetStyle = null;
        ctx.maxBudget = null;
        ctx.excludedCategories.clear();
        ctx.activeProduct = null;
        ctx.lastRecommended.clear();

        return new ChatResponse(
                "Dạ em đã làm mới cuộc trò chuyện rồi ạ! Mình cùng bắt đầu lại nhé, hôm nay bạn đang muốn tìm kiếm trang phục cho dịp nào ạ?",
                Collections.emptyList(),
                List.of("Tôi muốn đồ đi dự tiệc", "Phối đồ nam 500k đi chơi", "Áo sơ mi thanh lịch",
                        "Tư vấn chọn size"),
                llmClientService.getActiveProviderName(), ctx.sessionId);
    }

    // =========================================================================
    // 9. CONTEXT EXTRACTION & NORMALIZATION
    // =========================================================================

    private void extractAndMergeContext(String raw, String norm, SessionContext ctx, ChatIntent intent) {
        // Nếu phát hiện đổi chủ đề rõ rệt (Topic Shift)
        if (intent == ChatIntent.OCCASION_CONSULTATION) {
            // Reset các ràng buộc danh mục cũ để phục vụ dịp mới
            if (norm.contains("di tiec") || norm.contains("du tiec") || norm.contains("tiec cuoi")) {
                ctx.targetCategory = null; // giải phóng danh mục cũ như áo thun casual
            }
        }

        // Giới tính
        if (norm.contains("do nam") || norm.contains("cho nam") || norm.contains("quan ao nam")
                || norm.contains("ao nam") || norm.contains("quan nam") || norm.contains("toi la nam")) {
            ctx.targetGender = "nam";
        } else if (norm.contains("do nu") || norm.contains("cho nu") || norm.contains("quan ao nu")
                || norm.contains("ao nu") || norm.contains("vay") || norm.contains("dam")
                || norm.contains("toi la nu")) {
            ctx.targetGender = "nu";
        }

        // Danh mục
        if (norm.contains("hoodie") || norm.contains("sweater"))
            ctx.targetCategory = "ao-hoodie";
        else if (norm.contains("ao thun") || norm.contains("t-shirt") || norm.contains("tee"))
            ctx.targetCategory = "ao-thun";
        else if (norm.contains("so mi") || norm.contains("sơ mi"))
            ctx.targetCategory = "ao-so-mi";
        else if (norm.contains("polo"))
            ctx.targetCategory = "ao-polo";
        else if (norm.contains("blazer") || norm.contains("ao khoac") || norm.contains("bomber")
                || norm.contains("jacket"))
            ctx.targetCategory = "ao-khoac";
        else if (norm.contains("quan jean") || norm.contains("quan bo") || norm.contains("jeans")
                || norm.contains("cargo") || norm.contains("quan dai") || norm.contains("ong rong")
                || norm.contains("quan tay"))
            ctx.targetCategory = "quan-dai";
        else if (norm.contains("chan vay") || norm.contains("vay") || norm.contains("dam"))
            ctx.targetCategory = "vay";
        else if (norm.contains("phu kien") || norm.contains("non") || norm.contains("mu") || norm.contains("vong"))
            ctx.targetCategory = "phu-kien";

        // Phong cách
        if (norm.contains("streetwear") || norm.contains("duong pho"))
            ctx.targetStyle = "Streetwear";
        else if (norm.contains("y2k") || norm.contains("cyber"))
            ctx.targetStyle = "Y2K";
        else if (norm.contains("korean") || norm.contains("han quoc"))
            ctx.targetStyle = "Korean Casual";
        else if (norm.contains("toi gian") || norm.contains("minimal"))
            ctx.targetStyle = "Minimalist";
        else if (norm.contains("lich su") || norm.contains("thanh lich") || norm.contains("sang trong"))
            ctx.targetStyle = "Lịch sự";

        // Dịp sử dụng
        if (norm.contains("tiec cuoi") || norm.contains("dam cuoi"))
            ctx.targetOccasion = "Tiệc cưới";
        else if (norm.contains("sinh nhat"))
            ctx.targetOccasion = "Sinh nhật";
        else if (norm.contains("du tiec") || norm.contains("di tiec") || norm.contains("party"))
            ctx.targetOccasion = "Dự tiệc";
        else if (norm.contains("di date") || norm.contains("hen ho") || norm.contains("crush"))
            ctx.targetOccasion = "Hẹn hò";
        else if (norm.contains("di hoc") || norm.contains("sinh vien"))
            ctx.targetOccasion = "Đi học";
        else if (norm.contains("cong so") || norm.contains("di lam") || norm.contains("phong van"))
            ctx.targetOccasion = "Công sở";
        else if (norm.contains("di choi") || norm.contains("dao pho") || norm.contains("cafe"))
            ctx.targetOccasion = "Đi chơi";

        // Ngân sách
        Long budget = extractBudgetNumber(norm);
        if (budget != null) {
            ctx.maxBudget = budget;
        }

        // Màu sắc
        String color = extractColor(raw);
        if (color != null) {
            ctx.targetColor = color;
        }

        // Chiều cao cân nặng (CHỈ LƯU VÀO PROFILE, KHÔNG ĐỔI INTENT)
        extractMeasurements(norm, ctx);
    }

    private Long extractBudgetNumber(String norm) {
        // Tránh nhầm lẫn với số đo chiều cao cân nặng (ví dụ: 65kg, 1m70)
        Pattern p = Pattern.compile(
                "(?:duoi|tam|khoang|co|tam gia|ngan sach|gia|chi|trong tam)\\s*([0-9.,]+)\\s*(k(?!g)|nghin|ngan|tr|trieu|d|vnd)?");
        Matcher m = p.matcher(norm);
        if (m.find()) {
            String numStr = m.group(1).replace(".", "").replace(",", "");
            try {
                long val = Long.parseLong(numStr);
                String unit = m.group(2);
                if ("k".equalsIgnoreCase(unit) || "nghin".equalsIgnoreCase(unit) || "ngan".equalsIgnoreCase(unit)) {
                    val *= 1000;
                    return val;
                } else if ("tr".equalsIgnoreCase(unit) || "trieu".equalsIgnoreCase(unit)) {
                    val *= 1000000;
                    return val;
                } else if (unit != null && ("d".equalsIgnoreCase(unit) || "vnd".equalsIgnoreCase(unit))) {
                    if (val > 0 && val < 2000)
                        val *= 1000;
                    return val;
                } else if (unit == null && val >= 50 && val < 2000 && !norm.contains("kg") && !norm.contains("cm")) {
                    val *= 1000;
                    return val;
                }
            } catch (Exception ignored) {
            }
        }

        Pattern pSimple = Pattern.compile("([0-9]{2,4})\\s*(k(?!g)|nghin|ngan)\\b");
        Matcher mSimple = pSimple.matcher(norm);
        if (mSimple.find()) {
            try {
                return Long.parseLong(mSimple.group(1)) * 1000;
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private String extractColor(String raw) {
        String lower = raw.toLowerCase();
        if (lower.contains("den") || lower.contains("màu đen") || lower.contains("đen"))
            return "Đen";
        if (lower.contains("trang") || lower.contains("màu trắng") || lower.contains("trắng"))
            return "Trắng";
        if (lower.contains("xam") || lower.contains("màu xám") || lower.contains("ghi") || lower.contains("xám"))
            return "Xám";
        if (lower.contains("be") || lower.contains("màu be"))
            return "Be";
        if (lower.contains("kem") || lower.contains("màu kem"))
            return "Kem";
        if (lower.contains("nau") || lower.contains("màu nâu") || lower.contains("nâu"))
            return "Nâu";
        if (lower.contains("xanh") || lower.contains("màu xanh"))
            return "Xanh";
        return null;
    }

    private String extractSize(String raw) {
        String upper = raw.toUpperCase();
        if (upper.matches(".*\\bXXL\\b.*"))
            return "XXL";
        if (upper.matches(".*\\bXL\\b.*"))
            return "XL";
        if (upper.matches(".*\\bL\\b.*") && (upper.contains("SIZE L") || upper.contains("SZ L")
                || upper.contains("CỠ L") || upper.contains("CO SIZE L") || upper.contains("CON SIZE L")))
            return "L";
        if (upper.matches(".*\\bM\\b.*") && (upper.contains("SIZE M") || upper.contains("SZ M")
                || upper.contains("CỠ M") || upper.contains("CO SIZE M") || upper.contains("CON SIZE M")))
            return "M";
        if (upper.matches(".*\\bS\\b.*") && (upper.contains("SIZE S") || upper.contains("SZ S")
                || upper.contains("CỠ S") || upper.contains("CO SIZE S") || upper.contains("CON SIZE S")))
            return "S";
        return null;
    }

    private void extractMeasurements(String norm, SessionContext ctx) {
        Matcher h = Pattern.compile("(?:cao|chieu cao)\\s*(?:1m([0-9]{1,2})|([0-9]{3})\\s*cm|m([0-9]{2}))")
                .matcher(norm);
        if (h.find()) {
            if (h.group(1) != null) {
                String d = h.group(1).length() == 1 ? h.group(1) + "0" : h.group(1);
                ctx.heightCm = 100 + Integer.parseInt(d);
            } else if (h.group(2) != null) {
                ctx.heightCm = Integer.parseInt(h.group(2));
            } else if (h.group(3) != null) {
                ctx.heightCm = 100 + Integer.parseInt(h.group(3));
            }
        }
        Matcher w = Pattern.compile("([0-9]{2,3})\\s*(?:kg|kilo|can|ki)").matcher(norm);
        if (w.find()) {
            ctx.weightKg = Integer.parseInt(w.group(1));
        }
    }

    private int extractReferencedIndex(String norm) {
        if (norm.contains("cai dau tien") || norm.contains("mon dau tien") || norm.contains("cai thu nhat")
                || norm.contains("chiec dau tien") || norm.contains("mau thu nhat") || norm.contains("mau thu 1")
                || norm.contains("cai dau"))
            return 0;
        if (norm.contains("cai thu hai") || norm.contains("mon thu hai") || norm.contains("cai o giua")
                || norm.contains("mau thu hai") || norm.contains("mau thu 2") || norm.contains("chiec thu hai")
                || norm.contains("chiec thu 2") || norm.contains("cai thu 2"))
            return 1;
        if (norm.contains("cai thu ba") || norm.contains("mon thu ba") || norm.contains("cai cuoi cung")
                || norm.contains("mau thu ba") || norm.contains("mau thu 3"))
            return 2;
        if (norm.contains("chiec do") || norm.contains("cai nay") || norm.contains("ao nay")
                || norm.contains("quan nay"))
            return 0;
        return -1;
    }

    private boolean isGreeting(String norm) {
        return norm.matches("^(chao|xin chao|hello|hi|shop oi|ad oi|alo|hey).*");
    }

    private boolean isOrderQuery(String norm) {
        return norm.contains("don hang") || norm.contains("kiem tra don") || norm.contains("tinh trang don")
                || norm.contains("tra cuu don");
    }

    private boolean isStorePolicy(String norm) {
        return norm.contains("doi size") || norm.contains("doi tra") || norm.contains("phi ship")
                || norm.contains("freeship")
                || norm.contains("bao lau nhan") || norm.contains("giao hang") || norm.contains("ship hang")
                || norm.contains("van chuyen")
                || norm.contains("thu do the nao") || norm.contains("chinh sach");
    }

    private boolean isOutOfScopeItem(String norm) {
        return norm.contains("long vu") || norm.contains("am 30 do") || norm.contains("ao phao")
                || norm.contains("do boi") || norm.contains("bikini") || norm.contains("vest cuoi")
                || norm.contains("do ngu") || norm.contains("giay da");
    }

    private boolean isPurchaseIntent(String norm) {
        return norm.contains("dat hang") || norm.contains("mua luon") || norm.contains("thanh toan")
                || norm.contains("chot don")
                || norm.contains("dat cho toi") || norm.contains("dat cho minh") || norm.contains("giao den")
                || norm.contains("mua hang");
    }

    private boolean isPriceTooHighOrSimilar(String norm) {
        return norm.contains("dat qua") || norm.contains("gia cao") || norm.contains("re hon")
                || norm.contains("mau tuong tu");
    }

    private boolean isColorQuery(String norm) {
        return (norm.contains("co mau") || norm.contains("con mau") || norm.contains("mau gi")
                || norm.contains("mau khac") || norm.contains("thich mau") || norm.contains("mau den")
                || norm.contains("mau trang")) && !norm.contains("da ngam");
    }

    private boolean isSkinToneQuery(String norm) {
        return norm.contains("da ngam") || norm.contains("da trang") || norm.contains("da vang")
                || norm.contains("ton da");
    }

    private String normalizeSlang(String s) {
        String lower = s.toLowerCase();
        lower = lower.replaceAll("\\bko\\b|\\bk\\b", "không");
        lower = lower.replaceAll("\\bdc\\b", "được");
        lower = lower.replaceAll("\\btks\\b|\\bthanks\\b", "cảm ơn");
        lower = lower.replaceAll("\\bsz\\b", "size");
        lower = lower.replaceAll("\\bcf\\b", "cafe");
        lower = lower.replaceAll("\\bđ\\b|\\bvnd\\b", "đồng");
        return lower;
    }

    private String removeTones(String str) {
        String nfd = Normalizer.normalize(str, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(nfd).replaceAll("").replace('đ', 'd').replace('Đ', 'D').toLowerCase();
    }
}
