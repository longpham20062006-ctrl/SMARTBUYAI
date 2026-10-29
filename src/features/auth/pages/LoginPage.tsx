import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/components/ui/toast';
import { Eye, EyeOff, Sparkles, ArrowRight, BookOpen, Ruler, AlertCircle, ShieldCheck, Lock } from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { LuxuryParticlesCanvas } from '@/components/effects/LuxuryParticlesCanvas';
import { User } from '@/types';

// Danh sách hình ảnh thời trang cao cấp đã kiểm tra có sẵn trong dự án (public/images/anh_trangchu/)
const EDITORIAL_SLIDES = [
  {
    image: '/images/anh_trangchu/0fb1b05f-e815-4159-8fe5-abe2c079b9e1.png',
    title: 'STREETWEAR RUNWAY 2026',
    subtitle: 'Nét giao thoa giữa thời trang dạo phố và công nghệ AI',
    tag: 'EDITORIAL DROP',
  },
  {
    image: '/images/anh_trangchu/421e2c20-a146-443d-b809-4ab18442b461.png',
    title: 'AVANT-GARDE COUTURE',
    subtitle: 'Đường nét thiết kế nữ tính, tự do và sắc sảo',
    tag: 'HAUTE COUTURE',
  },
  {
    image: '/images/anh_trangchu/3b35766f-f734-4c5a-9990-3223433700dd.png',
    title: 'URBAN MINIMALIST',
    subtitle: 'Sự tối giản đương đại trên từng thước vải thượng hạng',
    tag: 'NEW HORIZON',
  },
  {
    image: '/images/anh_trangchu/68818615-3bdd-4a63-bf3f-cc3bb5bde4aa.png',
    title: 'SILK & DRAPING LOOKBOOK',
    subtitle: 'Chất liệu lụa tơ tằm mềm mại phối chuẩn phom dáng',
    tag: 'SIGNATURE LOOK',
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: toastError } = useToast();

  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect');
  const targetPath = redirectUrl ? decodeURIComponent(redirectUrl) : null;

  // Luồng đăng nhập thủ công: Tuyệt đối KHÔNG điền sẵn tài khoản/mật khẩu
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Ken Burns & Crossfade Slider state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Preload hình ảnh và tự động chuyển slide mỗi 6 giây
  useEffect(() => {
    EDITORIAL_SLIDES.forEach((s) => {
      const img = new Image();
      img.src = s.image;
    });

    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % EDITORIAL_SLIDES.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const errs: Record<string, string> = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errs.email = 'Vui lòng nhập địa chỉ email hoặc tên đăng nhập';
    } else if (!trimmedEmail.includes('@') && trimmedEmail.length < 3) {
      errs.email = 'Vui lòng nhập địa chỉ email hợp lệ';
    }

    if (!password) {
      errs.password = 'Vui lòng nhập mật khẩu';
    }
    setErrors(errs);

    if (Object.keys(errs).length > 0) return;

    setIsLoading(true);

    try {
      // 1. Xác thực trực tiếp với Java Spring Boot REST API
      const backendRes = await apiClient.login({ email: trimmedEmail, password });

      let authenticatedUser: User | null = null;
      let authenticatedRole: 'admin' | 'customer' = 'customer';

      if (backendRes?.success && backendRes.data?.user) {
        const u = backendRes.data.user;
        authenticatedRole = (u.role || '').toUpperCase() === 'ADMIN' ? 'admin' : 'customer';
        authenticatedUser = {
          id: u.id || `user-${Date.now()}`,
          name: u.name || 'Người dùng SMARTBUY',
          email: u.email || trimmedEmail,
          phone: u.phone || '0901234567',
          role: authenticatedRole,
          avatar: u.avatar || (authenticatedRole === 'admin'
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'),
          createdAt: new Date().toISOString(),
        };

        MockRepo.setCurrentUser(authenticatedUser);
      } else {
        // 2. Fallback nếu backend đang ngoại tuyến: Xác thực theo Database Người Dùng Cục Bộ
        const localRes = MockRepo.login(trimmedEmail, password);
        if (localRes.success && localRes.user) {
          authenticatedUser = localRes.user;
          authenticatedRole = localRes.user.role === 'admin' ? 'admin' : 'customer';
        } else {
          const errMsg = backendRes?.message || localRes.message || 'Email hoặc mật khẩu không chính xác';
          setServerError(errMsg);
          toastError('Đăng nhập thất bại', errMsg);
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(false);

      if (!authenticatedUser) {
        setServerError('Không thể xác minh thông tin tài khoản');
        return;
      }

      // TRẠNG THÁI 3: ĐĂNG NHẬP ADMIN (Vào thẳng Dashboard quản trị, tuyệt đối KHÔNG chạy Intro 3D, KHÔNG sang trang sản phẩm)
      if (authenticatedRole === 'admin') {
        try {
          sessionStorage.setItem('sb_intro_seen', '1');
          sessionStorage.removeItem('sb_post_intro_redirect');
        } catch {
          // ignore
        }
        success('Xác thực quyền Quản trị viên (Admin) thành công', 'Chuyển thẳng đến Bảng Quản Trị Hệ Thống...');
        navigate('/admin/dashboard', { replace: true });
        return;
      }

      // TRẠNG THÁI 2: ĐĂNG NHẬP CUSTOMER
      // Xóa cờ intro_seen của phiên cũ để kích hoạt Intro 3D cho phiên đăng nhập mới
      try {
        sessionStorage.removeItem('sb_intro_seen');
      } catch {
        // ignore
      }
      success('Đăng nhập thành công', `Chào mừng ${authenticatedUser.name} trở lại với SMARTBUY AI!`);

      // Nếu khách hàng trước đó bấm vào link sản phẩm hoặc trang khác, lưu lại để chuyển đến sau Intro 3D
      const destination = targetPath && !targetPath.startsWith('/admin') ? targetPath : '/';
      if (destination !== '/') {
        try {
          sessionStorage.setItem('sb_post_intro_redirect', destination);
        } catch {
          // ignore
        }
      }
      navigate('/', { replace: true });
    } catch (err: any) {
      setIsLoading(false);
      const msg = err?.message || 'Có lỗi xảy ra trong quá trình xác thực';
      setServerError(msg);
      toastError('Lỗi đăng nhập', msg);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto rounded-3xl border border-white/10 bg-[#0C0C12]/90 backdrop-blur-2xl shadow-2xl shadow-purple-950/30 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] relative select-none">
      
      {/* Background Micro Particles Animation */}
      <LuxuryParticlesCanvas className="z-0 opacity-70" />

      {/* ========================================================================= */}
      {/* CỘT TRÁI (55–60%): CINEMATIC HIGH-FASHION VISUAL & KEN BURNS MOTION       */}
      {/* ========================================================================= */}
      <div className="relative hidden lg:flex lg:col-span-7 flex-col justify-between p-10 overflow-hidden bg-black z-10 border-r border-white/10">
        
        {/* Layer hình ảnh chuyển động Ken Burns & Crossfade */}
        {EDITORIAL_SLIDES.map((slide, idx) => {
          const isActive = idx === currentSlideIndex;
          return (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className={`w-full h-full object-cover object-center filter brightness-[0.78] contrast-[1.08] transition-transform duration-[6000ms] ease-out ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
              {/* Lớp gradient thời trang cao cấp */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0E] via-[#0A0A0E]/35 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#8B5CF6]/10 to-[#0A0A0E]/80" />
            </div>
          );
        })}

        {/* Top Tag & Brand Accents */}
        <div className="relative z-20 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-[#18F4FC] text-xs font-bold tracking-wider uppercase shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#18F4FC] animate-pulse" />
            <span>AI-POWERED LUXURY ATELIER</span>
          </div>

          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[11px] font-mono text-zinc-300">
            <span className="text-[#8B5CF6] font-bold">0{currentSlideIndex + 1}</span>
            <span className="text-zinc-600">/</span>
            <span>0{EDITORIAL_SLIDES.length}</span>
          </div>
        </div>

        {/* Bottom Editorial Content & Slide Indicators */}
        <div className="relative z-20 space-y-6 pt-24 text-left">
          <div className="space-y-2 max-w-lg">
            <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-[#A78BFA] bg-[#8B5CF6]/20 px-2.5 py-0.5 rounded-sm border border-[#8B5CF6]/30">
              {EDITORIAL_SLIDES[currentSlideIndex].tag}
            </span>
            <h2 className="text-3xl xl:text-4xl font-black text-white uppercase tracking-tight leading-tight drop-shadow-md">
              {EDITORIAL_SLIDES[currentSlideIndex].title}
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed font-sans font-medium line-clamp-2 drop-shadow-xs">
              {EDITORIAL_SLIDES[currentSlideIndex].subtitle}
            </p>
          </div>

          {/* Slide Progress Bars */}
          <div className="flex items-center gap-2 pt-2">
            {EDITORIAL_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentSlideIndex(i)}
                className={`h-1 rounded-full transition-all duration-500 cursor-pointer ${
                  i === currentSlideIndex ? 'w-10 bg-[#8B5CF6] shadow-sm shadow-[#8B5CF6]/50' : 'w-3 bg-white/25 hover:bg-white/50'
                }`}
                aria-label={`Chuyển đến slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Quick Info Links */}
          <div className="pt-2 flex items-center gap-4 text-xs font-medium text-zinc-400 border-t border-white/10">
            <Link to="/about" className="hover:text-white transition-colors flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Thương hiệu</span>
            </Link>
            <span>•</span>
            <Link to="/size-guide" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Bảng thông số Size</span>
            </Link>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Bảo mật 256-bit</span>
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CỘT PHẢI (40–45%): KHUNG ĐĂNG NHẬP HIỆN ĐẠI (GLASSMORPHISM CAO CẤP)      */}
      {/* ========================================================================= */}
      <div className="lg:col-span-5 p-7 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6 relative z-10 bg-[#0F0F16]/95 lg:bg-transparent">
        
        {/* Top Header Card */}
        <div>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <BrandLogo variant="header" showTagline={false} />
            <span className="inline-flex items-center gap-1 text-[10px] bg-[#8B5CF6]/15 text-[#C4B5FD] px-3 py-1 rounded-full font-mono font-bold uppercase tracking-wider border border-[#8B5CF6]/30">
              <Lock className="w-3 h-3 text-[#A78BFA]" />
              SECURE ACCESS
            </span>
          </div>

          <div className="space-y-1.5 text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              Đăng nhập tài khoản
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Trải nghiệm thời trang thông minh với AI Stylist, Virtual Try-On và trung tâm quản trị.
            </p>
          </div>

          {/* Server Error Alert (Giữ nguyên data-testid cho kiểm thử tự động) */}
          {serverError && (
            <div
              data-testid="login-error-alert"
              className="mt-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 animate-fade-in shadow-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-medium">{serverError}</span>
            </div>
          )}

          {/* Form Đăng Nhập Thủ Công (Form trống, không demo buttons, focus mượt) */}
          <form onSubmit={handleLogin} className="space-y-4 mt-6 text-left">
            <div>
              <label
                htmlFor="login-email"
                className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5"
              >
                Địa chỉ Email
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="nhap.email@smartbuy.local"
                  autoComplete="username"
                  disabled={isLoading}
                  className="w-full bg-[#171722] text-white placeholder:text-zinc-600 border border-white/15 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30 rounded-2xl px-4 py-3 text-base sm:text-sm outline-none transition-all shadow-inner"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-400 mt-1 font-medium pl-1">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider"
                >
                  Mật khẩu
                </label>
              </div>
              <div className="relative flex items-center">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  placeholder="Nhập mật khẩu của bạn"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="w-full bg-[#171722] text-white placeholder:text-zinc-600 border border-white/15 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30 rounded-2xl px-4 py-3 pr-11 text-base sm:text-sm outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400 mt-1 font-medium pl-1">{errors.password}</p>
              )}
            </div>

            {/* Nút Đăng nhập cao cấp hiệu ứng Gradient & Loading */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full mt-2 h-12 flex items-center justify-center gap-2 text-xs uppercase font-extrabold tracking-wider rounded-2xl text-white transition-all shadow-lg cursor-pointer ${
                isLoading
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-75'
                  : 'bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6366F1] hover:from-[#9061F9] hover:to-[#6D28D9] shadow-[#8B5CF6]/30 hover:shadow-[#8B5CF6]/45 active:scale-[0.99]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang kiểm tra xác thực...</span>
                </>
              ) : (
                <>
                  <span>Xác thực & Đăng nhập</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom Footer & Register Link */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
          <span className="text-zinc-500">Chưa có tài khoản thành viên?</span>
          <Link
            to="/register"
            className="text-[#A78BFA] hover:text-white font-bold transition-colors flex items-center gap-1"
          >
            <span>Đăng ký tài khoản mới</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
