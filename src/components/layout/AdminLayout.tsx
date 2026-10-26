import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  Home,
  Package,
  FolderTree,
  Tag,
  Boxes,
  ClipboardList,
  Users,
  Store,
  RotateCcw,
  Menu,
  X,
  ChevronsUpDown,
  Search,
  Settings,
  LogOut,
  ExternalLink,
  DollarSign,
} from 'lucide-react';
import { MockRepo } from '@/mocks/repository';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { BrandLogo } from '@/components/common/BrandLogo';

export const AdminLayout: React.FC = () => {
  useRepoSubscription(['products', 'orders', 'inventory', 'auth']);
  const currentUser = MockRepo.getCurrentUser();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { success } = useToast();

  const handleConfirmReset = () => {
    MockRepo.resetAll();
    setShowResetConfirm(false);
    success('Đã khôi phục dữ liệu demo', 'Toàn bộ danh mục và tồn kho đã trở về mặc định.');
  };

  const navMenuItems = [
    { to: '/admin', label: 'Home', icon: Home, end: true },
    { to: '/admin/products', label: 'Catalog', icon: Package },
    { to: '/admin/pricing', label: 'Bảng giá Nam', icon: DollarSign },
    { to: '/admin/categories', label: 'Danh mục', icon: FolderTree },
    { to: '/admin/brands', label: 'Thương hiệu', icon: Tag },
    { to: '/admin/orders', label: 'Đơn hàng', icon: ClipboardList },
    { to: '/admin/users', label: 'Customers', icon: Users },
    { to: '/admin/inventory', label: 'Quản lý kho', icon: Boxes },
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

      {/* SIDEBAR BÊN TRÁI (THEO ẢNH SỐ 2) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E4E4E7] flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto scrollbar-none p-4 space-y-4">
          {/* Top Logo & Switcher */}
          <div className="flex items-center justify-between pb-1 px-1">
            <BrandLogo variant="compact" href="/admin" />

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 text-[#71717A] hover:text-[#18181B] rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Store Switcher Pill (Như 'Viob Shop' trong ảnh tham khảo) */}
          <div className="p-2.5 rounded-2xl bg-[#F4F4F5] border border-[#E4E4E7]/70 flex items-center justify-between hover:bg-[#E4E4E7]/60 transition-colors cursor-pointer select-none">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white border border-[#E4E4E7] flex items-center justify-center text-[#18181B] shadow-2xs shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-[#18181B] truncate">SMARTBUY Store</div>
                <div className="text-[10px] text-[#71717A] truncate">Flagship Streetwear</div>
              </div>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-[#71717A] shrink-0" />
          </div>

          {/* Search Box with ⌘K Indicator */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search"
              readOnly
              onClick={() => navigate('/admin/products')}
              className="w-full bg-[#F4F4F5] border border-transparent rounded-xl pl-9 pr-9 py-2 text-xs text-[#18181B] placeholder-[#71717A] focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#71717A] bg-white border border-[#E4E4E7] px-1.5 py-0.5 rounded shadow-2xs">
              ⌘K
            </span>
          </div>

          {/* Nav Section: Menu */}
          <nav className="space-y-1 pt-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] px-2.5 py-1">
              Menu
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
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
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

          {/* Nav Section: Sales Channels */}
          <div className="space-y-1 pt-2 border-t border-[#E4E4E7]/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] px-2.5 py-1">
              Sales Channels
            </div>
            <Link
              to="/"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Store className="w-4 h-4" />
                <span>Online Store</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#A1A1AA]" />
            </Link>
          </div>

          {/* Nav Section: Hệ thống & Demo */}
          <div className="space-y-1 pt-2 border-t border-[#E4E4E7]/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] px-2.5 py-1">
              Hệ thống
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Dữ liệu Demo</span>
            </button>
          </div>

          <div className="flex-1" />

          {/* Bottom User Card (Như Jenny Wilson trong ảnh tham khảo) */}
          <div className="pt-3 border-t border-[#E4E4E7]/80 space-y-2">
            <div className="p-2 rounded-xl bg-[#F4F4F5] flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                alt="Jenny Wilson"
                className="w-9 h-9 rounded-full object-cover shrink-0 border border-white shadow-2xs"
              />
              <div className="truncate min-w-0">
                <div className="text-xs font-bold text-[#18181B] truncate">{currentUser.name || 'Admin Master'}</div>
                <div className="text-[11px] text-[#71717A] truncate">admin@smartbuy.vn</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[11px] font-semibold text-[#71717A]">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  MockRepo.switchUser('customer');
                  navigate('/');
                }}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Admin</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Dynamic page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Mobile top trigger */}
          <div className="lg:hidden flex items-center justify-between pb-4 mb-4 border-b border-[#E4E4E7]">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-[#18181B] hover:text-[#8B5CF6] rounded-lg cursor-pointer"
              aria-label="Mở menu quản trị"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-xs uppercase tracking-wider text-[#71717A]">SMARTBUY ADMIN</span>
          </div>

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
