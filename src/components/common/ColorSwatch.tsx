import React from 'react';
import { ColorOption } from '@/types';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ColorSwatchProps {
  colors: ColorOption[];
  selectedColor?: ColorOption;
  onSelectColor?: (color: ColorOption) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  colors,
  selectedColor,
  onSelectColor,
  size = 'md',
  showLabel = false,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {colors.map((color) => {
        const isSelected = selectedColor?.slug === color.slug;
        return (
          <button
            key={color.slug}
            type="button"
            title={color.name}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelectColor?.(color);
            }}
            className={cn(
              'group relative rounded-full p-0.5 transition-all duration-150 focus:outline-none cursor-pointer',
              isSelected ? 'ring-2 ring-brand-forest ring-offset-2' : 'hover:scale-110'
            )}
          >
            <span
              className={cn(
                'block rounded-full border border-black/15 shadow-2xs flex items-center justify-center',
                sizeMap[size]
              )}
              style={{ backgroundColor: color.hex }}
            >
              {isSelected && size !== 'sm' && (
                <Check
                  className={cn(
                    'w-3 h-3',
                    // Đổi màu check icon tương phản theo độ sáng màu nền swatch
                    ['#FFFFFF', '#F9F8F5', '#FAF6EE', '#FAF8F5', '#F5EFE6', '#F3EDE0', '#E7DFD5'].includes(color.hex)
                      ? 'text-brand-charcoal'
                      : 'text-white'
                  )}
                />
              )}
            </span>
            {/* Tooltip on hover */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap rounded-brand-sm bg-brand-charcoal text-white text-[11px] px-2 py-0.5 z-20 pointer-events-none shadow-md">
              {color.name}
            </span>
          </button>
        );
      })}
      {showLabel && selectedColor && (
        <span className="text-xs text-brand-secondary ml-1 font-medium">{selectedColor.name}</span>
      )}
    </div>
  );
};
