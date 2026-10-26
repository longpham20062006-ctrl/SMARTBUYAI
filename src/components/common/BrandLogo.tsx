import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export type BrandLogoVariant = 'header' | 'footer' | 'compact' | 'icon-only' | 'dark' | 'light';

export interface BrandLogoProps {
  /**
   * Biến thể hiển thị của logo:
   * - 'header': Logo tách nền trong suốt 100%, không viền, không khung đen, chữ đen + cyan
   * - 'footer': Logo tách nền chữ trắng + cyan cho nền tối, không khung đen
   * - 'compact': Biểu tượng + text thu gọn
   * - 'icon-only': Chỉ biểu tượng móc treo + S + vi mạch AI
   * - 'dark': Logo chữ trắng cho nền tối
   * - 'light': Logo chữ đen cho nền sáng
   */
  variant?: BrandLogoVariant;
  className?: string;
  href?: string | null;
  showTagline?: boolean;
  imgClassName?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'header',
  className,
  href = '/',
  showTagline = false,
  imgClassName,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  // Asset paths (Tất cả đều là ảnh tách nền trong suốt 100%, không có khung đen bao quanh)
  const assets = {
    // Cho nền sáng (Header trắng/kem): Chữ SMARTBUY đen sắc nét, AI màu cyan nổi bật
    light: '/images/branding/smartbuy-ai-logo-transparent.png',
    // Cho nền tối (Footer đen/xám): Chữ SMARTBUY trắng tinh tế, AI màu cyan nổi bật
    dark: '/images/branding/smartbuy-ai-logo-white-text.png',
    // Icon vuông biểu tượng
    icon: '/images/branding/smartbuy-ai-icon.png',
  };

  // Xác định nguồn ảnh theo variant
  let imageSrc = assets.light;
  let defaultImgClasses = 'h-9 sm:h-11 md:h-12 lg:h-[50px] w-auto max-w-[280px] object-contain shrink-0';

  if (variant === 'icon-only') {
    imageSrc = assets.icon;
    defaultImgClasses = 'h-8 sm:h-10 w-8 sm:w-10 object-contain';
  } else if (variant === 'light' || variant === 'header') {
    imageSrc = assets.light;
    defaultImgClasses = 'h-7 sm:h-9 md:h-11 lg:h-12 w-auto max-w-[130px] sm:max-w-[200px] lg:max-w-[270px] object-contain shrink';
  } else if (variant === 'compact') {
    imageSrc = assets.icon;
    defaultImgClasses = 'h-7 sm:h-8 w-7 sm:w-8 object-contain';
  } else if (variant === 'footer' || variant === 'dark') {
    imageSrc = assets.dark;
    defaultImgClasses = 'h-8 sm:h-10 md:h-12 w-auto max-w-[240px] sm:max-w-[260px] object-contain shrink-0';
  }

  // Fallback typography nếu asset bị lỗi
  const renderFallback = () => (
    <div className="flex items-center gap-1.5 select-none font-sans leading-none">
      <span className={cn(
        "text-xl sm:text-2xl font-black tracking-tighter",
        variant === 'footer' || variant === 'dark' ? "text-white" : "text-[#18181B]"
      )}>
        SMARTBUY
      </span>
      <span className="text-xs sm:text-sm font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#18F4FC] text-[#0A0A0A]">
        AI
      </span>
    </div>
  );

  // Nội dung logo - TUYỆT ĐỐI KHÔNG DÙNG KHUNG, KHÔNG NỀN ĐEN, KHÔNG BORDER
  const renderContent = () => {
    if (imageFailed) {
      return renderFallback();
    }

    if (variant === 'compact') {
      return (
        <div className={cn("inline-flex items-center gap-2", className)}>
          <img
            src={assets.icon}
            alt="SMARTBUY AI"
            width={32}
            height={32}
            onError={() => setImageFailed(true)}
            className={cn(defaultImgClasses, imgClassName)}
          />
          <span className="font-sans font-black tracking-tight text-sm text-[#18181B]">
            SMARTBUY <span className="text-[#00B4D8] font-black">AI</span>
          </span>
        </div>
      );
    }

    if (variant === 'icon-only') {
      return (
        <img
          src={assets.icon}
          alt="SMARTBUY AI"
          width={36}
          height={36}
          onError={() => setImageFailed(true)}
          className={cn(defaultImgClasses, className, imgClassName)}
        />
      );
    }

    // Default: header, footer, light, dark
    return (
      <div className={cn('inline-flex flex-col items-start', className)}>
        <img
          src={imageSrc}
          alt="SMARTBUY AI"
          onError={() => setImageFailed(true)}
          className={cn(
            defaultImgClasses,
            'transition-opacity duration-200 group-hover:opacity-90',
            imgClassName
          )}
          loading="eager"
        />
        {showTagline && (
          <span className={cn(
            "text-[9px] uppercase font-bold tracking-[0.22em] mt-1",
            variant === 'footer' || variant === 'dark' ? "text-[#A1A1AA]" : "text-[#71717A]"
          )}>
            PREMIUM STREETWEAR & AI FASHION
          </span>
        )}
      </div>
    );
  };

  if (href) {
    return (
      <Link
        to={href}
        className="inline-flex items-center select-none group focus:outline-hidden"
        aria-label="SMARTBUY AI - Trang chủ"
      >
        {renderContent()}
      </Link>
    );
  }

  return <div className="inline-flex items-center select-none">{renderContent()}</div>;
};
