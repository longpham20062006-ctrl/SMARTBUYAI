import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MockRepo } from '@/mocks/repository';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/components/ui/toast';
import { Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const VIETNAMESE_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim().replace(/\s+/g, '');

    if (!trimmedName) {
      errs.name = 'Vui lòng nhập họ và tên của bạn';
    }
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      errs.email = 'Vui lòng nhập email hợp lệ (ví dụ: nam@example.com)';
    }
    if (!trimmedPhone || !VIETNAMESE_PHONE_REGEX.test(trimmedPhone)) {
      errs.phone = 'Số điện thoại không hợp lệ (hỗ trợ 03, 05, 07, 08, 09 gồm 10 chữ số)';
    }
    if (!password.trim() || password.length < 6) {
      errs.password = 'Mật khẩu cần tối thiểu 6 ký tự';
    }
    setErrors(errs);

    if (Object.keys(errs).length === 0) {
      setIsLoading(true);

      try {
        // 1. Đăng ký trực tiếp với Java Spring Boot Backend
        const backendRes = await apiClient.register({
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          password,
        });

        if (backendRes.success && backendRes.data?.user) {
          const u = backendRes.data.user;
          MockRepo.setCurrentUser({
            id: u.id || `user-${Date.now()}`,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: 'customer',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
            createdAt: new Date().toISOString(),
          });
          try {
            sessionStorage.removeItem('sb_intro_seen');
          } catch {
            // ignore
          }
          setIsLoading(false);
          success('Đăng ký tài khoản thành công', `Chào mừng ${u.name} đến với SMARTBUY AI!`);
          navigate('/');
          return;
        }

        // Nếu máy chủ backend từ chối (trùng email hoặc trùng số điện thoại)
        if (backendRes.message && backendRes.message !== 'Không thể kết nối đến máy chủ đăng ký') {
          setIsLoading(false);
          toastError('Đăng ký không thành công', backendRes.message);
          return;
        }

        // 2. Fallback offline nếu backend chưa khởi động
        const localRes = MockRepo.register({
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          password,
        });
        setIsLoading(false);

        if (localRes.success && localRes.user) {
          try {
            sessionStorage.removeItem('sb_intro_seen');
          } catch {
            // ignore
          }
          success('Đăng ký tài khoản thành công', `Chào mừng ${localRes.user.name} đến với SMARTBUY AI!`);
          navigate('/');
        } else {
          toastError('Đăng ký không thành công', localRes.message || 'Email này đã tồn tại trong hệ thống');
        }
      } catch (err: any) {
        setIsLoading(false);
        toastError('Lỗi đăng ký', err?.message || 'Không thể kết nối đến máy chủ đăng ký');
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-[#FAFAFA]">
      <div className="max-w-4xl w-full bg-white rounded-3xl border border-[#E4E4E7] shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Form Panel */}
        <div className="p-8 sm:p-10 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <BrandLogo variant="header" showTagline={false} />
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-emerald-200">
                Thành viên mới
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              Tạo tài khoản thành viên
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Đăng ký để nhận voucher ưu đãi và lưu lịch sử phong cách AI Stylist.
            </p>

            <form onSubmit={handleRegister} className="space-y-3.5 mt-6">
              <Input
                label="Họ và tên của bạn *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                placeholder="Ví dụ: Hoàng Bảo Nam"
              />

              <Input
                label="Địa chỉ Email *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                placeholder="nam.hoang@gmail.com"
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
                    className="text-zinc-400 hover:text-zinc-800 cursor-pointer"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="w-full h-11 text-xs uppercase font-bold tracking-wider bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl shadow-md mt-2"
              >
                {isLoading ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký & Mua sắm'}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="text-zinc-500">Đã có tài khoản?</span>
            <Link to="/login" className="text-[#8B5CF6] font-bold hover:underline">
              Đăng nhập ngay →
            </Link>
          </div>
        </div>

        {/* Visual Panel (Desktop) */}
        <div className="relative hidden md:flex flex-col justify-between p-8 bg-zinc-950 text-white overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1000&auto=format&fit=crop&q=80"
            alt="SMARTBUY AI Member"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

          <div className="relative z-10 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Chào đón thành viên mới
            </span>
          </div>

          <div className="relative z-10 space-y-3 pt-20">
            <h3 className="font-editorial text-2xl lg:text-3xl font-bold leading-snug tracking-tight text-white">
              Đặc quyền thành viên SMARTBUY AI Club.
            </h3>
            <ul className="text-xs text-zinc-300 space-y-2 font-sans">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Giảm trực tiếp 100.000 ₫ cho đơn hàng thời trang đầu tiên.</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Lưu thông số số đo (ngực, eo, hông) tự động chọn size chuẩn xác.</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Miễn phí đổi trả 15 ngày tận nhà trên toàn quốc.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
