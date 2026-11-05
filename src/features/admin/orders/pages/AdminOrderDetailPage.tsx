import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { OrderStatus } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import { ArrowLeft, CheckCircle, Truck, PackageCheck, XCircle } from 'lucide-react';

export const AdminOrderDetailPage: React.FC = () => {
  useRepoSubscription(['orders', 'products']);
  const { id } = useParams<{ id: string }>();
  const order = id ? MockRepo.getOrderById(id) : undefined;
  const { success, error } = useToast();

  const [note, setNote] = useState('');
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  if (!order) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="font-editorial text-2xl font-bold text-brand-charcoal">
          Không tìm thấy đơn hàng này
        </h2>
        <Link to="/admin/orders">
          <Button variant="primary" size="sm">Quay lại danh sách đơn</Button>
        </Link>
      </div>
    );
  }

  const handleUpdateStatus = (nextStatus: OrderStatus, label: string) => {
    const res = MockRepo.updateOrderStatus(order.id, nextStatus, note || `Quản trị viên chuyển trạng thái sang ${label}`);
    if (res.success) {
      success('Đã cập nhật trạng thái đơn', `Trạng thái mới: ${label}`);
      setNote('');
    } else {
      error('Lỗi cập nhật', res.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/60 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="p-1.5 rounded-brand hover:bg-brand-sand text-brand-secondary hover:text-brand-charcoal"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-editorial text-2xl font-semibold text-brand-charcoal">
                Chi tiết Đơn hàng {order.orderNumber}
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
            <p className="text-xs text-brand-secondary mt-0.5">
              Thời gian khởi tạo: {formatDate(order.createdAt)} • Phương thức: {order.paymentMethod}
            </p>
          </div>
        </div>
      </div>

      {/* Action Bar chuyển trạng thái */}
      {order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'COMPLETED' && (
        <div className="bg-brand-paper rounded-brand-xl p-5 border border-brand-border/60 shadow-subtle space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
            Thao tác chuyển trạng thái đơn hàng
          </h3>
          <div className="flex flex-wrap gap-2">
            {order.orderStatus === 'PENDING' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleUpdateStatus('CONFIRMED', 'ĐÃ XÁC NHẬN')}
                className="text-xs"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                Duyệt xác nhận đơn hàng
              </Button>
            )}

            {(order.orderStatus === 'PENDING' || order.orderStatus === 'CONFIRMED') && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleUpdateStatus('PROCESSING', 'ĐANG ĐÓNG GÓI')}
                className="text-xs"
              >
                <Truck className="w-3.5 h-3.5 mr-1.5" />
                Chuyển sang đóng gói & xuất kho
              </Button>
            )}

            {order.orderStatus === 'PROCESSING' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus('COMPLETED', 'HOÀN THÀNH GIAO')}
                className="text-xs text-emerald-700 border-emerald-300"
              >
                <PackageCheck className="w-3.5 h-3.5 mr-1.5" />
                Đánh dấu đã giao thành công
              </Button>
            )}

            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsCancelConfirmOpen(true)}
              className="text-xs ml-auto"
            >
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
              Hủy đơn & hoàn tồn kho
            </Button>
          </div>
        </div>
      )}

      {/* Grid thông tin */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Sản phẩm trong đơn (8 cột) */}
        <div className="md:col-span-8 bg-brand-paper rounded-brand-xl p-6 border border-brand-border/60 shadow-subtle space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-charcoal border-b border-brand-border/40 pb-2">
            Danh sách thiết kế thời trang ({order.items.length})
          </h2>
          <div className="divide-y divide-brand-border/40">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-4 text-xs">
                <img
                  src={item.image}
                  alt=""
                  className="w-14 aspect-[3/4] rounded-brand-sm object-cover bg-brand-sand shrink-0 border border-brand-border/30"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase text-brand-forest tracking-wider">
                    {item.brand}
                  </span>
                  <div className="font-semibold text-brand-charcoal text-sm">{item.productName}</div>
                  <div className="text-brand-muted text-[11px] mt-0.5">
                    Màu: <strong>{item.colorName}</strong> • Size: <strong>{item.size}</strong> • SL: <strong>{item.quantity}</strong>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-brand-charcoal text-sm">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                  <div className="text-[11px] text-brand-muted">({formatPrice(item.price)} / món)</div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-brand-border/40 pt-4 space-y-2 text-xs text-brand-secondary">
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
              <span className="text-xl font-bold text-brand-forest">
                {formatPrice(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Khách hàng & Timeline (4 cột) */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-brand-paper rounded-brand-xl p-5 border border-brand-border/60 shadow-subtle space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-brand-charcoal border-b border-brand-border/40 pb-2">
              Thông tin người nhận
            </h3>
            <div className="space-y-1">
              <div className="font-bold text-brand-charcoal text-sm">{order.shippingAddress.fullName}</div>
              <div>SĐT: <strong className="text-brand-forest">{order.shippingAddress.phone}</strong></div>
              <div>Email: {order.shippingAddress.email}</div>
              <div className="pt-1 text-brand-secondary leading-relaxed">
                {order.shippingAddress.street}, {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.province}
              </div>
            </div>
          </div>

          <div className="bg-brand-paper rounded-brand-xl p-5 border border-brand-border/60 shadow-subtle space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-brand-charcoal border-b border-brand-border/40 pb-2">
              Lịch sử trạng thái
            </h3>
            <div className="space-y-3">
              {order.statusHistory.map((s, idx) => (
                <div key={idx} className="space-y-0.5 border-l-2 border-brand-forest pl-3">
                  <div className="font-semibold text-brand-charcoal">{s.status}</div>
                  <div className="text-[11px] text-brand-muted">{formatDate(s.timestamp)}</div>
                  <div className="text-[11px] text-brand-secondary">{s.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={() => {
          handleUpdateStatus('CANCELLED', 'ĐÃ HỦY ĐƠN (HOÀN TỒN)');
          setIsCancelConfirmOpen(false);
        }}
        title="Hủy đơn hàng và hoàn tồn kho?"
        message="Hệ thống sẽ chuyển trạng thái đơn hàng sang ĐÃ HỦY và tự động hoàn lại số lượng tồn kho cho các sản phẩm trong đơn này."
        confirmText="Xác nhận hủy & hoàn tồn"
        cancelText="Đóng"
        isDestructive={true}
      />
    </div>
  );
};
