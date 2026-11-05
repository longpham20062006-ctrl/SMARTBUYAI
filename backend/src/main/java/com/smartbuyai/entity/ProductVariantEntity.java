package com.smartbuyai.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "product_variants")
public class ProductVariantEntity {

    @Id
    @Column(name = "id", length = 128)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private ProductEntity product;

    @Column(name = "sku", length = 128)
    private String sku;

    @Column(name = "size", length = 32)
    private String size;

    @Column(name = "color_name", length = 64)
    private String colorName;

    @Column(name = "color_hex", length = 32)
    private String colorHex;

    @Column(name = "color_slug", length = 64)
    private String colorSlug;

    @Column(name = "price")
    private Long price;

    @Column(name = "original_price")
    private Long originalPrice;

    @Column(name = "stock")
    private Integer stock = 10;

    @Column(name = "image_url", length = 512)
    private String imageUrl;

    public ProductVariantEntity() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public ProductEntity getProduct() { return product; }
    public void setProduct(ProductEntity product) { this.product = product; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getColorName() { return colorName; }
    public void setColorName(String colorName) { this.colorName = colorName; }

    public String getColorHex() { return colorHex; }
    public void setColorHex(String colorHex) { this.colorHex = colorHex; }

    public String getColorSlug() { return colorSlug; }
    public void setColorSlug(String colorSlug) { this.colorSlug = colorSlug; }

    public Long getPrice() { return price; }
    public void setPrice(Long price) { this.price = price; }

    public Long getOriginalPrice() { return originalPrice; }
    public void setOriginalPrice(Long originalPrice) { this.originalPrice = originalPrice; }

    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
