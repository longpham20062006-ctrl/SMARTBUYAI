import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productService } from '@/services/productService';
import { MockRepo } from '@/mocks/repository';
import { ColorOption, SizeCode, Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ColorSwatch } from '@/components/common/ColorSwatch';
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
  Ruler,
  Truck,
} from 'lucide-react';

const sanitizeDescription = (text?: string): string => {
  if (!text) return '';
  return text
    .split('\n')
    .filter((line) => {
      const lower = line.toLowerCase();
      return (
        !lower.includes('thư mục nguồn:') &&
        !lower.includes('mã parent sku:') &&
        !lower.includes('ảnh thật từ folder') &&
        !lower.includes('/images/san-pham/')
      );
    })
    .join('\n')
    .replace(/,\s*100%\s*ảnh\s*thật\s*từ\s*folder\s*[^.\n]+/gi, '')
    .trim();
};

const ProductDetailContent: React.FC<{ product: Product }> = ({ product }) => {
  const navigate = useNavigate();
  const { success, error, toast } = useToast();

  const isAccessory = Boolean(
    product.categorySlug === 'phu-kien' ||
    (product.sizes.length === 1 && product.sizes[0] === 'FreeSize')
  );

  // Selected options initialized directly from product
  const [selectedColor, setSelectedColor] = useState<ColorOption>(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState<SizeCode | undefined>(() => {
    if (isAccessory || product.sizes.includes('FreeSize')) return 'FreeSize';
    const firstAvailable = product.variants.find(
      (v) => v.color.slug === product.colors[0]?.slug && v.stock > 0
    )?.size || product.sizes[0];
    return firstAvailable;
  });
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'details' | 'care' | 'shipping'>('details');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Active variant
  const activeVariant = product.variants.find(
    (v) => v.color.slug === selectedColor?.slug && v.size === selectedSize
  ) || product.variants[0];

  const availableSizes = product.variants
    .filter((v) => v.color.slug === selectedColor?.slug && v.stock > 0)
    .map((v) => v.size);

  const currentPrice = activeVariant?.price || product.price;
  const originalPrice = activeVariant?.originalPrice || product.originalPrice;
  const currentStock = activeVariant?.stock ?? 10;
  const discountPercent = originalPrice && originalPrice > currentPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const relatedProducts = productService.getRelated(product, 4);
  const suggestedAccessories = productService.getAccessories(4);

  const handlePrevImage = () => {
    if (product.images.length <= 1) return;
    setActiveImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (product.images.length <= 1) return;
    setActiveImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
  };

  const handleAddToCart = (directToCheckout: boolean = false) => {
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
        image: activeVariant.image || product.images[0],
        color: selectedColor || product.colors[0],
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

  return (
    <div className="bg-[#F7F7F6] min-h-screen text-[#292524] pb-24 lg:pb-16">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-12">
        {/* Breadcrumbs - Minimal Korean Style */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#78716C]">
          <Link to="/" className="hover:text-[#18181B] transition-colors">Trang chủ</Link>
          <span className="text-[#D4D4D8]">/</span>
          <Link to={`/products?category=${product.categorySlug}`} className="hover:text-[#18181B] transition-colors capitalize">
            {product.categorySlug.replace(/-/g, ' ')}
          </Link>
          <span className="text-[#D4D4D8]">/</span>
          <span className="text-[#18181B] font-medium truncate max-w-xs sm:max-w-md">{product.name}</span>
        </nav>

        {/* Main Product Layout (Gallery 54% / Info 46%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Cột Trái: Product Gallery (7 cột) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Ảnh lớn trung tâm (Tỷ lệ 3:4, max-height ~620px) */}
            <div className="relative aspect-[3/4] max-h-[620px] w-full rounded-2xl overflow-hidden bg-[#F0EFED] border border-[#ECEAE7] group shadow-sm flex items-center justify-center">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.name}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&auto=format&fit=crop&q=80';
                }}
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-102"
              />

              {/* Prev/Next Chevron Navigation overlay */}
              {product.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    aria-label="Ảnh trước"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#18181B] shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    aria-label="Ảnh kế tiếp"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#18181B] shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10 cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Badges on Gallery: HOT, NEW, SALE */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10 pointer-events-none">
                {product.badge && (
                  <Badge variant="accent" className="font-semibold">
                    {product.badge}
                  </Badge>
                )}
              </div>

              {/* Discount Badge */}
              {discountPercent > 0 && (
                <div className="absolute top-4 right-4 bg-[#B91C1C] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm z-10">
                  -{discountPercent}%
                </div>
              )}
            </div>

            {/* Dải ảnh phụ Thumbnails */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-[#18181B] ring-1 ring-[#18181B] shadow-sm'
                        : 'border-[#ECEAE7] opacity-70 hover:opacity-100 bg-[#F0EFED]'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} góc ${idx + 1}`}
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

          {/* Cột Phải: Thông tin sản phẩm (5 cột) - Sticky */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 bg-white p-6 sm:p-8 rounded-2xl border border-[#ECEAE7] shadow-sm">
            <div>
              {/* Thương hiệu & Mã thiết kế */}
              <div className="flex items-center justify-between text-xs text-[#78716C] mb-2.5">
                <span className="font-semibold uppercase tracking-wider text-[#18181B] bg-[#F0EFED] px-2.5 py-0.5 rounded border border-[#ECEAE7]">
                  {product.brand}
                </span>
                <span className="text-[11px]">MÃ: {activeVariant?.sku || 'SB-KN-01'}</span>
              </div>

              {/* Tên sản phẩm - Korean Minimal Typography */}
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B] leading-tight">
                {product.name}
              </h1>

              {/* Đánh giá & Lượt bán */}
              <div className="flex items-center gap-3 mt-2.5 text-xs">
                <div className="flex items-center text-[#D97706] font-semibold">
                  <span>★ {product.rating ? Number(product.rating).toFixed(1) : '4.9'}</span>
                  <span className="text-[#78716C] font-normal ml-1">({product.reviewCount || 128} đánh giá)</span>
                </div>
                <span className="text-[#ECEAE7]">|</span>
                <div className="text-[#78716C]">
                  Đã bán <strong className="text-[#18181B] font-semibold">{product.soldCount || '1.2k'}</strong>
                </div>
                {product.badge && (
                  <>
                    <span className="text-[#ECEAE7]">|</span>
                    <span className="bg-[#F0EFED] text-[#18181B] px-2 py-0.5 rounded font-semibold text-[10px] uppercase border border-[#ECEAE7]">
                      {product.badge}
                    </span>
                  </>
                )}
              </div>

              {/* Giá sản phẩm */}
              <div className="flex items-baseline gap-3 mt-4">
                <span className="text-3xl font-extrabold text-[#18181B] tracking-tight">
                  {formatPrice(currentPrice)}
                </span>
                {originalPrice && originalPrice > currentPrice && (
                  <span className="text-sm text-[#78716C] line-through">
                    {formatPrice(originalPrice)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="text-[11px] text-[#B91C1C] bg-[#FEE2E2] px-2 py-0.5 rounded font-semibold border border-[#FECACA]">
                    GIẢM {discountPercent}%
                  </span>
                )}
              </div>

              {/* Mô tả ngắn gọn */}
              <p className="text-xs sm:text-sm text-[#78716C] mt-3.5 leading-relaxed border-t border-[#ECEAE7] pt-3.5">
                {sanitizeDescription(product.shortDescription)}
              </p>
            </div>

            {/* Bộ chọn Màu Sắc */}
            {selectedColor && product.colors.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#78716C]">
                    Phối màu: <strong className="text-[#18181B]">{selectedColor.name}</strong>
                  </span>
                </div>
                <ColorSwatch
                  colors={product.colors}
                  selectedColor={selectedColor}
                  onSelectColor={(c) => {
                    setSelectedColor(c);
                    // Đồng bộ đổi ảnh thư viện gallery sang màu tương ứng
                    const colorImg = c.image || product.variants.find((v) => v.color.slug === c.slug)?.image;
                    if (colorImg) {
                      const imgIdx = product.images.findIndex((img) => img === colorImg);
                      if (imgIdx !== -1) {
                        setActiveImageIndex(imgIdx);
                      }
                    }
                    const validSizes = product.variants
                      .filter((v) => v.color.slug === c.slug && v.stock > 0)
                      .map((v) => v.size);
                    if (selectedSize && !validSizes.includes(selectedSize) && validSizes.length > 0) {
                      setSelectedSize(validSizes[0]);
                    }
                  }}
                  size="md"
                />
              </div>
            )}

            {/* Bộ chọn Kích Cỡ */}
            <div className="space-y-2.5">
              {isAccessory ? (
                <div className="p-3 bg-[#F7F7F6] rounded-xl border border-[#ECEAE7] flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-bold text-[#18181B] uppercase block">Kích thước: FREESIZE</span>
                    <span className="text-[11px] text-[#78716C]">Thiết kế linh hoạt, phù hợp nhiều vóc dáng</span>
                  </div>
                  <span className="text-[10px] bg-[#18181B] text-white font-semibold px-2 py-0.5 rounded">
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

            {/* Số lượng mua & Tình trạng kho */}
            <div className="pt-2 flex items-center justify-between">
              <div className="text-xs">
                <span className="text-[#78716C] text-[11px] uppercase block mb-1 font-medium">Số lượng:</span>
                <div className="flex items-center border border-[#ECEAE7] rounded-xl overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-[#18181B] hover:bg-[#F0EFED] transition-colors cursor-pointer"
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
                    className="w-9 h-9 flex items-center justify-center text-[#18181B] hover:bg-[#F0EFED] disabled:opacity-30 transition-colors cursor-pointer"
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-right text-xs">
                {currentStock > 0 ? (
                  <div className="text-[#166534] font-semibold flex items-center gap-1 justify-end">
                    <Check className="w-3.5 h-3.5 text-[#166534]" />
                    <span>Còn {currentStock} sản phẩm</span>
                  </div>
                ) : (
                  <span className="text-[#B91C1C] font-semibold">Tạm hết hàng</span>
                )}
                <span className="text-[11px] text-[#78716C] block mt-0.5">
                  Giao nhanh toàn quốc 24–48h
                </span>
              </div>
            </div>

            {/* Các nút hành động mua hàng & AI */}
            <div className="pt-3 space-y-3">
              {/* Nút Thử đồ bằng AI - Điểm nhấn tinh tế */}
              <button
                type="button"
                onClick={() => {
                  const chosenImg = selectedColor?.image || activeVariant?.image || product.images[activeImageIndex] || product.images[0];
                  navigate(`/virtual-try-on?productId=${product.id}&slug=${product.slug}&color=${selectedColor.slug}&image=${encodeURIComponent(chosenImg)}`);
                }}
                className="w-full h-11 bg-[#F3E8FF] hover:bg-[#EDE9FE] text-[#7C3AED] hover:text-[#6D28D9] border border-[#DDD6FE] font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs group"
              >
                <Sparkles className="w-4 h-4 text-[#7C3AED] group-hover:scale-110 transition-transform" />
                <span>Thử đồ AI trên vóc dáng của bạn</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="primary"
                  className="h-12 text-xs font-bold uppercase tracking-wider rounded-xl bg-[#18181B] text-white hover:bg-[#27272A]"
                  isLoading={isAdding}
                  disabled={currentStock <= 0 || !selectedSize}
                  onClick={() => handleAddToCart(false)}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Thêm vào giỏ
                </Button>

                <Button
                  variant="outline"
                  className="h-12 text-xs font-bold uppercase tracking-wider rounded-xl bg-white border-2 border-[#18181B] text-[#18181B] hover:bg-[#F0EFED]"
                  disabled={currentStock <= 0 || !selectedSize}
                  onClick={() => handleAddToCart(true)}
                >
                  <Zap className="w-4 h-4 mr-1.5" />
                  MUA NGAY
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 pt-2 text-xs text-[#78716C]">
                <button
                  type="button"
                  onClick={() => {
                    setIsLiked(!isLiked);
                    toast(!isLiked ? 'Đã thêm vào Wishlist' : 'Đã bỏ yêu thích', product.name);
                  }}
                  className="flex items-center gap-1.5 hover:text-[#18181B] transition-colors cursor-pointer"
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#B91C1C] text-[#B91C1C]' : ''}`} />
                  <span className="text-[11px]">{isLiked ? 'Đã thích' : 'Lưu danh sách yêu thích'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    toast('Đã sao chép liên kết sản phẩm', '', 'info');
                  }}
                  className="flex items-center gap-1.5 hover:text-[#18181B] transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-[11px]">Chia sẻ bạn bè</span>
                </button>
              </div>
            </div>

            {/* Cam kết & Chính sách mua sắm tối giản */}
            <div className="bg-[#F7F7F6] rounded-xl p-4 space-y-2.5 text-xs text-[#292524] border border-[#ECEAE7]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#18181B] shrink-0" />
                <span>Chất lượng cao cấp — Đổi mới tức thì nếu lỗi đường may</span>
              </div>
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-4 h-4 text-[#18181B] shrink-0" />
                <span>Hỗ trợ đổi size linh hoạt trong 15 ngày tại nhà</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Leaf className="w-4 h-4 text-[#18181B] shrink-0" />
                <span>Đóng gói hộp giấy bảo vệ môi trường, tiêu chuẩn tối giản</span>
              </div>
            </div>
          </div>
        </div>

        {/* Khối Tabs Chi Tiết: Thông số, Bảo quản & Gợi ý AI Stylist */}
        <div className="pt-8 border-t border-[#ECEAE7] space-y-6">
          <div className="flex items-center gap-2 border-b border-[#ECEAE7] pb-3">
            <button
              type="button"
              onClick={() => setActiveDetailTab('details')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeDetailTab === 'details'
                  ? 'bg-[#18181B] text-white'
                  : 'text-[#78716C] hover:text-[#18181B] hover:bg-[#F0EFED]'
              }`}
            >
              Thông số thiết kế & Chất liệu
            </button>
            <button
              type="button"
              onClick={() => setActiveDetailTab('care')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeDetailTab === 'care'
                  ? 'bg-[#18181B] text-white'
                  : 'text-[#78716C] hover:text-[#18181B] hover:bg-[#F0EFED]'
              }`}
            >
              Hướng dẫn bảo quản
            </button>
            <button
              type="button"
              onClick={() => setActiveDetailTab('shipping')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeDetailTab === 'shipping'
                  ? 'bg-[#18181B] text-white'
                  : 'text-[#78716C] hover:text-[#18181B] hover:bg-[#F0EFED]'
              }`}
            >
              Chính sách giao nhận & Đổi trả
            </button>
          </div>

          {/* Tab Content 1: Details */}
          {activeDetailTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-lg font-bold text-[#18181B]">
                  Chi tiết thiết kế & Cảm hứng thời trang
                </h3>
                <p className="text-xs sm:text-sm text-[#78716C] leading-relaxed whitespace-pre-line">
                  {sanitizeDescription(product.description)}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3.5 rounded-xl bg-white border border-[#ECEAE7] shadow-xs">
                    <span className="text-[#78716C] block text-[10px] uppercase font-semibold">Chất liệu</span>
                    <strong className="text-[#18181B] text-xs mt-1 block">{product.material}</strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-[#ECEAE7] shadow-xs">
                    <span className="text-[#78716C] block text-[10px] uppercase font-semibold">Phom dáng (Fit)</span>
                    <strong className="text-[#18181B] text-xs mt-1 block">{product.fit}</strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-[#ECEAE7] shadow-xs">
                    <span className="text-[#78716C] block text-[10px] uppercase font-semibold">Phong cách</span>
                    <strong className="text-[#18181B] text-xs mt-1 block">{product.style}</strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-[#ECEAE7] shadow-xs">
                    <span className="text-[#78716C] block text-[10px] uppercase font-semibold">Dịp mặc phù hợp</span>
                    <strong className="text-[#18181B] text-xs mt-1 block">{product.occasion.join(', ')}</strong>
                  </div>
                </div>
              </div>

              {/* AI Stylist Suggestion Card - Tinh tế, hiện đại */}
              <div className="lg:col-span-5">
                <div className="p-6 rounded-2xl bg-[#F5F3FF] border border-[#DDD6FE] space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#7C3AED]">
                    <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                    <span>SMARTBUY AI STYLIST GỢI Ý PHỐI OUTFIT</span>
                  </div>
                  <p className="text-xs leading-relaxed text-[#4C1D95]">
                    Thiết kế mang phom <strong>{product.fit}</strong> đậm tinh thần tối giản Hàn Quốc.
                    Phối cùng mẫu quần suông cạp cao hoặc quần túi hộp tone trung tính, điểm xuyết thêm phụ kiện nhẹ nhàng sẽ hoàn thiện trọn vẹn bản phối thời trang của bạn.
                  </p>
                  <div className="pt-2">
                    <Link
                      to={`/ai-stylist?prompt=${encodeURIComponent(`Gợi ý cách phối đồ cùng ${product.name}`)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9] hover:underline"
                    >
                      <span>Hỏi AI Stylist cách phối toàn bộ outfit</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 2: Care */}
          {activeDetailTab === 'care' && (
            <div className="max-w-2xl space-y-4">
              <h3 className="text-lg font-bold text-[#18181B]">
                Hướng dẫn giặt ủi & Bảo quản phom dáng
              </h3>
              <p className="text-xs text-[#78716C]">
                Để trang phục luôn giữ được màu sắc tự nhiên và độ bền form dáng, vui lòng tham khảo các lưu ý sau:
              </p>
              <div className="p-5 rounded-xl bg-white border border-[#ECEAE7] space-y-3 text-xs text-[#292524]">
                {product.careInstructions.map((instruction, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#18181B] mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{instruction}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Content 3: Shipping */}
          {activeDetailTab === 'shipping' && (
            <div className="max-w-3xl space-y-4">
              <h3 className="text-lg font-bold text-[#18181B]">
                Chính sách giao nhận & Đổi trả hàng
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-white border border-[#ECEAE7] space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-[#18181B]">
                    <Truck className="w-4 h-4 text-[#18181B]" />
                    <span>Giao hàng toàn quốc</span>
                  </div>
                  <p className="text-[#78716C] leading-relaxed">
                    Nội thành Hà Nội & TP.HCM nhận trong 24h. Các tỉnh thành khác nhận hàng từ 2–3 ngày làm việc. Đồng kiểm trước khi nhận.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#ECEAE7] space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-[#18181B]">
                    <RotateCcw className="w-4 h-4 text-[#18181B]" />
                    <span>Đổi trả trong 15 ngày</span>
                  </div>
                  <p className="text-[#78716C] leading-relaxed">
                    Hỗ trợ đổi kích cỡ hoặc mẫu mã miễn phí nếu sản phẩm còn nguyên tem mác. Nhân viên giao nhận đến tận nơi lấy hàng đổi.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* GỢI Ý PHỤ KIỆN PHỐI CÙNG (COMPLETE THE FIT) */}
        {!isAccessory && suggestedAccessories.length > 0 && (
          <div className="pt-10 border-t border-[#ECEAE7] space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
                  COMPLETE THE LOOK
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#18181B] mt-1">
                  Gợi ý phụ kiện phối cùng outfit
                </h3>
              </div>
              <Link to="/products?category=phu-kien" className="text-xs font-semibold text-[#18181B] hover:text-[#78716C] transition-colors">
                Xem tất cả phụ kiện →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {suggestedAccessories.map((acc) => (
                <ProductCard key={acc.id} product={acc} />
              ))}
            </div>
          </div>
        )}

        {/* Sản phẩm liên quan cùng phong cách */}
        {relatedProducts.length > 0 && (
          <div className="pt-10 border-t border-[#ECEAE7] space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
                  CÙNG PHONG CÁCH
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#18181B] mt-1">
                  Có thể bạn cũng sẽ thích
                </h3>
              </div>
              <Link to="/products" className="text-xs font-semibold text-[#18181B] hover:text-[#78716C] transition-colors">
                Khám phá thêm bộ sưu tập →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
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
          description={`Thông số kích thước đo chuẩn cho ${product.name} — Phom ${product.fit}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs font-sans">
            <div className="flex items-center gap-2 text-[#78716C] bg-[#F7F7F6] p-3 rounded-lg border border-[#ECEAE7]">
              <Ruler className="w-4 h-4 text-[#18181B] shrink-0" />
              <span>
                Số đo phom dáng thời trang Hàn Quốc. Nếu bạn thích mặc rộng rãi phủ rũ (oversized fit), hãy chọn đúng kích cỡ tiêu chuẩn hoặc nâng 1 size.
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#ECEAE7]">
              <table className="w-full text-left divide-y divide-[#ECEAE7] text-xs">
                <thead className="bg-[#F0EFED] font-semibold text-[#18181B]">
                  <tr>
                    <th className="p-3">Size</th>
                    <th className="p-3">Vòng ngực</th>
                    <th className="p-3">Vòng eo</th>
                    <th className="p-3">Dài áo/quần</th>
                    <th className="p-3">Chiều cao gợi ý</th>
                    <th className="p-3">Cân nặng gợi ý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEAE7] bg-white">
                  {(product.sizeMeasurements && product.sizeMeasurements.length > 0
                    ? product.sizeMeasurements
                    : [
                        { size: 'S', chest: '106 cm', waist: '72 cm', length: '70 cm', fitHeight: '1m60 - 1m68', fitWeight: '50 - 58 kg' },
                        { size: 'M', chest: '112 cm', waist: '76 cm', length: '72 cm', fitHeight: '1m68 - 1m74', fitWeight: '59 - 68 kg' },
                        { size: 'L', chest: '118 cm', waist: '82 cm', length: '74 cm', fitHeight: '1m72 - 1m80', fitWeight: '68 - 78 kg' },
                        { size: 'XL', chest: '124 cm', waist: '88 cm', length: '76 cm', fitHeight: '1m76 - 1m86', fitWeight: '78 - 90 kg' },
                      ]
                  ).map((m: any) => (
                    <tr key={m.size} className="hover:bg-[#F7F7F6] transition-colors">
                      <td className="p-3 font-bold text-[#18181B] bg-[#F7F7F6]">{m.size}</td>
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

        {/* Mobile Sticky Bottom Purchase Bar (Offset so it doesn't overlap Chatbot) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#ECEAE7] px-4 py-3 shadow-lg">
          <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-10 h-10 object-cover rounded-lg border border-[#ECEAE7] shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&auto=format&fit=crop&q=80';
                }}
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#18181B] truncate">{product.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#18181B]">
                    {formatPrice(currentPrice)}
                  </span>
                  {selectedSize && (
                    <span className="text-[10px] bg-[#F0EFED] text-[#18181B] px-1.5 py-0.2 rounded font-semibold border border-[#ECEAE7]">
                      {selectedSize}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              className="shrink-0 h-10 px-4 text-xs font-bold uppercase tracking-wider rounded-xl bg-[#18181B] text-white hover:bg-[#27272A]"
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
  const product = slug ? productService.getBySlug(slug) : undefined;

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#18181B] tracking-tight">
          Không tìm thấy thiết kế này
        </h2>
        <p className="text-xs text-[#78716C]">
          Sản phẩm có thể đã ngừng mở bán hoặc đường dẫn không chính xác.
        </p>
        <Link to="/products">
          <Button variant="primary" size="sm" className="font-bold bg-[#18181B] text-white rounded-xl">
            Xem toàn bộ bộ sưu tập
          </Button>
        </Link>
      </div>
    );
  }

  return <ProductDetailContent key={product.id} product={product} />;
};
