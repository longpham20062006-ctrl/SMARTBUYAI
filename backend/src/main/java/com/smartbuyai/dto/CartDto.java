package com.smartbuyai.dto;

import java.util.ArrayList;
import java.util.List;

public class CartDto {
    private String id;
    private String userId;
    private List<CartItemDto> items = new ArrayList<>();
    private Long subtotal = 0L;
    private Long total = 0L;
    private Integer totalQuantity = 0;

    public CartDto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public List<CartItemDto> getItems() { return items; }
    public void setItems(List<CartItemDto> items) { this.items = items; }
    public Long getSubtotal() { return subtotal; }
    public void setSubtotal(Long subtotal) { this.subtotal = subtotal; }
    public Long getTotal() { return total; }
    public void setTotal(Long total) { this.total = total; }
    public Integer getTotalQuantity() { return totalQuantity; }
    public void setTotalQuantity(Integer totalQuantity) { this.totalQuantity = totalQuantity; }
}
