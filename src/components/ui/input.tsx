import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, startIcon, endIcon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium uppercase tracking-wider text-brand-secondary">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {startIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-brand-muted">
              {startIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              'flex h-11 w-full rounded-brand border border-brand-border bg-brand-paper px-3.5 py-2 text-sm text-brand-charcoal placeholder:text-brand-muted/70 transition-all duration-150',
              'focus:border-brand-forest focus:outline-none focus:ring-1 focus:ring-brand-forest',
              'disabled:cursor-not-allowed disabled:bg-brand-sand/50 disabled:opacity-60',
              startIcon && 'pl-10',
              endIcon && 'pr-10',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500',
              className
            )}
            {...props}
          />
          {endIcon && <div className="absolute right-3.5 flex items-center">{endIcon}</div>}
        </div>
        {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-brand-muted mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
