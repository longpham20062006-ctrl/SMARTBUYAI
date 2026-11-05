-- SEED DATA: USERS, BRANDS, CATEGORIES
-- Password hash for '123456' & 'admin123' (bcrypt)

INSERT INTO users (id, email, password_hash, full_name, role, phone)
VALUES 
    ('u-customer', 'khachhang@smartbuy.vn', '$2b$10$wT0lq7x5rG2xWj6Z4R6Gbe9fD9d0yqKk5c5Q3z5A5b5C5d5e5f5g5', 'Nguyễn Khách Hàng', 'CUSTOMER', '0901234567'),
    ('u-admin', 'admin@smartbuy.vn', '$2b$10$wT0lq7x5rG2xWj6Z4R6Gbe9fD9d0yqKk5c5Q3z5A5b5C5d5e5f5g5', 'Quản Trị Viên Master', 'ADMIN', '0988888888')
ON CONFLICT (id) DO NOTHING;

INSERT INTO brands (id, name, slug, origin, description)
VALUES
    ('b-1', 'Atelier Minimalist', 'atelier-minimalist', 'Việt Nam & Pháp', 'Thương hiệu theo đuổi phong cách tối giản đương đại với chất liệu cao cấp và phom dáng chuẩn mực.'),
    ('b-2', 'The Urban Tailor', 'the-urban-tailor', 'Việt Nam', 'Nghệ thuật may đo may sẵn hiện đại, tối ưu cho vóc dáng người Việt trong môi trường công sở năng động.'),
    ('b-3', 'Linen & Co.', 'linen-and-co', 'Pháp', 'Chuyên các trang phục dệt từ sợi lanh tự nhiên vùng Normandy, thoáng mát và tôn vinh vẻ đẹp nguyên bản.'),
    ('b-4', 'Komorebi Silk', 'komorebi-silk', 'Bảo Lộc, Việt Nam', 'Tơ tằm tự nhiên thượng hạng được xử lý mềm mượt, mang lại cảm giác nhẹ tênh và quý phái.'),
    ('b-5', 'Nordic Ease', 'nordic-ease', 'Đan Mạch', 'Thời trang thường nhật mang triết lý Hygge Bắc Âu, chú trọng sự êm ái và tính ứng dụng bền vững.'),
    ('b-6', 'Earthy Studio', 'earthy-studio', 'Việt Nam', 'Màu sắc lấy cảm hứng từ đất đá, cát sa mạc và rừng già; chất liệu nhuộm hữu cơ thân thiện môi trường.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, slug, gender, description, image, item_count)
VALUES
    ('c-1', 'Áo sơ mi', 'ao-so-mi', 'unisex', 'Sơ mi Oxford, Linen và Lụa cao cấp với đường may tỉ mỉ, tôn dáng trong mọi khoảnh khắc.', 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=80', 8),
    ('c-2', 'Áo thun & Polo', 'ao-thun', 'unisex', 'Cotton Supima 100% mềm mịn thoáng khí, không xù lông và giữ phom bền đẹp sau nhiều lần giặt.', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', 7),
    ('c-3', 'Quần tây & Chino', 'quan-tay', 'unisex', 'Phom Relaxed và Tailored tôn dáng, đường xếp ly tinh tế phù hợp cả công sở và dạo phố.', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80', 6),
    ('c-4', 'Đầm & Váy liền', 'dam-vay', 'nu', 'Thiết kế bay bổng từ lụa tơ tằm và linen cao cấp, tôn vinh nét duyên dáng thanh lịch.', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80', 6),
    ('c-5', 'Áo khoác & Blazer', 'ao-khoac', 'unisex', 'Blazer may đo cấu trúc nhẹ, phom dáng hiện đại sang trọng.', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop&q=80', 5)
ON CONFLICT (id) DO NOTHING;

