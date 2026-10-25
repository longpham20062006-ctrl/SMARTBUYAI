import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productService, ShopTheLookOutfit } from '@/services/productService';
import { MockRepo } from '@/mocks/repository';
import { ProductCard } from '@/components/common/ProductCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { GENZ_CATEGORIES } from '@/mocks/genzCategories';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import {
  Sparkles,
  ArrowRight,
  Flame,
  Zap,
  Tag,
  Glasses,
  Sun,
  Snowflake,
  Plus,
} from 'lucide-react';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';

export const HomePage: React.FC = () => {
  useRepoSubscription(['products']);
  const navigate = useNavigate();
  const { success } = useToast();
  const [stylistPrompt, setStylistPrompt] = useState('');
  const [selectedLookId, setSelectedLookId] = useState<string>('look-1');

  // Products subsets according to Section 3 specifications
  const summerProducts = productService.getSummerCollection(8);
  const winterProducts = productService.getWinterCollection(8);
  const newDrops = productService.getNewArrivals(8);
  const bestSellers = productService.getBestSellers(8);
  const accessoryDrops = productService.getAccessories(8);
  const shopTheLooks = productService.getShopTheLookOutfits();

  const activeLook = shopTheLooks.find((l) => l.id === selectedLookId) || shopTheLooks[0];

  const handleOpenQuickView = (product: Product, initialImageIndex: number = 0) => {
    window.dispatchEvent(new CustomEvent('open_quick_view', { detail: { product, initialImageIndex } }));
  };

  const handleToggleCompare = (product: Product) => {
    window.dispatchEvent(new CustomEvent('toggle_compare', { detail: product }));
  };

  const handleStylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stylistPrompt.trim()) {
      navigate(`/ai-stylist?prompt=${encodeURIComponent(stylistPrompt.trim())}`);
    } else {
      navigate('/ai-stylist');
    }
  };

  // PHẦN 11: THÊM CẢ BỘ VÀO GIỎ HÀNG (ADD COMPLETE LOOK TO CART)
  const handleAddOutfitToCart = (outfit?: ShopTheLookOutfit) => {
    if (!outfit || !Array.isArray(outfit.items)) return;
    let addedCount = 0;
    outfit.items.forEach((item) => {
      if (!item) return;
      const variantsList = Array.isArray(item.variants) ? item.variants : [];
      const variant = variantsList.find((v) => v.stock > 0) || variantsList[0];
      if (variant) {
        MockRepo.addToCart({
          id: variant.id,
          productId: item.id,
          productSlug: item.slug,
          productName: item.name,
          brand: item.brand,
          image: variant.image || item.images?.[0] || '',
          color: variant.color || { name: 'Mặc định', hex: '#111111', slug: 'mac-dinh' },
          size: variant.size || 'FreeSize',
          price: variant.price || item.price || 0,
          originalPrice: variant.originalPrice || item.originalPrice || 0,
          quantity: 1,
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      window.dispatchEvent(new CustomEvent('cart_updated'));
      success(
        'Đã thêm trọn bộ outfit vào giỏ hàng!',
        `Đã thêm ${addedCount} món đồ trong set "${outfit.title}" với tổng giá ưu đãi.`
      );
    }
  };

  return (
    <div className="bg-[#FAFAF8] space-y-16 sm:space-y-24">
      {/* 3. HERO BANNER LỚN (PREMIUM STREETWEAR × GEN Z) */}
      <section className="relative overflow-hidden bg-[#FAFAF8] border-b border-[#E4E4E7] pt-4 pb-12 lg:pt-8 lg:pb-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Cột chữ (6 cột) */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3E8FF] text-[#7C3AED] text-xs font-semibold tracking-wider uppercase border border-[#DDD6FE]">
                <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>ALL SEASONS DROP 2026 // STREETWEAR</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#18181B] leading-[1.08] uppercase font-sans">
                  MẶC CHẤT THEO <br />
                  <span className="text-white bg-[#8B5CF6] px-2.5 py-0.5 inline-block rounded-md">CÁCH RIÊNG.</span>
                </h1>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-[#71717A]">
                  YOUR FIT. YOUR RULES. BỐN MÙA THỜI TRANG GEN Z.
                </p>
              </div>

              <p className="text-sm sm:text-base text-[#71717A] leading-relaxed max-w-lg font-sans">
                Nền tảng thương mại điện tử thời trang Streetwear & Y2K đủ 4 mùa cho học sinh, sinh viên. Áo thun graphic, hoodie nỉ bông, jeans baggy và phụ kiện bạc titan phối cực chuẩn — giá chỉ từ <strong className="text-[#18181B]">79.000₫</strong>.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link to="/products">
                  <Button
                    variant="accent"
                    size="lg"
                    className="w-full sm:w-auto text-xs uppercase tracking-wider font-bold"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    SĂN DROPS MỚI NGAY
                  </Button>
                </Link>

                <Link to="/ai-stylist">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto text-xs uppercase tracking-wider font-semibold"
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-[#8B5CF6]" />
                    AI PHỐI OUTFIT GEN Z
                  </Button>
                </Link>
              </div>

              {/* Thông số cam kết */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#E4E4E7] text-xs font-sans">
                <div>
                  <div className="font-extrabold text-[#18181B] text-xl">130+</div>
                  <div className="text-[11px] text-[#71717A] uppercase mt-0.5">Mẫu 4 mùa sẵn sàng</div>
                </div>
                <div>
                  <div className="font-extrabold text-[#18181B] text-xl">79K+</div>
                  <div className="text-[11px] text-[#71717A] uppercase mt-0.5">Giá sinh viên</div>
                </div>
                <div>
                  <div className="font-extrabold text-[#18181B] text-xl">15 NGÀY</div>
                  <div className="text-[11px] text-[#71717A] uppercase mt-0.5">Đổi size tận nơi</div>
                </div>
              </div>
            </div>

            {/* Cột ảnh Campaign Streetwear (6 cột) */}
            <div className="lg:col-span-6 relative">
              <div className="grid grid-cols-12 gap-3 sm:gap-4 items-center">
                {/* Ảnh chính lớn 3:4 */}
                <div className="col-span-7 aspect-[3/4] rounded-2xl overflow-hidden shadow-card border border-[#E4E4E7] relative group bg-[#F2F3F5]">
                  <img
                    src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1000&auto=format&fit=crop&q=85"
                    alt="SMARTBUY AI Streetwear Campaign"
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-[#18181B] text-white text-[10px] font-bold px-2.5 py-1 rounded-sm shadow-subtle">
                    DROP #01 — STREET KING
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-[#E4E4E7] shadow-card">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#18181B]">Oversized Acid Tee</span>
                      <span className="text-xs font-bold text-[#7C3AED] bg-[#F3E8FF] px-2 py-0.5 rounded">189.000₫</span>
                    </div>
                  </div>
                </div>

                {/* 2 ảnh phụ xếp bên cạnh */}
                <div className="col-span-5 space-y-3 sm:space-y-4">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-card border border-[#E4E4E7] relative group bg-[#F2F3F5]">
                    <img
                      src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80"
                      alt="SMARTBUY Y2K Girl Fit"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 bg-[#8B5CF6] text-white text-[9px] font-bold px-2 py-0.5 rounded-sm">
                      Y2K BABY TEE
                    </div>
                  </div>

                  <div className="p-4 bg-white text-[#18181B] rounded-2xl border border-[#E4E4E7] shadow-subtle text-left">
                    <div className="flex items-center gap-1.5 text-[#8B5CF6] text-xs font-bold">
                      <Flame className="w-3.5 h-3.5 text-[#8B5CF6]" />
                      <span>HEAVYWEIGHT 250GSM</span>
                    </div>
                    <p className="text-[11px] text-[#71717A] mt-1 leading-relaxed">
                      100% Cotton 2 chiều định lượng dày dặn đứng phom, bo cổ dệt tổ ong không dão.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE RUNNING TICKER */}
      <div className="bg-[#18181B] text-[#D4D4D8] py-2.5 border-y border-[#27272A] overflow-hidden whitespace-nowrap text-xs font-medium tracking-wider uppercase">
        <div className="inline-block animate-marquee">
          <span className="text-[#8B5CF6] font-bold">ALL SEASONS GEN Z DROPS</span> • FREESHIP ĐƠN TỪ 299K • 100% HEAVY COTTON 250GSM • OUTFIT STREETWEAR BỐN MÙA • ĐỔI SIZE 15 NGÀY TẬN NƠI • GIÁ SINH VIÊN TỪ 79K • AI STYLIST TƯ VẤN PHỐI ĐỒ MIỄN PHÍ •&nbsp;
        </div>
        <div className="inline-block animate-marquee" aria-hidden="true">
          <span className="text-[#8B5CF6] font-bold">ALL SEASONS GEN Z DROPS</span> • FREESHIP ĐƠN TỪ 299K • 100% HEAVY COTTON 250GSM • OUTFIT STREETWEAR BỐN MÙA • ĐỔI SIZE 15 NGÀY TẬN NƠI • GIÁ SINH VIÊN TỪ 79K • AI STYLIST TƯ VẤN PHỐI ĐỒ MIỄN PHÍ •&nbsp;
        </div>
      </div>

      {/* 4. DANH MỤC NỔI BẬT (FEATURED CATEGORIES) */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase text-[#71717A]">
              <Tag className="w-3 h-3 text-[#8B5CF6]" />
              <span>SHOP BY CATEGORY</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#18181B] uppercase mt-1">
              Danh mục thời trang Gen Z
            </h2>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-[#18181B] hover:text-[#8B5CF6] flex items-center gap-1 transition-colors"
          >
            <span>Tất cả 130+ món</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {GENZ_CATEGORIES.slice(0, 8).map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="group flex flex-col items-center text-center p-2.5 rounded-xl bg-white border border-[#E4E4E7] hover:border-[#8B5CF6] hover:shadow-card transition-all duration-300"
            >
              <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-[#F2F3F5] mb-2.5 relative">
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="text-xs font-bold text-[#18181B] group-hover:text-[#8B5CF6] transition-colors truncate w-full">
                {cat.name}
              </h3>
              <span className="text-[10px] text-[#71717A] mt-0.5">{cat.itemCount} món</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. SUMMER COLLECTION (BỘ SƯU TẬP MÙA HÈ) */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#E4E4E7] rounded-3xl p-6 sm:p-8 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-4 border-b border-[#E4E4E7] gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase text-[#D97706] bg-[#FEF3C7] px-2.5 py-0.5 rounded-sm border border-[#FDE68A]">
                <Sun className="w-3.5 h-3.5 text-[#D97706]" />
                <span>SUMMER COLLECTION 2026</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#18181B] uppercase mt-2">
                Bộ sưu tập mùa hè năng động
              </h2>
              <p className="text-xs text-[#71717A] mt-1">
                Áo thun 100% cotton thoáng khí, baby tee, croptop, sơ mi cuban ngắn tay và chân váy đón hè rực rỡ.
              </p>
            </div>
            <Link
              to="/products?category=ao-thun"
              className="text-xs font-bold text-[#8B5CF6] hover:underline"
            >
              Xem toàn bộ đồ mùa hè →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {summerProducts.slice(0, 4).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onQuickView={handleOpenQuickView}
                onToggleCompare={handleToggleCompare}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 6. WINTER COLLECTION (BỘ SƯU TẬP MÙA ĐÔNG) */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#E4E4E7] rounded-3xl p-6 sm:p-8 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-4 border-b border-[#E4E4E7] gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase text-[#2563EB] bg-[#DBEAFE] px-2.5 py-0.5 rounded-sm border border-[#BFDBFE]">
                <Snowflake className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>WINTER COLLECTION 2026</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#18181B] uppercase mt-2">
                Bộ sưu tập mùa đông ấm áp
              </h2>
              <p className="text-xs text-[#71717A] mt-1">
                Hoodie nỉ bông trùm đầu, sweater dệt kim, áo bomber chần bông và varsity jacket giữ ấm cực chất.
              </p>
            </div>
            <Link
              to="/products?category=hoodie-sweater"
              className="text-xs font-bold text-[#8B5CF6] hover:underline"
            >
              Xem toàn bộ đồ mùa đông →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {winterProducts.slice(0, 4).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onQuickView={handleOpenQuickView}
                onToggleCompare={handleToggleCompare}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 7. SẢN PHẨM MỚI (NEW DROPS) */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED] bg-[#F3E8FF] px-2.5 py-0.5 rounded-sm border border-[#DDD6FE]">
              LATEST DROP
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#18181B] uppercase mt-2">
              Sản phẩm mới về (New Drops)
            </h2>
          </div>
          <Link
            to="/products?sort=newest"
            className="text-xs font-bold text-[#18181B] hover:text-[#8B5CF6] flex items-center gap-1 transition-colors"
          >
            <span>Xem trọn bộ New Drops</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {newDrops.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={handleOpenQuickView}
              onToggleCompare={handleToggleCompare}
            />
          ))}
        </div>
      </section>

      {/* 8. SẢN PHẨM BÁN CHẠY (BEST SELLERS) */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#16A34A] bg-[#DCFCE7] px-2.5 py-0.5 rounded-sm border border-[#BBF7D0]">
              TRENDING HOT 🔥
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#18181B] uppercase mt-2">
              Sản phẩm bán chạy nhất (Best Sellers)
            </h2>
          </div>
          <Link
            to="/products?sort=rating-desc"
            className="text-xs font-bold text-[#18181B] hover:text-[#8B5CF6] flex items-center gap-1 transition-colors"
          >
            <span>Xem toàn bộ Best Sellers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {bestSellers.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={handleOpenQuickView}
              onToggleCompare={handleToggleCompare}
            />
          ))}
        </div>
      </section>

      {/* 9. BANNER AI STYLIST (TƯ VẤN PHỐI ĐỒ THEO NGÂN SÁCH SINH VIÊN) */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#18181B] text-white p-6 sm:p-10 lg:p-14 relative overflow-hidden shadow-elevated border border-[#27272A]">
          {/* Subtle violet ambient glow */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-[#8B5CF6]/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 rounded-full bg-[#7C3AED]/10 blur-3xl pointer-events-none" />

          <div className="max-w-2xl relative z-10 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#DDD6FE] text-xs font-semibold uppercase border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>AI OUTFIT COORDINATOR</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black leading-tight text-white uppercase">
                Bạn có bao nhiêu ngân sách? Để SMARTBUY AI phối trọn set đồ!
              </h2>
              <p className="text-xs sm:text-sm text-[#D4D4D8] leading-relaxed font-sans">
                Nhập ngân sách (ví dụ: 400K) và phong cách bạn thích (Streetwear, Y2K, Đi học, Đi cafe). AI Stylist sẽ tự động chọn Áo + Quần + Phụ kiện trong kho hàng thật khớp với ngân sách của bạn!
              </p>
            </div>

            {/* Ô nhập tương tác thật */}
            <form onSubmit={handleStylistSubmit} className="pt-2">
              <div className="flex flex-col sm:flex-row gap-2 bg-white p-1.5 rounded-xl shadow-card border border-white focus-within:border-[#8B5CF6]">
                <input
                  type="text"
                  value={stylistPrompt}
                  onChange={(e) => setStylistPrompt(e.target.value)}
                  placeholder="Ví dụ: Tôi có 400.000đ, muốn phối đồ streetwear nam đi chơi..."
                  className="flex-1 px-4 py-3 text-xs sm:text-sm text-[#18181B] bg-transparent focus:outline-none placeholder:text-[#A1A1AA]"
                />
                <Button
                  type="submit"
                  variant="accent"
                  className="h-12 px-6 text-xs uppercase tracking-wider font-bold"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  PHỐI SET NGAY
                </Button>
              </div>
            </form>

            {/* Gợi ý prompt mẫu */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#D4D4D8] pt-1 font-sans">
              <span className="text-[#DDD6FE] font-bold">Thử nhanh:</span>
              {[
                'Tôi có 400.000đ, muốn phối đồ streetwear nam đi chơi',
                'Phối set Y2K nữ xinh xắn dưới 350.000đ',
                'Outfit Korean Casual đi học thanh lịch 500k',
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setStylistPrompt(sample)}
                  className="bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20 hover:text-white transition-colors cursor-pointer text-[11px]"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 10. PHỤ KIỆN THỜI TRANG GEN Z */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase text-[#18181B] bg-[#F2F3F5] px-2.5 py-0.5 rounded-sm border border-[#E4E4E7]">
              <Glasses className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>ACCESSORIES & DETAILS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#18181B] uppercase mt-2">
              Phụ kiện thời trang Gen Z
            </h2>
            <p className="text-xs text-[#71717A] mt-0.5">
              Dây chuyền titan bạc, nhẫn phong cách, túi tote canvas, mũ beanie và kính râm Y2K (100% FreeSize).
            </p>
          </div>
          <Link
            to="/products?category=phu-kien"
            className="text-xs font-bold text-[#8B5CF6] hover:underline"
          >
            Khám phá 25+ mẫu phụ kiện →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {accessoryDrops.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={handleOpenQuickView}
              onToggleCompare={handleToggleCompare}
            />
          ))}
        </div>
      </section>

      {/* 11. SHOP THE LOOK (PHỐI CẢ BỘ TRANG PHỤC HOÀN CHỈNH) */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#E4E4E7] rounded-3xl p-6 sm:p-10 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#E4E4E7] gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED] bg-[#F3E8FF] px-2.5 py-0.5 rounded-sm border border-[#DDD6FE]">
                CURATED OUTFITS
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#18181B] uppercase mt-2">
                Shop The Look — Phối Cả Bộ Hoàn Chỉnh
              </h2>
              <p className="text-xs sm:text-sm text-[#71717A] mt-1">
                Gợi ý outfit đồng bộ từ Áo + Quần + Phụ kiện chuẩn gu Streetwear. Mua trọn bộ để nhận ưu đãi!
              </p>
            </div>

            {/* Look Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {shopTheLooks.map((look) => (
                <button
                  key={look.id}
                  onClick={() => setSelectedLookId(look.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedLookId === look.id
                      ? 'bg-[#18181B] text-white shadow-subtle'
                      : 'bg-[#F4F4F5] text-[#71717A] hover:text-[#18181B]'
                  }`}
                >
                  {look.title}
                </button>
              ))}
            </div>
          </div>

          {/* Active Look Content Grid */}
          {activeLook && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Big Look Image (5 cols) */}
              <div className="lg:col-span-5 relative rounded-2xl overflow-hidden aspect-[3/4] shadow-card bg-[#F2F3F5] group">
                <img
                  src={activeLook.lookImage}
                  alt={activeLook.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#8B5CF6] px-2 py-0.5 rounded">
                    {activeLook.style}
                  </span>
                  <h3 className="text-xl font-black uppercase mt-1.5">{activeLook.title}</h3>
                  <p className="text-xs text-[#E4E4E7] mt-0.5 line-clamp-2">{activeLook.tagline}</p>
                </div>
              </div>

              {/* Outfit Items List & Total Action (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                    Các món đồ trong set ({Array.isArray(activeLook.items) ? activeLook.items.length : 0} món):
                  </h4>
                  <div className="space-y-3">
                    {(activeLook.items || []).map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-[#FAFAF8] border border-[#E4E4E7] flex items-center justify-between gap-4 hover:border-[#8B5CF6] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.images?.[0] || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80'}
                            alt={item.name}
                            className="w-14 h-16 object-cover rounded-xl bg-white border border-[#E4E4E7] shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-[#8B5CF6] uppercase">
                              Món 0{idx + 1} • {item.brand}
                            </span>
                            <h5 className="text-xs font-bold text-[#18181B] truncate">{item.name}</h5>
                            <div className="text-xs font-bold text-[#18181B] mt-0.5">
                              {formatPrice(item.price)}
                            </div>
                          </div>
                        </div>

                        <Link
                          to={`/products/${item.slug}`}
                          className="px-3 py-1.5 rounded-lg border border-[#E4E4E7] text-xs font-semibold text-[#18181B] hover:bg-[#18181B] hover:text-white transition-colors shrink-0"
                        >
                          Chi tiết
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Outfit Price & Add Set to Cart Button */}
                <div className="p-5 rounded-2xl bg-[#F4F4F5] border border-[#E4E4E7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-[#71717A]">
                      Tổng giá trọn bộ ({Array.isArray(activeLook.items) ? activeLook.items.length : 0} món):
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl font-black text-[#18181B]">
                        {formatPrice(
                          (activeLook.items || []).reduce((sum, item) => sum + (item.price || 0), 0) *
                            (1 - (activeLook.discountPercent || 0) / 100)
                        )}
                      </span>
                      {activeLook.discountPercent && (
                        <span className="text-xs line-through text-[#71717A]">
                          {formatPrice((activeLook.items || []).reduce((sum, item) => sum + (item.price || 0), 0))}
                        </span>
                      )}
                    </div>
                    {activeLook.discountPercent && (
                      <span className="text-[11px] font-bold text-[#16A34A]">
                        Tiết kiệm {activeLook.discountPercent}% khi mua cả bộ outfit
                      </span>
                    )}
                  </div>

                  <Button
                    variant="accent"
                    size="lg"
                    onClick={() => handleAddOutfitToCart(activeLook)}
                    className="text-xs uppercase font-bold tracking-wider py-3.5 px-6 shadow-accent"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    THÊM CẢ BỘ VÀO GIỎ HÀNG
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER CALL-TO-ACTION & SIZE GUIDE */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="p-6 sm:p-8 rounded-2xl bg-[#F2F3F5] border border-[#E4E4E7] grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-1.5 md:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#71717A]">
              GEN Z STREETWEAR EXPERIENCE
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#18181B] uppercase">
              Bảng số đo phom rộng chuẩn vóc dáng Việt
            </h3>
            <p className="text-xs text-[#71717A] max-w-xl leading-relaxed">
              Mọi sản phẩm từ Boxy Fit đến Oversized đều có thông số dài áo, ngang ngực và gợi ý chiều cao cân nặng chuẩn xác.
            </p>
          </div>
          <div className="flex md:justify-end">
            <Link to="/size-guide">
              <Button variant="primary" className="h-11 px-6 text-xs uppercase tracking-wider font-bold">
                Xem Bảng Size Chuẩn
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
