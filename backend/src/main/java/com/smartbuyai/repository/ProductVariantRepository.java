package com.smartbuyai.repository;

import com.smartbuyai.entity.ProductVariantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariantEntity, String> {
    List<ProductVariantEntity> findByProductId(String productId);
}
