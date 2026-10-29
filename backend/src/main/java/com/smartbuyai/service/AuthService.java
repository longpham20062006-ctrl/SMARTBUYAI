package com.smartbuyai.service;

import com.smartbuyai.dto.AuthRequest;
import com.smartbuyai.dto.AuthResponse;
import com.smartbuyai.dto.RegisterRequest;
import com.smartbuyai.dto.UserDto;
import com.smartbuyai.entity.UserEntity;
import com.smartbuyai.exception.ResourceNotFoundException;
import com.smartbuyai.repository.UserRepository;
import com.smartbuyai.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    public AuthResponse login(AuthRequest req) {
        UserEntity user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Email hoặc mật khẩu không chính xác"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Email hoặc mật khẩu không chính xác");
        }

        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());
        UserDto userDto = new UserDto(user.getId(), user.getEmail(), user.getName(), user.getPhone(), user.getRole());
        return new AuthResponse(token, userDto);
    }

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email này đã được sử dụng: " + req.getEmail());
        }

        String userId = "user_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        UserEntity user = new UserEntity(
                userId,
                req.getEmail(),
                passwordEncoder.encode(req.getPassword()),
                req.getName(),
                req.getPhone(),
                "CUSTOMER"
        );
        UserEntity saved = userRepository.save(user);

        String token = tokenProvider.generateToken(saved.getId(), saved.getEmail(), saved.getRole());
        UserDto userDto = new UserDto(saved.getId(), saved.getEmail(), saved.getName(), saved.getPhone(), saved.getRole());
        return new AuthResponse(token, userDto);
    }

    @Transactional(readOnly = true)
    public UserDto getUserProfile(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ResourceNotFoundException("Mã người dùng không hợp lệ");
        }
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + userId));
        return new UserDto(user.getId(), user.getEmail(), user.getName(), user.getPhone(), user.getRole());
    }
}
