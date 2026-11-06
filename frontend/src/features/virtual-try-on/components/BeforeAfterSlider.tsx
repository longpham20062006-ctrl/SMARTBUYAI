import React, { useState, useRef, useCallback } from 'react';
import { Columns2, SplitSquareHorizontal } from 'lucide-react';

interface BeforeAfterSliderProps {
  originalImage: string;
  resultImage: string;
  originalLabel?: string;
  resultLabel?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  originalImage,
  resultImage,
  originalLabel = 'Ảnh gốc',
  resultLabel = 'Sau khi thử AI',
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isSideBySide, setIsSideBySide] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  }, []);

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <div className="space-y-3">
      {/* Nút chuyển chế độ so sánh */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">
          So sánh kết quả phối đồ
        </span>
        <button
          type="button"
          onClick={() => setIsSideBySide(!isSideBySide)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#18181B] bg-[#F4F4F5] hover:bg-[#E4E4E7] rounded-lg transition-colors"
        >
          {isSideBySide ? (
            <>
              <SplitSquareHorizontal className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Chế độ Kéo trượt (Slider)</span>
            </>
          ) : (
            <>
              <Columns2 className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Chế độ Song song (Side-by-side)</span>
            </>
          )}
        </button>
      </div>

      {isSideBySide ? (
        /* Chế độ Song Song */
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 border border-[#E4E4E7]">
              <img
                src={originalImage}
                alt={originalLabel}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-center text-xs font-semibold text-[#71717A]">
              {originalLabel}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 border-2 border-[#8B5CF6]">
              <img
                src={resultImage}
                alt={resultLabel}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-center text-xs font-semibold text-[#8B5CF6]">
              {resultLabel}
            </p>
          </div>
        </div>
      ) : (
        /* Chế độ Thanh trượt (Slider) */
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          className="relative aspect-[3/4] max-h-[580px] w-full rounded-2xl overflow-hidden select-none cursor-ew-resize border border-[#E4E4E7] bg-gray-100 mx-auto"
        >
          {/* Lớp ảnh sau khi thử (Result Image - Nằm dưới) */}
          <img
            src={resultImage}
            alt={resultLabel}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          {/* Lớp ảnh gốc (Original Image - Cắt theo tỷ lệ kéo trượt) */}
          <img
            src={originalImage}
            alt={originalLabel}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          />

          {/* Đường ngăn cách trượt */}
          <div
            onMouseDown={handleMouseDown}
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-ew-resize z-10"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg border border-[#E4E4E7] flex items-center justify-center text-[#18181B]">
              <SplitSquareHorizontal className="w-4 h-4 text-[#8B5CF6]" />
            </div>
          </div>

          {/* Nhãn 2 bên */}
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md text-[10px] font-semibold text-white uppercase tracking-wider pointer-events-none">
            {originalLabel}
          </div>
          <div className="absolute top-3 right-3 px-2 py-1 bg-[#8B5CF6]/90 backdrop-blur-sm rounded-md text-[10px] font-semibold text-white uppercase tracking-wider pointer-events-none">
            {resultLabel}
          </div>
        </div>
      )}
    </div>
  );
};
