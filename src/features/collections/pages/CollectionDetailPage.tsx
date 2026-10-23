import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { productService } from '@/services/productService';
import { ProductCard } from '@/components/common/ProductCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Flame } from 'lucide-react';
import { GENZ_COLLECTIONS } from '@/mocks/genzCategories';

export const CollectionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const collection = slug
    ? GENZ_COLLECTIONS.find((c) => c.slug === slug) || MockRepo.getCollectionBySlug(slug)
    : undefined;

  if (!collection) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold text-brand-primary uppercase">
          Không tìm thấy bộ sưu tập này
        </h2>
        <Link to="/collections">
          <Button variant="accent" size="sm" className="font-bold">
            Xem tất cả bộ sưu tập
          </Button>
        </Link>
      </div>
    );
  }

  // Lấy các sản phẩm phù hợp với bộ sưu tập
  const allProducts = productService.getAll();
  const collectionProducts = allProducts.slice(0, 12);

  return (
    <div className="bg-brand-bg min-h-screen space-y-12 pb-16">
      {/* Banner Campaign lớn */}
      <div className="relative aspect-[16/7] min-h-[360px] w-full overflow-hidden bg-brand-primary">
        <img
          src={collection.bannerImage}
          alt={collection.title}
          className="w-full h-full object-cover object-center opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-10 text-white space-y-3">
          <Link
            to="/collections"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại danh sách bộ sưu tập</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold uppercase text-brand-accent-light w-fit border border-white/10">
            <Flame className="w-3.5 h-3.5 text-brand-accent" />
            <span>CHIẾN DỊCH {collection.season}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            {collection.title}
          </h1>

          <p className="text-xs sm:text-sm text-brand-subtle max-w-2xl leading-relaxed">
            {collection.description}
          </p>
        </div>
      </div>

      {/* Grid sản phẩm thuộc BST */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between border-b border-brand-border pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-secondary">
              LOOKBOOK PIECES
            </span>
            <h2 className="text-2xl font-black text-brand-primary uppercase mt-1">
              Thiết kế trong bộ sưu tập ({collectionProducts.length})
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {collectionProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};
