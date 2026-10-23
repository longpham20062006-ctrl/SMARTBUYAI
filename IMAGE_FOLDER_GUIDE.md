# HƯỚNG DẪN QUẢN LÝ THƯ VIỆN HÌNH ẢNH THỜI TRANG SMARTBUY AI

Tài liệu này quy chuẩn toàn bộ kiến trúc thư mục ảnh, quy tắc đặt tên file, chuẩn mã SKU, và cách thức vận hành hệ thống hình ảnh cho SMARTBUY AI.

---

## 1. NGUYÊN TẮC TỔ CHỨC THƯ MỤC

Thư mục gốc của toàn bộ tài nguyên hình ảnh được đặt tại:
```
public/images/
```

### 1.1. Các nhóm thư mục cấp 1:
1. `san-pham/` — Chứa ảnh sản phẩm theo phân loại chuẩn tiếng Việt không dấu (quần áo nam, nữ, unisex, phụ kiện).
2. `thu-do/` — Tài nguyên dành riêng cho tính năng AI Virtual Try-On:
   - `nguoi-mau-mau/`: Ảnh người mẫu mẫu sẵn để người dùng thử đồ nhanh.
   - `quan-ao-mau/`: Ảnh trang phục mẫu để thử đồ.
   - `ket-qua-mau/`: Ảnh minh họa kết quả ghép đồ AI.
3. `danh-muc/` — Ảnh đại diện bìa cho các danh mục thời trang trên website.
4. `banner/` — Banner chiến dịch:
   - `trang-chu/`: Banner Hero trang chủ.
   - `bo-suu-tap/`: Banner các bộ sưu tập theo mùa.
   - `khuyen-mai/`: Banner các đợt flash sale, ưu đãi.
5. `lookbook/` — Ảnh phối đồ Lookbook chất lượng cao theo mùa và phong cách (`mua-he/`, `mua-dong/`, `streetwear-genz/`).
6. `mac-dinh/` — Ảnh placeholder mặc định khi hệ thống đang tải hoặc ảnh lỗi.

---

## 2. QUY CHUẨN ĐẶT TÊN THƯ MỤC VÀ ÁNH XẠ TIẾNG VIỆT

- **Quy tắc thư mục vật lý**: Toàn bộ tên thư mục là **tiếng Việt không dấu**, chữ thường (lowercase), các từ nối với nhau bằng dấu gạch ngang (`-`).
- **Quy tắc hiển thị**: Ánh xạ sang tiếng Việt chuẩn có dấu thông qua file `public/images/category-labels.json`.
- **Ví dụ**:
  - Đường dẫn thư mục: `public/images/san-pham/quan-ao-nam/ao/ao-thun-dai-tay/`
  - Tên hiển thị trên giao diện: **Quần áo nam → Áo → Áo thun dài tay**

---

## 3. CÂY THƯ MỤC CHI TIẾT (194 DANH MỤC ĐÃ TẠO)

### 3.1. Quần áo nam (`san-pham/quan-ao-nam/`)
* **Áo (`ao/`)**:
  - `ao-thun/`: `basic/`, `oversized/`, `hoa-tiet/`, `longline/`, `ke-soc/`
  - `ao-thun-dai-tay/`
  - `ao-so-mi/`: `tay-ngan/`, `tay-dai/`, `oversized/`, `flannel/`, `denim/`, `linen/`
  - `ao-polo/`: `tay-ngan/`, `tay-dai/`
  - `ao-ba-lo/`
  - `ao-hoodie/`: `chui-dau/`, `khoa-keo/`, `oversized/`
  - `ao-len/`: `co-tron/`, `co-tim/`, `oversized/`
  - `ao-cardigan/`, `ao-det-kim/`, `ao-sweatshirt/`
* **Áo khoác (`ao-khoac/`)**:
  - `ao-khoac-denim/`, `ao-khoac-da/`, `ao-khoac-bomber/`, `ao-khoac-varsity/`, `ao-khoac-gio/`, `ao-phao/`, `ao-blazer/`, `ao-trench-coat/`, `ao-mang-to/`, `ao-khoac-long-cuu/`, `ao-gile/`
* **Quần (`quan/`)**:
  - `quan-dai/`: `quan-jeans/` (`ong-dung/`, `ong-rong/`, `baggy/`, `ong-om/`, `rach-wash/`), `quan-cargo/`, `quan-tay/`, `quan-chinos/`, `quan-jogger/`, `quan-ni/`, `quan-linen/`, `quan-the-thao/`
  - `quan-short/`: `quan-short-denim/`, `quan-short-cargo/`, `quan-short-the-thao/`, `quan-short-casual/`, `quan-short-linen/`, `quan-short-bermuda/`
* **Đồ bộ (`do-bo/`)**:
  - `do-bo-casual/`, `do-bo-the-thao/`, `do-bo-streetwear/`, `do-bo-mua-he/`, `do-bo-mua-dong/`

### 3.2. Quần áo nữ (`san-pham/quan-ao-nu/`)
* **Áo (`ao/`)**:
  - `ao-thun/`, `ao-baby-tee/`, `ao-croptop/`, `ao-ba-lo/`, `ao-hai-day/`, `ao-quay/`, `ao-dai-tay/`, `ao-kieu-blouse/`, `ao-so-mi/`, `ao-polo/`, `ao-hoodie/`, `ao-len/`, `ao-cardigan/`, `ao-det-kim/`, `ao-tre-vai/`, `ao-co-yem/`
* **Áo khoác (`ao-khoac/`)**:
  - `ao-khoac-denim/`, `ao-khoac-da/`, `ao-blazer/`, `ao-khoac-lung-crop/`, `ao-khoac-bomber/`, `ao-phao/`, `ao-trench-coat/`, `ao-mang-to/`, `ao-khoac-gio/`
* **Quần (`quan/`)**:
  - `quan-jeans/` (`skinny/`, `ong-dung/`, `ong-rong/`, `baggy/`, `ong-loe/`), `quan-cargo/`, `quan-tay/`, `quan-legging/`, `quan-jogger/`, `quan-linen/`
  - `quan-short/` (`denim/`, `the-thao/`, `casual/`, `bermuda/`)
* **Váy đầm & Chân váy**:
  - `dam/`: `dam-ngan/`, `dam-midi/`, `dam-maxi/`, `dam-bodycon/`, `dam-hai-day-slip/`, `dam-so-mi/`, `dam-mua-he/`
  - `chan-vay/`: `chan-vay-ngan/`, `chan-vay-midi/`, `chan-vay-maxi/`, `chan-vay-xep-ly/`, `chan-vay-denim/`, `chan-vay-cargo/`
* **Đồ bộ (`do-bo/`)**:
  - `do-bo-set-matching/`, `do-bo-the-thao/`, `do-bo-casual/`, `do-bo-mua-he/`, `do-bo-mua-dong/`

### 3.3. Quần áo Unisex (`san-pham/unisex/`)
* `ao-thun/`, `ao-thun-dai-tay/`, `ao-hoodie/`, `ao-len/`, `ao-sweatshirt/`, `ao-so-mi/`, `ao-khoac/`, `quan-jeans/`, `quan-cargo/`, `quan-short/`, `quan-jogger/`, `do-bo/`

### 3.4. Phụ kiện thời trang (`san-pham/phu-kien/`)
* **Trang sức (`trang-suc/`)**:
  - `vong-co-day-chuyen/`: `xich/`, `mat-day-chuyen/`, `choker/`, `nhieu-tang/`, `ngoc-trai/`, `hat-beaded/`, `noi-bat-statement/`
  - `vong-tay-lac-tay/`: `xich/`, `hat-beaded/`, `da/`, `vong-cung-bangle/`, `cuff/`, `charm/`, `tinh-ban/`
  - `nhan/`: `minimal/`, `statement/`, `signet/`, `stackable/`, `dieu-chinh-size/`, `doi/`
  - `khuyen-tai/`: `chuoi-stud/`, `tron-hoop/`, `dang-dai-drop/`, `ear-cuff/`, `kep-clip-on/`
  - `trang-suc-khac/`: `lac-chan/`, `xich-co-the-body-chain/`, `cai-ao-brooch/`, `charm/`
* **Túi xách (`tui-xach/`)**:
  - `tui-tote/`, `tui-deo-cheo/`, `tui-kep-nach-shoulder/`, `tui-mini/`, `tui-xach-tay/`, `balo/`, `tui-bao-tu-waist/`, `clutch/`
* **Mũ nón (`mu-non/`)**:
  - `mu-luoi-trai/`, `mu-bucket/`, `mu-beanie-len/`, `mu-beret-noi/`, `mu-snapback/`
* **Phụ kiện khác (`phu-kien-khac/`)**:
  - `khan-quang/`, `that-lung/`, `kinh-ram/`, `kinh-thoi-trang/`, `gang-tay/`, `khan-bandana/`, `kep-toc/`, `bang-do/`, `chun-buoc-toc-scrunchie/`, `moc-khoa/`, `charm-treo-tui/`, `vi-tien/`, `tat-vo/`, `ca-vat/`

---

## 4. QUY TẮC ĐẶT TÊN TẬP TIN ẢNH (SKU NAMING CONVENTION)

Cấu trúc tên file:
```
[MÃ_SKU]-[MÀU_SẮC]-[GÓC_CHỤP].[ĐỊNH_DẠNG]
```

### Các thành phần:
1. **`[MÃ_SKU]`**: Mã định danh sản phẩm duy nhất (ví dụ: `HD001`, `JN002`, `TS099`, `NK001`).
2. **`[MÀU_SẮC]`**: Tên màu bằng tiếng Anh hoặc tiếng Việt không dấu (ví dụ: `black`, `white`, `blue`, `xam-khoi`, `washed`).
3. **`[GÓC_CHỤP]`**:
   - `front`: Ảnh chụp trực diện mặt trước (mặc định làm ảnh đại diện sản phẩm).
   - `back`: Ảnh chụp mặt sau.
   - `side`: Ảnh chụp góc nghiêng/bên hông.
   - `detail`: Ảnh chụp cận cảnh chất liệu vải, đường may, khóa kéo hoặc tem nhãn.
   - `model`: Ảnh người mẫu mặc thực tế trên studio/ngoại cảnh.
4. **`[ĐỊNH_DẠNG]`**: Khuyến nghị định dạng hiện đại tối ưu web:
   - `.webp` (Ưu tiên số 1, nén tốt, load nhanh).
   - `.jpg` / `.jpeg` / `.png` / `.avif`.

### Ví dụ hợp lệ:
* `HD001-black-front.webp`
* `HD001-black-back.webp`
* `HD001-black-detail.webp`
* `JN002-blue-front.webp`
* `BR001-silver-front.webp`

---

## 5. CÔNG CỤ TỰ ĐỘNG QUÉT VÀ CẬP NHẬT MANIFEST

Khi bạn thêm bất kỳ file ảnh mới nào vào các thư mục trên, hãy chạy lệnh sau từ terminal:

```bash
npm run images:scan
```

Lệnh này sẽ tự động:
1. Duyệt toàn bộ cây thư mục `public/images/`.
2. Phân tích tên file, trích xuất mã SKU, màu sắc, góc chụp và dung lượng.
3. Cập nhật dữ liệu ánh xạ vào file `public/images/image-manifest.json` để giao diện website và module AI Try-On nạp động tức thì.
