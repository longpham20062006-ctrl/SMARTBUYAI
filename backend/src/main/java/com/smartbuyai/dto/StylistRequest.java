package com.smartbuyai.dto;


public class StylistRequest {
    private String prompt;
    private String gender; // 'nam' | 'nu' | 'unisex'
    private Long maxBudget;
    private String style; // 'streetwear', 'korean', 'y2k', 'minimalist'
    private String occasion;

    public StylistRequest() {}

    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public Long getMaxBudget() { return maxBudget; }
    public void setMaxBudget(Long maxBudget) { this.maxBudget = maxBudget; }
    public String getStyle() { return style; }
    public void setStyle(String style) { this.style = style; }
    public String getOccasion() { return occasion; }
    public void setOccasion(String occasion) { this.occasion = occasion; }
}
