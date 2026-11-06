/**
 * SMARTBUY AI — PRODUCT IMAGE & PRICE VALIDATION ENGINE
 * Quy tắc nhất quán để xác định sản phẩm và biến thể đủ điều kiện hiển thị trên website công khai.
 * 
 * NGUYÊN TẮC:
 * 1. Chỉ hiển thị sản phẩm khi có ảnh thật tồn tại 100% trên đĩa (đối chiếu REAL_DISK_IMAGE_PATHS_SET).
 * 2. Không sử dụng ảnh placeholder hoặc ảnh tạm thay thế cho sản phẩm.
 * 3. Sản phẩm phải có giá bán hợp lệ (> 0). Sản phẩm thiếu giá hoặc giá 0 bị ẩn khỏi khách, giữ trong Admin.
 * 4. Không xóa sản phẩm khỏi cơ sở dữ liệu.
 */

import { Product, ProductVariant } from '@/types';
import { REAL_DISK_IMAGE_PATHS_SET } from '@/constants/validImagePaths';

/**
 * Kiểm tra một đường dẫn ảnh có phải là đường dẫn ảnh thật tồn tại trên đĩa hay không
 */
export function isValidImagePath(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  if (!clean) return false;

  // Loại trừ hoàn toàn các đường dẫn placeholder hoặc giả lập
  if (
    clean.includes('unsplash.com') ||
    clean.includes('placeholder') ||
    clean.includes('via.placeholder') ||
    clean === '/placeholder.svg' ||
    clean === 'null' ||
    clean === 'undefined'
  ) {
    return false;
  }

  const normalized = (clean.startsWith('/') ? clean : '/' + clean).toLowerCase();

  // Nếu là ảnh sản phẩm nội bộ: BẮT BUỘC phải đối chiếu với 606 ảnh THẬT trên đĩa!
  if (normalized.startsWith('/images/san-pham/')) {
    return REAL_DISK_IMAGE_PATHS_SET.has(normalized);
  }

  // Chấp nhận ảnh giao diện tĩnh nội bộ hợp chuẩn
  if (normalized.startsWith('/images/anh_trangchu/') || normalized.startsWith('/images/categories/')) {
    return true;
  }

  return false;
}

/**
 * Lấy danh sách ảnh hợp lệ (thật 100%) của một sản phẩm
 */
export function getValidProductImages(product?: Product | null): string[] {
  if (!product || !Array.isArray(product.images)) return [];
  return product.images.filter((img) => isValidImagePath(img));
}

/**
 * Kiểm tra sản phẩm có ít nhất 1 ảnh hợp lệ để hiển thị hay không
 */
export function hasValidProductImage(product?: Product | null): boolean {
  if (!product) return false;
  const validImages = getValidProductImages(product);
  return validImages.length > 0;
}

/**
 * Kiểm tra sản phẩm có giá bán hợp lệ (> 0) hay không
 */
export function hasValidProductPrice(product?: Product | null): boolean {
  if (!product) return false;
  // Master Prompt V18: Trong chế độ Guest Lookbook, backend bảo mật giá thành null.
  // Chỉ từ chối sản phẩm có giá số 0 lỗi. Giá null (bảo mật cho Guest) hoặc > 0 đều hợp lệ.
  if (product.price === 0) return false;
  return product.price === null || (typeof product.price === 'number' && product.price > 0);
}

/**
 * Kiểm tra sản phẩm có đủ điều kiện hiển thị trên cửa hàng công khai hay không
 * Điều kiện:
 * 1. Product ID hợp lệ
 * 2. Đang kích hoạt (isActive === true)
 * 3. Có ít nhất một ảnh thật tồn tại và hợp lệ trên đĩa (hasValidProductImage)
 * 4. Không bị lỗi giá = 0 (Master Prompt V18: giá null của Guest được bảo lưu để hiển thị Lookbook)
 */
export function isProductEligibleForPublicDisplay(product?: Product | null): boolean {
  if (!product || !product.id) return false;
  if (!product.isActive) return false;
  if (!hasValidProductImage(product)) return false;
  if (product.price === 0) return false;
  return true;
}

/**
 * Lọc biến thể màu sắc có ảnh hợp lệ
 */
export function getValidProductVariants(product?: Product | null): ProductVariant[] {
  if (!product || !Array.isArray(product.variants)) return [];

  // Nếu sản phẩm không có biến thể nào có ảnh riêng, trả về toàn bộ biến thể hiện có (sử dụng ảnh chung của sản phẩm)
  const hasVariantSpecificImages = product.variants.some((v) => isValidImagePath(v.image));
  if (!hasVariantSpecificImages) {
    return product.variants;
  }

  // Nếu có ảnh riêng cho từng màu, chỉ giữ lại những biến thể có ảnh hợp lệ trong danh sách xem ảnh
  return product.variants.filter((v) => !v.image || isValidImagePath(v.image));
}
