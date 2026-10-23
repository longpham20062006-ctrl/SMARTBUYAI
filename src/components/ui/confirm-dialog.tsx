import * as React from 'react';
import { Modal } from './modal';
import { Button } from './button';
import { AlertTriangle, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'accent';
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  variant,
  isDestructive,
  isLoading = false,
}) => {
  const resolvedVariant = variant || (isDestructive ? 'danger' : 'accent');
  const resolvedMessage = description || message || '';
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              resolvedVariant === 'danger'
                ? 'bg-rose-50 text-rose-600'
                : 'bg-[#F3E8FF] text-[#7C3AED]'
            }`}
          >
            {resolvedVariant === 'danger' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Info className="w-5 h-5" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[#18181B]">{title}</h3>
            <p className="text-xs text-[#71717A] leading-relaxed">{resolvedMessage}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E4E4E7]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={resolvedVariant === 'danger' ? 'danger' : resolvedVariant === 'accent' ? 'accent' : 'primary'}
            size="sm"
            onClick={() => {
              onConfirm();
            }}
            isLoading={isLoading}
            className="text-xs font-semibold"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
