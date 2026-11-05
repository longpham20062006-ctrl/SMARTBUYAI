package com.smartbuyai.controller;

import com.smartbuyai.entity.OrderEntity;
import com.smartbuyai.entity.ProductEntity;
import com.smartbuyai.entity.ProductVariantEntity;
import com.smartbuyai.repository.OrderRepository;
import com.smartbuyai.repository.ProductRepository;
import com.smartbuyai.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@Tag(name = "Admin Dashboard", description = "Số liệu KPI, phân tích doanh thu và vận hành thực tế")
public class AdminDashboardController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public AdminDashboardController(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            UserRepository userRepository
    ) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/kpi")
    @Operation(summary = "Lấy các chỉ số KPI doanh thu, đơn hàng, khách hàng và tồn kho")
    public ResponseEntity<Map<String, Object>> getKpiMetrics(
            @RequestParam(defaultValue = "thisMonth") String timeFilter
    ) {
        List<OrderEntity> allOrders = orderRepository.findAll();
        List<ProductEntity> allProducts = productRepository.findAll();
        long totalCustomers = userRepository.count();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime filterStart = null;
        LocalDateTime filterEnd = null;

        if (timeFilter != null) {
            switch (timeFilter) {
                case "today": {
                    filterStart = now.toLocalDate().atStartOfDay();
                    break;
                }
                case "yesterday": {
                    filterStart = now.toLocalDate().minusDays(1).atStartOfDay();
                    filterEnd = now.toLocalDate().atStartOfDay();
                    break;
                }
                case "7days": {
                    filterStart = now.minusDays(7);
                    break;
                }
                case "thisWeek": {
                    filterStart = now.toLocalDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay();
                    break;
                }
                case "30days": {
                    filterStart = now.minusDays(30);
                    break;
                }
                case "thisMonth": {
                    filterStart = now.toLocalDate().withDayOfMonth(1).atStartOfDay();
                    break;
                }
                case "lastMonth": {
                    LocalDate firstDayLastMonth = now.toLocalDate().minusMonths(1).withDayOfMonth(1);
                    filterStart = firstDayLastMonth.atStartOfDay();
                    filterEnd = now.toLocalDate().withDayOfMonth(1).atStartOfDay();
                    break;
                }
                case "thisYear": {
                    filterStart = now.toLocalDate().withDayOfYear(1).atStartOfDay();
                    break;
                }
                case "all":
                default: {
                    // Không áp bộ lọc thời gian
                    break;
                }
            }
        }

        long grossRevenue = 0L;
        long netRevenue = 0L;
        int totalOrders = 0;
        int pendingOrders = 0;
        int confirmedOrders = 0;
        int shippingOrders = 0;
        int completedOrders = 0;
        int cancelledOrders = 0;

        for (OrderEntity order : allOrders) {
            LocalDateTime orderDate = order.getCreatedAt();
            if (orderDate != null) {
                if (filterStart != null && orderDate.isBefore(filterStart)) {
                    continue;
                }
                if (filterEnd != null && (orderDate.isEqual(filterEnd) || orderDate.isAfter(filterEnd))) {
                    continue;
                }
            }

            totalOrders++;
            String status = order.getStatus() != null ? order.getStatus().toUpperCase() : "PENDING";
            long amount = order.getTotalAmount() != null ? order.getTotalAmount() : 0L;

            if ("CANCELLED".equals(status)) {
                cancelledOrders++;
            } else {
                grossRevenue += amount;
                netRevenue += amount;
                if ("PENDING".equals(status)) {
                    pendingOrders++;
                } else if ("CONFIRMED".equals(status)) {
                    confirmedOrders++;
                } else if ("SHIPPING".equals(status) || "PROCESSING".equals(status)) {
                    shippingOrders++;
                } else if ("COMPLETED".equals(status) || "DELIVERED".equals(status)) {
                    completedOrders++;
                }
            }
        }

        // Tồn kho
        int lowStockCount = 0;
        int outOfStockCount = 0;
        for (ProductEntity p : allProducts) {
            if (p.getVariants() != null) {
                for (ProductVariantEntity v : p.getVariants()) {
                    if (v.getStock() != null) {
                        if (v.getStock() == 0) {
                            outOfStockCount++;
                        } else if (v.getStock() < 12) {
                            lowStockCount++;
                        }
                    }
                }
            }
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("timeFilter", timeFilter != null ? timeFilter : "thisMonth");
        res.put("grossRevenue", grossRevenue);
        res.put("netRevenue", netRevenue);
        res.put("totalOrders", totalOrders);
        res.put("pendingOrders", pendingOrders);
        res.put("confirmedOrders", confirmedOrders);
        res.put("shippingOrders", shippingOrders);
        res.put("completedOrders", completedOrders);
        res.put("cancelledOrders", cancelledOrders);
        res.put("totalProducts", allProducts.size());
        res.put("totalCustomers", totalCustomers);
        res.put("lowStockCount", lowStockCount);
        res.put("outOfStockCount", outOfStockCount);

        return ResponseEntity.ok(res);
    }
}
