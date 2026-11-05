import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { productService } from '@/services/productService';
import { SizeCode, ShippingAddress, Order, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/common/ProductCard';
import { useToast } from '@/components/ui/toast';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import { formatPrice, formatDate } from '@/lib/utils';
import {
  User as UserIcon,
  MapPin,
  Heart,
  Package,
  SlidersHorizontal,
  ShieldCheck,
  Save,
  Plus,
  Trash2,
  Edit2,
  Check,
  ShoppingBag,
  Lock,
  ExternalLink,
  Loader2,
} from 'lucide-react';

type AccountTab = 'profile' | 'addresses' | 'orders' | 'wishlist' | 'preferences' | 'security';

const ALL_SIZES: SizeCode[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'FreeSize'];
const ALL_STYLES = ['Korean Minimal', 'Streetwear', 'Casual', 'Vintage', 'Y2K'];

export const AccountPage: React.FC = () => {
  useRepoSubscription(['auth', 'orders']);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = MockRepo.getCurrentUser();
  const { success, error } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login?redirect=/account', { replace: true });
    }
  }, [currentUser, navigate]);

  // Active tab state derived directly from URL param
  const activeTab = (searchParams.get('tab') as AccountTab) || 'profile';

  const handleTabChange = (tab: AccountTab) => {
    setSearchParams({ tab });
  };

  // 1. Profile Form States & Validation
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{ name?: string; phone?: string; email?: string }>({});

  // 2. Addresses State
  const [addresses, setAddresses] = useState<ShippingAddress[]>(() => {
    if (currentUser?.savedAddresses && currentUser.savedAddresses.length > 0) {
      return currentUser.savedAddresses;
    }
    return [
      {
        fullName: currentUser?.name || 'Khách hàng',
        phone: currentUser?.phone || '0901234567',
        email: currentUser?.email || 'customer@smartbuy.vn',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        street: '45 Đường Lê Duẩn',
        note: 'Giao giờ hành chính',
      },
    ];
  });

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<ShippingAddress>({
    fullName: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    province: 'Thành phố Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    street: '',
    note: '',
  });

  // 3. Orders State
  const allOrders = MockRepo.getOrders();
  const userOrders = currentUser ? allOrders.filter((o: Order) => o.userId === currentUser.id || !o.userId) : [];

  // 4. Preferences State
  const [preferredSizes, setPreferredSizes] = useState<SizeCode[]>(
    currentUser?.preferences?.preferredSizes || ['S', 'M']
  );
  const [preferredStyles, setPreferredStyles] = useState<string[]>(
    currentUser?.preferences?.preferredStyles || ['Korean Minimal', 'Casual']
  );
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // 5. Wishlist State
  const [wishlistProducts] = useState<Product[]>(() => {
    const all = productService.getAll();
    try {
      const savedIds = JSON.parse(localStorage.getItem('smartbuy_wishlist') || '[]');
      if (Array.isArray(savedIds) && savedIds.length > 0) {
        const found = all.filter((p) => savedIds.includes(p.id));
        if (found.length > 0) return found;
      }
    } catch {
      // fallback
    }
    // Default 4 curated favorites if none saved
    return all.slice(0, 4);
  });

  // 6. Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Profile Save Handler with Validation
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; phone?: string; email?: string } = {};

    if (!name.trim()) {
      errors.name = 'Vui lòng nhập họ và tên của bạn.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      errors.email = 'Vui lòng nhập địa chỉ email hợp lệ.';
    }

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phone.trim() || !phoneRegex.test(phone.replace(/\s+/g, ''))) {
      errors.phone = 'Vui lòng nhập số điện thoại Việt Nam hợp lệ (10 chữ số).';
    }

    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) {
      error('Thông tin chưa hợp lệ', 'Vui lòng kiểm tra lại các trường báo lỗi.');
      return;
    }

    setIsSavingProfile(true);
    setTimeout(() => {
      MockRepo.updateUserProfile({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      setIsSavingProfile(false);
      success('Lưu thông tin thành công', 'Hồ sơ cá nhân của bạn đã được cập nhật.');
    }, 300);
  };

  // Address Handlers
  const handleOpenAddAddress = () => {
    setEditingAddressIndex(null);
    setAddressForm({
      fullName: currentUser?.name || '',
      phone: currentUser?.phone || '',
      email: currentUser?.email || '',
      province: 'Thành phố Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      street: '',
      note: '',
    });
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (idx: number) => {
    setEditingAddressIndex(idx);
    setAddressForm({ ...addresses[idx] });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.fullName.trim() || !addressForm.phone.trim() || !addressForm.street.trim()) {
      error('Thiếu thông tin', 'Vui lòng điền họ tên, số điện thoại và địa chỉ số nhà.');
      return;
    }

    let updated: ShippingAddress[];
    if (editingAddressIndex !== null) {
      updated = [...addresses];
      updated[editingAddressIndex] = addressForm;
    } else {
      updated = [...addresses, addressForm];
    }

    setAddresses(updated);
    MockRepo.updateUserProfile({ savedAddresses: updated });
    setIsAddressModalOpen(false);
    success(
      editingAddressIndex !== null ? 'Đã cập nhật địa chỉ' : 'Đã thêm địa chỉ mới',
      'Sổ địa chỉ của bạn đã được lưu lại.'
    );
  };

  const handleDeleteAddress = (idx: number) => {
    if (addresses.length <= 1) {
      error('Không thể xóa', 'Bạn cần giữ lại ít nhất một địa chỉ liên hệ.');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ nhận hàng này?')) {
      const updated = addresses.filter((_, i) => i !== idx);
      setAddresses(updated);
      MockRepo.updateUserProfile({ savedAddresses: updated });
      success('Đã xóa địa chỉ', 'Địa chỉ đã được gỡ khỏi sổ địa chỉ của bạn.');
    }
  };

  const handleSetDefaultAddress = (idx: number) => {
    if (idx === 0) return;
    const target = addresses[idx];
    const rest = addresses.filter((_, i) => i !== idx);
    const updated = [target, ...rest];
    setAddresses(updated);
    MockRepo.updateUserProfile({ savedAddresses: updated });
    success('Đã chọn địa chỉ mặc định', 'Địa chỉ này sẽ được ưu tiên khi bạn thanh toán đơn hàng.');
  };

  // Preferences Toggle Handlers
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

  const handleSavePreferences = () => {
    setIsSavingPreferences(true);
    setTimeout(() => {
      MockRepo.updateUserProfile({
        preferences: {
          ...currentUser?.preferences,
          preferredSizes,
          preferredStyles,
        },
      });
      setIsSavingPreferences(false);
      success('Đã lưu sở thích', 'Trợ lý AI Stylist sẽ ưu tiên gợi ý trang phục theo kích cỡ và phong cách này.');
    }, 250);
  };

  // Password Change Handler
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setIsSavingPassword(true);
    setTimeout(() => {
      setIsSavingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      success('Đổi mật khẩu thành công', 'Mật khẩu tài khoản của bạn đã được cập nhật an toàn.');
    }, 400);
  };

  const navItems = [
    { id: 'profile' as AccountTab, label: 'Thông tin cá nhân', icon: UserIcon },
    { id: 'addresses' as AccountTab, label: 'Sổ địa chỉ', icon: MapPin },
    { id: 'orders' as AccountTab, label: 'Đơn hàng của tôi', icon: Package, badge: userOrders.length },
    { id: 'wishlist' as AccountTab, label: 'Sản phẩm yêu thích', icon: Heart, badge: wishlistProducts.length },
    { id: 'preferences' as AccountTab, label: 'Sở thích & Kích cỡ', icon: SlidersHorizontal },
    { id: 'security' as AccountTab, label: 'Bảo mật tài khoản', icon: ShieldCheck },
  ];

  if (!currentUser) {
    return null;
  }

  return (
    <div className="bg-[#F7F7F6] min-h-screen text-[#292524] pb-24">
      {/* 1. BREADCRUMB & PROFILE HEADER */}
      <div className="border-b border-[#ECEAE7] bg-white py-6 sm:py-8">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#78716C] mb-3">
            <Link to="/" className="hover:text-[#18181B] transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <span className="text-[#18181B] font-medium">Tài khoản thành viên</span>
          </nav>

          {/* Profile Header Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Avatar 64-80px */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-[#F0EFED] border border-[#ECEAE7] shrink-0 flex items-center justify-center shadow-xs">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-xl sm:text-2xl text-[#18181B]">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>

              {/* User Info */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#18181B]">
                    {currentUser.name}
                  </h1>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      currentUser.role === 'admin'
                        ? 'bg-[#F3E8FF] text-[#5B21B6] border border-[#DDD6FE]'
                        : 'bg-[#F0EFED] text-[#18181B] border border-[#ECEAE7]'
                    }`}
                  >
                    {currentUser.role === 'admin' ? 'Quản trị viên' : 'Thành viên SMARTBUY'}
                  </span>
                </div>
                <p className="text-xs text-[#78716C] font-normal">{currentUser.email}</p>
                <p className="text-xs text-[#78716C] hidden sm:block">
                  Quản lý thông tin cá nhân, đơn hàng và sổ địa chỉ giao hàng của bạn.
                </p>
              </div>
            </div>

            {/* Quick Action Button to Orders */}
            <div className="shrink-0 hidden md:block">
              <Link to="/orders">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold rounded-lg border-[#ECEAE7] hover:border-[#18181B] hover:bg-[#F0EFED]"
                >
                  <Package className="w-3.5 h-3.5 mr-1.5" />
                  Xem đơn hàng ({userOrders.length})
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN LAYOUT (Container max-width 1280px) */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Mobile Horizontal Tabs (< 768px) */}
        <div className="md:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-4 -mx-4 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            if (!currentUser) {
    return null;
  }

  return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#18181B] text-white shadow-xs'
                    : 'bg-white text-[#292524] border border-[#ECEAE7] hover:bg-[#F0EFED]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#F0EFED] text-[#18181B]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 2-Column Grid: Sidebar (240–280px) + Main Content */}
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
          {/* Desktop Account Sidebar (260-280px) */}
          <aside className="hidden md:block w-[240px] lg:w-[260px] shrink-0 bg-white rounded-xl p-3 border border-[#ECEAE7] space-y-1 shadow-xs sticky top-28">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#78716C] border-b border-[#ECEAE7] mb-1">
              Trung tâm tài khoản
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              if (!currentUser) {
    return null;
  }

  return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#18181B] text-white font-semibold shadow-xs'
                      : 'text-[#292524] hover:bg-[#F0EFED] hover:text-[#18181B]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#F0EFED] text-[#18181B]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 bg-white rounded-xl border border-[#ECEAE7] p-5 sm:p-7 shadow-xs">
            {/* TAB 1: THÔNG TIN CÁ NHÂN */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="border-b border-[#ECEAE7] pb-3">
                  <h2 className="text-base font-bold text-[#18181B]">Thông tin cá nhân</h2>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    Cập nhật họ tên, số điện thoại và thông tin liên hệ chính của bạn.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
                  {/* Họ và tên */}
                  <div className="space-y-1.5">
                    <label htmlFor="user-name" className="block text-xs font-semibold text-[#18181B]">
                      Họ và tên <span className="text-[#B91C1C]">*</span>
                    </label>
                    <input
                      id="user-name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (profileErrors.name) setProfileErrors({ ...profileErrors, name: undefined });
                      }}
                      className={`w-full h-11 px-3.5 rounded-lg border text-xs text-[#18181B] focus:outline-none transition-colors ${
                        profileErrors.name
                          ? 'border-[#B91C1C] focus:border-[#B91C1C]'
                          : 'border-[#D6D3D1] focus:border-[#18181B]'
                      }`}
                      placeholder="Nguyễn Văn A"
                    />
                    {profileErrors.name && (
                      <p className="text-[11px] text-[#B91C1C]">{profileErrors.name}</p>
                    )}
                  </div>

                  {/* Số điện thoại */}
                  <div className="space-y-1.5">
                    <label htmlFor="user-phone" className="block text-xs font-semibold text-[#18181B]">
                      Số điện thoại <span className="text-[#B91C1C]">*</span>
                    </label>
                    <input
                      id="user-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (profileErrors.phone) setProfileErrors({ ...profileErrors, phone: undefined });
                      }}
                      className={`w-full h-11 px-3.5 rounded-lg border text-xs text-[#18181B] focus:outline-none transition-colors ${
                        profileErrors.phone
                          ? 'border-[#B91C1C] focus:border-[#B91C1C]'
                          : 'border-[#D6D3D1] focus:border-[#18181B]'
                      }`}
                      placeholder="0901234567"
                    />
                    {profileErrors.phone && (
                      <p className="text-[11px] text-[#B91C1C]">{profileErrors.phone}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="user-email" className="block text-xs font-semibold text-[#18181B]">
                      Email liên hệ <span className="text-[#B91C1C]">*</span>
                    </label>
                    <input
                      id="user-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (profileErrors.email) setProfileErrors({ ...profileErrors, email: undefined });
                      }}
                      className={`w-full h-11 px-3.5 rounded-lg border text-xs text-[#18181B] focus:outline-none transition-colors ${
                        profileErrors.email
                          ? 'border-[#B91C1C] focus:border-[#B91C1C]'
                          : 'border-[#D6D3D1] focus:border-[#18181B]'
                      }`}
                      placeholder="email@vidu.com"
                    />
                    {profileErrors.email && (
                      <p className="text-[11px] text-[#B91C1C]">{profileErrors.email}</p>
                    )}
                  </div>

                  {/* Save Button */}
                  <div className="pt-4 border-t border-[#ECEAE7] flex items-center justify-between">
                    <span className="text-[11px] text-[#78716C]">
                      Dữ liệu được mã hóa và lưu trữ an toàn.
                    </span>
                    <Button
                      type="submit"
                      disabled={isSavingProfile}
                      className="h-10 px-5 text-xs font-semibold bg-[#18181B] hover:bg-[#3F3F46] text-white rounded-lg transition-colors cursor-pointer"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5 mr-1.5" />
                          Lưu thay đổi
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: SỔ ĐỊA CHỈ */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="border-b border-[#ECEAE7] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-[#18181B]">Sổ địa chỉ nhận hàng</h2>
                    <p className="text-xs text-[#78716C] mt-0.5">
                      Quản lý danh sách các địa chỉ giao hàng để đặt hàng nhanh chóng.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleOpenAddAddress}
                    className="h-9 px-3.5 text-xs font-semibold bg-[#18181B] hover:bg-[#3F3F46] text-white rounded-lg transition-colors cursor-pointer w-fit"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Thêm địa chỉ mới
                  </Button>
                </div>

                {/* Address Cards List */}
                <div className="grid grid-cols-1 gap-3.5">
                  {addresses.map((addr, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${
                        idx === 0
                          ? 'border-[#18181B] bg-white shadow-xs'
                          : 'border-[#ECEAE7] bg-[#F7F7F6]/50 hover:bg-white'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#18181B]">{addr.fullName}</span>
                          <span className="text-[#ECEAE7]">•</span>
                          <span className="text-xs text-[#78716C]">{addr.phone}</span>
                          {idx === 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#18181B] text-white">
                              <Check className="w-2.5 h-2.5" />
                              Mặc định
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 text-xs">
                          {idx !== 0 && (
                            <button
                              onClick={() => handleSetDefaultAddress(idx)}
                              className="text-[11px] text-[#78716C] hover:text-[#18181B] underline cursor-pointer"
                            >
                              Đặt làm mặc định
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditAddress(idx)}
                            className="p-1.5 text-[#78716C] hover:text-[#18181B] rounded hover:bg-[#F0EFED] transition-colors cursor-pointer"
                            title="Sửa địa chỉ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {addresses.length > 1 && (
                            <button
                              onClick={() => handleDeleteAddress(idx)}
                              className="p-1.5 text-[#78716C] hover:text-[#B91C1C] rounded hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Xóa địa chỉ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-[#292524] mt-2 font-medium">
                        {addr.street}, {addr.ward ? `${addr.ward}, ` : ''}{addr.district}, {addr.province}
                      </p>
                      {addr.note && (
                        <p className="text-[11px] text-[#78716C] mt-1 italic">Ghi chú: {addr.note}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Inline Address Form Modal / Box */}
                {isAddressModalOpen && (
                  <div className="p-4 sm:p-5 rounded-xl border border-[#18181B] bg-white shadow-subtle space-y-4 animate-fade-in">
                    <div className="border-b border-[#ECEAE7] pb-2 flex items-center justify-between">
                      <h3 className="font-bold text-xs text-[#18181B]">
                        {editingAddressIndex !== null ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ giao hàng mới'}
                      </h3>
                      <button
                        onClick={() => setIsAddressModalOpen(false)}
                        className="text-xs text-[#78716C] hover:text-[#18181B]"
                      >
                        Hủy
                      </button>
                    </div>

                    <form onSubmit={handleSaveAddress} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-[#18181B]">Họ tên người nhận *</label>
                          <input
                            type="text"
                            value={addressForm.fullName}
                            onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-[#D6D3D1] text-xs focus:outline-none focus:border-[#18181B]"
                            placeholder="Tên người nhận"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-[#18181B]">Số điện thoại *</label>
                          <input
                            type="tel"
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-[#D6D3D1] text-xs focus:outline-none focus:border-[#18181B]"
                            placeholder="Số điện thoại"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#18181B]">Địa chỉ số nhà & Tên đường *</label>
                        <input
                          type="text"
                          value={addressForm.street}
                          onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                          className="w-full h-10 px-3 rounded-lg border border-[#D6D3D1] text-xs focus:outline-none focus:border-[#18181B]"
                          placeholder="Ví dụ: 123 Đường Nguyễn Trãi"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-[#18181B]">Phường / Xã</label>
                          <input
                            type="text"
                            value={addressForm.ward || ''}
                            onChange={(e) => setAddressForm({ ...addressForm, ward: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-[#D6D3D1] text-xs focus:outline-none focus:border-[#18181B]"
                            placeholder="Phường/Xã"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-[#18181B]">Quận / Huyện *</label>
                          <input
                            type="text"
                            value={addressForm.district}
                            onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-[#D6D3D1] text-xs focus:outline-none focus:border-[#18181B]"
                            placeholder="Quận/Huyện"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-[#18181B]">Tỉnh / Thành phố *</label>
                          <input
                            type="text"
                            value={addressForm.province}
                            onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-[#D6D3D1] text-xs focus:outline-none focus:border-[#18181B]"
                            placeholder="Tỉnh/Thành phố"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#18181B]">Ghi chú giao hàng</label>
                        <input
                          type="text"
                          value={addressForm.note || ''}
                          onChange={(e) => setAddressForm({ ...addressForm, note: e.target.value })}
                          className="w-full h-10 px-3 rounded-lg border border-[#D6D3D1] text-xs focus:outline-none focus:border-[#18181B]"
                          placeholder="Ví dụ: Gọi trước khi giao, gửi bảo vệ tòa nhà..."
                        />
                      </div>

                      <div className="pt-2 flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddressModalOpen(false)}
                          className="rounded-lg text-xs"
                        >
                          Hủy
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          className="rounded-lg text-xs bg-[#18181B] text-white hover:bg-[#3F3F46]"
                        >
                          Lưu địa chỉ
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ĐƠN HÀNG CỦA TÔI */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="border-b border-[#ECEAE7] pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[#18181B]">Lịch sử đơn hàng</h2>
                    <p className="text-xs text-[#78716C] mt-0.5">
                      Theo dõi trạng thái các đơn hàng bạn đã đặt tại SMARTBUY AI.
                    </p>
                  </div>
                  <Link to="/products" className="text-xs font-semibold text-[#18181B] hover:underline">
                    Mua sắm tiếp →
                  </Link>
                </div>

                {userOrders.length === 0 ? (
                  <div className="py-12 text-center space-y-3 bg-[#F7F7F6] rounded-xl border border-[#ECEAE7]">
                    <div className="w-12 h-12 rounded-full bg-white mx-auto flex items-center justify-center text-[#78716C] shadow-2xs">
                      <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <h3 className="text-sm font-bold text-[#18181B]">Chưa có đơn hàng nào</h3>
                    <p className="text-xs text-[#78716C] max-w-sm mx-auto">
                      Bạn chưa đặt đơn hàng nào. Hãy khám phá các bộ sưu tập thời trang Korean Minimal mới nhất!
                    </p>
                    <Link to="/products">
                      <Button size="sm" className="text-xs rounded-lg bg-[#18181B] text-white mt-2">
                        Khám phá sản phẩm
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userOrders.map((order: Order) => {
                      const statusMap: Record<string, { label: string; className: string }> = {
                        PENDING: { label: 'Chờ xử lý', className: 'bg-amber-50 text-amber-800 border-amber-200' },
                        CONFIRMED: { label: 'Đã xác nhận', className: 'bg-blue-50 text-blue-800 border-blue-200' },
                        PROCESSING: { label: 'Đang đóng gói', className: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
                        SHIPPING: { label: 'Đang vận chuyển', className: 'bg-purple-50 text-purple-800 border-purple-200' },
                        DELIVERED: { label: 'Đã giao thành công', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                        CANCELLED: { label: 'Đã hủy', className: 'bg-rose-50 text-rose-800 border-rose-200' },
                      };
                      const statusInfo = statusMap[order.orderStatus] || {
                        label: order.orderStatus,
                        className: 'bg-gray-100 text-gray-800 border-gray-200',
                      };

                      if (!currentUser) {
    return null;
  }

  return (
                        <div
                          key={order.id}
                          className="p-4 rounded-xl border border-[#ECEAE7] bg-white hover:border-[#18181B] transition-all space-y-3 shadow-2xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ECEAE7] pb-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#18181B]">#{order.orderNumber}</span>
                              <span className="text-[#ECEAE7]">•</span>
                              <span className="text-[#78716C]">
                                {order.statusHistory?.[0]?.timestamp
                                  ? formatDate(order.statusHistory[0].timestamp)
                                  : 'Gần đây'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusInfo.className}`}
                              >
                                {statusInfo.label}
                              </span>
                              <Link
                                to={`/orders/${order.id}`}
                                className="text-xs font-semibold text-[#18181B] hover:text-[#78716C] flex items-center gap-1"
                              >
                                <span>Chi tiết</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>

                          {/* Items summary */}
                          <div className="flex items-center gap-3 overflow-x-auto py-1">
                            {order.items?.slice(0, 4).map((item, i) => (
                              <div key={i} className="flex items-center gap-2 shrink-0">
                                <img
                                  src={item.image}
                                  alt=""
                                  className="w-12 h-14 object-cover object-top rounded border border-[#ECEAE7] bg-[#F0EFED]"
                                />
                                <div className="text-[11px] space-y-0.5">
                                  <div className="font-semibold text-[#18181B] truncate max-w-[140px]">
                                    {item.productName}
                                  </div>
                                  <div className="text-[#78716C]">
                                    {item.colorName} • Size {item.size} • x{item.quantity}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between text-xs pt-2 border-t border-[#ECEAE7]">
                            <span className="text-[#78716C]">Tổng thanh toán ({order.items?.length || 0} món):</span>
                            <span className="font-bold text-sm text-[#18181B]">
                              {formatPrice(order.totalAmount)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: SẢN PHẨM YÊU THÍCH */}
            {activeTab === 'wishlist' && (
              <div className="space-y-6">
                <div className="border-b border-[#ECEAE7] pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[#18181B]">Sản phẩm yêu thích</h2>
                    <p className="text-xs text-[#78716C] mt-0.5">
                      Danh sách các mẫu trang phục bạn đã lưu lại để tham khảo hoặc mua sắm sau.
                    </p>
                  </div>
                  <Link to="/products" className="text-xs font-semibold text-[#18181B] hover:underline">
                    Xem thêm sản phẩm →
                  </Link>
                </div>

                {wishlistProducts.length === 0 ? (
                  <div className="py-12 text-center space-y-3 bg-[#F7F7F6] rounded-xl border border-[#ECEAE7]">
                    <div className="w-12 h-12 rounded-full bg-white mx-auto flex items-center justify-center text-[#78716C]">
                      <Heart className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <h3 className="text-sm font-bold text-[#18181B]">Danh sách yêu thích trống</h3>
                    <p className="text-xs text-[#78716C] max-w-sm mx-auto">
                      Hãy bấm vào biểu tượng trái tim ở từng sản phẩm để lưu lại phong cách yêu thích của bạn!
                    </p>
                    <Link to="/products">
                      <Button size="sm" className="text-xs rounded-lg bg-[#18181B] text-white mt-2">
                        Khám phá Catalog
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                    {wishlistProducts.map((p) => (
                      <ProductCard key={p.id} product={p} hidePrice={false} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: SỞ THÍCH & KÍCH CỠ */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div className="border-b border-[#ECEAE7] pb-3">
                  <h2 className="text-base font-bold text-[#18181B]">Sở thích & Kích cỡ trang phục</h2>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    Tùy chỉnh kích cỡ thường mặc và phong cách yêu thích để trải nghiệm mua sắm được cá nhân hóa.
                  </p>
                </div>

                {/* Sizes Selection */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-[#18181B] uppercase tracking-wider">
                    Kích cỡ thường mặc (Size)
                  </label>
                  <p className="text-xs text-[#78716C]">
                    Hệ thống sẽ ưu tiên lọc các sản phẩm còn kích cỡ này khi bạn duyệt Catalog:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {ALL_SIZES.map((sz) => {
                      const isSelected = preferredSizes.includes(sz);
                      if (!currentUser) {
    return null;
  }

  return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => toggleSize(sz)}
                          className={`w-12 h-10 rounded-lg flex items-center justify-center text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#18181B] text-white shadow-xs'
                              : 'bg-white border border-[#ECEAE7] text-[#292524] hover:bg-[#F0EFED]'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Styles Selection */}
                <div className="space-y-3 pt-4 border-t border-[#ECEAE7]">
                  <label className="block text-xs font-bold text-[#18181B] uppercase tracking-wider">
                    Phong cách yêu thích
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_STYLES.map((st) => {
                      const isSelected = preferredStyles.includes(st);
                      if (!currentUser) {
    return null;
  }

  return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => toggleStyle(st)}
                          className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#18181B] text-white shadow-xs'
                              : 'bg-white border border-[#ECEAE7] text-[#292524] hover:bg-[#F0EFED]'
                          }`}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-[#ECEAE7] flex justify-end">
                  <Button
                    onClick={handleSavePreferences}
                    disabled={isSavingPreferences}
                    className="h-10 px-5 text-xs font-semibold bg-[#18181B] hover:bg-[#3F3F46] text-white rounded-lg transition-colors cursor-pointer"
                  >
                    {isSavingPreferences ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 mr-1.5" />
                        Lưu sở thích
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 6: BẢO MẬT TÀI KHOẢN */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="border-b border-[#ECEAE7] pb-3">
                  <h2 className="text-base font-bold text-[#18181B]">Bảo mật tài khoản</h2>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    Quản lý mật khẩu đăng nhập và phiên hoạt động của tài khoản.
                  </p>
                </div>

                {/* Password Change Form */}
                <form onSubmit={handleSavePassword} className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#18181B]">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-lg border border-[#D6D3D1] text-xs focus:outline-none focus:border-[#18181B]"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#18181B]">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-lg border border-[#D6D3D1] text-xs focus:outline-none focus:border-[#18181B]"
                      placeholder="Tối thiểu 6 ký tự"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#18181B]">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-lg border border-[#D6D3D1] text-xs focus:outline-none focus:border-[#18181B]"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>

                  {passwordError && (
                    <p className="text-xs text-[#B91C1C]">{passwordError}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={isSavingPassword}
                    className="h-10 px-5 text-xs font-semibold bg-[#18181B] hover:bg-[#3F3F46] text-white rounded-lg transition-colors cursor-pointer"
                  >
                    {isSavingPassword ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Đang cập nhật...
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 mr-1.5" />
                        Đổi mật khẩu
                      </>
                    )}
                  </Button>
                </form>

                {/* Active Sessions */}
                <div className="pt-6 border-t border-[#ECEAE7] space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B]">
                    Thiết bị đang đăng nhập
                  </h3>
                  <div className="p-3.5 rounded-xl border border-[#ECEAE7] bg-[#F7F7F6]/50 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-xs text-[#18181B] flex items-center gap-1.5">
                        <span>Trình duyệt hiện tại (Windows)</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] text-emerald-700 font-bold">Đang hoạt động</span>
                      </div>
                      <p className="text-[11px] text-[#78716C]">Phiên làm việc này được bảo vệ bởi phiên xác thực cục bộ</p>
                    </div>

                    <button
                      onClick={() => {
                        MockRepo.logout();
                        success('Đã đăng xuất', 'Bạn đã đăng xuất khỏi phiên làm việc.');
                        navigate('/login');
                      }}
                      className="text-xs font-semibold text-[#B91C1C] hover:underline cursor-pointer"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
