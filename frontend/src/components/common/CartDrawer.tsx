import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Drawer } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { MockRepo } from '@/mocks/repository';
import { formatPrice } from '@/lib/utils';
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import { useToast } from '@/components/ui/toast';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  useRepoSubscription(['cart']);
  const cart = MockRepo.getCart();
  const navigate = useNavigate();
  const { error } = useToast();

  const handleUpdateQty = (variantId: string, currentQty: number, change: number) => {
    const nextQty = currentQty + change;
    const res = MockRepo.updateCartQuantity(variantId, nextQty);
    if (!res.success && res.message) {
      error('Thông báo giỏ hàng', res.message);
    }
  };

  const handleRemove = (variantId: string) => {
    MockRepo.removeFromCart(variantId);
  };

  const freeShippingThreshold = 500000;
  const progressPercent = Math.min(100, Math.round((cart.subtotal / freeShippingThreshold) * 100));
  const diffToFreeShip = freeShippingThreshold - cart.subtotal;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-brand-forest" />
          <span>Giỏ hàng của bạn ({cart.items.reduce((s, i) => s + i.quantity, 0)})</span>
        </div>
      }
      footer={
        cart.items.length > 0 ? (
          <div className="space-y-3">
            {/* Thanh tiến độ Free Shipping */}
            <div className="bg-brand-sand/60 rounded-brand p-3 text-xs">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-medium text-brand-charcoal">
                  {cart.subtotal >= freeShippingThreshold ? (
                    <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                      <ShieldCheck className="w-4 h-4 inline" /> Bạn được MIỄN PHÍ vận chuyển!
                    </span>
                  ) : (
                    <span>
                      Mua thêm <strong className="text-brand-forest">{formatPrice(diffToFreeShip)}</strong> để được Miễn phí giao hàng
                    </span>
                  )}
                </span>
                <span className="font-bold text-brand-forest">{progressPercent}%</span>
              </div>
              <div className="w-full bg-brand-border/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brand-forest h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Tổng tiền */}
            <div className="flex justify-between items-baseline pt-2">
              <span className="text-sm text-brand-secondary">Tạm tính:</span>
              <span className="text-lg font-bold text-brand-charcoal">{formatPrice(cart.subtotal)}</span>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                className="w-full text-xs h-11"
                onClick={() => {
                  onClose();
                  navigate('/cart');
                }}
              >
                Xem giỏ hàng
              </Button>
              <Button
                variant="primary"
                className="w-full text-xs h-11"
                onClick={() => {
                  onClose();
                  navigate('/checkout');
                }}
              >
                Thanh toán ngay
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        ) : null
      }
    >
      {cart.items.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-sand flex items-center justify-center text-brand-muted">
            <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-brand-charcoal">Giỏ hàng của bạn đang trống</h4>
            <p className="text-xs text-brand-secondary mt-1 max-w-xs">
              Hãy khám phá các thiết kế thời trang tuyển chọn mới nhất từ SMARTBUY AI.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onClose();
              navigate('/products');
            }}
          >
            Bắt đầu mua sắm
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-brand-border/40 space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="pt-4 first:pt-0 flex gap-3.5 items-start">
              {/* Ảnh biến thể */}
              <Link
                to={`/products/${item.productSlug}`}
                onClick={onClose}
                className="w-20 aspect-[3/4] rounded-brand overflow-hidden bg-brand-sand shrink-0 border border-brand-border/40"
              >
                <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
              </Link>

              {/* Thông tin */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <Link
                    to={`/products/${item.productSlug}`}
                    onClick={onClose}
                    className="text-xs font-semibold text-brand-charcoal hover:text-brand-forest line-clamp-2 leading-snug"
                  >
                    {item.productName}
                  </Link>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-brand-muted hover:text-rose-600 p-1 shrink-0"
                    title="Xóa sản phẩm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Màu và Size */}
                <div className="flex items-center gap-2 text-[11px] text-brand-secondary mt-1">
                  <span>Màu: <strong>{item.color.name}</strong></span>
                  <span>•</span>
                  <span>Size: <strong>{item.size}</strong></span>
                </div>

                {/* Giá và Bộ tăng giảm số lượng */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-brand-border rounded-brand overflow-hidden bg-brand-paper">
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity, -1)}
                      className="w-7 h-7 flex items-center justify-center text-brand-secondary hover:bg-brand-sand transition-colors cursor-pointer"
                      title="Giảm"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-semibold text-brand-charcoal">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity, 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="w-7 h-7 flex items-center justify-center text-brand-secondary hover:bg-brand-sand transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                      title="Tăng"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="text-xs font-bold text-brand-charcoal">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
};
