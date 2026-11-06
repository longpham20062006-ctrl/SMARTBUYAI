import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { OrderStatus } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import { apiClient } from '@/services/apiClient';
import {
  Search,
  Eye,
  CheckCircle,
  Truck,
  PackageCheck,
  RefreshCw,
  Loader2,
} from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  useRepoSubscription(['orders', 'products']);
  const orders = MockRepo.getOrders();
  const { success, error } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncOrders = async () => {
    setIsSyncing(true);
    try {
      const backendOrders = await apiClient.getAdminOrders();
      if (Array.isArray(backendOrders) && backendOrders.length > 0) {
        const existing = MockRepo.getOrders();
        const existingNumbers = new Set(existing.map((o) => o.orderNumber));
        let addedCount = 0;
        backendOrders.forEach((bo: any) => {
          if (!existingNumbers.has(bo.orderNumber)) {
            existing.unshift({
              id: bo.id || `order-${Date.now()}`,
              orderNumber: bo.orderNumber || `SB-${Date.now()}`,
              userId: bo.userId || 'user-customer-1',
              customerName: bo.customerName || 'Khách hàng',
              customerEmail: bo.customerEmail || 'khachhang@smartbuy.vn',
              shippingAddress: {
                fullName: bo.customerName || 'Khách hàng',
                phone: bo.customerPhone || '0901234567',
                email: bo.customerEmail || 'khachhang@smartbuy.vn',
                province: 'TP. Hồ Chí Minh',
                district: 'Quận 1',
                ward: 'Bến Nghé',
                street: bo.shippingAddress || 'Địa chỉ giao hàng',
              },
              items: Array.isArray(bo.items) ? bo.items.map((it: any) => ({
                variantId: it.variantId || 'var-1',
                productId: it.productId || 'prod-1',
                productName: it.productName || 'Sản phẩm SMARTBUY',
                brand: it.brand || 'SMARTBUY AI',
                image: it.image || '/images/anh_trangchu/0fb1b05f-e815-4159-8fe5-abe2c079b9e1.png',
                color: { name: it.colorName || 'Đen', hex: '#111', slug: 'den' },
                size: it.size || 'M',
                price: it.price || 299000,
                quantity: it.quantity || 1,
              })) : [],
              subtotal: bo.subtotal || bo.totalAmount || 0,
              shippingFee: bo.shippingFee || 0,
              totalAmount: bo.totalAmount || 0,
              paymentMethod: bo.paymentMethod || 'COD',
              paymentStatus: bo.paymentStatus || 'PENDING',
              orderStatus: (bo.status || bo.orderStatus || 'PENDING') as OrderStatus,
              statusHistory: [
                {
                  status: (bo.status || bo.orderStatus || 'PENDING') as OrderStatus,
                  timestamp: bo.createdAt || new Date().toISOString(),
                  note: 'Đơn hàng đồng bộ từ Backend Database',
                },
              ],
              createdAt: bo.createdAt || new Date().toISOString(),
              updatedAt: bo.updatedAt || bo.createdAt || new Date().toISOString(),
            });
            existingNumbers.add(bo.orderNumber);
            addedCount++;
          }
        });
        if (addedCount > 0) {
          localStorage.setItem('sb_orders', JSON.stringify(existing));
          window.dispatchEvent(new CustomEvent('smartbuy_repository_change', { detail: { topic: 'orders' } }));
          success('Đồng bộ thành công', `Đã cập nhật ${addedCount} đơn hàng mới từ database.`);
        } else {
          success('Dữ liệu mới nhất', 'Toàn bộ đơn hàng đã đồng bộ với hệ thống.');
        }
      } else {
        success('Dữ liệu mới nhất', 'Danh sách đơn hàng đã đồng bộ với hệ thống.');
      }
    } catch (e: any) {
      error('Lỗi đồng bộ đơn hàng', e?.message || 'Không thể kết nối API quản trị');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Tự động kiểm tra đơn hàng mới từ backend khi admin mở trang
    void handleSyncOrders();
  }, []);

  useEffect(() => {
    const s = searchParams.get('status');
    if (s) {
      setStatusFilter(s);
    }
  }, [searchParams]);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.shippingAddress.phone.includes(search);
    const matchStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleQuickStatus = (orderId: string, nextStatus: OrderStatus, label: string) => {
    const res = MockRepo.updateOrderStatus(orderId, nextStatus, `Quản trị viên chuyển trạng thái sang ${label}`);
    if (res.success) {
      success('Cập nhật trạng thái thành công', `Đơn hàng đã chuyển sang: ${label}`);
    } else {
      error('Lỗi chuyển trạng thái', res.message);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="pending">Chờ xác nhận</Badge>;
      case 'CONFIRMED':
        return <Badge variant="forest">Đã xác nhận</Badge>;
      case 'PROCESSING':
        return <Badge variant="terracotta">Đang đóng gói</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Hoàn thành</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Đã hủy</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-brand-charcoal">
            Quản lý Đơn Hàng & Vận Đơn
          </h1>
          <p className="text-xs sm:text-sm text-brand-secondary mt-1">
            Tổng cộng <strong>{orders.length}</strong> đơn hàng trong toàn bộ hệ thống.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSyncOrders}
          disabled={isSyncing}
          className="rounded-xl text-xs font-bold flex items-center gap-2 border-brand-border text-brand-charcoal hover:bg-brand-sand cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#8B5CF6] ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Đang đồng bộ...' : 'Làm mới đơn hàng'}</span>
        </Button>
      </div>

      {/* Toolbar lọc */}
      <div className="bg-brand-paper rounded-brand-xl p-4 border border-brand-border/60 shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã đơn SB-2026, tên khách, SĐT..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-brand border border-brand-border bg-brand-sand/40 focus:outline-none focus:border-brand-forest text-brand-charcoal"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-brand-secondary">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-brand-paper border border-brand-border rounded-brand px-3 py-2 text-brand-charcoal focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xác nhận (PENDING)</option>
            <option value="CONFIRMED">Đã duyệt (CONFIRMED)</option>
            <option value="PROCESSING">Đang chuẩn bị (PROCESSING)</option>
            <option value="COMPLETED">Đã giao thành công (COMPLETED)</option>
            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
          </select>
        </div>
      </div>

      {/* Table Orders */}
      <div className="bg-brand-paper rounded-brand-xl border border-brand-border/60 shadow-subtle overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs min-w-[850px]">
          <thead>
            <tr className="bg-brand-sand/50 text-brand-charcoal font-semibold border-b border-brand-border">
              <th className="p-3.5">Mã đơn hàng</th>
              <th className="p-3.5">Khách hàng</th>
              <th className="p-3.5">Số lượng món</th>
              <th className="p-3.5">Tổng thanh toán</th>
              <th className="p-3.5">Thời gian đặt</th>
              <th className="p-3.5 text-center">Trạng thái</th>
              <th className="p-3.5 text-right">Thao tác duyệt nhanh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/40">
            {filtered.map((order) => (
              <tr key={order.id} className="hover:bg-brand-sand/20 transition-colors">
                <td className="p-3.5 font-bold text-brand-forest">
                  <Link to={`/admin/orders/${order.id}`} className="hover:underline">
                    {order.orderNumber}
                  </Link>
                </td>

                <td className="p-3.5">
                  <div className="font-semibold text-brand-charcoal">{order.customerName}</div>
                  <div className="text-[11px] text-brand-muted">{order.shippingAddress.phone}</div>
                </td>

                <td className="p-3.5">
                  <span className="font-medium text-brand-secondary">
                    {order.items.reduce((s, i) => s + i.quantity, 0)} sản phẩm
                  </span>
                </td>

                <td className="p-3.5 font-bold text-brand-charcoal">
                  {formatPrice(order.totalAmount)}
                </td>

                <td className="p-3.5 text-brand-muted">{formatDate(order.createdAt)}</td>

                <td className="p-3.5 text-center">{getStatusBadge(order.orderStatus)}</td>

                <td className="p-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {order.orderStatus === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="text-[11px] h-7 px-2"
                        onClick={() => handleQuickStatus(order.id, 'CONFIRMED', 'Đã xác nhận')}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" /> Duyệt
                      </Button>
                    )}

                    {order.orderStatus === 'CONFIRMED' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-[11px] h-7 px-2"
                        onClick={() => handleQuickStatus(order.id, 'PROCESSING', 'Đang xử lý đóng gói')}
                      >
                        <Truck className="w-3 h-3 mr-1" /> Đóng gói
                      </Button>
                    )}

                    {order.orderStatus === 'PROCESSING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] h-7 px-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                        onClick={() => handleQuickStatus(order.id, 'COMPLETED', 'Đã hoàn tất giao')}
                      >
                        <PackageCheck className="w-3 h-3 mr-1" /> Giao xong
                      </Button>
                    )}

                    <Link to={`/admin/orders/${order.id}`}>
                      <button
                        className="p-1.5 rounded-brand hover:bg-brand-sand text-brand-secondary hover:text-brand-forest transition-colors cursor-pointer"
                        title="Xem chi tiết đơn"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
