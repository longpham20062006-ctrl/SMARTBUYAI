import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product, ColorOption } from '@/types';
import { formatPrice } from '@/lib/utils';
import { ColorSwatch } from '@/components/common/ColorSwatch';
import { Eye, ArrowRightLeft, Heart, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  onToggleCompare?: (product: Product) => void;
  isCompared?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onToggleCompare,
  isCompared = false,
}) => {
  const [selectedColor, setSelectedColor] = useState<ColorOption>(product.colors[0] || { name: 'Đen', hex: '#111', slug: 'den' });
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isSwitchingColor, setIsSwitchingColor] = useState(false);
  const { toast } = useToast();

  const matchedVariant = product.variants.find((v) => v.color.slug === selectedColor.slug);
  const colorImage = selectedColor.image || matchedVariant?.image;
  const primaryImage = colorImage || product.images[0] || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80';
  const secondaryImage = selectedColor.images?.[1] || product.images[1] || primaryImage;
  const currentImage = imgError
    ? 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80'
    : primaryImage;

  const currentPrice = matchedVariant?.price || product.price;
  const originalPrice = matchedVariant?.originalPrice || product.originalPrice;

  const handleSelectColor = (color: ColorOption) => {
    if (color.slug !== selectedColor.slug) {
      setIsSwitchingColor(true);
      setSelectedColor(color);
      setTimeout(() => setIsSwitchingColor(false), 200);
    }
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
    <div
      className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-[#E4E4E7] hover:border-[#DDD6FE] hover:shadow-card-hover transition-all duration-300 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Container ảnh tỷ lệ chuẩn 3:4 */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F2F3F5]">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-[#F2F3F5] animate-pulse" />
        )}
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
            className={`w-full h-full object-cover object-center transition-all duration-200 ease-out group-hover:scale-105 ${
              imageLoaded && !isSwitchingColor ? 'opacity-100 scale-100' : 'opacity-80 scale-[0.99]'
            }`}
          />
        </Link>

        {/* Badge góc trên bên trái */}
        {product.badge && (
          <div className="absolute top-2.5 left-2.5 pointer-events-none z-10">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-subtle ${
                product.badge === 'NEW' || product.badge === 'Mới'
                  ? 'bg-[#8B5CF6] text-white'
                  : product.badge === 'DROP' || product.badge === 'HOT'
                  ? 'bg-[#18181B] text-white'
                  : product.badge === 'UNISEX'
                  ? 'bg-[#F3E8FF] text-[#7C3AED] border border-[#DDD6FE]'
                  : 'bg-white text-[#18181B] border border-[#E4E4E7]'
              }`}
            >
              {product.badge === 'Mới' ? 'NEW' : product.badge === 'Tuyển chọn' ? 'TRENDING' : product.badge}
            </span>
          </div>
        )}

        {/* Action icons góc trên bên phải */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            onClick={handleLike}
            title={isLiked ? 'Bỏ thích' : 'Yêu thích'}
            className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs text-[#18181B] hover:text-[#8B5CF6] flex items-center justify-center shadow-subtle hover:scale-110 active:scale-95 transition-all cursor-pointer"
            aria-label={isLiked ? 'Bỏ thích' : 'Thêm vào yêu thích'}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#8B5CF6] text-[#8B5CF6]' : ''}`} />
          </button>

          {onToggleCompare && (
            <button
              onClick={handleCompare}
              title={isCompared ? 'Bỏ khỏi so sánh' : 'So sánh sản phẩm'}
              className={`w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs flex items-center justify-center shadow-subtle hover:scale-110 active:scale-95 transition-all cursor-pointer ${
                isCompared ? 'bg-[#18181B] text-[#8B5CF6]' : 'text-[#18181B] hover:text-[#8B5CF6]'
              }`}
              aria-label="So sánh sản phẩm"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {onQuickView && (
            <button
              onClick={handleQuickView}
              title="Xem nhanh"
              className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs text-[#18181B] hover:text-[#8B5CF6] flex items-center justify-center shadow-subtle hover:scale-110 active:scale-95 transition-all cursor-pointer"
              aria-label="Xem nhanh sản phẩm"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}

          <Link
            to={`/virtual-try-on?productId=${product.id}&slug=${product.slug}&color=${selectedColor.slug}&image=${encodeURIComponent(primaryImage)}`}
            title="✨ Thử đồ bằng AI"
            className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white flex items-center justify-center shadow-subtle hover:scale-110 active:scale-95 transition-all cursor-pointer"
            aria-label="Thử đồ bằng AI"
            onClick={(e) => e.stopPropagation()}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Hover buttons trượt lên ở desktop */}
        <div className="absolute bottom-2.5 inset-x-2.5 hidden sm:grid grid-cols-2 gap-1.5 transform translate-y-12 group-hover:translate-y-0 transition-transform duration-300 z-10">
          {onQuickView && (
            <button
              onClick={handleQuickView}
              className="flex items-center justify-center py-2 bg-[#18181B]/95 hover:bg-[#27272A] text-white text-[11px] font-semibold uppercase tracking-wider rounded-xl shadow-subtle cursor-pointer active:scale-98 transition-all"
            >
              Xem nhanh
            </button>
          )}
          <Link
            to={`/virtual-try-on?productId=${product.id}&slug=${product.slug}&color=${selectedColor.slug}&image=${encodeURIComponent(primaryImage)}`}
            onClick={(e) => e.stopPropagation()}
            className={`flex items-center justify-center gap-1 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[11px] font-semibold uppercase tracking-wider rounded-xl shadow-subtle cursor-pointer active:scale-98 transition-all ${
              !onQuickView ? 'col-span-2' : ''
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Thử đồ AI</span>
          </Link>
        </div>
      </div>

      {/* Thông tin sản phẩm */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5 bg-white">
        <div>
          {/* Thương hiệu & Phong cách */}
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-[#71717A] mb-1">
            <span className="truncate max-w-[130px]">{product.brand}</span>
            <span className="text-[#A1A1AA] font-normal">{product.style}</span>
          </div>

          {/* Tên sản phẩm cố định 2 dòng */}
          <Link
            to={`/products/${product.slug}`}
            className="block text-xs sm:text-sm font-semibold text-[#18181B] hover:text-[#8B5CF6] transition-colors line-clamp-2 leading-snug min-h-[2.5rem]"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Đánh giá & Số lượng đã bán kiểu Shopee / TikTok Shop */}
          <div className="flex items-center gap-1.5 text-[10px] text-[#71717A] mt-1">
            <span className="flex items-center text-amber-500 font-bold">
              ★ {product.rating ? Number(product.rating).toFixed(1) : '4.9'}
            </span>
            <span>•</span>
            <span className="text-[#71717A]">
              {product.soldCount ? `Đã bán ${product.soldCount}` : `Đã bán ${((product.reviewCount || 50) * 2)}`}
            </span>
          </div>
        </div>

        <div>
          {/* Swatches màu & Tên màu được chọn */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-[11px] text-[#71717A] mb-1.5">
              <span className="font-medium truncate max-w-[150px]">
                Màu: <strong className="text-[#18181B]">{selectedColor.name}</strong>
              </span>
              {product.colors.length > 1 && (
                <span className="text-[10px] text-[#8B5CF6] font-semibold shrink-0">
                  {product.colors.length} màu
                </span>
              )}
            </div>
            <ColorSwatch
              colors={product.colors}
              selectedColor={selectedColor}
              onSelectColor={handleSelectColor}
              size="sm"
            />
          </div>

          {/* Giá & Giảm giá */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F2F3F5]">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-[#18181B]">
                {formatPrice(currentPrice)}
              </span>
              {originalPrice && originalPrice > currentPrice && (
                <span className="text-[11px] text-[#A1A1AA] line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>

            {originalPrice && originalPrice > currentPrice && (
              <span className="text-[10px] font-bold text-[#7C3AED] bg-[#F3E8FF] px-1.5 py-0.5 rounded-sm shrink-0">
                -{Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
