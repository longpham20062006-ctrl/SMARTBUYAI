package com.smartbuyai.dto;

public class TryOnRequest {
    private String personImageUrl;
    private String garmentId;
    private String garmentImageUrl;
    private String category = "upper_body"; // 'upper_body', 'lower_body', 'outerwear', 'dresses'

    public TryOnRequest() {}

    public String getPersonImageUrl() { return personImageUrl; }
    public void setPersonImageUrl(String personImageUrl) { this.personImageUrl = personImageUrl; }
    public String getGarmentId() { return garmentId; }
    public void setGarmentId(String garmentId) { this.garmentId = garmentId; }
    public String getGarmentImageUrl() { return garmentImageUrl; }
    public void setGarmentImageUrl(String garmentImageUrl) { this.garmentImageUrl = garmentImageUrl; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}
