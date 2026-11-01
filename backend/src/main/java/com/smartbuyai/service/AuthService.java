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

    private static final java.util.regex.Pattern VIETNAMESE_PHONE_PATTERN = java.util.regex.Pattern
            .compile("^(0|\\+84)(3|5|7|8|9)[0-9]{8}$");
    private static final java.util.regex.Pattern EMAIL_PATTERN = java.util.regex.Pattern
            .compile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    public AuthResponse login(AuthRequest req) {
        String email = req.getEmail() != null ? req.getEmail().trim().toLowerCase() : "";
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Email hoặc mật khẩu không chính xác"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Email hoặc mật khẩu không chính xác");
        }

        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());
        UserDto userDto = new UserDto(user.getId(), user.getEmail(), user.getName(), user.getPhone(), user.getRole());
        return new AuthResponse(token, userDto);
    }

    public AuthResponse register(RegisterRequest req) {
        if (req == null) {
            throw new IllegalArgumentException("Thông tin đăng ký không hợp lệ");
        }

        String name = req.getName() != null ? req.getName().trim() : "";
        if (name.isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập họ và tên của bạn");
        }

        String email = req.getEmail() != null ? req.getEmail().trim().toLowerCase() : "";
        if (email.isBlank() || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("Địa chỉ email không hợp lệ");
        }

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email này đã được sử dụng: " + req.getEmail());
        }

        String phone = req.getPhone() != null ? req.getPhone().trim().replaceAll("\\s+", "") : "";
        if (phone.isBlank() || !VIETNAMESE_PHONE_PATTERN.matcher(phone).matches()) {
            throw new IllegalArgumentException(
                    "Số điện thoại không hợp lệ (hỗ trợ các đầu số 03, 05, 07, 08, 09 hoặc +84 gồm 10 chữ số)");
        }

        if (userRepository.existsByPhone(phone)) {
            throw new IllegalArgumentException("Số điện thoại này đã được sử dụng: " + req.getPhone());
        }

        String password = req.getPassword() != null ? req.getPassword() : "";
        if (password.length() < 6) {
            throw new IllegalArgumentException("Mật khẩu cần tối thiểu 6 ký tự");
        }

        String userId = "user_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        UserEntity user = new UserEntity(
                userId,
                email,
                passwordEncoder.encode(password),
                name,
                phone,
                "CUSTOMER");
        UserEntity saved = userRepository.save(user);

        String token = tokenProvider.generateToken(saved.getId(), saved.getEmail(), saved.getRole());
        UserDto userDto = new UserDto(saved.getId(), saved.getEmail(), saved.getName(), saved.getPhone(),
                saved.getRole());
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
