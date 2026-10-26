package com.smartbuyai.controller;

import com.smartbuyai.dto.AuthRequest;
import com.smartbuyai.dto.AuthResponse;
import com.smartbuyai.dto.RegisterRequest;
import com.smartbuyai.dto.UserDto;
import com.smartbuyai.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth", description = "Đăng ký, đăng nhập và xác thực tài khoản")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập với email và mật khẩu (trả về JWT token)")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản khách hàng mới")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin tài khoản đang đăng nhập")
    public ResponseEntity<UserDto> getCurrentUser(Authentication auth) {
        if (auth == null) {
            // Return demo customer by default for local testing
            return ResponseEntity.ok(authService.getUserProfile("user-demo-1"));
        }
        return ResponseEntity.ok(authService.getUserProfile(auth.getName()));
    }
}
