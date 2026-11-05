import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowUpRight } from 'lucide-react';

export const SiteFooter: React.FC = () => {
  return (
    <footer className="bg-[#18181B] text-[#F7F7F6] border-t border-[#27272A] pt-12 pb-10 mt-12 sm:mt-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-10 border-b border-[#27272A]">
          {/* Brand Info (5 cols) */}
          <div className="md:col-span-5 space-y-3.5 text-left">
            <div className="flex items-center gap-2">
              <span className="font-sans text-2xl font-black tracking-tight text-white">
                SMARTBUY
              </span>
              <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-white text-[#18181B]">
                AI
              </span>
            </div>
            <p className="text-xs text-[#A8A29E] max-w-sm leading-relaxed">
              Nền tảng thương mại điện tử thời trang Korean Minimal & Streetwear kết hợp trợ lý phong cách AI Stylist và thử đồ ảo AI Virtual Try-On.
            </p>
            <div className="pt-1">
              <Link
                to="/ai-stylist"
                className="inline-flex items-center gap-1.5 text-xs text-[#DDD6FE] hover:text-white transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Trải nghiệm AI Stylist miễn phí</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Links (7 cols - 3 columns) */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-left">
            {/* Cột 1: Danh mục thời trang (Chỉ Nam, Nữ, Phụ kiện, Tất cả - Không có Unisex) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3.5">
                Danh mục thời trang
              </h4>
              <ul className="space-y-2 text-xs text-[#A8A29E]">
                <li>
                  <Link to="/products?gender=nam" className="hover:text-white transition-colors">
                    Thời trang Nam
                  </Link>
                </li>
                <li>
                  <Link to="/products?gender=nu" className="hover:text-white transition-colors">
                    Thời trang Nữ
                  </Link>
                </li>
                <li>
                  <Link to="/products?category=phu-kien" className="hover:text-white transition-colors">
                    Phụ kiện & Chi tiết
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="hover:text-white transition-colors">
                    Tất cả sản phẩm
                  </Link>
                </li>
              </ul>
            </div>

            {/* Cột 2: Hỗ trợ khách hàng */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3.5">
                Hỗ trợ khách hàng
              </h4>
              <ul className="space-y-2 text-xs text-[#A8A29E]">
                <li>
                  <Link to="/size-guide" className="hover:text-white transition-colors">
                    Bảng số đo kích cỡ
                  </Link>
                </li>
                <li>
                  <Link to="/orders" className="hover:text-white transition-colors">
                    Tra cứu đơn hàng
                  </Link>
                </li>
                <li>
                  <Link to="/try-on" className="hover:text-white transition-colors">
                    Phòng thử đồ ảo AI
                  </Link>
                </li>
                <li>
                  <Link to="/compare" className="hover:text-white transition-colors">
                    So sánh thiết kế
                  </Link>
                </li>
              </ul>
            </div>

            {/* Cột 3: Chính sách */}
            <div className="col-span-2 sm:col-span-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3.5">
                Chính sách
              </h4>
              <ul className="space-y-2 text-xs text-[#A8A29E]">
                <li>
                  <span>Freeship đơn từ 299.000₫</span>
                </li>
                <li>
                  <span>Đổi size trong vòng 15 ngày</span>
                </li>
                <li>
                  <span>Kiểm tra hàng trước khi nhận</span>
                </li>
                <li>
                  <span>Bảo mật thông tin khách hàng</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#78716C] gap-3">
          <div>
            © 2026 SMARTBUY AI — Nền tảng thời trang thương mại điện tử thế hệ mới.
          </div>
          <div className="flex items-center gap-6">
            <span>Mặc theo cách của bạn</span>
            <span>•</span>
            <span>Your Fit. Your Rules.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
