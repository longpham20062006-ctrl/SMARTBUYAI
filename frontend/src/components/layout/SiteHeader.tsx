import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import {
  ShoppingBag,
  User as UserIcon,
  Search,
  Menu,
  X,
  Sparkles,
  Heart,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Drawer } from '@/components/ui/drawer';
import { CartDrawer } from '@/components/common/CartDrawer';

export const SiteHeader: React.FC = () => {
  useRepoSubscription(['cart', 'auth']);
  const cart = MockRepo.getCart();
  const currentUser = MockRepo.getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const totalCartCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  // Compact sticky header detection on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click or Escape
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

  // V4.0 - EXACTLY 6 MENU ITEMS: Trang chủ, Khám phá, Nam, Nữ, Phụ kiện, Thử đồ AI
  const navMenuItems = [
    { label: 'Trang chủ', path: '/', exact: true },
    { label: 'Khám phá', path: '/products' },
    { label: 'Nam', path: '/products?gender=nam' },
    { label: 'Nữ', path: '/products?gender=nu' },
    { label: 'Phụ kiện', path: '/products?category=phu-kien' },
    { label: 'Thử đồ AI', path: '/try-on', isAi: true },
  ];

  const isItemActive = (itemPath: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === '/' && !location.search;
    }
    const [path, query] = itemPath.split('?');
    if (query) {
      return location.pathname === path && location.search.includes(query);
    }
    return location.pathname === path && !location.search;
  };

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 w-full bg-white transition-all duration-200 border-b border-[#ECEAE7]',
          isScrolled ? 'shadow-subtle' : ''
        )}
      >
        {/* V4.0 - Announcement Bar (32-36px, #18181B, white text, no marquee) */}
        <div
          className={cn(
            'bg-[#18181B] text-white text-xs font-medium transition-all duration-200 overflow-hidden',
            isScrolled ? 'max-h-0 py-0 opacity-0' : 'h-8 sm:h-9 py-1.5 opacity-100'
          )}
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
            <div className="w-full text-center sm:text-left truncate text-[11px] sm:text-xs tracking-wide">
              <span>FREESHIP ĐƠN TỪ 299K | ĐỔI SIZE TRONG 15 NGÀY</span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-[#A8A29E] text-[11px] shrink-0 font-medium tracking-wider uppercase">
              <span>Mặc theo cách của bạn</span>
              <span className="text-[#ECEAE7]">•</span>
              <span>Korean Minimal Fashion</span>
            </div>
          </div>
        </div>

        {/* V4.0 - Main Header (68-76px on desktop) */}
        <div
          className={cn(
            'max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-all duration-200',
            isScrolled ? 'h-[64px]' : 'h-[68px] sm:h-[72px] lg:h-[76px]'
          )}
        >
          {/* Mobile menu trigger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-[#18181B] hover:text-[#78716C] transition-colors cursor-pointer"
              aria-label="Mở menu điều hướng"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Logo SMARTBUY AI ở bên trái */}
          <div className="flex items-center shrink-0 pr-4 lg:pr-8">
            <Link to="/" className="flex items-center gap-2 select-none group" aria-label="SMARTBUY AI Trang chủ">
              <span className="font-sans text-xl sm:text-2xl font-black tracking-tight text-[#18181B] group-hover:opacity-85 transition-opacity">
                SMARTBUY
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#18181B] text-white">
                AI
              </span>
            </Link>
          </div>

          {/* Menu ở giữa: 6 mục chuẩn */}
          <nav className="hidden lg:flex items-center justify-center gap-8 mx-auto">
            {navMenuItems.map((item) => {
              const active = isItemActive(item.path, item.exact);
              if (item.isAi) {
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150',
                      active
                        ? 'bg-[#F3E8FF] text-[#7C3AED] font-bold border border-[#DDD6FE]'
                        : 'text-[#78716C] hover:text-[#7C3AED] hover:bg-[#F3E8FF]/60'
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span>{item.label}</span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={cn(
                    'text-xs tracking-normal transition-all duration-150 relative py-1.5',
                    active
                      ? 'text-[#18181B] font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#18181B]'
                      : 'text-[#78716C] font-medium hover:text-[#18181B]'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Các icon ở bên phải: Search, Account, Wishlist, Shopping Bag */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-[#18181B] hover:text-[#78716C] rounded-full hover:bg-[#F0EFED] transition-colors cursor-pointer"
              title="Tìm kiếm"
              aria-label="Tìm kiếm sản phẩm"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist */}
            <Link
              to="/account?tab=wishlist"
              className="p-2 text-[#18181B] hover:text-[#78716C] rounded-full hover:bg-[#F0EFED] transition-colors cursor-pointer"
              title="Danh sách yêu thích"
              aria-label="Danh sách yêu thích"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Account */}
            <div className="relative" ref={userMenuRef}>
              {currentUser ? (
                <div>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-[#F0EFED] transition-colors cursor-pointer"
                    title={currentUser.name}
                    aria-label="Tài khoản người dùng"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#18181B] text-white flex items-center justify-center font-bold text-xs uppercase">
                      {currentUser.name.charAt(0)}
                    </div>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white shadow-modal border border-[#ECEAE7] rounded-xl py-2 z-50 animate-fade-in">
                      <div className="px-4 py-2 border-b border-[#ECEAE7]">
                        <div className="font-bold text-xs text-[#18181B] truncate">{currentUser.name}</div>
                        <div className="text-[11px] text-[#78716C] truncate">{currentUser.email}</div>
                      </div>
                      <Link
                        to="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-xs text-[#18181B] hover:bg-[#F0EFED] transition-colors"
                      >
                        Thông tin tài khoản
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-xs text-[#18181B] hover:bg-[#F0EFED] transition-colors"
                      >
                        Lịch sử đơn hàng
                      </Link>
                      {currentUser.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-xs text-[#7C3AED] font-semibold hover:bg-[#F3E8FF] transition-colors"
                        >
                          Trang Quản trị (Admin)
                        </Link>
                      )}
                      <div className="border-t border-[#ECEAE7] my-1" />
                      <button
                        onClick={() => {
                          MockRepo.logout();
                          navigate('/login');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-[#B91C1C] hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#ECEAE7] hover:border-[#18181B] text-xs font-semibold text-[#18181B] transition-colors"
                  aria-label="Đăng nhập"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Đăng nhập</span>
                </Link>
              )}
            </div>

            {/* Shopping Bag */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="p-2 text-[#18181B] hover:text-[#78716C] rounded-full hover:bg-[#F0EFED] transition-colors relative cursor-pointer"
              title="Túi mua sắm"
              aria-label={`Túi mua sắm (${totalCartCount} món)`}
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#18181B] text-white text-[10px] font-bold flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Overlay */}
        {isSearchOpen && (
          <div className="border-t border-[#ECEAE7] bg-[#F7F7F6] px-4 py-3 sm:py-4 animate-fade-in">
            <div className="max-w-[720px] mx-auto">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="w-4 h-4 text-[#A8A29E] absolute left-3.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm áo sơ mi, áo thun, hoodie, phụ kiện..."
                  className="w-full bg-white border border-[#ECEAE7] focus:border-[#18181B] rounded-full pl-10 pr-10 py-2.5 text-xs sm:text-sm text-[#18181B] focus:outline-none placeholder:text-[#A8A29E]"
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-3 text-[#A8A29E] hover:text-[#18181B] p-1 cursor-pointer"
                  aria-label="Đóng tìm kiếm"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Drawer */}
      <Drawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        position="left"
        maxWidth="max-w-xs"
        title="SMARTBUY AI"
      >
        <div className="py-2 flex flex-col justify-between h-full">
          <div className="space-y-1">
            {navMenuItems.map((item) => {
              const active = isItemActive(item.path, item.exact);
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors',
                    active
                      ? 'bg-[#F0EFED] text-[#18181B] font-bold'
                      : 'text-[#78716C] hover:text-[#18181B] hover:bg-[#F7F7F6]'
                  )}
                >
                  <span className="flex items-center gap-2">
                    {item.isAi && <Sparkles className="w-4 h-4 text-[#7C3AED]" />}
                    {item.label}
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-40" />
                </Link>
              );
            })}
          </div>

          <div className="pt-6 border-t border-[#ECEAE7] mt-6 space-y-3">
            {currentUser ? (
              <div className="p-3 rounded-xl bg-[#F0EFED] text-xs space-y-2">
                <div className="font-bold text-[#18181B]">{currentUser.name}</div>
                <div className="text-[#78716C]">{currentUser.email}</div>
                <button
                  onClick={() => {
                    MockRepo.logout();
                    navigate('/login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-[#B91C1C] font-semibold text-xs mt-1 block"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 bg-[#18181B] text-white text-xs font-bold rounded-xl text-center block"
              >
                Đăng nhập / Đăng ký
              </Link>
            )}
          </div>
        </div>
      </Drawer>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} />
    </>
  );
};
