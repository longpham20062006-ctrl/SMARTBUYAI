import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Eye, ArrowRightLeft, Heart, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product, initialImageIndex?: number) => void;
  onToggleCompare?: (product: Product) => void;
  isCompared?: boolean;
  showPrice?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onToggleCompare,
  isCompared = false,
  showPrice = true,
}) => {
  if (!product) return null;

  const images = (Array.isArray(product.images) && product.images.length > 0)
    ? product.images.filter(Boolean)
    : ['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80'];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const { toast } = useToast();

  const touchStartX = useRef<number | null>(null);

  const currentPrice = product.price ?? 0;
  const originalPrice = product.originalPrice ?? 0;

  // Xử lý chuyển ảnh bằng mũi tên (chỉ bấm mũi tên mới chuyển)
  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length <= 1) return;
    setIsSwitching(true);
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setTimeout(() => setIsSwitching(false), 180);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length <= 1) return;
    setIsSwitching(true);
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsSwitching(false), 180);
  };

  // Hỗ trợ vuốt chạm touch/swipe trên mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || images.length <= 1) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Vuốt sang trái -> xem ảnh kế tiếp
        setIsSwitching(true);
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        setTimeout(() => setIsSwitching(false), 180);
      } else {
        // Vuốt sang phải -> xem ảnh trước đó
        setIsSwitching(true);
        setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
        setTimeout(() => setIsSwitching(false), 180);
      }
    }
    touchStartX.current = null;
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
    toast(
      !isLiked ? 'Đã lưu vào danh sách yêu thích' : 'Đã xóa khỏi danh sách yêu thích',
      product.name || 'Sản phẩm',
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
    onQuickView?.(product, currentImageIndex);
  };

  const safeIndex = currentImageIndex >= 0 && currentImageIndex < images.length ? currentImageIndex : 0;
  const displayImage = imgError
    ? 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80'
    : images[safeIndex] || images[0];

  // Xác định chú thích màu sắc / góc chụp chuẩn xác:
  // - Nếu nhiều màu đã xác minh: "Có X màu sắc"
  // - Nếu 1 màu và nhiều ảnh góc chụp: "Nhiều ảnh chi tiết"
  // - Nếu nhiều ảnh chưa phân loại: "Xem thêm ảnh"
  // - Nếu chỉ có 1 ảnh: không hiển thị
  const productColors = Array.isArray(product.colors) ? product.colors : [];
  const verifiedColors = productColors.filter((c) => c && c.slug !== 'chua-xac-minh' && c.slug !== 'phoi-mau');
  const hasMultipleVerifiedColors = verifiedColors.length > 1;
  const hasSingleColorMultipleImages = (productColors.length <= 1 && images.length > 1) || (verifiedColors.length === 1 && images.length > 1);
  const hasUnverifiedMultipleImages = productColors.length > 1 && verifiedColors.length <= 1 && images.length > 1;

  let colorAnnotation: string | null = null;
  if (hasMultipleVerifiedColors) {
    colorAnnotation = `Có ${verifiedColors.length} màu sắc`;
  } else if (hasSingleColorMultipleImages) {
    colorAnnotation = 'Nhiều ảnh chi tiết';
  } else if (hasUnverifiedMultipleImages) {
    colorAnnotation = 'Xem thêm ảnh';
  }

  return (
    <div
      className={`group flex flex-col h-full bg-white rounded-2xl border border-[#E4E4E7] hover:border-[#DDD6FE] hover:shadow-card-hover transition-all duration-300 relative ${
        isHovered ? 'z-20' : 'z-0'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Container ảnh tỷ lệ chuẩn 3:4 với Carousel mũi tên */}
      <div
        className="relative aspect-[3/4] w-full overflow-hidden rounded-t-2xl bg-[#F2F3F5] select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {!imageLoaded && (
          <div className="absolute inset-0 bg-[#F2F3F5] animate-pulse" />
        )}
        <Link to={`/products/${product.slug}`} className="block w-full h-full">
          <img
            src={displayImage}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImgError(true);
              setImageLoaded(true);
            }}
            className={`w-full h-full object-cover object-center transition-all duration-200 ease-out group-hover:scale-105 ${
              imageLoaded && !isSwitching ? 'opacity-100 scale-100' : 'opacity-85 scale-[0.99]'
            }`}
          />
        </Link>

        {/* Nút mũi tên TRÁI / PHẢI (chỉ hiện khi có từ 2 ảnh trở lên) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Xem ảnh trước"
              title="Ảnh trước"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/85 hover:bg-white text-[#18181B] hover:text-[#8B5CF6] shadow-sm flex items-center justify-center transition-all cursor-pointer z-10 active:scale-90 opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Xem ảnh tiếp theo"
              title="Ảnh tiếp theo"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/85 hover:bg-white text-[#18181B] hover:text-[#8B5CF6] shadow-sm flex items-center justify-center transition-all cursor-pointer z-10 active:scale-90 opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Bộ đếm ảnh nhỏ gọn (Ví dụ 1/4) */}
            <div className="absolute bottom-2.5 right-2.5 pointer-events-none z-10">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white backdrop-blur-xs tracking-wider">
                {currentImageIndex + 1}/{images.length}
              </span>
            </div>
          </>
        )}

        {/* Badge góc trên bên trái */}
        {product.isSetItem || product.categorySlug === 'do-bo' ? (
          <div className="absolute top-2.5 left-2.5 pointer-events-none z-10">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white shadow-subtle">
              SET NGUYÊN BỘ
            </span>
          </div>
        ) : product.badge ? (
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
        ) : null}

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
            to={`/virtual-try-on?productId=${product.id}&slug=${product.slug}&image=${encodeURIComponent(displayImage)}`}
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
            to={`/virtual-try-on?productId=${product.id}&slug=${product.slug}&image=${encodeURIComponent(displayImage)}`}
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
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5 bg-white rounded-b-2xl">
        <div>
          {/* Tên sản phẩm cố định 2 dòng */}
          <Link
            to={`/products/${product.slug}`}
            className="block text-xs sm:text-sm font-bold text-[#18181B] hover:text-[#8B5CF6] transition-colors line-clamp-2 leading-snug min-h-[2.5rem]"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Thông tin Size có sẵn */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              <span className="text-[10px] text-[#A1A1AA] uppercase font-medium">Size:</span>
              {product.sizes.slice(0, 5).map((s) => (
                <span
                  key={s}
                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F2F3F5] text-[#52525B]"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          {/* Dòng chú thích thông tin nhiều màu / nhiều ảnh chi tiết (Thay thế hoàn toàn chấm màu) */}
          {colorAnnotation && (
            <div className="mb-2 flex items-center gap-1.5 text-[11px] text-[#71717A] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] shrink-0" />
              <span>{colorAnnotation}</span>
            </div>
          )}

          {/* Giá & Giảm giá hoặc Nút Chi tiết */}
          {showPrice ? (
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F2F3F5]">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                {currentPrice && currentPrice > 0 ? (
                  <>
                    <span className="text-sm sm:text-base font-bold text-[#18181B]">
                      {formatPrice(currentPrice)}
                    </span>
                    {originalPrice && originalPrice > currentPrice && (
                      <span className="text-[11px] text-[#A1A1AA] line-through">
                        {formatPrice(originalPrice)}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs sm:text-sm font-semibold text-[#71717A] italic">
                    Liên hệ / Đang cập nhật
                  </span>
                )}
              </div>

              {currentPrice && currentPrice > 0 && originalPrice && originalPrice > currentPrice && (
                <span className="text-[10px] font-bold text-[#7C3AED] bg-[#F3E8FF] px-1.5 py-0.5 rounded-sm shrink-0">
                  -{Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}%
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F2F3F5]">
              <span className="text-[11px] font-bold text-[#8B5CF6] uppercase tracking-wider truncate max-w-[120px]">
                {product.brand || 'SMARTBUY AI'}
              </span>
              <Link
                to={`/products/${product.slug}`}
                className="text-xs font-bold text-[#18181B] hover:text-[#8B5CF6] transition-colors flex items-center gap-1 group/btn shrink-0"
              >
                <span>Chi tiết</span>
                <span className="transition-transform group-hover/btn:translate-x-0.5">→</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

