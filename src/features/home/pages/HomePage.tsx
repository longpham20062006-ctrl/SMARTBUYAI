import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productService } from '@/services/productService';
import { ProductCard } from '@/components/common/ProductCard';
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
  Camera,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';

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
  useRepoSubscription(['products']);
  const navigate = useNavigate();

  // Interactive AI Stylist state
  const [stylistPrompt, setStylistPrompt] = useState('');

  // Sản phẩm thật từ Catalog SMARTBUY AI (270+ mẫu)
  const trendingProducts = productService.getBestSellers(8);
  const newArrivals = productService.getNewArrivals(8);
  const menHighlights = productService.getAll({ gender: 'nam' }).slice(0, 4);
  const womenHighlights = productService.getAll({ gender: 'nu' }).slice(0, 4);

  // Ảnh đại diện danh mục lấy từ sản phẩm thật trong catalog
  const aoThunFirst = productService.getAll({ categorySlug: 'ao-thun' })[0];
  const hoodieFirst = productService.getAll({ categorySlug: 'ao-hoodie' })[0] || productService.getAll({ categorySlug: 'ao-khoac' })[0];
  const jeansFirst = productService.getAll({ categorySlug: 'quan-jeans' })[0] || productService.getAll({ categorySlug: 'quan' })[0];
  const nuFirst = productService.getAll({ gender: 'nu' })[0];
  const unisexFirst = productService.getAll({ gender: 'unisex' })[0] || aoThunFirst;

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

  // 5 Category Cards (Shop By Category) — Ảnh sản phẩm thật từ kho hàng
  const categoryCards = [
    {
      title: 'Thời Trang Nam',
      gender: 'nam',
      link: '/products?gender=nam',
      image: menHighlights[0]?.images?.[0] || '/images/san-pham/ao-thun-nam-1.jpg',
      count: '130+ Mẫu',
      desc: 'Áo thun, Hoodie, Jeans, Sơ mi boxy',
    },
    {
      title: 'Thời Trang Nữ',
      gender: 'nu',
      link: '/products?gender=nu',
      image: nuFirst?.images?.[0] || '/images/san-pham/vay-nu-1.jpg',
      count: '140+ Mẫu',
      desc: 'Váy đầm, Croptop, Baby Tee, Cardigan',
    },
    {
      title: 'Thời Trang Unisex',
      gender: 'unisex',
      link: '/products?gender=unisex',
      image: unisexFirst?.images?.[0] || aoThunFirst?.images?.[0] || '/images/san-pham/ao-thun-unisex-1.jpg',
      count: 'Oversize Fit',
      desc: 'Phom rộng tự do, thoải mái cho cả nam & nữ',
    },
    {
      title: 'Áo Hoodie & Nỉ',
      gender: 'hoodie',
      link: '/products?category=ao-hoodie',
      image: hoodieFirst?.images?.[0] || '/images/san-pham/ao-hoodie-1.jpg',
      count: 'Chất Nỉ Bông',
      desc: 'Dày dặn, ấm áp, phom rộng chuẩn Gen Z',
    },
    {
      title: 'Quần Jeans & Kaki',
      gender: 'jeans',
      link: '/products?category=quan-jeans',
      image: jeansFirst?.images?.[0] || '/images/san-pham/quan-jeans-1.jpg',
      count: 'Ống Suông Rộng',
      desc: 'Hack dáng, dễ phối cùng áo thun và sơ mi',
    },
  ];

  return (
    <div className="bg-[#FAFAF9] space-y-16 sm:space-y-24">
      {/* ============================================================ */}
      {/* 1. HERO BANNER — ẢNH 1: SMARTBUY AI STREETWEAR FLAGSHIP       */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-[#18181B] text-white select-none">
        {/* Subtle ambient lighting */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#8B5CF6]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-[#18F4FC]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Cột Typography & CTA (7 cols trên Desktop) */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Tag Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#18F4FC] text-xs font-bold tracking-wider uppercase animate-fade-in">
                <Sparkles className="w-3.5 h-3.5 text-[#18F4FC]" />
                <span>SMARTBUY AI // STREETWEAR 2026</span>
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

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link to="/products">
                  <Button
                    variant="accent"
                    size="lg"
                    className="w-full sm:w-auto text-xs uppercase tracking-wider font-extrabold shadow-elevated bg-[#8B5CF6] hover:bg-[#7C3AED] text-white py-4 px-8 rounded-xl cursor-pointer"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    KHÁM PHÁ NGAY
                  </Button>
                </Link>

                <Link to="/try-on">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto text-xs uppercase tracking-wider font-bold bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/25 py-4 px-7 rounded-xl cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-[#18F4FC]" />
                    TRẢI NGHIỆM AI
                  </Button>
                </Link>
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

            {/* Cột ẢNH 1 — High Fashion Editorial Banner (5 cols trên Desktop) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-[460px] lg:max-w-none rounded-3xl overflow-hidden aspect-[3/4] bg-[#27272A] border border-white/15 shadow-2xl group">
                <img
                  src={HOME_IMAGES.heroStreetwear}
                  alt="SMARTBUY AI Streetwear Model - YOUR STYLE YOUR RULES"
                  className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="eager"
                />
                {/* Subtle vignette gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                
                {/* Floating Brand Badge */}
                <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-md border border-white/20 text-[#18F4FC] text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-full tracking-wider">
                  GEN Z STREETWEAR LOOK 01
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-left pointer-events-none">
                  <span className="text-[10px] font-black uppercase text-[#18F4FC] tracking-widest">
                    OVERSIZED GRAPHIC SWEATSHIRT
                  </span>
                  <p className="text-xs text-white/90 font-medium mt-0.5">
                    Phom rộng thoải mái • Phong cách đường phố tự do
                  </p>
                </div>
              </div>
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
      {/* 2. GIÁ TRỊ THƯƠNG HIỆU (USP)                                 */}
      {/* ============================================================ */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
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
      </section>

      {/* ============================================================ */}
      {/* 3. DANH MỤC SẢN PHẨM NỔI BẬT (SHOP BY CATEGORY)              */}
      {/* ============================================================ */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-[#71717A] tracking-wider">
              <Tag className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>SHOP BY CATEGORY</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#18181B] uppercase mt-1">
              Khám phá danh mục thời trang
            </h2>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-[#8B5CF6] hover:text-[#7C3AED] flex items-center gap-1 transition-colors"
          >
            <span>Xem toàn bộ 270+ sản phẩm</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 5 Category Cards Grid */}
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
              {/* Gradient Overlay */}
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
      </section>

      {/* ============================================================ */}
      {/* 4. SẢN PHẨM NỔI BẬT (TRENDING NOW — NO PRICES)               */}
      {/* ============================================================ */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-[#E4E4E7] gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-[#DC2626] bg-rose-50 px-2.5 py-0.5 rounded-sm border border-rose-200">
              <Flame className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>TRENDING NOW</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#18181B] uppercase mt-2">
              SẢN PHẨM NỔI BẬT
            </h2>
            <p className="text-xs text-[#71717A] mt-0.5">
              Các mẫu thời trang Gen Z được tuyển chọn nổi bật từ kho sản phẩm thật của SMARTBUY AI.
            </p>
          </div>
          <Link
            to="/products?sort=rating-desc"
            className="text-xs font-bold text-[#8B5CF6] hover:text-[#7C3AED] flex items-center gap-1 transition-colors whitespace-nowrap"
          >
            <span>Xem tất cả sản phẩm nổi bật</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Product Grid — KHÔNG HIỂN THỊ GIÁ TIỀN */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
          {trendingProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={handleOpenQuickView}
              onToggleCompare={handleToggleCompare}
              showPrice={false}
            />
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. MEN'S STREETWEAR — ẢNH 2: PHONG CÁCH CỦA PHÁI MẠNH        */}
      {/* ============================================================ */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white border border-[#E4E4E7] p-6 sm:p-10 lg:p-12 shadow-card overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Cột ẢNH 2 — Editorial Fashion Portrait (5 cols) */}
            <div className="lg:col-span-5 relative rounded-2xl overflow-hidden aspect-[9/16] max-h-[580px] bg-[#18181B] shadow-card group">
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

            {/* Cột Giới thiệu và 4 sản phẩm Nam thật (7 cols) */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-[#7C3AED] bg-[#F3E8FF] px-2.5 py-0.5 rounded-sm border border-[#DDD6FE]">
                  <span>MEN'S STREETWEAR</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-[#18181B] uppercase leading-tight">
                  PHONG CÁCH CỦA PHÁI MẠNH
                </h2>
                <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed max-w-xl">
                  Khám phá áo thun, hoodie, sơ mi và những outfit đường phố dành cho nam giới.
                </p>
              </div>

              {/* 4 Sản phẩm Nam thật — KHÔNG HIỂN THỊ GIÁ TIỀN */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {menHighlights.map((p) => (
                  <div key={p.id} className="group relative bg-[#FAFAF9] p-2 rounded-xl border border-[#E4E4E7] hover:border-[#8B5CF6] transition-all">
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-white mb-2">
                      <img
                        src={p.images?.[0] || ''}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="text-[11px] font-bold text-[#18181B] line-clamp-1">{p.name}</div>
                    <div className="text-[10px] font-bold text-[#8B5CF6] mt-0.5 flex items-center justify-between">
                      <span className="uppercase text-[#71717A] tracking-wider truncate max-w-[70px]">{p.brand || 'SMARTBUY AI'}</span>
                      <span>Chi tiết →</span>
                    </div>
                    <Link to={`/products/${p.slug}`} className="absolute inset-0" aria-label={p.name} />
                  </div>
                ))}
              </div>

              <div>
                <Link to="/products?gender=nam">
                  <Button
                    variant="accent"
                    size="lg"
                    className="text-xs uppercase font-extrabold tracking-wider bg-[#18181B] hover:bg-[#27272A] text-white py-4 px-8 rounded-xl cursor-pointer"
                  >
                    KHÁM PHÁ THỜI TRANG NAM →
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. NEW ARRIVALS (SẢN PHẨM MỚI VỀ — NO PRICES)                 */}
      {/* ============================================================ */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-[#E4E4E7] gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-[#7C3AED] bg-[#F3E8FF] px-2.5 py-0.5 rounded-sm border border-[#DDD6FE]">
              <Zap className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>NEW ARRIVALS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#18181B] uppercase mt-2">
              SẢN PHẨM MỚI VỀ
            </h2>
            <p className="text-xs text-[#71717A] mt-0.5">
              Những thiết kế mới nhất vừa được đưa lên kệ, chụp ảnh sản phẩm thật 100%.
            </p>
          </div>
          <Link
            to="/products?sort=newest"
            className="text-xs font-bold text-[#8B5CF6] hover:text-[#7C3AED] flex items-center gap-1 transition-colors whitespace-nowrap"
          >
            <span>XEM TẤT CẢ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Product Grid — KHÔNG HIỂN THỊ GIÁ TIỀN */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
          {newArrivals.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={handleOpenQuickView}
              onToggleCompare={handleToggleCompare}
              showPrice={false}
            />
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. WOMEN'S COLLECTION — ẢNH 3: TỎA SÁNG THEO CÁCH RIÊNG       */}
      {/* ============================================================ */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white border border-[#E4E4E7] p-6 sm:p-10 lg:p-12 shadow-card overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Cột Giới thiệu và 4 sản phẩm Nữ thật (7 cols) — Bên trái */}
            <div className="lg:col-span-7 space-y-6 text-left order-2 lg:order-1">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-[#DB2777] bg-pink-50 px-2.5 py-0.5 rounded-sm border border-pink-200">
                  <span>WOMEN'S COLLECTION</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-[#18181B] uppercase leading-tight">
                  TỎA SÁNG THEO CÁCH RIÊNG
                </h2>
                <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed max-w-xl">
                  Khám phá những thiết kế nữ tính, trẻ trung và phong cách thời trang dành riêng cho bạn.
                </p>
              </div>

              {/* 4 Sản phẩm Nữ thật — KHÔNG HIỂN THỊ GIÁ TIỀN */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {womenHighlights.map((p) => (
                  <div key={p.id} className="group relative bg-[#FAFAF9] p-2 rounded-xl border border-[#E4E4E7] hover:border-[#EC4899] transition-all">
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-white mb-2">
                      <img
                        src={p.images?.[0] || ''}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="text-[11px] font-bold text-[#18181B] line-clamp-1">{p.name}</div>
                    <div className="text-[10px] font-bold text-[#EC4899] mt-0.5 flex items-center justify-between">
                      <span className="uppercase text-[#71717A] tracking-wider truncate max-w-[70px]">{p.brand || 'SMARTBUY AI'}</span>
                      <span>Chi tiết →</span>
                    </div>
                    <Link to={`/products/${p.slug}`} className="absolute inset-0" aria-label={p.name} />
                  </div>
                ))}
              </div>

              <div>
                <Link to="/products?gender=nu">
                  <Button
                    variant="accent"
                    size="lg"
                    className="text-xs uppercase font-extrabold tracking-wider bg-[#EC4899] hover:bg-[#DB2777] text-white py-4 px-8 rounded-xl cursor-pointer"
                  >
                    KHÁM PHÁ THỜI TRANG NỮ →
                  </Button>
                </Link>
              </div>
            </div>

            {/* Cột ẢNH 3 — Editorial Outdoor Walk (5 cols) — Bên phải */}
            <div className="lg:col-span-5 relative rounded-2xl overflow-hidden aspect-[3/4] max-h-[580px] bg-[#FDF2F8] shadow-card group order-1 lg:order-2">
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
      {/* 8. AI VIRTUAL TRY-ON (THỬ ĐỒ TRƯỚC KHI MUA)                  */}
      {/* ============================================================ */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-[#F5F3FF] via-[#EDE9FE] to-[#F0FDFA] border border-[#DDD6FE] p-6 sm:p-12 shadow-card text-left relative overflow-hidden">
          {/* Decorative background blurs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#18F4FC]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8B5CF6] text-white text-xs font-bold uppercase tracking-wider shadow-xs">
                <Cpu className="w-3.5 h-3.5" />
                <span>AI VIRTUAL TRY-ON</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#18181B] uppercase tracking-tight">
                THỬ ĐỒ TRƯỚC KHI MUA
              </h2>
              <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed max-w-2xl font-sans">
                Khám phá cách trang phục phù hợp với bạn thông qua trải nghiệm thử đồ bằng AI. Hệ thống thử đồ AI ứng dụng mô hình chạy trên GPU chuyên dụng giúp bạn xem trước kết quả trực quan ngay trên trình duyệt.
              </p>
            </div>

            {/* 4 Bước trải nghiệm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  step: '01',
                  title: 'Chọn ảnh cá nhân',
                  desc: 'Tải lên ảnh nửa người hoặc toàn thân đứng thẳng rõ nét.',
                  icon: Camera,
                },
                {
                  step: '02',
                  title: 'Chọn trang phục',
                  desc: 'Chọn bất kỳ mẫu Áo hoặc Váy trong 270+ mẫu thật của shop.',
                  icon: Layers,
                },
                {
                  step: '03',
                  title: 'AI xử lý hình ảnh',
                  desc: 'Mô hình khuếch tán căn chỉnh nếp vải và phom dáng tự nhiên.',
                  icon: Cpu,
                },
                {
                  step: '04',
                  title: 'Xem trước kết quả',
                  desc: 'Ngắm nhìn outfit trên người bạn và đặt mua an tâm đúng size.',
                  icon: CheckCircle2,
                },
              ].map((st, i) => {
                const IconComponent = st.icon;
                return (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-white/90 backdrop-blur-xs border border-[#E4E4E7] shadow-xs flex flex-col justify-between space-y-3 hover:border-[#8B5CF6] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#8B5CF6] tracking-widest">{st.step}</span>
                      <IconComponent className="w-5 h-5 text-[#7C3AED]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#18181B]">{st.title}</h4>
                      <p className="text-[11px] text-[#71717A] mt-1 leading-relaxed">{st.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA Try-On Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <Link to="/try-on">
                <Button
                  variant="accent"
                  size="lg"
                  className="w-full sm:w-auto text-xs uppercase font-extrabold tracking-wider bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-4 px-8 rounded-xl shadow-elevated cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 mr-2 text-[#18F4FC]" />
                  THỬ ĐỒ NGAY
                </Button>
              </Link>
              <span className="text-xs text-[#71717A] font-medium">
                • Hoàn toàn miễn phí • Không lưu giữ ảnh cá nhân của bạn
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 9. FASHION LOOKBOOK — ẢNH 4: FIND YOUR INSPIRATION            */}
      {/* ============================================================ */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#E4E4E7] rounded-3xl p-6 sm:p-10 lg:p-12 shadow-card overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Cột ẢNH 4 — Editorial Lookbook (Chiếm 55% / 7 cols trên Desktop) */}
            <div className="lg:col-span-7 relative rounded-2xl overflow-hidden aspect-[9/14] sm:aspect-[4/5] max-h-[620px] bg-[#FAF5FF] shadow-card group">
              <img
                src={HOME_IMAGES.womenLookbook}
                alt="Fashion Lookbook Model - FIND YOUR INSPIRATION"
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-[#7C3AED] text-[10px] font-extrabold uppercase px-3.5 py-1.5 rounded-full border border-purple-200 shadow-subtle tracking-wider">
                EDITORIAL LOOKBOOK
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-6 left-6 right-6 text-left text-white pointer-events-none">
                <div className="text-sm font-black uppercase tracking-wider text-[#18F4FC]">THE WHITE BALLET DRESS</div>
                <div className="text-xs text-[#E4E4E7] mt-1 font-sans">
                  Cảm hứng nghệ thuật bảo tàng • Chất liệu voan xếp tầng bồng bềnh
                </div>
              </div>
            </div>

            {/* Cột Tiêu đề, Mô tả, Items phối đồ & CTA (5 cols trên Desktop) */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-[#7C3AED] bg-[#F3E8FF] px-2.5 py-0.5 rounded-sm border border-[#DDD6FE]">
                  <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>FASHION LOOKBOOK</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-[#18181B] uppercase leading-tight">
                  FIND YOUR INSPIRATION
                </h2>
                <p className="text-sm font-semibold text-[#6D28D9] italic">
                  Cảm hứng thời trang cho những khoảnh khắc của bạn.
                </p>
                <p className="text-xs text-[#71717A] leading-relaxed">
                  Mỗi trang phục là một tuyên ngôn phong cách riêng. Khám phá những bản phối tinh tế kết hợp giữa nét cổ điển thanh lịch và tinh thần Gen Z đương đại.
                </p>
              </div>

              {/* Set các món phối trong Lookbook từ catalog thật (KHÔNG HIỂN THỊ GIÁ) */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#18181B] mb-2.5">
                  Gợi ý món đồ đồng điệu:
                </h4>
                <div className="space-y-2.5">
                  {womenHighlights.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFAF9] border border-[#E4E4E7] hover:border-[#8B5CF6] transition-all"
                    >
                      <div className="w-14 h-16 rounded-lg overflow-hidden bg-white shrink-0">
                        <img
                          src={item.images?.[0] || ''}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <span className="text-[10px] uppercase font-bold text-[#8B5CF6] tracking-wider">
                          {item.brand}
                        </span>
                        <h5 className="text-xs font-bold text-[#18181B] line-clamp-1 mt-0.5">{item.name}</h5>
                        <div className="text-[11px] font-bold text-[#8B5CF6] mt-0.5 flex items-center gap-1">
                          <span>Xem chi tiết</span>
                          <span>→</span>
                        </div>
                      </div>
                      <Link
                        to={`/products/${item.slug}`}
                        className="p-2 text-[#71717A] hover:text-[#8B5CF6]"
                        title="Xem chi tiết"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="pt-2">
                <Link to="/products?gender=nu">
                  <Button
                    variant="accent"
                    size="lg"
                    className="w-full sm:w-auto text-xs uppercase font-extrabold tracking-wider bg-[#8B5CF6] hover:bg-[#7C3AED] text-white py-4 px-8 rounded-xl cursor-pointer shadow-elevated"
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-[#18F4FC]" />
                    KHÁM PHÁ PHONG CÁCH →
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 10. AI STYLIST (KHÔNG BIẾT HÔM NAY MẶC GÌ?)                   */}
      {/* ============================================================ */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#18181B] text-white p-6 sm:p-12 relative overflow-hidden shadow-elevated border border-[#27272A] text-left">
          {/* Subtle violet/cyan ambient glow */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-[#8B5CF6]/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 rounded-full bg-[#18F4FC]/10 blur-3xl pointer-events-none" />

          <div className="max-w-2xl relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[#DDD6FE] text-xs font-semibold uppercase border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-[#18F4FC]" />
              <span>AI STYLIST</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black text-white uppercase leading-tight">
                KHÔNG BIẾT HÔM NAY MẶC GÌ?
              </h2>
              <p className="text-xs sm:text-sm text-[#D4D4D8] leading-relaxed font-sans">
                Khám phá những cách phối đồ từ các sản phẩm có sẵn trong SMARTBUY AI — phù hợp cho đi học, đi chơi, hẹn hò và phong cách streetwear.
              </p>
            </div>

            {/* Ô nhập tương tác thật */}
            <form onSubmit={handleStylistSubmit} className="pt-2">
              <div className="flex flex-col sm:flex-row gap-2 bg-white p-1.5 rounded-xl shadow-card border border-white focus-within:ring-2 focus-within:ring-[#8B5CF6]">
                <input
                  type="text"
                  value={stylistPrompt}
                  onChange={(e) => setStylistPrompt(e.target.value)}
                  placeholder="Ví dụ: Phối đồ đi học, phong cách streetwear cá tính..."
                  className="flex-1 px-4 py-3 text-xs sm:text-sm text-[#18181B] bg-transparent focus:outline-none placeholder:text-[#A1A1AA]"
                />
                <Button
                  type="submit"
                  variant="accent"
                  className="h-12 px-6 text-xs uppercase tracking-wider font-extrabold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#18F4FC]" />
                  NHẬN TƯ VẤN AI
                </Button>
              </div>
            </form>

            {/* Các chủ đề gợi ý */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#D4D4D8] pt-1 font-sans">
              <span className="text-[#DDD6FE] font-bold">Gợi ý phong cách:</span>
              {[
                'Phối đồ đi học',
                'Phối đồ đi chơi',
                'Streetwear',
                'Phong cách tối giản',
                'Phối đồ đi hẹn hò',
                'Outfit mùa lạnh',
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setStylistPrompt(`Gợi ý outfit: ${sample}`)}
                  className="bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20 hover:text-white transition-colors cursor-pointer text-[11px] border border-white/10"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 11. FASHION JOURNAL — TIN TỨC & XU HƯỚNG THỜI TRANG           */}
      {/* ============================================================ */}
      <section className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-[#E4E4E7] gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-[#71717A] tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>FASHION JOURNAL</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#18181B] uppercase mt-1">
              Tin tức & Xu hướng thời trang
            </h2>
            <p className="text-xs text-[#71717A] mt-0.5">
              Cẩm nang phối đồ, mẹo chọn size và xu hướng streetwear Gen Z thịnh hành nhất 2026.
            </p>
          </div>
          <Link
            to="/size-guide"
            className="text-xs font-bold text-[#8B5CF6] hover:text-[#7C3AED] flex items-center gap-1 transition-colors whitespace-nowrap"
          >
            <span>Xem thêm cẩm nang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              id: 'blog-1',
              title: 'Bí quyết phối đồ Streetwear Gen Z chuẩn gu 2026',
              category: 'Streetwear Guide',
              readTime: '4 phút đọc',
              desc: 'Cách kết hợp áo thun boxy fit, hoodie trùm đầu cùng quần ống rộng và phụ kiện kim loại mang lại diện mạo cá tính.',
              image: menHighlights[1]?.images?.[0] || '/images/san-pham/ao-thun-nam-1.jpg',
              link: '/products?gender=unisex',
            },
            {
              id: 'blog-2',
              title: 'Hướng dẫn chọn size quần áo vừa vặn khi mua online',
              category: 'Size & Fit',
              readTime: '3 phút đọc',
              desc: 'Chi tiết số đo chiều rộng vai, vòng ngực và chiều dài lưng giúp bạn dễ dàng chọn size S, M, L, XL chuẩn phom.',
              image: aoThunFirst?.images?.[0] || '/images/san-pham/ao-thun-nam-2.jpg',
              link: '/size-guide',
            },
            {
              id: 'blog-3',
              title: 'Bảng phối màu trang phục tôn da cho học sinh, sinh viên',
              category: 'Color Matching',
              readTime: '5 phút đọc',
              desc: 'Áp dụng quy tắc phối 3 màu và các gam màu trung tính kem, be, đen xám giúp bộ outfit của bạn hài hòa, thu hút.',
              image: nuFirst?.images?.[0] || '/images/san-pham/vay-nu-2.jpg',
              link: '/collections',
            },
          ].map((post) => (
            <Link
              key={post.id}
              to={post.link}
              className="group bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden shadow-card hover:shadow-elevated hover:border-[#8B5CF6] transition-all flex flex-col"
            >
              <div className="aspect-[16/10] overflow-hidden bg-[#F2F3F5] relative">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 bg-[#18181B] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm">
                  {post.category}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3 text-left">
                <div className="space-y-2">
                  <span className="text-[11px] text-[#A1A1AA] font-medium">{post.readTime}</span>
                  <h3 className="text-base font-black text-[#18181B] group-hover:text-[#8B5CF6] transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs text-[#71717A] line-clamp-2 leading-relaxed">
                    {post.desc}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#F2F3F5] flex items-center justify-between text-xs font-bold text-[#8B5CF6]">
                  <span>Đọc bài viết</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
