package com.smartbuyai.service;

import com.smartbuyai.dto.CategoryDto;
import com.smartbuyai.entity.CategoryEntity;
import com.smartbuyai.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryDto> getAllCategories(String gender) {
        List<CategoryEntity> list;
        if (gender != null && !gender.trim().isEmpty() && !"all".equalsIgnoreCase(gender)) {
            list = categoryRepository.findByGenderOrderByDisplayOrderAsc(gender.toLowerCase().trim());
        } else {
            list = categoryRepository.findAllByOrderByDisplayOrderAsc();
        }

        return list.stream()
                .map(c -> new CategoryDto(
                        c.getId(),
                        c.getName(),
                        c.getSlug(),
                        c.getGender(),
                        c.getParentCategory(),
                        c.getDescription(),
                        c.getDisplayOrder()
                ))
                .collect(Collectors.toList());
    }
}
