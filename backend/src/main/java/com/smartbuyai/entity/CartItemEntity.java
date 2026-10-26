package com.smartbuyai.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "cart_items")
public class CartItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private CartEntity cart;

    @Column(name = "product_id", nullable = false, length = 64)
    private String productId;

    @Column(name = "product_slug", length = 256)
    private String productSlug;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "brand", length = 64)
    private String brand;

    @Column(name = "image_url", length = 512)
    private String imageUrl;

    @Column(name = "variant_id", length = 128)
    private String variantId;

    @Column(name = "color_name", length = 64)
    private String colorName;

    @Column(name = "color_hex", length = 32)
    private String colorHex;

    @Column(name = "size", length = 32)
    private String size;

    @Column(name = "price", nullable = false)
    private Long price;

    @Column(name = "original_price")
    private Long originalPrice;

    @Column(name = "quantity", nullable = false)
    private Integer quantity = 1;

    public CartItemEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CartEntity getCart() { return cart; }
    public void setCart(CartEntity cart) { this.cart = cart; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public String getProductSlug() { return productSlug; }
    public void setProductSlug(String productSlug) { this.productSlug = productSlug; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getVariantId() { return variantId; }
    public void setVariantId(String variantId) { this.variantId = variantId; }

    public String getColorName() { return colorName; }
    public void setColorName(String colorName) { this.colorName = colorName; }

    public String getColorHex() { return colorHex; }
    public void setColorHex(String colorHex) { this.colorHex = colorHex; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public Long getPrice() { return price; }
    public void setPrice(Long price) { this.price = price; }

    public Long getOriginalPrice() { return originalPrice; }
    public void setOriginalPrice(Long originalPrice) { this.originalPrice = originalPrice; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
