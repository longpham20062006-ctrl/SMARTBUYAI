import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MockRepo } from '@/mocks/repository';
import { useToast } from '@/components/ui/toast';
import { Eye, EyeOff } from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { success } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Vui lòng nhập họ tên của bạn';
    if (!email.trim() || !email.includes('@')) errs.email = 'Vui lòng nhập email hợp lệ';
    if (!phone.trim()) errs.phone = 'Vui lòng nhập số điện thoại';
    if (!password.trim() || password.length < 6) errs.password = 'Mật khẩu cần tối thiểu 6 ký tự';
    setErrors(errs);

    if (Object.keys(errs).length === 0) {
      MockRepo.updateUserProfile({
        name,
        email,
        phone,
      });
      success('Đăng ký tài khoản thành công', `Chào mừng ${name} đến với SMARTBUY AI!`);
      navigate('/');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-brand-paper rounded-brand-xl border border-brand-border/60 shadow-card overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Form đăng ký */}
        <div className="p-8 sm:p-10 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <BrandLogo variant="header" />
              <span className="text-[10px] bg-brand-sand px-2 py-0.5 rounded-sm font-semibold text-brand-secondary">
                Demo
              </span>
            </div>

            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-brand-charcoal mt-1">
              Đăng ký tài khoản
            </h2>
            <p className="text-xs text-brand-secondary mt-1">
              Khởi tạo hồ sơ để nhận tư vấn size và lưu trữ bộ sưu tập yêu thích.
            </p>

            <form onSubmit={handleRegister} className="space-y-4 mt-6">
              <Input
                label="Họ và tên của bạn *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                placeholder="Ví dụ: Lê Thảo My"
              />

              <Input
                label="Địa chỉ Email *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                placeholder="name@example.com"
              />

              <Input
                label="Số điện thoại di động *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
                placeholder="0912345678"
              />

              <Input
                label="Mật khẩu *"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                placeholder="Tối thiểu 6 ký tự"
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
                Tạo tài khoản thành viên
              </Button>
            </form>
          </div>

          <div className="text-center pt-4 border-t border-brand-border/40 text-xs">
            <span className="text-brand-secondary">Đã có tài khoản? </span>
            <Link to="/login" className="text-brand-forest font-semibold hover:underline">
              Đăng nhập ngay
            </Link>
          </div>
        </div>

        {/* Ảnh bên phải */}
        <div className="relative hidden md:block bg-brand-sand">
          <img
            src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1000&auto=format&fit=crop&q=80"
            alt="SMARTBUY AI Editorial"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 text-white space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-brand-champagne">
              Ưu đãi thành viên
            </span>
            <h3 className="font-editorial text-2xl font-normal leading-snug">
              Nhận voucher 100.000 ₫ cho đơn hàng thời trang đầu tiên.
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};
