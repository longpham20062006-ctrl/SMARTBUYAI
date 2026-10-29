package com.smartbuyai.service;

import com.smartbuyai.dto.PagedResponse;
import com.smartbuyai.dto.ProductDto;
import com.smartbuyai.entity.ProductEntity;
import com.smartbuyai.entity.ProductVariantEntity;
import com.smartbuyai.exception.ResourceNotFoundException;
import com.smartbuyai.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public PagedResponse<ProductDto> getProducts(
            String gender,
            String categorySlug,
            String query,
            Long minPrice,
            Long maxPrice,
            String sortStr,
            int page,
            int size
    ) {
        Sort sort = Sort.by(Sort.Direction.ASC, "id");
        if ("newest".equalsIgnoreCase(sortStr)) {
            sort = Sort.by(Sort.Direction.DESC, "isNewDrop").and(Sort.by(Sort.Direction.DESC, "id"));
        } else if ("price-asc".equalsIgnoreCase(sortStr)) {
            sort = Sort.by(Sort.Direction.ASC, "price");
        } else if ("price-desc".equalsIgnoreCase(sortStr)) {
            sort = Sort.by(Sort.Direction.DESC, "price");
        } else if ("name-asc".equalsIgnoreCase(sortStr)) {
            sort = Sort.by(Sort.Direction.ASC, "name");
        } else if ("rating-desc".equalsIgnoreCase(sortStr)) {
            sort = Sort.by(Sort.Direction.DESC, "rating");
        }

        // Clean parameters
        String cleanGender = (gender != null && !gender.trim().isEmpty() && !"all".equalsIgnoreCase(gender)) ? gender.toLowerCase().trim() : null;
        String cleanCategory = (categorySlug != null && !categorySlug.trim().isEmpty() && !"all".equalsIgnoreCase(categorySlug)) ? categorySlug.trim() : null;
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ProductEntity> resultPage = productRepository.searchProducts(cleanGender, cleanCategory, cleanQuery, minPrice, maxPrice, pageable);

        List<ProductDto> dtos = resultPage.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return new PagedResponse<>(
                dtos,
                resultPage.getNumber(),
                resultPage.getSize(),
                resultPage.getTotalElements(),
                resultPage.getTotalPages(),
                resultPage.isLast()
        );
    }

    public ProductDto getProductById(String id) {
        if (id == null || id.isBlank()) {
            throw new ResourceNotFoundException("Mã sản phẩm không hợp lệ");
        }
        ProductEntity entity = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm có mã: " + id));
        return mapToDto(entity);
    }

    public ProductDto getProductBySlug(String slug) {
        if (slug == null || slug.isBlank()) {
            throw new ResourceNotFoundException("Slug sản phẩm không hợp lệ");
        }
        ProductEntity entity = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với slug: " + slug));
        return mapToDto(entity);
    }

    @Transactional
    public ProductDto updateProductPriceAndStock(String id, Long newPrice, Integer newStock) {
        if (id == null || id.isBlank()) {
            throw new ResourceNotFoundException("Mã sản phẩm không hợp lệ");
        }
        ProductEntity entity = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm để cập nhật giá: " + id));

        if (newPrice != null && newPrice > 0) {
            entity.setPrice(newPrice);
            entity.setApprovedPrice(newPrice);
            entity.setPriceStatus("approved");
            for (ProductVariantEntity v : entity.getVariants()) {
                v.setPrice(newPrice);
            }
        }

        if (newStock != null && newStock >= 0) {
            for (ProductVariantEntity v : entity.getVariants()) {
                v.setStock(newStock);
            }
        }

        ProductEntity saved = productRepository.save(Objects.requireNonNull(entity));
        return mapToDto(saved);
    }

    public List<ProductDto> getNewArrivals() {
        return productRepository.findTop8ByIsActiveTrueAndIsNewDropTrueOrderByPriceAsc()
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<ProductDto> getBestSellers() {
        return productRepository.findTop8ByIsActiveTrueAndIsBestSellerTrueOrderByRatingDesc()
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public ProductDto mapToDto(ProductEntity entity) {
        if (entity == null) return null;
        ProductDto dto = new ProductDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setSlug(entity.getSlug());
        dto.setCategorySlug(entity.getCategorySlug());
        dto.setGender(entity.getGender());
        dto.setBrand(entity.getBrand());
        dto.setPrice(entity.getPrice());
        dto.setOriginalPrice(entity.getOriginalPrice());
        dto.setCostPrice(entity.getCostPrice());
        dto.setSuggestedPrice(entity.getSuggestedPrice());
        dto.setApprovedPrice(entity.getApprovedPrice());
        dto.setPriceStatus(entity.getPriceStatus());
        dto.setShortDescription(entity.getShortDescription());
        dto.setDescription(entity.getDescription());
        dto.setMaterial(entity.getMaterial());
        dto.setFit(entity.getFit());
        dto.setStyle(entity.getStyle());
        dto.setSeason(entity.getSeason());
        dto.setRating(entity.getRating());
        dto.setReviewCount(entity.getReviewCount());
        dto.setIsActive(entity.getIsActive());
        dto.setIsNewDrop(entity.getIsNewDrop());
        dto.setIsBestSeller(entity.getIsBestSeller());
        dto.setFolderKey(entity.getFolderKey());
        dto.setModelFolder(entity.getModelFolder());

        List<String> images = entity.getImages() != null ? entity.getImages().stream()
                .filter(Objects::nonNull)
                .map(img -> img.getImageUrl())
                .filter(Objects::nonNull)
                .collect(Collectors.toList()) : Collections.emptyList();
        dto.setImages(images);

        List<ProductDto.VariantDto> variants = entity.getVariants() != null ? entity.getVariants().stream()
                .filter(Objects::nonNull)
                .map(v -> new ProductDto.VariantDto(
                        v.getId(),
                        v.getSku(),
                        v.getSize(),
                        new ProductDto.ColorDto(v.getColorName(), v.getColorHex(), v.getColorSlug()),
                        v.getPrice(),
                        v.getOriginalPrice(),
                        v.getStock(),
                        v.getImageUrl()
                ))
                .collect(Collectors.toList()) : Collections.emptyList();
        dto.setVariants(variants);

        return dto;
    }
}
