import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MockRepo } from '@/mocks/repository';
import { useToast } from '@/components/ui/toast';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

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
      MockRepo.switchUser('customer');
      MockRepo.updateUserProfile({
        name,
        email,
        phone,
      });
      success('Đăng ký tài khoản thành công', `Chào mừng ${name} đến với SMARTBUY AI!`);
      navigate('/account');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F7F7F6]">
      <div className="max-w-4xl w-full bg-white rounded-2xl border border-[#ECEAE7] shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Form đăng ký */}
        <div className="p-8 sm:p-10 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider text-[#78716C]">
                THÀNH VIÊN MỚI
              </span>
              <span className="text-[10px] bg-[#F0EFED] px-2 py-0.5 rounded font-semibold text-[#18181B] border border-[#ECEAE7]">
                Mô phỏng demo
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B] mt-2">
              Đăng ký tài khoản
            </h2>
            <p className="text-xs text-[#78716C] mt-1">
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
                    className="text-[#78716C] hover:text-[#18181B] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 text-xs uppercase font-bold tracking-wider bg-[#18181B] hover:bg-[#27272A] text-white rounded-xl"
              >
                <span>Tạo tài khoản thành viên</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </form>
          </div>

          <div className="text-center pt-4 border-t border-[#ECEAE7] text-xs">
            <span className="text-[#78716C]">Đã có tài khoản? </span>
            <Link to="/login" className="text-[#18181B] font-semibold hover:underline">
              Đăng nhập ngay
            </Link>
          </div>
        </div>

        {/* Ảnh bên phải */}
        <div className="relative hidden md:block bg-[#F0EFED]">
          <img
            src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1000&auto=format&fit=crop&q=80"
            alt="SMARTBUY AI Editorial"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 text-white space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#DDD6FE] bg-white/10 px-2 py-0.5 rounded backdrop-blur-sm">
              ƯU ĐÃI THÀNH VIÊN
            </span>
            <h3 className="text-2xl font-bold leading-snug tracking-tight">
              Nhận voucher 100.000 ₫ cho đơn hàng thời trang đầu tiên.
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Trải nghiệm mua sắm có gu, đồng bộ địa chỉ giao hàng và nhận gợi ý phối đồ AI Stylist miễn phí.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
