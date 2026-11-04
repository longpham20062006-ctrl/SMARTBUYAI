package com.smartbuyai.dto;

import java.util.List;

public class ChatResponse {
    private String text;
    private List<ProductDto> recommendedProducts;
    private OutfitBreakdownDto outfitBreakdown;
    private List<String> quickReplies;
    private String provider; // "gemini-1.5-flash", "openai", "smartbuy-native-rag"
    private String sessionId;
    private boolean requiresAuth;

    public ChatResponse() {}

    public ChatResponse(String text, List<ProductDto> recommendedProducts, List<String> quickReplies, String provider, String sessionId) {
        this.text = text;
        this.recommendedProducts = recommendedProducts;
        this.quickReplies = quickReplies;
        this.provider = provider;
        this.sessionId = sessionId;
        this.requiresAuth = false;
    }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public List<ProductDto> getRecommendedProducts() { return recommendedProducts; }
    public void setRecommendedProducts(List<ProductDto> recommendedProducts) { this.recommendedProducts = recommendedProducts; }
    public OutfitBreakdownDto getOutfitBreakdown() { return outfitBreakdown; }
    public void setOutfitBreakdown(OutfitBreakdownDto outfitBreakdown) { this.outfitBreakdown = outfitBreakdown; }
    public List<String> getQuickReplies() { return quickReplies; }
    public void setQuickReplies(List<String> quickReplies) { this.quickReplies = quickReplies; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public boolean isRequiresAuth() { return requiresAuth; }
    public void setRequiresAuth(boolean requiresAuth) { this.requiresAuth = requiresAuth; }
}

