package com.smartbuyai.controller;

import com.smartbuyai.dto.CreateOrderRequest;
import com.smartbuyai.dto.OrderDto;
import com.smartbuyai.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Orders", description = "Đặt hàng và quản lý đơn hàng")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @Operation(summary = "Tạo đơn hàng mới (tính toán giá và phí vận chuyển từ máy chủ)")
    public ResponseEntity<OrderDto> createOrder(
            @Valid @RequestBody CreateOrderRequest req,
            Authentication auth
    ) {
        String userId = auth != null ? auth.getName() : "guest";
        OrderDto order = orderService.createOrder(req, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Xem thông tin đơn hàng theo mã đơn")
    public ResponseEntity<OrderDto> getOrderById(@PathVariable String orderId) {
        return ResponseEntity.ok(orderService.getOrderById(orderId));
    }

    @GetMapping("/my-orders")
    @Operation(summary = "Lịch sử đơn hàng của người dùng hiện tại")
    public ResponseEntity<List<OrderDto>> getMyOrders(
            @RequestParam(required = false, defaultValue = "user-demo-1") String userId,
            Authentication auth
    ) {
        String effectiveUserId = auth != null ? auth.getName() : userId;
        return ResponseEntity.ok(orderService.getOrdersByUser(effectiveUserId));
    }
}
