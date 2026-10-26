package com.smartbuyai.controller;

import com.smartbuyai.dto.ProductDto;
import com.smartbuyai.service.WishlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/wishlist")
@Tag(name = "Wishlist", description = "Danh sách yêu thích")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách sản phẩm yêu thích của người dùng")
    public ResponseEntity<List<ProductDto>> getWishlist(
            @RequestParam(required = false, defaultValue = "user-demo-1") String userId,
            Authentication auth
    ) {
        String effectiveUserId = auth != null ? auth.getName() : userId;
        return ResponseEntity.ok(wishlistService.getWishlist(effectiveUserId));
    }

    @PostMapping
    @Operation(summary = "Thêm/Xóa sản phẩm khỏi danh sách yêu thích qua Request Body")
    public ResponseEntity<Map<String, Object>> toggleWishlistBody(
            @RequestBody Map<String, String> body,
            Authentication auth
    ) {
        String productId = body.get("productId");
        String userId = body.getOrDefault("userId", "user-demo-1");
        String effectiveUserId = auth != null ? auth.getName() : userId;
        boolean added = wishlistService.toggleWishlist(effectiveUserId, productId);
        return ResponseEntity.ok(Map.of(
                "productId", productId,
                "wishlisted", added,
                "message", added ? "Đã thêm vào yêu thích" : "Đã bỏ khỏi yêu thích"
        ));
    }

    @PostMapping("/{productId}")
    @Operation(summary = "Thêm/Xóa sản phẩm khỏi danh sách yêu thích")
    public ResponseEntity<Map<String, Object>> toggleWishlist(
            @PathVariable String productId,
            @RequestParam(required = false, defaultValue = "user-demo-1") String userId,
            Authentication auth
    ) {
        String effectiveUserId = auth != null ? auth.getName() : userId;
        boolean added = wishlistService.toggleWishlist(effectiveUserId, productId);
        return ResponseEntity.ok(Map.of(
                "productId", productId,
                "wishlisted", added,
                "message", added ? "Đã thêm vào yêu thích" : "Đã bỏ khỏi yêu thích"
        ));
    }
}
