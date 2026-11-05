import { Product } from '@/types';

/**
 * SMARTBUY AI — PRODUCT DISCOVERY ORDERING ENGINE
 * 
 * Quy tắc Phần E:
 * Khi khách ở chế độ "TẤT CẢ SẢN PHẨM" (Khám phá mặc định - không chọn giới tính,
 * không chọn danh mục, không tìm kiếm, không sort giá):
 * - Ưu tiên 80% vị trí hiển thị cho VÁY NỮ (4 váy : 1 sản phẩm khác).
 * - Các sản phẩm khác (Đồ Nam, Áo thun Nữ, Hoodie, Quần jeans...) chiếm 20% và được xen kẽ tự nhiên.
 * - Sắp xếp ổn định (Deterministic), không dùng Math.random(), không lặp ID, bảo toàn đầy đủ 273 sản phẩm.
 * - Khi khách chọn lọc cụ thể (Nam, Nữ, Váy...) hoặc sắp xếp theo Giá, thuật toán nhường quyền cho bộ lọc đó.
 */

export function isDressOrSkirt(product: Product): boolean {
  if (product.gender !== 'nu') return false;
  const cat = (product.categorySlug || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  return (
    cat === 'vay' ||
    cat === 'nu-vay' ||
    cat.includes('vay') ||
    name.includes('váy') ||
    name.includes('đầm')
  );
}

export function getDiscoveryOrderedProducts(
  products: Product[],
  isDefaultDiscoveryMode: boolean
): Product[] {
  if (!isDefaultDiscoveryMode || products.length === 0) {
    return products;
  }

  // Phân chia 2 nhóm dữ liệu giữ nguyên thứ tự gốc (Deterministic)
  const dresses: Product[] = [];
  const others: Product[] = [];

  for (const p of products) {
    if (isDressOrSkirt(p)) {
      dresses.push(p);
    } else {
      others.push(p);
    }
  }

  // Nếu không có váy nữ hoặc không có sản phẩm khác, trả về danh sách gốc
  if (dresses.length === 0 || others.length === 0) {
    return products;
  }

  const result: Product[] = [];
  const seenIds = new Set<string>();

  let dIdx = 0;
  let oIdx = 0;

  // Xen kẽ theo chu kỳ: 4 Váy Nữ (80%) : 1 Sản phẩm khác (20%)
  while (dIdx < dresses.length && oIdx < others.length) {
    // Thêm tối đa 4 váy
    for (let i = 0; i < 4 && dIdx < dresses.length; i++) {
      const d = dresses[dIdx++];
      if (!seenIds.has(d.id)) {
        seenIds.add(d.id);
        result.push(d);
      }
    }

    // Thêm 1 sản phẩm khác
    if (oIdx < others.length) {
      const o = others[oIdx++];
      if (!seenIds.has(o.id)) {
        seenIds.add(o.id);
        result.push(o);
      }
    }
  }

  // Đưa toàn bộ các váy còn lại (nếu có)
  while (dIdx < dresses.length) {
    const d = dresses[dIdx++];
    if (!seenIds.has(d.id)) {
      seenIds.add(d.id);
      result.push(d);
    }
  }

  // Đưa toàn bộ các sản phẩm khác còn lại (bảo toàn 100% catalog)
  while (oIdx < others.length) {
    const o = others[oIdx++];
    if (!seenIds.has(o.id)) {
      seenIds.add(o.id);
      result.push(o);
    }
  }

  return result;
}
