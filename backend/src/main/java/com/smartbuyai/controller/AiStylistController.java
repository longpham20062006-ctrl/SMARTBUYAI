package com.smartbuyai.controller;

import com.smartbuyai.dto.*;
import com.smartbuyai.service.AiChatbotService;
import com.smartbuyai.service.AiStylistService;
import com.smartbuyai.service.LlmClientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai/stylist")
@Tag(name = "AI Stylist & Conversational Assistant", description = "Trợ lý AI tư vấn bán hàng và thời trang thông minh")
public class AiStylistController {

    private final AiStylistService stylistService;
    private final AiChatbotService aiChatbotService;
    private final LlmClientService llmClientService;

    public AiStylistController(AiStylistService stylistService,
                               AiChatbotService aiChatbotService,
                               LlmClientService llmClientService) {
        this.stylistService = stylistService;
        this.aiChatbotService = aiChatbotService;
        this.llmClientService = llmClientService;
    }

    @PostMapping("/chat")
    @Operation(summary = "Hội thoại tự nhiên đa lượt với trợ lý thời trang SMARTBUY AI (Hỗ trợ LLM & RAG)")
    public ResponseEntity<ChatResponse> chat(
            @RequestBody ChatRequest request,
            Authentication authentication
    ) {
        ChatResponse response = aiChatbotService.processChat(request, authentication);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-session")
    @Operation(summary = "Bắt đầu cuộc trò chuyện mới, xóa sạch ngữ cảnh phiên trước")
    public ResponseEntity<Map<String, Object>> resetSession(@RequestParam(required = false) String sessionId) {
        aiChatbotService.resetSession(sessionId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Đã khởi tạo phiên trò chuyện mới"));
    }

    @GetMapping("/status")
    @Operation(summary = "Kiểm tra cấu hình mô hình AI và nhà cung cấp hoạt động")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(Map.of(
                "activeProvider", llmClientService.getActiveProviderName(),
                "externalLlmConfigured", llmClientService.isConfigured(),
                "engine", "SmartBuy Multi-turn Conversational RAG & Stylist",
                "status", "ONLINE"
        ));
    }

    @PostMapping("/recommend")
    @Operation(summary = "Gợi ý trọn bộ outfit theo yêu cầu và ngân sách học sinh sinh viên")
    public ResponseEntity<StylistResponse> getOutfitRecommendation(@RequestBody StylistRequest req) {
        return ResponseEntity.ok(stylistService.generateOutfit(req));
    }
}
