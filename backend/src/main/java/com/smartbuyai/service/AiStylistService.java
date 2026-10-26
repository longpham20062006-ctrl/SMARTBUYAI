package com.smartbuyai.service;

import com.smartbuyai.dto.ProductDto;
import com.smartbuyai.dto.StylistRequest;
import com.smartbuyai.dto.StylistResponse;
import com.smartbuyai.entity.ProductEntity;
import com.smartbuyai.repository.ProductRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AiStylistService {

    private final ProductRepository productRepository;
    private final ProductService productService;

    public AiStylistService(ProductRepository productRepository, ProductService productService) {
        this.productRepository = productRepository;
        this.productService = productService;
    }

    public StylistResponse generateOutfit(StylistRequest req) {
        String prompt = req.getPrompt() != null ? req.getPrompt().toLowerCase().trim() : "";
        String gender = req.getGender() != null && !req.getGender().isBlank() ? req.getGender().toLowerCase().trim() : null;

        // Detect keywords from prompt
        boolean isWinter = prompt.contains("đông") || prompt.contains("lạnh") || prompt.contains("ấm");
        boolean isSchool = prompt.contains("học") || prompt.contains("giản dị") || prompt.contains("sinh viên");
        boolean isStreet = prompt.contains("phố") || prompt.contains("chất") || prompt.contains("ngầu") || prompt.contains("streetwear");

        // Select top/outerwear from real catalog
        List<ProductEntity> tops = productRepository.searchProducts(
                gender,
                isWinter ? "ao-khoac" : (isSchool ? "polo" : "ao-thun"),
                null, null, req.getMaxBudget(),
                PageRequest.of(0, 5)
        ).getContent();

        // Select bottom
        List<ProductEntity> bottoms = productRepository.searchProducts(
                gender,
                "quan-dai",
                null, null, req.getMaxBudget(),
                PageRequest.of(0, 5)
        ).getContent();

        // Select accessory / layer
        List<ProductEntity> accessories = productRepository.searchProducts(
                null,
                "phu-kien",
                null, null, req.getMaxBudget(),
                PageRequest.of(0, 5)
        ).getContent();

        List<ProductDto> recommended = new ArrayList<>();
        long totalEstimated = 0L;

        if (!tops.isEmpty()) {
            ProductDto top = productService.mapToDto(tops.get(0));
            recommended.add(top);
            totalEstimated += top.getPrice();
        }
        if (!bottoms.isEmpty()) {
            ProductDto bottom = productService.mapToDto(bottoms.get(0));
            recommended.add(bottom);
            totalEstimated += bottom.getPrice();
        }
        if (!accessories.isEmpty() && (req.getMaxBudget() == null || totalEstimated + accessories.get(0).getPrice() <= req.getMaxBudget())) {
            ProductDto acc = productService.mapToDto(accessories.get(0));
            recommended.add(acc);
            totalEstimated += acc.getPrice();
        }

        String detectedText = !prompt.isEmpty() ? prompt : "phong cách Gen Z Streetwear hàng ngày";
        String explanation = String.format(
                "Dựa trên yêu cầu của bạn (%s), SMARTBUY AI Stylist đề xuất %d sản phẩm hot trend giá học sinh sinh viên phù hợp nhất từ catalog chính hãng:",
                detectedText, recommended.size()
        );

        String advice = "💡 Tips phối đồ: Kết hợp phom áo Boxy / Oversized với quần ống suông để hack dáng tự nhiên. Đi kèm giày sneaker thể thao hoặc chunky slides để tạo điểm nhấn chuẩn gu đường phố.";

        return new StylistResponse(explanation, advice, totalEstimated, recommended);
    }
}
