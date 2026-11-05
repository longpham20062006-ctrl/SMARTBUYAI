import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { formatPrice, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import { ArrowLeft, XCircle } from 'lucide-react';

export const OrderDetailPage: React.FC = () => {
  useRepoSubscription(['orders', 'products']);
  const { id } = useParams<{ id: string }>();
  const order = id ? MockRepo.getOrderById(id) : undefined;
  const { success, error } = useToast();
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  if (!order) {
    return (
      <div className="max-w-container mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-brand-primary">
          Không tìm thấy đơn hàng
        </h2>
        <Link to="/orders">
          <Button variant="primary" size="sm">
            Quay lại danh sách đơn
          </Button>
        </Link>
      </div>
    );
  }

  const handleConfirmCancel = () => {
    const res = MockRepo.updateOrderStatus(order.id, 'CANCELLED', 'Khách hàng yêu cầu hủy đơn');
    setIsCancelConfirmOpen(false);
    if (res.success) {
      success('Đã hủy đơn hàng thành công', 'Tồn kho sản phẩm đã được hoàn lại vào hệ thống.');
    } else {
      error('Không thể hủy đơn', res.message);
    }
  };

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/60 pb-6">
        <div className="space-y-1">
          <Link to="/orders" className="text-xs text-brand-forest hover:underline inline-flex items-center gap-1 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại lịch sử đơn</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-brand-charcoal">
              Đơn hàng {order.orderNumber}
            </h1>
            <Badge
              variant={
                order.orderStatus === 'COMPLETED'
                  ? 'success'
                  : order.orderStatus === 'CANCELLED'
                  ? 'danger'
                  : 'forest'
              }
            >
              {order.orderStatus}
            </Badge>
          </div>
          <p className="text-xs text-brand-muted">
            Đặt ngày: {formatDate(order.createdAt)} • Thanh toán: {order.paymentMethod}
          </p>
        </div>

        {order.orderStatus === 'PENDING' && (
          <Button variant="danger" size="sm" onClick={() => setIsCancelConfirmOpen(true)} className="text-xs">
            <XCircle className="w-3.5 h-3.5 mr-1.5" />
            Hủy đơn hàng này
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cột trái: Tiến độ & Danh sách món đồ (8 cột) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Timeline Tiến độ đơn hàng */}
          <div className="bg-brand-paper rounded-brand-xl p-6 border border-brand-border/60 shadow-subtle space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-charcoal">
              Nhật ký tiến độ đơn hàng
            </h2>
            <div className="space-y-4 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-border">
              {order.statusHistory.map((step, idx) => (
                <div key={idx} className="relative space-y-0.5 text-xs">
                  <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-brand-forest ring-4 ring-brand-paper" />
                  <div className="font-semibold text-brand-charcoal flex items-center justify-between">
                    <span>{step.status}</span>
                    <span className="text-[11px] text-brand-muted font-normal">{formatDate(step.timestamp)}</span>
                  </div>
                  <p className="text-brand-secondary text-[11px]">{step.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Danh sách sản phẩm trong đơn */}
          <div className="bg-brand-paper rounded-brand-xl p-6 border border-brand-border/60 shadow-subtle space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-charcoal">
              Chi tiết sản phẩm ({order.items.length})
            </h2>
            <div className="divide-y divide-brand-border/40">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-4 text-xs">
                  <img
                    src={item.image}
                    alt=""
                    className="w-16 aspect-[3/4] rounded-brand-sm object-cover bg-brand-sand shrink-0 border border-brand-border/30"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase text-brand-forest tracking-wider">
                      {item.brand}
                    </span>
                    <div className="font-semibold text-brand-charcoal text-sm">{item.productName}</div>
                    <div className="text-brand-muted text-[11px] mt-0.5">
                      Màu: {item.colorName} • Size: {item.size} • Số lượng: {item.quantity}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-brand-charcoal text-sm">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    <div className="text-[11px] text-brand-muted">
                      ({formatPrice(item.price)} / món)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cột phải: Thông tin người nhận & Tóm tắt chi phí (4 cột) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Thông tin giao hàng */}
          <div className="bg-brand-paper rounded-brand-xl p-6 border border-brand-border/60 shadow-subtle space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-brand-charcoal border-b border-brand-border/40 pb-2">
              Địa chỉ nhận hàng
            </h3>
            <div className="space-y-1">
              <div className="font-semibold text-brand-charcoal text-sm">
                {order.shippingAddress.fullName}
              </div>
              <div className="text-brand-secondary">{order.shippingAddress.phone}</div>
              <div className="text-brand-secondary">{order.shippingAddress.email}</div>
              <div className="text-brand-charcoal pt-1 leading-relaxed">
                {order.shippingAddress.street}, {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.province}
              </div>
              {order.shippingAddress.note && (
                <div className="text-[11px] text-brand-muted italic pt-1">
                  Ghi chú: {order.shippingAddress.note}
                </div>
              )}
            </div>
          </div>

          {/* Tóm tắt thanh toán */}
          <div className="bg-brand-paper rounded-brand-xl p-6 border border-brand-border/60 shadow-subtle space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-brand-charcoal border-b border-brand-border/40 pb-2">
              Chi phí đơn hàng
            </h3>
            <div className="space-y-2 text-brand-secondary">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span className="font-semibold text-brand-charcoal">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển:</span>
                <span className="font-semibold text-emerald-700">
                  {order.shippingFee === 0 ? 'Miễn phí' : formatPrice(order.shippingFee)}
                </span>
              </div>
              <div className="border-t border-brand-border/40 pt-2 flex justify-between items-baseline text-sm">
                <span className="font-bold text-brand-charcoal">Tổng thanh toán:</span>
                <span className="text-lg font-bold text-brand-forest">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Hủy đơn hàng này?"
        message="Bạn có chắc chắn muốn hủy đơn hàng này? Toàn bộ tồn kho các sản phẩm sẽ được tự động hoàn lại vào hệ thống."
        confirmText="Xác nhận hủy đơn"
        cancelText="Đóng"
        isDestructive={true}
      />
    </div>
  );
};
