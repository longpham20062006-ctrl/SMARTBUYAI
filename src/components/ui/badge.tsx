import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'dark' | 'outline' | 'success' | 'warning' | 'danger' | 'neon' | 'pink' | 'lime' | 'forest' | 'terracotta' | 'sage' | 'pending';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', children, ...props }) => {
  const variants = {
    default: 'bg-[#F2F3F5] text-[#18181B] border border-[#E4E4E7]',
    accent: 'bg-[#F3E8FF] text-[#7C3AED] border border-[#DDD6FE] font-semibold',
    neon: 'bg-[#F3E8FF] text-[#7C3AED] border border-[#DDD6FE] font-semibold',
    pink: 'bg-[#F3E8FF] text-[#7C3AED] border border-[#DDD6FE] font-semibold',
    lime: 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-semibold',
    dark: 'bg-[#18181B] text-white border border-transparent font-medium',
    forest: 'bg-[#18181B] text-white border border-transparent font-medium',
    terracotta: 'bg-[#F3E8FF] text-[#7C3AED] border border-[#DDD6FE] font-semibold',
    sage: 'bg-[#F2F3F5] text-[#18181B] border border-[#E4E4E7]',
    outline: 'border border-[#E4E4E7] text-[#18181B] bg-transparent font-medium',
    pending: 'bg-amber-50 text-amber-800 border border-amber-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] tracking-wide transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
