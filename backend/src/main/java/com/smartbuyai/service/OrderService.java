package com.smartbuyai.service;

import com.smartbuyai.dto.CreateOrderRequest;
import com.smartbuyai.dto.OrderDto;
import com.smartbuyai.dto.OrderItemDto;
import com.smartbuyai.entity.*;
import com.smartbuyai.exception.ResourceNotFoundException;
import com.smartbuyai.repository.CartRepository;
import com.smartbuyai.repository.OrderRepository;
import com.smartbuyai.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository, CartRepository cartRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
    }

    public OrderDto createOrder(CreateOrderRequest req, String userId) {
        String orderId = "SB-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + (1000 + new Random().nextInt(9000));

        OrderEntity order = new OrderEntity();
        order.setId(orderId);
        order.setUserId(userId != null ? userId : "guest");
        order.setCustomerName(req.getCustomerName());
        order.setCustomerEmail(req.getCustomerEmail());
        order.setCustomerPhone(req.getCustomerPhone());
        order.setShippingAddress(req.getShippingAddress());
        order.setPaymentMethod(req.getPaymentMethod() != null ? req.getPaymentMethod() : "COD");
        order.setNote(req.getNote());
        order.setStatus("CONFIRMED");
        order.setCreatedAt(LocalDateTime.now());

        long subtotal = 0L;
        List<OrderItemEntity> orderItems = new ArrayList<>();

        // Case A: Create order from Cart
        if (req.getCartId() != null && !req.getCartId().isBlank()) {
            CartEntity cart = cartRepository.findById(req.getCartId())
                    .orElseThrow(() -> new ResourceNotFoundException("Giỏ hàng không tồn tại: " + req.getCartId()));

            for (CartItemEntity item : cart.getItems()) {
                OrderItemEntity oi = new OrderItemEntity();
                oi.setOrder(order);
                oi.setProductId(item.getProductId());
                oi.setProductName(item.getProductName());
                oi.setVariantId(item.getVariantId());
                oi.setSize(item.getSize());
                oi.setColorName(item.getColorName());
                oi.setPrice(item.getPrice());
                oi.setQuantity(item.getQuantity());
                oi.setImageUrl(item.getImageUrl());
                orderItems.add(oi);

                subtotal += item.getPrice() * item.getQuantity();
            }
            // Clear cart after checkout
            cart.getItems().clear();
            cartRepository.save(cart);
        } else if (req.getItems() != null && !req.getItems().isEmpty()) {
            // Case B: Create order from explicit items
            for (CreateOrderRequest.OrderItemInput input : req.getItems()) {
                ProductEntity product = productRepository.findById(input.getProductId())
                        .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại: " + input.getProductId()));

                Long price = product.getPrice();
                String img = !product.getImages().isEmpty() ? product.getImages().get(0).getImageUrl() : "";

                if (input.getVariantId() != null) {
                    for (ProductVariantEntity v : product.getVariants()) {
                        if (v.getId().equals(input.getVariantId())) {
                            if (v.getPrice() != null && v.getPrice() > 0) price = v.getPrice();
                            if (v.getImageUrl() != null) img = v.getImageUrl();
                            break;
                        }
                    }
                }

                int qty = input.getQuantity() != null && input.getQuantity() > 0 ? input.getQuantity() : 1;

                OrderItemEntity oi = new OrderItemEntity();
                oi.setOrder(order);
                oi.setProductId(product.getId());
                oi.setProductName(product.getName());
                oi.setVariantId(input.getVariantId());
                oi.setSize(input.getSize() != null ? input.getSize() : "FreeSize");
                oi.setColorName(input.getColorName() != null ? input.getColorName() : "Mặc định");
                oi.setPrice(price);
                oi.setQuantity(qty);
                oi.setImageUrl(img);
                orderItems.add(oi);

                subtotal += price * qty;
            }
        } else {
            throw new IllegalArgumentException("Đơn hàng phải chứa ít nhất một sản phẩm.");
        }

        // Freeship if subtotal >= 299,000 VND
        long shippingFee = subtotal >= 299000L ? 0L : 30000L;
        order.setSubtotal(subtotal);
        order.setShippingFee(shippingFee);
        order.setDiscountAmount(0L);
        order.setTotalAmount(subtotal + shippingFee);
        order.setItems(orderItems);

        OrderEntity saved = orderRepository.save(order);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public OrderDto getOrderById(String orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng: " + orderId));
        return mapToDto(order);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getOrdersByUser(String userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private OrderDto mapToDto(OrderEntity entity) {
        OrderDto dto = new OrderDto();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setCustomerName(entity.getCustomerName());
        dto.setCustomerEmail(entity.getCustomerEmail());
        dto.setCustomerPhone(entity.getCustomerPhone());
        dto.setShippingAddress(entity.getShippingAddress());
        dto.setPaymentMethod(entity.getPaymentMethod());
        dto.setStatus(entity.getStatus());
        dto.setSubtotal(entity.getSubtotal());
        dto.setShippingFee(entity.getShippingFee());
        dto.setDiscountAmount(entity.getDiscountAmount());
        dto.setTotalAmount(entity.getTotalAmount());
        dto.setNote(entity.getNote());
        dto.setCreatedAt(entity.getCreatedAt());

        List<OrderItemDto> items = entity.getItems().stream().map(i -> {
            OrderItemDto itemDto = new OrderItemDto();
            itemDto.setId(i.getId());
            itemDto.setProductId(i.getProductId());
            itemDto.setProductName(i.getProductName());
            itemDto.setVariantId(i.getVariantId());
            itemDto.setSize(i.getSize());
            itemDto.setColorName(i.getColorName());
            itemDto.setPrice(i.getPrice());
            itemDto.setQuantity(i.getQuantity());
            itemDto.setImageUrl(i.getImageUrl());
            return itemDto;
        }).collect(Collectors.toList());

        dto.setItems(items);
        return dto;
    }
}
