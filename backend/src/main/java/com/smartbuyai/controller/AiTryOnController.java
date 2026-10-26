package com.smartbuyai.controller;

import com.smartbuyai.dto.TryOnRequest;
import com.smartbuyai.dto.TryOnResponse;
import com.smartbuyai.dto.TryOnStatusResponse;
import com.smartbuyai.service.AiTryOnService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai/try-on")
@Tag(name = "AI Virtual Try-On", description = "Dịch vụ thử đồ AI ảo điều phối GPU RTX 3060")
public class AiTryOnController {

    private final AiTryOnService tryOnService;

    public AiTryOnController(AiTryOnService tryOnService) {
        this.tryOnService = tryOnService;
    }

    @PostMapping
    @Operation(summary = "Tiếp nhận tác vụ thử đồ AI và đưa vào hàng đợi xử lý")
    public ResponseEntity<TryOnResponse> submitTryOnJob(
            @RequestBody TryOnRequest req,
            Authentication auth
    ) {
        String userId = auth != null ? auth.getName() : "guest";
        TryOnResponse response = tryOnService.submitTryOnJob(req, userId);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @GetMapping("/{jobId}")
    @Operation(summary = "Kiểm tra tiến độ thực thi và lấy ảnh kết quả thử đồ AI")
    public ResponseEntity<TryOnStatusResponse> getJobStatus(@PathVariable String jobId) {
        return ResponseEntity.ok(tryOnService.getJobStatus(jobId));
    }
}
