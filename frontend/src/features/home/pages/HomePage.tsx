import React from 'react';
import { Link } from 'react-router-dom';
import { productService } from '@/services/productService';
import { ProductCard } from '@/components/common/ProductCard';
import { Product } from '@/types';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import {
  ArrowRight,
  Sparkles,
  Compass,
  Shirt,
  Wand2,
  SlidersHorizontal,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  useRepoSubscription(['products']);

  // Lấy dữ liệu sản phẩm thực tế từ MockRepo thông qua productService
  const allProducts = productService.getAll();
  const hotProducts = productService.getBestSellers(8);
  const maleProducts = productService.getAll({ gender: 'nam' }).slice(0, 4);
  const femaleProducts = productService.getAll({ gender: 'nu' }).slice(0, 4);
  const summerDrops = productService.getSummerCollection(4);
  const winterCozy = productService.getWinterCollection(4);

  const handleOpenQuickView = (product: Product) => {
    window.dispatchEvent(new CustomEvent('open_quick_view', { detail: product }));
  };

  const handleToggleCompare = (product: Product) => {
    window.dispatchEvent(new CustomEvent('toggle_compare', { detail: product }));
  };

  // V4.0 - 4 Khối Editorial Collections Xen Kẽ (Image-Left & Image-Right)
  const editorialCollections = [
    {
      id: 'col-1',
      title: 'Street Revolution',
      subtitle: 'BỘ SƯU TẬP 01',
      description: 'Phom dáng rộng phóng khoáng, đường may sắc sảo và chất vải định lượng dày dặn cho phong cách đường phố.',
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&auto=format&fit=crop&q=80',
      link: '/products?gender=nam',
      products: maleProducts.length > 0 ? maleProducts : hotProducts.slice(0, 4),
      layout: 'image-left',
    },
    {
      id: 'col-2',
      title: 'Modern Minimalist',
      subtitle: 'BỘ SƯU TẬP 02',
      description: 'Bảng màu trung tính ấm áp, đường nét tinh gọn tối ưu cho sinh hoạt thường nhật và những buổi gặp gỡ nhẹ nhàng.',
      image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1000&auto=format&fit=crop&q=80',
      link: '/products?sort=newest',
      products: summerDrops.length > 0 ? summerDrops : allProducts.slice(4, 8),
      layout: 'image-right',
    },
    {
      id: 'col-3',
      title: 'Y2K Aesthetic Mood',
      subtitle: 'BỘ SƯU TẬP 03',
      description: 'Năng lượng trẻ trung, tôn dáng với các thiết kế áo ôm, chân váy và phụ kiện mang âm hưởng đầu những năm 2000.',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=80',
      link: '/products?gender=nu',
      products: femaleProducts.length > 0 ? femaleProducts : hotProducts.slice(4, 8),
      layout: 'image-left',
    },
    {
      id: 'col-4',
      title: 'Korean Casual Layering',
      subtitle: 'BỘ SƯU TẬP 04',
      description: 'Nghệ thuật phối layer giữa sơ mi, sweater dệt kim và quần suông tạo nên diện mạo hiện đại chuẩn Seoul vibe.',
      image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1000&auto=format&fit=crop&q=80',
      link: '/collections',
      products: winterCozy.length > 0 ? winterCozy : allProducts.slice(8, 12),
      layout: 'image-right',
    },
  ];

  return (
    <div className="bg-[#F7F7F6] text-[#292524] space-y-16 sm:space-y-20 lg:space-y-24 pb-16">
      {/* ========================================================= */}
      {/* PHẦN 4. HERO SECTION – KOREAN MINIMAL REFINEMENT V4.2     */}
      {/* 42% nội dung bên trái, 58% ảnh bên phải, cao 500-560px     */}
      {/* ========================================================= */}
      <section className="pt-4 sm:pt-6 lg:pt-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-[#ECEAE7] overflow-hidden p-6 sm:p-8 lg:p-10 shadow-subtle min-h-[500px] lg:h-[530px] flex items-center">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-10 w-full h-full">
              {/* 42% Cột chữ bên trái */}
              <div className="w-full lg:w-[42%] lg:max-w-[460px] flex flex-col justify-center space-y-5 text-left shrink-0">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0EFED] text-[#18181B] text-xs font-medium w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#18181B]" />
                  <span>Bộ sưu tập mới 2026</span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-4xl lg:text-[42px] xl:text-[46px] font-bold tracking-tight text-[#18181B] leading-[1.18]">
                    Mặc chất theo <br className="hidden sm:inline" />
                    cách riêng.
                  </h1>
                </div>

                <p className="text-sm sm:text-base text-[#78716C] leading-relaxed max-w-md font-normal">
                  Khám phá những thiết kế giúp bạn thể hiện cá tính mỗi ngày.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <Link
                    to="/products"
                    className="inline-flex items-center justify-center h-11 px-6 bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-semibold rounded-lg shadow-subtle transition-colors"
                  >
                    Khám phá ngay
                  </Link>
                  <Link
                    to="/ai-try-on"
                    className="inline-flex items-center justify-center h-11 px-6 bg-white hover:bg-[#F0EFED] text-[#18181B] border border-[#ECEAE7] text-xs font-semibold rounded-lg transition-colors"
                  >
                    Thử đồ cùng AI
                  </Link>
                </div>
              </div>

              {/* 58% Cột ảnh thời trang biên tập bên phải – 2 ảnh cân đối hài hòa */}
              <div className="w-full lg:w-[58%] flex items-center">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                  {/* Ảnh 1: Tone Beige / Warm Gray Neutral */}
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#F0EFED] border border-[#ECEAE7] shadow-subtle group relative">
                    <img
                      src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1000&auto=format&fit=crop&q=85"
                      alt="SMARTBUY AI Korean Editorial - Minimal Beige"
                      className="w-full h-full object-cover object-[center_15%] transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                  </div>

                  {/* Ảnh 2: Tone Cream / Soft Layering đồng điệu */}
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#F0EFED] border border-[#ECEAE7] shadow-subtle group relative">
                    <img
                      src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1000&auto=format&fit=crop&q=85"
                      alt="SMARTBUY AI Korean Editorial - Casual Layering"
                      className="w-full h-full object-cover object-[center_20%] transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PHẦN 5. TRUST STRIP NHỎ BÊN DƯỚI HERO */}
          <div className="mt-4 sm:mt-5 bg-[#F7F7F6] rounded-xl border border-[#ECEAE7] py-3 px-4 sm:px-8">
            <div className="flex flex-wrap items-center justify-around gap-4 text-xs text-[#78716C]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#18181B] shrink-0" />
                <span className="font-medium">130+ thiết kế chọn lọc</span>
              </div>
              <div className="hidden sm:block w-px h-3.5 bg-[#ECEAE7]" />
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#18181B] shrink-0" />
                <span className="font-medium">Đổi size trong 15 ngày</span>
              </div>
              <div className="hidden sm:block w-px h-3.5 bg-[#ECEAE7]" />
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#18181B] shrink-0" />
                <span className="font-medium">Freeship đơn từ 299K</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* PHẦN 5. CATEGORY DISCOVERY – KHÁM PHÁ PHONG CÁCH          */}
      {/* Đúng 3 danh mục: Nam, Nữ, Phụ kiện (Không dùng Unisex)     */}
      {/* ========================================================= */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-left mb-6 sm:mb-8">
          <span className="text-xs font-bold tracking-wider uppercase text-[#78716C]">
            DANH MỤC THỜI TRANG
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#18181B] tracking-tight mt-1">
            Khám phá phong cách
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Danh mục 1: Nam */}
          <Link
            to="/products?gender=nam"
            className="group block bg-white rounded-xl border border-[#ECEAE7] overflow-hidden hover:border-[#18181B] transition-all duration-200 shadow-subtle"
          >
            <div className="aspect-[4/5] w-full overflow-hidden bg-[#F0EFED] relative">
              <img
                src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&auto=format&fit=crop&q=80"
                alt="Thời trang Nam"
                className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#18181B] group-hover:text-[#78716C] transition-colors">
                  Nam
                </h3>
                <p className="text-xs text-[#78716C] mt-0.5">Áo sơ mi, áo thun, hoodie & quần suông</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#F0EFED] group-hover:bg-[#18181B] group-hover:text-white flex items-center justify-center transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Danh mục 2: Nữ */}
          <Link
            to="/products?gender=nu"
            className="group block bg-white rounded-xl border border-[#ECEAE7] overflow-hidden hover:border-[#18181B] transition-all duration-200 shadow-subtle"
          >
            <div className="aspect-[4/5] w-full overflow-hidden bg-[#F0EFED] relative">
              <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80"
                alt="Thời trang Nữ"
                className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#18181B] group-hover:text-[#78716C] transition-colors">
                  Nữ
                </h3>
                <p className="text-xs text-[#78716C] mt-0.5">Baby tee, croptop, chân váy & đầm liền</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#F0EFED] group-hover:bg-[#18181B] group-hover:text-white flex items-center justify-center transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Danh mục 3: Phụ kiện */}
          <Link
            to="/products?category=phu-kien"
            className="group block bg-white rounded-xl border border-[#ECEAE7] overflow-hidden hover:border-[#18181B] transition-all duration-200 shadow-subtle"
          >
            <div className="aspect-[4/5] w-full overflow-hidden bg-[#F0EFED] relative">
              <img
                src="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=80"
                alt="Phụ kiện"
                className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#18181B] group-hover:text-[#78716C] transition-colors">
                  Phụ kiện
                </h3>
                <p className="text-xs text-[#78716C] mt-0.5">Trang sức bạc titan, túi tote & kính râm</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#F0EFED] group-hover:bg-[#18181B] group-hover:text-white flex items-center justify-center transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ========================================================= */}
      {/* PHẦN 6. HOT PRODUCTS – SẢN PHẨM NỔI BẬT                   */}
      {/* "Được yêu thích nhất" - Không hiển thị giá trên Home        */}
      {/* ========================================================= */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#ECEAE7] gap-3 text-left">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#18181B] tracking-tight">
              Được yêu thích nhất
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C] mt-1">
              Những thiết kế nổi bật dành cho phong cách của bạn.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#18181B] hover:text-[#78716C] transition-colors shrink-0"
          >
            <span>Xem tất cả sản phẩm</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Grid 4 sản phẩm desktop, 2-3 tablet, 2 mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {hotProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onQuickView={handleOpenQuickView}
              onToggleCompare={handleToggleCompare}
              hidePrice={true}
            />
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* PHẦN 7. FOUR EDITORIAL COLLECTIONS (4 KHỐI XEN KẼ)        */}
      {/* Section 1: Ảnh trái, Sp phải                              */}
      {/* Section 2: Sp trái, Ảnh phải                              */}
      {/* Section 3: Ảnh trái, Sp phải                              */}
      {/* Section 4: Sp trái, Ảnh phải                              */}
      {/* ========================================================= */}
      <section className="space-y-16 sm:space-y-20">
        {editorialCollections.map((sec) => (
          <div key={sec.id} className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl border border-[#ECEAE7] p-6 sm:p-8 lg:p-10 shadow-subtle">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Ảnh lớn đại diện (5 cols) */}
                <div
                  className={`lg:col-span-5 ${
                    sec.layout === 'image-right' ? 'lg:order-2' : 'lg:order-1'
                  }`}
                >
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-[#F0EFED] border border-[#ECEAE7] group">
                    <img
                      src={sec.image}
                      alt={sec.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white text-left">
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md px-2 py-0.5 rounded w-fit mb-2">
                        {sec.subtitle}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black">{sec.title}</h3>
                      <p className="text-xs text-[#ECEAE7] mt-1 line-clamp-2">{sec.description}</p>
                      <Link
                        to={sec.link}
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:underline"
                      >
                        <span>Khám phá bộ sưu tập</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Sản phẩm hot liên quan (7 cols - 4 sản phẩm) */}
                <div
                  className={`lg:col-span-7 ${
                    sec.layout === 'image-right' ? 'lg:order-1' : 'lg:order-2'
                  }`}
                >
                  <div className="text-left mb-6">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
                      {sec.subtitle}
                    </span>
                    <h4 className="text-xl sm:text-2xl font-black text-[#18181B] mt-0.5">
                      Thiết kế liên quan
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {sec.products.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        onQuickView={handleOpenQuickView}
                        onToggleCompare={handleToggleCompare}
                        hidePrice={true}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ========================================================= */}
      {/* PHẦN 9. AI TRY-ON FEATURE                                 */}
      {/* ========================================================= */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#F0EFED] rounded-xl border border-[#ECEAE7] p-8 sm:p-12 text-left relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3E8FF] text-[#7C3AED] text-xs font-semibold uppercase tracking-wider border border-[#DDD6FE]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI VIRTUAL TRY-ON</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#18181B] tracking-tight">
                  Thử trước. Chọn đúng phong cách.
                </h2>
                <p className="text-xs sm:text-sm text-[#78716C] leading-relaxed max-w-lg">
                  Tải ảnh của bạn và khám phá cách trang phục phù hợp với phong cách cá nhân.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to="/try-on"
                  className="inline-flex items-center justify-center gap-2 h-12 px-7 bg-[#18181B] hover:bg-[#27272A] text-white text-xs uppercase tracking-wider font-semibold rounded-lg shadow-subtle transition-all duration-150"
                >
                  <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                  <span>Thử đồ cùng AI</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-white border border-[#ECEAE7] shadow-subtle group">
                <img
                  src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1000&auto=format&fit=crop&q=80"
                  alt="Trực quan hóa phòng thử đồ ảo AI"
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* PHẦN 10. BRAND STORY & TRUST SECTION                      */}
      {/* Giới thiệu giá trị cốt lõi và chính sách đã xác thực      */}
      {/* ========================================================= */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl border border-[#ECEAE7] p-8 sm:p-12 text-left shadow-subtle">
          <div className="max-w-2xl space-y-2 mb-8">
            <span className="text-xs font-bold tracking-wider uppercase text-[#78716C]">
              GIỚI THIỆU
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#18181B] tracking-tight">
              SMARTBUY AI – Thời trang và công nghệ dành cho bạn.
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C] leading-relaxed">
              SMARTBUY AI kết hợp mua sắm thời trang với công nghệ AI để giúp người dùng khám phá phong cách, lựa chọn trang phục và trải nghiệm thử đồ trực tuyến.
            </p>
          </div>

          {/* 4 Trụ cột cốt lõi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-[#ECEAE7]">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-[#F0EFED] text-[#18181B] flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#18181B]">Khám phá thời trang</h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Thiết kế chọn lọc với phom dáng chuẩn mực, chất liệu mềm thoáng cho sinh hoạt thường nhật.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-[#F0EFED] text-[#18181B] flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-[#7C3AED]" />
              </div>
              <h3 className="text-sm font-bold text-[#18181B]">Gợi ý phối đồ AI</h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Trợ lý AI Stylist phân tích ngôn ngữ tự nhiên, gợi ý set đồ theo dịp dạo phố hoặc ngân sách sinh viên.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-[#F0EFED] text-[#18181B] flex items-center justify-center">
                <Shirt className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#18181B]">Trải nghiệm thử đồ</h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Phòng thử đồ ảo hỗ trợ quan sát trực tiếp trang phục lên hình ảnh người dùng trước khi đặt mua.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-[#F0EFED] text-[#18181B] flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4 text-[#7C3AED]" />
              </div>
              <h3 className="text-sm font-bold text-[#18181B]">Cá nhân hóa phong cách</h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Lưu lại số đo, phong cách ưa thích và nhận những gợi ý may đo phù hợp với vóc dáng của bạn.
              </p>
            </div>
          </div>

          {/* Dải chính sách xác thực */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-[#ECEAE7] text-xs text-[#78716C]">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#18181B] shrink-0" />
              <span>Freeship đơn từ 299.000₫</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#18181B] shrink-0" />
              <span>Đổi size trong 15 ngày</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#18181B] shrink-0" />
              <span>Kiểm tra hàng khi nhận</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7C3AED] shrink-0" />
              <span>Bảo mật dữ liệu cá nhân</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
