import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Shield, RefreshCw, HeartHandshake } from 'lucide-react';
import { MockRepo } from '@/mocks/repository';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export const SiteFooter: React.FC = () => {
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleResetDatabase = () => {
    MockRepo.resetAll();
    window.location.reload();
  };

  return (
    <footer className="bg-[#18181B] border-t border-[#27272A] text-white pt-14 pb-12 mt-20">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cam kết thương hiệu */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-[#27272A]">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center shrink-0 border border-[#8B5CF6]/30">
              <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">AI Outfit Stylist</h4>
              <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
                Tự động phối trọn bộ Áo + Quần + Phụ kiện theo ngân sách sinh viên và phong cách riêng của bạn.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center shrink-0 border border-[#8B5CF6]/30">
              <HeartHandshake className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Giá Học Sinh Sinh Viên</h4>
              <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
                Áo thun từ 79k, quần jeans từ 199k, phụ kiện từ 29k. Chất vải cotton 250gsm định lượng chuẩn.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center shrink-0 border border-[#8B5CF6]/30">
              <RefreshCw className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Đổi Size 15 Ngày Tận Nơi</h4>
              <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
                Hỗ trợ đổi size tận nhà nhanh chóng nếu mặc không vừa hoặc muốn đổi sang phong cách khác.
              </p>
            </div>
          </div>
        </div>

        {/* Các cột liên kết điều hướng */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-12">
          {/* Cột 1: Thương hiệu */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-sans text-2xl font-black tracking-tighter text-white">
                SMARTBUY
              </span>
              <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-sm bg-[#8B5CF6] text-white">
                AI
              </span>
            </div>
            <p className="text-xs text-[#A1A1AA] max-w-sm leading-relaxed">
              “Mặc chất theo cách riêng” — Cửa hàng thời trang Gen Z streetwear, Y2K và Korean casual với 130+ sản phẩm tuyển chọn cho giới trẻ.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#A1A1AA] pt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
              <span>Chế độ mô phỏng Frontend Single Page Application</span>
            </div>
          </div>

          {/* Cột 2: Mua sắm */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Thời trang
            </h5>
            <ul className="space-y-2.5 text-xs text-[#A1A1AA]">
              <li>
                <Link to="/products?gender=nam" className="hover:text-[#8B5CF6] transition-colors">
                  Thời trang Nam
                </Link>
              </li>
              <li>
                <Link to="/products?gender=nu" className="hover:text-[#8B5CF6] transition-colors">
                  Thời trang Nữ
                </Link>
              </li>
              <li>
                <Link to="/products?gender=unisex" className="hover:text-[#8B5CF6] transition-colors">
                  Bộ sưu tập Unisex
                </Link>
              </li>
              <li>
                <Link to="/products?category=phu-kien" className="hover:text-[#8B5CF6] transition-colors font-semibold text-white">
                  Phụ kiện & Trang sức
                </Link>
              </li>
              <li>
                <Link to="/collections" className="hover:text-[#8B5CF6] transition-colors">
                  Lookbook & Chiến dịch
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Dịch vụ & Trợ lý */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Trợ lý & Dịch vụ
            </h5>
            <ul className="space-y-2.5 text-xs text-[#A1A1AA]">
              <li>
                <Link to="/ai-stylist" className="hover:text-[#8B5CF6] transition-colors flex items-center gap-1.5 font-bold text-[#8B5CF6]">
                  <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>AI OUTFIT STYLIST</span>
                </Link>
              </li>
              <li>
                <Link to="/size-guide" className="hover:text-[#8B5CF6] transition-colors">
                  Bảng kích cỡ (Size Guide)
                </Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-[#8B5CF6] transition-colors">
                  So sánh sản phẩm
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-[#8B5CF6] transition-colors">
                  Tra cứu đơn hàng
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Hệ thống & Quản trị */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Hệ thống Demo
            </h5>
            <ul className="space-y-2.5 text-xs text-[#A1A1AA]">
              <li>
                <Link
                  to="/admin"
                  onClick={() => MockRepo.switchUser('admin')}
                  className="hover:text-[#8B5CF6] transition-colors flex items-center gap-1 font-semibold text-white"
                >
                  <Shield className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>Bảng quản trị (Admin)</span>
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-[#8B5CF6] transition-colors">
                  Tài khoản người dùng
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="text-xs text-[#A1A1AA] hover:text-rose-400 transition-colors cursor-pointer text-left"
                >
                  Khôi phục dữ liệu gốc
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bản quyền */}
        <div className="pt-8 border-t border-[#27272A] flex flex-col sm:flex-row items-center justify-between text-xs text-[#71717A] gap-4">
          <div>
            © 2026 SMARTBUY AI — Nền tảng thời trang thương mại điện tử Gen Z.
          </div>
          <div className="flex items-center gap-6">
            <span>Bảo mật dữ liệu</span>
            <span>Điều khoản sử dụng</span>
            <span>Chính sách đổi trả 15 ngày</span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetDatabase}
        title="Khôi phục dữ liệu gốc"
        description="Bạn có chắc chắn muốn đặt lại toàn bộ kho dữ liệu 130+ sản phẩm và giỏ hàng về mặc định không?"
        confirmText="Đặt lại dữ liệu"
        variant="danger"
      />
    </footer>
  );
};
