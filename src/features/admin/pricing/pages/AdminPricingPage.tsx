import React, { useState, useMemo } from 'react';
import { MockRepo } from '@/mocks/repository';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import pricingRegistryData from '@/mocks/pricingRegistry.json';
import {
  DollarSign,
  Search,
  CheckCircle,
  Edit2,
  RotateCcw,
  Download,
  Upload,
  CheckCheck,
  AlertCircle,
  FileSpreadsheet,
  Filter,
} from 'lucide-react';

interface PricingRow {
  productId: string;
  productName: string;
  categorySlug: string;
  currentPrice: number;
  costPrice: number;
  suggestedPrice: number;
  approvedPrice: number;
  originalPrice: number;
  profitMargin: number;
  status: 'approved' | 'pending';
  updatedAt: string;
}

export const AdminPricingPage: React.FC = () => {
  useRepoSubscription(['products']);
  const products = MockRepo.getProducts();
  const { success, info, error: toastError } = useToast();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'approved' | 'pending'>('ALL');
  const [pricingList, setPricingList] = useState<PricingRow[]>(pricingRegistryData as PricingRow[]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Lọc sản phẩm theo tìm kiếm, danh mục, trạng thái
  const filteredList = useMemo(() => {
    return pricingList.filter((item) => {
      const matchSearch =
        item.productId.toLowerCase().includes(search.toLowerCase()) ||
        item.productName.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || item.categorySlug === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [pricingList, search, categoryFilter, statusFilter]);

  // Kiểm tra trùng giá trong cùng danh mục
  const duplicatePriceMap = useMemo(() => {
    const map = new Map<string, number>();
    pricingList.forEach((item) => {
      const key = `${item.categorySlug}-${item.currentPrice}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [pricingList]);

  const duplicateCount = useMemo(() => {
    let count = 0;
    pricingList.forEach((item) => {
      const key = `${item.categorySlug}-${item.currentPrice}`;
      if ((duplicatePriceMap.get(key) || 0) > 1) {
        count++;
      }
    });
    return count;
  }, [pricingList, duplicatePriceMap]);

  // Cập nhật giá sản phẩm và đồng bộ vào repository
  const handleSavePrice = (productId: string) => {
    if (tempPrice <= 0) {
      toastError('Giá không hợp lệ', 'Vui lòng nhập giá lớn hơn 0');
      return;
    }

    setPricingList((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const newCost = Math.round(tempPrice * 0.52);
          const newMargin = Number(((tempPrice - newCost) / tempPrice * 100).toFixed(1));
          return {
            ...item,
            currentPrice: tempPrice,
            approvedPrice: tempPrice,
            costPrice: newCost,
            profitMargin: newMargin,
            status: 'approved',
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );

    // Cập nhật vào MockRepo
    const targetProduct = products.find((p) => p.id === productId);
    if (targetProduct) {
      const updated = {
        ...targetProduct,
        price: tempPrice,
        approvedPrice: tempPrice,
        originalPrice: tempPrice,
        variants: targetProduct.variants.map((v) => ({ ...v, price: tempPrice, originalPrice: tempPrice })),
      };
      MockRepo.saveProduct(updated);
    }

    success('Đã cập nhật giá', `Mã ${productId} được định giá: ${formatPrice(tempPrice)}`);
    setEditingId(null);
  };

  // Duyệt giá đề xuất
  const handleApprovePrice = (productId: string) => {
    setPricingList((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          return {
            ...item,
            currentPrice: item.suggestedPrice,
            approvedPrice: item.suggestedPrice,
            status: 'approved',
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
    success('Đã duyệt giá', `Đã duyệt giá cho mã sản phẩm ${productId}`);
  };

  // Duyệt hàng loạt các mục đã chọn
  const handleBulkApprove = () => {
    if (selectedIds.length === 0) {
      info('Chưa chọn sản phẩm', 'Vui lòng tích chọn sản phẩm cần duyệt giá');
      return;
    }

    setPricingList((prev) =>
      prev.map((item) => {
        if (selectedIds.includes(item.productId)) {
          return {
            ...item,
            currentPrice: item.suggestedPrice,
            approvedPrice: item.suggestedPrice,
            status: 'approved',
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );

    selectedIds.forEach((id) => {
      const target = products.find((p) => p.id === id);
      const pr = pricingList.find((p) => p.productId === id);
      if (target && pr) {
        MockRepo.saveProduct({
          ...target,
          price: pr.suggestedPrice,
          approvedPrice: pr.suggestedPrice,
          originalPrice: pr.suggestedPrice,
        });
      }
    });

    success('Duyệt giá hàng loạt thành công', `Đã phê duyệt giá cho ${selectedIds.length} sản phẩm`);
    setSelectedIds([]);
  };

  // Xuất CSV
  const handleExportCSV = () => {
    const headers = ['Product ID,Tên sản phẩm,Danh mục,Giá hiện tại (VNĐ),Giá nhập (VNĐ),Giá đề xuất (VNĐ),Giá được duyệt (VNĐ),Biên lợi nhuận (%),Trạng thái'];
    const rows = pricingList.map((r) =>
      `"${r.productId}","${r.productName.replace(/"/g, '""')}","${r.categorySlug}",${r.currentPrice},${r.costPrice},${r.suggestedPrice},${r.approvedPrice},"${r.profitMargin}%","${r.status}"`
    );
    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bang-gia-san-pham-nam-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Đã xuất file CSV', 'Bảng giá 130 sản phẩm Nam đã được tải về.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#18181B] flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-[#8B5CF6]" />
            <span>Quản lý Bảng giá Sản phẩm Nam</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#71717A] mt-1">
            Định giá độc lập từng mẫu trong 130 folder theo khung tham khảo Master Men Catalog V4.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs flex items-center gap-1.5">
            <Download className="w-4 h-4" />
            <span>Xuất CSV</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleBulkApprove}
            disabled={selectedIds.length === 0}
            className="text-xs flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Duyệt hàng loạt ({selectedIds.length})</span>
          </Button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-[#E4E4E7] shadow-2xs">
          <span className="text-[11px] text-[#71717A] font-semibold uppercase tracking-wider block">Tổng sản phẩm</span>
          <span className="text-xl font-bold text-[#18181B] mt-0.5 block">{pricingList.length} mẫu</span>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-[#E4E4E7] shadow-2xs">
          <span className="text-[11px] text-emerald-600 font-semibold uppercase tracking-wider block">Đã duyệt giá</span>
          <span className="text-xl font-bold text-emerald-700 mt-0.5 block">
            {pricingList.filter((p) => p.status === 'approved').length} mẫu
          </span>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-[#E4E4E7] shadow-2xs">
          <span className="text-[11px] text-amber-600 font-semibold uppercase tracking-wider block">Chờ duyệt giá</span>
          <span className="text-xl font-bold text-amber-700 mt-0.5 block">
            {pricingList.filter((p) => p.status === 'pending').length} mẫu
          </span>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-[#E4E4E7] shadow-2xs">
          <span className="text-[11px] text-purple-600 font-semibold uppercase tracking-wider block">Trùng giá cùng loại</span>
          <span className="text-xl font-bold text-purple-700 mt-0.5 block">
            {duplicateCount === 0 ? '0 (Độc lập 100%)' : `${duplicateCount} mẫu`}
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white rounded-xl border border-[#E4E4E7] shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo Product ID hoặc tên mẫu..."
              className="w-full bg-[#F2F3F5] pl-9 pr-3 py-1.5 rounded-lg border border-[#E4E4E7] text-xs focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#F2F3F5] border border-[#E4E4E7] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#18181B] focus:outline-none focus:border-[#8B5CF6]"
          >
            <option value="ALL">Tất cả danh mục (10 loại)</option>
            <option value="ao-thun">Áo thun (13)</option>
            <option value="ao-thun-dai-tay">Áo thun dài tay (24)</option>
            <option value="ao-polo">Polo (10)</option>
            <option value="ao-so-mi">Sơ mi (12)</option>
            <option value="ao-hoodie">Hoodie (10)</option>
            <option value="ao-len">Áo len (17)</option>
            <option value="ao-khoac">Áo khoác (19)</option>
            <option value="quan-dai">Quần dài (5)</option>
            <option value="quan-short">Quần short (16)</option>
            <option value="do-bo">Đồ bộ Nam (4)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#F2F3F5] border border-[#E4E4E7] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#18181B] focus:outline-none focus:border-[#8B5CF6]"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="approved">Đã duyệt</option>
            <option value="pending">Chờ duyệt</option>
          </select>
        </div>
      </div>

      {/* Pricing Table */}
      <div className="bg-white rounded-xl border border-[#E4E4E7] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F4F4F5] text-[#71717A] font-bold border-b border-[#E4E4E7] uppercase tracking-wider text-[10px]">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredList.length && filteredList.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredList.map((p) => p.productId));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="rounded border-[#E4E4E7] cursor-pointer"
                  />
                </th>
                <th className="p-3 w-16">Ảnh</th>
                <th className="p-3 w-28">Product ID</th>
                <th className="p-3">Tên sản phẩm</th>
                <th className="p-3 w-28">Danh mục</th>
                <th className="p-3 w-28 text-right">Giá bán</th>
                <th className="p-3 w-24 text-right">Giá nhập</th>
                <th className="p-3 w-20 text-right">Lãi (%)</th>
                <th className="p-3 w-28 text-center">Trạng thái</th>
                <th className="p-3 w-28 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7]/60">
              {filteredList.map((item) => {
                const prod = products.find((p) => p.id === item.productId);
                const isEditing = editingId === item.productId;
                const isSelected = selectedIds.includes(item.productId);

                return (
                  <tr key={item.productId} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds((prev) => [...prev, item.productId]);
                          } else {
                            setSelectedIds((prev) => prev.filter((id) => id !== item.productId));
                          }
                        }}
                        className="rounded border-[#E4E4E7] cursor-pointer"
                      />
                    </td>
                    <td className="p-3">
                      <img
                        src={prod?.images[0] || '/images/placeholder.jpg'}
                        alt={item.productName}
                        className="w-10 h-13 object-cover rounded border border-[#E4E4E7] bg-neutral-100"
                      />
                    </td>
                    <td className="p-3 font-mono font-bold text-[11px] text-[#7C3AED]">
                      {item.productId}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-[#18181B] line-clamp-1">{item.productName}</div>
                      <div className="text-[10px] text-[#71717A]">
                        {prod?.modelFolder} • {prod?.colors.length} màu
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F2F3F5] text-[#71717A]">
                        {item.categorySlug}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(Number(e.target.value))}
                            step={1000}
                            className="w-24 px-1.5 py-0.5 border border-[#8B5CF6] rounded text-right font-bold text-xs"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-[#18181B] text-xs">
                          {formatPrice(item.currentPrice)}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right text-[#71717A]">
                      {formatPrice(item.costPrice)}
                    </td>
                    <td className="p-3 text-right font-semibold text-emerald-600">
                      {item.profitMargin}%
                    </td>
                    <td className="p-3 text-center">
                      {item.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Đã duyệt</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>Chờ duyệt</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleSavePrice(item.productId)}
                            className="px-2 py-1 bg-[#8B5CF6] text-white rounded text-[10px] font-bold hover:bg-[#7C3AED]"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[10px] hover:bg-gray-300"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingId(item.productId);
                              setTempPrice(item.currentPrice);
                            }}
                            className="p-1.5 rounded hover:bg-[#F2F3F5] text-[#71717A] hover:text-[#8B5CF6]"
                            title="Sửa giá"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {item.status === 'pending' && (
                            <button
                              onClick={() => handleApprovePrice(item.productId)}
                              className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600"
                              title="Duyệt giá"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
