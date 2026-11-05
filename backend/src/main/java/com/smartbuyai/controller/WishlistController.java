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
    @Operation(summary = "Lấy danh sách sản phẩm yêu thích (Bắt buộc Customer đã đăng nhập)")
    public ResponseEntity<List<ProductDto>> getWishlist(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(wishlistService.getWishlist(auth.getName()));
    }

    @PostMapping
    @Operation(summary = "Thêm/Xóa sản phẩm khỏi danh sách yêu thích (Bắt buộc Customer đã đăng nhập)")
    public ResponseEntity<Map<String, Object>> toggleWishlistBody(
            @RequestBody Map<String, String> body,
            Authentication auth
    ) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String productId = body.get("productId");
        boolean added = wishlistService.toggleWishlist(auth.getName(), productId);
        return ResponseEntity.ok(Map.of(
                "productId", productId,
                "wishlisted", added,
                "message", added ? "Đã thêm vào yêu thích" : "Đã bỏ khỏi yêu thích"
        ));
    }

    @PostMapping("/{productId}")
    @Operation(summary = "Thêm/Xóa sản phẩm khỏi danh sách yêu thích (Bắt buộc Customer đã đăng nhập)")
    public ResponseEntity<Map<String, Object>> toggleWishlist(
            @PathVariable String productId,
            Authentication auth
    ) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        boolean added = wishlistService.toggleWishlist(auth.getName(), productId);
        return ResponseEntity.ok(Map.of(
                "productId", productId,
                "wishlisted", added,
                "message", added ? "Đã thêm vào yêu thích" : "Đã bỏ khỏi yêu thích"
        ));
    }
}
