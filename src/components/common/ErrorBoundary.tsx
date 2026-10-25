import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[360px] flex items-center justify-center p-6 bg-[#FAFAF8] text-[#18181B]">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#E4E4E7] p-8 shadow-card text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#18181B]">
                {this.props.fallbackTitle || 'Đã có lỗi nhỏ khi hiển thị nội dung'}
              </h3>
              <p className="text-xs text-[#71717A] leading-relaxed">
                {this.props.fallbackMessage ||
                  'Hệ thống đang tự động khôi phục dữ liệu sản phẩm. Bạn có thể nhấn thử lại hoặc tải lại trang.'}
              </p>
            </div>

            {/* Development error details (chỉ hiện khi có lỗi kỹ thuật) */}
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="text-left bg-[#F4F4F5] p-3 rounded-xl border border-[#E4E4E7] text-[11px] font-mono text-[#E11D48] overflow-x-auto max-h-32">
                <p className="font-bold">{this.state.error.name}: {this.state.error.message}</p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử lại</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F4F4F5] text-[#18181B] border border-[#E4E4E7] text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <span>Tải lại trang</span>
              </button>

              <a
                href="/"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F4F4F5] text-[#71717A] hover:text-[#18181B] border border-[#E4E4E7] text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Trang chủ</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
