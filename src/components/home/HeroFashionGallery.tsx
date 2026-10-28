import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface HeroGalleryItem {
  id: string;
  src: string;
  alt: string;
  badge: string;
  title: string;
  desc: string;
  objectPosition: string;
}

export const HERO_GALLERY_IMAGES: HeroGalleryItem[] = [
  {
    id: 'look-1',
    src: '/images/anh_trangchu/0fb1b05f-e815-4159-8fe5-abe2c079b9e1.png',
    alt: 'SMARTBUY AI Streetwear Model - YOUR STYLE YOUR RULES',
    badge: 'GEN Z STREETWEAR LOOK 01',
    title: 'OVERSIZED GRAPHIC SWEATSHIRT',
    desc: 'Phom rộng thoải mái • Phong cách đường phố tự do',
    objectPosition: 'center 20%',
  },
  {
    id: 'look-2',
    src: '/images/anh_trangchu/anh_1.png',
    alt: 'SMARTBUY AI Korean Minimalist Layered Shirt',
    badge: 'GEN Z STREETWEAR LOOK 02',
    title: 'MINIMALIST LAYERED SHIRT',
    desc: 'Sơ mi phối màu pastel • Tinh tế thanh lịch chuẩn Hàn',
    objectPosition: 'center 20%',
  },
  {
    id: 'look-3',
    src: '/images/anh_trangchu/anh_2.png',
    alt: 'SMARTBUY AI Cyberpunk Night Streetwear Look',
    badge: 'GEN Z STREETWEAR LOOK 03',
    title: 'CYBERPUNK NIGHT OUTLOOK',
    desc: 'Phối cravat & quần hai màu • Nổi bật ánh đèn thành phố',
    objectPosition: 'center 15%',
  },
  {
    id: 'look-4',
    src: '/images/anh_trangchu/anh_3.png',
    alt: 'SMARTBUY AI Vintage Acid Wash Hoodie',
    badge: 'GEN Z STREETWEAR LOOK 04',
    title: 'VINTAGE WASH ACID HOODIE',
    desc: 'Chất nỉ bông xử lý wash • Quần túi hộp đậm chất bụi bặm',
    objectPosition: 'center 20%',
  },
];

const SLIDE_DURATION = 5000; // Tự động chuyển ảnh sau mỗi 5 giây

export const HeroFashionGallery: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Preload 4 ảnh để đảm bảo khi chuyển ảnh mượt mà 100%, không bị chớp hay 404
  useEffect(() => {
    HERO_GALLERY_IMAGES.forEach((item) => {
      const img = new Image();
      img.src = item.src;
    });
  }, []);

  // 2. Dừng Timer an toàn
  const stopSlideshow = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 3. Khởi động Timer tự động chuyển ảnh mỗi 5 giây (vòng lặp vô hạn)
  const startSlideshow = useCallback(() => {
    stopSlideshow();
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_GALLERY_IMAGES.length);
    }, SLIDE_DURATION);
  }, [stopSlideshow]);

  // 4. Tự động chạy ngay khi mount & tạm dừng khi tab trình duyệt bị ẩn
  useEffect(() => {
    startSlideshow();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopSlideshow();
      } else {
        startSlideshow();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopSlideshow();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startSlideshow, stopSlideshow]);

  // 5. Điều khiển thủ công (Nút bấm, dots indicator, vuốt điện thoại)
  // Sau thao tác thủ công, khởi động lại chu kỳ 5 giây để tránh chuyển ảnh đột ngột
  const goToNext = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % HERO_GALLERY_IMAGES.length);
    startSlideshow();
  };

  const goToPrev = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + HERO_GALLERY_IMAGES.length) % HERO_GALLERY_IMAGES.length);
    startSlideshow();
  };

  const goToIndex = (idx: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex(idx);
    startSlideshow();
  };

  // 6. Xử lý cử chỉ vuốt chạm trên Mobile / Tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 40) {
      goToPrev(e);
    } else if (diff < -40) {
      goToNext(e);
    }
    touchStartX.current = null;
  };

  const currentImage = HERO_GALLERY_IMAGES[currentIndex];

  return (
    <div
      className="relative mx-auto max-w-[460px] lg:max-w-none rounded-3xl overflow-hidden aspect-[3/4] bg-[#27272A] border border-white/15 shadow-[0_0_35px_rgba(139,92,246,0.25)] group select-none transition-shadow duration-500 hover:shadow-[0_0_45px_rgba(34,211,238,0.35)]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="SMARTBUY AI Hero Fashion Gallery"
    >
      {/* 4 Lớp Ảnh Chuyển Đổi Mượt Bằng CSS Crossfade (Opacity 600-700ms) & Subtle Zoom */}
      {HERO_GALLERY_IMAGES.map((img, idx) => {
        const isActive = idx === currentIndex;
        return (
          <img
            key={img.id}
            src={img.src}
            alt={img.alt}
            style={{ objectPosition: img.objectPosition }}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
              isActive
                ? `opacity-100 ${prefersReducedMotion ? 'scale-100' : 'scale-103'} z-10`
                : 'opacity-0 scale-100 z-0 pointer-events-none'
            }`}
            loading={idx === 0 ? 'eager' : 'lazy'}
          />
        );
      })}

      {/* Subtle Vignette Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent z-15 pointer-events-none" />

      {/* Floating Brand Badge góc trên bên trái */}
      <div className="absolute top-4 left-4 z-20 bg-black/75 backdrop-blur-md border border-white/20 text-[#18F4FC] text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-full tracking-wider shadow-lg transition-all duration-300">
        {currentImage.badge}
      </div>

      {/* Chỉ báo Gallery 01 / 04 góc trên bên phải đồng bộ thời gian thực */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-white/90 shadow-lg">
        <span className="text-[#18F4FC]">{String(currentIndex + 1).padStart(2, '0')}</span>
        <span className="text-white/40">/</span>
        <span className="text-white/70">04</span>
      </div>

      {/* Nút Chuyển Ảnh Trái / Phải Xuất Hiện Khi Hover (Hỗ trợ Desktop & Mobile) */}
      <button
        type="button"
        onClick={goToPrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-25 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 text-white flex items-center justify-center backdrop-blur-md border border-white/25 opacity-0 group-hover:opacity-100 sm:opacity-0 transition-all duration-300 hover:scale-105 cursor-pointer shadow-xl hover:border-[#18F4FC]/60"
        aria-label="Xem ảnh trước"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>

      <button
        type="button"
        onClick={goToNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-25 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 text-white flex items-center justify-center backdrop-blur-md border border-white/25 opacity-0 group-hover:opacity-100 sm:opacity-0 transition-all duration-300 hover:scale-105 cursor-pointer shadow-xl hover:border-[#18F4FC]/60"
        aria-label="Xem ảnh tiếp theo"
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      {/* Thông tin chú thích & Thanh chỉ báo Dots góc dưới */}
      <div className="absolute bottom-4 left-4 right-4 z-20 text-left">
        {/* 4 Dots Progress Indicator */}
        <div className="flex items-center gap-1.5 mb-2">
          {HERO_GALLERY_IMAGES.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={(e) => goToIndex(dotIdx, e)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                dotIdx === currentIndex
                  ? 'w-7 bg-[#18F4FC] shadow-[0_0_8px_rgba(24,244,252,0.6)]'
                  : 'w-2 bg-white/35 hover:bg-white/70'
              }`}
              aria-label={`Chuyển đến ảnh ${dotIdx + 1}`}
            />
          ))}
        </div>

        {/* Tên Thiết Kế & Mô Tả Ngắn đồng bộ với ảnh active */}
        <span className="text-[10px] font-black uppercase text-[#18F4FC] tracking-widest block drop-shadow-md">
          {currentImage.title}
        </span>
        <p className="text-xs text-white/95 font-medium mt-0.5 line-clamp-1 drop-shadow-sm">
          {currentImage.desc}
        </p>
      </div>
    </div>
  );
};
