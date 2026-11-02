import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Tag,
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

// TOÀN BỘ 4 LOOK THỜI TRANG ĐƯỢC HIỂN THỊ ĐẦY ĐỦ TRÊN TRANG CHỦ
const EDITORIAL_LOOKS = [
  {
    id: 'look-1',
    src: HOME_IMAGES.heroStreetwear,
    title: 'STREETWEAR GRAPHIC HOODIE',
    category: 'Nam • Streetwear',
    badge: 'LOOK 01 // DROP 2026',
    desc: 'Phom rộng thoải mái, phong cách đường phố tự do và phóng khoáng.',
    link: '/shop?gender=nam',
  },
  {
    id: 'look-2',
    src: HOME_IMAGES.menStreetwear,
    title: 'URBAN MINIMALIST SHIRT',
    category: 'Nam • Casual Night',
    badge: 'LOOK 02 // NIGHT CASUAL',
    desc: 'Sơ mi cộc tay đen tối giản phối quần suông sáng màu loang wash cá tính.',
    link: '/shop?gender=nam',
  },
  {
    id: 'look-3',
    src: HOME_IMAGES.womenOutdoor,
    title: 'CYBERPUNK CORSET DRESS',
    category: 'Nữ • Gen Z Chic',
    badge: 'LOOK 03 // OUTDOOR CHIC',
    desc: 'Đầm corset chiết eo tôn dáng, phối tùng voan xòe bồng bềnh dạo phố.',
    link: '/shop?gender=nu',
  },
  {
    id: 'look-4',
    src: HOME_IMAGES.womenLookbook,
    title: 'PASTEL TUTU COCKTAIL DRESS',
    category: 'Nữ • Lookbook Luxury',
    badge: 'LOOK 04 // EDITORIAL',
    desc: 'Đầm xòe phối corset hồng pastel ngọt ngào, tạo dấu ấn sang trọng.',
    link: '/shop?gender=nu',
  },
];

export const HomePage: React.FC = () => {
  useRepoSubscription(['products', 'auth']);
  const navigate = useNavigate();
  const { isSaver } = usePerformance();

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

  // Sản phẩm thật từ Catalog SMARTBUY AI (Lấy đúng 6 sản phẩm HOT theo yêu cầu)
  const hotProducts = productService.getHotProducts(6);
  const menHighlights = productService.getAll({ gender: 'nam' }).slice(0, 4);
  const womenHighlights = productService.getAll({ gender: 'nu' }).slice(0, 4);

  // Ảnh đại diện danh mục lấy từ sản phẩm thật trong catalog
  const aoThunFirst = productService.getAll({ categorySlug: 'ao-thun' })[0];
  const hoodieFirst = productService.getAll({ categorySlug: 'ao-hoodie' })[0] || productService.getAll({ categorySlug: 'ao-khoac' })[0];
  const jeansFirst = productService.getAll({ categorySlug: 'quan-jeans' })[0] || productService.getAll({ categorySlug: 'quan' })[0];
  const nuFirst = productService.getAll({ gender: 'nu' })[0];
  const unisexFirst = productService.getAll({ gender: 'unisex' })[0] || aoThunFirst;

  // 5 Category Cards (Shop By Category) — Ảnh sản phẩm thật từ kho hàng
  const categoryCards = [
    {
      title: 'Thời Trang Nam',
      gender: 'nam',
      link: '/shop?gender=nam',
      image: menHighlights[0]?.images?.[0] || '/images/san-pham/ao-thun-nam-1.jpg',
      count: '130+ Mẫu',
      desc: 'Áo thun, Hoodie, Jeans, Sơ mi boxy',
    },
    {
      title: 'Thời Trang Nữ',
      gender: 'nu',
      link: '/shop?gender=nu',
      image: nuFirst?.images?.[0] || '/images/san-pham/vay-nu-1.jpg',
      count: '140+ Mẫu',
      desc: 'Váy đầm, Croptop, Baby Tee, Cardigan',
    },
    {
      title: 'Thời Trang Unisex',
      gender: 'unisex',
      link: '/shop?gender=unisex',
      image: unisexFirst?.images?.[0] || aoThunFirst?.images?.[0] || '/images/san-pham/ao-thun-unisex-1.jpg',
      count: 'Oversize Fit',
      desc: 'Phom rộng tự do, thoải mái cho cả nam & nữ',
    },
    {
      title: 'Áo Hoodie & Nỉ',
      gender: 'hoodie',
      link: '/shop?category=ao-hoodie',
      image: hoodieFirst?.images?.[0] || '/images/san-pham/ao-hoodie-1.jpg',
      count: 'Chất Nỉ Bông',
      desc: 'Dày dặn, ấm áp, phom rộng chuẩn Gen Z',
    },
    {
      title: 'Quần Jeans & Kaki',
      gender: 'jeans',
      link: '/shop?category=quan-jeans',
      image: jeansFirst?.images?.[0] || '/images/san-pham/quan-jeans-1.jpg',
      count: 'Ống Suông Rộng',
      desc: 'Hack dáng, dễ phối cùng áo thun và sơ mi',
    },
  ];

  return (
    <>
      {/* Telemetry Debug Panel (Chỉ hiển thị khi URL có ?debugGalaxy=1) */}
      <GalaxyDebugPanel onReplayIntro={handleReplayIntro} />

      <div className="bg-[#FAFAF9] space-y-16 sm:space-y-24">
        {/* ============================================================ */}
        {/* 1. HERO BANNER — ẢNH 1: SMARTBUY AI STREETWEAR FLAGSHIP       */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden bg-[#050510] text-white select-none">
          {/* TẦNG 2 — CONTINUOUS AMBIENT GALAXY (Hạt sao 3D chuyển động chậm liên tục ở Hero) */}
          {!isSaver ? (
            <React.Suspense fallback={<div className="absolute inset-0 bg-[#050510]" />}>
              <AmbientGalaxy />
            </React.Suspense>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-[#050510] via-[#0A0D18] to-[#050510] pointer-events-none" />
          )}

          {/* Subtle cosmic ambient lighting */}
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#8B5CF6]/15 rounded-full blur-3xl pointer-events-none z-0" />
          <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-[#22D3EE]/10 rounded-full blur-3xl pointer-events-none z-0" />

          <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

              {/* Cột Typography & CTA (7 cols trên Desktop) */}
              <div className="lg:col-span-7 space-y-6 text-left">
                {/* Tag Pill & 3D Intro Replay Button */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#18F4FC] text-xs font-bold tracking-wider uppercase animate-fade-in">
                    <Sparkles className="w-3.5 h-3.5 text-[#18F4FC]" />
                    <span>SMARTBUY AI // STREETWEAR 2026</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleReplayIntro}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/15 active:scale-95 text-[#22D3EE] text-[11px] font-bold tracking-wider uppercase border border-[#22D3EE]/30 transition-all cursor-pointer group shadow-xs"
                    title="Xem lại hiệu ứng vũ trụ Galaxy 3D"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#EC4899] group-hover:rotate-45 transition-transform" />
                    <span>Xem lại 3D Intro</span>
                  </button>
                </div>

                {/* Big Headline */}
                <div className="space-y-2">
                  <div className="text-2xl sm:text-3xl font-black tracking-widest text-[#18F4FC] uppercase font-mono">
                    SMARTBUY AI
                  </div>
                  <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.05] uppercase">
                    YOUR STYLE.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#E4E4E7] to-[#A1A1AA]">
                      YOUR RULES.
                    </span>
                  </h1>
                </div>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-[#D4D4D8] leading-relaxed max-w-xl font-sans">
                  Khám phá phong cách thời trang Gen Z theo cách riêng của bạn.
                </p>

                {/* CTAs theo Master Prompt V19 Section II.2 */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <Link to="/shop">
                    <Button
                      variant="accent"
                      size="lg"
                      className="w-full sm:w-auto text-xs uppercase tracking-wider font-extrabold shadow-elevated bg-[#8B5CF6] hover:bg-[#7C3AED] text-white py-4 px-8 rounded-xl cursor-pointer"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      KHÁM PHÁ THỜI TRANG
                    </Button>
                  </Link>

                  <a href="#san-pham-hot">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full sm:w-auto text-xs uppercase tracking-wider font-bold bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/25 py-4 px-7 rounded-xl cursor-pointer"
                    >
                      <Flame className="w-4 h-4 mr-2 text-rose-400" />
                      XEM SẢN PHẨM HOT
                    </Button>
                  </a>
                </div>

                {/* Brand Value Chips */}
                <div className="pt-4 grid grid-cols-3 gap-3 border-t border-white/10 max-w-lg">
                  <div>
                    <div className="text-lg sm:text-xl font-black text-white">270+</div>
                    <div className="text-[11px] text-[#A1A1AA] uppercase tracking-wider font-semibold">Mẫu thiết kế thật</div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-black text-[#18F4FC]">100%</div>
                    <div className="text-[11px] text-[#A1A1AA] uppercase tracking-wider font-semibold">Cotton Heavyweight</div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-black text-[#8B5CF6]">AI 3D</div>
                    <div className="text-[11px] text-[#A1A1AA] uppercase tracking-wider font-semibold">Thử đồ trực tuyến</div>
                  </div>
                </div>
              </div>

              {/* Cột ẢNH 1 — High Fashion Editorial Banner: Hover đổi 4 ảnh mượt mà (5 cols trên Desktop) */}
              <div className="lg:col-span-5 relative">
                <HeroFashionGallery />
              </div>

            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* MARQUEE RUNNING TICKER                                       */}
        {/* ============================================================ */}
        <div className="bg-[#18181B] text-[#D4D4D8] py-2.5 border-y border-[#27272A] overflow-hidden whitespace-nowrap text-xs font-semibold tracking-wider uppercase">
          <div className="inline-block animate-marquee">
            <span className="text-[#18F4FC] font-bold">SMARTBUY AI</span> • ALL SEASONS GEN Z DROPS • FREESHIP ĐƠN TỪ 299K • 270+ SẢN PHẨM THẬT • VẢI 100% HEAVYWEIGHT COTTON • ĐỔI SIZE 15 NGÀY TẬN NƠI • AI TRY-ON THỬ ĐỒ TRÊN GPU RTX 3060 •&nbsp;
          </div>
          <div className="inline-block animate-marquee" aria-hidden="true">
            <span className="text-[#18F4FC] font-bold">SMARTBUY AI</span> • ALL SEASONS GEN Z DROPS • FREESHIP ĐƠN TỪ 299K • 270+ SẢN PHẨM THẬT • VẢI 100% HEAVYWEIGHT COTTON • ĐỔI SIZE 15 NGÀY TẬN NƠI • AI TRY-ON THỬ ĐỒ TRÊN GPU RTX 3060 •&nbsp;
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. SẢN PHẨM HOT — TỐI ĐA 8 SẢN PHẨM THẬT, ZERO HIỂN THỊ GIÁ  */}
        {/* ============================================================ */}
        <ScrollReveal animation="fade-up">
          <section id="san-pham-hot" className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-[#E4E4E7] gap-3">
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
              <Link
                to="/shop"
                className="text-xs font-bold text-[#8B5CF6] hover:text-[#7C3AED] flex items-center gap-1 transition-colors whitespace-nowrap group"
              >
                <span>Vào Shop xem giá & mua sắm</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Lưới 6 sản phẩm HOT nổi bật — HomeProductCard: 0 GIÁ, NÚT XEM CHI TIẾT */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {hotProducts.slice(0, 6).map((product) => (
                <HomeProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>

            {/* Nút lớn dẫn vào Shopping Area */}
            <div className="mt-10 text-center">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#18181B] hover:bg-[#27272A] text-white text-xs uppercase tracking-wider font-extrabold shadow-md hover:shadow-lg transition-all group cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#8B5CF6]" />
                <span>Khám phá toàn bộ sản phẩm trong Shop</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </section>
        </ScrollReveal>

        {/* ============================================================ */}
        {/* BỘ SƯU TẬP 4 ẢNH THỜI TRANG TRANG CHỦ (LOOKBOOK EDITORIAL)     */}
        {/* ============================================================ */}
        <ScrollReveal animation="fade-up">
          <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-[#E4E4E7] gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-[#7C3AED] bg-purple-50 px-2.5 py-0.5 rounded-sm border border-purple-200">
                  <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>EDITORIAL LOOKBOOK // 4 PHONG CÁCH ĐẶC TRƯNG</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#18181B] uppercase mt-2">
                  4 PHONG CÁCH TIÊU BIỂU SMARTBUY AI
                </h2>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Bộ sưu tập 4 outfit thực tế đại diện cho tinh thần tự do, nổi bật và khác biệt của giới trẻ hiện đại.
                </p>
              </div>
              <Link
                to="/shop"
                className="text-xs font-bold text-[#8B5CF6] hover:text-[#7C3AED] flex items-center gap-1 transition-colors whitespace-nowrap group"
              >
                <span>Xem bộ sưu tập trong Shop</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Lưới 4 Thẻ Lookbook hiển thị trọn vẹn 4 ảnh trong public/images/anh_trangchu/ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {EDITORIAL_LOOKS.map((look) => (
                <Link
                  key={look.id}
                  to={look.link}
                  className="group relative rounded-3xl overflow-hidden bg-[#18181B] border border-[#E4E4E7] hover:border-[#8B5CF6]/50 shadow-card hover:shadow-xl transition-all duration-300 flex flex-col justify-between select-none"
                >
                  {/* Container ảnh chuẩn tỷ lệ 3:4 */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#27272A]">
                    <img
                      src={look.src}
                      alt={look.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-106"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                    {/* Badge góc trên */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-black/75 backdrop-blur-md text-[#18F4FC] border border-white/20">
                        {look.badge}
                      </span>
                    </div>

                    {/* Chú thích góc dưới trên ảnh */}
                    <div className="absolute bottom-3 left-3 right-3 text-left text-white pointer-events-none z-10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#18F4FC] block">
                        {look.category}
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-white group-hover:text-[#18F4FC] transition-colors line-clamp-1">
                        {look.title}
                      </h3>
                    </div>
                  </div>

                  {/* Body ngắn bên dưới */}
                  <div className="p-3.5 bg-white flex flex-col justify-between flex-1 gap-2.5 border-t border-[#F2F3F5] text-left">
                    <p className="text-[11px] text-[#71717A] line-clamp-2 leading-relaxed">
                      {look.desc}
                    </p>
                    <div className="pt-2 border-t border-[#F2F3F5] flex items-center justify-between text-xs font-bold text-[#8B5CF6] group-hover:text-[#7C3AED]">
                      <span>Khám phá phong cách</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* ============================================================ */}
        {/* 3. KHÁM PHÁ THỜI TRANG (KHU VỰC XU HƯỚNG GEN Z NỔI BẬT)      */}
        {/* ============================================================ */}
        <section id="kham-pha-thoi-trang" className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header Khu vực Xu Hướng */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#E4E4E7] pb-3 gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-[#71717A] tracking-wider">
                <Tag className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>TRENDING GEN Z LOOKS // KHÁM PHÁ THỜI TRANG</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#18181B] uppercase mt-1">
                Khám phá xu hướng thời trang
              </h2>
            </div>
            <Link
              to="/shop"
              className="text-xs font-bold text-[#8B5CF6] hover:text-[#7C3AED] flex items-center gap-1 transition-colors group"
            >
              <span>Vào Shop mua sắm đầy đủ</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* 5 Thẻ Danh Mục Thời Trang Nổi Bật */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-5">
            {categoryCards.map((cat, idx) => (
              <Link
                key={idx}
                to={cat.link}
                className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-[#E4E4E7] shadow-card border border-[#E4E4E7] transition-all duration-300 hover:shadow-elevated hover:border-[#8B5CF6]"
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col justify-end text-left text-white space-y-1">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-[#18F4FC]">
                    {cat.count}
                  </span>
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-[#18F4FC] transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-[11px] text-[#D4D4D8] line-clamp-1 opacity-90 hidden sm:block">
                    {cat.desc}
                  </p>

                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-white group-hover:translate-x-1 transition-transform">
                      <span>Khám phá</span>
                      <ArrowRight className="w-3 h-3 text-[#18F4FC]" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Xu Hướng Nam: PHONG CÁCH CỦA PHÁI MẠNH */}
          <div className="rounded-3xl bg-white border border-[#E4E4E7] p-6 sm:p-10 lg:p-12 shadow-card overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              <div className="lg:col-span-5 relative rounded-2xl overflow-hidden aspect-[9/16] max-h-[540px] bg-[#18181B] shadow-card group">
                <img
                  src={HOME_IMAGES.menStreetwear}
                  alt="Men's Streetwear Model - PHONG CÁCH CỦA PHÁI MẠNH"
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4 bg-[#18181B]/85 backdrop-blur-md text-white text-[10px] font-extrabold uppercase px-3.5 py-1.5 rounded-full border border-white/20 shadow-subtle tracking-wider">
                  MEN'S STREETWEAR
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 text-left text-white pointer-events-none">
                  <div className="text-xs font-black uppercase tracking-wider text-[#18F4FC]">Street Night Drop</div>
                  <div className="text-[11px] text-[#D4D4D8] mt-0.5">Sơ mi Cuban & Quần ống rộng loang màu</div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-[#7C3AED] bg-[#F3E8FF] px-2.5 py-0.5 rounded-sm border border-[#DDD6FE]">
                    <span>MEN'S STREETWEAR</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#18181B] uppercase leading-tight">
                    PHONG CÁCH CỦA PHÁI MẠNH
                  </h3>
                  <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed max-w-xl">
                    Khám phá áo thun, hoodie, sơ mi và những outfit đường phố dành cho nam giới.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {menHighlights.map((p) => (
                    <HomeProductCard key={p.id} product={p} />
                  ))}
                </div>

                <div>
                  <Link to="/shop?gender=nam">
                    <Button
                      variant="accent"
                      size="lg"
                      className="text-xs uppercase font-extrabold tracking-wider bg-[#18181B] hover:bg-[#27272A] text-white py-4 px-8 rounded-xl cursor-pointer"
                    >
                      KHÁM PHÁ THỜI TRANG NAM TRONG SHOP →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Xu Hướng Nữ: TỎA SÁNG THEO CÁCH RIÊNG */}
          <div className="rounded-3xl bg-white border border-[#E4E4E7] p-6 sm:p-10 lg:p-12 shadow-card overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              <div className="lg:col-span-7 space-y-6 text-left order-2 lg:order-1">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-[#DB2777] bg-pink-50 px-2.5 py-0.5 rounded-sm border border-pink-200">
                    <span>WOMEN'S COLLECTION</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#18181B] uppercase leading-tight">
                    TỎA SÁNG THEO CÁCH RIÊNG
                  </h3>
                  <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed max-w-xl">
                    Khám phá những thiết kế nữ tính, trẻ trung và phong cách thời trang dành riêng cho bạn.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {womenHighlights.map((p) => (
                    <HomeProductCard key={p.id} product={p} />
                  ))}
                </div>

                <div>
                  <Link to="/shop?gender=nu">
                    <Button
                      variant="accent"
                      size="lg"
                      className="text-xs uppercase font-extrabold tracking-wider bg-[#EC4899] hover:bg-[#DB2777] text-white py-4 px-8 rounded-xl cursor-pointer"
                    >
                      KHÁM PHÁ THỜI TRANG NỮ TRONG SHOP →
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 relative rounded-2xl overflow-hidden aspect-[3/4] max-h-[540px] bg-[#FDF2F8] shadow-card group order-1 lg:order-2">
                <img
                  src={HOME_IMAGES.womenOutdoor}
                  alt="Women's Collection Model - TỎA SÁNG THEO CÁCH RIÊNG"
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-[#DB2777] text-[10px] font-extrabold uppercase px-3.5 py-1.5 rounded-full border border-pink-200 shadow-subtle tracking-wider">
                  WOMEN'S COLLECTION
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 text-left text-white pointer-events-none">
                  <div className="text-xs font-black uppercase tracking-wider text-[#F472B6]">Floral Corset Dress</div>
                  <div className="text-[11px] text-[#FCE7F3] mt-0.5">Váy corset xòe tầng • Nữ tính & Duyên dáng</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. GIỚI THIỆU NGẮN VỀ SMARTBUY AI (BRAND MANIFESTO & CAM KẾT) */}
        {/* ============================================================ */}
        <section id="gioi-thieu" className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 pb-12 scroll-mt-24 space-y-8">
          {/* 4 Giá Trị Cốt Lõi (USP) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl bg-white border border-[#E4E4E7] shadow-card">
            <div className="flex items-center gap-3.5 p-2">
              <div className="w-11 h-11 rounded-2xl bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#18181B]">AI Hỗ Trợ Phối Đồ</h4>
                <p className="text-[11px] text-[#71717A] mt-0.5 leading-snug">Gợi ý outfit đồng bộ theo phong cách cá nhân</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-2">
              <div className="w-11 h-11 rounded-2xl bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-[#0D9488]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#18181B]">Khám Phá Phong Cách</h4>
                <p className="text-[11px] text-[#71717A] mt-0.5 leading-snug">Streetwear, Y2K và Korean Casual đón đầu xu hướng</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-2">
              <div className="w-11 h-11 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                <Cpu className="w-5 h-5 text-[#D97706]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#18181B]">Thử Đồ Ảo GPU</h4>
                <p className="text-[11px] text-[#71717A] mt-0.5 leading-snug">Xem trước kết quả chuẩn phom dáng trước khi đặt</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-2">
              <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#18181B]">Đổi Size 15 Ngày</h4>
                <p className="text-[11px] text-[#71717A] mt-0.5 leading-snug">Hỗ trợ đổi size tận nơi nhanh chóng, tiện lợi</p>
              </div>
            </div>
          </div>

          {/* Giới thiệu Thương hiệu */}
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
                <Link to="/shop">
                  <Button
                    variant="accent"
                    size="lg"
                    className="w-full sm:w-auto text-xs uppercase font-black tracking-wider bg-[#8B5CF6] hover:bg-[#7C3AED] text-white py-4 px-8 rounded-xl shadow-elevated cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    VÀO SHOP MUA SẮM NGAY
                  </Button>
                </Link>

                <Link to="/try-on">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto text-xs uppercase font-bold bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] py-4 px-7 rounded-xl cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-[#8B5CF6]" />
                    THỬ ĐỒ AI NGAY →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};
