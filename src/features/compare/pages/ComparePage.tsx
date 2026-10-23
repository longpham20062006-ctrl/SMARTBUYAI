import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '@/services/productService';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, X, Plus, ShoppingBag } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { MockRepo } from '@/mocks/repository';

export const ComparePage: React.FC = () => {
  const allProducts = productService.getAll();
  // Khởi tạo so sánh 2-3 sản phẩm mẫu nếu chưa có
  const [comparedList, setComparedList] = useState<Product[]>(() => {
    return allProducts.slice(0, 3);
  });
  const [onlyDiff, setOnlyDiff] = useState(false);
  const { success, error } = useToast();

  const handleRemove = (id: string) => {
    setComparedList((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddProduct = (product: Product) => {
    if (comparedList.some((p) => p.id === product.id)) return;
    if (comparedList.length >= 4) {
      error('Tối đa 4 sản phẩm', 'Bạn chỉ có thể so sánh tối đa 4 sản phẩm cùng lúc.');
      return;
    }
    setComparedList((prev) => [...prev, product]);
  };

  const handleQuickAddToCart = (product: Product) => {
    const defaultVariant = product.variants[0];
    if (!defaultVariant || defaultVariant.stock <= 0) {
      error('Hết hàng', 'Sản phẩm này tạm thời hết hàng.');
      return;
    }
    const res = MockRepo.addToCart({
      id: defaultVariant.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      brand: product.brand,
      image: defaultVariant.image || product.images[0],
      color: product.colors[0],
      size: product.sizes[0],
      price: defaultVariant.price,
      quantity: 1,
    });
    if (res.success) {
      success('Đã thêm vào giỏ', `${product.name} (Size ${product.sizes[0]})`);
    }
  };

  const availableToAdd = allProducts.filter((p) => !comparedList.some((item) => item.id === p.id));

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-brand-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-brand-muted mb-2">
            <Link to="/" className="hover:text-brand-charcoal">Trang chủ</Link>
            <span>/</span>
            <span className="text-brand-charcoal font-medium">So sánh thời trang</span>
          </div>
          <h1 className="font-editorial text-3xl font-semibold text-brand-charcoal">
            Đối chiếu & So sánh thiết kế
          </h1>
          <p className="text-xs sm:text-sm text-brand-secondary mt-1">
            So sánh phom dáng, chất liệu vải, bảng màu và giá trị giữa các sản phẩm để đưa ra lựa chọn phù hợp nhất.
          </p>
        </div>

        {/* Nút lọc Chỉ xem khác biệt */}
        {comparedList.length >= 2 && (
          <label className="flex items-center gap-2 text-xs font-semibold text-brand-charcoal cursor-pointer select-none bg-brand-sand/60 px-3 py-2 rounded-brand">
            <input
              type="checkbox"
              checked={onlyDiff}
              onChange={(e) => setOnlyDiff(e.target.checked)}
              className="rounded text-brand-forest focus:ring-brand-forest w-4 h-4 cursor-pointer"
            />
            <span>Chỉ xem các tiêu chí khác biệt</span>
          </label>
        )}
      </div>

      {comparedList.length === 0 ? (
        <div className="bg-brand-paper rounded-brand-xl p-12 text-center border border-brand-border/60 space-y-4">
          <ArrowRightLeft className="w-12 h-12 text-brand-muted mx-auto stroke-[1.5]" />
          <h3 className="font-editorial text-xl font-semibold text-brand-charcoal">
            Chưa có sản phẩm nào được chọn để so sánh
          </h3>
          <p className="text-xs text-brand-secondary max-w-sm mx-auto">
            Hãy chọn từ 2 đến 4 sản phẩm để đối chiếu các đặc điểm chi tiết.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {allProducts.slice(0, 4).map((p) => (
              <Button key={p.id} variant="outline" size="sm" onClick={() => handleAddProduct(p)}>
                + Thêm {p.name.split(' ').slice(0, 3).join(' ')}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        /* Bảng so sánh responsive dạng trượt ngang trên mobile */
        <div className="bg-brand-paper rounded-brand-xl border border-brand-border/60 shadow-subtle overflow-x-auto">
          <table className="w-full border-collapse min-w-[650px] text-xs">
            <tbody>
              {/* Hàng ảnh & tên */}
              <tr className="border-b border-brand-border/60">
                <td className="p-4 w-44 font-bold text-brand-muted uppercase tracking-wider bg-brand-sand/30 align-top">
                  Sản phẩm
                </td>
                {comparedList.map((product) => (
                  <td key={product.id} className="p-4 align-top w-64 space-y-3">
                    <div className="relative aspect-[3/4] rounded-brand overflow-hidden bg-brand-sand border border-brand-border/40">
                      <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemove(product.id)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-brand-paper/90 text-brand-secondary hover:text-rose-600 shadow-xs cursor-pointer"
                        title="Xóa khỏi so sánh"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-brand-forest tracking-wider">
                        {product.brand}
                      </span>
                      <Link
                        to={`/products/${product.slug}`}
                        className="block font-semibold text-brand-charcoal hover:text-brand-forest mt-0.5 line-clamp-2"
                      >
                        {product.name}
                      </Link>
                    </div>

                    <div className="font-bold text-sm text-brand-charcoal">
                      {formatPrice(product.price)}
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full text-xs"
                      onClick={() => handleQuickAddToCart(product)}
                    >
                      <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                      Thêm vào giỏ
                    </Button>
                  </td>
                ))}

                {/* Ô trống để thêm sản phẩm nếu còn chỗ */}
                {comparedList.length < 4 && (
                  <td className="p-4 align-middle text-center border-l border-brand-border/30 w-48 bg-brand-ivory/30">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-full bg-brand-sand mx-auto flex items-center justify-center text-brand-muted">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] text-brand-muted block">Thêm sản phẩm</span>
                      <select
                        onChange={(e) => {
                          const target = allProducts.find((p) => p.id === e.target.value);
                          if (target) handleAddProduct(target);
                        }}
                        className="text-xs bg-brand-paper border border-brand-border rounded-brand p-1.5 w-full text-brand-charcoal"
                      >
                        <option value="">Chọn từ catalog...</option>
                        {availableToAdd.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                )}
              </tr>

              {/* Hàng Chất liệu */}
              <tr className="border-b border-brand-border/40 hover:bg-brand-sand/20">
                <td className="p-4 font-bold text-brand-muted uppercase bg-brand-sand/30">
                  Chất liệu
                </td>
                {comparedList.map((p) => (
                  <td key={p.id} className="p-4 font-medium text-brand-charcoal">
                    {p.material}
                  </td>
                ))}
                {comparedList.length < 4 && <td />}
              </tr>

              {/* Hàng Phom dáng (Fit) */}
              <tr className="border-b border-brand-border/40 hover:bg-brand-sand/20">
                <td className="p-4 font-bold text-brand-muted uppercase bg-brand-sand/30">
                  Phom dáng (Fit)
                </td>
                {comparedList.map((p) => (
                  <td key={p.id} className="p-4 font-medium text-brand-charcoal">
                    {p.fit}
                  </td>
                ))}
                {comparedList.length < 4 && <td />}
              </tr>

              {/* Hàng Phong cách */}
              <tr className="border-b border-brand-border/40 hover:bg-brand-sand/20">
                <td className="p-4 font-bold text-brand-muted uppercase bg-brand-sand/30">
                  Phong cách
                </td>
                {comparedList.map((p) => (
                  <td key={p.id} className="p-4 text-brand-secondary">
                    {p.style}
                  </td>
                ))}
                {comparedList.length < 4 && <td />}
              </tr>

              {/* Hàng Bảng màu */}
              <tr className="border-b border-brand-border/40 hover:bg-brand-sand/20">
                <td className="p-4 font-bold text-brand-muted uppercase bg-brand-sand/30">
                  Màu sẵn có
                </td>
                {comparedList.map((p) => (
                  <td key={p.id} className="p-4 space-y-1">
                    <div className="flex flex-wrap gap-1">
                      {p.colors.map((c) => (
                        <span
                          key={c.slug}
                          className="w-4 h-4 rounded-full border border-black/15 shadow-2xs inline-block"
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-brand-muted block">
                      {p.colors.map((c) => c.name).join(', ')}
                    </span>
                  </td>
                ))}
                {comparedList.length < 4 && <td />}
              </tr>

              {/* Hàng Kích cỡ */}
              <tr className="border-b border-brand-border/40 hover:bg-brand-sand/20">
                <td className="p-4 font-bold text-brand-muted uppercase bg-brand-sand/30">
                  Kích cỡ
                </td>
                {comparedList.map((p) => (
                  <td key={p.id} className="p-4 font-medium text-brand-charcoal">
                    {p.sizes.join('  •  ')}
                  </td>
                ))}
                {comparedList.length < 4 && <td />}
              </tr>

              {/* Hàng Dịp phù hợp */}
              <tr className="border-b border-brand-border/40 hover:bg-brand-sand/20">
                <td className="p-4 font-bold text-brand-muted uppercase bg-brand-sand/30">
                  Dịp phù hợp
                </td>
                {comparedList.map((p) => (
                  <td key={p.id} className="p-4 text-brand-secondary">
                    {p.occasion.join(', ')}
                  </td>
                ))}
                {comparedList.length < 4 && <td />}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
