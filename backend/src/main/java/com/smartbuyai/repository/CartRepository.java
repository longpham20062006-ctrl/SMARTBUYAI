package com.smartbuyai.repository;

import com.smartbuyai.entity.CartEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<CartEntity, String> {
    Optional<CartEntity> findByUserId(String userId);
    Optional<CartEntity> findBySessionId(String sessionId);
}
