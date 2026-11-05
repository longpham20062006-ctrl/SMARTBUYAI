package com.smartbuyai.repository;

import com.smartbuyai.entity.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<CategoryEntity, String> {
    Optional<CategoryEntity> findBySlug(String slug);
    List<CategoryEntity> findByGenderOrderByDisplayOrderAsc(String gender);
    List<CategoryEntity> findAllByOrderByDisplayOrderAsc();
}
