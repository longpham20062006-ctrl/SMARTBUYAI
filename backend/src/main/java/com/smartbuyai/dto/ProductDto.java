package com.smartbuyai.dto;

import java.util.List;

public class ProductDto {
    private String id;
    private String name;
    private String slug;
    private String categorySlug;
    private String gender;
    private String brand;
    private Long price;
    private Long originalPrice;
    private Long costPrice;
    private Long suggestedPrice;
    private Long approvedPrice;
    private String priceStatus;
    private String shortDescription;
    private String description;
    private String material;
    private String fit;
    private String style;
    private String season;
    private Double rating;
    private Integer reviewCount;
    private Boolean isActive;
    private Boolean isNewDrop;
    private Boolean isBestSeller;
    private String folderKey;
    private String modelFolder;
    private List<String> images;
    private List<VariantDto> variants;

    public static class VariantDto {
        private String id;
        private String sku;
        private String size;
        private ColorDto color;
        private Long price;
        private Long originalPrice;
        private Integer stock;
        private String image;

        public VariantDto() {}

        public VariantDto(String id, String sku, String size, ColorDto color, Long price, Long originalPrice, Integer stock, String image) {
            this.id = id;
            this.sku = sku;
            this.size = size;
            this.color = color;
            this.price = price;
            this.originalPrice = originalPrice;
            this.stock = stock;
            this.image = image;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getSku() { return sku; }
        public void setSku(String sku) { this.sku = sku; }
        public String getSize() { return size; }
        public void setSize(String size) { this.size = size; }
        public ColorDto getColor() { return color; }
        public void setColor(ColorDto color) { this.color = color; }
        public Long getPrice() { return price; }
        public void setPrice(Long price) { this.price = price; }
        public Long getOriginalPrice() { return originalPrice; }
        public void setOriginalPrice(Long originalPrice) { this.originalPrice = originalPrice; }
        public Integer getStock() { return stock; }
        public void setStock(Integer stock) { this.stock = stock; }
        public String getImage() { return image; }
        public void setImage(String image) { this.image = image; }
    }

    public static class ColorDto {
        private String name;
        private String hex;
        private String slug;

        public ColorDto() {}
        public ColorDto(String name, String hex, String slug) {
            this.name = name;
            this.hex = hex;
            this.slug = slug;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getHex() { return hex; }
        public void setHex(String hex) { this.hex = hex; }
        public String getSlug() { return slug; }
        public void setSlug(String slug) { this.slug = slug; }
    }

    public ProductDto() {}

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
    public String getFolderKey() { return folderKey; }
    public void setFolderKey(String folderKey) { this.folderKey = folderKey; }
    public String getModelFolder() { return modelFolder; }
    public void setModelFolder(String modelFolder) { this.modelFolder = modelFolder; }
    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images; }
    public List<VariantDto> getVariants() { return variants; }
    public void setVariants(List<VariantDto> variants) { this.variants = variants; }
}
