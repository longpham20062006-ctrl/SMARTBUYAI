package com.smartbuyai.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tryon_jobs")
public class TryOnJobEntity {

    @Id
    @Column(name = "job_id", length = 64)
    private String jobId;

    @Column(name = "user_id", length = 64)
    private String userId;

    @Column(name = "garment_id", length = 64)
    private String garmentId;

    @Column(name = "garment_name")
    private String garmentName;

    @Column(name = "category", length = 64)
    private String category = "upper_body";

    @Column(name = "person_image_path", length = 512)
    private String personImagePath;

    @Column(name = "garment_image_path", length = 512)
    private String garmentImagePath;

    @Column(name = "result_image_url", length = 512)
    private String resultImageUrl;

    @Column(name = "status", length = 32)
    private String status = "QUEUED"; // 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public TryOnJobEntity() {}

    public TryOnJobEntity(String jobId, String userId, String garmentId, String garmentName, String category) {
        this.jobId = jobId;
        this.userId = userId;
        this.garmentId = garmentId;
        this.garmentName = garmentName;
        this.category = category;
        this.status = "QUEUED";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getGarmentId() { return garmentId; }
    public void setGarmentId(String garmentId) { this.garmentId = garmentId; }

    public String getGarmentName() { return garmentName; }
    public void setGarmentName(String garmentName) { this.garmentName = garmentName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getPersonImagePath() { return personImagePath; }
    public void setPersonImagePath(String personImagePath) { this.personImagePath = personImagePath; }

    public String getGarmentImagePath() { return garmentImagePath; }
    public void setGarmentImagePath(String garmentImagePath) { this.garmentImagePath = garmentImagePath; }

    public String getResultImageUrl() { return resultImageUrl; }
    public void setResultImageUrl(String resultImageUrl) { this.resultImageUrl = resultImageUrl; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
