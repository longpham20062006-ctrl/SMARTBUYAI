import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'link' | 'neon' | 'pink';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none disabled:transform-none active:scale-[0.98] select-none cursor-pointer motion-reduce:transition-none motion-reduce:transform-none';

    const variants = {
      primary:
        'bg-[#18181B] text-white hover:bg-[#303036] hover:-translate-y-0.5 hover:shadow-card shadow-subtle border border-transparent',
      accent:
        'bg-[#8B5CF6] text-white font-semibold hover:bg-[#7C3AED] hover:-translate-y-0.5 hover:shadow-accent shadow-subtle border border-transparent',
      neon:
        'bg-[#8B5CF6] text-white font-semibold hover:bg-[#7C3AED] hover:-translate-y-0.5 hover:shadow-accent shadow-subtle border border-transparent',
      pink:
        'bg-[#F3E8FF] text-[#7C3AED] font-semibold hover:bg-[#E9D5FF] hover:-translate-y-0.5 shadow-subtle border border-[#DDD6FE]',
      secondary:
        'bg-[#F2F3F5] text-[#18181B] hover:bg-[#E4E4E7] hover:-translate-y-0.5 border border-[#E4E4E7] font-medium shadow-subtle',
      outline:
        'bg-transparent text-[#18181B] border border-[#E4E4E7] hover:bg-[#F2F3F5] hover:border-[#D4D4D8] hover:-translate-y-0.5',
      ghost:
        'bg-transparent text-[#18181B] hover:bg-[#F2F3F5]',
      danger:
        'bg-[#DC2626] text-white hover:bg-rose-700 hover:-translate-y-0.5 focus-visible:ring-rose-500 shadow-subtle border border-transparent',
      link:
        'text-[#8B5CF6] underline-offset-4 hover:underline p-0 h-auto font-normal',
    };

    const sizes = {
      sm: 'h-9 px-3.5 text-xs rounded-brand-sm min-w-[36px]',
      md: 'h-11 px-5 text-sm rounded-brand min-w-[44px]',
      lg: 'h-12 px-6.5 text-base rounded-brand-lg min-w-[48px]',
      icon: 'h-10 w-10 rounded-full p-0 flex items-center justify-center min-w-[40px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
