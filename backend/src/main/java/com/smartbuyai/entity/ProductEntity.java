package com.smartbuyai.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
public class ProductEntity {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "slug", nullable = false, unique = true)
    private String slug;

    @Column(name = "category_slug", nullable = false, length = 64)
    private String categorySlug;

    @Column(name = "gender", nullable = false, length = 32)
    private String gender; // 'nam', 'nu', 'unisex'

    @Column(name = "brand", length = 64)
    private String brand = "SMARTBUY AI";

    @Column(name = "price", nullable = false)
    private Long price;

    @Column(name = "original_price")
    private Long originalPrice;

    @Column(name = "cost_price")
    private Long costPrice;

    @Column(name = "suggested_price")
    private Long suggestedPrice;

    @Column(name = "approved_price")
    private Long approvedPrice;

    @Column(name = "price_status", length = 32)
    private String priceStatus = "approved";

    @Column(name = "folder_key", length = 256)
    private String folderKey;

    @Column(name = "model_folder", length = 128)
    private String modelFolder;

    @Column(name = "short_description", columnDefinition = "TEXT")
    private String shortDescription;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "material", length = 256)
    private String material;

    @Column(name = "fit", length = 128)
    private String fit;

    @Column(name = "style", length = 128)
    private String style;

    @Column(name = "season", length = 64)
    private String season;

    @Column(name = "rating")
    private Double rating = 4.8;

    @Column(name = "review_count")
    private Integer reviewCount = 0;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "is_new_drop")
    private Boolean isNewDrop = false;

    @Column(name = "is_best_seller")
    private Boolean isBestSeller = false;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    private List<ProductImageEntity> images = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ProductVariantEntity> variants = new ArrayList<>();

    public ProductEntity() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getCategorySlug() { return categorySlug; }
    public void setCategorySlug(String categorySlug) { this.categorySlug = categorySlug; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public Long getPrice() { return price; }
    public void setPrice(Long price) { this.price = price; }

    public Long getOriginalPrice() { return originalPrice; }
    public void setOriginalPrice(Long originalPrice) { this.originalPrice = originalPrice; }

    public Long getCostPrice() { return costPrice; }
    public void setCostPrice(Long costPrice) { this.costPrice = costPrice; }

    public Long getSuggestedPrice() { return suggestedPrice; }
    public void setSuggestedPrice(Long suggestedPrice) { this.suggestedPrice = suggestedPrice; }

    public Long getApprovedPrice() { return approvedPrice; }
    public void setApprovedPrice(Long approvedPrice) { this.approvedPrice = approvedPrice; }

    public String getPriceStatus() { return priceStatus; }
    public void setPriceStatus(String priceStatus) { this.priceStatus = priceStatus; }

    public String getFolderKey() { return folderKey; }
    public void setFolderKey(String folderKey) { this.folderKey = folderKey; }

    public String getModelFolder() { return modelFolder; }
    public void setModelFolder(String modelFolder) { this.modelFolder = modelFolder; }

    public String getShortDescription() { return shortDescription; }
    public void setShortDescription(String shortDescription) { this.shortDescription = shortDescription; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getMaterial() { return material; }
    public void setMaterial(String material) { this.material = material; }

    public String getFit() { return fit; }
    public void setFit(String fit) { this.fit = fit; }

    public String getStyle() { return style; }
    public void setStyle(String style) { this.style = style; }

    public String getSeason() { return season; }
    public void setSeason(String season) { this.season = season; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public Integer getReviewCount() { return reviewCount; }
    public void setReviewCount(Integer reviewCount) { this.reviewCount = reviewCount; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Boolean getIsNewDrop() { return isNewDrop; }
    public void setIsNewDrop(Boolean isNewDrop) { this.isNewDrop = isNewDrop; }

    public Boolean getIsBestSeller() { return isBestSeller; }
    public void setIsBestSeller(Boolean isBestSeller) { this.isBestSeller = isBestSeller; }

    public List<ProductImageEntity> getImages() { return images; }
    public void setImages(List<ProductImageEntity> images) { this.images = images; }

    public List<ProductVariantEntity> getVariants() { return variants; }
    public void setVariants(List<ProductVariantEntity> variants) { this.variants = variants; }
}
