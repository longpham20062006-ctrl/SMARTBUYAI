package com.smartbuyai.service;

import com.smartbuyai.dto.TryOnRequest;
import com.smartbuyai.dto.TryOnResponse;
import com.smartbuyai.dto.TryOnStatusResponse;
import com.smartbuyai.entity.ProductEntity;
import com.smartbuyai.entity.TryOnJobEntity;
import com.smartbuyai.exception.ResourceNotFoundException;
import com.smartbuyai.repository.ProductRepository;
import com.smartbuyai.repository.TryOnJobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class AiTryOnService {

    private static final Logger log = LoggerFactory.getLogger(AiTryOnService.class);

    private final TryOnJobRepository tryOnJobRepository;
    private final ProductRepository productRepository;
    private final RestTemplate restTemplate;

    @Value("${app.ai.tryon-server-url:http://localhost:8000}")
    private String tryonServerUrl;

    public AiTryOnService(TryOnJobRepository tryOnJobRepository, ProductRepository productRepository, RestTemplateBuilder restTemplateBuilder) {
        this.tryOnJobRepository = tryOnJobRepository;
        this.productRepository = productRepository;
        this.restTemplate = restTemplateBuilder
                .connectTimeout(Duration.ofSeconds(5))
                .readTimeout(Duration.ofSeconds(60))
                .build();
    }

    public TryOnResponse submitTryOnJob(TryOnRequest req, String userId) {
        String jobId = "job_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);

        String garmentName = "Trang phục SMARTBUY AI";
        String garmentImage = req.getGarmentImageUrl();

        if (req.getGarmentId() != null) {
            ProductEntity product = productRepository.findById(req.getGarmentId()).orElse(null);
            if (product != null) {
                garmentName = product.getName();
                if (garmentImage == null || garmentImage.isBlank()) {
                    if (!product.getImages().isEmpty()) {
                        garmentImage = product.getImages().get(0).getImageUrl();
                    }
                }
            }
        }

        TryOnJobEntity job = new TryOnJobEntity(jobId, userId, req.getGarmentId(), garmentName, req.getCategory());
        job.setPersonImagePath(req.getPersonImageUrl());
        job.setGarmentImagePath(garmentImage);
        job.setStatus("QUEUED");
        tryOnJobRepository.save(job);

        // Asynchronously forward job to Python AI Worker
        dispatchToPythonWorker(jobId, req.getPersonImageUrl(), garmentImage, req.getCategory(), req.getGarmentId(), garmentName);

        return new TryOnResponse(
                true,
                jobId,
                "QUEUED",
                "Tác vụ thử đồ đã được tiếp nhận bởi Java Backend và đưa vào hàng đợi AI RTX 3060.",
                "/api/v1/ai/try-on/" + jobId
        );
    }

    @Async
    public void dispatchToPythonWorker(String jobId, String personImageUrl, String garmentImageUrl, String category, String garmentId, String garmentName) {
        try {
            log.info("Java Backend gửi yêu cầu thử đồ tới Python AI Worker ({}/try-on) cho job: {}", tryonServerUrl, jobId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("person_image_url", personImageUrl);
            map.add("top_garment_url", garmentImageUrl);
            map.add("category", category != null ? category : "upper_body");
            map.add("garment_id", garmentId);
            map.add("garment_name", garmentName);
            map.add("request_id", jobId);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
            ParameterizedTypeReference<Map<String, Object>> typeRef = new ParameterizedTypeReference<>() {};
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    tryonServerUrl + "/try-on",
                    HttpMethod.POST,
                    request,
                    typeRef
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String aiJobId = (String) response.getBody().get("job_id");
                log.info("Python AI Server đã tiếp nhận tác vụ, AI Job ID: {}", aiJobId);
                updateJobStatus(jobId, "PROCESSING", null, null);
            }
        } catch (Exception e) {
            log.warn("Python AI Worker ({}) hiện chưa online hoặc gặp lỗi: {}. Java Backend bảo toàn trạng thái an toàn.", tryonServerUrl, e.getMessage());
            updateJobStatus(jobId, "PROCESSING", null, null);
        }
    }

    @Transactional(readOnly = true)
    public TryOnStatusResponse getJobStatus(String jobId) {
        TryOnJobEntity job = tryOnJobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tác vụ thử đồ: " + jobId));

        // If in PROCESSING, poll python worker if needed
        if ("PROCESSING".equalsIgnoreCase(job.getStatus())) {
            try {
                ParameterizedTypeReference<Map<String, Object>> typeRef = new ParameterizedTypeReference<>() {};
                ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                        tryonServerUrl + "/jobs/" + jobId,
                        HttpMethod.GET,
                        null,
                        typeRef
                );
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    String workerStatus = (String) response.getBody().get("status");
                    String resultUrl = (String) response.getBody().get("result_image_url");
                    if ("completed".equalsIgnoreCase(workerStatus)) {
                        job.setStatus("COMPLETED");
                        job.setResultImageUrl(resultUrl);
                        tryOnJobRepository.save(job);
                    } else if ("failed".equalsIgnoreCase(workerStatus)) {
                        job.setStatus("FAILED");
                        job.setErrorMessage((String) response.getBody().get("error"));
                        tryOnJobRepository.save(job);
                    }
                }
            } catch (Exception ignored) {
                // Keep current state
            }
        }

        TryOnStatusResponse resp = new TryOnStatusResponse();
        resp.setJobId(job.getJobId());
        resp.setStatus(job.getStatus());
        resp.setGarmentId(job.getGarmentId());
        resp.setGarmentName(job.getGarmentName());
        resp.setCategory(job.getCategory());
        resp.setResultImageUrl(job.getResultImageUrl());
        resp.setErrorMessage(job.getErrorMessage());
        return resp;
    }

    private void updateJobStatus(String jobId, String status, String resultImageUrl, String errorMessage) {
        tryOnJobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus(status);
            if (resultImageUrl != null) job.setResultImageUrl(resultImageUrl);
            if (errorMessage != null) job.setErrorMessage(errorMessage);
            job.setUpdatedAt(LocalDateTime.now());
            tryOnJobRepository.save(job);
        });
    }
}
