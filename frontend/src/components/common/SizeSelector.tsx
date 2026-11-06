import React from 'react';
import { SizeCode } from '@/types';
import { cn } from '@/lib/utils';

interface SizeSelectorProps {
  sizes: SizeCode[];
  selectedSize?: SizeCode;
  onSelectSize?: (size: SizeCode) => void;
  availableSizes?: SizeCode[]; // Các size còn tồn > 0
  onOpenSizeGuide?: () => void;
}

export const SizeSelector: React.FC<SizeSelectorProps> = ({
  sizes,
  selectedSize,
  onSelectSize,
  availableSizes,
  onOpenSizeGuide,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-brand-secondary">
          Kích cỡ: <span className="text-brand-charcoal font-semibold">{selectedSize || 'Chưa chọn'}</span>
        </span>
        {onOpenSizeGuide && (
          <button
            type="button"
            onClick={onOpenSizeGuide}
            className="text-brand-forest hover:text-brand-forest-hover underline underline-offset-2 cursor-pointer font-medium"
          >
            Bảng số đo kích thước
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const isSelected = selectedSize === size;
          const isAvailable = availableSizes ? availableSizes.includes(size) : true;

          return (
            <button
              key={size}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelectSize?.(size)}
              className={cn(
                'min-w-[42px] h-10 px-3 flex items-center justify-center rounded-brand text-xs font-medium transition-all duration-150 relative cursor-pointer',
                isSelected
                  ? 'bg-brand-forest text-brand-ivory border-brand-forest shadow-2xs'
                  : 'bg-brand-paper border border-brand-border text-brand-charcoal hover:border-brand-charcoal',
                !isAvailable &&
                  'opacity-40 bg-brand-sand/60 border-brand-border cursor-not-allowed hover:border-brand-border line-through text-brand-muted'
              )}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
};
