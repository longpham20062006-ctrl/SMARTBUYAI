import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import { useToast } from '@/components/ui/toast';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  useRepoSubscription(['cart']);
  const cart = MockRepo.getCart();
  const navigate = useNavigate();
  const { error, success } = useToast();

  const freeShippingThreshold = 299000;
  const progressPercent = Math.min(100, Math.round((cart.subtotal / freeShippingThreshold) * 100));
  const diffToFreeShip = freeShippingThreshold - cart.subtotal;

  const handleUpdateQty = (variantId: string, currentQty: number, change: number) => {
    const nextQty = currentQty + change;
    const res = MockRepo.updateCartQuantity(variantId, nextQty);
    if (!res.success && res.message) {
      error('Thông báo giỏ hàng', res.message);
    }
  };

  const handleRemove = (variantId: string) => {
    MockRepo.removeFromCart(variantId);
    success('Đã xóa sản phẩm khỏi giỏ hàng');
  };

  if (cart.items.length === 0) {
    return (
      <div className="bg-brand-bg min-h-[70vh] flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-brand-accent-light mx-auto flex items-center justify-center text-brand-accent">
            <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
          </div>
          <h1 className="text-2xl font-bold text-brand-primary uppercase">
            GIỎ HÀNG ĐANG TRỐNG
          </h1>
          <p className="text-xs text-brand-secondary leading-relaxed">
            Bạn chưa chọn outfit nào. Khám phá ngay hơn 130+ mẫu áo thun, baggy jeans, cargo và phụ kiện cực chất tại SMARTBUY AI!
          </p>
          <div className="pt-2">
            <Link to="/products">
              <Button variant="accent" size="md" className="font-bold uppercase">
                <Zap className="w-4 h-4 mr-1.5 fill-current" />
                KHÁM PHÁ CATALOG NGAY
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-bg min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-brand-secondary mb-2">
            <Link to="/" className="hover:text-brand-primary">Trang chủ</Link>
            <span>/</span>
            <span className="text-brand-primary font-bold">Giỏ hàng ({cart.items.reduce((s, i) => s + i.quantity, 0)} món)</span>
          </div>
          <h1 className="text-3xl font-black text-brand-primary uppercase tracking-tight">
            GIỎ HÀNG CỦA BẠN
          </h1>
        </div>

        {/* Free ship banner */}
        <div className="bg-brand-surface rounded-2xl p-4 border border-brand-border shadow-xs">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-semibold text-brand-primary">
              {cart.subtotal >= freeShippingThreshold ? (
                <span className="text-brand-primary flex items-center gap-1.5 font-bold">
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">FREESHIP</span>
                  Chúc mừng! Đơn hàng của bạn đã được MIỄN PHÍ VẬN CHUYỂN TOÀN QUỐC.
                </span>
              ) : (
                <span>
                  Thêm <strong className="text-brand-accent underline">{formatPrice(diffToFreeShip)}</strong> nữa để nhận ưu đãi Freeship toàn quốc!
                </span>
              )}
            </span>
            <span className="font-bold text-brand-primary">{progressPercent}%</span>
          </div>
          <div className="w-full bg-brand-subtle rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-brand-accent h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Main Grid: Bảng món đồ 8 cột / Tóm tắt đơn hàng 4 cột */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Danh sách items (8 cột) */}
          <div className="lg:col-span-8 bg-brand-surface rounded-2xl border border-brand-border shadow-xs divide-y divide-brand-border overflow-hidden">
            {/* Table Header desktop */}
            <div className="hidden sm:grid grid-cols-12 p-4 bg-brand-subtle text-[11px] font-bold uppercase tracking-wider text-brand-secondary">
              <div className="col-span-6">Sản phẩm Outfit</div>
              <div className="col-span-2 text-center">Đơn giá</div>
              <div className="col-span-2 text-center">Số lượng</div>
              <div className="col-span-2 text-right">Tổng</div>
            </div>

            {cart.items.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:grid sm:grid-cols-12 sm:items-center gap-4">
                {/* Product Info (6 cột) */}
                <div className="sm:col-span-6 flex gap-3.5 items-center">
                  <Link
                    to={`/products/${item.productSlug}`}
                    className="w-20 aspect-[3/4] rounded-xl overflow-hidden bg-brand-subtle shrink-0 border border-brand-border"
                  >
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  </Link>
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-brand-secondary">
                      {item.brand}
                    </span>
                    <Link
                      to={`/products/${item.productSlug}`}
                      className="block text-xs sm:text-sm font-bold text-brand-primary hover:text-brand-accent line-clamp-2 transition-colors"
                    >
                      {item.productName}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-brand-secondary">
                      <span>Màu: <strong className="text-brand-primary">{item.color.name}</strong></span>
                      <span>•</span>
                      <span>Size: <strong className="text-brand-primary">{item.size}</strong></span>
                    </div>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-xs text-brand-secondary hover:text-rose-600 inline-flex items-center gap-1 pt-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>

                {/* Đơn giá (2 cột) */}
                <div className="sm:col-span-2 sm:text-center text-xs font-bold text-brand-primary">
                  <span className="sm:hidden text-brand-secondary mr-2">Đơn giá:</span>
                  {formatPrice(item.price)}
                </div>

                {/* Tăng giảm (2 cột) */}
                <div className="sm:col-span-2 flex sm:justify-center items-center">
                  <div className="flex items-center border border-brand-border rounded-lg overflow-hidden bg-brand-surface shadow-2xs">
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity, -1)}
                      className="w-8 h-8 flex items-center justify-center text-brand-primary hover:bg-brand-subtle transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-brand-primary">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity, 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="w-8 h-8 flex items-center justify-center text-brand-primary hover:bg-brand-subtle disabled:opacity-30 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Tổng cộng theo item (2 cột) */}
                <div className="sm:col-span-2 sm:text-right text-sm font-black text-brand-primary">
                  <span className="sm:hidden text-brand-secondary mr-2 text-xs font-normal">Thành tiền:</span>
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Tóm tắt đơn hàng (4 cột) */}
          <div className="lg:col-span-4 bg-brand-surface rounded-2xl p-6 border border-brand-border shadow-xs space-y-5">
            <h2 className="text-base font-bold text-brand-primary uppercase border-b border-brand-border pb-3">
              TÓM TẮT ĐƠN HÀNG
            </h2>

            <div className="space-y-3 text-xs text-brand-secondary">
              <div className="flex justify-between">
                <span>Tạm tính ({cart.items.reduce((s, i) => s + i.quantity, 0)} món):</span>
                <span className="font-bold text-brand-primary">{formatPrice(cart.subtotal)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Phí vận chuyển:</span>
                <span>
                  {cart.subtotal >= freeShippingThreshold || cart.shippingFee === 0 ? (
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                      MIỄN PHÍ
                    </span>
                  ) : (
                    <span className="font-bold text-brand-primary">{formatPrice(cart.shippingFee)}</span>
                  )}
                </span>
              </div>

              <div className="border-t border-brand-border pt-3 flex justify-between items-baseline text-sm">
                <span className="font-bold text-brand-primary uppercase">TỔNG CỘNG:</span>
                <span className="text-2xl font-black text-brand-primary">
                  {formatPrice(cart.subtotal >= freeShippingThreshold ? cart.subtotal : cart.total)}
                </span>
              </div>
              <div className="text-[11px] text-brand-secondary text-right">
                (Đã gồm thuế GTGT & đóng gói tiêu chuẩn)
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Button
                variant="accent"
                className="w-full h-12 text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm"
                onClick={() => navigate('/checkout')}
              >
                TIẾN HÀNH THANH TOÁN
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Link to="/products" className="block text-center text-xs font-semibold text-brand-secondary hover:text-brand-primary hover:underline pt-1 transition-colors">
                Tiếp tục mua sắm thêm →
              </Link>
            </div>

            <div className="p-3.5 rounded-xl bg-brand-subtle text-[11px] text-brand-primary space-y-1.5 border border-brand-border">
              <div className="font-bold text-brand-primary flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-accent" />
                <span>CHÍNH SÁCH BẢO VỆ GEN Z</span>
              </div>
              <p className="text-brand-secondary leading-relaxed">Kiểm tra hàng trước khi nhận. Đổi size trong vòng 15 ngày tận nhà.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
