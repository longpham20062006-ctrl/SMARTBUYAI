import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';

export const AdminProductsPage: React.FC = () => {
  useRepoSubscription(['products']);
  const products = MockRepo.getProducts();
  const { success } = useToast();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.variants.some((v) => v.sku.toLowerCase().includes(search.toLowerCase()));
    const matchCat = categoryFilter === 'ALL' || p.categorySlug === categoryFilter;
    return matchSearch && matchCat;
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-brand-charcoal">
            Quản lý Sản phẩm Thời trang
          </h1>
          <p className="text-xs sm:text-sm text-brand-secondary mt-1">
            Tổng cộng <strong>{products.length}</strong> thiết kế đang có trong kho dữ liệu mock.
          </p>
        </div>

        <Link to="/admin/products/new">
          <Button variant="primary" size="sm" className="text-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            Thêm sản phẩm mới
          </Button>
        </Link>
      </div>

      {/* Filter toolbar */}
      <div className="bg-brand-paper rounded-brand-xl p-4 border border-brand-border/60 shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, thương hiệu, SKU..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-brand border border-brand-border bg-brand-sand/40 focus:outline-none focus:border-brand-forest text-brand-charcoal"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-brand-secondary">Danh mục:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-brand-paper border border-brand-border rounded-brand px-3 py-2 text-brand-charcoal focus:outline-none"
          >
            <option value="ALL">Tất cả danh mục</option>
            {MockRepo.getCategories().map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Data Table */}
      <div className="bg-brand-paper rounded-brand-xl border border-brand-border/60 shadow-subtle overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs min-w-[800px]">
          <thead>
            <tr className="bg-brand-sand/50 text-brand-charcoal font-semibold border-b border-brand-border">
              <th className="p-3.5">Thiết kế</th>
              <th className="p-3.5">Thương hiệu</th>
              <th className="p-3.5">Giới tính</th>
              <th className="p-3.5">Giá bán</th>
              <th className="p-3.5">Tổng tồn kho</th>
              <th className="p-3.5 text-center">Trạng thái</th>
              <th className="p-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/40">
            {filtered.map((product) => {
              const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
              return (
                <tr key={product.id} className="hover:bg-brand-sand/20 transition-colors">
                  {/* Tên & Ảnh */}
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images[0]}
                        alt=""
                        className="w-12 aspect-[3/4] rounded-brand-sm object-cover bg-brand-sand shrink-0 border border-brand-border/30"
                      />
                      <div className="space-y-0.5 min-w-0">
                        <Link
                          to={`/products/${product.slug}`}
                          target="_blank"
                          className="font-semibold text-brand-charcoal hover:text-brand-forest line-clamp-1 inline-flex items-center gap-1"
                          title="Xem trên trang khách"
                        >
                          <span>{product.name}</span>
                          <ExternalLink className="w-3 h-3 text-brand-muted" />
                        </Link>
                        <div className="text-[11px] text-brand-muted">
                          {product.material.split(' ')[0]} • {product.variants.length} biến thể
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Thương hiệu */}
                  <td className="p-3.5 font-medium text-brand-secondary">
                    {product.brand}
                  </td>

                  {/* Giới tính */}
                  <td className="p-3.5 uppercase font-medium text-[11px]">
                    <span className="px-2 py-0.5 rounded-full bg-brand-sand text-brand-secondary">
                      {product.gender}
                    </span>
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
                          title="Sửa sản phẩm"
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
