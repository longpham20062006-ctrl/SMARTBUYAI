import { CoupleSet } from '@/types';
import { IMPORTED_PRODUCTS } from './importedProducts';

// Dữ liệu Đồ đôi / Couple Outfits được liên kết từ sản phẩm thật đã xác minh
// Phân biệt rõ: Đồ đôi (2 người) khác hoàn toàn với Đồ bộ (1 người).
export const COUPLE_SETS: CoupleSet[] = [
  {
    id: 'COUPLE-001',
    name: 'Set Đồ Đôi Áo Thun NICE Typography Unisex (Chàng & Nàng)',
    slug: 'set-do-doi-ao-thun-nice-typography-unisex',
    maleProductId: 'TEE-001',
    femaleProductId: 'TEE-001',
    maleProductName: 'Áo Thun NICE Typography Form Rộng (Cho Chàng)',
    femaleProductName: 'Áo Thun NICE Typography Form Rộng (Cho Nàng)',
    bundlePrice: 349000, // Giá combo được duyệt (giá lẻ 159k x 2 = 318k, ưu đãi combo kèm quà tặng)
    originalPrice: 349000,
    discountPercent: 0,
    status: 'active',
    images: [
      '/images/san-pham/quan-ao-nam/ao/ao-thun/ao_thun_1/1792737335787_348043404565674403_5540743654312280467_b52994e6371efcb0693a02799c0879cf.jpg',
      '/images/san-pham/quan-ao-nam/ao/ao-thun/ao_thun_1/1792737335804_348043404565674403_5540743654312280467_9bf5e2215c2ec49ce0e74fec7a113d50.jpg'
    ],
    verified: true,
    description: 'Set áo thun đôi dáng rộng Unisex với chất vải Cotton compact 250gsm thoáng mát, thiết kế typography tối giản chuẩn gu dạo phố.'
  },
  {
    id: 'COUPLE-002',
    name: 'Set Đồ Đôi Hoodie Cyber Lửa Gothic & Mặt Cười Mùa Đông',
    slug: 'set-do-doi-hoodie-cyber-lua-gothic-mat-cuoi',
    maleProductId: 'HOODIE-001',
    femaleProductId: 'HOODIE-002',
    maleProductName: 'Áo Hoodie Nỉ Bông Cyber Chất Lừ (Cho Chàng)',
    femaleProductName: 'Áo Hoodie Zip Phom Rộng Y2K (Cho Nàng)',
    bundlePrice: 629000, // Combo 2 áo hoodie cao cấp
    originalPrice: 658000,
    discountPercent: 4,
    status: 'active',
    images: [
      '/images/san-pham/quan-ao-nam/ao/ao-hoodie/ao_hoodie_1/1792767146076_348043404565674403_5540743654312280467_a02ae46e3d9a651cf26099b281a34465.jpg',
      '/images/san-pham/quan-ao-nam/ao/ao-hoodie/ao_hoodie_2/1792767146083_348043404565674403_5540743654312280467_06821d3f6685bf95cf420e6fdfa40669.jpg'
    ],
    verified: true,
    description: 'Set áo hoodie đôi nỉ bông dày dặn ấm áp, phong cách Streetwear mùa đông dành cho các cặp đôi Gen Z.'
  },
  {
    id: 'COUPLE-003',
    name: 'Set Đồ Đôi Áo Len Preppy Hàn Quốc & Dệt Kim Pastel',
    slug: 'set-do-doi-ao-len-preppy-han-quoc-det-kim',
    maleProductId: 'SWEATER-001',
    femaleProductId: 'SWEATER-002',
    maleProductName: 'Áo Len Dệt Kim Hình Học Hàn Quốc (Cho Chàng)',
    femaleProductName: 'Áo Len Cổ Lọ Vặn Thừng Ấm Áp (Cho Nàng)',
    bundlePrice: 519000,
    originalPrice: 548000,
    discountPercent: 5,
    status: 'active',
    images: [
      '/images/san-pham/quan-ao-nam/ao/ao-len/ao_len_1/1792767424915_348043404565674403_5540743654312280467_b57790b9f91a5668dc44f0c744c84dbd.jpg',
      '/images/san-pham/quan-ao-nam/ao/ao-len/ao_len_2/1792767424933_348043404565674403_5540743654312280467_bb8864757c9a2961d9a263db1a4e21df.jpg'
    ],
    verified: true,
    description: 'Set áo len đôi sợi dệt mềm mại, phong cách học đường Hàn Quốc thanh lịch cho những buổi hẹn hò mùa thu đông.'
  }
];

export function getCoupleSetWithProducts(coupleSet: CoupleSet) {
  const male = IMPORTED_PRODUCTS.find((p) => p.id === coupleSet.maleProductId);
  const female = IMPORTED_PRODUCTS.find((p) => p.id === coupleSet.femaleProductId);
  return {
    ...coupleSet,
    maleProduct: male,
    femaleProduct: female,
  };
}
