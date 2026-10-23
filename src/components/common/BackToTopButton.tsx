import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BackToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      title="Cuộn lên đầu trang"
      aria-label="Cuộn lên đầu trang"
      className={cn(
        'fixed bottom-20 right-6 lg:bottom-8 lg:right-8 z-30 w-11 h-11 rounded-full bg-white shadow-modal border border-[#E4E4E7]',
        'text-[#18181B] hover:bg-[#18181B] hover:text-white hover:border-[#18181B]',
        'flex items-center justify-center transition-all duration-300 animate-fade-in cursor-pointer group active:scale-95'
      )}
    >
      <ArrowUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
    </button>
  );
};
