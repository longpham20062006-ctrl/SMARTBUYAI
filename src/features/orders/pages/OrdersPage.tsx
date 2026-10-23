import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { OrderStatus } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import { ClipboardList, ArrowRight } from 'lucide-react';

export const OrdersPage: React.FC = () => {
  useRepoSubscription(['orders']);
  const currentUser = MockRepo.getCurrentUser();
  const allOrders = MockRepo.getOrders();

  // Chỉ lấy đơn hàng thuộc về currentUser hiện tại
  const myOrders = allOrders.filter((o) => o.userId === currentUser.id);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredOrders = myOrders.filter((order) => {
    if (statusFilter === 'ALL') return true;
    return order.orderStatus === statusFilter;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="pending">Chờ xác nhận</Badge>;
      case 'CONFIRMED':
        return <Badge variant="forest">Đã xác nhận</Badge>;
      case 'PROCESSING':
        return <Badge variant="terracotta">Đang chuẩn bị hàng</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Hoàn thành</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Đã hủy</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs text-brand-muted mb-2">
          <Link to="/" className="hover:text-brand-charcoal">Trang chủ</Link>
          <span>/</span>
          <span className="text-brand-charcoal font-medium">Lịch sử đơn hàng</span>
        </div>
        <h1 className="font-editorial text-3xl font-semibold text-brand-charcoal">
          Đơn hàng của bạn
        </h1>
        <p className="text-xs sm:text-sm text-brand-secondary mt-1">
          Theo dõi tiến độ giao hàng và chi tiết sản phẩm thời trang bạn đã đặt.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-brand-border/60 text-xs">
        {[
          { id: 'ALL', label: `Tất cả (${myOrders.length})` },
          { id: 'PENDING', label: 'Chờ duyệt' },
          { id: 'CONFIRMED', label: 'Đã xác nhận' },
          { id: 'COMPLETED', label: 'Đã giao' },
          { id: 'CANCELLED', label: 'Đã hủy' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-brand font-medium whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-brand-forest text-brand-ivory font-semibold'
                : 'text-brand-secondary hover:text-brand-charcoal hover:bg-brand-sand/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-brand-paper rounded-brand-xl p-12 text-center border border-brand-border/60 space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-sand mx-auto flex items-center justify-center text-brand-muted">
            <ClipboardList className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="font-editorial text-xl font-semibold text-brand-charcoal">
            Chưa có đơn hàng nào
          </h3>
          <p className="text-xs text-brand-secondary max-w-sm mx-auto">
            Không tìm thấy đơn hàng nào ở trạng thái này. Khám phá ngay các bộ sưu tập mới nhất.
          </p>
          <Link to="/products">
            <Button variant="primary" size="sm">
              Khám phá sản phẩm
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-brand-paper rounded-brand-xl border border-brand-border/60 p-5 sm:p-6 shadow-subtle space-y-4 hover:border-brand-border transition-colors"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/40 pb-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-brand-forest text-sm">{order.orderNumber}</span>
                  <span className="text-brand-muted">•</span>
                  <span className="text-brand-secondary">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(order.orderStatus)}
                  <span className="font-bold text-brand-charcoal text-sm">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Items Summary */}
              <div className="divide-y divide-brand-border/30">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3.5 text-xs">
                    <img
                      src={item.image}
                      alt=""
                      className="w-12 aspect-[3/4] rounded-brand-sm object-cover bg-brand-sand shrink-0 border border-brand-border/30"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-brand-charcoal line-clamp-1">
                        {item.productName}
                      </div>
                      <div className="text-[11px] text-brand-muted">
                        Màu: {item.colorName} • Size: {item.size} • Số lượng: {item.quantity}
                      </div>
                    </div>
                    <div className="font-semibold text-brand-charcoal shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer Actions */}
              <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-brand-border/40 text-xs text-brand-secondary">
                <div className="text-[11px]">
                  Giao đến: <strong>{order.shippingAddress.fullName}</strong> — {order.shippingAddress.street}, {order.shippingAddress.district}
                </div>
                <Link to={`/orders/${order.id}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    Chi tiết & Tiến độ đơn
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
