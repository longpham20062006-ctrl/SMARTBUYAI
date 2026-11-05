package com.smartbuyai.dto;

import java.util.List;

public class StylistResponse {
    private String explanation;
    private String advice;
    private Long totalEstimatedPrice;
    private List<ProductDto> recommendedProducts;

    public StylistResponse() {}

    public StylistResponse(String explanation, String advice, Long totalEstimatedPrice, List<ProductDto> recommendedProducts) {
        this.explanation = explanation;
        this.advice = advice;
        this.totalEstimatedPrice = totalEstimatedPrice;
        this.recommendedProducts = recommendedProducts;
    }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
    public String getAdvice() { return advice; }
    public void setAdvice(String advice) { this.advice = advice; }
    public Long getTotalEstimatedPrice() { return totalEstimatedPrice; }
    public void setTotalEstimatedPrice(Long totalEstimatedPrice) { this.totalEstimatedPrice = totalEstimatedPrice; }
    public List<ProductDto> getRecommendedProducts() { return recommendedProducts; }
    public void setRecommendedProducts(List<ProductDto> recommendedProducts) { this.recommendedProducts = recommendedProducts; }
}
