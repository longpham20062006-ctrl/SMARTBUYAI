import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { StockMovement } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import { formatDate } from '@/lib/utils';
import { History, Edit, Search, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const AdminInventoryPage: React.FC = () => {
  useRepoSubscription(['products', 'inventory']);
  const products = MockRepo.getProducts();
  const stockLogs = MockRepo.getStockLogs();
  const currentUser = MockRepo.getCurrentUser();
  const { success, error } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilter = searchParams.get('filter') || 'all';

  const [activeTab, setActiveTab] = useState<'variants' | 'logs'>('variants');
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState(urlFilter);

  useEffect(() => {
    const f = searchParams.get('filter');
    if (f) setStockFilter(f);
  }, [searchParams]);

  // Modal Điều chỉnh tồn
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<{
    id: string;
    productName: string;
    color: string;
    size: string;
    currentStock: number;
    sku: string;
  } | null>(null);

  const [newStock, setNewStock] = useState<number>(0);
  const [reason, setReason] = useState<StockMovement['reason']>('Nhập hàng mới');

  // Flatten all variants
  const allVariantsList: {
    variantId: string;
    productId: string;
    productName: string;
    sku: string;
    colorName: string;
    colorHex: string;
    size: string;
    stock: number;
    price: number;
    image: string;
  }[] = [];

  products.forEach((p) => {
    p.variants.forEach((v) => {
      allVariantsList.push({
        variantId: v.id,
        productId: p.id,
        productName: p.name,
        sku: v.sku,
        colorName: v.color.name,
        colorHex: v.color.hex,
        size: v.size,
        stock: v.stock,
        price: v.price,
        image: v.image || p.images[0],
      });
    });
  });

  const filteredVariants = allVariantsList.filter((item) => {
    const matchSearch =
      item.productName.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.colorName.toLowerCase().includes(search.toLowerCase());

    let matchStock = true;
    if (stockFilter === 'low-stock') {
      matchStock = item.stock > 0 && item.stock < 12;
    } else if (stockFilter === 'out-of-stock') {
      matchStock = item.stock === 0;
    }

    return matchSearch && matchStock;
  });

  const handleOpenAdjust = (v: typeof allVariantsList[0]) => {
    setSelectedVariant({
      id: v.variantId,
      productName: v.productName,
      color: v.colorName,
      size: v.size,
      currentStock: v.stock,
      sku: v.sku,
    });
    setNewStock(v.stock);
    setReason('Nhập hàng mới');
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;

    const res = MockRepo.adjustStock(
      selectedVariant.id,
      newStock,
      reason,
      currentUser?.name || 'Admin Master'
    );

    if (res.success) {
      success(
        'Đã cập nhật tồn kho',
        `${selectedVariant.productName} (${selectedVariant.color} - Size ${selectedVariant.size}) -> Tồn mới: ${newStock}`
      );
      setIsAdjustModalOpen(false);
    } else {
      error('Lỗi điều chỉnh tồn', res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-brand-charcoal">
            Quản lý Kho Hàng & Tồn Biến Thể
          </h1>
          <p className="text-xs sm:text-sm text-brand-secondary mt-1">
            Theo dõi chính xác số lượng tồn theo từng biến thể (màu sắc x kích cỡ) và nhật ký xuất nhập kho.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 rounded-brand bg-brand-sand text-xs">
          <button
            onClick={() => setActiveTab('variants')}
            className={`px-3 py-1.5 rounded-brand font-semibold transition-colors cursor-pointer ${
              activeTab === 'variants'
                ? 'bg-brand-paper text-brand-forest shadow-xs'
                : 'text-brand-secondary hover:text-brand-charcoal'
            }`}
          >
            Tồn kho biến thể ({allVariantsList.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-brand font-semibold transition-colors cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-brand-paper text-brand-forest shadow-xs'
                : 'text-brand-secondary hover:text-brand-charcoal'
            }`}
          >
            Lịch sử biến động ({stockLogs.length})
          </button>
        </div>
      </div>

      {activeTab === 'variants' ? (
        /* Tab 1: Danh sách biến thể */
        <div className="space-y-4">
          <div className="bg-brand-paper rounded-brand-xl p-4 border border-brand-border/60 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm SKU, tên mẫu, màu..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-brand border border-brand-border bg-brand-sand/40 focus:outline-none focus:border-brand-forest text-brand-charcoal"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-brand-secondary">Lọc kho:</span>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="text-xs bg-brand-paper border border-brand-border rounded-brand px-3 py-2 text-brand-charcoal focus:outline-none"
              >
                <option value="all">Tất cả biến thể ({allVariantsList.length})</option>
                <option value="low-stock">Sắp hết hàng (&lt; 12 cái)</option>
                <option value="out-of-stock">Hết hàng (0 sản phẩm)</option>
              </select>
              <span className="text-xs text-brand-muted shrink-0 hidden md:inline">
                ({filteredVariants.length} biến thể)
              </span>
            </div>
          </div>

          <div className="bg-brand-paper rounded-brand-xl border border-brand-border/60 shadow-subtle overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[750px]">
              <thead>
                <tr className="bg-brand-sand/50 text-brand-charcoal font-semibold border-b border-brand-border">
                  <th className="p-3.5">Mã SKU</th>
                  <th className="p-3.5">Sản phẩm thời trang</th>
                  <th className="p-3.5">Màu sắc</th>
                  <th className="p-3.5">Kích cỡ</th>
                  <th className="p-3.5 text-center">Tồn kho hiện tại</th>
                  <th className="p-3.5 text-right">Điều chỉnh tồn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filteredVariants.map((item) => (
                  <tr key={item.variantId} className="hover:bg-brand-sand/20 transition-colors">
                    <td className="p-3.5 font-mono text-[11px] font-bold text-brand-forest">
                      {item.sku}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.image}
                          alt=""
                          className="w-8 aspect-[3/4] rounded-brand-xs object-cover bg-brand-sand border"
                        />
                        <span className="font-semibold text-brand-charcoal line-clamp-1">{item.productName}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: item.colorHex }} />
                        <span>{item.colorName}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-brand-forest">{item.size}</td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold ${
                          item.stock < 10
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {item.stock} cái
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2.5"
                        onClick={() => handleOpenAdjust(item)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Điều chỉnh
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab 2: Lịch sử biến động kho */
        <div className="bg-brand-paper rounded-brand-xl border border-brand-border/60 shadow-subtle overflow-x-auto">
          {stockLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-brand-muted space-y-2">
              <History className="w-8 h-8 mx-auto stroke-[1.5]" />
              <p>Chưa có giao dịch biến động tồn kho nào được ghi nhận.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs min-w-[700px]">
              <thead>
                <tr className="bg-brand-sand/50 text-brand-charcoal font-semibold border-b border-brand-border">
                  <th className="p-3.5">Thời gian</th>
                  <th className="p-3.5">Sản phẩm & SKU</th>
                  <th className="p-3.5">Lý do biến động</th>
                  <th className="p-3.5 text-center">Biến động</th>
                  <th className="p-3.5 text-center">Tồn mới</th>
                  <th className="p-3.5">Người thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {stockLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-brand-sand/20">
                    <td className="p-3.5 text-brand-muted">{formatDate(log.createdAt)}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-brand-charcoal">{log.productName}</div>
                      <div className="text-[11px] text-brand-muted">
                        {log.sku} • {log.color} - Size {log.size}
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-brand-charcoal">
                      <span>{log.reason}</span>
                      {log.referenceId && (
                        <span className="text-brand-forest block text-[11px]">Đơn: {log.referenceId}</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center font-bold">
                      {log.changeAmount > 0 ? (
                        <span className="text-emerald-700 flex items-center justify-center gap-0.5">
                          <ArrowUpRight className="w-3.5 h-3.5" />+{log.changeAmount}
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center justify-center gap-0.5">
                          <ArrowDownRight className="w-3.5 h-3.5" />{log.changeAmount}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center font-bold text-brand-charcoal">
                      {log.newStock}
                    </td>
                    <td className="p-3.5 text-brand-secondary">{log.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal Điều chỉnh Tồn kho */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Điều chỉnh Số lượng Tồn kho Biến thể"
        description={
          selectedVariant
            ? `${selectedVariant.productName} (${selectedVariant.color} - Size ${selectedVariant.size})`
            : ''
        }
      >
        {selectedVariant && (
          <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
            <div className="p-3 rounded-brand bg-brand-sand/50 space-y-1">
              <div>Mã SKU: <strong>{selectedVariant.sku}</strong></div>
              <div>Số lượng tồn kho hiện tại: <strong className="text-brand-forest text-sm">{selectedVariant.currentStock}</strong> cái</div>
            </div>

            <Input
              label="Số lượng tồn kho mới sau điều chỉnh *"
              type="number"
              min="0"
              value={newStock}
              onChange={(e) => setNewStock(Number(e.target.value))}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-brand-secondary">
                Lý do điều chỉnh kho *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full h-11 px-3 text-xs rounded-brand border border-brand-border bg-brand-paper text-brand-charcoal"
              >
                <option value="Nhập hàng mới">Nhập hàng mới từ xưởng may</option>
                <option value="Kiểm kê định kỳ">Kiểm kê định kỳ tại kho</option>
                <option value="Điều chỉnh thủ công">Điều chỉnh thủ công (hàng mẫu / trưng bày)</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAdjustModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Xác nhận lưu tồn
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
