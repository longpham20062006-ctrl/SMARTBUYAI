import React, { useState, useRef, useLayoutEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Package,
  FolderTree,
  Tag,
  Boxes,
  ClipboardList,
  Users,
  ShieldCheck,
  RotateCcw,
  Menu,
  X,
  Search,
  LogOut,
  DollarSign,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { MockRepo } from '@/mocks/repository';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { BrandLogo } from '@/components/common/BrandLogo';
import { safeSessionStorage } from '@/lib/storage';

export const AdminLayout: React.FC = () => {
  useRepoSubscription(['products', 'orders', 'inventory', 'auth']);
  const currentUser = MockRepo.getCurrentUser();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const mainContentRef = useRef<HTMLElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { success } = useToast();

  // Scroll to top of both window and admin main scroll container on route change
  useLayoutEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
      mainContentRef.current.scrollLeft = 0;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  const handleConfirmReset = () => {
    MockRepo.resetAll();
    setShowResetConfirm(false);
    success('Đã khôi phục dữ liệu demo', 'Toàn bộ danh mục và tồn kho đã trở về mặc định.');
  };

  const handleLogout = () => {
    safeSessionStorage.setItem('sb_logging_out', '1');
    safeSessionStorage.removeItem('sb_token');
    MockRepo.logout();
    navigate('/', { replace: true });
  };

  const getPageTitle = (path: string): string => {
    if (path.includes('/admin/products/new')) return 'Thêm sản phẩm mới';
    if (path.includes('/admin/products') && path.includes('/edit')) return 'Chỉnh sửa sản phẩm';
    if (path.includes('/admin/products')) return 'Quản lý sản phẩm';
    if (path.includes('/admin/categories')) return 'Quản lý danh mục';
    if (path.includes('/admin/inventory')) return 'Quản lý tồn kho';
    if (path.includes('/admin/orders')) return 'Quản lý đơn hàng';
    if (path.includes('/admin/users') || path.includes('/admin/customers')) return 'Quản lý khách hàng';
    if (path.includes('/admin/pricing')) return 'Bảng giá & Doanh thu';
    if (path.includes('/admin/brands')) return 'Quản lý thương hiệu';
    return 'Tổng quan Dashboard';
  };

  const navMenuItems = [
    { to: '/admin/dashboard', label: 'Tổng quan Dashboard', icon: Home, end: true },
    { to: '/admin/products', label: 'Quản lý sản phẩm', icon: Package },
    { to: '/admin/categories', label: 'Quản lý danh mục', icon: FolderTree },
    { to: '/admin/inventory', label: 'Quản lý tồn kho', icon: Boxes },
    { to: '/admin/orders', label: 'Quản lý đơn hàng', icon: ClipboardList },
    { to: '/admin/users', label: 'Quản lý khách hàng', icon: Users },
    { to: '/admin/pricing', label: 'Bảng giá & Doanh thu', icon: DollarSign },
    { to: '/admin/brands', label: 'Thương hiệu đối tác', icon: Tag },
  ];

  return (
    <div className="min-h-screen bg-[#F4F4F5]/60 flex text-[#18181B] font-sans">
      <ScrollToTop />

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* 1. THANH ĐIỀU HƯỚNG BÊN TRÁI (SIDEBAR ADMIN ĐỘC LẬP)                     */}
      {/* ========================================================================= */}
      <aside
        data-testid="admin-sidebar"
        aria-label="Admin Navigation Sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E4E4E7] flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full overflow-y-auto scrollbar-none p-4 space-y-4">
          {/* Top Logo (Bấm logo chuyển thẳng về /admin/dashboard) */}
          <div className="flex items-center justify-between pb-1 px-1">
            <BrandLogo variant="compact" href="/admin/dashboard" />

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 text-[#71717A] hover:text-[#18181B] rounded-lg cursor-pointer"
              aria-label="Đóng menu sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin System Badge */}
          <div className="p-2.5 rounded-2xl bg-[#09090B] text-white border border-[#27272A] flex items-center justify-between select-none">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#18F4FC]/20 border border-[#18F4FC]/40 flex items-center justify-center text-[#18F4FC] shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">SMARTBUY ADMIN</div>
                <div className="text-[10px] text-[#A1A1AA] truncate">Bảng Quản Trị Hệ Thống</div>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Trực tuyến" />
          </div>

          {/* Quick Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm nhanh dữ liệu..."
              readOnly
              onClick={() => navigate('/admin/products')}
              className="w-full bg-[#F4F4F5] border border-transparent rounded-xl pl-9 pr-9 py-2 text-xs text-[#18181B] placeholder-[#71717A] focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#71717A] bg-white border border-[#E4E4E7] px-1.5 py-0.5 rounded shadow-2xs">
              ⌘K
            </span>
          </div>

          {/* Nav Section: Menu Quản trị */}
          <nav className="space-y-1 pt-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] px-2.5 py-1">
              Chức năng Quản trị
            </div>
            {navMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${isActive
                      ? 'bg-[#18181B] text-white shadow-subtle'
                      : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Nav Section: Hệ thống */}
          <div className="space-y-1 pt-2 border-t border-[#E4E4E7]/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] px-2.5 py-1">
              Hệ thống &amp; Dữ liệu
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Khôi phục Dữ liệu Gốc</span>
            </button>
          </div>

          <div className="flex-1" />

          {/* Bottom Admin User Card & Logout */}
          <div className="pt-3 border-t border-[#E4E4E7]/80 space-y-2">
            <div className="p-2.5 rounded-xl bg-[#F4F4F5] flex items-center gap-3">
              <img
                src={
                  currentUser?.avatar ||
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
                }
                alt="Admin Avatar"
                className="w-9 h-9 rounded-full object-cover shrink-0 border border-white shadow-2xs"
              />
              <div className="truncate min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#18181B] truncate">
                    {currentUser?.name || 'Administrator'}
                  </span>
                  <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 text-[9px] font-extrabold rounded">
                    ADMIN
                  </span>
                </div>
                <div className="text-[11px] text-[#71717A] truncate">
                  {currentUser?.email || 'admin.test@smartbuy.local'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-rose-600 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200/70 transition-colors cursor-pointer font-bold text-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất Quản trị</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. KHUNG NỘI DUNG CHÍNH & THANH TRÊN CÙNG (TOP BAR)                      */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* THANH TRÊN CÙNG (TOP BAR CHUYÊN NGHIỆP) */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E4E4E7] px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Sidebar Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-[#18181B] hover:text-[#8B5CF6] hover:bg-[#F4F4F5] rounded-xl cursor-pointer"
              aria-label="Mở menu quản trị"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Current Page Title */}
            <div>
              <h1 className="text-sm sm:text-base font-bold text-[#18181B] truncate">
                {getPageTitle(pathname)}
              </h1>
              <p className="text-[11px] text-[#71717A] hidden sm:block font-medium">
                SMARTBUY AI &bull; Cổng Điều Hành Quản Trị Hệ Thống
              </p>
            </div>
          </div>

          {/* Right Header Status & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Server Status Pill */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hệ thống: Trực tuyến</span>
            </div>

            {/* Admin User Chip */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#F4F4F5] border border-[#E4E4E7] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#18F4FC] shrink-0" />
              <span className="hidden md:inline font-bold text-[#18181B]">
                {currentUser?.name || 'Admin'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#18181B] text-white text-[10px] font-mono font-bold">
                ROLE_ADMIN
              </span>
            </div>

            {/* Quick Logout Header Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer border border-transparent hover:border-rose-200"
              title="Đăng xuất khỏi hệ thống quản trị"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main
          ref={mainContentRef}
          id="admin-main-scroll"
          data-admin-main="true"
          className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto"
        >
          <Outlet />
        </main>
      </div>

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleConfirmReset}
        title="Khôi phục dữ liệu ban đầu?"
        message="Hành động này sẽ thiết lập lại toàn bộ sản phẩm, danh mục, tồn kho và đơn hàng mô phỏng về trạng thái gốc."
        confirmText="Xác nhận khôi phục"
        cancelText="Hủy bỏ"
        isDestructive={true}
      />
    </div>
  );
};
