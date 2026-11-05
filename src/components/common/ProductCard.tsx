import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product, ColorOption } from '@/types';
import { formatPrice } from '@/lib/utils';
import { ColorSwatch } from '@/components/common/ColorSwatch';
import { Eye, ArrowRightLeft, Heart, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  onToggleCompare?: (product: Product) => void;
  isCompared?: boolean;
  hidePrice?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onToggleCompare,
  isCompared = false,
  hidePrice = false,
}) => {
  const [selectedColor, setSelectedColor] = useState<ColorOption>(
    product.colors[0] || { name: 'Mặc định', hex: '#111', slug: 'default' }
  );
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { toast } = useToast();

  const matchedVariant = product.variants.find((v) => v.color.slug === selectedColor.slug);
  const colorImage = selectedColor.image || matchedVariant?.image;
  const primaryImage =
    colorImage || product.images[0] || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80';
  const currentImage = imgError
    ? 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80'
    : primaryImage;

  const currentPrice = matchedVariant?.price || product.price;
  const originalPrice = matchedVariant?.originalPrice || product.originalPrice;
  const discountPercent =
    originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;

  const handleSelectColor = (color: ColorOption) => {
    setSelectedColor(color);
  };

  const handlePrevColor = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.colors.length <= 1) return;
    const currentIndex = product.colors.findIndex((c) => c.slug === selectedColor.slug);
    const prevIndex = (currentIndex - 1 + product.colors.length) % product.colors.length;
    setSelectedColor(product.colors[prevIndex]);
  };

  const handleNextColor = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.colors.length <= 1) return;
    const currentIndex = product.colors.findIndex((c) => c.slug === selectedColor.slug);
    const nextIndex = (currentIndex + 1) % product.colors.length;
    setSelectedColor(product.colors[nextIndex]);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
    toast(
      !isLiked ? 'Đã lưu vào danh sách yêu thích' : 'Đã xóa khỏi danh sách yêu thích',
      product.name,
      'info'
    );
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleCompare?.(product);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  return (
    <div className="group flex flex-col h-full bg-white rounded-xl border border-[#ECEAE7] hover:border-[#18181B] hover:shadow-card-hover transition-all duration-200 relative overflow-hidden">
      {/* 3:4 Aspect Ratio Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F0EFED]">
        {!imageLoaded && <div className="absolute inset-0 bg-[#F0EFED] animate-pulse" />}
        <Link to={`/products/${product.slug}`} className="block w-full h-full">
          <img
            src={currentImage}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImgError(true);
              setImageLoaded(true);
            }}
            className={`w-full h-full object-cover object-top transition-transform duration-300 ease-out group-hover:scale-[1.03] ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </Link>

        {/* Color navigation chevrons for multi-color products */}
        {product.colors.length > 1 && (
          <>
            <button
              onClick={handlePrevColor}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/85 hover:bg-white text-[#18181B] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-xs cursor-pointer"
              title="Màu trước"
              aria-label="Màu trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextColor}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/85 hover:bg-white text-[#18181B] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-xs cursor-pointer"
              title="Màu kế tiếp"
              aria-label="Màu kế tiếp"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {/* Badges: HOT / NEW / SALE - Modern Monochrome V4.2 */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 pointer-events-none z-10">
          {discountPercent > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FEE2E2] text-[#B91C1C]">
              -{discountPercent}%
            </span>
          )}
          {product.badge && product.badge !== 'SALE' && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                product.badge === 'HOT' || product.badge === 'DROP'
                  ? 'bg-[#18181B] text-white'
                  : product.badge === 'NEW' || product.badge === 'Mới'
                  ? 'bg-[#F0EFED] text-[#18181B] border border-[#ECEAE7]'
                  : 'bg-[#18181B] text-white'
              }`}
            >
              {product.badge === 'Mới' ? 'NEW' : product.badge}
            </span>
          )}
        </div>

        {/* Priority Actions: Wishlist (Heart) always visible/accessible, QuickView & Compare on hover */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 z-10">
          <button
            onClick={handleLike}
            title={isLiked ? 'Bỏ thích' : 'Yêu thích'}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 backdrop-blur-xs text-[#18181B] hover:text-[#B91C1C] flex items-center justify-center shadow-subtle hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label={isLiked ? 'Bỏ thích' : 'Thêm vào yêu thích'}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLiked ? 'fill-[#B91C1C] text-[#B91C1C]' : ''}`} />
          </button>

          {onQuickView && (
            <button
              onClick={handleQuickView}
              title="Xem nhanh"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 backdrop-blur-xs text-[#18181B] hover:text-[#18181B] flex items-center justify-center shadow-subtle hover:scale-105 active:scale-95 transition-all cursor-pointer"
              aria-label="Xem nhanh sản phẩm"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}

          {onToggleCompare && (
            <button
              onClick={handleCompare}
              title={isCompared ? 'Bỏ khỏi so sánh' : 'So sánh sản phẩm'}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 backdrop-blur-xs flex items-center justify-center shadow-subtle hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                isCompared ? 'bg-[#18181B] text-white' : 'text-[#18181B] hover:text-[#18181B]'
              }`}
              aria-label="So sánh sản phẩm"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Hover action "Xem chi tiết" trượt lên ở desktop */}
        <div className="absolute bottom-2.5 inset-x-2.5 hidden sm:block transform translate-y-12 group-hover:translate-y-0 transition-transform duration-200 z-10">
          <Link
            to={`/products/${product.slug}`}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#18181B] hover:bg-[#27272A] text-white text-[11px] font-semibold tracking-wider uppercase rounded-lg shadow-subtle transition-colors"
          >
            <span>Xem chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Thông tin sản phẩm */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-2 bg-white">
        <div>
          {/* Phân loại / thương hiệu */}
          <div className="text-[11px] text-[#78716C] truncate uppercase tracking-wider font-medium">
            {product.categorySlug || product.brand}
          </div>

          {/* Tên sản phẩm */}
          <Link
            to={`/products/${product.slug}`}
            className="block text-xs sm:text-sm font-semibold text-[#18181B] hover:text-[#78716C] transition-colors line-clamp-1 mt-0.5"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Mô tả ngắn nếu có */}
          {product.shortDescription && (
            <p className="text-[11px] text-[#78716C] line-clamp-1 mt-0.5 font-normal">
              {product.shortDescription}
            </p>
          )}
        </div>

        {/* Nút Xem chi tiết cho mobile hoặc Color Swatches & Price */}
        {hidePrice ? (
          <div className="pt-2 border-t border-[#ECEAE7] flex items-center justify-between">
            <span className="text-[11px] text-[#78716C] font-medium">
              {product.colors.length > 1 ? `${product.colors.length} màu sắc` : 'Thiết kế chuẩn'}
            </span>
            <Link
              to={`/products/${product.slug}`}
              className="text-xs font-semibold text-[#18181B] hover:text-[#78716C] inline-flex items-center gap-1 sm:hidden"
            >
              <span>Chi tiết</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div>
            {/* Color Swatch / Variants Selection */}
            {product.colors.length > 1 && (
              <div className="mb-2">
                <ColorSwatch
                  colors={product.colors}
                  selectedColor={selectedColor}
                  onSelectColor={handleSelectColor}
                  size="sm"
                />
              </div>
            )}

            {/* Hiển thị giá VND + Giảm giá */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#ECEAE7]">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-[#18181B]">
                  {formatPrice(currentPrice)}
                </span>
                {originalPrice && originalPrice > currentPrice && (
                  <span className="text-[11px] text-[#78716C] line-through font-normal">
                    {formatPrice(originalPrice)}
                  </span>
                )}
              </div>
              {product.colors.length > 1 && (
                <span className="text-[10px] text-[#78716C] hidden sm:inline">
                  {product.colors.length} màu
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
