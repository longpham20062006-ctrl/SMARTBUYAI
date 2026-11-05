import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '@/services/productService';
import { MockRepo } from '@/mocks/repository';
import { HomeProductCard } from '@/components/common/HomeProductCard';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import {
  Sparkles,
  ArrowRight,
  Flame,
  Zap,
  Layers,
  Heart,
  Cpu,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import { GalaxyDebugPanel } from '@/components/effects/GalaxyDebugPanel';
import { ScrollReveal } from '@/components/effects/ScrollReveal';
import { safeSessionStorage } from '@/lib/storage';
import { HeroFashionGallery } from '@/components/home/HeroFashionGallery';
import { usePerformance } from '@/context/PerformanceContext';
import { resetGlobalScroll } from '@/components/common/ScrollToTop';
import { useToast } from '@/components/ui/toast';
import { isProductEligibleForPublicDisplay } from '@/lib/imageValidator';

// Lazy-load Three.js ambient effect in Hero section
const AmbientGalaxy = React.lazy(() =>
  import('@/components/effects/AmbientGalaxy').then((m) => ({ default: m.AmbientGalaxy }))
);

// 4 ẢNH THỜI TRANG TRANG CHỦ CHÍNH XÁC TỪ THƯ MỤC public/images/anh_trangchu/
const HOME_IMAGES = {
  // ẢNH 1: Ảnh nam ngoài đường, trang phục tối màu, phong cách streetwear
  heroStreetwear: '/images/anh_trangchu/0fb1b05f-e815-4159-8fe5-abe2c079b9e1.png',
  // ẢNH 2: Ảnh nam đứng ngoài đường, mặc áo tối màu, phối cùng quần sáng màu
  menStreetwear: '/images/anh_trangchu/3b35766f-f734-4c5a-9990-3223433700dd.png',
  // ẢNH 3: Ảnh nữ chụp ngoài trời, trang phục nữ tính
  womenOutdoor: '/images/anh_trangchu/421e2c20-a146-443d-b809-4ab18442b461.png',
  // ẢNH 4: Ảnh nữ mặc váy trắng, chụp trong không gian trong nhà
  womenLookbook: '/images/anh_trangchu/68818615-3bdd-4a63-bf3f-cc3bb5bde4aa.png',
};

export const HomePage: React.FC = () => {
  useRepoSubscription(['products', 'auth']);
  const navigate = useNavigate();
  const { isSaver } = usePerformance();
  const currentUser = MockRepo.getCurrentUser();
  const { toast } = useToast();

  const handleProtectedAction = (targetPath: string) => {
    if (!currentUser) {
      safeSessionStorage.setItem(
        'sb_login_notice',
        'Đăng nhập để khám phá cửa hàng và trải nghiệm mua sắm cùng SMARTBUY AI nhé!'
      );
      toast(
        'Đăng nhập để khám phá cửa hàng và trải nghiệm mua sắm cùng SMARTBUY AI nhé!',
        'Trải nghiệm mua sắm cùng SMARTBUY AI',
        'info'
      );
      navigate(`/login?redirect=${encodeURIComponent(targetPath)}`);
    } else {
      resetGlobalScroll();
      navigate(targetPath);
    }
  };

  // Trang chủ công khai: Luôn hiển thị cho khách và người dùng
  useEffect(() => {
    safeSessionStorage.removeItem('sb_logging_out');
    // Nếu phiên đăng nhập có yêu cầu chạy Intro 3D và chưa xem, chuyển ngay đến /intro
    const shouldPlay = safeSessionStorage.getItem('sb_intro_active') === '1';
    const isSeen = safeSessionStorage.getItem('sb_intro_seen') === '1';
    const user = MockRepo.getCurrentUser();
    if (shouldPlay && !isSeen && user?.role === 'customer') {
      navigate('/intro', { replace: true });
    }
  }, [navigate]);

  const handleReplayIntro = React.useCallback(() => {
    safeSessionStorage.setItem('sb_intro_active', '1');
    safeSessionStorage.removeItem('sb_intro_seen');
    navigate('/intro');
  }, [navigate]);

  // Sản phẩm thật từ Catalog SMARTBUY AI (Lấy đúng 8 sản phẩm HOT đa dạng danh mục cho khu vực nổi bật)
  const hotProducts = productService.getHotProducts(8);

  // 4 NHÓM SẢN PHẨM HOT TƯƠNG ỨNG 4 PHONG CÁCH LOOKBOOK (100% ẢNH THẬT TRÊN ĐĨA)
  // LOOK 01: Nam Streetwear / Graphic Hoodie / Oversized Graphic Tee / Quần Cargo Túi Hộp / Bomber
  const look1Products = useMemo(() => {
    const ids = ['HOODIE-001', 'TEE-002', 'PANTS-003', 'JACKET-002'];
    const found = ids.map((id) => productService.getById(id)).filter(Boolean) as Product[];
    if (found.length >= 4) return found.slice(0, 4);

    const all = MockRepo.getProducts().filter(
      (p) => p.gender === 'nam' && (p.categorySlug === 'ao-hoodie' || p.categorySlug === 'ao-khoac' || p.categorySlug === 'ao-thun' || p.categorySlug === 'quan-dai') && isProductEligibleForPublicDisplay(p)
    );
    const combined = [...found, ...all];
    const uniqueMap = new Map<string, Product>();
    combined.forEach((p) => uniqueMap.set(p.id, p));
    return Array.from(uniqueMap.values()).slice(0, 4);
  }, []);

  // LOOK 02: Nam Casual / Urban Minimalist Shirt & Polo / Quần Dài Tuyết Mưa
  const look2Products = useMemo(() => {
    const ids = ['SHIRT-001', 'POLO-001', 'PANTS-001', 'SHIRT-003'];
    const found = ids.map((id) => productService.getById(id)).filter(Boolean) as Product[];
    if (found.length >= 4) return found.slice(0, 4);

    const all = MockRepo.getProducts().filter(
      (p) => p.gender === 'nam' && (p.categorySlug === 'ao-so-mi' || p.categorySlug === 'ao-polo' || p.categorySlug === 'quan-dai') && isProductEligibleForPublicDisplay(p)
    );
    const combined = [...found, ...all];
    const uniqueMap = new Map<string, Product>();
    combined.forEach((p) => uniqueMap.set(p.id, p));
    return Array.from(uniqueMap.values()).slice(0, 4);
  }, []);

  // LOOK 03: Nữ Outdoor Chic / Váy Xòe / Váy Chữ A / Váy Aesthetic Gen Z / Váy Cổ Vuông Tiểu Thư
  const look3Products = useMemo(() => {
    const ids = ['W-DRESS-001', 'W-DRESS-026', 'W-DRESS-012', 'W-DRESS-002'];
    const found = ids.map((id) => productService.getById(id)).filter(Boolean) as Product[];
    if (found.length >= 4) return found.slice(0, 4);

    const all = MockRepo.getProducts().filter(
      (p) => p.gender === 'nu' && (p.categorySlug === 'vay' || p.categorySlug === 'dam') && isProductEligibleForPublicDisplay(p)
    );
    const chicDresses = all.filter((p) => !p.id.includes('GOTHIC'));
    const combined = [...found, ...chicDresses, ...all];
    const uniqueMap = new Map<string, Product>();
    combined.forEach((p) => uniqueMap.set(p.id, p));
    return Array.from(uniqueMap.values()).slice(0, 4);
  }, []);

  // LOOK 04: Nữ Editorial Luxury, Đầm Dạ Hội & Váy Corset Cao Cấp & Phụ Kiện Nữ Dự Tiệc
  const look4Products = useMemo(() => {
    const ids = [
      'W-DRESS-GOTHIC-005',
      'W-DRESS-GOTHIC-001',
      'W-DRESS-GOTHIC-007',
      'ACC-027',
    ];
    const found = ids.map((id) => productService.getById(id)).filter(Boolean) as Product[];
    if (found.length >= 4) return found.slice(0, 4);

    // Fallback thông minh: Lấy các mẫu đầm dạ hội/váy corset cao cấp và phụ kiện nữ dự tiệc có ảnh thật trên đĩa
    const all = MockRepo.getProducts().filter(
      (p) => isProductEligibleForPublicDisplay(p) && (p.categorySlug === 'vay' || p.categorySlug === 'dam' || p.categorySlug === 'phu-kien')
    );
    const luxuryItems = all.filter((p) => p.id.includes('GOTHIC') || p.id === 'ACC-027' || p.badge === 'LUXURY' || p.isFeatured);
    const combined = [...found, ...luxuryItems, ...all];
    const uniqueMap = new Map<string, Product>();
    combined.forEach((p) => uniqueMap.set(p.id, p));
    return Array.from(uniqueMap.values()).slice(0, 4);
  }, []);

  // 4 KHU VỰC PHONG CÁCH XEN KẼ (Z-PATTERN) THEO CHIỀU DỌC TRANG CHỦ
  const lookSections = useMemo(
    () => [
      {
        id: 'look-1',
        lookNumber: 'LOOK 01',
        badge: 'LOOK 01 // STREETWEAR DROP',
        title: 'STREETWEAR GRAPHIC HOODIE',
        genderTag: 'Nam • Cyber Streetwear',
        desc: 'Phom rộng thoải mái, phong cách đường phố tự do và phóng khoáng kết hợp áo hoodie nỉ bông cyberpunk, áo thun oversize, quần cargo túi hộp và áo khoác bomber cá tính đậm chất Gen Z.',
        image: HOME_IMAGES.heroStreetwear,
        objectPosition: 'object-[center_top]',
        imageSide: 'left' as const, // Trái: Ảnh lớn, Phải: 4 Sản phẩm HOT
        link: '/shop?gender=nam&category=ao',
        products: look1Products,
      },
      {
        id: 'look-2',
        lookNumber: 'LOOK 02',
        badge: 'LOOK 02 // NIGHT CASUAL',
        title: 'URBAN MINIMALIST SHIRT',
        genderTag: 'Nam • Casual & Minimalist',
        desc: 'Tinh thần tối giản đương đại với sơ mi lụa chống nhăn, áo polo dệt kim bo cổ, sơ mi cổ Cuba và quần dài ống suông tuyết mưa thanh lịch cho cả công sở lẫn dạo phố đêm.',
        image: HOME_IMAGES.menStreetwear,
        objectPosition: 'object-center',
        imageSide: 'right' as const, // Trái: 4 Sản phẩm HOT, Phải: Ảnh lớn
        link: '/shop?gender=nam&category=ao-so-mi',
        products: look2Products,
      },
      {
        id: 'look-3',
        lookNumber: 'LOOK 03',
        badge: 'LOOK 03 // OUTDOOR CHIC',
        title: 'OUTDOOR CHIC DRESSES',
        genderTag: 'Nữ • Outdoor Gen Z Chic',
        desc: 'Bộ sưu tập váy đầm outdoor chic tôn dáng ngọt ngào: váy xòe tiểu thư, đầm chữ A kinh điển và váy aesthetic Gen Z nữ tính, giúp phái đẹp tự tin dạo phố và tỏa sáng rạng ngời.',
        image: HOME_IMAGES.womenOutdoor,
        objectPosition: 'object-[center_top]',
        imageSide: 'left' as const, // Trái: Ảnh lớn, Phải: 4 Sản phẩm HOT
        link: '/shop?gender=nu&category=vay',
        products: look3Products,
      },
      {
        id: 'look-4',
        lookNumber: 'LOOK 04',
        badge: 'LOOK 04 // EDITORIAL LUXURY',
        title: 'EDITORIAL LUXURY',
        genderTag: 'Nữ • Lookbook Luxury',
        desc: 'Thiết kế đầm dạ hội corset cao cấp, váy ren hoa Victorian kiêu kỳ kết hợp cùng phụ kiện túi clutch dự tiệc sang trọng, tôn trọn thần thái quý phái cho những buổi dạ tiệc đặc biệt.',
        image: HOME_IMAGES.womenLookbook,
        objectPosition: 'object-[center_top]',
        imageSide: 'right' as const, // Trái: 4 Sản phẩm HOT, Phải: Ảnh lớn
        link: '/shop?gender=nu&category=vay',
        products: look4Products,
      },
    ],
    [look1Products, look2Products, look3Products, look4Products]
  );

  return (
    <>
      <GalaxyDebugPanel onReplayIntro={handleReplayIntro} />

      <div className="pb-16">
        {/* ============================================================ */}
        {/* HERO SECTION — NỀN GALAXY ĐEN TÍM & VŨ TRỤ 3D LIÊN TỤC       */}
        {/* ============================================================ */}
        <section
          className="relative overflow-hidden pt-10 pb-14 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 bg-[#070816] text-white select-none"
          style={{ backgroundColor: '#070816' }}
        >
          {/* TẦNG 2 — CONTINUOUS AMBIENT GALAXY (Hạt sao 3D chuyển động chậm liên tục ở Hero) */}
          {!isSaver ? (
            <React.Suspense fallback={<div className="absolute inset-0 bg-[#070816]" />}>
              <AmbientGalaxy />
            </React.Suspense>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-[#070816] via-[#0E0C24] to-[#070816] pointer-events-none" />
          )}

          {/* Subtle cosmic ambient lighting: Điểm nhấn Tím #8B5CF6 & Cyan #22D3EE */}
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#8B5CF6]/20 rounded-full blur-3xl pointer-events-none z-0" />
          <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-[#22D3EE]/15 rounded-full blur-3xl pointer-events-none z-0" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Cột trái: Văn bản định vị thương hiệu & Nút hành động */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#22D3EE] text-xs font-bold tracking-wider uppercase shadow-xs">
                  <Zap className="w-3.5 h-3.5 text-[#22D3EE]" />
                  <span>SMARTBUY AI // FASHION REVOLUTION 2026</span>
                </div>

                <div className="space-y-3">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-none drop-shadow-md">
                    KHÁM PHÁ SHOP <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-[#22D3EE] drop-shadow-[0_0_30px_rgba(139,92,246,0.35)]">
                      THỜI TRANG GEN Z
                    </span>
                  </h1>
                  <p className="text-sm sm:text-base text-zinc-300 max-w-xl leading-relaxed">
                    Đón đầu xu hướng thời trang đường phố đương đại cùng SMARTBUY AI. Trải nghiệm thử đồ ảo bằng AI trên GPU RTX 3060 và nhận tư vấn outfit thông minh từ trợ lý ảo cá nhân.
                  </p>
                </div>

                {/* Các nút hành động chính */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                  <Button
                    variant="accent"
                    size="lg"
                    onClick={() => handleProtectedAction('/shop')}
                    className="w-full sm:w-auto text-xs uppercase tracking-wider font-extrabold bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] hover:from-[#7C3AED] hover:to-[#5B21B6] text-white py-4 px-8 rounded-full shadow-lg hover:shadow-purple-500/30 cursor-pointer hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4 text-white" />
                    <span>KHÁM PHÁ SHOP THỜI TRANG</span>
                  </Button>

                  <a href="#san-pham-hot">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full sm:w-auto text-xs uppercase tracking-wider font-bold bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/25 py-3.5 px-7 rounded-full cursor-pointer hover:-translate-y-0.5 transition-all"
                    >
                      <Flame className="w-4 h-4 mr-2 text-rose-400" />
                      <span>XEM SẢN PHẨM HOT</span>
                    </Button>
                  </a>
                </div>

                {/* Cam kết thương hiệu nhỏ */}
                <div className="pt-4 flex items-center gap-6 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#8B5CF6]" />
                    <span>100% Ảnh Thật Xưởng May</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#22D3EE]" />
                    <span>Thử Đồ AI GPU RTX 3060</span>
                  </div>
                </div>
              </div>

              {/* Cột phải: Carousel Lookbook thời trang */}
              <div className="lg:col-span-5 relative w-full">
                <HeroFashionGallery />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* MARQUEE TICKER BANNER                                        */}
        {/* ============================================================ */}
        <div className="relative py-3.5 bg-[#18181B] text-white font-mono text-xs tracking-wider uppercase overflow-hidden whitespace-nowrap border-y border-white/10 select-none">
          <div className="inline-block animate-marquee">
            <span className="text-[#22D3EE] font-bold">SMARTBUY AI</span> • ALL SEASONS GEN Z DROPS • FREESHIP ĐƠN TỪ 299K • 308 SẢN PHẨM THẬT • VẢI 100% HEAVYWEIGHT COTTON • ĐỔI SIZE 15 NGÀY TẬN NƠI • AI TRY-ON THỬ ĐỒ TRÊN GPU RTX 3060 •&nbsp;
          </div>
          <div className="inline-block animate-marquee" aria-hidden="true">
            <span className="text-[#22D3EE] font-bold">SMARTBUY AI</span> • ALL SEASONS GEN Z DROPS • FREESHIP ĐƠN TỪ 299K • 308 SẢN PHẨM THẬT • VẢI 100% HEAVYWEIGHT COTTON • ĐỔI SIZE 15 NGÀY TẬN NƠI • AI TRY-ON THỬ ĐỒ TRÊN GPU RTX 3060 •&nbsp;
          </div>
        </div>

        {/* ============================================================ */}
        {/* MAIN BODY CONTENT SECTIONS (KHOẢNG CÁCH DỌC THOÁNG ĐÃNG)     */}
        {/* ============================================================ */}
        <div className="mt-16 lg:mt-24 space-y-16 lg:space-y-24">

        {/* ============================================================ */}
        {/* 1. GIỚI THIỆU SMARTBUY AI (4 USP CARDS)                      */}
        {/* ============================================================ */}
        <section id="gioi-thieu-usp" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 p-4 sm:p-6 rounded-3xl bg-white border border-[#E4E4E7] shadow-card">
            <div className="flex items-center gap-3 sm:gap-3.5 p-2">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
              </div>
              <div className="text-left">
                <h4 className="text-xs sm:text-sm font-bold text-[#18181B]">AI Hỗ Trợ Phối Đồ</h4>
                <p className="text-[11px] text-[#71717A] mt-0.5 leading-snug">Gợi ý outfit đồng bộ theo phong cách cá nhân</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-3.5 p-2">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-[#0D9488]" />
              </div>
              <div className="text-left">
                <h4 className="text-xs sm:text-sm font-bold text-[#18181B]">Khám Phá Phong Cách</h4>
                <p className="text-[11px] text-[#71717A] mt-0.5 leading-snug">Streetwear, Y2K và Casual đón đầu xu hướng</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-3.5 p-2">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                <Cpu className="w-5 h-5 text-[#D97706]" />
              </div>
              <div className="text-left">
                <h4 className="text-xs sm:text-sm font-bold text-[#18181B]">Thử Đồ Ảo GPU</h4>
                <p className="text-[11px] text-[#71717A] mt-0.5 leading-snug">Xem trước kết quả chuẩn phom dáng bằng AI</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-3.5 p-2">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div className="text-left">
                <h4 className="text-xs sm:text-sm font-bold text-[#18181B]">Đổi Size 15 Ngày</h4>
                <p className="text-[11px] text-[#71717A] mt-0.5 leading-snug">Hỗ trợ đổi size tận nơi nhanh chóng, tiện lợi</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. SẢN PHẨM HOT — TỐI ĐA 6 SẢN PHẨM THẬT, ZERO HIỂN THỊ GIÁ  */}
        {/* ============================================================ */}
        <ScrollReveal animation="fade-up">
          <section id="san-pham-hot" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-[#E4E4E7] gap-3 text-left">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-[#DC2626] bg-rose-50 px-2.5 py-0.5 rounded-sm border border-rose-200">
                  <Flame className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>ĐANG ĐƯỢC YÊU THÍCH // HOT DROPS 2026</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#18181B] uppercase mt-2">
                  SẢN PHẨM HOT
                </h2>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Các mẫu thiết kế nổi bật nhất từ SMARTBUY AI, tập trung vào hình ảnh và chi tiết phom dáng.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleProtectedAction('/shop')}
                className="text-xs font-bold text-[#8B5CF6] hover:text-[#7C3AED] flex items-center gap-1 transition-colors whitespace-nowrap group cursor-pointer"
              >
                <span>Vào Shop xem giá & mua sắm</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Lưới sản phẩm HOT: Desktop 4 cột (2 hàng x 4), Tablet 2-3 cột, Phone 2 cột — HomeProductCard: 0 GIÁ, NÚT XEM CHI TIẾT */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {hotProducts.slice(0, 8).map((product) => (
                <HomeProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>

            {/* Nút lớn dẫn vào Shopping Area */}
            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={() => handleProtectedAction('/shop')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#18181B] hover:bg-[#27272A] text-white text-xs uppercase tracking-wider font-extrabold shadow-md hover:shadow-lg transition-all group cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#8B5CF6]" />
                <span>Khám phá toàn bộ sản phẩm trong Shop</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </section>
        </ScrollReveal>

        {/* ============================================================ */}
        {/* 3. BỘ SƯU TẬP 4 PHONG CÁCH THỜI TRANG (LOOKBOOK EDITORIAL)    */}
        {/*    BỐ CỤC XEN KẼ TRÁI - PHẢI THEO CHIỀU DỌC TRANG CHỦ        */}
        {/* ============================================================ */}
        <section id="lookbook" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 lg:space-y-24 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#E4E4E7] pb-4 gap-3 text-left">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-[#7C3AED] bg-purple-50 px-2.5 py-0.5 rounded-sm border border-purple-200">
                <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>EDITORIAL LOOKBOOK // 4 PHONG CÁCH TIÊU BIỂU</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#18181B] uppercase mt-2">
                4 PHONG CÁCH THỜI TRANG TIÊU BIỂU
              </h2>
              <p className="text-xs sm:text-sm text-[#71717A] mt-1 max-w-2xl">
                Bộ sưu tập 4 outfit thực tế đại diện cho tinh thần Gen Z: Phóng khoáng, Tối giản, Năng động và Sang trọng.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleProtectedAction('/shop')}
              className="text-xs font-bold text-[#8B5CF6] hover:text-[#7C3AED] flex items-center gap-1.5 transition-colors whitespace-nowrap group cursor-pointer"
            >
              <span>Xem tất cả trong Shop</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* 4 KHU VỰC PHONG CÁCH XEN KẼ */}
          {lookSections.map((look) => (
            <ScrollReveal key={look.id} animation="fade-up">
              <div
                data-testid={`look-section-${look.id}`}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
              >
                {/* CỘT ẢNH ĐẠI DIỆN: 38-42% CHIỀU RỘNG (lg:col-span-5) */}
                <div
                  className={`w-full order-1 ${
                    look.imageSide === 'left' ? 'lg:order-1' : 'lg:order-2'
                  } lg:col-span-5`}
                >
                  <div
                    onClick={() => handleProtectedAction(look.link)}
                    className="group relative rounded-[20px] overflow-hidden bg-[#18181B] border border-[#E4E4E7] hover:border-[#8B5CF6]/50 shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer h-[420px] sm:h-[460px] lg:h-[480px] max-h-[500px]"
                  >
                    <img
                      src={look.image}
                      alt={look.title}
                      loading="lazy"
                      className={`w-full h-full object-cover ${look.objectPosition} transition-transform duration-700 ease-out group-hover:scale-105`}
                    />
                    {/* Badge góc trên */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-black/75 backdrop-blur-md text-[#18F4FC] border border-white/20 shadow-xs">
                        {look.badge}
                      </span>
                    </div>

                    {/* Gradient & Thông tin trên ảnh */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                    <div className="absolute bottom-5 left-5 right-5 text-left text-white pointer-events-none z-10">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#18F4FC] block">
                        {look.genderTag}
                      </span>
                      <h4 className="text-lg sm:text-xl font-black text-white group-hover:text-[#18F4FC] transition-colors mt-0.5">
                        {look.title}
                      </h4>
                      <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-white/90">
                        <span>Khám phá phong cách trong Shop</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#18F4FC] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* CỘT NỘI DUNG & SẢN PHẨM HOT: 58-62% CHIỀU RỘNG (lg:col-span-7) */}
                <div
                  className={`w-full order-2 ${
                    look.imageSide === 'left' ? 'lg:order-2' : 'lg:order-1'
                  } lg:col-span-7 space-y-4 sm:space-y-5 text-left`}
                >
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-[#7C3AED] bg-purple-50 px-2.5 py-0.5 rounded-sm border border-purple-200">
                      <Flame className="w-3.5 h-3.5 text-[#DC2626]" />
                      <span>SẢN PHẨM HOT PHÙ HỢP // {look.lookNumber}</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-[#18181B] uppercase tracking-tight">
                      {look.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed max-w-xl">
                      {look.desc}
                    </p>
                  </div>

                  {/* Lưới 4 sản phẩm HOT theo phong cách */}
                  <div className="grid grid-cols-2 gap-4 lg:gap-5">
                    {look.products.map((product) => (
                      <HomeProductCard
                        key={product.id}
                        product={product}
                      />
                    ))}
                  </div>

                  {/* Nút hành động khám phá */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => handleProtectedAction(look.link)}
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8B5CF6] hover:text-[#7C3AED] group/cta cursor-pointer transition-colors"
                    >
                      <span>Khám phá toàn bộ sản phẩm {look.lookNumber} trong Shop</span>
                      <ArrowRight className="w-4 h-4 group-hover/cta:translate-x-1.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </section>

        {/* ============================================================ */}
        {/* 4. GIỚI THIỆU THƯƠNG HIỆU SMARTBUY AI & CÔNG NGHỆ THỜI TRANG */}
        {/* ============================================================ */}
        <section id="ve-thuong-hieu" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 scroll-mt-24">
          <div className="bg-white rounded-3xl border border-[#E4E4E7] p-8 sm:p-12 lg:p-16 shadow-card text-left">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8B5CF6]/10 text-[#7C3AED] text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[#8B5CF6]" />
                <span>VỀ THƯƠNG HIỆU SMARTBUY AI</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#18181B] uppercase tracking-tight leading-tight">
                THỜI TRANG GEN Z TIÊN PHONG CÔNG NGHỆ
              </h2>

              <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
                SMARTBUY AI kết hợp hoàn hảo giữa thời trang đường phố đương đại và sức mạnh của trí tuệ nhân tạo.
                Mục tiêu của chúng tôi là đem lại trải nghiệm mua sắm thông minh, chính xác và truyền cảm hứng nhất cho giới trẻ.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-[#E4E4E7]">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center font-black">
                    01
                  </div>
                  <h4 className="text-sm font-black text-[#18181B] uppercase">100% Ảnh Thực Tế</h4>
                  <p className="text-xs text-[#71717A] leading-relaxed">
                    Mọi hình ảnh sản phẩm đều được chụp trực tiếp từ mẫu thật và xưởng may, cam kết không dùng ảnh ảo lừa dối khách hàng.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#0891B2] flex items-center justify-center font-black">
                    02
                  </div>
                  <h4 className="text-sm font-black text-[#18181B] uppercase">Chất Liệu Tuyển Chọn</h4>
                  <p className="text-xs text-[#71717A] leading-relaxed">
                    Sử dụng vải Heavyweight Cotton 250-280gsm giữ phom đứng, co giãn thoáng mát, chống xù lông và bạc màu sau giặt.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center font-black">
                    03
                  </div>
                  <h4 className="text-sm font-black text-[#18181B] uppercase">Đổi Size 15 Ngày</h4>
                  <p className="text-xs text-[#71717A] leading-relaxed">
                    Chính sách đổi size tận nơi linh hoạt trong 15 ngày, nhân viên giao hàng nhận hàng đổi trả ngay tại cửa nhà bạn.
                  </p>
                </div>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Button
                  variant="accent"
                  size="lg"
                  onClick={() => handleProtectedAction('/shop')}
                  className="w-full sm:w-auto text-xs uppercase font-black tracking-wider bg-[#8B5CF6] hover:bg-[#7C3AED] text-white py-4 px-8 rounded-xl shadow-elevated cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  VÀO SHOP MUA SẮM NGAY
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => handleProtectedAction('/try-on')}
                  className="w-full sm:w-auto text-xs uppercase font-bold bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] py-4 px-7 rounded-xl cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 mr-2 text-[#8B5CF6]" />
                  THỬ ĐỒ AI NGAY →
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </>
);
};
