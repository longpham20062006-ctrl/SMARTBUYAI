import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { ArrowRight, Flame, Sparkles } from 'lucide-react';
import { getValidProductImages, isProductEligibleForPublicDisplay } from '@/lib/imageValidator';

interface ChatProductCardProps {
  product: Product;
  onItemClick?: () => void;
}

/**
 * SMARTBUY AI — CHAT PRODUCT CARD (MASTER PROMPT V20)
 * Hiển thị thẻ sản phẩm nhỏ gọn, tinh tế ngay trong cửa sổ chat:
 * - Ảnh thời trang tỷ lệ 3:4 hợp lệ (chống ảnh hỏng)
 * - Tên sản phẩm, thương hiệu SMARTBUY AI
 * - Giá bán VND (₫) và chiết khấu % thực tế
 * - Thông tin màu sắc và size có sẵn
 * - Nút "Xem chi tiết" dẫn sang /products/:slug
 */
export const ChatProductCard: React.FC<ChatProductCardProps> = ({ product, onItemClick }) => {
  if (!product || !isProductEligibleForPublicDisplay(product)) return null;

  const images = getValidProductImages(product);
  const displayImage = images[0] || '';
  if (!displayImage) return null;

  const currentPrice = product.price || 0;
  const originalPrice = product.originalPrice || 0;
  const hasDiscount = originalPrice > currentPrice && currentPrice > 0;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

  const colorCount = Array.isArray(product.colors) ? product.colors.length : 0;
  const availableSizes = Array.isArray(product.sizes) ? product.sizes.slice(0, 4) : ['S', 'M', 'L', 'XL'];

  return (
    <div
      data-testid="chat-product-card"
      className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-[#E4E4E7] hover:border-[#8B5CF6] hover:shadow-card transition-all group overflow-hidden"
    >
      {/* ẢNH TỶ LỆ 3:4 */}
      <Link
        to={`/products/${product.slug}`}
        onClick={onItemClick}
        className="w-14 h-[72px] rounded-xl overflow-hidden bg-[#F2F3F5] shrink-0 relative block"
        title={product.name}
      >
        <img
          src={displayImage}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-300"
          loading="lazy"
        />
        {hasDiscount && (
          <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-black px-1 py-0.5 rounded-xs leading-none">
            -{discountPercent}%
          </span>
        )}
      </Link>

      {/* THÔNG TIN SẢN PHẨM */}
      <div className="flex-1 min-w-0 text-left space-y-1">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8B5CF6] truncate">
            {product.brand || 'SMARTBUY AI'}
          </span>
          {colorCount > 1 && (
            <span className="text-[9px] font-semibold text-[#71717A] bg-[#F4F4F5] px-1.5 py-0.5 rounded-sm shrink-0">
              {colorCount} màu
            </span>
          )}
        </div>

        <Link
          to={`/products/${product.slug}`}
          onClick={onItemClick}
          className="text-xs font-bold text-[#18181B] group-hover:text-[#8B5CF6] transition-colors line-clamp-1 block leading-snug"
          title={product.name}
        >
          {product.name}
        </Link>

        {/* GIÁ THỰC TẾ TRONG DATABASE */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-xs sm:text-sm font-black text-[#18181B]">
            {formatPrice(currentPrice)}
          </span>
          {hasDiscount && (
            <span className="text-[10px] text-[#A1A1AA] line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        {/* CÁC SIZE CÓ SẴN */}
        {availableSizes.length > 0 && (
          <div className="flex items-center gap-1 text-[9px] text-[#71717A] font-medium pt-0.5">
            <span>Size:</span>
            <div className="flex items-center gap-0.5">
              {availableSizes.map((s) => (
                <span key={s} className="px-1 py-0.2 bg-[#F2F3F5] rounded text-[#3F3F46] font-semibold">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* NÚT XEM CHI TIẾT */}
      <div className="shrink-0 pl-1">
        <Link
          to={`/products/${product.slug}`}
          onClick={onItemClick}
          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#18181B] group-hover:bg-[#8B5CF6] active:scale-95 text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs whitespace-nowrap"
          title={`Xem chi tiết sản phẩm ${product.name}`}
        >
          <span>Xem chi tiết</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

