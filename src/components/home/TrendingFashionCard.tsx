import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { Sparkles, ArrowRight } from 'lucide-react';

interface TrendingFashionCardProps {
  product: Product;
  badge?: string;
  rank?: number;
}

export const TrendingFashionCard: React.FC<TrendingFashionCardProps> = ({
  product,
  badge = 'HOT TRENDING',
  rank,
}) => {
  const imageUrl = product.images?.[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800';

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group relative flex flex-col rounded-3xl overflow-hidden bg-white border border-[#E4E4E7] shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 select-none"
    >
      {/* Fashion Photo Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#18181B]">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-106"
          loading="lazy"
        />

        {/* Ambient Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[#18F4FC] text-[10px] font-extrabold uppercase tracking-widest shadow-sm">
            <Sparkles className="w-3 h-3 text-[#18F4FC]" />
            <span>{badge}</span>
          </div>

          {typeof rank === 'number' && (
            <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-black flex items-center justify-center font-mono">
              0{rank}
            </div>
          )}
        </div>

        {/* Bottom Overlay Content — Editorial Styling, NO PRICES DISPLAYED */}
        <div className="absolute bottom-4 left-4 right-4 text-left pointer-events-none">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#18F4FC] block">
            {product.brand || 'SMARTBUY AI'} • {product.gender === 'nu' ? 'WOMEN' : product.gender === 'nam' ? 'MEN' : 'UNISEX'}
          </span>
          <h3 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-2 mt-1 drop-shadow-sm group-hover:text-[#18F4FC] transition-colors">
            {product.name}
          </h3>

          {/* Micro-interaction CTA */}
          <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-white/20">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/90">
              Khám phá thiết kế
            </span>
            <div className="w-7 h-7 rounded-full bg-white/20 group-hover:bg-[#8B5CF6] text-white flex items-center justify-center transition-all duration-300 group-hover:scale-110">
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
