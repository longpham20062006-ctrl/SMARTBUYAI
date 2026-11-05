package com.smartbuyai.dto;

public class TryOnResponse {
    private boolean success;
    private String jobId;
    private String status;
    private String message;
    private String statusUrl;

    public TryOnResponse() {}

    public TryOnResponse(boolean success, String jobId, String status, String message, String statusUrl) {
        this.success = success;
        this.jobId = jobId;
        this.status = status;
        this.message = message;
        this.statusUrl = statusUrl;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getStatusUrl() { return statusUrl; }
    public void setStatusUrl(String statusUrl) { this.statusUrl = statusUrl; }
}
