package com.smartbuyai.controller;

import com.smartbuyai.dto.AddToCartRequest;
import com.smartbuyai.dto.CartDto;
import com.smartbuyai.dto.UpdateCartItemRequest;
import com.smartbuyai.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
@Tag(name = "Cart", description = "Quản lý giỏ hàng")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    @Operation(summary = "Lấy giỏ hàng của Customer đã đăng nhập")
    public ResponseEntity<CartDto> getCart(
            @RequestParam(required = false) String sessionId,
            Authentication auth
    ) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String userId = auth.getName();
        return ResponseEntity.ok(cartService.getOrCreateCart(userId, sessionId));
    }

    @PostMapping("/items")
    @Operation(summary = "Thêm sản phẩm vào giỏ hàng trực tiếp (Bắt buộc Customer đã đăng nhập)")
    public ResponseEntity<CartDto> addItemDirect(
            @Valid @RequestBody AddToCartRequest req,
            @RequestParam(required = false) String sessionId,
            Authentication auth
    ) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String effectiveSessionId = req.getSessionId() != null ? req.getSessionId() : sessionId;
        String cartId = req.getCartId();
        if (cartId == null || cartId.isBlank()) {
            String userId = auth.getName();
            CartDto cart = cartService.getOrCreateCart(userId, effectiveSessionId);
            cartId = cart.getId();
        }
        return ResponseEntity.ok(cartService.addItem(cartId, req));
    }

    @PostMapping("/{cartId}/items")
    @Operation(summary = "Thêm sản phẩm vào giỏ hàng (giá được kiểm tra từ máy chủ)")
    public ResponseEntity<CartDto> addItem(
            @PathVariable String cartId,
            @Valid @RequestBody AddToCartRequest req
    ) {
        return ResponseEntity.ok(cartService.addItem(cartId, req));
    }

    @PatchMapping("/items/{itemId}")
    @Operation(summary = "Cập nhật số lượng sản phẩm trong giỏ trực tiếp")
    public ResponseEntity<CartDto> updateItemQuantityDirect(
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartItemRequest req
    ) {
        return ResponseEntity.ok(cartService.updateItemQuantityDirect(itemId, req.getQuantity()));
    }

    @DeleteMapping("/items/{itemId}")
    @Operation(summary = "Xóa sản phẩm khỏi giỏ hàng trực tiếp")
    public ResponseEntity<CartDto> removeItemDirect(@PathVariable Long itemId) {
        return ResponseEntity.ok(cartService.removeItemDirect(itemId));
    }

    @PatchMapping("/{cartId}/items/{itemId}")
    @Operation(summary = "Cập nhật số lượng sản phẩm trong giỏ")
    public ResponseEntity<CartDto> updateItemQuantity(
            @PathVariable String cartId,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartItemRequest req
    ) {
        return ResponseEntity.ok(cartService.updateItemQuantity(cartId, itemId, req.getQuantity()));
    }

    @DeleteMapping("/{cartId}/items/{itemId}")
    @Operation(summary = "Xóa sản phẩm khỏi giỏ hàng")
    public ResponseEntity<CartDto> removeItem(
            @PathVariable String cartId,
            @PathVariable Long itemId
    ) {
        return ResponseEntity.ok(cartService.removeItem(cartId, itemId));
    }

    @DeleteMapping("/{cartId}")
    @Operation(summary = "Xóa sạch giỏ hàng")
    public ResponseEntity<CartDto> clearCart(@PathVariable String cartId) {
        return ResponseEntity.ok(cartService.clearCart(cartId));
    }
}
