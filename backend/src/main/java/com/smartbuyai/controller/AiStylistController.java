package com.smartbuyai.controller;

import com.smartbuyai.dto.StylistRequest;
import com.smartbuyai.dto.StylistResponse;
import com.smartbuyai.service.AiStylistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai/stylist")
@Tag(name = "AI Stylist", description = "Trợ lý AI tư vấn phối đồ Gen Z")
public class AiStylistController {

    private final AiStylistService stylistService;

    public AiStylistController(AiStylistService stylistService) {
        this.stylistService = stylistService;
    }

    @PostMapping("/recommend")
    @Operation(summary = "Gợi ý trọn bộ outfit theo yêu cầu và ngân sách học sinh sinh viên")
    public ResponseEntity<StylistResponse> getOutfitRecommendation(@RequestBody StylistRequest req) {
        return ResponseEntity.ok(stylistService.generateOutfit(req));
    }
}
