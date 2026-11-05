import React from 'react';
import { Link } from 'react-router-dom';
import { GENZ_COLLECTIONS } from '@/mocks/genzCategories';
import { ArrowRight, Sparkles } from 'lucide-react';

export const CollectionsPage: React.FC = () => {
  return (
    <div className="bg-brand-bg min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent-light text-brand-accent text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EDITORIAL LOOKBOOKS & DROPS</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-brand-primary uppercase tracking-tight">
            BỘ SƯU TẬP GEN Z 2026
          </h1>
          <p className="text-xs sm:text-sm text-brand-secondary leading-relaxed">
            Mỗi collection là một tuyên ngôn thẩm mỹ streetwear, oversize unisex & Y2K aesthetic dành cho thế hệ trẻ tự do.
          </p>
        </div>

        {/* Grid Collections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {GENZ_COLLECTIONS.map((col, idx) => (
            <Link
              key={col.id}
              to={`/collections/${col.slug}`}
              className="group block rounded-2xl overflow-hidden bg-brand-surface border border-brand-border hover:border-brand-accent shadow-xs hover:shadow-md transition-all duration-300"
            >
              <div className="aspect-[16/10] overflow-hidden relative bg-brand-subtle">
                <img
                  src={col.bannerImage}
                  alt={col.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute top-4 left-4 bg-brand-primary/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase text-white shadow-xs">
                  SEASON: {col.season}
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between text-xs text-brand-secondary">
                  <span className="font-semibold">COLLECTION 0{idx + 1}</span>
                  {col.isFeatured && (
                    <span className="text-brand-accent font-bold flex items-center gap-1 bg-brand-accent-light px-2.5 py-0.5 rounded-full text-[10px]">
                      HOT DROP
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-bold text-brand-primary group-hover:text-brand-accent transition-colors uppercase">
                  {col.title}
                </h2>

                <p className="text-xs sm:text-sm text-brand-secondary line-clamp-2 leading-relaxed">
                  {col.description}
                </p>

                <div className="pt-2 flex items-center text-xs font-bold text-brand-primary group-hover:text-brand-accent transition-colors">
                  <span>Xem các thiết kế trong bộ sưu tập</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
