import React from 'react';
import { Loader2 } from 'lucide-react';

export const PageLoader: React.FC = () => {
  return (
    <div
      className="min-h-[60vh] w-full flex flex-col items-center justify-center p-8 animate-fade-in"
      aria-label="Đang tải nội dung..."
      role="status"
    >
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-brand-border/60 border-t-brand-forest animate-spin" />
        <Loader2 className="w-5 h-5 text-brand-forest absolute animate-pulse" />
      </div>
      <p className="mt-4 text-xs font-medium text-brand-muted tracking-wide animate-pulse">
        SMARTBUY AI — Đang tải trang...
      </p>
    </div>
  );
};

