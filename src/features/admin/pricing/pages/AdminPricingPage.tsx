import React, { useState, useMemo, useEffect } from 'react';
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
  Download,
  CheckCheck,
  AlertCircle,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface PricingRow {
  productId: string;
  productName: string;
  categorySlug: string;
  gender?: string;
  image?: string;
  currentPrice: number;
  costPrice: number;
  suggestedPrice: number;
  approvedPrice: number;
  originalPrice: number;
  profitMargin: number;
  status: 'approved' | 'pending';
  subCategoryPending?: boolean;
  updatedAt: string;
}

const STORAGE_KEY = 'sb_pricing_registry';

export const AdminPricingPage: React.FC = () => {
  useRepoSubscription(['products']);
  const products = MockRepo.getProducts();
  const { success, info, error: toastError } = useToast();

  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'nam' | 'nu'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'approved' | 'pending'>('ALL');

  // Initialize from localStorage if exists, fallback to JSON
  const [pricingList, setPricingList] = useState<PricingRow[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 270) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load saved pricing registry:', e);
    }
    return pricingRegistryData as PricingRow[];
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Sync state changes to localStorage
  const saveRegistry = (newList: PricingRow[]) => {
    setPricingList(newList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to persist pricing registry:', e);
    }
  };

  // Distinct category list with item counts
  const availableCategories = useMemo(() => {
    const map = new Map<string, number>();
    pricingList.forEach((item) => {
      if (genderFilter !== 'ALL' && item.gender !== genderFilter) return;
      map.set(item.categorySlug, (map.get(item.categorySlug) || 0) + 1);
    });
    return Array.from(map.entries()).map(([slug, count]) => ({ slug, count }));
  }, [pricingList, genderFilter]);

  // Lọc sản phẩm theo tìm kiếm, giới tính, danh mục, trạng thái
  const filteredList = useMemo(() => {
    return pricingList.filter((item) => {
      const matchSearch =
        item.productId.toLowerCase().includes(search.toLowerCase()) ||
        item.productName.toLowerCase().includes(search.toLowerCase());
      const matchGender = genderFilter === 'ALL' || item.gender === genderFilter;
      const matchCat = categoryFilter === 'ALL' || item.categorySlug === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchSearch && matchGender && matchCat && matchStatus;
    });
  }, [pricingList, search, genderFilter, categoryFilter, statusFilter]);

  // Thống kê metrics
  const totalCount = pricingList.length;
  const approvedCount = pricingList.filter((p) => p.status === 'approved').length;
  const pendingCount = pricingList.filter((p) => p.status === 'pending').length;
  const womenCount = pricingList.filter((p) => p.gender === 'nu').length;
  const womenPendingCount = pricingList.filter((p) => p.gender === 'nu' && p.status === 'pending').length;

  // Cập nhật giá sản phẩm và đồng bộ vào repository
  const handleSavePrice = (productId: string) => {
    if (tempPrice <= 0) {
      toastError('Giá không hợp lệ', 'Vui lòng nhập giá lớn hơn 0');
      return;
    }

    const updatedList = pricingList.map((item) => {
      if (item.productId === productId) {
        const newCost = Math.round(tempPrice * 0.52);
        const newMargin = Number((((tempPrice - newCost) / tempPrice) * 100).toFixed(1));
        return {
          ...item,
          currentPrice: tempPrice,
          approvedPrice: tempPrice,
          costPrice: newCost,
          profitMargin: newMargin,
          status: 'approved' as const,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    saveRegistry(updatedList);

    // Cập nhật vào MockRepo để đồng bộ ngay lập tức tới Product Card, Detail, Cart
    const targetProduct = products.find((p) => p.id === productId);
    if (targetProduct) {
      const updated = {
        ...targetProduct,
        price: tempPrice,
        approvedPrice: tempPrice,
        originalPrice: tempPrice,
        priceStatus: 'approved' as const,
        variants: targetProduct.variants.map((v) => ({ ...v, price: tempPrice, originalPrice: tempPrice })),
      };
      MockRepo.saveProduct(updated);
    }

    success('Đã cập nhật giá', `Mã ${productId} được định giá: ${formatPrice(tempPrice)}`);
    setEditingId(null);
  };

  // Duyệt giá đề xuất cho 1 sản phẩm
  const handleApprovePrice = (productId: string) => {
    const itemToApprove = pricingList.find((p) => p.productId === productId);
    if (!itemToApprove) return;

    const approvedPrice = itemToApprove.suggestedPrice || itemToApprove.approvedPrice;

    const updatedList = pricingList.map((item) => {
      if (item.productId === productId) {
        return {
          ...item,
          currentPrice: approvedPrice,
          approvedPrice: approvedPrice,
          status: 'approved' as const,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    saveRegistry(updatedList);

    // Đồng bộ vào MockRepo
    const targetProduct = products.find((p) => p.id === productId);
    if (targetProduct) {
      MockRepo.saveProduct({
        ...targetProduct,
        price: approvedPrice,
        approvedPrice: approvedPrice,
        originalPrice: approvedPrice,
        priceStatus: 'approved',
        variants: targetProduct.variants.map((v) => ({
          ...v,
          price: approvedPrice,
          originalPrice: approvedPrice,
        })),
      });
    }

    success('Đã duyệt giá', `Mã ${productId} được duyệt bán chính thức: ${formatPrice(approvedPrice)}`);
  };

  // Duyệt hàng loạt các mục đã chọn
  const handleBulkApprove = () => {
    if (selectedIds.length === 0) {
      info('Chưa chọn sản phẩm', 'Vui lòng tích chọn sản phẩm cần duyệt giá');
      return;
    }

    const updatedList = pricingList.map((item) => {
      if (selectedIds.includes(item.productId)) {
        const approvedPrice = item.suggestedPrice || item.approvedPrice;
        return {
          ...item,
          currentPrice: approvedPrice,
          approvedPrice: approvedPrice,
          status: 'approved' as const,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    saveRegistry(updatedList);

    selectedIds.forEach((id) => {
      const target = products.find((p) => p.id === id);
      const pr = updatedList.find((p) => p.productId === id);
      if (target && pr) {
        MockRepo.saveProduct({
          ...target,
          price: pr.currentPrice,
          approvedPrice: pr.approvedPrice,
          originalPrice: pr.approvedPrice,
          priceStatus: 'approved',
          variants: target.variants.map((v) => ({
            ...v,
            price: pr.currentPrice,
            originalPrice: pr.approvedPrice,
          })),
        });
      }
    });

    success('Duyệt giá hàng loạt thành công', `Đã phê duyệt giá bán cho ${selectedIds.length} sản phẩm`);
    setSelectedIds([]);
  };

  // Duyệt nhanh tất cả 143 mẫu Nữ
  const handleApproveAllWomen = () => {
    const womenPendingIds = pricingList.filter((p) => p.gender === 'nu' && p.status === 'pending').map((p) => p.productId);
    if (womenPendingIds.length === 0) {
      info('Đã duyệt hết', 'Tất cả 143 sản phẩm Nữ đã có giá duyệt chính thức');
      return;
    }

    const updatedList = pricingList.map((item) => {
      if (item.gender === 'nu' && item.status === 'pending') {
        const approvedPrice = item.suggestedPrice;
        return {
          ...item,
          currentPrice: approvedPrice,
          approvedPrice: approvedPrice,
          status: 'approved' as const,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    saveRegistry(updatedList);

    womenPendingIds.forEach((id) => {
      const target = products.find((p) => p.id === id);
      const pr = updatedList.find((p) => p.productId === id);
      if (target && pr) {
        MockRepo.saveProduct({
          ...target,
          price: pr.currentPrice,
          approvedPrice: pr.approvedPrice,
          originalPrice: pr.approvedPrice,
          priceStatus: 'approved',
          variants: target.variants.map((v) => ({
            ...v,
            price: pr.currentPrice,
            originalPrice: pr.approvedPrice,
          })),
        });
      }
    });

    success('Duyệt toàn bộ mẫu Nữ thành công', `Đã kích hoạt giá bán chính thức cho ${womenPendingIds.length} mẫu Nữ`);
  };

  // Xuất CSV
  const handleExportCSV = () => {
    const headers = [
      'Product ID,Giới tính,Tên sản phẩm,Danh mục,Giá hiện tại (VNĐ),Giá đề xuất (VNĐ),Giá được duyệt (VNĐ),Giá nhập (VNĐ),Biên lãi (%),Trạng thái',
    ];
    const rows = filteredList.map(
      (r) =>
        `"${r.productId}","${r.gender === 'nu' ? 'Nữ' : 'Nam'}","${r.productName.replace(/"/g, '""')}","${r.categorySlug}",${r.currentPrice},${r.suggestedPrice},${r.approvedPrice},${r.costPrice},"${r.profitMargin}%","${r.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}"`
    );
    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `bang-gia-smartbuyai-${genderFilter.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Đã xuất file CSV', `Bảng giá ${filteredList.length} sản phẩm đã được tải về.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#18181B] flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-[#8B5CF6]" />
            <span>Quản lý Bảng giá Sản phẩm (Nam &amp; Nữ)</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#71717A] mt-1">
            Định giá độc lập từng Product ID cho toàn bộ 273 mẫu thiết kế (130 Nam + 143 Nữ). Giá đề xuất chưa duyệt không hiển thị bán hàng chính thức.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {womenPendingCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleApproveAllWomen}
              className="text-xs flex items-center gap-1.5 border-[#8B5CF6] text-[#7C3AED] hover:bg-[#F3E8FF]"
            >
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
              <span>Duyệt tất cả {womenPendingCount} mẫu Nữ</span>
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs flex items-center gap-1.5">
            <Download className="w-4 h-4" />
            <span>Xuất CSV ({filteredList.length})</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleBulkApprove}
            disabled={selectedIds.length === 0}
            className="text-xs flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Duyệt mục đã chọn ({selectedIds.length})</span>
          </Button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-[#E4E4E7] shadow-2xs">
          <span className="text-[11px] text-[#71717A] font-semibold uppercase tracking-wider block">Tổng sản phẩm</span>
          <span className="text-xl font-bold text-[#18181B] mt-0.5 block">{totalCount} mẫu (130 Nam / 143 Nữ)</span>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-[#E4E4E7] shadow-2xs">
          <span className="text-[11px] text-emerald-600 font-semibold uppercase tracking-wider block">Đã duyệt giá</span>
          <span className="text-xl font-bold text-emerald-700 mt-0.5 block">{approvedCount} mẫu</span>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-[#E4E4E7] shadow-2xs">
          <span className="text-[11px] text-amber-600 font-semibold uppercase tracking-wider block">Chờ duyệt giá</span>
          <span className="text-xl font-bold text-amber-700 mt-0.5 block">
            {pendingCount} mẫu {womenPendingCount > 0 ? `(${womenPendingCount} Nữ)` : ''}
          </span>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-[#E4E4E7] shadow-2xs">
          <span className="text-[11px] text-purple-600 font-semibold uppercase tracking-wider block">Chờ phân loại con</span>
          <span className="text-xl font-bold text-purple-700 mt-0.5 block">
            97 mẫu (91 Váy + 6 Quần Nữ)
          </span>
        </div>
      </div>

      {/* Gender Tabs & Filters Bar */}
      <div className="p-4 bg-white rounded-xl border border-[#E4E4E7] shadow-2xs space-y-3">
        {/* Gender Toggle */}
        <div className="flex items-center gap-2 border-b border-[#E4E4E7] pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#71717A] mr-2">Giới tính:</span>
          <button
            type="button"
            onClick={() => {
              setGenderFilter('ALL');
              setCategoryFilter('ALL');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              genderFilter === 'ALL'
                ? 'bg-[#8B5CF6] text-white shadow-xs'
                : 'bg-[#F2F3F5] text-[#18181B] hover:bg-[#E4E4E7]'
            }`}
          >
            Tất cả ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setGenderFilter('nam');
              setCategoryFilter('ALL');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              genderFilter === 'nam'
                ? 'bg-[#8B5CF6] text-white shadow-xs'
                : 'bg-[#F2F3F5] text-[#18181B] hover:bg-[#E4E4E7]'
            }`}
          >
            Nam (130)
          </button>
          <button
            type="button"
            onClick={() => {
              setGenderFilter('nu');
              setCategoryFilter('ALL');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              genderFilter === 'nu'
                ? 'bg-[#8B5CF6] text-white shadow-xs'
                : 'bg-[#F2F3F5] text-[#18181B] hover:bg-[#E4E4E7]'
            }`}
          >
            Nữ ({womenCount})
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
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
              <option value="ALL">Tất cả danh mục ({availableCategories.length} loại)</option>
              {availableCategories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.slug} ({c.count})
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#F2F3F5] border border-[#E4E4E7] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#18181B] focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="approved">Đã duyệt ({approvedCount})</option>
              <option value="pending">Chờ duyệt ({pendingCount})</option>
            </select>
          </div>
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
                <th className="p-3 w-32">Product ID</th>
                <th className="p-3">Tên sản phẩm</th>
                <th className="p-3 w-28">Danh mục</th>
                <th className="p-3 w-28 text-right">Giá hiện tại</th>
                <th className="p-3 w-28 text-right">Giá đề xuất</th>
                <th className="p-3 w-28 text-right">Giá đã duyệt</th>
                <th className="p-3 w-28 text-center">Trạng thái</th>
                <th className="p-3 w-28 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7]/60">
              {filteredList.map((item) => {
                const prod = products.find((p) => p.id === item.productId);
                const isEditing = editingId === item.productId;
                const isSelected = selectedIds.includes(item.productId);
                const displayImg = item.image || prod?.images[0] || '/images/placeholder.jpg';

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
                        src={displayImg}
                        alt={item.productName}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&auto=format&fit=crop&q=80';
                        }}
                        className="w-10 h-13 object-cover rounded border border-[#E4E4E7] bg-neutral-100"
                      />
                    </td>
                    <td className="p-3">
                      <div className="font-mono font-bold text-[11px] text-[#7C3AED]">{item.productId}</div>
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase mt-0.5 ${
                          item.gender === 'nu'
                            ? 'bg-pink-100 text-pink-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {item.gender === 'nu' ? 'Nữ' : 'Nam'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-[#18181B] line-clamp-1">{item.productName}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-[#71717A]">
                          {prod?.modelFolder || 'Folder'} • {prod?.colors.length || 1} màu
                        </span>
                        {item.subCategoryPending && (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1 rounded flex items-center gap-0.5">
                            <ShieldAlert className="w-2.5 h-2.5" />
                            <span>Chờ phân loại con</span>
                          </span>
                        )}
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
                      ) : item.currentPrice > 0 ? (
                        <span className="font-bold text-[#18181B] text-xs">
                          {formatPrice(item.currentPrice)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#71717A] italic">Chưa duyệt</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-semibold text-purple-700">
                      {formatPrice(item.suggestedPrice)}
                    </td>
                    <td className="p-3 text-right font-bold text-[#18181B]">
                      {item.approvedPrice > 0 ? (
                        formatPrice(item.approvedPrice)
                      ) : (
                        <span className="text-[11px] text-[#71717A] italic">0₫</span>
                      )}
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
                            className="px-2 py-1 bg-[#8B5CF6] text-white rounded text-[10px] font-bold hover:bg-[#7C3AED] cursor-pointer"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[10px] hover:bg-gray-300 cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingId(item.productId);
                              setTempPrice(item.currentPrice || item.suggestedPrice);
                            }}
                            className="p-1.5 rounded hover:bg-[#F2F3F5] text-[#71717A] hover:text-[#8B5CF6] cursor-pointer"
                            title="Sửa giá bán"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {item.status === 'pending' && (
                            <button
                              onClick={() => handleApprovePrice(item.productId)}
                              className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 cursor-pointer"
                              title="Duyệt giá đề xuất"
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
