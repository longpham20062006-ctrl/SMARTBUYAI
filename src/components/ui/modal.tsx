import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#18181B]/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={cn(
          'relative w-full rounded-2xl bg-white shadow-modal border border-[#E4E4E7] overflow-hidden z-10 animate-fade-in max-h-[90vh] flex flex-col',
          maxWidthClasses[maxWidth]
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between px-6 py-4.5 border-b border-[#E4E4E7] bg-[#FAFAF8]">
            <div className="space-y-0.5">
              {title && <h3 className="text-base sm:text-lg font-bold text-[#18181B]">{title}</h3>}
              {description && <p className="text-xs text-[#71717A]">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-[#71717A] hover:text-[#18181B] rounded-full p-1.5 hover:bg-black/5 transition-colors cursor-pointer ml-3"
              aria-label="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};
