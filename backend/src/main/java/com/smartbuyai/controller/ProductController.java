package com.smartbuyai.controller;

import com.smartbuyai.dto.PagedResponse;
import com.smartbuyai.dto.ProductDto;
import com.smartbuyai.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Products", description = "Sản phẩm thời trang SMARTBUY AI")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    /**
     * Kiểm tra người dùng có quyền ROLE_CUSTOMER hoặc ROLE_ADMIN hay không
     */
    private boolean isCustomerOrAdmin(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if ("anonymousUser".equals(auth.getPrincipal())) return false;
        return auth.getAuthorities().stream().anyMatch(a ->
                "ROLE_CUSTOMER".equals(a.getAuthority()) || "ROLE_ADMIN".equals(a.getAuthority())
        );
    }

    /**
     * Loại bỏ toàn bộ trường giá, chiết khấu và tồn kho nội bộ cho Khách (Guest)
     * Ngăn ngừa việc xem giá qua Network DevTools trước khi đăng nhập theo Master Prompt V18
     */
    private ProductDto sanitizeForGuest(ProductDto original) {
        if (original == null) return null;
        ProductDto copy = new ProductDto();
        copy.setId(original.getId());
        copy.setName(original.getName());
        copy.setSlug(original.getSlug());
        copy.setCategorySlug(original.getCategorySlug());
        copy.setGender(original.getGender());
        copy.setBrand(original.getBrand());

        // BẢO MẬT: Giá bán, giá gốc, giá nhập đều trả về null cho Guest
        copy.setPrice(null);
        copy.setOriginalPrice(null);
        copy.setCostPrice(null);
        copy.setSuggestedPrice(null);
        copy.setApprovedPrice(null);
        copy.setPriceStatus(null);

        copy.setShortDescription(original.getShortDescription());
        copy.setDescription(original.getDescription());
        copy.setMaterial(original.getMaterial());
        copy.setFit(original.getFit());
        copy.setStyle(original.getStyle());
        copy.setSeason(original.getSeason());
        copy.setRating(original.getRating());
        copy.setReviewCount(original.getReviewCount());
        copy.setIsActive(original.getIsActive());
        copy.setIsNewDrop(original.getIsNewDrop());
        copy.setIsBestSeller(original.getIsBestSeller());
        copy.setFolderKey(original.getFolderKey());
        copy.setModelFolder(original.getModelFolder());
        copy.setImages(original.getImages());
        copy.setVariants(Collections.emptyList());
        return copy;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách sản phẩm với bộ lọc, phân trang và tìm kiếm (Guest không có giá, Customer có giá đầy đủ)")
    public ResponseEntity<PagedResponse<ProductDto>> getProducts(
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long minPrice,
            @RequestParam(required = false) Long maxPrice,
            @RequestParam(required = false, defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth
    ) {
        PagedResponse<ProductDto> response = productService.getProducts(gender, category, q, minPrice, maxPrice, sort, page, size);
        
        if (!isCustomerOrAdmin(auth)) {
            List<ProductDto> sanitizedList = response.getContent().stream()
                    .map(this::sanitizeForGuest)
                    .collect(Collectors.toList());
            response.setContent(sanitizedList);
        }

        return ResponseEntity.ok()
                .header("Cache-Control", isCustomerOrAdmin(auth) ? "private, max-age=60" : "public, max-age=60")
                .body(response);
    }

    @GetMapping("/preview")
    @Operation(summary = "API công khai chuyên biệt cho Guest - chỉ trả về hình ảnh và nhãn giới thiệu, KHÔNG có giá")
    public ResponseEntity<PagedResponse<ProductDto>> getProductPreviews(
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PagedResponse<ProductDto> response = productService.getProducts(gender, category, q, null, null, "newest", page, size);
        List<ProductDto> sanitizedList = response.getContent().stream()
                .map(this::sanitizeForGuest)
                .collect(Collectors.toList());
        response.setContent(sanitizedList);
        return ResponseEntity.ok()
                .header("Cache-Control", "public, max-age=60")
                .body(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết sản phẩm theo mã ID (Guest xem bản xem trước không giá, Customer xem bản đầy đủ)")
    public ResponseEntity<ProductDto> getProductById(@PathVariable String id, Authentication auth) {
        ProductDto dto = productService.getProductById(id);
        if (!isCustomerOrAdmin(auth)) {
            dto = sanitizeForGuest(dto);
        }
        return ResponseEntity.ok()
                .header("Cache-Control", isCustomerOrAdmin(auth) ? "private, max-age=120" : "public, max-age=120")
                .body(dto);
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Chi tiết sản phẩm theo đường dẫn Slug (Guest xem bản xem trước không giá, Customer xem bản đầy đủ)")
    public ResponseEntity<ProductDto> getProductBySlug(@PathVariable String slug, Authentication auth) {
        ProductDto dto = productService.getProductBySlug(slug);
        if (!isCustomerOrAdmin(auth)) {
            dto = sanitizeForGuest(dto);
        }
        return ResponseEntity.ok()
                .header("Cache-Control", isCustomerOrAdmin(auth) ? "private, max-age=120" : "public, max-age=120")
                .body(dto);
    }

    @GetMapping("/new-drops")
    @Operation(summary = "8 sản phẩm New Drop mới nhất")
    public ResponseEntity<List<ProductDto>> getNewDrops(Authentication auth) {
        List<ProductDto> list = productService.getNewArrivals();
        if (!isCustomerOrAdmin(auth)) {
            list = list.stream().map(this::sanitizeForGuest).collect(Collectors.toList());
        }
        return ResponseEntity.ok()
                .header("Cache-Control", isCustomerOrAdmin(auth) ? "private, max-age=120" : "public, max-age=120")
                .body(list);
    }

    @GetMapping("/best-sellers")
    @Operation(summary = "8 sản phẩm Best Seller bán chạy nhất")
    public ResponseEntity<List<ProductDto>> getBestSellers(Authentication auth) {
        List<ProductDto> list = productService.getBestSellers();
        if (!isCustomerOrAdmin(auth)) {
            list = list.stream().map(this::sanitizeForGuest).collect(Collectors.toList());
        }
        return ResponseEntity.ok()
                .header("Cache-Control", isCustomerOrAdmin(auth) ? "private, max-age=120" : "public, max-age=120")
                .body(list);
    }
}
