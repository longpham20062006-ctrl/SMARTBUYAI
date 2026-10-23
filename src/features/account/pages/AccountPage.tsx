import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { SizeCode } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import {
  User as UserIcon,
  MapPin,
  Heart,
  ClipboardList,
  Save,
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  useRepoSubscription(['auth']);
  const currentUser = MockRepo.getCurrentUser();
  const { success } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'preferences'>('profile');

  // Form states
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [email, setEmail] = useState(currentUser.email);

  // Address states
  const defaultAddr = currentUser.savedAddresses?.[0] || {
    fullName: currentUser.name,
    phone: currentUser.phone,
    email: currentUser.email,
    province: 'Thành phố Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    street: '45 Đường Lê Duẩn',
    note: '',
  };
  const [street, setStreet] = useState(defaultAddr.street);
  const [district, setDistrict] = useState(defaultAddr.district);
  const [province, setProvince] = useState(defaultAddr.province);

  // Preferences
  const [preferredSizes, setPreferredSizes] = useState<SizeCode[]>(
    currentUser.preferences?.preferredSizes || ['S', 'M']
  );

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    MockRepo.updateUserProfile({
      name,
      phone,
      email,
      savedAddresses: [
        {
          fullName: name,
          phone,
          email,
          province,
          district,
          ward: defaultAddr.ward,
          street,
          note: defaultAddr.note,
        },
      ],
      preferences: {
        ...currentUser.preferences,
        preferredSizes,
      },
    });
    success('Đã lưu thông tin tài khoản', 'Dữ liệu cá nhân của bạn đã được cập nhật.');
  };

  const toggleSize = (size: SizeCode) => {
    setPreferredSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Header */}
      <div className="border-b border-brand-border/60 pb-6">
        <div className="flex items-center gap-2 text-xs text-brand-muted mb-2">
          <Link to="/" className="hover:text-brand-charcoal">Trang chủ</Link>
          <span>/</span>
          <span className="text-brand-charcoal font-medium">Tài khoản thành viên</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-brand-sand border border-brand-border shrink-0">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-lg text-brand-forest">
                  {currentUser.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-brand-charcoal">
                {currentUser.name}
              </h1>
              <p className="text-xs text-brand-secondary">{currentUser.email} • Vai trò: {currentUser.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}</p>
            </div>
          </div>

          <Link to="/orders">
            <Button variant="outline" size="sm" className="text-xs">
              <ClipboardList className="w-4 h-4 mr-1.5" />
              Xem đơn hàng đã đặt
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid: Tabs Sidebar 3 cột + Content 9 cột */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Navigation Tabs */}
        <div className="md:col-span-4 bg-brand-paper rounded-brand-xl p-4 border border-brand-border/60 space-y-1 text-xs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-brand font-medium transition-colors text-left cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-brand-forest text-brand-ivory font-semibold'
                : 'text-brand-secondary hover:bg-brand-sand/60 hover:text-brand-charcoal'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Thông tin cá nhân</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-brand font-medium transition-colors text-left cursor-pointer ${
              activeTab === 'addresses'
                ? 'bg-brand-forest text-brand-ivory font-semibold'
                : 'text-brand-secondary hover:bg-brand-sand/60 hover:text-brand-charcoal'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Sổ địa chỉ nhận hàng</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-brand font-medium transition-colors text-left cursor-pointer ${
              activeTab === 'preferences'
                ? 'bg-brand-forest text-brand-ivory font-semibold'
                : 'text-brand-secondary hover:bg-brand-sand/60 hover:text-brand-charcoal'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Sở thích & Kích cỡ của bạn</span>
          </button>
        </div>

        {/* Content Box */}
        <div className="md:col-span-8 bg-brand-paper rounded-brand-xl p-6 sm:p-8 border border-brand-border/60 shadow-subtle">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-brand-charcoal border-b border-brand-border/40 pb-2">
                  Thông tin cá nhân
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Họ và tên"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Input
                    label="Số điện thoại"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-brand-charcoal border-b border-brand-border/40 pb-2">
                  Địa chỉ giao hàng mặc định
                </h2>
                <Input
                  label="Địa chỉ số nhà & tên đường"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Quận / Huyện"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  />
                  <Input
                    label="Tỉnh / Thành phố"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                  />
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-brand-charcoal border-b border-brand-border/40 pb-2">
                  Kích cỡ & Gu thời trang yêu thích
                </h2>
                <p className="text-xs text-brand-secondary">
                  Trợ lý AI Stylist sẽ ưu tiên đề xuất các thiết kế có sẵn kích cỡ này:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as SizeCode[]).map((size) => {
                    const isSelected = preferredSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`w-12 h-10 rounded-brand flex items-center justify-center text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-brand-forest text-brand-ivory'
                            : 'bg-brand-sand text-brand-secondary hover:bg-brand-border/60'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-brand-border/40 flex justify-end">
              <Button type="submit" variant="primary" size="md" className="text-xs">
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Lưu thay đổi hồ sơ
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
