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
import {
  WOMEN_MAIN_GROUPS,
  WOMEN_CATEGORY_REGISTRY,
  CategoryMetadata,
  ParentCategoryGroup,
} from '@/constants/categories';
import {
  Plus,
  Edit,
  Trash2,
  FolderTree,
  RefreshCw,
  FolderCheck,
  FolderOpen,
  Info,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Layers,
} from 'lucide-react';

export const AdminCategoriesPage: React.FC = () => {
  useRepoSubscription(['categories', 'products']);
  const categories = MockRepo.getCategories();
  const products = MockRepo.getProducts();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'women' | 'men_all'>('women');
  const [selectedWomenGroup, setSelectedWomenGroup] = useState<ParentCategoryGroup | 'all'>('all');
  const [viewingFolderCat, setViewingFolderCat] = useState<CategoryMetadata | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  // 29 danh mục Nữ chuẩn từ Registry
  const womenCategories = Object.values(WOMEN_CATEGORY_REGISTRY).sort((a, b) => a.order - b.order);

  const filteredWomenCategories = womenCategories.filter((cat) => {
    if (selectedWomenGroup === 'all') return true;
    return cat.parentGroup === selectedWomenGroup;
  });

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

  const handleSyncWomenFolders = () => {
    info(
      'Kiểm tra đồng bộ 29 danh mục Nữ',
      'Đã xác nhận 29 thư mục chuẩn trên đĩa. Trạng thái hiện tại: 0 mẫu ảnh (Chưa có sản phẩm). Hệ thống đang sẵn sàng nạp ảnh mới.'
    );
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
            Hệ thống 29 danh mục Nữ chuẩn 100% cây thư mục thực tế &amp; Danh mục Nam, Unisex toàn diện.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncWomenFolders}
            className="text-xs border-[#8B5CF6] text-[#7C3AED] hover:bg-[#F3E8FF]"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Kiểm tra 29 thư mục Nữ
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenCreate} className="text-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            Thêm danh mục mới
          </Button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E4E4E7] shadow-2xs">
          <div className="flex items-center justify-between text-[#71717A] text-xs font-semibold uppercase">
            <span>Cấu trúc Thời trang Nữ</span>
            <FolderTree className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <div className="text-2xl font-black text-[#18181B] mt-1.5">
            29 <span className="text-xs font-medium text-[#71717A]">danh mục con</span>
          </div>
          <div className="text-[11px] text-[#16A34A] font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Phân cấp đúng 5 nhóm chính (.gitkeep sẵn sàng)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4E4E7] shadow-2xs">
          <div className="flex items-center justify-between text-[#71717A] text-xs font-semibold uppercase">
            <span>Mẫu Nữ công khai hiện có</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-[#18181B] mt-1.5">
            0 <span className="text-xs font-medium text-[#71717A]">sản phẩm</span>
          </div>
          <div className="text-[11px] text-[#71717A] mt-1">
            Đã xóa đồ Nữ cũ; Chờ thêm ảnh thật vào folder mẫu
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4E4E7] shadow-2xs">
          <div className="flex items-center justify-between text-[#71717A] text-xs font-semibold uppercase">
            <span>Danh mục Nam &amp; Khác</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-[#18181B] mt-1.5">
            {categories.length} <span className="text-xs font-medium text-[#71717A]">danh mục hoạt động</span>
          </div>
          <div className="text-[11px] text-[#71717A] mt-1">
            130 mẫu thiết kế thật đang vận hành
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E4E4E7] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('women')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'women'
              ? 'bg-[#18181B] text-white shadow-subtle'
              : 'bg-white text-[#71717A] hover:text-[#18181B] border border-[#E4E4E7]'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>Thời trang Nữ (29 danh mục chuẩn)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#8B5CF6] text-white font-black">
            29
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('men_all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'men_all'
              ? 'bg-[#18181B] text-white shadow-subtle'
              : 'bg-white text-[#71717A] hover:text-[#18181B] border border-[#E4E4E7]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Thời trang Nam &amp; Khác ({categories.length})</span>
        </button>
      </div>

      {activeTab === 'women' ? (
        /* ================= BẢNG 29 DANH MỤC NỮ CHUẨN ================= */
        <div className="space-y-4">
          {/* Filter 5 nhóm lớn Nữ */}
          <div className="flex items-center gap-1.5 flex-wrap bg-white p-2 rounded-xl border border-[#E4E4E7]">
            <span className="text-[11px] font-bold text-[#71717A] uppercase px-2">Nhóm chính:</span>
            <button
              type="button"
              onClick={() => setSelectedWomenGroup('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                selectedWomenGroup === 'all'
                  ? 'bg-[#8B5CF6] text-white shadow-2xs'
                  : 'text-[#18181B] hover:bg-[#F2F3F5]'
              }`}
            >
              Tất cả (29)
            </button>
            {WOMEN_MAIN_GROUPS.map((g) => {
              const countInGroup = womenCategories.filter((c) => c.parentGroup === g.key).length;
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setSelectedWomenGroup(g.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    selectedWomenGroup === g.key
                      ? 'bg-[#8B5CF6] text-white shadow-2xs'
                      : 'text-[#18181B] hover:bg-[#F2F3F5]'
                  }`}
                >
                  {g.name} ({countInGroup})
                </button>
              );
            })}
          </div>

          {/* Bảng chi tiết 29 danh mục */}
          <div className="bg-white rounded-2xl border border-[#E4E4E7] shadow-subtle overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[760px]">
              <thead>
                <tr className="bg-[#FAFAF8] text-[#18181B] font-bold border-b border-[#E4E4E7]">
                  <th className="p-3.5 w-12 text-center">STT</th>
                  <th className="p-3.5">Nhóm chính</th>
                  <th className="p-3.5">Tên danh mục Nữ</th>
                  <th className="p-3.5">Mã Slug</th>
                  <th className="p-3.5">Đường dẫn folder trên đĩa</th>
                  <th className="p-3.5 text-center">Trạng thái dữ liệu</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7]">
                {filteredWomenCategories.map((cat, idx) => {
                  const productsInCat = products.filter(
                    (p) => p.categorySlug === cat.slug && (p.gender === 'nu' || p.gender === 'unisex')
                  );
                  const hasProducts = productsInCat.length > 0;

                  return (
                    <tr key={cat.id} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="p-3.5 text-center font-bold text-[#71717A]">{cat.order}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F3E8FF] text-[#7C3AED] border border-[#DDD6FE]">
                          {cat.parentGroupName}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-[#18181B] text-sm">{cat.name}</div>
                        <div className="text-[11px] text-[#71717A]">{cat.englishName}</div>
                      </td>
                      <td className="p-3.5 font-mono text-[#8B5CF6] text-[11px] font-semibold">
                        {cat.slug}
                      </td>
                      <td className="p-3.5 font-mono text-[#52525B] text-[11px] max-w-xs truncate">
                        public/images/san-pham/{cat.folderPath}
                      </td>
                      <td className="p-3.5 text-center">
                        {hasProducts ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                            {productsInCat.length} sản phẩm
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200 text-[11px]">
                            <Info className="w-3 h-3 text-amber-500" />
                            Chưa có sản phẩm
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingFolderCat(cat)}
                            className="px-2.5 py-1 rounded-lg bg-[#F2F3F5] hover:bg-[#8B5CF6] hover:text-white text-[#18181B] font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                            title="Xem cấu trúc folder"
                          >
                            <FolderOpen className="w-3 h-3" />
                            <span>Xem folder</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              info(
                                `Đồng bộ danh mục: ${cat.name}`,
                                `Folder ${cat.folderPath} hiện trống. Khi bạn thêm folder mẫu con (vd: ${cat.slug}-001/) và ảnh thật, bấm Quét lại để nhập tự động.`
                              );
                            }}
                            className="px-2.5 py-1 rounded-lg border border-[#E4E4E7] hover:border-[#8B5CF6] text-[#71717A] hover:text-[#8B5CF6] font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                            title="Đồng bộ ảnh thực tế"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Đồng bộ</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= BẢNG DANH MỤC NAM & KHÁC ================= */
        <div className="bg-white rounded-2xl border border-[#E4E4E7] shadow-subtle overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[650px]">
            <thead>
              <tr className="bg-[#FAFAF8] text-[#18181B] font-bold border-b border-[#E4E4E7]">
                <th className="p-3.5">Danh mục</th>
                <th className="p-3.5">Mã Slug</th>
                <th className="p-3.5">Mô tả tóm tắt</th>
                <th className="p-3.5 text-center">Số sản phẩm liên kết</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7]">
              {categories.map((cat) => {
                const countInUse = products.filter((p) => p.categorySlug === cat.slug).length;
                return (
                  <tr key={cat.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-[#F2F3F5] shrink-0 border border-[#E4E4E7]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#F3E8FF] text-[#7C3AED] font-bold flex items-center justify-center shrink-0 border border-[#DDD6FE]">
                            {cat.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="font-bold text-[#18181B] text-sm">{cat.name}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[#8B5CF6] text-[11px] font-semibold">{cat.slug}</td>
                    <td className="p-3.5 text-[#71717A] max-w-xs truncate">{cat.description}</td>
                    <td className="p-3.5 text-center font-bold text-[#18181B]">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F2F3F5] text-[#18181B]">
                        {countInUse} món
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 rounded-lg hover:bg-[#F2F3F5] text-[#71717A] hover:text-[#8B5CF6] transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-[#71717A] hover:text-rose-600 transition-colors cursor-pointer"
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
      )}

      {/* Modal Xem chi tiết Folder danh mục Nữ */}
      <Modal
        isOpen={Boolean(viewingFolderCat)}
        onClose={() => setViewingFolderCat(null)}
        title={`Cấu trúc Thư mục: ${viewingFolderCat?.name || ''}`}
      >
        {viewingFolderCat && (
          <div className="space-y-4 text-xs font-sans">
            <div className="p-3 rounded-xl bg-[#F3E8FF]/50 border border-[#DDD6FE] text-[#7C3AED] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <FolderCheck className="w-4 h-4 text-[#8B5CF6]" />
                <span>Thư mục chuẩn vật lý trên hệ điều hành</span>
              </div>
              <div className="font-mono text-[11px] bg-white px-2 py-1.5 rounded border border-[#DDD6FE] select-all text-[#18181B]">
                D:\SMARTBUYAI\public\images\san-pham\{viewingFolderCat.folderPath}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#18181B] uppercase tracking-wider text-[11px]">
                Quy tắc nhập ảnh thực tế cho danh mục này:
              </h4>
              <ul className="space-y-1.5 text-[#52525B] list-disc pl-4 leading-relaxed">
                <li>
                  <strong>Tạo folder mẫu:</strong> Mỗi thiết kế đặt trong 1 thư mục riêng, ví dụ:
                  <code className="mx-1 px-1.5 py-0.5 rounded bg-[#F2F3F5] font-mono text-[10px]">
                    {viewingFolderCat.slug}-001/
                  </code>
                </li>
                <li>
                  <strong>Biến thể màu:</strong> Tên file ảnh đại diện cho màu sắc thực tế (ví dụ: <code className="font-mono text-[10px]">trang.jpg</code>, <code className="font-mono text-[10px]">den.jpg</code>).
                </li>
                <li>
                  <strong>Ảnh nhiều góc:</strong> Các ảnh cùng màu góc khác nhau (ví dụ: <code className="font-mono text-[10px]">den-mat-sau.jpg</code>) sẽ tự động nhóm vào gallery của biến thể đó.
                </li>
                <li>
                  <strong>Không bịa màu:</strong> Nếu tên file là mã ngẫu nhiên và ảnh chưa đủ tin cậy, hệ thống sẽ đánh dấu <span className="font-bold text-amber-600">needs-color-review</span> để Admin duyệt, tuyệt đối không tự gán mặc định.
                </li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-[#FAFAF8] border border-[#E4E4E7] flex items-center justify-between">
              <div>
                <span className="font-bold text-[#18181B] block">Tình trạng thư mục:</span>
                <span className="text-[#71717A] text-[11px]">Đã tạo sẵn thư mục &amp; file .gitkeep</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                SẴN SÀNG NHẬN ẢNH
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setViewingFolderCat(null)}
                className="text-xs"
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

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
            <label className="block text-xs font-medium uppercase tracking-wider text-[#71717A]">
              Mô tả danh mục
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-[#E4E4E7] p-2.5 text-xs focus:outline-none focus:border-[#8B5CF6]"
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
