package com.smartbuyai.controller;

import com.smartbuyai.dto.OrderDto;
import com.smartbuyai.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/orders")
@Tag(name = "Admin Orders", description = "Quản trị danh sách và trạng thái đơn hàng")
public class AdminOrderController {

    private final OrderService orderService;

    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    @Operation(summary = "Lấy toàn bộ đơn hàng quản trị")
    public ResponseEntity<List<OrderDto>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @PatchMapping("/{orderId}/status")
    @Operation(summary = "Admin cập nhật trạng thái đơn hàng")
    public ResponseEntity<OrderDto> updateStatus(
            @PathVariable String orderId,
            @RequestBody Map<String, String> body
    ) {
        String newStatus = body.getOrDefault("status", "CONFIRMED");
        return ResponseEntity.ok(orderService.updateOrderStatus(orderId, newStatus));
    }
}

