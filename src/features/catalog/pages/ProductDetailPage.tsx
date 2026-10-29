import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productService } from '@/services/productService';
import { MockRepo } from '@/mocks/repository';
import { ColorOption, SizeCode, Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SizeSelector } from '@/components/common/SizeSelector';
import { ProductCard } from '@/components/common/ProductCard';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import {
  ShoppingBag,
  Heart,
  Share2,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Check,
  Leaf,
  Plus,
  Minus,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const ProductDetailContent: React.FC<{ product: Product }> = ({ product }) => {
  const navigate = useNavigate();
  const { success, error, toast } = useToast();

  const isAccessory = Boolean(
    product.categorySlug === 'phu-kien' ||
    (Array.isArray(product.sizes) && product.sizes.length === 1 && product.sizes[0] === 'FreeSize')
  );

  const colorsList = Array.isArray(product.colors) ? product.colors : [];
  const variantsList = Array.isArray(product.variants) ? product.variants : [];
  const sizesList = Array.isArray(product.sizes) ? product.sizes : ['FreeSize'];
  const defaultColor: ColorOption = colorsList[0] || { name: 'Mặc định', hex: '#111111', slug: 'mac-dinh' };

  // Selected options initialized directly from product
  const [selectedColor, setSelectedColor] = useState<ColorOption>(defaultColor);
  const [selectedSize, setSelectedSize] = useState<SizeCode | undefined>(() => {
    if (isAccessory || sizesList.includes('FreeSize')) return 'FreeSize';
    const firstColorSlug = defaultColor.slug;
    const firstAvailable = variantsList.find(
      (v) => (v.color?.slug === firstColorSlug || v.colorId === defaultColor.id) && v.stock > 0
    )?.size || sizesList[0];
    return firstAvailable;
  });
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Active variant
  const activeVariant = variantsList.find(
    (v) => (v.color?.slug === selectedColor?.slug || v.colorId === selectedColor?.id) && v.size === selectedSize
  ) || variantsList.find((v) => v.size === selectedSize) || variantsList[0];

  const availableSizes = variantsList
    .filter((v) => (v.color?.slug === selectedColor?.slug || v.colorId === selectedColor?.id) && v.stock > 0)
    .map((v) => v.size);

  const currentPrice = activeVariant?.price || product.price || 0;
  const originalPrice = activeVariant?.originalPrice || product.originalPrice || 0;
  const currentStock = activeVariant?.stock ?? 10;

  const relatedProducts = productService.getRelated(product, 4);
  const suggestedAccessories = productService.getAccessories(4);

  const handleAddToCart = (directToCheckout: boolean = false) => {
    if (!currentPrice || currentPrice <= 0) {
      error('Sản phẩm đang cập nhật giá chính thức, tạm thời chưa mở bán.');
      return;
    }

    if (!selectedSize || !activeVariant) {
      error('Vui lòng chọn kích cỡ phù hợp');
      return;
    }

    if (currentStock <= 0) {
      error('Biến thể này hiện đã hết hàng trong kho');
      return;
    }

    if (quantity > currentStock) {
      error(`Kho chỉ còn ${currentStock} sản phẩm cho kích cỡ này`);
      return;
    }

    setIsAdding(true);
    setTimeout(() => {
      const res = MockRepo.addToCart({
        id: activeVariant.id,
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        brand: product.brand,
        image: activeVariant?.image || product.images?.[0] || '',
        color: selectedColor || defaultColor,
        size: selectedSize,
        price: currentPrice,
        originalPrice: originalPrice,
        quantity: quantity,
      });

      setIsAdding(false);
      if (res.success) {
        success('Đã thêm vào giỏ hàng', `${product.name} — Size ${selectedSize}`);
        if (directToCheckout) {
          navigate('/checkout');
        }
      } else {
        error('Lỗi thêm giỏ hàng', res.message);
      }
    }, 250);
  };

  const activeGalleryImages = (selectedColor?.images && selectedColor.images.length > 0)
    ? selectedColor.images
    : [selectedColor?.image || product.images?.[0] || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80'];

  return (
    <div className="bg-[#FAFAF8] min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#71717A]">
          <Link to="/" className="hover:text-[#18181B]">Trang chủ</Link>
          <span>/</span>
          <Link to={`/products?category=${product.categorySlug}`} className="hover:text-[#18181B]">
            {product.categorySlug.replace(/-/g, ' ')}
          </Link>
          <span>/</span>
          <span className="text-[#18181B] font-bold truncate max-w-xs">{product.name}</span>
        </div>

        {/* Main Product Layout (Gallery 58% / Info 42%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Gallery ảnh lớn bên trái (7 cột) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Ảnh lớn chính (Tỷ lệ 3:4) */}
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-[#F2F3F5] border border-[#E4E4E7] relative group shadow-card select-none">
              <img
                src={activeGalleryImages[activeImageIndex] || activeGalleryImages[0]}
                alt={product.name}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&auto=format&fit=crop&q=80';
                }}
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />

              {/* Mũi tên trái / phải */}
              {activeGalleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex((prev) => (prev === 0 ? activeGalleryImages.length - 1 : prev - 1))}
                    aria-label="Xem ảnh trước"
                    title="Ảnh trước"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#18181B] hover:text-[#8B5CF6] shadow-sm flex items-center justify-center transition-all cursor-pointer z-10 active:scale-95"
                  >
                    <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveImageIndex((prev) => (prev === activeGalleryImages.length - 1 ? 0 : prev + 1))}
                    aria-label="Xem ảnh tiếp theo"
                    title="Ảnh tiếp theo"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#18181B] hover:text-[#8B5CF6] shadow-sm flex items-center justify-center transition-all cursor-pointer z-10 active:scale-95"
                  >
                    <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                  </button>

                  {/* Bộ đếm ảnh góc dưới */}
                  <div className="absolute bottom-3 right-3 pointer-events-none z-10">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-xs tracking-wider">
                      {activeImageIndex + 1}/{activeGalleryImages.length}
                    </span>
                  </div>
                </>
              )}

              {product.badge && (
                <div className="absolute top-4 left-4">
                  <Badge variant="accent">
                    {product.badge}
                  </Badge>
                </div>
              )}
              {originalPrice && originalPrice > currentPrice && (
                <div className="absolute top-4 right-4 bg-[#18181B] text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-subtle">
                  -{Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}%
                </div>
              )}
            </div>

            {/* Dải ảnh phụ thumbnails của riêng màu đã chọn */}
            {activeGalleryImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {activeGalleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-[#8B5CF6] ring-1 ring-[#8B5CF6] shadow-subtle'
                        : 'border-transparent opacity-60 hover:opacity-100 bg-[#F2F3F5]'
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&auto=format&fit=crop&q=80';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Thông tin sản phẩm bên phải (5 cột) - Sticky */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20 bg-white p-6 sm:p-8 rounded-2xl border border-[#E4E4E7] shadow-card">
            <div>
              <div className="flex items-center justify-between text-xs text-[#71717A] mb-2">
                <span className="font-bold uppercase tracking-wider text-[#18181B] bg-[#F2F3F5] px-2.5 py-0.5 rounded border border-[#E4E4E7]">
                  {product.brand}
                </span>
                <span>MÃ: {activeVariant?.sku || 'SB-GENZ'}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18181B] leading-tight">
                {product.name}
              </h1>

              {/* Rating & Sold count kiểu Shopee / TikTok Shop */}
              <div className="flex items-center gap-3 mt-2 text-xs">
                <div className="flex items-center text-amber-500 font-bold">
                  <span>★ {product.rating ? Number(product.rating).toFixed(1) : '4.9'}</span>
                  <span className="text-[#71717A] font-normal ml-1">({product.reviewCount || 120} đánh giá)</span>
                </div>
                <span className="text-[#E4E4E7]">|</span>
                <div className="text-[#71717A]">
                  Đã bán <strong className="text-[#18181B] font-bold">{product.soldCount || '1.5k'}</strong>
                </div>
                {product.badge && (
                  <>
                    <span className="text-[#E4E4E7]">|</span>
                    <span className="bg-[#F3E8FF] text-[#7C3AED] px-2 py-0.5 rounded font-bold text-[10px] uppercase">
                      {product.badge}
                    </span>
                  </>
                )}
              </div>

              {/* Giá sản phẩm */}
              <div className="flex items-baseline gap-3 mt-3">
                {currentPrice && currentPrice > 0 ? (
                  <>
                    <span className="text-3xl font-black text-[#18181B]">
                      {formatPrice(currentPrice)}
                    </span>
                    {originalPrice && originalPrice > currentPrice && (
                      <span className="text-sm text-[#71717A] line-through">
                        {formatPrice(originalPrice)}
                      </span>
                    )}
                    {originalPrice && originalPrice > currentPrice && (
                      <span className="text-[11px] text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded font-bold border border-[#FEE2E2]">
                        GIẢM {Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}%
                      </span>
                    )}
                  </>
                ) : (
                  <div className="space-y-1">
                    <span className="text-2xl font-bold text-[#71717A]">
                      Liên hệ / Đang cập nhật giá
                    </span>
                    <p className="text-xs text-amber-600 font-medium">
                      (Sản phẩm mới chưa công bố giá bán chính thức, tạm thời chưa mở thanh toán trực tuyến)
                    </p>
                  </div>
                )}
              </div>

              <p className="text-xs sm:text-sm text-[#71717A] mt-3 leading-relaxed border-t border-b border-[#E4E4E7] py-3">
                {product.shortDescription}
              </p>
            </div>

            {/* Thông tin màu sắc & Chọn màu (Không dùng bất kỳ chấm tròn màu nào) */}
            {selectedColor && product.colors.length > 0 && selectedColor.slug !== 'chua-xac-minh' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-[#71717A]">
                    Màu sắc đang chọn: <strong className="text-[#18181B] text-sm">{selectedColor.name}</strong>
                  </span>
                  {product.colors.filter((c) => c.slug !== 'chua-xac-minh' && c.slug !== 'phoi-mau').length > 1 && (
                    <span className="text-xs text-[#8B5CF6] font-semibold">
                      {product.colors.filter((c) => c.slug !== 'chua-xac-minh' && c.slug !== 'phoi-mau').length} màu sắc
                    </span>
                  )}
                </div>

                {product.colors.filter((c) => c.slug !== 'chua-xac-minh' && c.slug !== 'phoi-mau').length > 1 && (
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {product.colors
                      .filter((c) => c.slug !== 'chua-xac-minh' && c.slug !== 'phoi-mau')
                      .map((c) => {
                        const isSelected = selectedColor.slug === c.slug;
                        return (
                          <button
                            key={c.slug}
                            type="button"
                            onClick={() => {
                              setSelectedColor(c);
                              setActiveImageIndex(0);
                              const validSizes = product.variants
                                .filter((v) => v.color.slug === c.slug && v.stock > 0)
                                .map((v) => v.size);
                              if (selectedSize && !validSizes.includes(selectedSize) && validSizes.length > 0) {
                                setSelectedSize(validSizes[0]);
                              }
                            }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                              isSelected
                                ? 'bg-[#18181B] text-white border-[#18181B] shadow-sm'
                                : 'bg-white text-[#18181B] border-[#E4E4E7] hover:border-[#8B5CF6] hover:bg-[#F9FAFB]'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#8B5CF6]" />}
                            <span>{c.name}</span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* Chọn Kích Cỡ hoặc Báo FreeSize */}
            <div className="space-y-2">
              {isAccessory ? (
                <div className="p-3 bg-[#F2F3F5] rounded-xl border border-[#E4E4E7] flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-bold text-[#18181B] uppercase block">Kích thước: FREESIZE</span>
                    <span className="text-[11px] text-[#71717A]">Phù hợp mọi phom người / điều chỉnh linh hoạt</span>
                  </div>
                  <span className="text-[10px] bg-[#18181B] text-white font-bold px-2 py-0.5 rounded">
                    ONE SIZE
                  </span>
                </div>
              ) : (
                <SizeSelector
                  sizes={product.sizes}
                  selectedSize={selectedSize}
                  onSelectSize={setSelectedSize}
                  availableSizes={availableSizes}
                  onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
                />
              )}
            </div>

            {/* Tồn kho & Số lượng mua */}
            <div className="pt-2 flex items-center justify-between">
              <div className="text-xs">
                <span className="text-[#71717A] text-[11px] uppercase block mb-1">Số lượng:</span>
                <div className="flex items-center border border-[#E4E4E7] rounded-lg overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-[#18181B] hover:bg-[#F2F3F5] transition-colors cursor-pointer"
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center text-xs font-bold text-[#18181B]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(currentStock || 1, q + 1))}
                    disabled={quantity >= currentStock}
                    className="w-9 h-9 flex items-center justify-center text-[#18181B] hover:bg-[#F2F3F5] disabled:opacity-30 transition-colors cursor-pointer"
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-right text-xs">
                {currentStock > 0 ? (
                  <div className="text-[#16A34A] font-bold flex items-center gap-1 justify-end">
                    <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>Còn {currentStock} món tại kho</span>
                  </div>
                ) : (
                  <span className="text-[#DC2626] font-bold">Hết hàng biến thể này</span>
                )}
                <span className="text-[11px] text-[#71717A] block mt-0.5">
                  Giao nhanh trong 24–48h
                </span>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="pt-4 space-y-3">
              {/* Nút Thử đồ bằng AI */}
              <button
                type="button"
                onClick={() => {
                  const chosenImg = selectedColor?.image || activeVariant?.image || product.images[activeImageIndex] || product.images[0];
                  navigate(`/virtual-try-on?productId=${product.id}&slug=${product.slug}&color=${selectedColor.slug}&image=${encodeURIComponent(chosenImg)}`);
                }}
                className="w-full h-11 bg-gradient-to-r from-[#F3E8FF] to-[#FAF5FF] hover:from-[#8B5CF6] hover:to-[#7C3AED] text-[#7C3AED] hover:text-white border border-[#DDD6FE] hover:border-transparent font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-subtle group"
              >
                <Sparkles className="w-4 h-4 text-[#8B5CF6] group-hover:text-white transition-colors animate-pulse" />
                <span>✨ Thử đồ bằng AI trên ảnh của bạn</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="primary"
                  className="h-12 text-xs font-bold uppercase tracking-wider"
                  isLoading={isAdding}
                  disabled={currentStock <= 0 || !selectedSize || !currentPrice || currentPrice <= 0}
                  onClick={() => handleAddToCart(false)}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Thêm vào giỏ
                </Button>

                <Button
                  variant="accent"
                  className="h-12 text-xs font-bold uppercase tracking-wider"
                  disabled={currentStock <= 0 || !selectedSize || !currentPrice || currentPrice <= 0}
                  onClick={() => handleAddToCart(true)}
                >
                  <Zap className="w-4 h-4 mr-1.5" />
                  MUA NGAY
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 pt-2 text-xs text-[#71717A]">
                <button
                  type="button"
                  onClick={() => {
                    setIsLiked(!isLiked);
                    toast(!isLiked ? 'Đã thêm vào Wishlist' : 'Đã bỏ yêu thích', product.name);
                  }}
                  className="flex items-center gap-1.5 hover:text-[#8B5CF6] transition-colors cursor-pointer"
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#8B5CF6] text-[#8B5CF6]' : ''}`} />
                  <span className="text-[11px]">{isLiked ? 'Đã thích' : 'Lưu Wishlist'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    toast('Đã sao chép link outfit', '', 'info');
                  }}
                  className="flex items-center gap-1.5 hover:text-[#18181B] transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-[11px]">Chia sẻ bạn bè</span>
                </button>
              </div>
            </div>

            {/* Cam kết thương hiệu */}
            <div className="bg-[#F2F3F5] rounded-xl p-4 space-y-2 text-xs text-[#18181B] border border-[#E4E4E7]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                <span>Chất lượng định lượng chuẩn — Đổi mới nếu lỗi đường may</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                <span>Đổi size linh hoạt trong 15 ngày tận nhà</span>
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                <span>Đóng gói hộp carton tái chế, thân thiện môi trường</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chi tiết chất liệu, phom dáng & AI Stylist Callout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-[#E4E4E7]">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#18181B] uppercase">
              Thông số thiết kế & Vải
            </h3>
            <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed">
              {product.description}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-[#E4E4E7] shadow-subtle">
                <span className="text-[#71717A] block text-[10px] uppercase">Chất liệu</span>
                <strong className="text-[#18181B] text-xs mt-0.5 block">{product.material}</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-[#E4E4E7] shadow-subtle">
                <span className="text-[#71717A] block text-[10px] uppercase">Phom dáng (Fit)</span>
                <strong className="text-[#18181B] text-xs mt-0.5 block">{product.fit}</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-[#E4E4E7] shadow-subtle">
                <span className="text-[#71717A] block text-[10px] uppercase">Phong cách</span>
                <strong className="text-[#18181B] text-xs mt-0.5 block">{product.style}</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-[#E4E4E7] shadow-subtle">
                <span className="text-[#71717A] block text-[10px] uppercase">Dịp mặc</span>
                <strong className="text-[#18181B] text-xs mt-0.5 block">
                  {Array.isArray(product.occasion) ? product.occasion.join(', ') : (product.occasion || 'Đi chơi, dạo phố, đi học')}
                </strong>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#18181B] uppercase">
              Cách giặt & Giữ màu chuẩn Streetwear
            </h3>
            <div className="p-4 rounded-xl bg-white border border-[#E4E4E7] shadow-subtle space-y-2 text-xs text-[#18181B]">
              {(Array.isArray(product.careInstructions) && product.careInstructions.length > 0 ? product.careInstructions : [
                'Giặt ở nhiệt độ thường, lộn trái sản phẩm khi giặt',
                'Không sử dụng chất tẩy mạnh hoặc clo',
                'Phơi trong bóng râm, tránh ánh nắng trực tiếp'
              ]).map((instruction, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] mt-1.5 shrink-0" />
                  <span>{instruction}</span>
                </div>
              ))}
            </div>

            {/* AI Stylist suggestion box */}
            <div className="p-5 rounded-xl bg-[#18181B] text-white space-y-2 border border-[#27272A] shadow-card">
              <div className="flex items-center gap-2 font-bold text-xs text-[#DDD6FE]">
                <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                <span>SMARTBUY AI STYLIST SUGGESTION:</span>
              </div>
              <p className="text-xs leading-relaxed text-[#D4D4D8]">
                Thiết kế mang phom <strong>{product.fit}</strong> đậm chất <strong>{product.style}</strong>.
                Phối cùng một mẫu quần ống rộng Baggy hoặc Cargo Parachute và tạo điểm nhấn với dây chuyền Cuban / nón Beanie sẽ giúp outfit đạt điểm 10 trọn vẹn.
              </p>
              <Link
                to={`/ai-stylist?prompt=${encodeURIComponent(`Gợi ý cách phối đồ cùng ${product.name}`)}`}
                className="inline-flex items-center text-xs font-bold text-[#DDD6FE] hover:text-white hover:underline pt-1"
              >
                Hỏi AI Stylist cách phối toàn bộ outfit →
              </Link>
            </div>
          </div>
        </div>

        {/* GỢI Ý PHỤ KIỆN PHỐI CÙNG (COMPLETE THE FIT) */}
        {!isAccessory && suggestedAccessories.length > 0 && (
          <div className="pt-10 border-t border-[#E4E4E7] space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED] bg-[#F3E8FF] px-2.5 py-0.5 rounded-sm border border-[#DDD6FE]">
                  COMPLETE THE FIT
                </span>
                <h3 className="text-2xl font-black text-[#18181B] uppercase mt-2">
                  Gợi ý phụ kiện phối cùng outfit này
                </h3>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Thêm nón, dây chuyền hoặc túi xách để nâng tầm diện mạo streetwear của bạn.
                </p>
              </div>
              <Link to="/products?category=phu-kien" className="text-xs font-bold text-[#8B5CF6] hover:underline">
                Xem tất cả phụ kiện →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {suggestedAccessories.map((acc) => (
                <ProductCard key={acc.id} product={acc} />
              ))}
            </div>
          </div>
        )}

        {/* Sản phẩm liên quan cùng phong cách */}
        {relatedProducts.length > 0 && (
          <div className="pt-10 border-t border-[#E4E4E7] space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A]">
                  CÙNG PHONG CÁCH
                </span>
                <h3 className="text-2xl font-black text-[#18181B] uppercase mt-1">
                  Có thể bạn cũng sẽ thích
                </h3>
              </div>
              <Link to="/products" className="text-xs font-bold text-[#8B5CF6] hover:underline">
                Xem thêm drops khác →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Size Guide Modal Chi Tiết */}
        <Modal
          isOpen={isSizeGuideOpen}
          onClose={() => setIsSizeGuideOpen(false)}
          title="BẢNG QUY CHUẨN KÍCH CỠ (SIZE GUIDE)"
          description={`Thông số cho ${product.name} — Phom ${product.fit}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs font-sans">
            <p className="text-[#71717A]">
              Số đo quy chuẩn theo phom rộng Streetwear. Nếu thích mặc phủ rũ rộng rãi hãy chọn đúng size hoặc up 1 size:
            </p>

            <div className="overflow-x-auto rounded-xl border border-[#E4E4E7]">
              <table className="w-full text-left divide-y divide-[#E4E4E7] text-xs">
                <thead className="bg-[#F2F3F5] font-bold text-[#18181B]">
                  <tr>
                    <th className="p-3">Size</th>
                    <th className="p-3">Vòng ngực</th>
                    <th className="p-3">Vòng eo</th>
                    <th className="p-3">Dài áo/quần</th>
                    <th className="p-3">Chiều cao</th>
                    <th className="p-3">Cân nặng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E7] bg-white">
                  {(product.sizeMeasurements && product.sizeMeasurements.length > 0
                    ? product.sizeMeasurements
                    : [
                        { size: 'S', chest: '106 cm', waist: '72 cm', length: '70 cm', fitHeight: '1m60 - 1m68', fitWeight: '50 - 58 kg' },
                        { size: 'M', chest: '112 cm', waist: '76 cm', length: '72 cm', fitHeight: '1m68 - 1m74', fitWeight: '59 - 68 kg' },
                        { size: 'L', chest: '118 cm', waist: '82 cm', length: '74 cm', fitHeight: '1m72 - 1m80', fitWeight: '68 - 78 kg' },
                        { size: 'XL', chest: '124 cm', waist: '88 cm', length: '76 cm', fitHeight: '1m76 - 1m86', fitWeight: '78 - 90 kg' },
                      ]
                  ).map((m: any) => (
                    <tr key={m.size} className="hover:bg-[#F2F3F5]">
                      <td className="p-3 font-bold text-[#18181B] bg-[#F2F3F5]">{m.size}</td>
                      <td className="p-3">{m.chest || '—'}</td>
                      <td className="p-3">{m.waist || '—'}</td>
                      <td className="p-3">{m.length || '—'}</td>
                      <td className="p-3">{m.fitHeight || '—'}</td>
                      <td className="p-3">{m.fitWeight || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>

        {/* Mobile Sticky Bottom Purchase Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E4E4E7] px-4 py-3 shadow-elevated">
          <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-10 h-10 object-cover rounded-lg border border-[#E4E4E7] shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&auto=format&fit=crop&q=80';
                }}
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#18181B] truncate">{product.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#18181B]">
                    {formatPrice(currentPrice)}
                  </span>
                  {selectedSize && (
                    <span className="text-[10px] bg-[#F3E8FF] text-[#7C3AED] px-1.5 py-0.2 rounded font-bold border border-[#DDD6FE]">
                      {selectedSize}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="accent"
              size="sm"
              className="shrink-0 h-10 px-4 text-xs font-bold uppercase tracking-wider"
              disabled={currentStock <= 0 || !selectedSize}
              isLoading={isAdding}
              onClick={() => handleAddToCart(false)}
            >
              {currentStock <= 0 ? 'Hết hàng' : !selectedSize ? 'Chọn size' : 'MUA NGAY'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProductDetailPage: React.FC = () => {
  useRepoSubscription(['products', 'cart']);
  const { slug } = useParams<{ slug: string }>();
  const product = slug
    ? (productService.getBySlug(slug) || productService.getAll().find(p => p.id.toLowerCase() === slug.toLowerCase() || p.slug.toLowerCase() === slug.toLowerCase()))
    : undefined;

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold text-brand-primary uppercase">
          Không tìm thấy thiết kế này
        </h2>
        <p className="text-xs text-brand-secondary">
          Sản phẩm có thể đã ngừng mở bán hoặc đường dẫn không chính xác.
        </p>
        <Link to="/products">
          <Button variant="accent" size="sm" className="font-bold">
            Xem toàn bộ sản phẩm Streetwear
          </Button>
        </Link>
      </div>
    );
  }

  return <ProductDetailContent key={product.id} product={product} />;
};
