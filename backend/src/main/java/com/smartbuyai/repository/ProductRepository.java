package com.smartbuyai.repository;

import com.smartbuyai.entity.ProductEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<ProductEntity, String>, JpaSpecificationExecutor<ProductEntity> {

    Optional<ProductEntity> findBySlug(String slug);

    @Query("SELECT p FROM ProductEntity p WHERE p.isActive = true " +
           "AND SIZE(p.images) > 0 " +
           "AND p.price > 0 " +
           "AND (:gender IS NULL OR LOWER(p.gender) = LOWER(:gender) OR p.gender = 'unisex') " +
           "AND (:categorySlug IS NULL OR p.categorySlug = :categorySlug " +
           "     OR (:categorySlug = 'ao' AND p.categorySlug LIKE 'ao%') " +
           "     OR ((:categorySlug = 'so-mi' OR :categorySlug = 'ao-so-mi' OR :categorySlug = 'so-mi-polo') AND (p.categorySlug LIKE '%so-mi%' OR p.categorySlug LIKE '%polo%')) " +
           "     OR ((:categorySlug = 'quan' OR :categorySlug = 'quan-dai' OR :categorySlug = 'quan-jeans' OR :categorySlug = 'quan-cargo-parachute') AND p.categorySlug LIKE 'quan%') " +
           "     OR ((:categorySlug = 'vay' OR :categorySlug = 'chan-vay') AND (p.categorySlug LIKE '%vay%' OR p.categorySlug LIKE '%dam%')) " +
           "     OR ((:categorySlug = 'hoodie' OR :categorySlug = 'ao-hoodie') AND p.categorySlug LIKE '%hoodie%') " +
           "     OR ((:categorySlug = 'ao-khoac' OR :categorySlug = 'khoac') AND p.categorySlug LIKE '%khoac%') " +
           "     OR (:categorySlug = 'phu-kien' AND p.categorySlug LIKE '%phu-kien%')) " +
           "AND (:query IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "     OR LOWER(p.shortDescription) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "     OR LOWER(p.material) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR p.price <= :maxPrice)")
    Page<ProductEntity> searchProducts(
            @Param("gender") String gender,
            @Param("categorySlug") String categorySlug,
            @Param("query") String query,
            @Param("minPrice") Long minPrice,
            @Param("maxPrice") Long maxPrice,
            Pageable pageable
    );

    @Query("SELECT p FROM ProductEntity p WHERE p.isActive = true AND SIZE(p.images) > 0 AND p.price > 0 AND p.isNewDrop = true ORDER BY p.price ASC")
    List<ProductEntity> findTop8ByIsActiveTrueAndIsNewDropTrueOrderByPriceAsc();

    @Query("SELECT p FROM ProductEntity p WHERE p.isActive = true AND SIZE(p.images) > 0 AND p.price > 0 AND p.isBestSeller = true ORDER BY p.rating DESC")
    List<ProductEntity> findTop8ByIsActiveTrueAndIsBestSellerTrueOrderByRatingDesc();

    @Query("SELECT p FROM ProductEntity p WHERE p.isActive = true AND SIZE(p.images) > 0 AND p.price > 0 AND p.categorySlug = :categorySlug")
    List<ProductEntity> findTop8ByIsActiveTrueAndCategorySlug(@Param("categorySlug") String categorySlug);

    @Query("SELECT p FROM ProductEntity p WHERE p.isActive = true AND SIZE(p.images) > 0 AND p.price > 0 AND p.season = :season")
    List<ProductEntity> findTop8ByIsActiveTrueAndSeason(@Param("season") String season);
}
