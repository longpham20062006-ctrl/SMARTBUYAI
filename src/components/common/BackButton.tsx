import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resetGlobalScroll } from '@/components/common/ScrollToTop';

export interface BackButtonProps {
  /**
   * Đường dẫn đích cụ thể (ví dụ: '/shop' cho "Quay lại Shop", '/' cho "Về Trang chủ")
   * Nếu có to, bấm nút sẽ điều hướng dứt khoát về to và tự động cuộn lên đầu trang.
   */
  to?: string;
  /**
   * Đường dẫn dự phòng nếu không dùng to và trình duyệt không có lịch sử hợp lệ
   */
  fallbackPath?: string;
  /**
   * Nhãn hiển thị: "Quay lại Shop", "Về Trang chủ", hoặc "Quay lại"
   */
  label?: string;
  /**
   * Tự động cuộn lên đầu trang khi bấm (mặc định: true)
   */
  scrollToTop?: boolean;
  className?: string;
}

/**
 * SMARTBUY AI — UNIVERSAL BACK BUTTON (THỐNG NHẤT TOÀN HỆ THỐNG)
 * - Nút dạng viên thuốc (pill), bo góc tròn mềm mại (rounded-full)
 * - Nền trắng hoặc tím nhạt, hover đổi màu và nâng nhẹ nút
 * - Mũi tên sang trái chuyển động mượt mà
 * - Cuộn lên đầu trang đến đích chính xác, không quay nhầm về login
 * - Focus-visible rõ nét khi dùng bàn phím
 */
export const BackButton: React.FC<BackButtonProps> = ({
  to,
  fallbackPath = '/shop',
  label = 'Quay lại',
  scrollToTop = true,
  className,
}) => {
  const navigate = useNavigate();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();

    if (scrollToTop) {
      resetGlobalScroll();
    }

    if (to) {
      // Điều hướng trực tiếp và dứt khoát đến đường dẫn chỉ định
      navigate(to);
      return;
    }

    // Nếu không có 'to', kiểm tra lịch sử duyệt của trình duyệt:
    // Nếu có lịch sử thực tế thì quay lại, ngược lại dùng fallbackPath an toàn
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  const testId = label === 'Về Trang chủ' ? 'back-to-home-btn' : label === 'Quay lại Shop' ? 'back-to-shop-btn' : 'back-button';

  return (
    <button
      type="button"
      onClick={handleBack}
      data-testid={testId}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase',
        'bg-white hover:bg-[#F5F3FF] text-[#18181B] hover:text-[#7C3AED]',
        'border border-[#E4E4E7] hover:border-[#DDD6FE]',
        'shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-98',
        'focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30',
        'transition-all duration-200 cursor-pointer select-none group shrink-0',
        className
      )}
      aria-label={label}
      title={label}
    >
      <ArrowLeft className="w-4 h-4 text-[#71717A] group-hover:text-[#7C3AED] group-hover:-translate-x-1 transition-all duration-200 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
};
