package com.smartbuyai.dto;

public class OutfitBreakdownDto {
    private ProductDto top;
    private ProductDto bottom;
    private ProductDto accessory;
    private Long totalPrice;
    private Long maxBudget;
    private boolean withinBudget;
    private String style;
    private String occasion;
    private String stylingRationale;

    public OutfitBreakdownDto() {}

    public ProductDto getTop() { return top; }
    public void setTop(ProductDto top) { this.top = top; }
    public ProductDto getBottom() { return bottom; }
    public void setBottom(ProductDto bottom) { this.bottom = bottom; }
    public ProductDto getAccessory() { return accessory; }
    public void setAccessory(ProductDto accessory) { this.accessory = accessory; }
    public Long getTotalPrice() { return totalPrice; }
    public void setTotalPrice(Long totalPrice) { this.totalPrice = totalPrice; }
    public Long getMaxBudget() { return maxBudget; }
    public void setMaxBudget(Long maxBudget) { this.maxBudget = maxBudget; }
    public boolean isWithinBudget() { return withinBudget; }
    public void setWithinBudget(boolean withinBudget) { this.withinBudget = withinBudget; }
    public String getStyle() { return style; }
    public void setStyle(String style) { this.style = style; }
    public String getOccasion() { return occasion; }
    public void setOccasion(String occasion) { this.occasion = occasion; }
    public String getStylingRationale() { return stylingRationale; }
    public void setStylingRationale(String stylingRationale) { this.stylingRationale = stylingRationale; }
}
