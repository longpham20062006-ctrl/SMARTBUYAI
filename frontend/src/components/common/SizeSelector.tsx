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
        <span className="font-medium text-[#78716C]">
          Kích cỡ: <span className="text-[#18181B] font-semibold">{selectedSize || 'Chưa chọn'}</span>
        </span>
        {onOpenSizeGuide && (
          <button
            type="button"
            onClick={onOpenSizeGuide}
            className="text-[#18181B] hover:text-[#78716C] underline underline-offset-2 cursor-pointer font-medium text-xs transition-colors"
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
                'min-w-[46px] h-11 px-3.5 flex items-center justify-center rounded-xl text-xs font-semibold transition-all duration-150 relative cursor-pointer',
                isSelected
                  ? 'bg-[#18181B] text-white border-2 border-[#18181B] shadow-sm'
                  : 'bg-white border border-[#ECEAE7] text-[#18181B] hover:border-[#18181B]',
                !isAvailable &&
                  'opacity-35 bg-[#F0EFED] border-[#ECEAE7] cursor-not-allowed hover:border-[#ECEAE7] line-through text-[#A8A29E]'
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
