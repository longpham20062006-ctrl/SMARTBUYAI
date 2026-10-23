import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import duplicateReportData from '@/mocks/duplicateReport.json';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Layers,
  CheckCircle,
  AlertTriangle,
  X,
  Palette,
  Calendar,
} from 'lucide-react';

export const AdminProductsPage: React.FC = () => {
  useRepoSubscription(['products']);
  const products = MockRepo.getProducts();
  const { success, info } = useToast();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [seasonFilter, setSeasonFilter] = useState('ALL');
  const [filterNeedsReview, setFilterNeedsReview] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState<'confirmed' | 'pending'>('confirmed');
  const [pendingCandidates, setPendingCandidates] = useState(duplicateReportData.duplicateCandidates || []);

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.variants.some((v) => v.sku.toLowerCase().includes(search.toLowerCase()));
    
    const matchCat = categoryFilter === 'ALL' || p.categorySlug === categoryFilter;
    
    const matchSeason =
      seasonFilter === 'ALL' ||
      (p.seasons && p.seasons.includes(seasonFilter)) ||
      (p.season && p.season.includes(seasonFilter));

    const matchReview = !filterNeedsReview || p.needsReview === true;
    return matchSearch && matchCat && matchSeason && matchReview;
  });

  const handleToggleActive = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    if (target) {
      const updated = { ...target, isActive: !target.isActive };
      MockRepo.saveProduct(updated);
      success(
        updated.isActive ? 'Đã hiển thị sản phẩm' : 'Đã ẩn sản phẩm khỏi catalog khách',
        target.name
      );
    }
  };

  const handleDelete = (productId: string, name: string) => {
    setProductToDelete({ id: productId, name });
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      MockRepo.deleteProduct(productToDelete.id);
      success('Đã xóa sản phẩm thành công', productToDelete.name);
      setProductToDelete(null);
    }
  };

  const handleConfirmCandidateMerge = (idx: number) => {
    const candidate = pendingCandidates[idx];
    setPendingCandidates((prev) => prev.filter((_, i) => i !== idx));
    success('Đã xác nhận gộp biến thể', `Các ảnh trong ${candidate.folder} đã được hợp nhất vào mẫu sản phẩm`);
  };

  const handleRejectCandidateMerge = (idx: number) => {
    const candidate = pendingCandidates[idx];
    setPendingCandidates((prev) => prev.filter((_, i) => i !== idx));
    info('Đã giữ sản phẩm riêng biệt', `Không gộp các ảnh trong ${candidate.folder}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-brand-charcoal">
            Quản lý Sản phẩm & Biến thể
          </h1>
          <p className="text-xs sm:text-sm text-brand-secondary mt-1">
            Mô hình Shopee / TikTok Shop: Mỗi mẫu thiết kế là 1 thẻ sản phẩm duy nhất với nhiều màu sắc và kích cỡ.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDuplicateModal(true)}
            className="text-xs border-[#DDD6FE] text-[#7C3AED] hover:bg-[#F3E8FF]"
          >
            <Layers className="w-4 h-4 mr-1.5" />
            Báo cáo gộp sản phẩm ({duplicateReportData.summary.confirmedMergedGroupsCount})
          </Button>

          <Link to="/admin/products/new">
            <Button variant="primary" size="sm" className="text-xs">
              <Plus className="w-4 h-4 mr-1.5" />
              Thêm mẫu mới
            </Button>
          </Link>
        </div>
      </div>

      {/* Thẻ thống kê chuẩn Shopee / TikTok */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-xl border border-[#E4E4E7] shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-[#71717A] tracking-wider block">Mẫu sản phẩm (Parent)</span>
          <span className="text-2xl font-black text-[#18181B] mt-1 block">{products.length}</span>
          <span className="text-[10px] text-emerald-600 font-medium">1 mẫu = 1 thẻ duy nhất</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E4E4E7] shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-[#71717A] tracking-wider block">Nhóm gộp biến thể</span>
          <span className="text-2xl font-black text-[#8B5CF6] mt-1 block">
            {duplicateReportData.summary.confirmedMergedGroupsCount}
          </span>
          <span className="text-[10px] text-[#71717A]">Đã chuẩn hóa màu/size</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E4E4E7] shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-[#71717A] tracking-wider block">Kho ảnh thật đã quét</span>
          <span className="text-2xl font-black text-[#0284C7] mt-1 block">
            {duplicateReportData.summary.totalScannedImages}
          </span>
          <span className="text-[10px] text-sky-600">public/images/san-pham</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E4E4E7] shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-[#71717A] tracking-wider block">Cần xác nhận gộp</span>
          <span className="text-2xl font-black text-amber-500 mt-1 block">
            {pendingCandidates.length}
          </span>
          <span className="text-[10px] text-amber-600 font-medium">Chờ duyệt thủ công</span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-brand-paper rounded-brand-xl p-4 border border-brand-border/60 shadow-subtle flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo ID, tên, SKU, thương hiệu..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-brand border border-brand-border bg-brand-sand/40 focus:outline-none focus:border-brand-forest text-brand-charcoal"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Lọc Mùa */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-brand-secondary">Mùa:</span>
            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="text-xs bg-white border border-brand-border rounded-lg px-2.5 py-1.5 text-brand-charcoal focus:outline-none"
            >
              <option value="ALL">Tất cả mùa</option>
              <option value="he">Mùa hè (he)</option>
              <option value="dong">Mùa đông (dong)</option>
              <option value="xuan-thu">Xuân – Thu (xuan-thu)</option>
            </select>
          </div>

          {/* Lọc Danh mục */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-brand-secondary">Danh mục:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-white border border-brand-border rounded-lg px-2.5 py-1.5 text-brand-charcoal focus:outline-none"
            >
              <option value="ALL">Tất cả danh mục</option>
              {MockRepo.getCategories().map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Data Table */}
      <div className="bg-brand-paper rounded-brand-xl border border-brand-border/60 shadow-subtle overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs min-w-[900px]">
          <thead>
            <tr className="bg-brand-sand/50 text-brand-charcoal font-semibold border-b border-brand-border">
              <th className="p-3.5">Mã Parent & Thiết kế</th>
              <th className="p-3.5">Màu sắc có thật</th>
              <th className="p-3.5">Mùa áp dụng</th>
              <th className="p-3.5">Giá bán</th>
              <th className="p-3.5">Tồn kho</th>
              <th className="p-3.5 text-center">Trạng thái</th>
              <th className="p-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/40">
            {filtered.map((product) => {
              const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
              const formattedRating = product.rating ? Number(product.rating).toFixed(1) : '4.9';

              return (
                <tr key={product.id} className="hover:bg-brand-sand/20 transition-colors">
                  {/* Mã Parent & Thiết kế */}
                  <td className="p-3.5 max-w-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images[0]}
                        alt=""
                        className="w-12 aspect-[3/4] rounded-brand-sm object-cover bg-brand-sand shrink-0 border border-brand-border/30"
                      />
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#F2F3F5] text-[#18181B] rounded border border-[#E4E4E7]">
                            {product.id}
                          </span>
                          <Link
                            to={`/products/${product.slug}`}
                            target="_blank"
                            className="font-semibold text-brand-charcoal hover:text-brand-forest line-clamp-1 inline-flex items-center gap-1"
                            title="Xem trên trang khách"
                          >
                            <span>{product.name}</span>
                            <ExternalLink className="w-3 h-3 text-brand-muted shrink-0" />
                          </Link>
                        </div>
                        <div className="text-[11px] text-brand-muted flex items-center gap-2">
                          <span>{product.brand}</span>
                          <span>•</span>
                          <span className="text-amber-500 font-bold">★ {formattedRating}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Màu sắc có thật */}
                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5">
                      {product.colors.map((c) => (
                        <span
                          key={c.slug}
                          title={`${c.name} (${c.slug})`}
                          className="w-4 h-4 rounded-full border border-black/20 shadow-2xs inline-block"
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                      <span className="text-[11px] text-[#71717A] ml-1 font-medium">
                        ({product.colors.length} màu)
                      </span>
                    </div>
                    <div className="text-[10px] text-brand-muted mt-0.5">
                      {product.variants.length} SKUs biến thể
                    </div>
                  </td>

                  {/* Mùa áp dụng */}
                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1">
                      {product.seasons && product.seasons.length > 0 ? (
                        product.seasons.map((s) => (
                          <span
                            key={s}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              s === 'he'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : s === 'dong'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {s === 'he' ? '☀️ Hè' : s === 'dong' ? '❄️ Đông' : '🍂 Xuân-Thu'}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-brand-muted">Bốn mùa</span>
                      )}
                    </div>
                  </td>

                  {/* Giá bán */}
                  <td className="p-3.5 font-bold text-brand-charcoal">
                    {formatPrice(product.price)}
                  </td>

                  {/* Tồn kho */}
                  <td className="p-3.5">
                    <span
                      className={`font-semibold ${
                        totalStock < 15 ? 'text-rose-600' : 'text-brand-charcoal'
                      }`}
                    >
                      {totalStock} chiếc
                    </span>
                  </td>

                  {/* Trạng thái ẩn/hiện */}
                  <td className="p-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(product.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                        product.isActive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-brand-sand text-brand-muted'
                      }`}
                    >
                      {product.isActive ? (
                        <>
                          <Eye className="w-3 h-3 text-emerald-600" />
                          <span>Hiển thị</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Đã ẩn</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Thao tác Sửa / Xóa */}
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link to={`/admin/products/${product.id}/edit`}>
                        <button
                          className="p-1.5 rounded-brand hover:bg-brand-sand text-brand-secondary hover:text-brand-forest transition-colors cursor-pointer"
                          title="Sửa sản phẩm & Biến thể"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="p-1.5 rounded-brand hover:bg-rose-50 text-brand-secondary hover:text-rose-600 transition-colors cursor-pointer"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Báo Cáo Gộp Sản Phẩm Trùng */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E4E4E7] flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#18181B] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#8B5CF6]" />
                  <span>Báo cáo Phát hiện Sản phẩm Trùng & Quản lý Gộp Biến thể</span>
                </h3>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Chuẩn hóa theo trải nghiệm Shopee / TikTok Shop: Gom ảnh cùng mẫu vào 1 mã Parent
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="p-1.5 rounded-lg hover:bg-[#F2F3F5] text-[#71717A] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#E4E4E7] bg-[#FAFAFA] px-5">
              <button
                type="button"
                onClick={() => setActiveReportTab('confirmed')}
                className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
                  activeReportTab === 'confirmed'
                    ? 'border-[#8B5CF6] text-[#7C3AED]'
                    : 'border-transparent text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                ✓ Đã xác nhận gộp ({duplicateReportData.confirmedMergedGroups.length} nhóm)
              </button>
              <button
                type="button"
                onClick={() => setActiveReportTab('pending')}
                className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
                  activeReportTab === 'pending'
                    ? 'border-[#8B5CF6] text-[#7C3AED]'
                    : 'border-transparent text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                ⚠️ Chờ admin kiểm tra ({pendingCandidates.length} ứng viên)
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {activeReportTab === 'confirmed' ? (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Hệ thống đã tự động gộp <strong>{duplicateReportData.summary.totalScannedImages} ảnh</strong> thành{' '}
                      <strong>{duplicateReportData.summary.totalMergedProducts} mẫu thiết kế</strong>. Mỗi mẫu có đầy đủ ảnh theo từng màu và mã SKU độc lập.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {duplicateReportData.confirmedMergedGroups.map((group) => (
                      <div
                        key={group.groupId}
                        className="p-3.5 bg-white rounded-xl border border-[#E4E4E7] shadow-2xs space-y-2 hover:border-[#DDD6FE] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#8B5CF6]/10 text-[#7C3AED] rounded">
                            {group.parentProductId}
                          </span>
                          <span className="text-[10px] text-[#71717A]">
                            {group.totalVariants} biến thể
                          </span>
                        </div>
                        <h4 className="font-semibold text-xs text-[#18181B] line-clamp-1">
                          {group.productName}
                        </h4>
                        
                        {/* Ảnh và màu đã gộp */}
                        <div className="flex items-center gap-2 pt-1 border-t border-[#F2F3F5]">
                          {group.mergedColors.map((c, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <img
                                src={c.image}
                                alt={c.color}
                                className="w-9 h-11 object-cover rounded border border-[#E4E4E7]"
                              />
                              <span className="text-[10px] text-[#71717A]">{c.color}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingCandidates.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#71717A]">
                      🎉 Tuyệt vời! Không còn sản phẩm nào cần duyệt gộp.
                    </div>
                  ) : (
                    pendingCandidates.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-xs text-amber-900">{c.folder}</span>
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">
                              {c.unmergedFilesCount} ảnh dư
                            </span>
                          </div>
                          <p className="text-[11px] text-[#71717A]">
                            Phát hiện ảnh bổ sung chưa gán vào mẫu chính. Bạn muốn gộp vào mẫu hay tạo sản phẩm riêng?
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {c.sampleFiles.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt=""
                                className="w-10 h-12 object-cover rounded border border-amber-300"
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleConfirmCandidateMerge(idx)}
                            className="text-xs"
                          >
                            Xác nhận gộp
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectCandidateMerge(idx)}
                            className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                          >
                            Giữ riêng biệt
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E4E4E7] bg-white flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDuplicateModal(false)}
                className="text-xs"
              >
                Đóng báo cáo
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa sản phẩm"
        message={`Bạn có chắc chắn muốn xóa sản phẩm "${productToDelete?.name}"? Sản phẩm sẽ bị xóa vĩnh viễn khỏi danh mục mock.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        isDestructive={true}
      />
    </div>
  );
};
