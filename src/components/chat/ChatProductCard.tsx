import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { ArrowRight, Sparkles, ShoppingBag, Check } from 'lucide-react';
import { getValidProductImages, isProductEligibleForPublicDisplay } from '@/lib/imageValidator';
import { MockRepo } from '@/mocks/repository';
import { useToast } from '@/components/ui/toast';

interface ChatProductCardProps {
  product: Product;
  onItemClick?: () => void;
}

/**
 * SMARTBUY AI — ENHANCED CHAT PRODUCT CARD
 * - Ảnh tỷ lệ 3:4 chuẩn thời trang
 * - Tên sản phẩm, thương hiệu, giá thật từ CSDL
 * - Nút "Thử đồ AI" dẫn thẳng vào phòng thử /virtual-try-on (không cần tìm lại)
 * - Nút "Thêm giỏ" nhanh với hỗ trợ phân quyền khách/đăng nhập
 * - Nút "Chi tiết" xem sản phẩm
 */
export const ChatProductCard: React.FC<ChatProductCardProps> = ({ product, onItemClick }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdded, setIsAdded] = useState(false);

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

  const currentUser = MockRepo.getCurrentUser();
  const isGuest = !currentUser;

  // Điều hướng thử đồ AI với dữ liệu sản phẩm truyền qua URL
  const handleTryOn = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onItemClick?.();
    const tryOnUrl = `/virtual-try-on?productId=${encodeURIComponent(product.id)}&slug=${encodeURIComponent(product.slug)}&image=${encodeURIComponent(displayImage)}&name=${encodeURIComponent(product.name)}`;
    navigate(tryOnUrl);
  };

  // Thêm nhanh vào giỏ hàng
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isGuest) {
      toast('Vui lòng đăng nhập', 'Đăng nhập tài khoản để mua sắm và quản lý giỏ hàng!', 'info');
      navigate(`/login?redirect=${encodeURIComponent('/products/' + product.slug)}`);
      return;
    }

    const selectedSize = availableSizes[0] || 'M';
    const defaultColor = product.colors?.[0] || {
      name: 'Tiêu chuẩn',
      hex: '#000000',
      slug: 'tieu-chuan',
    };

    const cartItem = {
      id: `${product.id}-${defaultColor.slug}-${selectedSize}`,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      brand: product.brand || 'SMARTBUY AI',
      price: product.price,
      originalPrice: product.originalPrice,
      image: displayImage,
      color: defaultColor,
      size: selectedSize as any,
      quantity: 1,
    };

    const res = MockRepo.addToCart(cartItem);
    if (res.success) {
      setIsAdded(true);
      toast('Đã thêm vào giỏ', `${product.name} (Size ${selectedSize})`, 'success');
      setTimeout(() => setIsAdded(false), 2000);
    } else {
      toast('Thông báo', res.message || 'Không thể thêm vào giỏ', 'error');
    }
  };

  return (
    <div
      data-testid="chat-product-card"
      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 rounded-2xl bg-white border border-[#E4E4E7] hover:border-[#8B5CF6] hover:shadow-card transition-all group overflow-hidden"
    >
      {/* ẢNH TỶ LỆ 3:4 & THÔNG TIN CHÍNH */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Link
          to={`/products/${product.slug}`}
          onClick={onItemClick}
          className="w-16 h-20 rounded-xl overflow-hidden bg-[#F2F3F5] shrink-0 relative block"
          title={product.name}
        >
          <img
            src={displayImage}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-300"
            loading="lazy"
          />
          {hasDiscount && (
            <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-black px-1 py-0.5 rounded-xs leading-none shadow-xs">
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
      </div>

      {/* CỤM NÚT THAO TÁC: THỬ ĐỒ AI + THÊM GIỎ + XEM */}
      <div className="flex items-center sm:flex-col justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F4F4F5]">
        {/* NÚT THỬ ĐỒ AI */}
        <button
          type="button"
          onClick={handleTryOn}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] hover:from-[#7C3AED] hover:to-[#0891B2] active:scale-95 text-white text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-xs whitespace-nowrap"
          title={`Thử ${product.name} ngay bằng công nghệ AI`}
        >
          <Sparkles className="w-3 h-3 text-amber-200 animate-pulse" />
          <span>Thử đồ AI</span>
        </button>

        {/* NÚT THÊM VÀO GIỎ */}
        <button
          type="button"
          onClick={handleAddToCart}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs whitespace-nowrap ${
            isAdded
              ? 'bg-emerald-600 text-white'
              : 'bg-[#18181B] hover:bg-[#27272A] active:scale-95 text-white'
          }`}
          title="Thêm nhanh vào giỏ hàng"
        >
          {isAdded ? (
            <>
              <Check className="w-3 h-3" />
              <span>Đã thêm</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3 h-3" />
              <span>Thêm giỏ</span>
            </>
          )}
        </button>

        {/* NÚT XEM CHI TIẾT */}
        <Link
          to={`/products/${product.slug}`}
          onClick={onItemClick}
          className="inline-flex items-center justify-center p-1.5 rounded-xl hover:bg-[#F4F4F5] text-[#71717A] hover:text-[#18181B] transition-all cursor-pointer"
          title="Xem trang chi tiết sản phẩm"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
