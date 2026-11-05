import React, { useState } from 'react';
import { MockRepo } from '@/mocks/repository';
import { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import { slugify } from '@/lib/utils';
import { Plus, Edit, Trash2 } from 'lucide-react';

export const AdminCategoriesPage: React.FC = () => {
  useRepoSubscription(['categories', 'products']);
  const categories = MockRepo.getCategories();
  const products = MockRepo.getProducts();
  const { success, error } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setImage('https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=80');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description);
    setImage(cat.image);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Vui lòng nhập tên danh mục');
      return;
    }

    const categoryData: Category = {
      id: editingCategory?.id || `cat_${Date.now()}`,
      name,
      slug: slug || slugify(name),
      gender: ['nam', 'nu', 'unisex'],
      description: description || name,
      image: image || 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=80',
      itemCount: editingCategory ? editingCategory.itemCount : 0,
    };

    MockRepo.saveCategory(categoryData);
    success(
      editingCategory ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục mới thành công',
      name
    );
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, catName: string) => {
    setCategoryToDelete({ id, name: catName });
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      const res = MockRepo.deleteCategory(categoryToDelete.id);
      const catName = categoryToDelete.name;
      setCategoryToDelete(null);
      if (res.success) {
        success('Đã xóa danh mục thành công', catName);
      } else {
        error('Không thể xóa danh mục', res.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-brand-charcoal">
            Quản lý Danh mục Thời trang
          </h1>
          <p className="text-xs sm:text-sm text-brand-secondary mt-1">
            Phân loại các dòng trang phục Nam, Nữ, Unisex cho toàn hệ thống SMARTBUY AI.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenCreate} className="text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          Thêm danh mục mới
        </Button>
      </div>

      {/* Table Categories */}
      <div className="bg-brand-paper rounded-brand-xl border border-brand-border/60 shadow-subtle overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs min-w-[650px]">
          <thead>
            <tr className="bg-brand-sand/50 text-brand-charcoal font-semibold border-b border-brand-border">
              <th className="p-3.5">Danh mục</th>
              <th className="p-3.5">Mã Slug</th>
              <th className="p-3.5">Mô tả tóm tắt</th>
              <th className="p-3.5 text-center">Số sản phẩm liên kết</th>
              <th className="p-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/40">
            {categories.map((cat) => {
              const countInUse = products.filter((p) => p.categorySlug === cat.slug).length;
              return (
                <tr key={cat.id} className="hover:bg-brand-sand/20 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={cat.image}
                        alt=""
                        className="w-10 h-10 rounded-brand object-cover bg-brand-sand shrink-0 border"
                      />
                      <span className="font-semibold text-brand-charcoal text-sm">{cat.name}</span>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-brand-forest text-[11px]">{cat.slug}</td>
                  <td className="p-3.5 text-brand-secondary max-w-xs truncate">{cat.description}</td>
                  <td className="p-3.5 text-center font-bold text-brand-charcoal">
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-sand text-brand-secondary">
                      {countInUse} món
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 rounded-brand hover:bg-brand-sand text-brand-secondary hover:text-brand-forest transition-colors cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 rounded-brand hover:bg-rose-50 text-brand-secondary hover:text-rose-600 transition-colors cursor-pointer"
                        title="Xóa danh mục"
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

      {/* Modal Thêm/Sửa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Chỉnh sửa Danh mục' : 'Thêm Danh mục Mới'}
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <Input
            label="Tên danh mục *"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!editingCategory) setSlug(slugify(e.target.value));
            }}
            placeholder="Ví dụ: Áo len & Dệt kim"
            required
          />

          <Input
            label="Đường dẫn tĩnh (Slug) *"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="ao-len-det-kim"
            required
          />

          <Input
            label="URL Hình ảnh minh họa"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-brand-secondary">
              Mô tả danh mục
            </label>
            <textarea
              rows={2}
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
              Lưu danh mục
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa danh mục"
        message={`Bạn có chắc chắn muốn xóa danh mục "${categoryToDelete?.name}"? Các sản phẩm thuộc danh mục này có thể bị ảnh hưởng.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        isDestructive={true}
      />
    </div>
  );
};
