package com.smartbuyai.controller;

import com.smartbuyai.dto.ProductDto;
import com.smartbuyai.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/products")
@Tag(name = "Admin Products", description = "Quản trị sản phẩm, giá bán và tồn kho")
public class AdminProductController {

    private final ProductService productService;

    public AdminProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    @Operation(summary = "Admin lấy danh sách sản phẩm quản trị")
    public ResponseEntity<?> getAdminProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(productService.getProducts(null, null, null, null, null, "newest", page, size));
    }

    @PutMapping(value = {"/{id}", "/{id}/pricing"})
    @PatchMapping(value = {"/{id}", "/{id}/price"})
    @Operation(summary = "Admin cập nhật giá bán chính thức và tồn kho cho sản phẩm")
    public ResponseEntity<ProductDto> updatePrice(
            @PathVariable String id,
            @RequestBody Map<String, Object> body
    ) {
        Long newPrice = null;
        if (body.containsKey("price")) {
            newPrice = Long.valueOf(body.get("price").toString());
        } else if (body.containsKey("approvedPrice")) {
            newPrice = Long.valueOf(body.get("approvedPrice").toString());
        }

        Integer newStock = null;
        if (body.containsKey("stock")) {
            newStock = Integer.valueOf(body.get("stock").toString());
        }

        ProductDto updated = productService.updateProductPriceAndStock(id, newPrice, newStock);
        return ResponseEntity.ok(updated);
    }
}
