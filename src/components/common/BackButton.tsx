import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  fallbackPath?: string;
  label?: string;
  className?: string;
}

/**
 * SMARTBUY AI — UNIVERSAL BACK BUTTON (NÚT QUAY LẠI CHUẨN)
 * - Icon mũi tên quay lại sang trái
 * - Bo góc 12px (rounded-xl)
 * - Hiệu ứng hover & active mượt mà
 * - Chữ "Quay lại" rõ ràng, dễ nhìn thấy
 * - Điều hướng về trang trước đó qua window.history, fallback về trang chủ hoặc fallbackPath
 */
export const BackButton: React.FC<BackButtonProps> = ({
  fallbackPath = '/',
  label = 'Quay lại',
  className,
}) => {
  const navigate = useNavigate();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    // Kiểm tra lịch sử duyệt của trình duyệt: nếu có lịch sử hợp lệ thì quay lại
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider',
        'bg-white hover:bg-[#F4F4F5] text-[#18181B] hover:text-[#8B5CF6]',
        'border border-[#E4E4E7] hover:border-[#8B5CF6]/40 shadow-2xs hover:shadow-sm',
        'transition-all duration-200 cursor-pointer active:scale-97 select-none group',
        className
      )}
      aria-label={label}
      title={label}
    >
      <ArrowLeft className="w-4 h-4 text-[#71717A] group-hover:text-[#8B5CF6] group-hover:-translate-x-0.5 transition-transform duration-200" />
      <span>{label}</span>
    </button>
  );
};

