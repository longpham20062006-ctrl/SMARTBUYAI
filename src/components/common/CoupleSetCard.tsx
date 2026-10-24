import React, { useState } from 'react';
import { CoupleSet } from '@/types';
import { getCoupleSetWithProducts } from '@/mocks/coupleSets';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MockRepo } from '@/mocks/repository';
import { useToast } from '@/components/ui/toast';
import { Heart, ShoppingBag, Sparkles, Check, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CoupleSetCardProps {
  coupleSet: CoupleSet;
}

export const CoupleSetCard: React.FC<CoupleSetCardProps> = ({ coupleSet }) => {
  const { success, error } = useToast();
  const detailed = getCoupleSetWithProducts(coupleSet);
  const male = detailed.maleProduct;
  const female = detailed.femaleProduct;

  // Selected state for Person 1 (Chàng / Nam)
  const [maleColor, setMaleColor] = useState<string>(male?.colors[0]?.name || 'Mặc định');
  const [maleSize, setMaleSize] = useState<string>(male?.sizes[0] || 'M');

  // Selected state for Person 2 (Nàng / Nữ)
  const [femaleColor, setFemaleColor] = useState<string>(female?.colors[0]?.name || 'Mặc định');
  const [femaleSize, setFemaleSize] = useState<string>(female?.sizes[0] || 'S');

  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    try {
      const res = MockRepo.addToCart({
        id: `couple_var_${coupleSet.id}_${maleColor}_${maleSize}_${femaleColor}_${femaleSize}`,
        productId: coupleSet.id,
        productSlug: coupleSet.slug,
        productName: coupleSet.name,
        brand: 'SMARTBUY AI COUPLE',
        image: coupleSet.images[0] || male?.images[0] || '',
        color: {
          id: 'combo',
          slug: 'combo',
          name: `${maleColor} (Nam) & ${femaleColor} (Nữ)`,
          hex: '#EC4899',
        },
        size: 'FreeSize',
        price: coupleSet.bundlePrice,
        originalPrice: coupleSet.originalPrice,
        quantity: 1,
      });

      if (res.success) {
        success('Đã thêm set đồ đôi vào giỏ hàng', `${coupleSet.name} - Giá combo: ${formatPrice(coupleSet.bundlePrice)}`);
      } else {
        error('Thông báo', res.message || 'Không thể thêm vào giỏ hàng');
      }
    } finally {
      setTimeout(() => setIsAdding(false), 500);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E4E4E7] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group">
      {/* 1. Hình ảnh kép 2 sản phẩm (Chàng & Nàng) */}
      <div className="relative aspect-4/3 w-full bg-neutral-100 overflow-hidden grid grid-cols-2 gap-0.5">
        <div className="relative h-full overflow-hidden">
          <img
            src={coupleSet.images[0] || male?.images[0] || ''}
            alt={`${coupleSet.name} - Nam`}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider">
            Chàng / Nam
          </div>
        </div>
        <div className="relative h-full overflow-hidden">
          <img
            src={coupleSet.images[1] || female?.images[0] || male?.images[1] || ''}
            alt={`${coupleSet.name} - Nữ`}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-pink-600/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider">
            Nàng / Nữ
          </div>
        </div>

        {/* Badge Set Đôi & Verified */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#18181B] text-white text-[10px] font-extrabold uppercase shadow-sm">
            <Heart className="w-3 h-3 text-pink-400 fill-pink-400" />
            ĐỒ ĐÔI GEN Z
          </span>
          {coupleSet.verified && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-sm" title="Admin đã xác minh set">
              <CheckCircle2 className="w-3 h-3" />
              Đã duyệt
            </span>
          )}
        </div>

        {!!coupleSet.discountPercent && coupleSet.discountPercent > 0 && (
          <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-black shadow-sm">
            -{coupleSet.discountPercent}%
          </div>
        )}
      </div>

      {/* 2. Thông tin Set & Giá Combo */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#18181B] line-clamp-2 group-hover:text-pink-600 transition-colors leading-snug">
            {coupleSet.name}
          </h3>
          <p className="text-xs text-[#71717A] mt-1 line-clamp-2">
            {coupleSet.description}
          </p>

          <div className="flex items-baseline gap-2 mt-2.5">
            <span className="text-lg font-black text-pink-600">
              {formatPrice(coupleSet.bundlePrice)}
            </span>
            {coupleSet.originalPrice > coupleSet.bundlePrice && (
              <span className="text-xs text-[#A1A1AA] line-through">
                {formatPrice(coupleSet.originalPrice)}
              </span>
            )}
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Trọn bộ 2 món
            </span>
          </div>
        </div>

        {/* 3. Tùy chọn độc lập cho 2 người */}
        <div className="space-y-3 pt-2 border-t border-[#F4F4F5] text-xs">
          {/* Người thứ nhất: Chàng */}
          <div className="bg-[#F9FAFB] p-2.5 rounded-xl border border-[#E5E7EB] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#1F2937]">
              <span>👕 Chàng ({male?.name || 'Áo Nam'})</span>
              <span className="text-[#6B7280]">{maleColor} • Size {maleSize}</span>
            </div>
            {male && (
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {male.colors.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setMaleColor(c.name)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                        maleColor === c.name
                          ? 'bg-[#18181B] text-white shadow-xs'
                          : 'bg-white border border-[#D1D5DB] text-[#4B5563] hover:border-black'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  {male.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setMaleSize(s)}
                      className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all ${
                        maleSize === s
                          ? 'bg-black text-white'
                          : 'bg-white border border-[#D1D5DB] text-[#374151]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Người thứ hai: Nàng */}
          <div className="bg-pink-50/50 p-2.5 rounded-xl border border-pink-200 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-pink-900">
              <span>👚 Nàng ({female?.name || 'Áo Nữ'})</span>
              <span className="text-pink-700">{femaleColor} • Size {femaleSize}</span>
            </div>
            {female && (
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {female.colors.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFemaleColor(c.name)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                        femaleColor === c.name
                          ? 'bg-pink-600 text-white shadow-xs'
                          : 'bg-white border border-pink-300 text-pink-800 hover:border-pink-500'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  {female.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFemaleSize(s)}
                      className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all ${
                        femaleSize === s
                          ? 'bg-pink-600 text-white'
                          : 'bg-white border border-pink-300 text-pink-800'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Thao tác đặt hàng / Thử đồ AI */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="flex-1 bg-[#18181B] hover:bg-black text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isAdding ? 'Đang thêm...' : 'Thêm trọn bộ vào giỏ'}</span>
          </Button>

          <Link
            to={`/try-on?couple=${coupleSet.id}`}
            className="px-3 py-2 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-700 font-bold text-xs flex items-center gap-1 transition-colors"
            title="Thử đồ ảo AI cho chàng và nàng"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-600" />
            <span>Thử đồ AI</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
