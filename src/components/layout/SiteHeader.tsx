import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import {
  ShoppingBag,
  User as UserIcon,
  Search,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  Shield,
  LogOut,
  Heart,
  ArrowRight,
  Flame,
  Bot,
  Ruler,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Drawer } from '@/components/ui/drawer';
import { CartDrawer } from '@/components/common/CartDrawer';
import { BrandLogo } from '@/components/common/BrandLogo';
import { PerformanceToggle } from '@/components/common/PerformanceToggle';
import { GENZ_COLLECTIONS, GENZ_CATEGORIES } from '@/mocks/genzCategories';

export const SiteHeader: React.FC = () => {
  useRepoSubscription(['cart', 'auth']);
  const cart = MockRepo.getCart();
  const currentUser = MockRepo.getCurrentUser();
  const navigate = useNavigate();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const totalCartCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  // Dynamic header height measurement for sticky sub-navigation & Quick Filter
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const updateHeaderHeight = () => {
      const h = el.getBoundingClientRect().height;
      if (h > 0) {
        document.documentElement.style.setProperty('--site-header-height', `${Math.round(h)}px`);
      }
    };

    updateHeaderHeight();

    const ro = new ResizeObserver(() => {
      updateHeaderHeight();
    });
    ro.observe(el);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateHeaderHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  // Close dropdowns on outside click or ESC key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsSearchOpen(false);
        setIsMegaMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentPath = location.pathname;
  const currentGender = searchParams.get('gender');
  const currentCategory = searchParams.get('category');
  const currentSort = searchParams.get('sort');
  const isHomePage = currentPath === '/';

  const handleHomeClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleHotClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const el = document.getElementById('san-pham-hot');
      if (el) {
        const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  };

  // Xác định chính xác duy nhất 1 tab active theo route thực tế:
  const getActiveTab = (): 'home' | 'nam' | 'nu' | 'unisex' | 'phu-kien' | 'collections' | 'trending' | 'about' | 'size-guide' | 'try-on' | 'ai-stylist' | null => {
    if (currentPath === '/') return 'home';
    if (currentPath === '/about') return 'about';
    if (currentPath === '/size-guide') return 'size-guide';
    if (currentPath === '/try-on' || currentPath.startsWith('/virtual-try-on')) return 'try-on';
    if (currentPath.startsWith('/ai-stylist')) return 'ai-stylist';
    if (currentPath.startsWith('/collections')) return 'collections';
    if (currentPath.startsWith('/products')) {
      if (currentGender === 'nam') return 'nam';
      if (currentGender === 'nu') return 'nu';
      if (currentGender === 'unisex') return 'unisex';
      if (currentCategory === 'phu-kien') return 'phu-kien';
      if (currentSort === 'newest') return 'trending';
    }
    return null;
  };

  const activeTab = getActiveTab();

  const getTabClass = (isActive: boolean) =>
    cn(
      'text-xs uppercase tracking-wider font-bold px-3 py-1.5 rounded-xl transition-all duration-150 select-none cursor-pointer',
      isActive
        ? 'bg-[#8B5CF6] text-white shadow-xs'
        : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F5]'
    );

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          'sticky top-0 z-40 w-full border-b border-[#E4E4E7] bg-white transition-all duration-200',
          isScrolled ? 'shadow-subtle' : ''
        )}
      >
        {/* Top announcement bar */}
        <div
          className={cn(
            'bg-[#18181B] text-white text-[11px] px-4 font-medium border-b border-[#27272A] transition-all duration-200 overflow-hidden',
            isScrolled ? 'max-h-0 py-0 opacity-0 border-transparent' : 'max-h-10 py-1.5 opacity-100'
          )}
        >
          <div className="max-w-container mx-auto w-full flex items-center justify-between min-w-0">
            <div className="flex items-center gap-2 truncate min-w-0">
              <span className="bg-[#8B5CF6] text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm tracking-wider shrink-0">
                NEW DROP
              </span>
              <span className="text-[#D4D4D8] truncate text-[10px] sm:text-[11px]">FREESHIP ĐƠN TỪ 299K • ĐỔI SIZE 15 NGÀY TẬN NƠI</span>
            </div>
            <div className="hidden md:flex items-center gap-4 text-[#A1A1AA]">
              <span>MẶC CHẤT THEO CÁCH RIÊNG</span>
              <span className="text-[#8B5CF6] font-semibold">YOUR FIT. YOUR RULES.</span>
            </div>
          </div>
        </div>

        {/* TẦNG 1: LOGO LỚN RÕ RÀNG | SEARCH BAR HIỆN ĐẠI | TIỆN ÍCH MUA SẮM */}
        <div
          className={cn(
            'max-w-container mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4 transition-all duration-300',
            isScrolled ? 'h-16' : 'h-18 sm:h-20'
          )}
        >
          {/* Mobile menu trigger */}
          <div className="flex items-center lg:hidden shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 -ml-1 text-[#18181B] hover:text-[#8B5CF6] transition-colors cursor-pointer"
              aria-label="Mở menu điều hướng"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* LOGO THƯƠNG HIỆU LỚN, RÕ RÀNG, NỔI BẬT (Không khung đen, không viền) */}
          <div className="flex items-center shrink min-w-0 pr-1 sm:pr-4">
            <BrandLogo variant="header" showTagline={false} />
          </div>

          {/* Ở GIỮA: TRANG CHỦ — ĐIỀU HƯỚNG TINH GỌN (Trang chủ | Sản phẩm HOT | Shop | Khám phá thời trang) */}
          {isHomePage ? (
            <div className="hidden lg:flex items-center gap-6 xl:gap-8 mx-4">
              <NavLink
                to="/"
                end
                onClick={handleHomeClick}
                className={({ isActive }) =>
                  cn(
                    'text-xs uppercase font-extrabold tracking-wider transition-colors py-1 border-b-2',
                    isActive
                      ? 'text-[#8B5CF6] border-[#8B5CF6]'
                      : 'text-zinc-700 hover:text-[#8B5CF6] border-transparent'
                  )
                }
              >
                Trang chủ
              </NavLink>

              <a
                href="#san-pham-hot"
                onClick={handleHotClick}
                className="text-xs uppercase font-extrabold tracking-wider text-zinc-700 hover:text-[#8B5CF6] transition-colors py-1 border-b-2 border-transparent hover:border-[#8B5CF6] flex items-center gap-1.5"
              >
                <span>Sản phẩm HOT</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              </a>

              <NavLink
                to="/shop"
                className={({ isActive }) =>
                  cn(
                    'text-xs uppercase font-extrabold tracking-wider transition-colors py-1 border-b-2',
                    isActive
                      ? 'text-[#8B5CF6] border-[#8B5CF6]'
                      : 'text-zinc-700 hover:text-[#8B5CF6] border-transparent'
                  )
                }
              >
                Shop
              </NavLink>

              {/* KHÁM PHÁ THỜI TRANG */}
              <Link
                to="/shop"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white text-xs font-black uppercase tracking-wider shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                <span>Khám phá thời trang</span>
              </Link>
            </div>
          ) : (
            <div className="hidden lg:flex flex-1 max-w-xl mx-4">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <div className="relative flex items-center w-full">
                  <Search className="absolute left-3.5 w-4 h-4 text-[#71717A] pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm áo thun, hoodie, váy, quần jeans..."
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-[#F4F4F5] hover:bg-[#EFEFEF] focus:bg-white text-[#18181B] rounded-full border border-transparent focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all outline-none placeholder:text-[#A1A1AA]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 p-1 text-[#71717A] hover:text-[#18181B] rounded-full hover:bg-black/5 cursor-pointer"
                      title="Xóa tìm kiếm"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* PHÍA PHẢI: TIỆN ÍCH MUA SẮM (Tài khoản, Wishlist, Giỏ hàng) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Mobile Search Trigger - Ẩn trên Home giới thiệu, chỉ hiện khi vào Catalog */}
            {!isHomePage && (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="lg:hidden p-2 text-[#18181B] hover:text-[#8B5CF6] rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                title="Tìm kiếm sản phẩm"
                aria-label="Tìm kiếm sản phẩm"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* User Dropdown / Login Button (Hiện diện trên cả Mobile & Desktop) */}
            <div className="relative flex items-center" ref={userMenuRef}>
              {currentUser ? (
                <>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="p-2 text-[#18181B] hover:text-[#8B5CF6] rounded-full hover:bg-black/5 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Tài khoản của bạn"
                    aria-label="Tài khoản của bạn"
                  >
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-6 h-6 rounded-full object-cover border border-[#E4E4E7]"
                      />
                    ) : (
                      <UserIcon className="w-5 h-5" />
                    )}
                  </button>

                  {/* User Menu Content: HIỂN THỊ BÊN DƯỚI AVATAR 10px, KHÔNG CHE AVATAR, CÓ MŨI TÊN CHỈ LÊN */}
                  {isUserMenuOpen && (
                    <div className="absolute top-full right-0 mt-2.5 w-64 max-w-[calc(100vw-24px)] bg-white shadow-xl border border-[#E4E4E7] rounded-2xl py-2 z-50 animate-fade-in text-xs before:content-[''] before:absolute before:-top-1.5 before:right-4 before:w-3 before:h-3 before:bg-white before:rotate-45 before:border-t before:border-l before:border-[#E4E4E7]">
                      {/* 1. Header: Ảnh đại diện, tên, email khách hàng */}
                      <div className="px-4 py-2.5 border-b border-[#E4E4E7] relative z-10 bg-white rounded-t-2xl">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          {currentUser?.avatar ? (
                            <img
                              src={currentUser.avatar}
                              alt={currentUser.name}
                              className="w-8 h-8 rounded-full object-cover border border-[#E4E4E7]"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center font-bold text-xs">
                              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-[#18181B] truncate">{currentUser.name}</div>
                            <div className="text-[11px] text-[#71717A] truncate">{currentUser.email}</div>
                          </div>
                        </div>
                        <span className="inline-block px-2 py-0.5 rounded-md bg-[#F2F3F5] text-[#18181B] text-[10px] uppercase font-bold tracking-wider border border-[#E4E4E7]">
                          Vai trò: {currentUser.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                        </span>
                      </div>

                      {/* 2. Menu Điều hướng chi tiết theo Section 8 */}
                      <div className="py-1">
                        <Link
                          to="/account"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-[#52525B] hover:bg-[#F3E8FF]/60 hover:text-[#7C3AED] transition-colors font-medium"
                        >
                          <UserIcon className="w-4 h-4 text-[#71717A]" />
                          <span>Thông tin cá nhân</span>
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-[#52525B] hover:bg-[#F3E8FF]/60 hover:text-[#7C3AED] transition-colors font-medium"
                        >
                          <ShoppingBag className="w-4 h-4 text-[#71717A]" />
                          <span>Đơn hàng của tôi</span>
                        </Link>
                        <Link
                          to="/wishlist"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-[#52525B] hover:bg-[#F3E8FF]/60 hover:text-[#7C3AED] transition-colors font-medium"
                        >
                          <Heart className="w-4 h-4 text-[#71717A]" />
                          <span>Sản phẩm yêu thích</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setIsCartDrawerOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-[#52525B] hover:bg-[#F3E8FF]/60 hover:text-[#7C3AED] transition-colors text-left cursor-pointer font-medium"
                        >
                          <ShoppingBag className="w-4 h-4 text-[#71717A]" />
                          <div className="flex items-center justify-between flex-1">
                            <span>Giỏ hàng</span>
                            {totalCartCount > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#8B5CF6] text-white font-bold">
                                {totalCartCount}
                              </span>
                            )}
                          </div>
                        </button>
                      </div>

                      {/* 3. Phân hệ Quản trị & Đăng xuất */}
                      <div className="border-t border-[#E4E4E7] pt-1 mt-1 bg-[#FAFAF9] rounded-b-2xl">
                        {currentUser.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 font-bold text-[#8B5CF6] hover:bg-[#F3E8FF] transition-colors"
                          >
                            <Shield className="w-4 h-4 text-[#8B5CF6]" />
                            <span>Vào trang Quản trị (Admin)</span>
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            MockRepo.logout();
                            setIsUserMenuOpen(false);
                            navigate('/');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-[#DC2626] hover:bg-rose-50 transition-colors cursor-pointer text-left font-bold"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors shadow-xs"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Đăng nhập</span>
                </Link>
              )}
            </div>

            {/* Performance Mode Switcher */}
            <div className="hidden sm:flex items-center">
              <PerformanceToggle compact />
            </div>

            {/* Lối vào Shop nhanh cho Customer theo Master Prompt V19 */}
            {currentUser && (
              <Link
                to="/shop"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#18181B] bg-[#F4F4F5] hover:bg-[#8B5CF6] hover:text-white transition-all shadow-2xs"
                title="Khám phá toàn bộ cửa hàng SMARTBUY"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Shop</span>
              </Link>
            )}

            {/* Wishlist Link — CHỈ HIỂN THỊ KHI ĐÃ ĐĂNG NHẬP (CUSTOMER) */}
            {currentUser && (
              <Link
                to="/favorites"
                className="p-2 text-[#18181B] hover:text-[#8B5CF6] rounded-full hover:bg-black/5 transition-colors cursor-pointer hidden sm:flex items-center justify-center"
                title="Sản phẩm yêu thích"
                aria-label="Sản phẩm yêu thích"
              >
                <Heart className="w-5 h-5 text-[#18181B]" />
              </Link>
            )}

            {/* Cart Trigger with Real Badge — CHỈ HIỂN THỊ KHI ĐÃ ĐĂNG NHẬP (CUSTOMER) */}
            {currentUser && (
              <button
                onClick={() => setIsCartDrawerOpen(true)}
                className="relative p-2 text-[#18181B] hover:text-[#8B5CF6] rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                title="Mở giỏ hàng"
                aria-label="Giỏ hàng"
              >
                <ShoppingBag className="w-5 h-5 text-[#18181B]" />
                {totalCartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-[#8B5CF6] rounded-full px-1 shadow-subtle">
                    {totalCartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* TẦNG 2: NAVIGATION MENU DÀNH RIÊNG CHO SHOP (Desktop) — 6 MỤC CHUẨN SECTION 1 */}
        {!isHomePage && (
          <div className="hidden lg:block border-t border-[#F2F3F5] bg-white">
            <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
              <nav data-testid="category-nav" className="flex items-center justify-center gap-2.5 py-2">
                <Link to="/shop?gender=nam" className={getTabClass(activeTab === 'nam')}>
                  Nam
                </Link>
                <Link to="/shop?gender=nu" className={getTabClass(activeTab === 'nu')}>
                  Nữ
                </Link>
                <Link to="/shop?category=phu-kien" className={getTabClass(activeTab === 'phu-kien')}>
                  Phụ kiện
                </Link>

                {/* Chatbot AI */}
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('open_ai_stylist'))}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs uppercase tracking-wider font-bold text-[#7C3AED] bg-[#F3E8FF] hover:bg-[#8B5CF6] hover:text-white transition-all cursor-pointer shadow-2xs"
                  title="Mở Trợ lý Chatbot AI tư vấn thời trang"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Chatbot AI</span>
                </button>

                {/* AI Stylist */}
                <Link
                  to="/ai-stylist"
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all duration-150 select-none cursor-pointer',
                    activeTab === 'ai-stylist'
                      ? 'bg-[#7C3AED] text-white shadow-xs'
                      : 'text-[#7C3AED] bg-[#F3E8FF] hover:bg-[#7C3AED] hover:text-white'
                  )}
                  title="Mở Trợ lý AI Stylist tư vấn phong cách"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>AI Stylist</span>
                </Link>

                {/* Thử đồ AI */}
                <Link
                  to="/try-on"
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all duration-150 select-none cursor-pointer',
                    activeTab === 'try-on'
                      ? 'bg-[#8B5CF6] text-white shadow-xs'
                      : 'bg-zinc-900 text-white hover:bg-[#8B5CF6]'
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Thử đồ AI</span>
                </Link>

                {/* Bảng size */}
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('open_size_guide'))}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs uppercase tracking-wider font-bold text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-all cursor-pointer"
                  title="Tra cứu bảng kích thước chuẩn"
                >
                  <Ruler className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Bảng size</span>
                </button>
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Search Overlay Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white/95 backdrop-blur-md animate-fade-in p-4 sm:p-8">
          <div className="max-w-3xl mx-auto w-full">
            <div className="flex items-center justify-between pb-4 border-b border-[#E4E4E7]">
              <span className="text-xs uppercase font-bold tracking-widest text-[#71717A]">
                Tìm kiếm thời trang
              </span>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-2 text-[#71717A] hover:text-[#18181B] rounded-full hover:bg-black/5 cursor-pointer"
                aria-label="Đóng tìm kiếm"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="mt-8 relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập tên áo, quần baggy, phong cách hoặc phụ kiện..."
                className="w-full text-xl sm:text-2xl font-normal text-[#18181B] border-b-2 border-[#8B5CF6] bg-transparent pb-3 pr-12 focus:outline-none placeholder:text-[#A1A1AA]"
              />
              <button
                type="submit"
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[#8B5CF6] cursor-pointer"
                aria-label="Thực hiện tìm kiếm"
              >
                <Search className="w-6 h-6" />
              </button>
            </form>

            {/* Quick search tags */}
            <div className="mt-6">
              <span className="text-xs text-[#71717A]">Gợi ý tìm kiếm nhanh:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  'Áo thun Graphic',
                  'Quần Jeans Baggy',
                  'Cargo Parachute',
                  'Baby Tee',
                  'Dây chuyền Cuban',
                  'Hoodie Oversize',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSearchQuery(tag);
                      navigate(`/products?q=${encodeURIComponent(tag)}`);
                      setIsSearchOpen(false);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-[#F2F3F5] hover:bg-[#F3E8FF] hover:text-[#7C3AED] text-[#18181B] transition-colors cursor-pointer border border-[#E4E4E7]"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} />

      {/* Mobile Menu Drawer */}
      <Drawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        position="left"
        maxWidth="max-w-xs"
        title={<BrandLogo variant="compact" href={null} />}
      >
        <div className="space-y-6 text-sm">
          {/* Main Navigation matching Section 1 */}
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-[#71717A] px-2 py-1">
              Menu Chính
            </div>
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'block px-3.5 py-2.5 rounded-xl font-bold transition-colors text-xs uppercase tracking-wider',
                activeTab === 'home'
                  ? 'bg-[#8B5CF6] text-white shadow-xs'
                  : 'hover:bg-[#F2F3F5] text-[#18181B]'
              )}
            >
              Trang chủ
            </Link>
            <a
              href="/#san-pham-hot"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold hover:bg-[#F2F3F5] text-[#18181B] transition-colors text-xs uppercase tracking-wider"
            >
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                <span>Sản phẩm HOT</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </a>
            <Link
              to="/shop"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3.5 py-2.5 rounded-xl font-bold hover:bg-[#F2F3F5] text-[#18181B] transition-colors text-xs uppercase tracking-wider"
            >
              Shop
            </Link>
            <Link
              to="/shop"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl font-black bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white text-xs uppercase tracking-wider shadow-xs hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Khám phá thời trang</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-1 pt-4 border-t border-[#E4E4E7]">
            <div className="text-xs font-bold uppercase tracking-wider text-[#71717A] px-2 py-1">
              Danh mục trong Shop
            </div>
            <Link
              to="/shop?gender=nam"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'block px-3.5 py-2 rounded-lg font-medium transition-colors text-xs uppercase tracking-wider',
                activeTab === 'nam'
                  ? 'bg-[#8B5CF6] text-white shadow-xs'
                  : 'hover:bg-[#F2F3F5] text-[#18181B]'
              )}
            >
              Thời trang Nam
            </Link>
            <Link
              to="/shop?gender=nu"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'block px-3.5 py-2 rounded-lg font-medium transition-colors text-xs uppercase tracking-wider',
                activeTab === 'nu'
                  ? 'bg-[#8B5CF6] text-white shadow-xs'
                  : 'hover:bg-[#F2F3F5] text-[#18181B]'
              )}
            >
              Thời trang Nữ
            </Link>
            <Link
              to="/shop?category=phu-kien"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'block px-3.5 py-2 rounded-lg font-medium transition-colors text-xs uppercase tracking-wider',
                activeTab === 'phu-kien'
                  ? 'bg-[#8B5CF6] text-white shadow-xs'
                  : 'hover:bg-[#F2F3F5] text-[#18181B]'
              )}
            >
              Phụ kiện & Nón
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                window.dispatchEvent(new CustomEvent('open_ai_stylist'));
              }}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#F3E8FF] text-[#7C3AED] font-bold text-xs uppercase tracking-wider"
            >
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#8B5CF6]" />
                <span>Chatbot AI</span>
              </div>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
            <Link
              to="/try-on"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#18181B] text-white font-bold text-xs uppercase tracking-wider"
            >
              <span>Thử đồ AI</span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                window.dispatchEvent(new CustomEvent('open_size_guide'));
              }}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg hover:bg-[#F2F3F5] text-[#18181B] font-medium text-xs uppercase tracking-wider"
            >
              <span>Bảng size</span>
              <Ruler className="w-4 h-4 text-zinc-500" />
            </button>
          </div>

          <div className="space-y-1 pt-4 border-t border-[#E4E4E7]">
            <div className="text-xs font-bold uppercase tracking-wider text-[#71717A] px-2 py-1">
              Bộ sưu tập & Trải nghiệm
            </div>
            <Link
              to="/collections"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-[#F2F3F5] text-[#18181B] font-medium transition-colors"
            >
              Tất cả Bộ sưu tập
            </Link>
            <Link
              to="/ai-stylist"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#F3E8FF] text-[#7C3AED] font-semibold"
            >
              <span>Trợ lý AI Stylist</span>
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
            </Link>
            <Link
              to="/try-on"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#18181B] text-white font-semibold"
            >
              <span>Phòng Thử Đồ Ảo AI (Try-On)</span>
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
            </Link>
            <Link
              to="/compare"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-[#F2F3F5] text-[#18181B] transition-colors"
            >
              So sánh sản phẩm
            </Link>
            <Link
              to="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-[#F2F3F5] text-[#18181B] transition-colors"
            >
              Giới thiệu thương hiệu SMARTBUY
            </Link>
            <Link
              to="/size-guide"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-[#F2F3F5] text-[#18181B] transition-colors"
            >
              Bảng kích cỡ chuẩn
            </Link>
          </div>

          <div className="space-y-1 pt-4 border-t border-[#E4E4E7]">
            <div className="text-xs font-bold uppercase tracking-wider text-[#71717A] px-2 py-1">
              Tài khoản & Quản trị
            </div>
            {currentUser ? (
              <>
                <Link
                  to="/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg hover:bg-[#F2F3F5] text-[#18181B] transition-colors font-medium"
                >
                  Trung tâm tài khoản ({currentUser.name})
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg hover:bg-[#F2F3F5] text-[#18181B] transition-colors"
                >
                  Lịch sử đơn hàng
                </Link>
                {currentUser.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg font-semibold text-[#8B5CF6]"
                  >
                    Trang Quản trị (Admin)
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    MockRepo.logout();
                    setIsMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
                >
                  Đăng xuất tài khoản
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl font-bold bg-[#8B5CF6] text-white text-center shadow-xs"
              >
                Đăng nhập ngay
              </Link>
            )}

            {/* Mobile Performance Mode Toggle */}
            <div className="pt-3 border-t border-[#E4E4E7]/60 flex items-center justify-between px-2">
              <span className="text-xs text-[#71717A]">Hiệu năng hiển thị:</span>
              <PerformanceToggle />
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
};
