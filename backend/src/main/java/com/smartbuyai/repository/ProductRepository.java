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
           "AND (:gender IS NULL OR LOWER(p.gender) = LOWER(:gender)) " +
           "AND (:categorySlug IS NULL OR p.categorySlug = :categorySlug) " +
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

    List<ProductEntity> findTop8ByIsActiveTrueAndIsNewDropTrueOrderByPriceAsc();
    List<ProductEntity> findTop8ByIsActiveTrueAndIsBestSellerTrueOrderByRatingDesc();
    List<ProductEntity> findTop8ByIsActiveTrueAndCategorySlug(String categorySlug);
    List<ProductEntity> findTop8ByIsActiveTrueAndSeason(String season);
}
