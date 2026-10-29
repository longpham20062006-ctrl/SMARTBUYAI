import React from 'react';
import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#07070A] text-white flex flex-col justify-between selection:bg-[#8B5CF6]/30 selection:text-white relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(139,92,246,0.18),rgba(7,7,10,0))]" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[400px] pointer-events-none bg-[radial-gradient(circle_at_bottom_right,rgba(24,244,252,0.08),transparent)] blur-3xl" />

      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 lg:p-8 relative z-10 w-full max-w-7xl mx-auto my-auto">
        <ErrorBoundary fallbackTitle="Lỗi tải trang xác thực" fallbackMessage="Không thể hiển thị trang đăng nhập. Vui lòng thử tải lại trang.">
          <Outlet />
        </ErrorBoundary>
      </main>

      <footer className="py-4 text-center text-[11px] font-mono tracking-wider text-zinc-500 uppercase relative z-10">
        © 2026 SMARTBUY AI • HỆ THỐNG THỜI TRANG CÔNG NGHỆ CAO CẤP
      </footer>
    </div>
  );
};

