import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MockRepo } from '@/mocks/repository';
import { useToast } from '@/components/ui/toast';
import { Eye, EyeOff, ShieldCheck, UserCheck } from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { success } = useToast();

  const [email, setEmail] = useState('khachhang@smartbuy.vn');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!email.trim() || !email.includes('@')) errs.email = 'Vui lòng nhập email hợp lệ';
    if (!password.trim()) errs.password = 'Vui lòng nhập mật khẩu';
    setErrors(errs);

    if (Object.keys(errs).length === 0) {
      if (email.includes('admin')) {
        MockRepo.switchUser('admin');
        success('Đăng nhập thành công với vai trò Quản trị viên (Admin)');
        navigate('/admin');
      } else {
        MockRepo.switchUser('customer');
        success('Đăng nhập thành công', 'Chào mừng bạn quay lại với SMARTBUY AI');
        navigate('/');
      }
    }
  };

  const handleQuickLogin = (role: 'customer' | 'admin') => {
    MockRepo.switchUser(role);
    success(
      `Đã đăng nhập demo: ${role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}`,
      'Phiên làm việc thử nghiệm đã sẵn sàng.'
    );
    navigate(role === 'admin' ? '/admin' : '/');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-brand-paper rounded-brand-xl border border-brand-border/60 shadow-card overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Ảnh thời trang bên cạnh (Desktop) */}
        <div className="relative hidden md:block bg-brand-sand">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&fit=crop&q=80"
            alt="SMARTBUY AI Editorial"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 text-white space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-brand-champagne">
              Thành viên SMARTBUY AI
            </span>
            <h3 className="font-editorial text-2xl font-normal leading-snug">
              Trải nghiệm mua sắm có gu và được cá nhân hóa.
            </h3>
            <p className="text-xs text-white/80">
              Lưu lại kích cỡ chuẩn, lịch sử đơn hàng và nhận gợi ý phong cách riêng từ AI Stylist.
            </p>
          </div>
        </div>

        {/* Form đăng nhập */}
        <div className="p-8 sm:p-10 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <BrandLogo variant="header" />
              <span className="text-[10px] bg-brand-sand px-2 py-0.5 rounded-sm font-semibold text-brand-secondary">
                Demo
              </span>
            </div>

            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-brand-charcoal mt-1">
              Đăng nhập
            </h2>
            <p className="text-xs text-brand-secondary mt-1">
              Nhập email hoặc sử dụng nút đăng nhập nhanh 1 chạm bên dưới:
            </p>

            <form onSubmit={handleLogin} className="space-y-4 mt-6">
              <Input
                label="Địa chỉ Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                placeholder="khachhang@smartbuy.vn"
              />

              <Input
                label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                endIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-brand-muted hover:text-brand-charcoal cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <Button type="submit" variant="primary" className="w-full h-11 text-xs uppercase font-semibold">
                Đăng nhập vào hệ thống
              </Button>
            </form>
          </div>

          {/* Quick login demo buttons */}
          <div className="space-y-3 pt-4 border-t border-brand-border/40 text-xs">
            <span className="text-brand-muted block text-center">Hoặc chọn nhanh vai trò để thử nghiệm:</span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleQuickLogin('customer')}
              >
                <UserCheck className="w-3.5 h-3.5 mr-1 text-brand-forest" />
                Khách hàng
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="text-xs"
                onClick={() => handleQuickLogin('admin')}
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-brand-terracotta" />
                Quản trị viên
              </Button>
            </div>

            <div className="text-center pt-2">
              <span className="text-brand-secondary">Chưa có tài khoản? </span>
              <Link to="/register" className="text-brand-forest font-semibold hover:underline">
                Đăng ký thành viên mới
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
