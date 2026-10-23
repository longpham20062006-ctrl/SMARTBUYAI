import React, { useState } from 'react';
import { Product, ColorOption, SizeCode } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { ColorSwatch } from '@/components/common/ColorSwatch';
import { SizeSelector } from '@/components/common/SizeSelector';
import { formatPrice } from '@/lib/utils';
import { MockRepo } from '@/mocks/repository';
import { useToast } from '@/components/ui/toast';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCart?: () => void;
}

interface QuickViewContentProps {
  product: Product;
  onClose: () => void;
  onOpenCart?: () => void;
}

const QuickViewContent: React.FC<QuickViewContentProps> = ({
  product,
  onClose,
  onOpenCart,
}) => {
  const [selectedColor, setSelectedColor] = useState<ColorOption>(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState<SizeCode | undefined>(product.sizes[0]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const { success, error } = useToast();

  // Tìm biến thể đang chọn
  const activeVariant = product.variants.find(
    (v) => v.color.slug === selectedColor.slug && v.size === selectedSize
  );

  // Danh sách size còn tồn của màu hiện tại
  const availableSizes = product.variants
    .filter((v) => v.color.slug === selectedColor.slug && v.stock > 0)
    .map((v) => v.size);

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
        image: activeVariant.image || product.images[0],
        color: selectedColor,
        size: selectedSize,
        price: activeVariant.price,
        originalPrice: activeVariant.originalPrice,
        quantity: 1,
      });

      setIsAdding(false);
      if (res.success) {
        success('Đã thêm vào giỏ hàng', `${product.name} (${selectedColor.name} - Size ${selectedSize})`);
        onClose();
        onOpenCart?.();
      } else {
        error('Không thể thêm vào giỏ', res.message);
      }
    }, 250);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
      {/* Hình ảnh */}
      <div className="space-y-3">
        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-brand-subtle border border-brand-border/60">
          <img
            src={product.images[activeImageIndex] || product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-all duration-300"
          />
        </div>
        {product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`w-16 h-20 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                  activeImageIndex === idx ? 'border-brand-accent ring-2 ring-brand-accent/20' : 'border-brand-border/80 opacity-70 hover:opacity-100'
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

          {/* Màu sắc */}
          <div className="mt-4 space-y-2">
            <div className="text-xs font-semibold text-brand-secondary">
              Màu sắc: <span className="text-brand-primary font-bold">{selectedColor.name}</span>
            </div>
            <ColorSwatch
              colors={product.colors}
              selectedColor={selectedColor}
              onSelectColor={(c) => {
                setSelectedColor(c);
                const newAvail = product.variants
                  .filter((v) => v.color.slug === c.slug && v.stock > 0)
                  .map((v) => v.size);
                if (selectedSize && !newAvail.includes(selectedSize) && newAvail.length > 0) {
                  setSelectedSize(newAvail[0]);
                }
              }}
            />
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
  isOpen,
  onClose,
  onOpenCart,
}) => {
  if (!product || !isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="3xl">
      <QuickViewContent product={product} onClose={onClose} onOpenCart={onOpenCart} />
    </Modal>
  );
};
