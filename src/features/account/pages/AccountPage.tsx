import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { SizeCode, Order, OrderStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import { formatPrice, formatDate } from '@/lib/utils';
import {
  User as UserIcon,
  MapPin,
  Heart,
  ShoppingBag,
  PackageCheck,
  Truck,
  ShieldCheck,
  LogOut,
  Clock,
  Sparkles,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Save,
  ArrowRight,
  Lock,
  Layers,
  Shirt,
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  useRepoSubscription(['auth', 'cart', 'orders', 'wishlist']);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const currentUser = MockRepo.getCurrentUser();
  const cart = MockRepo.getCart();
  const allOrders = MockRepo.getOrders();
  const allProducts = MockRepo.getProducts();
  const wishlistIds = MockRepo.getWishlist();

  // Active tab state
  type TabType =
    | 'overview'
    | 'profile'
    | 'cart'
    | 'orders'
    | 'tracking'
    | 'wishlist'
    | 'addresses'
    | 'preferences'
    | 'security';

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Filter orders for the current user
  const userOrders = allOrders.filter(
    (o) => o.userId === currentUser?.id || o.customerEmail.toLowerCase() === currentUser?.email.toLowerCase()
  );

  // Selected order for tracking tab
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order>(
    userOrders[0] || allOrders[0]
  );

  // Form states: Profile
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');

  // Address states
  const [addresses, setAddresses] = useState(
    currentUser?.savedAddresses && currentUser.savedAddresses.length > 0
      ? currentUser.savedAddresses
      : [
          {
            fullName: currentUser?.name || 'Khách hàng',
            phone: currentUser?.phone || '0901234567',
            email: currentUser?.email || 'khachhang@smartbuy.vn',
            province: 'Thành phố Hồ Chí Minh',
            district: 'Quận 1',
            ward: 'Phường Bến Nghé',
            street: 'Số 45 Đường Lê Duẩn, Căn hộ 12B',
            note: 'Giao giờ hành chính',
          },
        ]
  );

  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddrFullName, setNewAddrFullName] = useState(currentUser?.name || '');
  const [newAddrPhone, setNewAddrPhone] = useState(currentUser?.phone || '');
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [newAddrDistrict, setNewAddrDistrict] = useState('');
  const [newAddrProvince, setNewAddrProvince] = useState('Thành phố Hồ Chí Minh');

  // Preferences
  const [preferredSizes, setPreferredSizes] = useState<SizeCode[]>(
    currentUser?.preferences?.preferredSizes || ['M', 'L']
  );
  const [heightCm, setHeightCm] = useState(172);
  const [weightKg, setWeightKg] = useState(64);
  const [preferredFit, setPreferredFit] = useState('Oversize');
  const [preferredStyles, setPreferredStyles] = useState<string[]>(
    currentUser?.preferences?.preferredStyles || ['Streetwear', 'Tối giản']
  );

  // Security: Password form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Wishlist products
  const wishlistProducts = allProducts.filter((p) => wishlistIds.includes(p.id));

  // Handlers
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError('Lỗi cập nhật', 'Vui lòng nhập họ và tên');
      return;
    }
    MockRepo.updateUserProfile({
      name,
      phone,
      email,
      avatar,
    });
    success('Đã lưu thông tin tài khoản', 'Hồ sơ cá nhân đã được đồng bộ thành công.');
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrStreet.trim() || !newAddrDistrict.trim()) {
      toastError('Lỗi địa chỉ', 'Vui lòng nhập đầy đủ địa chỉ số nhà và quận huyện');
      return;
    }
    const updated = [
      ...addresses,
      {
        fullName: newAddrFullName,
        phone: newAddrPhone,
        email: currentUser?.email || '',
        province: newAddrProvince,
        district: newAddrDistrict,
        ward: 'Phường trung tâm',
        street: newAddrStreet,
      },
    ];
    setAddresses(updated);
    MockRepo.updateUserProfile({ savedAddresses: updated });
    setIsAddingAddress(false);
    setNewAddrStreet('');
    setNewAddrDistrict('');
    success('Đã thêm địa chỉ nhận hàng mới');
  };

  const handleDeleteAddress = (index: number) => {
    const updated = addresses.filter((_, idx) => idx !== index);
    setAddresses(updated);
    MockRepo.updateUserProfile({ savedAddresses: updated });
    success('Đã xóa địa chỉ');
  };

  const handleSavePreferences = () => {
    MockRepo.updateUserProfile({
      preferences: {
        gender: currentUser?.preferences?.gender || 'unisex',
        preferredSizes,
        preferredStyles,
      },
    });
    success('Đã lưu thông số thời trang', 'Trợ lý AI Stylist sẽ tự động cá nhân hóa theo các số đo này.');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toastError('Lỗi mật khẩu', 'Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('Lỗi xác nhận', 'Mật khẩu xác nhận không khớp');
      return;
    }
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    success('Đổi mật khẩu thành công', 'Mật khẩu mới của bạn đã có hiệu lực.');
  };

  const handleLogout = () => {
    MockRepo.logout();
    success('Đã đăng xuất tài khoản', 'Hẹn gặp lại bạn tại SMARTBUY AI!');
    navigate('/login');
  };

  const toggleSize = (size: SizeCode) => {
    setPreferredSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleStyle = (style: string) => {
    setPreferredStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="pending">Chờ duyệt</Badge>;
      case 'CONFIRMED':
        return <Badge variant="forest">Đã duyệt</Badge>;
      case 'PROCESSING':
        return <Badge variant="terracotta">Đang đóng gói</Badge>;
      case 'SHIPPED':
        return <Badge variant="outline">Đang giao</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Hoàn thành</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Đã hủy</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const navTabs = [
    { id: 'overview', label: 'Tổng quan tài khoản', icon: Layers },
    { id: 'profile', label: 'Thông tin cá nhân', icon: UserIcon },
    { id: 'cart', label: `Giỏ hàng của tôi (${cart.items.length})`, icon: ShoppingBag },
    { id: 'orders', label: `Đơn hàng của tôi (${userOrders.length})`, icon: PackageCheck },
    { id: 'tracking', label: 'Theo dõi đơn hàng', icon: Truck },
    { id: 'wishlist', label: `Sản phẩm yêu thích (${wishlistProducts.length})`, icon: Heart },
    { id: 'addresses', label: 'Sổ địa chỉ giao hàng', icon: MapPin },
    { id: 'preferences', label: 'Gu & Size thời trang', icon: Shirt },
    { id: 'security', label: 'Bảo mật & Đăng xuất', icon: ShieldCheck },
  ];

  if (!currentUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 space-y-4">
        <AlertCircle className="w-12 h-12 text-[#8B5CF6]" />
        <h2 className="text-xl font-bold">Vui lòng đăng nhập để xem trang này</h2>
        <Link to="/login">
          <Button variant="primary">Đăng nhập ngay</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* 1. TOP MEMBER HERO BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#8B5CF6]/20 to-transparent pointer-events-none" />

        <div className="flex items-center gap-4 sm:gap-6 z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-zinc-800 border-2 border-[#8B5CF6] shadow-lg shrink-0">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-[#8B5CF6]">
                {currentUser.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{currentUser.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8B5CF6]/30 text-[#DDD6FE] border border-[#8B5CF6]/40 uppercase tracking-wider">
                {currentUser.role === 'admin' ? 'Quản trị viên' : 'VIP Gold Member'}
              </span>
            </div>
            <p className="text-xs text-zinc-400">{currentUser.email} • {currentUser.phone || '0901234567'}</p>
            <div className="flex items-center gap-4 text-[11px] text-zinc-400 pt-1">
              <span>Tham gia: Tháng 1/2026</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Tài khoản đã xác thực
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto z-10">
          {currentUser.role === 'admin' && (
            <Link to="/admin">
              <Button variant="secondary" size="sm" className="rounded-xl text-xs font-bold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
                Vào Dashboard Quản trị
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="rounded-xl text-xs font-bold border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-800"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
            Đăng xuất
          </Button>
        </div>
      </div>

      {/* 2. MAIN GRID: 9-TAB SIDEBAR (4 COLUMNS) + CONTENT VIEW (8 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SIDEBAR TABS */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-4 border border-[#E4E4E7] shadow-subtle space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA] px-3 py-2">
            Danh mục tài khoản
          </div>

          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#18181B] text-white shadow-xs font-bold'
                    : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#8B5CF6]' : 'text-[#71717A]'}`} />
                  <span>{tab.label}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#A1A1AA]'}`} />
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT BOX */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-[#E4E4E7] shadow-subtle min-h-[500px]">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-[#E4E4E7] pb-4">
                <h2 className="text-xl font-bold text-[#18181B]">Tổng quan hoạt động tài khoản</h2>
                <p className="text-xs text-[#71717A] mt-1">
                  Xem nhanh thống kê giỏ hàng, đơn hàng và các đặc quyền thành viên của bạn.
                </p>
              </div>

              {/* 5 KPI Mini Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E4E4E7]">
                  <div className="text-[11px] font-medium text-[#71717A]">Tổng số đơn hàng</div>
                  <div className="text-2xl font-black text-[#18181B] mt-1">{userOrders.length}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Tích lũy trọn đời</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E4E4E7]">
                  <div className="text-[11px] font-medium text-[#71717A]">Đang vận chuyển</div>
                  <div className="text-2xl font-black text-[#8B5CF6] mt-1">
                    {userOrders.filter((o) => o.orderStatus === 'SHIPPED' || o.orderStatus === 'PROCESSING').length}
                  </div>
                  <div className="text-[10px] text-[#71717A] mt-0.5">Đơn hàng đang xử lý</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E4E4E7]">
                  <div className="text-[11px] font-medium text-[#71717A]">Đã giao thành công</div>
                  <div className="text-2xl font-black text-emerald-600 mt-1">
                    {userOrders.filter((o) => o.orderStatus === 'COMPLETED').length}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Tỷ lệ nhận 100%</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E4E4E7]">
                  <div className="text-[11px] font-medium text-[#71717A]">Sản phẩm yêu thích</div>
                  <div className="text-2xl font-black text-rose-500 mt-1">{wishlistProducts.length}</div>
                  <div className="text-[10px] text-[#71717A] mt-0.5">Trong danh sách lưu</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E4E4E7] col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-medium text-[#71717A]">Món trong giỏ hàng</div>
                  <div className="text-2xl font-black text-[#18181B] mt-1">{cart.items.length}</div>
                  <div className="text-[10px] text-[#8B5CF6] font-semibold mt-0.5">
                    Tổng: {formatPrice(cart.total)}
                  </div>
                </div>
              </div>

              {/* Quick Order Banner */}
              {userOrders.length > 0 && (
                <div className="p-5 rounded-2xl bg-[#F3E8FF]/60 border border-[#8B5CF6]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#8B5CF6] text-white flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#18181B]">
                        Đơn hàng gần nhất: {userOrders[0].orderNumber}
                      </div>
                      <div className="text-[11px] text-[#71717A]">
                        {formatDate(userOrders[0].createdAt)} • {formatPrice(userOrders[0].totalAmount)} • Trạng thái:{' '}
                        <span className="font-semibold text-[#8B5CF6]">{userOrders[0].orderStatus}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-bold bg-white self-start sm:self-auto"
                    onClick={() => {
                      setSelectedTrackingOrder(userOrders[0]);
                      setActiveTab('tracking');
                    }}
                  >
                    Xem tiến trình đơn
                  </Button>
                </div>
              )}

              {/* Shortcuts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('preferences')}
                  className="p-4 rounded-2xl border border-[#E4E4E7] hover:border-[#8B5CF6] transition-colors text-left space-y-1.5 cursor-pointer bg-white"
                >
                  <div className="flex items-center justify-between font-bold text-xs text-[#18181B]">
                    <span>Cập nhật số đo dáng người</span>
                    <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                  </div>
                  <p className="text-[11px] text-[#71717A]">
                    Giúp AI Stylist tự động chọn size chuẩn xác không cần hỏi lại.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('addresses')}
                  className="p-4 rounded-2xl border border-[#E4E4E7] hover:border-[#8B5CF6] transition-colors text-left space-y-1.5 cursor-pointer bg-white"
                >
                  <div className="flex items-center justify-between font-bold text-xs text-[#18181B]">
                    <span>Quản lý sổ địa chỉ</span>
                    <MapPin className="w-4 h-4 text-[#8B5CF6]" />
                  </div>
                  <p className="text-[11px] text-[#71717A]">
                    Thiết lập địa chỉ mặc định để thanh toán 1 chạm nhanh chóng.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE INFO */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-[#E4E4E7] pb-4">
                <h2 className="text-xl font-bold text-[#18181B]">Thông tin tài khoản cá nhân</h2>
                <p className="text-xs text-[#71717A] mt-1">
                  Chỉnh sửa họ tên, số điện thoại liên lạc và ảnh đại diện của bạn.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
                <Input
                  label="Họ và tên của bạn *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập họ và tên"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Số điện thoại di động"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901234567"
                  />
                  <Input
                    label="Địa chỉ Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>

                <Input
                  label="Đường dẫn Ảnh đại diện (Avatar URL)"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                />

                <div className="pt-4 border-t border-[#E4E4E7] flex justify-end">
                  <Button type="submit" variant="primary" className="rounded-xl text-xs font-bold bg-[#18181B] hover:bg-zinc-800 text-white">
                    <Save className="w-4 h-4 mr-1.5" />
                    Lưu cập nhật hồ sơ
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: MY CART */}
          {activeTab === 'cart' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-[#E4E4E7] pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#18181B]">Giỏ hàng của bạn</h2>
                  <p className="text-xs text-[#71717A] mt-1">
                    Hiện có {cart.items.length} món đồ đang chuẩn bị đặt mua.
                  </p>
                </div>
                <Link to="/cart">
                  <Button size="sm" variant="outline" className="text-xs font-bold rounded-xl">
                    Xem trang Giỏ hàng đầy đủ →
                  </Button>
                </Link>
              </div>

              {cart.items.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <ShoppingBag className="w-12 h-12 text-zinc-300 mx-auto" />
                  <p className="text-sm font-semibold text-zinc-600">Giỏ hàng hiện đang trống</p>
                  <Link to="/products">
                    <Button variant="primary" size="sm" className="rounded-xl text-xs font-bold bg-[#8B5CF6] text-white">
                      Khám phá sản phẩm ngay
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="divide-y divide-[#E4E4E7]">
                    {cart.items.map((item) => (
                      <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-14 h-16 object-cover rounded-xl border border-[#E4E4E7] shrink-0"
                          />
                          <div>
                            <div className="text-xs font-bold text-[#18181B] line-clamp-1">{item.productName}</div>
                            <div className="text-[11px] text-[#71717A]">
                              Phân loại: {item.color.name} • Size: {item.size} • SL: {item.quantity}
                            </div>
                            <div className="text-xs font-semibold text-[#8B5CF6] mt-0.5">
                              {formatPrice(item.price * item.quantity)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E4E4E7] flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#71717A]">Tổng tạm tính:</div>
                      <div className="text-lg font-black text-[#18181B]">{formatPrice(cart.total)}</div>
                    </div>
                    <Link to="/checkout">
                      <Button variant="primary" className="rounded-xl text-xs font-bold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
                        Tiến hành Thanh toán
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MY ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-[#E4E4E7] pb-4">
                <h2 className="text-xl font-bold text-[#18181B]">Lịch sử đơn hàng</h2>
                <p className="text-xs text-[#71717A] mt-1">
                  Toàn bộ các đơn hàng đã đặt kèm mã theo dõi và trạng thái vận chuyển thực tế.
                </p>
              </div>

              {userOrders.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <PackageCheck className="w-12 h-12 text-zinc-300 mx-auto" />
                  <p className="text-sm font-semibold text-zinc-600">Bạn chưa có đơn hàng nào</p>
                  <Link to="/products">
                    <Button variant="primary" size="sm" className="rounded-xl text-xs font-bold bg-[#8B5CF6] text-white">
                      Bắt đầu mua sắm ngay
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {userOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-5 rounded-2xl border border-[#E4E4E7] bg-white hover:border-[#8B5CF6]/50 transition-all space-y-4 shadow-2xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4E4E7]/70 pb-3">
                        <div>
                          <div className="text-xs font-black text-[#18181B]">{order.orderNumber}</div>
                          <div className="text-[11px] text-[#71717A]">Ngày đặt: {formatDate(order.createdAt)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(order.orderStatus)}
                          <span className="text-xs font-black text-[#18181B]">
                            {formatPrice(order.totalAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Items preview */}
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={item.image}
                                alt={item.productName}
                                className="w-10 h-12 object-cover rounded-lg border border-[#E4E4E7] shrink-0"
                              />
                              <div className="truncate max-w-[260px] sm:max-w-md">
                                <div className="font-semibold text-[#18181B] truncate">{item.productName}</div>
                                <div className="text-[10px] text-[#71717A]">
                                  {item.colorName} • Size {item.size} • x{item.quantity}
                                </div>
                              </div>
                            </div>
                            <span className="font-bold text-[#18181B]">{formatPrice(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-[#E4E4E7]/70 flex items-center justify-between">
                        <span className="text-[11px] text-[#71717A]">
                          Địa chỉ: {order.shippingAddress.street}, {order.shippingAddress.district}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs font-bold rounded-xl"
                            onClick={() => {
                              setSelectedTrackingOrder(order);
                              setActiveTab('tracking');
                            }}
                          >
                            <Truck className="w-3.5 h-3.5 mr-1" />
                            Theo dõi tiến trình
                          </Button>
                          <Link to={`/orders/${order.id}`}>
                            <Button size="sm" variant="secondary" className="text-xs font-bold rounded-xl bg-zinc-900 text-white hover:bg-zinc-800">
                              Chi tiết
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ORDER TRACKING TIMELINE */}
          {activeTab === 'tracking' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-[#E4E4E7] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#18181B]">Theo dõi tiến trình đơn hàng</h2>
                  <p className="text-xs text-[#71717A] mt-1">
                    Cập nhật thời gian thực từng khâu đóng gói, luân chuyển và giao hàng.
                  </p>
                </div>

                {userOrders.length > 1 && (
                  <select
                    value={selectedTrackingOrder?.id}
                    onChange={(e) => {
                      const found = userOrders.find((o) => o.id === e.target.value);
                      if (found) setSelectedTrackingOrder(found);
                    }}
                    className="text-xs bg-[#FAFAF8] border border-[#E4E4E7] rounded-xl px-3 py-1.5 font-bold outline-none cursor-pointer"
                  >
                    {userOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} ({formatPrice(o.totalAmount)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedTrackingOrder ? (
                <div className="space-y-8">
                  {/* Stepper Card */}
                  <div className="p-6 rounded-3xl bg-[#FAFAF8] border border-[#E4E4E7] space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4E4E7] pb-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B5CF6]">Mã vận đơn</span>
                        <div className="text-base font-black text-[#18181B]">{selectedTrackingOrder.orderNumber}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#71717A]">Phương thức: {selectedTrackingOrder.paymentMethod}</span>
                        <div>{getStatusBadge(selectedTrackingOrder.orderStatus)}</div>
                      </div>
                    </div>

                    {/* 5-Step Visual Progress Bar */}
                    <div className="relative">
                      <div className="grid grid-cols-5 gap-2 text-center">
                        {[
                          { title: 'Tạo đơn', step: 1, active: true },
                          { title: 'Xác nhận', step: 2, active: selectedTrackingOrder.orderStatus !== 'PENDING' },
                          {
                            title: 'Đóng gói',
                            step: 3,
                            active: ['PROCESSING', 'SHIPPED', 'COMPLETED'].includes(selectedTrackingOrder.orderStatus),
                          },
                          {
                            title: 'Vận chuyển',
                            step: 4,
                            active: ['SHIPPED', 'COMPLETED'].includes(selectedTrackingOrder.orderStatus),
                          },
                          {
                            title: 'Hoàn thành',
                            step: 5,
                            active: selectedTrackingOrder.orderStatus === 'COMPLETED',
                          },
                        ].map((s) => (
                          <div key={s.step} className="flex flex-col items-center space-y-2">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                                s.active
                                  ? 'bg-[#8B5CF6] text-white shadow-xs'
                                  : 'bg-[#E4E4E7] text-[#71717A]'
                              }`}
                            >
                              {s.step}
                            </div>
                            <span className={`text-[10px] font-bold ${s.active ? 'text-[#18181B]' : 'text-[#A1A1AA]'}`}>
                              {s.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Status History Log */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-[#18181B] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#8B5CF6]" />
                      Nhật ký cập nhật chi tiết
                    </h3>
                    <div className="relative border-l-2 border-[#8B5CF6]/30 ml-3 space-y-6 pl-6">
                      {selectedTrackingOrder.statusHistory.map((h, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#8B5CF6] border-2 border-white" />
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#18181B]">{h.status}</span>
                              <span className="text-[10px] text-[#71717A]">{formatDate(h.timestamp)}</span>
                            </div>
                            <p className="text-xs text-[#52525B] leading-relaxed">{h.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-[#71717A]">
                  Chưa có đơn hàng nào để theo dõi.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-[#E4E4E7] pb-4">
                <h2 className="text-xl font-bold text-[#18181B]">Danh sách sản phẩm yêu thích</h2>
                <p className="text-xs text-[#71717A] mt-1">
                  Các thiết kế thời trang bạn đã lưu lại để tham khảo hoặc mua sắm sau.
                </p>
              </div>

              {wishlistProducts.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Heart className="w-12 h-12 text-zinc-300 mx-auto" />
                  <p className="text-sm font-semibold text-zinc-600">Bạn chưa lưu sản phẩm yêu thích nào</p>
                  <Link to="/products">
                    <Button variant="primary" size="sm" className="rounded-xl text-xs font-bold bg-[#8B5CF6] text-white">
                      Khám phá Catalog sản phẩm
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistProducts.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl border border-[#E4E4E7] bg-white flex gap-3 shadow-2xs hover:border-[#8B5CF6]/50 transition-colors"
                    >
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-20 h-24 object-cover rounded-xl border border-[#E4E4E7] shrink-0"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B5CF6]">{p.brand}</div>
                          <Link to={`/products/${p.slug}`} className="text-xs font-bold text-[#18181B] line-clamp-1 hover:underline">
                            {p.name}
                          </Link>
                          <div className="text-xs font-black text-[#18181B] mt-1">{formatPrice(p.price)}</div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <Link to={`/products/${p.slug}`} className="flex-1">
                            <Button size="sm" variant="primary" className="w-full text-[11px] h-8 rounded-lg bg-zinc-900 text-white">
                              Xem & Mua
                            </Button>
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              MockRepo.toggleWishlist(p.id);
                              success('Đã bỏ yêu thích');
                            }}
                            className="p-1.5 rounded-lg border border-[#E4E4E7] text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Xóa khỏi yêu thích"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: SAVED ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-[#E4E4E7] pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#18181B]">Sổ địa chỉ nhận hàng</h2>
                  <p className="text-xs text-[#71717A] mt-1">
                    Quản lý danh sách địa chỉ giao hàng để tự động điền khi thanh toán.
                  </p>
                </div>
                {!isAddingAddress && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddingAddress(true)}
                    className="text-xs font-bold rounded-xl"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Thêm địa chỉ mới
                  </Button>
                )}
              </div>

              {isAddingAddress ? (
                <form onSubmit={handleAddAddress} className="p-6 rounded-2xl bg-[#FAFAF8] border border-[#E4E4E7] space-y-4">
                  <div className="text-xs font-bold text-[#18181B]">Thêm địa chỉ giao hàng mới</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Họ tên người nhận"
                      value={newAddrFullName}
                      onChange={(e) => setNewAddrFullName(e.target.value)}
                    />
                    <Input
                      label="Số điện thoại"
                      value={newAddrPhone}
                      onChange={(e) => setNewAddrPhone(e.target.value)}
                    />
                  </div>
                  <Input
                    label="Địa chỉ số nhà, tên đường"
                    value={newAddrStreet}
                    onChange={(e) => setNewAddrStreet(e.target.value)}
                    placeholder="Ví dụ: Số 123 Đường Nguyễn Huệ"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Quận / Huyện"
                      value={newAddrDistrict}
                      onChange={(e) => setNewAddrDistrict(e.target.value)}
                      placeholder="Quận 1"
                    />
                    <Input
                      label="Tỉnh / Thành phố"
                      value={newAddrProvince}
                      onChange={(e) => setNewAddrProvince(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingAddress(false)}
                      className="rounded-xl text-xs"
                    >
                      Hủy bỏ
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      className="rounded-xl text-xs font-bold bg-[#18181B] text-white"
                    >
                      Lưu địa chỉ này
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {addresses.map((addr, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl border border-[#E4E4E7] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#18181B]">{addr.fullName}</span>
                          <span className="text-xs text-[#71717A]">({addr.phone})</span>
                          {idx === 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#52525B]">
                          {addr.street}, {addr.district}, {addr.province}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {addresses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(idx)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Xóa địa chỉ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: SIZE & STYLE PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-[#E4E4E7] pb-4">
                <h2 className="text-xl font-bold text-[#18181B]">Thông số vóc dáng & Phong cách</h2>
                <p className="text-xs text-[#71717A] mt-1">
                  Hệ thống AI Stylist và Virtual Try-On sẽ dựa trên các thông số này để gợi ý chuẩn xác nhất.
                </p>
              </div>

              <div className="space-y-6 max-w-xl">
                {/* Body Dimensions */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#18181B] block mb-1">Chiều cao (cm)</label>
                    <input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      className="w-full bg-[#FAFAF8] border border-[#E4E4E7] rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-[#8B5CF6]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#18181B] block mb-1">Cân nặng (kg)</label>
                    <input
                      type="number"
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="w-full bg-[#FAFAF8] border border-[#E4E4E7] rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-[#8B5CF6]"
                    />
                  </div>
                </div>

                {/* Preferred Sizes */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#18181B] block">Kích cỡ thường mặc (Size)</label>
                  <div className="flex flex-wrap gap-2">
                    {(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as SizeCode[]).map((size) => {
                      const isSelected = preferredSizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={`w-12 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#18181B] text-white shadow-xs'
                              : 'bg-[#FAFAF8] text-[#71717A] border border-[#E4E4E7] hover:border-zinc-400'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preferred Styles */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#18181B] block">Gu thời trang yêu thích</label>
                  <div className="flex flex-wrap gap-2">
                    {['Streetwear', 'Tối giản', 'Y2K', 'Công sở', 'Hàn Quốc', 'Vintage', 'Unisex'].map((st) => {
                      const isSelected = preferredStyles.includes(st);
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => toggleStyle(st)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#8B5CF6] text-white shadow-xs font-bold'
                              : 'bg-[#FAFAF8] text-[#71717A] border border-[#E4E4E7] hover:border-zinc-400'
                          }`}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E4E4E7] flex justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSavePreferences}
                    className="rounded-xl text-xs font-bold bg-[#18181B] hover:bg-zinc-800 text-white"
                  >
                    <Save className="w-4 h-4 mr-1.5" />
                    Lưu thông số phong cách
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: ACCOUNT SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-[#E4E4E7] pb-4">
                <h2 className="text-xl font-bold text-[#18181B]">Bảo mật & Phiên làm việc</h2>
                <p className="text-xs text-[#71717A] mt-1">
                  Đổi mật khẩu truy cập và kiểm soát các thiết bị đã đăng nhập.
                </p>
              </div>

              {/* Password change form */}
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                <Input
                  label="Mật khẩu hiện tại"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                />

                <Input
                  label="Mật khẩu mới (Tối thiểu 6 ký tự)"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />

                <Input
                  label="Nhập lại mật khẩu mới"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />

                <Button
                  type="submit"
                  variant="outline"
                  className="rounded-xl text-xs font-bold border-zinc-300 hover:border-zinc-900"
                >
                  <Lock className="w-3.5 h-3.5 mr-1.5" />
                  Cập nhật mật khẩu mới
                </Button>
              </form>

              {/* Session info */}
              <div className="p-5 rounded-2xl bg-[#FAFAF8] border border-[#E4E4E7] space-y-3 pt-4">
                <div className="text-xs font-bold text-[#18181B] flex items-center justify-between">
                  <span>Phiên làm việc hiện tại</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-xs text-[#71717A] space-y-1">
                  <div>Thiết bị: Trình duyệt Web (Desktop / Mobile LAN)</div>
                  <div>Trạng thái phiên: Hoạt động liên tục (Session active)</div>
                  <div>Email đăng nhập: <span className="font-semibold text-[#18181B]">{currentUser.email}</span></div>
                </div>
              </div>

              {/* Logout button */}
              <div className="pt-4 border-t border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-rose-600">Đăng xuất khỏi thiết bị này</div>
                  <div className="text-[11px] text-[#71717A]">
                    Xóa phiên làm việc hiện tại và quay về màn hình đăng nhập.
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="rounded-xl text-xs font-bold border-rose-300 text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  Đăng xuất tài khoản
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
