import React, { useState, useEffect } from 'react';
import { Product, SizeCode } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { SizeSelector } from '@/components/common/SizeSelector';
import { formatPrice } from '@/lib/utils';
import { MockRepo } from '@/mocks/repository';
import { useToast } from '@/components/ui/toast';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface QuickViewModalProps {
  product: Product | null;
  initialImageIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onOpenCart?: () => void;
}

interface QuickViewContentProps {
  product: Product;
  initialImageIndex?: number;
  onClose: () => void;
  onOpenCart?: () => void;
}

const QuickViewContent: React.FC<QuickViewContentProps> = ({
  product,
  initialImageIndex = 0,
  onClose,
  onOpenCart,
}) => {
  if (!product) return null;

  const images = (Array.isArray(product.images) && product.images.length > 0)
    ? product.images.filter(Boolean)
    : ['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80'];

  const [activeImageIndex, setActiveImageIndex] = useState(
    initialImageIndex >= 0 && initialImageIndex < images.length ? initialImageIndex : 0
  );
  const [selectedSize, setSelectedSize] = useState<SizeCode | undefined>(product.sizes?.[0]);
  const [isAdding, setIsAdding] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (initialImageIndex >= 0 && initialImageIndex < images.length) {
      setActiveImageIndex(initialImageIndex);
    }
  }, [initialImageIndex, images.length]);

  const safeIndex = activeImageIndex >= 0 && activeImageIndex < images.length ? activeImageIndex : 0;
  const currentImage = images[safeIndex] || images[0];

  const productColors = Array.isArray(product.colors) ? product.colors : [];
  // Tìm màu sắc tương ứng với ảnh đang xem (tuyệt đối không tự bịa màu)
  const matchedColor = productColors.find((c) =>
    (c.images && c.images.includes(currentImage)) || c.image === currentImage
  ) || productColors[0];

  const isColorVerified = matchedColor && matchedColor.slug !== 'chua-xac-minh' && matchedColor.slug !== 'phoi-mau';

  const productVariants = Array.isArray(product.variants) ? product.variants : [];
  // Tìm biến thể tương ứng với màu và size đang chọn
  const activeVariant = productVariants.find(
    (v) => (v.color?.slug === matchedColor?.slug || v.colorId === matchedColor?.id) && v.size === selectedSize
  ) || productVariants.find((v) => v.size === selectedSize) || productVariants[0];

  // Danh sách size còn tồn của màu hiện tại
  const availableSizes = productVariants
    .filter((v) => (v.color?.slug === matchedColor?.slug || v.colorId === matchedColor?.id) && v.stock > 0)
    .map((v) => v.size);

  const handlePrev = () => {
    if (images.length <= 1) return;
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (images.length <= 1) return;
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleAddToCart = () => {
    if (!selectedSize || !activeVariant) {
      error('Vui lòng chọn kích cỡ phù hợp', 'Bạn chưa chọn kích cỡ sản phẩm');
      return;
    }

    if (activeVariant.stock <= 0) {
      error('Hết hàng', 'Biến thể kích cỡ này hiện đã hết hàng.');
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
        image: currentImage,
        color: matchedColor || productColors[0] || { name: 'Mặc định', hex: '#111111', slug: 'mac-dinh' },
        size: selectedSize,
        price: activeVariant?.price || product.price || 0,
        originalPrice: activeVariant?.originalPrice || product.originalPrice || 0,
        quantity: 1,
      });

      setIsAdding(false);
      if (res.success) {
        const colorLabel = isColorVerified && matchedColor?.name ? ` (${matchedColor.name})` : '';
        success('Đã thêm vào giỏ hàng', `${product.name}${colorLabel} — Size ${selectedSize}`);
        onClose();
        onOpenCart?.();
      } else {
        error('Không thể thêm vào giỏ', res.message);
      }
    }, 250);
  };

  // Danh sách các màu đã xác minh (nếu có nhiều màu thật)
  const verifiedColors = productColors.filter((c) => c && c.slug !== 'chua-xac-minh' && c.slug !== 'phoi-mau');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
      {/* Hình ảnh lớn với mũi tên chuyển ảnh */}
      <div className="space-y-3">
        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-brand-subtle border border-brand-border/60 relative group select-none">
          <img
            src={currentImage}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-all duration-300"
          />

          {/* Nút mũi tên trái / phải */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Xem ảnh trước"
                title="Ảnh trước"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#18181B] hover:text-[#8B5CF6] shadow-sm flex items-center justify-center transition-all cursor-pointer z-10 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Xem ảnh tiếp theo"
                title="Ảnh tiếp theo"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#18181B] hover:text-[#8B5CF6] shadow-sm flex items-center justify-center transition-all cursor-pointer z-10 active:scale-95"
              >
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Bộ đếm ảnh góc dưới */}
              <div className="absolute bottom-3 right-3 pointer-events-none z-10">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/60 text-white backdrop-blur-xs tracking-wider">
                  {activeImageIndex + 1}/{images.length}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Dải ảnh thumbnails liên kết trực tiếp */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`w-16 h-20 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                  activeImageIndex === idx
                    ? 'border-[#8B5CF6] ring-2 ring-[#8B5CF6]/30 opacity-100 scale-102'
                    : 'border-[#E4E4E7] opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Thông tin chọn biến thể */}
      <div className="flex flex-col justify-between space-y-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest uppercase text-brand-accent bg-brand-accent-light px-2 py-0.5 rounded-full inline-block">
            {product.brand}
          </span>
          <h2 className="text-xl font-bold text-brand-primary mt-2">{product.name}</h2>

          <div className="flex items-baseline gap-3 mt-2">
            <span className="text-2xl font-black text-brand-primary">
              {formatPrice(activeVariant?.price || product.price)}
            </span>
            {(activeVariant?.originalPrice || product.originalPrice) && (
              <span className="text-sm text-brand-secondary line-through">
                {formatPrice(activeVariant?.originalPrice || product.originalPrice!)}
              </span>
            )}
          </div>

          <p className="text-xs text-brand-secondary mt-3 leading-relaxed border-t border-b border-brand-border/60 py-2.5">
            {product.shortDescription}
          </p>

          {/* Thông tin màu sắc (Không dùng bất kỳ chấm tròn màu nào) */}
          <div className="mt-4 space-y-2">
            {isColorVerified && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#71717A]">Màu sắc theo ảnh:</span>
                <span className="font-bold text-[#18181B] bg-[#F2F3F5] px-2.5 py-0.5 rounded border border-[#E4E4E7]">
                  {matchedColor.name}
                </span>
              </div>
            )}

            {/* Nếu sản phẩm có nhiều màu thật, hiển thị các nút chọn màu có nhãn chữ rõ ràng */}
            {verifiedColors.length > 1 && (
              <div className="pt-1">
                <span className="text-[11px] text-[#71717A] block mb-1.5 font-medium">
                  Chọn xem màu khác ({verifiedColors.length} màu thật):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {verifiedColors.map((c) => {
                    const isSelected = matchedColor?.slug === c.slug;
                    return (
                      <button
                        key={c.slug}
                        type="button"
                        onClick={() => {
                          const targetImg = c.image || c.images?.[0];
                          if (targetImg) {
                            const targetIdx = images.indexOf(targetImg);
                            if (targetIdx !== -1) {
                              setActiveImageIndex(targetIdx);
                            }
                          }
                        }}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#18181B] text-white border-[#18181B] shadow-2xs'
                            : 'bg-white text-[#18181B] border-[#E4E4E7] hover:border-[#8B5CF6]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-[#8B5CF6]" />}
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Size */}
          <div className="mt-4">
            <SizeSelector
              sizes={product.sizes}
              selectedSize={selectedSize}
              onSelectSize={setSelectedSize}
              availableSizes={availableSizes}
            />
          </div>

          {/* Trạng thái tồn kho */}
          <div className="mt-3 text-xs">
            {activeVariant ? (
              activeVariant.stock > 0 ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Còn hàng ({activeVariant.stock} sản phẩm sẵn có)
                </span>
              ) : (
                <span className="text-rose-600 font-medium">Kích cỡ này tạm thời hết hàng</span>
              )
            ) : (
              <span className="text-brand-secondary">Vui lòng chọn kích cỡ</span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-4 border-t border-brand-border/60 space-y-2">
          <Button
            variant="accent"
            className="w-full h-12 text-sm font-bold shadow-sm"
            isLoading={isAdding}
            disabled={!activeVariant || activeVariant.stock <= 0}
            onClick={handleAddToCart}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Thêm vào giỏ hàng
          </Button>
          <Link
            to={`/products/${product.slug}`}
            onClick={onClose}
            className="flex items-center justify-center text-xs text-brand-accent hover:text-brand-accent-hover font-semibold py-2 transition-colors"
          >
            Xem toàn bộ chi tiết và gợi ý phối đồ
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  initialImageIndex = 0,
  isOpen,
  onClose,
  onOpenCart,
}) => {
  if (!product || !isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="3xl">
      <QuickViewContent
        product={product}
        initialImageIndex={initialImageIndex}
        onClose={onClose}
        onOpenCart={onOpenCart}
      />
    </Modal>
  );
};
