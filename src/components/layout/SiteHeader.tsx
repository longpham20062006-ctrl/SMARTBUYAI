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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Drawer } from '@/components/ui/drawer';
import { CartDrawer } from '@/components/common/CartDrawer';
import { BrandLogo } from '@/components/common/BrandLogo';
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
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const totalCartCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  // Smooth compacting header detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  // Xác định chính xác duy nhất 1 tab active theo route thực tế:
  const getActiveTab = (): 'home' | 'nam' | 'nu' | 'unisex' | 'phu-kien' | 'collections' | 'trending' | 'size-guide' | 'try-on' | null => {
    if (currentPath === '/') return 'home';
    if (currentPath === '/size-guide') return 'size-guide';
    if (currentPath === '/try-on' || currentPath.startsWith('/virtual-try-on')) return 'try-on';
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

          {/* Ở GIỮA: THANH TÌM KIẾM RÕ RÀNG, HIỆN ĐẠI (Desktop) */}
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

          {/* PHÍA PHẢI: TIỆN ÍCH MUA SẮM (Tài khoản, Wishlist, Giỏ hàng) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Mobile Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="lg:hidden p-2 text-[#18181B] hover:text-[#8B5CF6] rounded-full hover:bg-black/5 transition-colors cursor-pointer"
              title="Tìm kiếm sản phẩm"
              aria-label="Tìm kiếm sản phẩm"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* User Dropdown (Hiện trên tablet & desktop, mobile thao tác qua menu drawer) */}
            <div className="relative hidden sm:block" ref={userMenuRef}>
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

              {/* User Menu Content */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white shadow-elevated border border-[#E4E4E7] rounded-xl py-2 z-50 animate-fade-in text-xs">
                  <div className="px-4 py-2 border-b border-[#E4E4E7]">
                    <div className="font-bold text-[#18181B]">{currentUser.name}</div>
                    <div className="text-[11px] text-[#71717A] truncate">{currentUser.email}</div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-sm bg-[#F2F3F5] text-[#18181B] text-[10px] uppercase font-bold tracking-wider border border-[#E4E4E7]">
                      Vai trò: {currentUser.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/account"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-[#71717A] hover:bg-[#F2F3F5] hover:text-[#18181B] transition-colors"
                    >
                      Thông tin cá nhân & Địa chỉ
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-[#71717A] hover:bg-[#F2F3F5] hover:text-[#18181B] transition-colors"
                    >
                      Lịch sử đơn hàng
                    </Link>
                    <Link
                      to="/compare"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-[#71717A] hover:bg-[#F2F3F5] hover:text-[#18181B] transition-colors"
                    >
                      So sánh sản phẩm
                    </Link>
                  </div>

                  {/* Quản trị & Switch Role */}
                  <div className="border-t border-[#E4E4E7] pt-1 mt-1 bg-[#FAFAF8]">
                    <Link
                      to="/admin"
                      onClick={() => {
                        MockRepo.switchUser('admin');
                        setIsUserMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 font-semibold text-[#8B5CF6] hover:bg-[#F3E8FF] transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Vào trang Quản trị (Admin)</span>
                    </Link>

                    {/* Switch role toggle */}
                    <div className="px-4 py-2 flex items-center justify-between text-[11px] text-[#71717A]">
                      <span>Đổi vai trò demo:</span>
                      <button
                        onClick={() => {
                          const nextRole = currentUser.role === 'admin' ? 'customer' : 'admin';
                          MockRepo.switchUser(nextRole);
                        }}
                        className="text-[#8B5CF6] hover:underline font-semibold cursor-pointer"
                      >
                        {currentUser.role === 'admin' ? 'Chuyển về Khách' : 'Chuyển sang Admin'}
                      </button>
                    </div>

                    <Link
                      to="/login"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-[#DC2626] hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất phiên demo</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Wishlist Link */}
            <Link
              to="/products?sort=rating-desc"
              className="p-2 text-[#18181B] hover:text-[#8B5CF6] rounded-full hover:bg-black/5 transition-colors cursor-pointer hidden sm:flex items-center justify-center"
              title="Sản phẩm yêu thích"
              aria-label="Sản phẩm yêu thích"
            >
              <Heart className="w-5 h-5 text-[#18181B]" />
            </Link>

            {/* Cart Trigger with Real Badge */}
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
          </div>
        </div>

        {/* TẦNG 2: NAVIGATION MENU & DANH MỤC ĐIỀU HƯỚNG (Desktop) */}
        <div className="hidden lg:block border-t border-[#F2F3F5] bg-white">
          <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center justify-center gap-1.5 py-1.5">
              <Link to="/" className={getTabClass(activeTab === 'home')}>
                Trang chủ
              </Link>
              <Link to="/products?gender=nam" className={getTabClass(activeTab === 'nam')}>
                Nam
              </Link>
              <Link to="/products?gender=nu" className={getTabClass(activeTab === 'nu')}>
                Nữ
              </Link>
              <Link to="/products?gender=unisex" className={getTabClass(activeTab === 'unisex')}>
                Unisex
              </Link>
              <Link to="/products?category=phu-kien" className={getTabClass(activeTab === 'phu-kien')}>
                Phụ kiện
              </Link>

              {/* Mega Menu Dropdown Bộ sưu tập */}
              <div
                className="relative"
                onMouseEnter={() => setIsMegaMenuOpen(true)}
                onMouseLeave={() => setIsMegaMenuOpen(false)}
              >
                <button
                  className={cn(
                    'flex items-center gap-1 text-xs uppercase tracking-wider font-bold px-3.5 py-1.5 rounded-xl transition-all duration-150 cursor-pointer select-none',
                    activeTab === 'collections' || isMegaMenuOpen
                      ? 'bg-[#8B5CF6] text-white shadow-xs'
                      : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                  )}
                >
                  <span>Bộ sưu tập</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>

                {/* Mega menu box */}
                {isMegaMenuOpen && (
                  <div className="absolute top-full -left-20 w-[620px] bg-white shadow-modal border border-[#E4E4E7] rounded-2xl p-6 grid grid-cols-2 gap-6 animate-fade-in z-50">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#18181B] mb-3 border-b border-[#E4E4E7] pb-1.5">
                        Bộ sưu tập 2026
                      </h4>
                      <div className="space-y-1.5">
                        {GENZ_COLLECTIONS.map((c) => (
                          <Link
                            key={c.id}
                            to={`/collections/${c.slug}`}
                            onClick={() => setIsMegaMenuOpen(false)}
                            className="group block p-2 rounded-xl hover:bg-[#F3E8FF] transition-colors"
                          >
                            <div className="text-xs font-bold text-[#18181B] group-hover:text-[#7C3AED]">
                              {c.title}
                            </div>
                            <div className="text-[11px] text-[#71717A] line-clamp-1">{c.tagline}</div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#18181B] mb-3 border-b border-[#E4E4E7] pb-1.5">
                        Danh mục Streetwear
                      </h4>
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        {GENZ_CATEGORIES.map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/products?category=${cat.slug}`}
                            onClick={() => setIsMegaMenuOpen(false)}
                            className="p-1.5 text-[#71717A] hover:text-[#8B5CF6] hover:bg-[#F2F3F5] rounded-md transition-colors"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#E4E4E7]">
                        <Link
                          to="/collections"
                          onClick={() => setIsMegaMenuOpen(false)}
                          className="text-xs font-bold text-[#18181B] hover:text-[#8B5CF6] hover:underline flex items-center justify-between"
                        >
                          <span>Xem tất cả bộ sưu tập</span>
                          <span>→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link to="/products?sort=newest" className={getTabClass(activeTab === 'trending')}>
                Xu hướng
              </Link>
              <Link
                to="/try-on"
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 select-none cursor-pointer',
                  activeTab === 'try-on'
                    ? 'bg-[#8B5CF6] text-white shadow-xs'
                    : 'bg-[#F3E8FF] text-[#7C3AED] hover:bg-[#8B5CF6] hover:text-white'
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Thử đồ AI</span>
              </Link>
              <Link to="/size-guide" className={getTabClass(activeTab === 'size-guide')}>
                Giới thiệu
              </Link>
            </nav>
          </div>
        </div>
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
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-[#71717A] px-2 py-1">
              Khám phá thời trang
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
            <Link
              to="/products?gender=nam"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'block px-3.5 py-2.5 rounded-xl font-bold transition-colors text-xs uppercase tracking-wider',
                activeTab === 'nam'
                  ? 'bg-[#8B5CF6] text-white shadow-xs'
                  : 'hover:bg-[#F2F3F5] text-[#18181B]'
              )}
            >
              Thời trang Nam
            </Link>
            <Link
              to="/products?gender=nu"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'block px-3.5 py-2.5 rounded-xl font-bold transition-colors text-xs uppercase tracking-wider',
                activeTab === 'nu'
                  ? 'bg-[#8B5CF6] text-white shadow-xs'
                  : 'hover:bg-[#F2F3F5] text-[#18181B]'
              )}
            >
              Thời trang Nữ
            </Link>
            <Link
              to="/products?gender=unisex"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'block px-3.5 py-2.5 rounded-xl font-bold transition-colors text-xs uppercase tracking-wider',
                activeTab === 'unisex'
                  ? 'bg-[#8B5CF6] text-white shadow-xs'
                  : 'hover:bg-[#F2F3F5] text-[#18181B]'
              )}
            >
              Bộ sưu tập Unisex
            </Link>
            <Link
              to="/products?category=phu-kien"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'block px-3.5 py-2.5 rounded-xl font-bold transition-colors text-xs uppercase tracking-wider',
                activeTab === 'phu-kien'
                  ? 'bg-[#8B5CF6] text-white shadow-xs'
                  : 'hover:bg-[#F2F3F5] text-[#18181B]'
              )}
            >
              Phụ kiện & Nón
            </Link>
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
            <Link
              to="/account"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-[#F2F3F5] text-[#18181B] transition-colors"
            >
              Hồ sơ của tôi
            </Link>
            <Link
              to="/orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-[#F2F3F5] text-[#18181B] transition-colors"
            >
              Lịch sử đơn hàng
            </Link>
            <Link
              to="/admin"
              onClick={() => {
                MockRepo.switchUser('admin');
                setIsMobileMenuOpen(false);
              }}
              className="block px-3 py-2 rounded-lg font-semibold text-[#8B5CF6]"
            >
              Trang Quản trị (Admin)
            </Link>
          </div>
        </div>
      </Drawer>
    </>
  );
};
