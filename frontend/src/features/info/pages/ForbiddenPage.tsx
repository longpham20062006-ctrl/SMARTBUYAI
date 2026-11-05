import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const ForbiddenPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4 bg-brand-paper p-8 rounded-brand-xl border border-brand-border/60 shadow-card">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-rose-600">
          Mã lỗi 403 — Từ chối truy cập
        </span>
        <h1 className="font-editorial text-2xl font-bold text-brand-charcoal">
          Bạn không có quyền truy cập
        </h1>
        <p className="text-xs text-brand-secondary leading-relaxed">
          Khu vực này yêu cầu quyền Quản trị viên (Admin). Bạn có thể đổi sang tài khoản Admin ở menu tài khoản để thử nghiệm.
        </p>
        <div className="pt-2">
          <Link to="/">
            <Button variant="primary" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Quay về Trang chủ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
