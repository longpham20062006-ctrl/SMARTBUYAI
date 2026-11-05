package com.smartbuyai.service;

import com.smartbuyai.dto.TryOnRequest;
import com.smartbuyai.dto.TryOnResponse;
import com.smartbuyai.dto.TryOnStatusResponse;
import com.smartbuyai.entity.ProductEntity;
import com.smartbuyai.entity.TryOnJobEntity;
import com.smartbuyai.exception.ResourceNotFoundException;
import com.smartbuyai.repository.ProductRepository;
import com.smartbuyai.repository.TryOnJobRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.web.client.RestTemplateBuilder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiTryOnServiceTest {

    @Mock
    private TryOnJobRepository tryOnJobRepository;

    @Mock
    private ProductRepository productRepository;

    private AiTryOnService aiTryOnService;

    @BeforeEach
    void setUp() {
        RestTemplateBuilder restTemplateBuilder = new RestTemplateBuilder();
        aiTryOnService = new AiTryOnService(tryOnJobRepository, productRepository, restTemplateBuilder);
    }

    @org.springframework.lang.NonNull
    private static <T> T nonNull(@org.springframework.lang.NonNull T obj) {
        return obj;
    }

    @Test
    @DisplayName("Submit Try-On Job: Thành công tạo job trong hàng đợi với thông tin sản phẩm")
    void testSubmitTryOnJob_Success() {
        ProductEntity mockProduct = new ProductEntity();
        mockProduct.setId("W-DRESS-001");
        mockProduct.setName("Đầm Dạ Hội Cúp Ngực Phối Ren");

        when(productRepository.findById("W-DRESS-001")).thenReturn(Optional.of(mockProduct));
        when(tryOnJobRepository.save(nonNull(any(TryOnJobEntity.class)))).thenAnswer(i -> i.getArgument(0));

        TryOnRequest req = new TryOnRequest();
        req.setGarmentId("W-DRESS-001");
        req.setPersonImageUrl("/uploads/model.jpg");
        req.setCategory("dresses");

        TryOnResponse response = aiTryOnService.submitTryOnJob(req, "user_demo_01");

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals("QUEUED", response.getStatus());
        assertNotNull(response.getJobId());

        ArgumentCaptor<TryOnJobEntity> captor = ArgumentCaptor.forClass(TryOnJobEntity.class);
        verify(tryOnJobRepository, atLeastOnce()).save(nonNull(captor.capture()));
        TryOnJobEntity savedJob = captor.getValue();
        assertEquals("W-DRESS-001", savedJob.getGarmentId());
        assertEquals("Đầm Dạ Hội Cúp Ngực Phối Ren", savedJob.getGarmentName());
        assertEquals("QUEUED", savedJob.getStatus());
    }

    @Test
    @DisplayName("Get Job Status: Trả về trạng thái của job hợp lệ")
    void testGetJobStatus_ExistingJob() {
        TryOnJobEntity existingJob = new TryOnJobEntity("job_test123", "user_demo", "W-DRESS-001", "Đầm Dạ Hội", "dresses");
        existingJob.setStatus("COMPLETED");
        existingJob.setResultImageUrl("http://localhost:8000/results/job_test123.jpg");

        when(tryOnJobRepository.findById("job_test123")).thenReturn(Optional.of(existingJob));

        TryOnStatusResponse status = aiTryOnService.getJobStatus("job_test123");

        assertNotNull(status);
        assertEquals("job_test123", status.getJobId());
        assertEquals("COMPLETED", status.getStatus());
        assertEquals("http://localhost:8000/results/job_test123.jpg", status.getResultImageUrl());
    }

    @Test
    @DisplayName("Get Job Status: Quăng ResourceNotFoundException khi không tìm thấy job")
    void testGetJobStatus_NotFound() {
        when(tryOnJobRepository.findById("job_not_found")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            aiTryOnService.getJobStatus("job_not_found");
        });
    }

    @Test
    @DisplayName("Get Job Status: Quăng ResourceNotFoundException khi jobId null hoặc rỗng")
    void testGetJobStatus_InvalidId() {
        assertThrows(ResourceNotFoundException.class, () -> {
            aiTryOnService.getJobStatus("");
        });
        assertThrows(ResourceNotFoundException.class, () -> {
            aiTryOnService.getJobStatus("   ");
        });
    }
}

