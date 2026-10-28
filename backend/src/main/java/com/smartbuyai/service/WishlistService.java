package com.smartbuyai.service;

import com.smartbuyai.dto.ProductDto;
import com.smartbuyai.entity.WishlistItemEntity;
import com.smartbuyai.repository.ProductRepository;
import com.smartbuyai.repository.WishlistItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
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
        List<WishlistItemEntity> items = wishlistRepository.findByUserId(userId);
        List<ProductDto> result = new ArrayList<>();
        for (WishlistItemEntity item : items) {
            productRepository.findById(item.getProductId()).ifPresent(p -> result.add(productService.mapToDto(p)));
        }
        return result;
    }

    public boolean toggleWishlist(String userId, String productId) {
        Optional<WishlistItemEntity> existing = wishlistRepository.findByUserIdAndProductId(userId, productId);
        if (existing.isPresent()) {
            wishlistRepository.delete(existing.get());
            return false; // Removed
        } else {
            wishlistRepository.save(new WishlistItemEntity(userId, productId));
            return true; // Added
        }
    }
}
