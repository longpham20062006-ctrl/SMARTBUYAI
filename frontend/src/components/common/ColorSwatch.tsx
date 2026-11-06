import React, { useState } from 'react';
import { ColorOption } from '@/types';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ColorSwatchProps {
  colors: ColorOption[];
  selectedColor?: ColorOption;
  onSelectColor?: (color: ColorOption) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  colors,
  selectedColor,
  onSelectColor,
  size = 'md',
  showLabel = false,
  className,
}) => {
  // State quản lý duy nhất 1 tooltip đang hiển thị trong cùng một nhóm màu
  const [hoveredColorSlug, setHoveredColorSlug] = useState<string | null>(null);

  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  // Nền sáng cần đường viền tương phản và checkmark tối màu
  const isLightColor = (hex: string) => {
    const cleanHex = hex.toUpperCase();
    return ['#FFFFFF', '#F9F8F5', '#FAF6EE', '#FAF8F5', '#F5EFE6', '#F3EDE0', '#E7DFD5', '#F9FAFB', '#F4F4F5', '#E4E4E7'].includes(cleanHex);
  };

  return (
    <div
      className={cn('flex flex-wrap items-center gap-1.5 relative', className)}
      onMouseLeave={() => setHoveredColorSlug(null)}
    >
      {colors.map((color) => {
        const isSelected = selectedColor?.slug === color.slug;
        const isHovered = hoveredColorSlug === color.slug;
        const isLight = isLightColor(color.hex);

        return (
          <div key={color.slug} className="relative inline-flex items-center justify-center">
            <button
              type="button"
              aria-label={`Chọn màu ${color.name}`}
              aria-pressed={isSelected}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectColor?.(color);
              }}
              onMouseEnter={() => setHoveredColorSlug(color.slug)}
              onMouseLeave={() => setHoveredColorSlug((prev) => (prev === color.slug ? null : prev))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectColor?.(color);
                }
              }}
              className={cn(
                'relative rounded-full p-0.5 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:ring-offset-1 cursor-pointer select-none',
                isSelected
                  ? 'ring-2 ring-[#8B5CF6] ring-offset-2 ring-offset-white scale-105'
                  : 'hover:scale-110 active:scale-95'
              )}
            >
              <span
                className={cn(
                  'block rounded-full shadow-2xs flex items-center justify-center transition-colors',
                  sizeMap[size],
                  isLight ? 'border border-[#D4D4D8]' : 'border border-black/15'
                )}
                style={{ backgroundColor: color.hex }}
              >
                {isSelected && size !== 'sm' && (
                  <Check
                    className={cn(
                      'w-3 h-3',
                      isLight ? 'text-[#18181B]' : 'text-white'
                    )}
                  />
                )}
              </span>
            </button>

            {/* Tooltip cao cấp, duy nhất cho chấm màu đang hover, căn giữa chính xác */}
            {isHovered && (
              <div
                role="tooltip"
                className="absolute bottom-[calc(100%+7px)] left-1/2 -translate-x-1/2 z-40 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="bg-[#18181B] text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-md shadow-black/25 flex items-center justify-center tracking-normal max-w-[150px] truncate">
                  {color.name}
                </div>
                {/* Mũi tên chỉ xuống chấm màu */}
                <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#18181B] mx-auto -mt-px" />
              </div>
            )}
          </div>
        );
      })}

      {showLabel && selectedColor && (
        <span className="text-xs text-[#71717A] ml-1.5 font-medium">{selectedColor.name}</span>
      )}
    </div>
  );
};
