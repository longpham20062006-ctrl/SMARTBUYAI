package com.smartbuyai.controller;

import com.smartbuyai.dto.PagedResponse;
import com.smartbuyai.dto.ProductDto;
import com.smartbuyai.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Products", description = "Sản phẩm thời trang SMARTBUY AI")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách sản phẩm với bộ lọc, phân trang và tìm kiếm")
    public ResponseEntity<PagedResponse<ProductDto>> getProducts(
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long minPrice,
            @RequestParam(required = false) Long maxPrice,
            @RequestParam(required = false, defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PagedResponse<ProductDto> response = productService.getProducts(gender, category, q, minPrice, maxPrice, sort, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết sản phẩm theo mã ID")
    public ResponseEntity<ProductDto> getProductById(@PathVariable String id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Chi tiết sản phẩm theo đường dẫn Slug")
    public ResponseEntity<ProductDto> getProductBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(productService.getProductBySlug(slug));
    }

    @GetMapping("/new-drops")
    @Operation(summary = "8 sản phẩm New Drop mới nhất")
    public ResponseEntity<List<ProductDto>> getNewDrops() {
        return ResponseEntity.ok(productService.getNewArrivals());
    }

    @GetMapping("/best-sellers")
    @Operation(summary = "8 sản phẩm Best Seller bán chạy nhất")
    public ResponseEntity<List<ProductDto>> getBestSellers() {
        return ResponseEntity.ok(productService.getBestSellers());
    }
}
