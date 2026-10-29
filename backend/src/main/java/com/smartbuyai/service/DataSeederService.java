package com.smartbuyai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartbuyai.entity.CategoryEntity;
import com.smartbuyai.entity.ProductEntity;
import com.smartbuyai.entity.ProductImageEntity;
import com.smartbuyai.entity.ProductVariantEntity;
import com.smartbuyai.entity.UserEntity;
import com.smartbuyai.repository.CategoryRepository;
import com.smartbuyai.repository.ProductRepository;
import com.smartbuyai.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.security.SecureRandom;
import java.util.*;

@Service
public class DataSeederService implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeederService.class);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final Environment environment;

    public DataSeederService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            ObjectMapper objectMapper,
            Environment environment) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
        this.environment = environment;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedUsers();
        bootstrapTestAccounts();
        seedCategories();
        seedProducts();
    }

    private void seedUsers() {
        if (userRepository.count() == 0) {
            log.info("Khởi tạo tài khoản mẫu SMARTBUY AI (Customer & Admin)...");
            UserEntity customer = new UserEntity(
                    "user-demo-1",
                    "khachhang@smartbuy.vn",
                    passwordEncoder.encode("123456"),
                    "Nguyễn Tuấn Anh",
                    "0987654321",
                    "CUSTOMER");
            UserEntity admin = new UserEntity(
                    "admin-1",
                    "admin@smartbuy.vn",
                    passwordEncoder.encode("admin123"),
                    "Quản trị viên SMARTBUY",
                    "0909999999",
                    "ADMIN");
            userRepository.save(customer);
            userRepository.save(admin);
            log.info("Đã tạo thành công 2 tài khoản demo: khachhang@smartbuy.vn và admin@smartbuy.vn");
        }
    }

    private void bootstrapTestAccounts() {
        // Chỉ chạy ở môi trường DEVELOPMENT / TEST, tuyệt đối không chạy ở production
        if (environment != null && environment.getActiveProfiles() != null) {
            for (String profile : environment.getActiveProfiles()) {
                if ("prod".equalsIgnoreCase(profile) || "production".equalsIgnoreCase(profile)) {
                    log.info("Môi trường Production: Bỏ qua tạo tài khoản thử nghiệm.");
                    return;
                }
            }
        }

        String customerEmail = "customer.test@smartbuy.local";
        String adminEmail = "admin.test@smartbuy.local";

        boolean customerExists = userRepository.findByEmail(customerEmail).isPresent();
        boolean adminExists = userRepository.findByEmail(adminEmail).isPresent();

        if (customerExists && adminExists) {
            log.info("Hai tài khoản thử nghiệm (customer.test@smartbuy.local & admin.test@smartbuy.local) đã sẵn sàng trong Database.");
            return;
        }

        File credFile = new File("data/test_credentials.local");
        if (credFile.getParentFile() != null && !credFile.getParentFile().exists()) {
            credFile.getParentFile().mkdirs();
        }

        Properties props = new Properties();
        if (credFile.exists()) {
            try (InputStream is = new FileInputStream(credFile)) {
                props.load(is);
            } catch (Exception e) {
                log.warn("Không thể đọc tệp test_credentials.local: {}", e.getMessage());
            }
        }

        String customerPass = System.getenv("SMARTBUY_CUSTOMER_TEST_PASSWORD");
        if (customerPass == null || customerPass.isBlank()) {
            customerPass = props.getProperty("CUSTOMER_TEST_PASSWORD");
        }
        if (customerPass == null || customerPass.isBlank()) {
            customerPass = generateSecurePassword(16);
            props.setProperty("CUSTOMER_TEST_PASSWORD", customerPass);
        }

        String adminPass = System.getenv("SMARTBUY_ADMIN_TEST_PASSWORD");
        if (adminPass == null || adminPass.isBlank()) {
            adminPass = props.getProperty("ADMIN_TEST_PASSWORD");
        }
        if (adminPass == null || adminPass.isBlank()) {
            adminPass = generateSecurePassword(18);
            props.setProperty("ADMIN_TEST_PASSWORD", adminPass);
        }

        if (customerPass.equals(adminPass)) {
            adminPass = generateSecurePassword(18);
            props.setProperty("ADMIN_TEST_PASSWORD", adminPass);
        }

        props.setProperty("CUSTOMER_TEST_EMAIL", customerEmail);
        props.setProperty("ADMIN_TEST_EMAIL", adminEmail);

        try (OutputStream os = new FileOutputStream(credFile)) {
            props.store(os, "SMARTBUY AI - SECURE LOCAL TEST CREDENTIALS (DO NOT COMMIT TO GIT)");
        } catch (Exception e) {
            log.warn("Không thể lưu tệp test_credentials.local: {}", e.getMessage());
        }

        if (!customerExists) {
            UserEntity customerTest = new UserEntity(
                    "user-test-customer",
                    customerEmail,
                    passwordEncoder.encode(customerPass),
                    "Thành viên Thử nghiệm",
                    "0911223344",
                    "CUSTOMER"
            );
            userRepository.save(customerTest);
            log.info("Đã khởi tạo an toàn tài khoản thử nghiệm thành viên: {}", customerEmail);
        }

        if (!adminExists) {
            UserEntity adminTest = new UserEntity(
                    "user-test-admin",
                    adminEmail,
                    passwordEncoder.encode(adminPass),
                    "Quản trị viên Thử nghiệm",
                    "0988776655",
                    "ADMIN"
            );
            userRepository.save(adminTest);
            log.info("Đã khởi tạo an toàn tài khoản thử nghiệm quản trị: {}", adminEmail);
        }
    }

    private String generateSecurePassword(int length) {
        String upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        String lower = "abcdefghijkmnopqrstuvwxyz";
        String digits = "23456789";
        String special = "!@#$%^&*";
        String all = upper + lower + digits + special;
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(length);
        sb.append(upper.charAt(random.nextInt(upper.length())));
        sb.append(lower.charAt(random.nextInt(lower.length())));
        sb.append(digits.charAt(random.nextInt(digits.length())));
        sb.append(special.charAt(random.nextInt(special.length())));
        for (int i = 4; i < length; i++) {
            sb.append(all.charAt(random.nextInt(all.length())));
        }
        List<Character> chars = new ArrayList<>();
        for (char c : sb.toString().toCharArray()) {
            chars.add(c);
        }
        Collections.shuffle(chars, random);
        StringBuilder result = new StringBuilder();
        for (char c : chars) {
            result.append(c);
        }
        return result.toString();
    }

    private void seedCategories() {
        if (categoryRepository.count() == 0) {
            log.info("Khởi tạo danh mục sản phẩm thời trang Nam & Nữ chuẩn thực tế...");
            List<CategoryEntity> list = List.of(
                    new CategoryEntity("cat-ao-thun", "Áo thun", "ao-thun", "nam", "ao",
                            "Áo thun phong cách streetwear oversized"),
                    new CategoryEntity("cat-ao-thun-dai-tay", "Áo thun dài tay", "ao-thun-dai-tay", "nam", "ao",
                            "Áo thun tay dài cotton cao cấp"),
                    new CategoryEntity("cat-polo", "Áo Polo", "polo", "nam", "ao", "Áo polo bo dệt cổ điển lịch sự"),
                    new CategoryEntity("cat-so-mi", "Sơ mi", "so-mi", "nam", "ao", "Áo sơ mi phom rộng thoáng khí"),
                    new CategoryEntity("cat-hoodie", "Áo Hoodie", "hoodie", "nam", "ao", "Hoodie nỉ bông dày ấm"),
                    new CategoryEntity("cat-ao-len", "Áo len", "ao-len", "nam", "ao",
                            "Áo len dệt kim phong cách Hàn Quốc"),
                    new CategoryEntity("cat-ao-khoac", "Áo khoác", "ao-khoac", "nam", "ao",
                            "Áo khoác bomber, gió, dù đa năng"),
                    new CategoryEntity("cat-quan-dai", "Quần dài", "quan-dai", "nam", "quan",
                            "Quần jeans baggy, cargo pants"),
                    new CategoryEntity("cat-quan-short", "Quần short", "quan-short", "nam", "quan",
                            "Quần đùi dạo phố thể thao"),
                    new CategoryEntity("cat-do-bo", "Đồ bộ", "do-bo", "nam", "set",
                            "Set trang phục phối sẵn thời trang"),
                    // Nữ
                    new CategoryEntity("cat-nu-ao-thun", "Áo thun nữ", "nu-ao-thun", "nu", "ao-nu",
                            "Áo thun nữ basic & baby tee"),
                    new CategoryEntity("cat-nu-croptop", "Croptop", "nu-croptop", "nu", "ao-nu",
                            "Áo croptop cá tính tôn dáng"),
                    new CategoryEntity("cat-nu-ao-hai-day", "Áo hai dây", "nu-ao-hai-day", "nu", "ao-nu",
                            "Áo hai dây / tank top mát mẻ"),
                    new CategoryEntity("cat-nu-cardigan", "Cardigan", "nu-cardigan", "nu", "ao-nu",
                            "Áo khoác cardigan nữ dịu dàng"),
                    new CategoryEntity("cat-nu-vay", "Váy nữ", "nu-vay", "nu", "vay", "Váy đầm thời trang nữ thiết kế"),
                    new CategoryEntity("cat-nu-quan", "Quần nữ", "nu-quan", "nu", "quan-nu",
                            "Quần jeans, ống suông nữ"),
                    // Phụ kiện
                    new CategoryEntity("cat-phu-kien", "Phụ kiện", "phu-kien", "unisex", "phu-kien",
                            "Mũ nón, túi đeo chéo, trang sức titan"));
            for (CategoryEntity cat : list) {
                if (cat != null) {
                    categoryRepository.save(cat);
                }
            }
            log.info("Đã lưu {} danh mục sản phẩm.", list.size());
        }
    }

    private void seedProducts() {
        if (productRepository.count() == 0) {
            log.info("Bắt đầu nạp dữ liệu sản phẩm từ importedProducts.json vào Database...");
            try {
                InputStream is = null;
                ClassPathResource resource = new ClassPathResource("data/importedProducts.json");
                if (resource.exists()) {
                    is = resource.getInputStream();
                } else {
                    File file = new File("../src/mocks/importedProducts.json");
                    if (file.exists()) {
                        is = file.toURI().toURL().openStream();
                    }
                }

                if (is == null) {
                    log.warn("Không tìm thấy tệp importedProducts.json để seed dữ liệu.");
                    return;
                }

                List<JsonNode> nodes = objectMapper.readValue(is, new TypeReference<List<JsonNode>>() {
                });
                log.info("Tìm thấy {} sản phẩm trong file importedProducts.json.", nodes.size());

                Set<String> usedVariantIds = new HashSet<>();
                int importedCount = 0;
                for (JsonNode n : nodes) {
                    ProductEntity p = new ProductEntity();
                    p.setId(n.path("id").asText());
                    p.setName(n.path("name").asText());
                    p.setSlug(n.path("slug").asText());
                    p.setCategorySlug(n.path("categorySlug").asText());
                    p.setGender(n.path("gender").asText("nam"));
                    p.setBrand(n.path("brand").asText("SMARTBUY AI"));
                    p.setPrice(n.path("price").asLong(199000));
                    p.setOriginalPrice(n.path("originalPrice").asLong(p.getPrice()));
                    p.setCostPrice(n.path("costPrice").asLong(0));
                    p.setSuggestedPrice(n.path("suggestedPrice").asLong(p.getPrice()));
                    p.setApprovedPrice(n.path("approvedPrice").asLong(p.getPrice()));
                    p.setPriceStatus(n.path("priceStatus").asText("approved"));
                    p.setFolderKey(n.path("folderKey").asText());
                    p.setModelFolder(n.path("modelFolder").asText());
                    p.setShortDescription(n.path("shortDescription").asText());
                    p.setDescription(n.path("description").asText());
                    p.setMaterial(n.path("material").asText());
                    p.setFit(n.path("fit").asText());
                    p.setStyle(n.path("style").asText());
                    p.setSeason(n.path("season").asText());
                    p.setRating(n.path("rating").asDouble(4.8));
                    p.setReviewCount(n.path("reviewCount").asInt(12));
                    p.setIsActive(n.path("isActive").asBoolean(true));
                    p.setIsNewDrop(n.path("isNewDrop").asBoolean(false));
                    p.setIsBestSeller(n.path("isBestSeller").asBoolean(false));

                    // Images
                    JsonNode imagesNode = n.path("images");
                    if (imagesNode.isArray()) {
                        int order = 0;
                        for (JsonNode imgNode : imagesNode) {
                            String url = imgNode.asText();
                            p.getImages().add(new ProductImageEntity(p, url, order, order == 0));
                            order++;
                        }
                    }

                    // Variants
                    JsonNode variantsNode = n.path("variants");
                    if (variantsNode.isArray()) {
                        int vIdx = 1;
                        for (JsonNode vNode : variantsNode) {
                            ProductVariantEntity v = new ProductVariantEntity();
                            String rawVid = vNode.path("id").asText();
                            String candidateId = (rawVid != null && !rawVid.isBlank()) ? rawVid
                                    : (p.getId().toLowerCase() + "-v" + vIdx);
                            if (usedVariantIds.contains(candidateId)) {
                                candidateId = p.getId().toLowerCase() + "-" + candidateId + "-" + vIdx;
                            }
                            while (usedVariantIds.contains(candidateId)) {
                                candidateId = candidateId + "_" + vIdx;
                            }
                            usedVariantIds.add(candidateId);
                            v.setId(candidateId);
                            v.setProduct(p);
                            v.setSku(vNode.path("sku").asText());
                            v.setSize(vNode.path("size").asText("FreeSize"));
                            v.setStock(vNode.path("stock").asInt(10));
                            v.setPrice(vNode.path("price").asLong(p.getPrice()));
                            v.setOriginalPrice(vNode.path("originalPrice").asLong(p.getOriginalPrice()));
                            v.setImageUrl(vNode.path("image").asText());

                            JsonNode colorNode = vNode.path("color");
                            if (colorNode.isObject()) {
                                v.setColorName(colorNode.path("name").asText("Mặc định"));
                                v.setColorHex(colorNode.path("hex").asText("#111111"));
                                v.setColorSlug(colorNode.path("slug").asText("mac-dinh"));
                            }
                            p.getVariants().add(v);
                            vIdx++;
                        }
                    }

                    productRepository.save(p);
                    importedCount++;
                }

                log.info("ĐÃ NẠP THÀNH CÔNG {}/{} SẢN PHẨM VÀO DATABASE SPRING BOOT!", importedCount, nodes.size());

            } catch (Exception e) {
                log.error("Lỗi khi đọc file importedProducts.json: {}", e.getMessage(), e);
            }
        }
    }
}
