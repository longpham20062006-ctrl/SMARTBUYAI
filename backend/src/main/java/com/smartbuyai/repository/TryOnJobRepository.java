package com.smartbuyai.repository;

import com.smartbuyai.entity.TryOnJobEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TryOnJobRepository extends JpaRepository<TryOnJobEntity, String> {
    List<TryOnJobEntity> findByUserIdOrderByCreatedAtDesc(String userId);
}
