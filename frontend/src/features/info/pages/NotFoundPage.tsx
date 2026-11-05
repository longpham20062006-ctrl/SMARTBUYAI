import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4 bg-brand-paper p-8 rounded-brand-xl border border-brand-border/60 shadow-card">
        <div className="w-16 h-16 rounded-full bg-brand-sand text-brand-forest mx-auto flex items-center justify-center">
          <Search className="w-8 h-8 stroke-[1.5]" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-brand-forest">
          Mã lỗi 404 — Không tìm thấy trang
        </span>
        <h1 className="font-editorial text-2xl font-bold text-brand-charcoal">
          Trang bạn tìm kiếm không tồn tại
        </h1>
        <p className="text-xs text-brand-secondary leading-relaxed">
          Đường dẫn có thể đã thay đổi hoặc bạn vừa nhập sai địa chỉ. Hãy tiếp tục khám phá các thiết kế thời trang tuyển chọn tại SMARTBUY AI.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link to="/">
            <Button variant="primary" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Về Trang chủ
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="outline" size="sm">
              Xem sản phẩm
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
