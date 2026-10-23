import React, { useState } from 'react';
import { MockRepo } from '@/mocks/repository';
import { Brand } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import { slugify } from '@/lib/utils';
import { Plus, Edit, Trash2 } from 'lucide-react';

export const AdminBrandsPage: React.FC = () => {
  useRepoSubscription(['brands', 'products']);
  const brands = MockRepo.getBrands();
  const products = MockRepo.getProducts();
  const { success, error } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandToDelete, setBrandToDelete] = useState<{ id: string; name: string } | null>(null);

  const [name, setName] = useState('');
  const [origin, setOrigin] = useState('');
  const [description, setDescription] = useState('');

  const handleOpenCreate = () => {
    setEditingBrand(null);
    setName('');
    setOrigin('Việt Nam');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Brand) => {
    setEditingBrand(b);
    setName(b.name);
    setOrigin(b.origin);
    setDescription(b.description);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Vui lòng nhập tên thương hiệu');
      return;
    }

    const brandData: Brand = {
      id: editingBrand?.id || `b_${Date.now()}`,
      name,
      slug: slugify(name),
      origin: origin || 'Việt Nam',
      description: description || name,
    };

    MockRepo.saveBrand(brandData);
    success(
      editingBrand ? 'Đã cập nhật thương hiệu' : 'Đã thêm thương hiệu đối tác mới',
      name
    );
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, brandName: string) => {
    setBrandToDelete({ id, name: brandName });
  };

  const handleConfirmDelete = () => {
    if (brandToDelete) {
      const res = MockRepo.deleteBrand(brandToDelete.id);
      const bName = brandToDelete.name;
      setBrandToDelete(null);
      if (res.success) {
        success('Đã xóa thương hiệu thành công', bName);
      } else {
        error('Không thể xóa thương hiệu', res.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-brand-charcoal">
            Quản lý Thương hiệu Thời trang
          </h1>
          <p className="text-xs sm:text-sm text-brand-secondary mt-1">
            Các xưởng may đo may sẵn và nhà thiết kế đối tác của SMARTBUY AI.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenCreate} className="text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          Thêm thương hiệu mới
        </Button>
      </div>

      {/* Table Brands */}
      <div className="bg-brand-paper rounded-brand-xl border border-brand-border/60 shadow-subtle overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs min-w-[650px]">
          <thead>
            <tr className="bg-brand-sand/50 text-brand-charcoal font-semibold border-b border-brand-border">
              <th className="p-3.5">Thương hiệu</th>
              <th className="p-3.5">Xuất xứ xưởng</th>
              <th className="p-3.5">Triết lý thiết kế</th>
              <th className="p-3.5 text-center">Sản phẩm hiện có</th>
              <th className="p-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/40">
            {brands.map((b) => {
              const inUseCount = products.filter((p) => p.brand === b.name).length;
              return (
                <tr key={b.id} className="hover:bg-brand-sand/20 transition-colors">
                  <td className="p-3.5">
                    <div className="font-semibold text-brand-charcoal text-sm">{b.name}</div>
                    <div className="text-[11px] text-brand-muted">{b.slug}</div>
                  </td>
                  <td className="p-3.5 font-medium text-brand-forest">{b.origin}</td>
                  <td className="p-3.5 text-brand-secondary max-w-sm truncate">{b.description}</td>
                  <td className="p-3.5 text-center font-bold text-brand-charcoal">
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-sand text-brand-secondary">
                      {inUseCount} món
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1.5 rounded-brand hover:bg-brand-sand text-brand-secondary hover:text-brand-forest transition-colors cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id, b.name)}
                        className="p-1.5 rounded-brand hover:bg-rose-50 text-brand-secondary hover:text-rose-600 transition-colors cursor-pointer"
                        title="Xóa thương hiệu"
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

      {/* Modal Brand */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBrand ? 'Chỉnh sửa Thương hiệu' : 'Thêm Thương hiệu Đối tác'}
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <Input
            label="Tên thương hiệu *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Nordic Ease"
            required
          />

          <Input
            label="Xuất xứ / Xưởng dệt *"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="Ví dụ: Pháp / Việt Nam"
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-brand-secondary">
              Triết lý & Giới thiệu thương hiệu
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-brand border border-brand-border p-2.5 text-xs focus:outline-none focus:border-brand-forest"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Lưu thương hiệu
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(brandToDelete)}
        onClose={() => setBrandToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa thương hiệu"
        message={`Bạn có chắc chắn muốn xóa thương hiệu "${brandToDelete?.name}"?`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        isDestructive={true}
      />
    </div>
  );
};
