package com.smartbuyai.repository;

import com.smartbuyai.entity.CartItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItemEntity, Long> {
    Optional<CartItemEntity> findByCartIdAndVariantId(String cartId, String variantId);
    Optional<CartItemEntity> findByCartIdAndProductIdAndVariantIdIsNull(String cartId, String productId);
}
