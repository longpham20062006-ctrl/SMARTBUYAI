import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MockRepo } from '@/mocks/repository';
import { useToast } from '@/components/ui/toast';
import { Eye, EyeOff, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success } = useToast();

  const redirectUrl = searchParams.get('redirect');

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
      if (email.toLowerCase().includes('admin')) {
        MockRepo.login(email, password);
        success('Đăng nhập thành công', 'Chào mừng Quản trị viên (Admin) SMARTBUY AI');
        navigate(redirectUrl || '/admin');
      } else {
        MockRepo.login(email, password);
        success('Đăng nhập thành công', 'Chào mừng bạn quay lại với SMARTBUY AI');
        navigate(redirectUrl || '/account');
      }
    }
  };

  const handleQuickLogin = (role: 'customer' | 'admin') => {
    MockRepo.switchUser(role);
    success(
      `Đã đăng nhập demo: ${role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}`,
      'Phiên làm việc thử nghiệm đã sẵn sàng.'
    );
    navigate(redirectUrl || (role === 'admin' ? '/admin' : '/account'));
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F7F7F6]">
      <div className="max-w-4xl w-full bg-white rounded-2xl border border-[#ECEAE7] shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Ảnh thời trang bên cạnh (Desktop) */}
        <div className="relative hidden md:block bg-[#F0EFED]">
          <img
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=80"
            alt="SMARTBUY AI Editorial"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 text-white space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#DDD6FE] bg-white/10 px-2 py-0.5 rounded backdrop-blur-sm">
              THÀNH VIÊN SMARTBUY AI
            </span>
            <h3 className="text-2xl font-bold leading-snug tracking-tight">
              Thời trang tối giản có gu và trải nghiệm công nghệ AI.
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Lưu kích cỡ chuẩn, quản lý lịch sử đơn hàng và trải nghiệm tính năng thử đồ ảo AI Virtual Try-On.
            </p>
          </div>
        </div>

        {/* Form đăng nhập */}
        <div className="p-8 sm:p-10 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider text-[#78716C]">
                TÀI KHOẢN
              </span>
              <span className="text-[10px] bg-[#F0EFED] px-2 py-0.5 rounded font-semibold text-[#18181B] border border-[#ECEAE7]">
                Mô phỏng demo
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B] mt-2">
              Đăng nhập
            </h2>
            <p className="text-xs text-[#78716C] mt-1">
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
                <span>Đăng nhập vào hệ thống</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </form>
          </div>

          {/* Quick login demo buttons */}
          <div className="space-y-3 pt-4 border-t border-[#ECEAE7] text-xs">
            <span className="text-[#78716C] block text-center font-medium">Hoặc đăng nhập nhanh 1 chạm theo vai trò:</span>
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-10 border-[#ECEAE7] hover:border-[#18181B] text-[#18181B] rounded-xl font-semibold"
                onClick={() => handleQuickLogin('customer')}
              >
                <UserCheck className="w-4 h-4 mr-1.5 text-[#18181B]" />
                Khách hàng
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-10 border-[#ECEAE7] hover:border-[#18181B] text-[#18181B] rounded-xl font-semibold"
                onClick={() => handleQuickLogin('admin')}
              >
                <ShieldCheck className="w-4 h-4 mr-1.5 text-[#7C3AED]" />
                Quản trị viên
              </Button>
            </div>

            <div className="text-center pt-2">
              <span className="text-[#78716C]">Chưa có tài khoản? </span>
              <Link to="/register" className="text-[#18181B] font-semibold hover:underline">
                Đăng ký thành viên mới
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
