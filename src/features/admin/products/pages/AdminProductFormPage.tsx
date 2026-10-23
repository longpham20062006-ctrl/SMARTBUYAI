import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { Product, ProductVariant, ColorOption, SizeCode, GenderCategory } from '@/types';
import { slugify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { saveLocalImage } from '@/mocks/idbStorage';
import {
  ArrowLeft,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';

const COMMON_SIZES: SizeCode[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'FreeSize'];

export const AdminProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const isEditing = Boolean(id);

  const existingProduct = id ? MockRepo.getProductById(id) : undefined;
  const categories = MockRepo.getCategories();
  const brands = MockRepo.getBrands();

  // Form Fields initialized with existing product data if editing
  const [name, setName] = useState(existingProduct?.name || '');
  const [slug, setSlug] = useState(existingProduct?.slug || '');
  const [brand, setBrand] = useState(existingProduct?.brand || brands[0]?.name || 'Raw Streetwear');
  const [categorySlug, setCategorySlug] = useState(existingProduct?.categorySlug || categories[0]?.slug || 'ao-thun');
  const [gender, setGender] = useState<GenderCategory>(existingProduct?.gender || 'unisex');
  const [price, setPrice] = useState<number>(existingProduct?.price ?? 189000);
  const [originalPrice, setOriginalPrice] = useState<number>(existingProduct?.originalPrice ?? 249000);
  const [shortDescription, setShortDescription] = useState(existingProduct?.shortDescription || '');
  const [description, setDescription] = useState(existingProduct?.description || '');
  const [material, setMaterial] = useState(existingProduct?.material || '100% Cotton 250gsm định lượng dày dặn');
  const [fit, setFit] = useState(existingProduct?.fit || 'Oversized');
  const [style, setStyle] = useState(existingProduct?.style || 'Streetwear');
  const [occasionInput, setOccasionInput] = useState(existingProduct?.occasion?.join(', ') || 'Đi chơi, Đi học, Dạo phố');
  const [careInput, setCareInput] = useState(existingProduct?.careInstructions?.join(', ') || 'Giặt máy chế độ nhẹ, Lộn trái khi phơi');
  const [badge, setBadge] = useState<string>(existingProduct?.badge || 'NEW');

  // Images
  const [images, setImages] = useState<string[]>(existingProduct?.images || [
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=80',
  ]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Colors
  const [colors, setColors] = useState<ColorOption[]>(existingProduct?.colors || [
    { name: 'Trắng Ngà', hex: '#FAF8F5', slug: 'trang-nga' },
    { name: 'Xanh Navy', hex: '#1C2938', slug: 'xanh-navy' },
  ]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#8B5CF6');

  // Variants (Màu x Size)
  const [variants, setVariants] = useState<ProductVariant[]>(existingProduct?.variants || [
    {
      id: 'v_init_1',
      sku: 'SB-NEW-WHT-S',
      color: { name: 'Trắng Ngà', hex: '#FAF8F5', slug: 'trang-nga' },
      size: 'S',
      price: 189000,
      stock: 20,
    },
    {
      id: 'v_init_2',
      sku: 'SB-NEW-WHT-M',
      color: { name: 'Trắng Ngà', hex: '#FAF8F5', slug: 'trang-nga' },
      size: 'M',
      price: 189000,
      stock: 30,
    },
  ]);

  // Auto generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isEditing) {
      setSlug(slugify(val));
    }
  };

  // Upload ảnh local lưu vào IndexedDB
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const dataUrl = await saveLocalImage(file);
        setImages((prev) => [...prev, dataUrl]);
        success('Đã lưu ảnh cục bộ', 'Ảnh tải lên đã được lưu bền vững vào IndexedDB');
      } catch (err: any) {
        error('Lỗi tải ảnh', err.message);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImages((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddColor = () => {
    if (!newColorName.trim()) return;
    const newColor: ColorOption = {
      name: newColorName.trim(),
      hex: newColorHex,
      slug: slugify(newColorName.trim()),
    };
    setColors((prev) => [...prev, newColor]);
    setNewColorName('');
  };

  const handleRemoveColor = (slugToRemove: string) => {
    setColors((prev) => prev.filter((c) => c.slug !== slugToRemove));
    setVariants((prev) => prev.filter((v) => v.color.slug !== slugToRemove));
  };

  const handleAddVariant = (color: ColorOption, size: SizeCode) => {
    const exists = variants.some((v) => v.color.slug === color.slug && v.size === size);
    if (exists) {
      error('Biến thể đã tồn tại', `Màu ${color.name} - Size ${size} đã có trong danh sách.`);
      return;
    }
    const newV: ProductVariant = {
      id: `v_${variants.length + 1}_${slugify(color.name)}_${size.toLowerCase()}`,
      sku: `SB-${slugify(color.name).toUpperCase().substring(0, 3)}-${size}`,
      color,
      size,
      price: price,
      stock: 15,
    };
    setVariants((prev) => [...prev, newV]);
  };

  const handleUpdateVariantStock = (vId: string, stock: number) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === vId ? { ...v, stock: Math.max(0, stock) } : v))
    );
  };

  const handleRemoveVariant = (vId: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== vId));
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      error('Thiếu thông tin', 'Vui lòng nhập tên sản phẩm.');
      return;
    }

    if (variants.length === 0) {
      error('Thiếu biến thể', 'Vui lòng tạo ít nhất 1 biến thể (Màu x Size) cho sản phẩm.');
      return;
    }

    const uniqueSizes = Array.from(new Set(variants.map((v) => v.size)));

    const productData: Product = {
      id: existingProduct?.id || `prod_${Date.now()}`,
      name,
      slug: slug || slugify(name),
      brand,
      categorySlug,
      gender,
      price: Number(price),
      originalPrice: Number(originalPrice),
      shortDescription: shortDescription || name,
      description: description || shortDescription || name,
      material,
      fit,
      style,
      occasion: occasionInput.split(',').map((s) => s.trim()).filter(Boolean),
      careInstructions: careInput.split(',').map((s) => s.trim()).filter(Boolean),
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=80'],
      colors,
      sizes: uniqueSizes,
      variants,
      rating: existingProduct?.rating || 4.9,
      reviewCount: existingProduct?.reviewCount || 1,
      badge: badge ? (badge as any) : undefined,
      isActive: existingProduct ? existingProduct.isActive : true,
      createdAt: existingProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    MockRepo.saveProduct(productData);
    success(
      isEditing ? 'Đã cập nhật sản phẩm thành công' : 'Đã thêm sản phẩm mới vào catalog',
      name
    );
    navigate('/admin/products');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-brand-border/60 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="p-1.5 rounded-brand hover:bg-brand-sand text-brand-secondary hover:text-brand-charcoal"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-editorial text-2xl font-semibold text-brand-charcoal">
              {isEditing ? 'Chỉnh sửa Thiết kế Thời trang' : 'Tạo Thiết kế Sản phẩm Mới'}
            </h1>
            <p className="text-xs text-brand-secondary mt-0.5">
              Cập nhật thuộc tính chất liệu, phom dáng và bảng tồn kho biến thể.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Thông tin cơ bản */}
        <div className="bg-brand-paper rounded-brand-xl p-6 border border-brand-border/60 shadow-subtle space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-charcoal border-b border-brand-border/40 pb-2">
            1. Thông tin chung & Giá bán
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tên sản phẩm thời trang *"
              value={name}
              onChange={handleNameChange}
              placeholder="Ví dụ: Áo Sơ Mi Linen Cổ Trại Phom Rộng"
              required
            />
            <Input
              label="Đường dẫn tĩnh (Slug)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ao-so-mi-linen-co-trai"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-brand-secondary">
                Thương hiệu
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full h-11 px-3 text-xs rounded-brand border border-brand-border bg-brand-paper text-brand-charcoal"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-brand-secondary">
                Danh mục
              </label>
              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="w-full h-11 px-3 text-xs rounded-brand border border-brand-border bg-brand-paper text-brand-charcoal"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-brand-secondary">
                Giới tính
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as GenderCategory)}
                className="w-full h-11 px-3 text-xs rounded-brand border border-brand-border bg-brand-paper text-brand-charcoal"
              >
                <option value="nam">Nam</option>
                <option value="nu">Nữ</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Giá bán niêm yết (VND) *"
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
            />
            <Input
              label="Giá gốc so sánh (Tùy chọn)"
              type="number"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(Number(e.target.value))}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-brand-secondary">
                Nhãn nổi bật (Badge)
              </label>
              <select
                value={badge}
                onChange={(e) => setBadge(e.target.value as any)}
                className="w-full h-11 px-3 text-xs rounded-brand border border-brand-border bg-brand-paper text-brand-charcoal"
              >
                <option value="">Không gắn nhãn</option>
                <option value="Mới">Mới (New Arrival)</option>
                <option value="Tuyển chọn">Tuyển chọn (Editor's Pick)</option>
                <option value="Bán chạy">Bán chạy</option>
                <option value="Hữu cơ">Hữu cơ (Organic)</option>
              </select>
            </div>
          </div>

          <Input
            label="Mô tả tóm tắt (1 dòng)"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Chất vải lanh mềm mại thoáng mát cho ngày hè năng động."
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-brand-secondary">
              Mô tả chi tiết thiết kế
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-brand border border-brand-border bg-brand-paper p-3 text-xs text-brand-charcoal focus:outline-none focus:border-brand-forest"
            />
          </div>
        </div>

        {/* Section 2: Đặc tả thời trang */}
        <div className="bg-brand-paper rounded-brand-xl p-6 border border-brand-border/60 shadow-subtle space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-charcoal border-b border-brand-border/40 pb-2">
            2. Đặc tính thời trang & Bảo quản
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Chất liệu vải *"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="100% Cotton Supima 240GSM"
            />
            <Input
              label="Phom dáng (Fit) *"
              value={fit}
              onChange={(e) => setFit(e.target.value)}
              placeholder="Regular Fit / Relaxed"
            />
            <Input
              label="Phong cách *"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="Tối giản / Công sở"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Dịp phù hợp (Phân cách bằng dấu phẩy)"
              value={occasionInput}
              onChange={(e) => setOccasionInput(e.target.value)}
            />
            <Input
              label="Hướng dẫn bảo quản (Phân cách bằng dấu phẩy)"
              value={careInput}
              onChange={(e) => setCareInput(e.target.value)}
            />
          </div>
        </div>

        {/* Section 3: Hình ảnh sản phẩm (Hỗ trợ upload local lưu IndexedDB) */}
        <div className="bg-brand-paper rounded-brand-xl p-6 border border-brand-border/60 shadow-subtle space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-charcoal border-b border-brand-border/40 pb-2">
            3. Bộ sưu tập hình ảnh (Tỉ lệ 3:4)
          </h2>

          {/* Dải ảnh xem trước */}
          <div className="flex flex-wrap gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-24 aspect-[3/4] rounded-brand overflow-hidden bg-brand-sand border border-brand-border">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Upload từ máy local lưu vào IndexedDB */}
            <div className="p-4 rounded-brand border border-dashed border-brand-border bg-brand-sand/30 flex flex-col items-center justify-center text-center space-y-2">
              <Upload className="w-6 h-6 text-brand-forest" />
              <div className="text-xs font-semibold text-brand-charcoal">Tải ảnh từ máy tính (IndexedDB)</div>
              <p className="text-[11px] text-brand-muted">Lưu bền vững trong trình duyệt, không mất sau refresh.</p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <span className="inline-block px-3 py-1.5 rounded-brand bg-brand-forest text-brand-ivory text-xs font-semibold">
                  {isUploading ? 'Đang lưu ảnh...' : 'Chọn file ảnh'}
                </span>
              </label>
            </div>

            {/* Dán URL ảnh */}
            <div className="p-4 rounded-brand border border-brand-border bg-brand-paper space-y-3">
              <label className="text-xs font-semibold text-brand-charcoal block">Hoặc dán URL ảnh trực tiếp</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-3 py-2 text-xs rounded-brand border border-brand-border focus:outline-none"
                />
                <Button type="button" size="sm" variant="outline" onClick={handleAddImageUrl}>
                  Thêm
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Màu sắc & Biến thể tồn kho */}
        <div className="bg-brand-paper rounded-brand-xl p-6 border border-brand-border/60 shadow-subtle space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-charcoal border-b border-brand-border/40 pb-2">
            4. Màu sắc & Tồn kho theo biến thể (Variants)
          </h2>

          {/* Quản lý Màu */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-brand-secondary block">Danh sách màu của thiết kế:</span>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <div
                  key={c.slug}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-brand bg-brand-sand border border-brand-border text-xs"
                >
                  <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: c.hex }} />
                  <span className="font-semibold text-brand-charcoal">{c.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(c.slug)}
                    className="text-brand-muted hover:text-rose-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 items-center pt-1 max-w-sm">
              <input
                type="color"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                className="w-10 h-9 p-0.5 rounded border border-brand-border cursor-pointer"
              />
              <input
                type="text"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="Tên màu mới (vd: Xanh Rêu)"
                className="flex-1 px-3 py-2 text-xs rounded-brand border border-brand-border focus:outline-none"
              />
              <Button type="button" size="sm" variant="outline" onClick={handleAddColor}>
                + Thêm màu
              </Button>
            </div>
          </div>

          {/* Thêm nhanh biến thể theo size */}
          <div className="pt-4 border-t border-brand-border/40 space-y-3">
            <span className="text-xs font-bold text-brand-secondary block">Thêm kích cỡ cho từng màu:</span>
            <div className="flex flex-wrap gap-2">
              {colors.map((col) => (
                <div key={col.slug} className="flex items-center gap-1.5 bg-brand-sand/50 p-2 rounded-brand border border-brand-border/40 text-xs">
                  <span className="font-semibold text-brand-charcoal mr-1">{col.name}:</span>
                  {COMMON_SIZES.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleAddVariant(col, sz)}
                      className="px-2 py-1 rounded bg-brand-paper hover:bg-brand-forest hover:text-white border border-brand-border transition-colors text-[11px] cursor-pointer"
                    >
                      + {sz}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Bảng biến thể tồn kho */}
          <div className="overflow-x-auto rounded-brand border border-brand-border text-xs">
            <table className="w-full text-left divide-y divide-brand-border">
              <thead className="bg-brand-sand/50 font-semibold text-brand-charcoal">
                <tr>
                  <th className="p-3">Màu sắc</th>
                  <th className="p-3">Kích cỡ</th>
                  <th className="p-3">Mã SKU</th>
                  <th className="p-3">Số lượng tồn kho</th>
                  <th className="p-3 text-right">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40 bg-brand-paper">
                {variants.map((v) => (
                  <tr key={v.id}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: v.color.hex }} />
                        <span>{v.color.name}</span>
                      </div>
                    </td>
                    <td className="p-3 font-bold text-brand-forest">{v.size}</td>
                    <td className="p-3 text-brand-muted">{v.sku}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={(e) => handleUpdateVariantStock(v.id, Number(e.target.value))}
                        className="w-24 px-2 py-1 rounded border border-brand-border font-bold text-brand-charcoal text-xs"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(v.id)}
                        className="text-brand-muted hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Nút lưu */}
        <div className="flex justify-between items-center pt-4 border-t border-brand-border/60">
          <Link to="/admin/products">
            <Button type="button" variant="outline" size="md">
              Hủy bỏ
            </Button>
          </Link>

          <Button type="submit" variant="primary" size="lg" className="text-xs uppercase font-semibold px-8">
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? 'Lưu thay đổi sản phẩm' : 'Đăng bán sản phẩm mới'}
          </Button>
        </div>
      </form>
    </div>
  );
};
