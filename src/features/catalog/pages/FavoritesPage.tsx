import React from 'react';
import { Link } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { productService } from '@/services/productService';
import { ProductCard } from '@/components/common/ProductCard';
import { BackButton } from '@/components/common/BackButton';
import { Button } from '@/components/ui/button';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import { useToast } from '@/components/ui/toast';
import { Heart, ShoppingBag, Sparkles, Trash2, ArrowRight } from 'lucide-react';

export const FavoritesPage: React.FC = () => {
  useRepoSubscription(['wishlist', 'products', 'auth']);
  const { info } = useToast();

  const currentUser = MockRepo.getCurrentUser();
  const wishlistIds = MockRepo.getWishlist();
  const allProducts = productService.getAll();

  const favoriteProducts = allProducts.filter((p) => wishlistIds.includes(p.id));

  const handleClearAll = () => {
    if (confirm('Bạn có chắc muốn xóa tất cả sản phẩm khỏi danh sách yêu thích?')) {
      wishlistIds.forEach((id) => {
        MockRepo.toggleWishlist(id);
      });
      info('Đã làm trống danh sách yêu thích');
    }
  };

  return (
    <div className="bg-[#FAFAF8] min-h-screen py-8 sm:py-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Row with Back Button & Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <BackButton to="/shop" label="Quay lại Shop" />

          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#71717A]">
            <Link to="/" className="hover:text-[#8B5CF6] transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-[#8B5CF6] transition-colors">
              Shop
            </Link>
            <span>/</span>
            <span className="text-[#8B5CF6] font-bold">Yêu thích</span>
          </nav>
        </div>

        {/* Page Title & Subtitle */}
        <div className="bg-white rounded-3xl border border-[#E4E4E7] p-6 sm:p-8 mb-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] sm:text-xs font-bold uppercase mb-2 border border-rose-200">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                <span>DANH SÁCH YÊU THÍCH // WISHLIST</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#18181B] uppercase tracking-tight">
                Sản phẩm bạn đã lưu ({favoriteProducts.length})
              </h1>
              <p className="text-xs sm:text-sm text-[#71717A] mt-1">
                Lưu lại những thiết kế ưng ý để dễ dàng tham khảo, so sánh và thử đồ AI trước khi đặt mua.
                {currentUser ? ` (Đang đăng nhập: ${currentUser.name})` : ''}
              </p>
            </div>

            {favoriteProducts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 rounded-xl flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa tất cả</span>
              </Button>
            )}
          </div>
        </div>

        {/* Danh sách sản phẩm yêu thích HOẶC Trạng thái rỗng */}
        {favoriteProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E4E4E7] p-12 sm:p-16 text-center max-w-xl mx-auto shadow-xs">
            <div className="w-20 h-20 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-5 text-rose-500">
              <Heart className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#18181B] uppercase">
              Chưa có sản phẩm yêu thích nào
            </h2>
            <p className="text-xs sm:text-sm text-[#71717A] mt-2 mb-6 leading-relaxed">
              Bạn chưa thả tim sản phẩm nào. Hãy khám phá bộ sưu tập thời trang Gen Z phong phú của SMARTBUY AI và nhấn biểu tượng trái tim để lưu lại nhé!
            </p>
            <Link to="/shop">
              <Button
                variant="accent"
                size="lg"
                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs uppercase font-extrabold tracking-wider py-4 px-8 rounded-xl shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Khám phá sản phẩm ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {favoriteProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default FavoritesPage;

