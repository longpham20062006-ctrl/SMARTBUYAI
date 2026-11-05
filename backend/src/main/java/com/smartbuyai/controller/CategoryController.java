package com.smartbuyai.controller;

import com.smartbuyai.dto.CategoryDto;
import com.smartbuyai.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@Tag(name = "Categories", description = "Danh mục thời trang Nam & Nữ")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh mục sản phẩm (hỗ trợ lọc theo giới tính nam/nu/unisex)")
    public ResponseEntity<List<CategoryDto>> getCategories(@RequestParam(required = false) String gender) {
        return ResponseEntity.ok(categoryService.getAllCategories(gender));
    }
}
