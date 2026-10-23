import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
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
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollYRef = useRef(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const totalCartCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  // Smart scrolling header detection
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setIsScrolled(currentY > 30);

      if (currentY > 120) {
        if (currentY > lastScrollYRef.current + 8) {
          setIsHidden(true); // scrolling down
        } else if (currentY < lastScrollYRef.current - 8) {
          setIsHidden(false); // scrolling up
        }
      } else {
        setIsHidden(false);
      }
      lastScrollYRef.current = currentY;
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

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-xs uppercase tracking-wider font-semibold transition-colors hover:text-[#8B5CF6] relative py-2 ${
      isActive
        ? 'text-[#18181B] font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#8B5CF6]'
        : 'text-[#71717A]'
    }`;

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 w-full border-b border-[#E4E4E7] bg-[#FAFAF8]/95 backdrop-blur-md transition-all duration-300',
          isHidden ? '-translate-y-full' : 'translate-y-0',
          isScrolled ? 'shadow-subtle' : ''
        )}
      >
        {/* Top announcement bar */}
        <div className="bg-[#18181B] text-white text-[11px] py-1.5 px-4 font-medium border-b border-[#27272A]">
          <div className="max-w-container mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-[#8B5CF6] text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm tracking-wider">
                NEW DROP
              </span>
              <span className="text-[#D4D4D8]">FREESHIP ĐƠN TỪ 299K • ĐỔI SIZE 15 NGÀY TẬN NƠI</span>
            </div>
            <div className="hidden md:flex items-center gap-4 text-[#A1A1AA]">
              <span>MẶC CHẤT THEO CÁCH RIÊNG</span>
              <span className="text-[#8B5CF6] font-semibold">YOUR FIT. YOUR RULES.</span>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <div
          className={cn(
            'max-w-container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-all duration-300',
            isScrolled ? 'h-16' : 'h-18 sm:h-20'
          )}
        >
          {/* Mobile menu trigger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-[#18181B] hover:text-[#8B5CF6] transition-colors cursor-pointer"
              aria-label="Mở menu điều hướng"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* LOGO THƯƠNG HIỆU (Góc trái riêng biệt, phóng to 35-40%) */}
          <div className="flex items-center shrink-0 pr-4 lg:pr-8">
            <Link to="/" className="flex flex-col items-start select-none group" aria-label="SMARTBUY AI Trang chủ">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-sans text-2xl sm:text-3xl font-black tracking-tighter text-[#18181B] group-hover:text-[#8B5CF6] transition-colors">
                  SMARTBUY
                </span>
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#8B5CF6] text-white shadow-subtle">
                  AI
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.25em] text-[#71717A] mt-1 hidden sm:inline">
                PREMIUM STREETWEAR
              </span>
            </Link>
          </div>

          {/* Ở GIỮA: DESKTOP NAVIGATION (NAM | NỮ | UNISEX | PHỤ KIỆN | BỘ SƯU TẬP | BẢNG KÍCH CỠ) */}
          <nav className="hidden lg:flex items-center justify-center gap-8 mx-auto">
            <NavLink to="/products?gender=nam" className={navLinkClass}>
              Nam
            </NavLink>
            <NavLink to="/products?gender=nu" className={navLinkClass}>
              Nữ
            </NavLink>
            <NavLink to="/products?gender=unisex" className={navLinkClass}>
              Unisex
            </NavLink>
            <NavLink to="/products?category=phu-kien" className={navLinkClass}>
              Phụ kiện
            </NavLink>

            {/* Mega Menu Dropdown Bộ sưu tập */}
            <div
              className="relative"
              onMouseEnter={() => setIsMegaMenuOpen(true)}
              onMouseLeave={() => setIsMegaMenuOpen(false)}
            >
              <button className="flex items-center gap-1 text-xs uppercase tracking-wider font-semibold text-[#71717A] hover:text-[#8B5CF6] py-2 cursor-pointer transition-colors">
                <span>Bộ sưu tập</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
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

            <NavLink to="/products?sort=newest" className={navLinkClass}>
              Xu hướng
            </NavLink>
            <NavLink to="/size-guide" className={navLinkClass}>
              Bảng kích cỡ
            </NavLink>
            <NavLink
              to="/try-on"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#8B5CF6] text-white shadow-sm'
                    : 'bg-[#F3E8FF] text-[#7C3AED] hover:bg-[#8B5CF6] hover:text-white'
                }`
              }
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Thử đồ AI</span>
            </NavLink>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-[#18181B] hover:text-[#8B5CF6] rounded-full hover:bg-black/5 transition-colors cursor-pointer"
              title="Tìm kiếm sản phẩm"
              aria-label="Tìm kiếm sản phẩm"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* User Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-2 text-[#18181B] hover:text-[#8B5CF6] rounded-full hover:bg-black/5 transition-colors flex items-center gap-1 cursor-pointer"
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
        title={
          <div className="flex items-center gap-2">
            <span className="font-sans text-lg font-black tracking-tighter text-[#18181B]">SMARTBUY</span>
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-[#8B5CF6] text-white">AI</span>
          </div>
        }
      >
        <div className="space-y-6 text-sm">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-[#71717A] px-2 py-1">
              Khám phá theo giới
            </div>
            <Link
              to="/products?gender=nam"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-[#F2F3F5] text-[#18181B] font-medium transition-colors"
            >
              Thời trang Nam
            </Link>
            <Link
              to="/products?gender=nu"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-[#F2F3F5] text-[#18181B] font-medium transition-colors"
            >
              Thời trang Nữ
            </Link>
            <Link
              to="/products?gender=unisex"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-[#F2F3F5] text-[#18181B] font-medium transition-colors"
            >
              Bộ sưu tập Unisex
            </Link>
            <Link
              to="/products?category=phu-kien"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-[#F2F3F5] text-[#18181B] font-medium transition-colors"
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
