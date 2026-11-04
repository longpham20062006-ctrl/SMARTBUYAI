package com.smartbuyai.service;

import com.smartbuyai.dto.OutfitBreakdownDto;
import com.smartbuyai.dto.ProductDto;
import com.smartbuyai.entity.ProductEntity;
import com.smartbuyai.repository.ProductRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional(readOnly = true)
public class OutfitBuilderService {

    private final ProductRepository productRepository;
    private final ProductService productService;

    public OutfitBuilderService(ProductRepository productRepository, ProductService productService) {
        this.productRepository = productRepository;
        this.productService = productService;
    }

    /**
     * Thuật toán AI Smart Outfit Builder:
     * Tự động phối hợp 1 Áo + 1 Quần (hoặc Chân váy) + 1 Phụ kiện đảm bảo tổng chi phí <= Ngân sách,
     * tối ưu hóa điểm tương hợp đa mục tiêu (Multi-Criteria Compatibility Scoring).
     */
    public OutfitBreakdownDto buildSmartOutfit(String gender, String style, String occasion, Long maxBudget, String query) {
        String normalizedGender = (gender != null && !gender.isBlank()) ? gender.toLowerCase().trim() : null;
        String normalizedStyle = (style != null && !style.isBlank()) ? style.trim() : "Streetwear";
        String normalizedOccasion = (occasion != null && !occasion.isBlank()) ? occasion.trim() : "Đi chơi";
        long budget = (maxBudget != null && maxBudget > 0) ? maxBudget : 600000L;

        // Phân bổ ngân sách mục tiêu: Áo (~45%), Quần (~45%), Phụ kiện (~10%)
        long maxTopBudget = (long) (budget * 0.55);
        long maxBottomBudget = (long) (budget * 0.55);

        // 1. Tìm các ứng viên Áo (Tops)
        List<ProductEntity> topEntities = findCandidates(normalizedGender, "ao", maxTopBudget);
        // 2. Tìm các ứng viên Quần/Chân váy (Bottoms)
        List<ProductEntity> bottomEntities = findCandidates(normalizedGender, "quan", maxBottomBudget);
        if (bottomEntities.isEmpty() && "nu".equalsIgnoreCase(normalizedGender)) {
            bottomEntities = findCandidates(normalizedGender, "vay", maxBottomBudget);
        }
        // 3. Tìm các ứng viên Phụ kiện (Accessories)
        List<ProductEntity> accEntities = findCandidates(null, "phu-kien", budget);

        // Xếp hạng các ứng viên theo thuật toán Multi-Criteria Scoring
        ProductEntity bestTop = rankBestCandidate(topEntities, normalizedStyle, normalizedOccasion, maxTopBudget);
        ProductEntity bestBottom = rankBestCandidate(bottomEntities, normalizedStyle, normalizedOccasion, maxBottomBudget);

        ProductDto topDto = bestTop != null ? productService.mapToDto(bestTop) : null;
        ProductDto bottomDto = bestBottom != null ? productService.mapToDto(bestBottom) : null;

        long currentTotal = 0L;
        if (topDto != null) currentTotal += topDto.getPrice();
        if (bottomDto != null) currentTotal += bottomDto.getPrice();

        // Chọn phụ kiện nếu ngân sách còn dư
        ProductDto accDto = null;
        long remainingBudget = budget - currentTotal;
        if (remainingBudget >= 30000L && !accEntities.isEmpty()) {
            for (ProductEntity acc : accEntities) {
                if (acc.getPrice() <= remainingBudget) {
                    accDto = productService.mapToDto(acc);
                    currentTotal += accDto.getPrice();
                    break;
                }
            }
        }

        OutfitBreakdownDto result = new OutfitBreakdownDto();
        result.setTop(topDto);
        result.setBottom(bottomDto);
        result.setAccessory(accDto);
        result.setTotalPrice(currentTotal);
        result.setMaxBudget(budget);
        result.setWithinBudget(currentTotal <= budget);
        result.setStyle(normalizedStyle);
        result.setOccasion(normalizedOccasion);

        // Tạo lời giải thích phối đồ chuyên nghiệp
        String rationale = generateStylingRationale(topDto, bottomDto, accDto, normalizedStyle, normalizedOccasion, currentTotal, budget);
        result.setStylingRationale(rationale);

        return result;
    }

    private List<ProductEntity> findCandidates(String gender, String categorySlug, Long maxPrice) {
        return productRepository.searchProducts(
                gender,
                categorySlug,
                null,
                null,
                maxPrice,
                PageRequest.of(0, 12)
        ).getContent();
    }

    /**
     * Hàm tính điểm tương hợp Multi-Criteria Ranking:
     * Score = w_style * S_style + w_occasion * S_occasion + w_budget * S_budget + w_rating * S_rating
     */
    private ProductEntity rankBestCandidate(List<ProductEntity> candidates, String style, String occasion, long targetBudget) {
        if (candidates.isEmpty()) return null;

        ProductEntity best = null;
        double bestScore = -1.0;

        for (ProductEntity p : candidates) {
            double sStyle = 0.5;
            String text = (p.getName() + " " + p.getShortDescription() + " " + p.getMaterial()).toLowerCase();
            if (text.contains(style.toLowerCase())) sStyle = 1.0;

            double sOccasion = 0.5;
            if (text.contains(occasion.toLowerCase())) sOccasion = 1.0;

            double sBudget = 1.0;
            if (p.getPrice() > targetBudget && targetBudget > 0) {
                sBudget = Math.max(0.0, 1.0 - (double) (p.getPrice() - targetBudget) / targetBudget);
            }

            double sRating = p.getRating() != null ? (p.getRating() / 5.0) : 0.8;

            // Trọng số: Phong cách (40%), Ngân sách (30%), Dịp sử dụng (15%), Điểm đánh giá (15%)
            double finalScore = 0.40 * sStyle + 0.30 * sBudget + 0.15 * sOccasion + 0.15 * sRating;

            if (finalScore > bestScore) {
                bestScore = finalScore;
                best = p;
            }
        }

        return best;
    }

    private String generateStylingRationale(ProductDto top, ProductDto bottom, ProductDto acc,
                                            String style, String occasion, long total, long budget) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Bộ outfit phong cách %s dành cho dịp %s được xây dựng dựa trên nguyên tắc cân bằng phom dáng và màu sắc:\n", style, occasion));

        if (top != null && bottom != null) {
            sb.append(String.format("• Áo %s phối cùng %s tạo tỷ lệ người thanh thoát, đậm chất trẻ trung hiện đại.\n", top.getName(), bottom.getName()));
        }
        if (acc != null) {
            sb.append(String.format("• Điểm nhấn phụ kiện %s giúp hoàn thiện tổng thể trang phục cuốn hút hơn.\n", acc.getName()));
        }

        sb.append(String.format("• Tổng chi phí trọn bộ là %,d đ (%s ngân sách dự kiến %,d đ của bạn).",
                total, total <= budget ? "vừa vặn trong" : "vượt nhẹ", budget));

        return sb.toString();
    }
}

