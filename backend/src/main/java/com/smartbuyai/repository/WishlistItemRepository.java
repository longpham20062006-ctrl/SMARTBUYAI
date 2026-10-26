package com.smartbuyai.repository;

import com.smartbuyai.entity.WishlistItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistItemRepository extends JpaRepository<WishlistItemEntity, Long> {
    List<WishlistItemEntity> findByUserId(String userId);
    Optional<WishlistItemEntity> findByUserIdAndProductId(String userId, String productId);
    boolean existsByUserIdAndProductId(String userId, String productId);
    void deleteByUserIdAndProductId(String userId, String productId);
}
