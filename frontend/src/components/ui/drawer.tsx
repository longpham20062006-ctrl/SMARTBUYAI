import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: 'right' | 'left';
  maxWidth?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  position = 'right',
  maxWidth = 'max-w-md',
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#18181B]/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className={cn('fixed inset-y-0 flex max-w-full', position === 'right' ? 'right-0 pl-10' : 'left-0 pr-10')}>
        <div
          className={cn(
            'w-screen bg-white shadow-drawer border-l border-[#E4E4E7] flex flex-col animate-drawer-in',
            maxWidth
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#E4E4E7] bg-[#FAFAF8]">
            <div className="font-bold text-[#18181B] text-base">{title}</div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#71717A] hover:text-[#18181B] hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Đóng bảng trượt"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-[#E4E4E7] bg-[#FAFAF8]">{footer}</div>
          )}
        </div>
      </div>
    </div>
  );
};
