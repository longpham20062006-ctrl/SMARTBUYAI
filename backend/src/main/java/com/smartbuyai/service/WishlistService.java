package com.smartbuyai.service;

import com.smartbuyai.dto.ProductDto;
import com.smartbuyai.entity.WishlistItemEntity;
import com.smartbuyai.repository.ProductRepository;
import com.smartbuyai.repository.WishlistItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@Transactional
public class WishlistService {

    private final WishlistItemRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;

    public WishlistService(WishlistItemRepository wishlistRepository, ProductRepository productRepository, ProductService productService) {
        this.wishlistRepository = wishlistRepository;
        this.productRepository = productRepository;
        this.productService = productService;
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getWishlist(String userId) {
        if (userId == null || userId.isBlank()) {
            return Collections.emptyList();
        }
        List<WishlistItemEntity> items = wishlistRepository.findByUserId(userId);
        if (items == null) {
            return Collections.emptyList();
        }
        List<ProductDto> result = new ArrayList<>();
        for (WishlistItemEntity item : items) {
            if (item != null && item.getProductId() != null && !item.getProductId().isBlank()) {
                String validProductId = Objects.requireNonNull(item.getProductId());
                productRepository.findById(validProductId)
                        .ifPresent(p -> {
                            ProductDto dto = productService.mapToDto(p);
                            if (dto != null) {
                                result.add(dto);
                            }
                        });
            }
        }
        return result;
    }

    public boolean toggleWishlist(String userId, String productId) {
        if (userId == null || userId.isBlank() || productId == null || productId.isBlank()) {
            return false;
        }
        final String cleanUserId = Objects.requireNonNull(userId);
        final String cleanProductId = Objects.requireNonNull(productId);
        Optional<WishlistItemEntity> existing = wishlistRepository.findByUserIdAndProductId(cleanUserId, cleanProductId);
        if (existing.isPresent()) {
            WishlistItemEntity itemToDelete = existing.get();
            if (itemToDelete != null) {
                wishlistRepository.delete(itemToDelete);
            }
            return false; // Removed
        } else {
            wishlistRepository.save(new WishlistItemEntity(cleanUserId, cleanProductId));
            return true; // Added
        }
    }
}
