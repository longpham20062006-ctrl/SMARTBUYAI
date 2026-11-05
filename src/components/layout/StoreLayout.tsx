import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { QuickViewModal } from '@/components/common/QuickViewModal';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { BackToTopButton } from '@/components/common/BackToTopButton';
import { FloatingAIStylist } from '@/components/common/FloatingAIStylist';
import { Product } from '@/types';
import { ArrowRightLeft, X } from 'lucide-react';

export const StoreLayout: React.FC = () => {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);

  // Listen to global quick view & compare events
  useEffect(() => {
    const handleOpenQuickView = (e: CustomEvent<Product>) => {
      setQuickViewProduct(e.detail);
    };

    const handleToggleCompare = (e: CustomEvent<Product>) => {
      const prod = e.detail;
      setComparedProducts((prev) => {
        const exists = prev.some((p) => p.id === prod.id);
        if (exists) {
          return prev.filter((p) => p.id !== prod.id);
        } else {
          if (prev.length >= 4) {
            alert('Bạn chỉ có thể so sánh tối đa 4 sản phẩm cùng lúc.');
            return prev;
          }
          return [...prev, prod];
        }
      });
    };

    window.addEventListener('open_quick_view' as any, handleOpenQuickView);
    window.addEventListener('toggle_compare' as any, handleToggleCompare);

    return () => {
      window.removeEventListener('open_quick_view' as any, handleOpenQuickView);
      window.removeEventListener('toggle_compare' as any, handleToggleCompare);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F6] text-[#18181B]">
      <ScrollToTop />
      <SiteHeader />

      <main className="flex-1">
        <Outlet />
      </main>

      <SiteFooter />
      <BackToTopButton />
      <FloatingAIStylist />

      {/* Global Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />

      {/* Floating Compare Bar */}
      {comparedProducts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white shadow-modal border border-[#ECEAE7] rounded-xl px-4 py-3 flex items-center gap-4 animate-fade-in max-w-lg w-[90%]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#F0EFED] text-[#18181B] flex items-center justify-center shrink-0">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-[#18181B]">
                So sánh ({comparedProducts.length}/4)
              </span>
              <p className="text-[11px] text-[#78716C] hidden sm:block">
                Đối chiếu chất liệu, phom dáng và chi tiết
              </p>
            </div>
          </div>

          <div className="flex -space-x-2 overflow-hidden mx-auto">
            {comparedProducts.map((p) => (
              <div
                key={p.id}
                className="relative inline-block w-9 h-12 rounded overflow-hidden border-2 border-white shadow-xs"
              >
                <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setComparedProducts((prev) => prev.filter((item) => item.id !== p.id))}
                  className="absolute top-0 right-0 bg-black/70 text-white p-0.5 rounded-bl-sm"
                  title="Bỏ món này"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
