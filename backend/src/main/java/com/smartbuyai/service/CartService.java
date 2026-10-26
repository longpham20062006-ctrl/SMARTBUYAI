package com.smartbuyai.service;

import com.smartbuyai.dto.AddToCartRequest;
import com.smartbuyai.dto.CartDto;
import com.smartbuyai.dto.CartItemDto;
import com.smartbuyai.entity.CartEntity;
import com.smartbuyai.entity.CartItemEntity;
import com.smartbuyai.entity.ProductEntity;
import com.smartbuyai.entity.ProductVariantEntity;
import com.smartbuyai.exception.ResourceNotFoundException;
import com.smartbuyai.repository.CartItemRepository;
import com.smartbuyai.repository.CartRepository;
import com.smartbuyai.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository, ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    public CartDto getOrCreateCart(String userId, String sessionId) {
        CartEntity cart = null;
        if (userId != null && !userId.isBlank()) {
            cart = cartRepository.findByUserId(userId).orElse(null);
        }
        if (cart == null && sessionId != null && !sessionId.isBlank()) {
            cart = cartRepository.findBySessionId(sessionId).orElse(null);
        }
        if (cart == null) {
            String newId = "cart_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            cart = new CartEntity(newId, userId, sessionId != null ? sessionId : newId);
            cart = cartRepository.save(cart);
        }
        return mapToDto(cart);
    }

    public CartDto addItem(String cartId, AddToCartRequest req) {
        CartEntity cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new ResourceNotFoundException("Giỏ hàng không tồn tại: " + cartId));

        ProductEntity product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại: " + req.getProductId()));

        // Server-side price validation
        Long verifiedPrice = product.getPrice();
        Long verifiedOriginalPrice = product.getOriginalPrice() != null ? product.getOriginalPrice() : verifiedPrice;
        String imageUrl = !product.getImages().isEmpty() ? product.getImages().get(0).getImageUrl() : "";

        // Check variant if provided
        if (req.getVariantId() != null && !req.getVariantId().isBlank()) {
            for (ProductVariantEntity v : product.getVariants()) {
                if (v.getId().equals(req.getVariantId())) {
                    if (v.getPrice() != null && v.getPrice() > 0) verifiedPrice = v.getPrice();
                    if (v.getImageUrl() != null && !v.getImageUrl().isBlank()) imageUrl = v.getImageUrl();
                    break;
                }
            }
        }

        // Find existing matching item in cart
        CartItemEntity targetItem = null;
        for (CartItemEntity item : cart.getItems()) {
            boolean sameProduct = item.getProductId().equals(req.getProductId());
            boolean sameVariant = (req.getVariantId() != null && req.getVariantId().equals(item.getVariantId()))
                    || (req.getVariantId() == null && item.getVariantId() == null);
            boolean sameSize = (req.getSize() != null && req.getSize().equals(item.getSize()))
                    || (req.getSize() == null && item.getSize() == null);

            if (sameProduct && sameVariant && sameSize) {
                targetItem = item;
                break;
            }
        }

        if (targetItem != null) {
            targetItem.setQuantity(targetItem.getQuantity() + req.getQuantity());
        } else {
            CartItemEntity newItem = new CartItemEntity();
            newItem.setCart(cart);
            newItem.setProductId(product.getId());
            newItem.setProductSlug(product.getSlug());
            newItem.setProductName(product.getName());
            newItem.setBrand(product.getBrand());
            newItem.setImageUrl(imageUrl);
            newItem.setVariantId(req.getVariantId());
            newItem.setSize(req.getSize() != null ? req.getSize() : "FreeSize");
            newItem.setColorName(req.getColorName() != null ? req.getColorName() : "Mặc định");
            newItem.setColorHex(req.getColorHex() != null ? req.getColorHex() : "#111111");
            newItem.setPrice(verifiedPrice);
            newItem.setOriginalPrice(verifiedOriginalPrice);
            newItem.setQuantity(req.getQuantity());
            cart.getItems().add(newItem);
        }

        cart.setUpdatedAt(LocalDateTime.now());
        cart = cartRepository.save(cart);
        return mapToDto(cart);
    }

    public CartDto updateItemQuantity(String cartId, Long itemId, int quantity) {
        CartEntity cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new ResourceNotFoundException("Giỏ hàng không tồn tại: " + cartId));

        if (quantity <= 0) {
            cart.getItems().removeIf(i -> i.getId().equals(itemId));
        } else {
            for (CartItemEntity item : cart.getItems()) {
                if (item.getId().equals(itemId)) {
                    item.setQuantity(quantity);
                    break;
                }
            }
        }

        cart.setUpdatedAt(LocalDateTime.now());
        cart = cartRepository.save(cart);
        return mapToDto(cart);
    }

    public CartDto removeItem(String cartId, Long itemId) {
        return updateItemQuantity(cartId, itemId, 0);
    }

    public CartDto updateItemQuantityDirect(Long itemId, int quantity) {
        CartItemEntity item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Mục giỏ hàng không tồn tại: " + itemId));
        CartEntity cart = item.getCart();
        return updateItemQuantity(cart.getId(), itemId, quantity);
    }

    public CartDto removeItemDirect(Long itemId) {
        CartItemEntity item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Mục giỏ hàng không tồn tại: " + itemId));
        CartEntity cart = item.getCart();
        return removeItem(cart.getId(), itemId);
    }

    public CartDto clearCart(String cartId) {
        CartEntity cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new ResourceNotFoundException("Giỏ hàng không tồn tại: " + cartId));
        cart.getItems().clear();
        cart.setUpdatedAt(LocalDateTime.now());
        cart = cartRepository.save(cart);
        return mapToDto(cart);
    }

    public CartDto mapToDto(CartEntity entity) {
        CartDto dto = new CartDto();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());

        long subtotal = 0;
        int totalQty = 0;

        for (CartItemEntity item : entity.getItems()) {
            CartItemDto itemDto = new CartItemDto();
            itemDto.setId(item.getId());
            itemDto.setProductId(item.getProductId());
            itemDto.setProductSlug(item.getProductSlug());
            itemDto.setProductName(item.getProductName());
            itemDto.setBrand(item.getBrand());
            itemDto.setImageUrl(item.getImageUrl());
            itemDto.setVariantId(item.getVariantId());
            itemDto.setColorName(item.getColorName());
            itemDto.setColorHex(item.getColorHex());
            itemDto.setSize(item.getSize());
            itemDto.setPrice(item.getPrice());
            itemDto.setOriginalPrice(item.getOriginalPrice());
            itemDto.setQuantity(item.getQuantity());
            long itemTotal = item.getPrice() * item.getQuantity();
            itemDto.setItemTotal(itemTotal);

            subtotal += itemTotal;
            totalQty += item.getQuantity();
            dto.getItems().add(itemDto);
        }

        dto.setSubtotal(subtotal);
        dto.setTotal(subtotal);
        dto.setTotalQuantity(totalQty);
        return dto;
    }
}
