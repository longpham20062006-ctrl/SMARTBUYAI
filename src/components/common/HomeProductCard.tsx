import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/types';
import { Lock, X, ArrowRight, Flame, Sparkles } from 'lucide-react';
import { getValidProductImages, isProductEligibleForPublicDisplay } from '@/lib/imageValidator';
import { MockRepo } from '@/mocks/repository';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import { useToast } from '@/components/ui/toast';

interface HomeProductCardProps {
  product: Product;
  badgeLabel?: string;
}

/**
 * SMARTBUY AI — HOMEPAGE PRODUCT CARD (MASTER PROMPT V19)
 * Thiết kế chuyên biệt cho Trang Chủ:
 * - Tập trung vào hình ảnh thời trang cao cấp tỷ lệ chuẩn 3:4
 * - TUYỆT ĐỐI KHÔNG HIỂN THỊ GIÁ BÁN, GIÁ GỐC, KHUYẾN MÃI, SIZE HAY MÀU (Cả Guest và Customer trên Home)
 * - Nút "Xem chi tiết" nổi bật, dễ thao tác trên cả desktop và mobile
 * - Customer bấm -> Mở đúng trang Product Detail trong Shop (/products/:slug)
 * - Guest bấm -> Mở Modal mời đăng nhập, sau khi đăng nhập + Intro 3D mở đúng Product Detail
 */
export const HomeProductCard: React.FC<HomeProductCardProps> = ({
  product,
  badgeLabel,
}) => {
  useRepoSubscription(['auth']);
  const navigate = useNavigate();
  const currentUser = MockRepo.getCurrentUser();
  const isGuest = !currentUser;

  const { toast } = useToast();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!product || !isProductEligibleForPublicDisplay(product)) return null;

  const images = getValidProductImages(product);
  if (images.length === 0) return null;

  const displayImage = images[0] || '';

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isGuest) {
      toast('Vui lòng đăng nhập để tiếp tục mua sắm.', 'Chuyển sang trang đăng nhập...', 'info');
      navigate(`/login?redirect=${encodeURIComponent('/products/' + product.slug)}`);
    } else {
      // Customer hoặc Admin: Điều hướng sang trang Product Detail trong Shopping Area
      navigate(`/products/${product.slug}`);
    }
  };

  const handleGoToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLoginModal(false);
    navigate(`/login?redirect=${encodeURIComponent('/products/' + product.slug)}`);
  };

  // Xác định badge hiển thị
  const effectiveBadge = badgeLabel || (
    product.isSetItem || product.categorySlug === 'do-bo'
      ? 'SET NGUYÊN BỘ'
      : product.badge === 'HOT' || product.isFeatured
        ? 'HOT'
        : product.badge === 'DROP' || product.isNewArrival
          ? 'NEW DROP'
          : null
  );

  return (
    <>
      <div
        data-testid="home-product-card"
        onClick={handleCardClick}
        className="group flex flex-col h-full bg-white rounded-2xl sm:rounded-3xl border border-[#E4E4E7] hover:border-[#8B5CF6]/50 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer relative select-none transform-gpu hover:-translate-y-1"
      >
        {/* Container ảnh chuẩn tỷ lệ 3:4 */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F2F3F5]">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-[#F2F3F5] animate-pulse" />
          )}

          <img
            src={displayImage}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImgError(true);
              setImageLoaded(true);
            }}
            className={`w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-106 ${
              imageLoaded ? 'opacity-100' : 'opacity-85'
            }`}
          />

          {/* Badge nổi bật góc trên bên trái */}
          {effectiveBadge && (
            <div className="absolute top-3 left-3 pointer-events-none z-10">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-sm ${
                  effectiveBadge === 'HOT'
                    ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white'
                    : effectiveBadge === 'SET NGUYÊN BỘ'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white'
                      : 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white'
                }`}
              >
                {effectiveBadge === 'HOT' && <Flame className="w-3 h-3 text-amber-300" />}
                {effectiveBadge === 'NEW DROP' && <Sparkles className="w-3 h-3 text-cyan-300" />}
                <span>{effectiveBadge}</span>
              </span>
            </div>
          )}

          {/* Subtle gradient vignette at bottom of image */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Card Body — TUYỆT ĐỐI KHÔNG HIỂN THỊ GIÁ THEO MASTER PROMPT V19 */}
        <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3 bg-white">
          <div className="space-y-1 text-left">
            {/* Brand label */}
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#8B5CF6]">
              {product.brand || 'SMARTBUY AI'}
            </span>

            {/* Product Title (2 dòng) */}
            <h3
              className="text-xs sm:text-sm font-bold text-[#18181B] group-hover:text-[#8B5CF6] transition-colors line-clamp-2 leading-snug min-h-[2.5rem]"
              title={product.name}
            >
              {product.name}
            </h3>
          </div>

          {/* Action Row: Nút "Xem chi tiết" nổi bật, dễ thao tác trên mobile */}
          <div className="pt-2 border-t border-[#F2F3F5] flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#71717A] hidden sm:inline">
              Chi tiết thiết kế
            </span>

            <button
              type="button"
              onClick={handleCardClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl bg-[#18181B] group-hover:bg-[#8B5CF6] active:scale-95 text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs"
              aria-label={`Xem chi tiết sản phẩm ${product.name}`}
            >
              <span>Xem chi tiết</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL MỜI ĐĂNG NHẬP CHO GUEST KHI BẤM "XEM CHI TIẾT" TẠI HOMEPAGE */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E4E4E7] text-center relative select-none animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F2F3F5] hover:bg-[#E4E4E7] text-[#71717A] hover:text-[#18181B] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center mx-auto mb-3 border border-[#8B5CF6]/20">
              <Lock className="w-6 h-6" />
            </div>

            <div className="aspect-[3/4] max-w-[120px] mx-auto rounded-xl overflow-hidden bg-[#F2F3F5] mb-3 shadow-xs border border-[#E4E4E7]">
              <img src={displayImage} alt={product.name} className="w-full h-full object-cover" />
            </div>

            <h3 className="text-xs sm:text-sm font-bold text-[#18181B] line-clamp-1 mb-1.5 px-2">
              {product.name}
            </h3>

            <p className="text-xs text-[#71717A] mb-5 leading-relaxed px-2">
              Đăng nhập để xem chi tiết sản phẩm và bắt đầu mua sắm cùng SMARTBUY AI.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoToLogin}
                className="w-full py-3 px-4 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-98 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                Đăng nhập ngay
              </button>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F2F3F5] hover:bg-[#E4E4E7] text-[#18181B] font-semibold text-xs transition-colors cursor-pointer"
              >
                Tiếp tục xem trang chủ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

