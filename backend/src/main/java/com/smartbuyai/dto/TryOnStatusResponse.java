package com.smartbuyai.dto;

public class TryOnStatusResponse {
    private String jobId;
    private String status;
    private String garmentId;
    private String garmentName;
    private String category;
    private String resultImageUrl;
    private String errorMessage;

    public TryOnStatusResponse() {}

    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getGarmentId() { return garmentId; }
    public void setGarmentId(String garmentId) { this.garmentId = garmentId; }
    public String getGarmentName() { return garmentName; }
    public void setGarmentName(String garmentName) { this.garmentName = garmentName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getResultImageUrl() { return resultImageUrl; }
    public void setResultImageUrl(String resultImageUrl) { this.resultImageUrl = resultImageUrl; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}
