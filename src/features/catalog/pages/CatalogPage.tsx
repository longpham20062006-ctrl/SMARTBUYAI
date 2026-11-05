import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productService, ProductFilterOptions } from '@/services/productService';
import { ProductCard } from '@/components/common/ProductCard';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { Product, SizeCode } from '@/types';
import { getActiveGroupedCategories, CATEGORY_DEFINITIONS } from '@/constants/categories';
import { formatPrice } from '@/lib/utils';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  ShoppingBag,
  ArrowDownCircle,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';

const AVAILABLE_SIZES: SizeCode[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'FreeSize'];

const PRICE_PRESETS = [
  { label: 'Tất cả mức giá', min: undefined, max: undefined },
  { label: 'Dưới 300.000₫', min: undefined, max: 300000 },
  { label: '300.000₫ – 500.000₫', min: 300000, max: 500000 },
  { label: '500.000₫ – 800.000₫', min: 500000, max: 800000 },
  { label: 'Trên 800.000₫', min: 800000, max: undefined },
];

const ITEMS_PER_PAGE = 16;
const MAX_CONSECUTIVE_AUTOLOADS = 3;

export const CatalogPage: React.FC = () => {
  useRepoSubscription(['products']);
  const [searchParams, setSearchParams] = useSearchParams();

  // Scroll restoration & saved count state
  const [visibleCount, setVisibleCount] = useState<number>(() => {
    const saved = sessionStorage.getItem('catalog_visible_count');
    return saved ? Number(saved) : ITEMS_PER_PAGE;
  });

  // Read URL params
  const genderParam = searchParams.get('gender') || 'all';
  const categoryParam = searchParams.get('category') || 'all';
  const brandParam = searchParams.get('brand') || 'all';
  const sortParam = (searchParams.get('sort') as any) || 'newest';
  const searchParam = searchParams.get('q') || '';
  const inStockParam = searchParams.get('inStock') === 'true';
  const minPriceParam = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPriceParam = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const selectedSizes = searchParams.getAll('size');
  const selectedColors = searchParams.getAll('color');

  // Mobile drawer state & Desktop sidebar toggle
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  // Left Filter Accordion Open/Closed States
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true,
    group: true,
    size: true,
    color: true,
    price: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Hybrid infinite scroll & sentinel states
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [autoLoadCount, setAutoLoadCount] = useState(0);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const isInitialMount = useRef(true);

  // Scroll restoration
  useEffect(() => {
    const savedScrollPos = sessionStorage.getItem('catalog_scroll_pos');
    if (savedScrollPos) {
      const scrollY = Number(savedScrollPos);
      const timer = setTimeout(() => {
        window.scrollTo({
          top: scrollY,
          behavior: 'instant',
        });
        sessionStorage.removeItem('catalog_scroll_pos');
        sessionStorage.removeItem('catalog_visible_count');
      }, 50);
      return () => clearTimeout(timer);
    }
  }, []);

  // Reset scroll count when core filter params change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setAutoLoadCount(0);
  }, [categoryParam, genderParam, minPriceParam, maxPriceParam, selectedSizes, selectedColors]);

  // Param update helpers
  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
    setVisibleCount(ITEMS_PER_PAGE);
    setAutoLoadCount(0);
  };

  const toggleArrayParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    const existing = next.getAll(key);
    next.delete(key);
    if (existing.includes(value)) {
      existing.filter((item) => item !== value).forEach((v) => next.append(key, v));
    } else {
      [...existing, value].forEach((v) => next.append(key, v));
    }
    setSearchParams(next);
    setVisibleCount(ITEMS_PER_PAGE);
    setAutoLoadCount(0);
  };

  const clearAllFilters = () => {
    const next = new URLSearchParams();
    setSearchParams(next);
    setVisibleCount(ITEMS_PER_PAGE);
    setAutoLoadCount(0);
  };

  // Filter options for service
  const filterOptions: ProductFilterOptions = useMemo(
    () => ({
      gender: genderParam,
      categorySlug: categoryParam,
      brand: brandParam,
      sort: sortParam,
      searchQuery: searchParam.trim(),
      inStockOnly: inStockParam,
      minPrice: minPriceParam,
      maxPrice: maxPriceParam,
      colors: selectedColors.length > 0 ? selectedColors : undefined,
      sizes: selectedSizes.length > 0 ? selectedSizes : undefined,
    }),
    [
      genderParam,
      categoryParam,
      brandParam,
      sortParam,
      searchParam,
      inStockParam,
      minPriceParam,
      maxPriceParam,
      selectedColors,
      selectedSizes,
    ]
  );

  const allFilteredProducts = useMemo(() => productService.getAll(filterOptions), [filterOptions]);
  const allCatalogProducts = useMemo(() => productService.getAll(), []);

  // Category counts and groupings
  const groupedCategories = useMemo(
    () => getActiveGroupedCategories(allCatalogProducts, { gender: genderParam }),
    [allCatalogProducts, genderParam]
  );

  const totalScopedProductsCount = useMemo(() => {
    return allCatalogProducts.filter((p) => {
      if (genderParam !== 'all') {
        if (genderParam === 'unisex' && p.gender !== 'unisex') return false;
        if (genderParam !== 'unisex' && p.gender !== genderParam && p.gender !== 'unisex') return false;
      }
      return true;
    }).length;
  }, [allCatalogProducts, genderParam]);

  // Verified real colors from catalog products
  const availableColors = useMemo(() => {
    const map = new Map<string, { slug: string; name: string; hex: string; count: number }>();
    allCatalogProducts.forEach((p) => {
      if (genderParam !== 'all' && p.gender !== genderParam && p.gender !== 'unisex') return;
      p.colors.forEach((c) => {
        if (!map.has(c.slug)) {
          map.set(c.slug, { slug: c.slug, name: c.name, hex: c.hex, count: 0 });
        }
        map.get(c.slug)!.count++;
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [allCatalogProducts, genderParam]);

  // Paginated displayed products
  const displayedProducts = useMemo(() => {
    return allFilteredProducts.slice(0, visibleCount);
  }, [allFilteredProducts, visibleCount]);

  const hasMore = visibleCount < allFilteredProducts.length;

  // Hybrid infinite scroll & sentinel observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || autoLoadCount >= MAX_CONSECUTIVE_AUTOLOADS || isAutoLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isAutoLoading) {
          setIsAutoLoading(true);
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, allFilteredProducts.length));
            setAutoLoadCount((c) => c + 1);
            setIsAutoLoading(false);
          }, 250);
        }
      },
      {
        rootMargin: '250px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, autoLoadCount, isAutoLoading, allFilteredProducts.length]);

  const handleManualLoadMore = () => {
    setIsAutoLoading(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, allFilteredProducts.length));
      setAutoLoadCount(0);
      setIsAutoLoading(false);
    }, 200);
  };

  // Active filter count
  const activeFilterCount =
    (genderParam !== 'all' ? 1 : 0) +
    (categoryParam !== 'all' ? 1 : 0) +
    (brandParam !== 'all' ? 1 : 0) +
    (searchParam ? 1 : 0) +
    (minPriceParam || maxPriceParam ? 1 : 0) +
    selectedColors.length +
    selectedSizes.length;

  const handleOpenQuickView = (product: Product) => {
    window.dispatchEvent(new CustomEvent('open_quick_view', { detail: product }));
  };

  const handleToggleCompare = (product: Product) => {
    window.dispatchEvent(new CustomEvent('toggle_compare', { detail: product }));
  };

  // Section header helper for accordion
  const renderSectionHeader = (title: string, sectionKey: string, activeCount: number = 0) => (
    <button
      type="button"
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between py-2 text-xs font-bold uppercase tracking-wider text-[#18181B] hover:text-[#78716C] transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-1.5">
        <span>{title}</span>
        {activeCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-[#18181B] text-white text-[9px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </div>
      <ChevronDown
        className={`w-3.5 h-3.5 text-[#78716C] transition-transform duration-200 ${
          openSections[sectionKey] ? 'rotate-180' : ''
        }`}
      />
    </button>
  );

  // Accordion Filter Content
  const renderFilterContent = () => (
    <div className="space-y-4 text-xs divide-y divide-[#ECEAE7]">
      {/* 1. Loại sản phẩm / Phân nhóm */}
      <div className="pt-1">
        {renderSectionHeader('Nhóm trang phục', 'group', categoryParam === 'ao' || categoryParam === 'quan' || categoryParam === 'ao-khoac' || categoryParam === 'phu-kien' ? 1 : 0)}
        {openSections.group && (
          <div className="grid grid-cols-2 gap-1.5 pt-1.5 animate-fade-in">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'ao', label: 'Áo' },
              { id: 'quan', label: 'Quần' },
              { id: 'ao-khoac', label: 'Áo khoác' },
              { id: 'phu-kien', label: 'Phụ kiện' },
            ].map((item) => {
              const isSelected = categoryParam === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateParam('category', item.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium tracking-tight transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#18181B] text-white'
                      : 'bg-white border border-[#ECEAE7] text-[#292524] hover:bg-[#F0EFED]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Danh mục chi tiết */}
      <div className="pt-3">
        {renderSectionHeader('Danh mục chi tiết', 'category', categoryParam !== 'all' ? 1 : 0)}
        {openSections.category && (
          <div className="space-y-2.5 pt-1.5 max-h-72 overflow-y-auto scrollbar-thin pr-1 animate-fade-in">
            <button
              type="button"
              onClick={() => updateParam('category', 'all')}
              className={`w-full text-left py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                categoryParam === 'all'
                  ? 'font-bold text-[#18181B] bg-[#F0EFED]'
                  : 'text-[#78716C] hover:text-[#18181B] hover:bg-[#F0EFED]'
              }`}
            >
              <span className="font-medium">Tất cả sản phẩm</span>
              <span className="text-[11px] text-[#78716C]">({totalScopedProductsCount})</span>
            </button>

            {groupedCategories.map((group) => (
              <div key={group.groupKey} className="space-y-1">
                <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#18181B] bg-[#F0EFED] rounded-md">
                  <span>{group.groupName}</span>
                  <span className="text-[10px] text-[#78716C] font-semibold">({group.totalCount})</span>
                </div>

                <div className="space-y-0.5 pl-1.5">
                  {group.categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => updateParam('category', cat.slug)}
                      className={`w-full text-left py-1 px-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                        categoryParam === cat.slug
                          ? 'font-bold text-[#18181B] bg-[#F0EFED]'
                          : 'text-[#78716C] hover:text-[#18181B] hover:bg-[#F0EFED]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="text-[10px] text-[#A8A29E]">•</span>
                        <span>{cat.name}</span>
                      </span>
                      <span className="text-[11px] text-[#78716C]">({cat.itemCount})</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Kích thước (Size) */}
      <div className="pt-3">
        {renderSectionHeader('Kích thước (Size)', 'size', selectedSizes.length)}
        {openSections.size && (
          <div className="grid grid-cols-4 gap-1.5 pt-1.5 animate-fade-in">
            {AVAILABLE_SIZES.map((sz) => {
              const isSelected = selectedSizes.includes(sz);
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => toggleArrayParam('size', sz)}
                  className={`py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#18181B] text-white shadow-xs'
                      : 'bg-white border border-[#ECEAE7] text-[#292524] hover:bg-[#F0EFED]'
                  }`}
                >
                  {sz}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Màu sắc thực tế */}
      {availableColors.length > 0 && (
        <div className="pt-3">
          {renderSectionHeader('Màu sắc', 'color', selectedColors.length)}
          {openSections.color && (
            <div className="flex flex-wrap gap-1.5 pt-2 animate-fade-in max-h-48 overflow-y-auto scrollbar-thin pr-1">
              {availableColors.map((c) => {
                const isSelected = selectedColors.includes(c.slug);
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => toggleArrayParam('color', c.slug)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#18181B] bg-[#18181B] text-white font-bold'
                        : 'border-[#ECEAE7] bg-white text-[#292524] hover:bg-[#F0EFED]'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-[#78716C]'}`}>
                      ({c.count})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Khoảng giá */}
      <div className="pt-3">
        {renderSectionHeader('Khoảng giá', 'price', minPriceParam || maxPriceParam ? 1 : 0)}
        {openSections.price && (
          <div className="space-y-1.5 pt-1.5 animate-fade-in">
            {PRICE_PRESETS.map((preset, idx) => {
              const isSelected = minPriceParam === preset.min && maxPriceParam === preset.max;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    if (preset.min !== undefined) next.set('minPrice', String(preset.min));
                    else next.delete('minPrice');
                    if (preset.max !== undefined) next.set('maxPrice', String(preset.max));
                    else next.delete('maxPrice');
                    setSearchParams(next);
                    setVisibleCount(ITEMS_PER_PAGE);
                    setAutoLoadCount(0);
                  }}
                  className={`w-full text-left py-1.5 px-2 rounded-md transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'font-bold text-[#18181B] bg-[#F0EFED]'
                      : 'text-[#78716C] hover:text-[#18181B] hover:bg-[#F0EFED]'
                  }`}
                >
                  <span>{preset.label}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#18181B]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-[#F7F7F6] min-h-screen text-[#18181B]">
      {/* 1. CATALOG INTRODUCTION (KOREAN MINIMAL DESIGN V4.2) */}
      <section className="border-b border-[#ECEAE7] bg-white py-6 sm:py-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#78716C] mb-2">
            <Link to="/" className="hover:text-[#18181B] transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <span className="text-[#18181B] font-medium">Khám phá</span>
            {genderParam !== 'all' && (
              <>
                <span>/</span>
                <span className="text-[#18181B] font-medium">
                  {genderParam === 'nam' ? 'Nam' : genderParam === 'nu' ? 'Nữ' : 'Phụ kiện'}
                </span>
              </>
            )}
            {categoryParam !== 'all' && (
              <>
                <span>/</span>
                <span className="text-[#18181B] font-medium">
                  {CATEGORY_DEFINITIONS[categoryParam]?.name || categoryParam}
                </span>
              </>
            )}
          </nav>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#18181B]">
            {genderParam === 'nam'
              ? 'Thời trang Nam'
              : genderParam === 'nu'
              ? 'Thời trang Nữ'
              : categoryParam === 'phu-kien'
              ? 'Phụ kiện thời trang'
              : 'Khám phá thời trang'}
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-[#78716C] mt-1.5 max-w-2xl font-normal">
            Những thiết kế dành cho phong cách riêng của bạn.
          </p>

          {/* 2. CATEGORY NAVIGATION TABS (Segmented Pill Buttons) */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'nam', label: 'Nam' },
              { id: 'nu', label: 'Nữ' },
              { id: 'phu-kien', label: 'Phụ kiện' },
            ].map((tab) => {
              const isActive =
                tab.id === 'all'
                  ? genderParam === 'all' && categoryParam !== 'phu-kien'
                  : tab.id === 'nam'
                  ? genderParam === 'nam'
                  : tab.id === 'nu'
                  ? genderParam === 'nu'
                  : categoryParam === 'phu-kien';

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    if (tab.id === 'all') {
                      next.delete('gender');
                      if (categoryParam === 'phu-kien') next.delete('category');
                    } else if (tab.id === 'phu-kien') {
                      next.set('category', 'phu-kien');
                      next.delete('gender');
                    } else {
                      next.set('gender', tab.id);
                      if (categoryParam === 'phu-kien') next.delete('category');
                    }
                    setSearchParams(next);
                    setVisibleCount(ITEMS_PER_PAGE);
                    setAutoLoadCount(0);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#18181B] text-white shadow-xs'
                      : 'bg-white border border-[#ECEAE7] text-[#292524] hover:bg-[#F0EFED]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. MAIN CATALOG AREA */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Unified Product Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#ECEAE7] mb-6 gap-3">
          {/* Left: Product count + active filter chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[#78716C]">
              <strong className="text-[#18181B] font-semibold">{allFilteredProducts.length}</strong> sản phẩm phù hợp
            </span>

            {/* Active Chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 ml-2">
                {searchParam && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-[#18181B] font-medium text-[11px] border border-[#ECEAE7]">
                    "{searchParam}"
                    <button
                      onClick={() => updateParam('q', null)}
                      className="hover:text-[#B91C1C] ml-0.5 cursor-pointer"
                      aria-label="Xóa từ khóa"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {genderParam !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#18181B] text-white font-medium text-[11px]">
                    {genderParam === 'nam' ? 'Nam' : genderParam === 'nu' ? 'Nữ' : 'Unisex'}
                    <button
                      onClick={() => updateParam('gender', null)}
                      className="hover:text-white/70 ml-0.5 cursor-pointer"
                      aria-label="Xóa lọc giới tính"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {categoryParam !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-[#18181B] font-medium text-[11px] border border-[#ECEAE7]">
                    {CATEGORY_DEFINITIONS[categoryParam]?.name || categoryParam}
                    <button
                      onClick={() => updateParam('category', null)}
                      className="hover:text-[#B91C1C] ml-0.5 cursor-pointer"
                      aria-label="Xóa lọc danh mục"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedColors.map((colSlug) => {
                  const colName = availableColors.find((c) => c.slug === colSlug)?.name || colSlug;
                  return (
                    <span
                      key={colSlug}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-[#18181B] font-medium text-[11px] border border-[#ECEAE7]"
                    >
                      Màu: {colName}
                      <button
                        onClick={() => toggleArrayParam('color', colSlug)}
                        className="hover:text-[#B91C1C] ml-0.5 cursor-pointer"
                        aria-label="Xóa lọc màu"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}

                {selectedSizes.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white text-[#18181B] font-medium text-[11px] border border-[#ECEAE7]"
                  >
                    Size {s}
                    <button
                      onClick={() => toggleArrayParam('size', s)}
                      className="hover:text-[#B91C1C] ml-0.5 cursor-pointer"
                      aria-label={`Xóa lọc size ${s}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {(minPriceParam || maxPriceParam) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-[#18181B] font-medium text-[11px] border border-[#ECEAE7]">
                    Giá: {minPriceParam ? formatPrice(minPriceParam) : '0₫'} – {maxPriceParam ? formatPrice(maxPriceParam) : 'Max'}
                    <button
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.delete('minPrice');
                        next.delete('maxPrice');
                        setSearchParams(next);
                      }}
                      className="hover:text-[#B91C1C] ml-0.5 cursor-pointer"
                      aria-label="Xóa lọc giá"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  onClick={clearAllFilters}
                  className="text-xs text-[#18181B] underline hover:text-[#78716C] ml-1.5 cursor-pointer font-medium"
                >
                  Xóa tất cả
                </button>
              </div>
            )}
          </div>

          {/* Right: Filter toggle & Sort dropdown */}
          <div className="flex items-center gap-2.5 ml-auto">
            {/* Filter button */}
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsMobileFilterOpen(true);
                } else {
                  setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#ECEAE7] bg-white hover:bg-[#F0EFED] text-xs font-semibold text-[#18181B] transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isDesktopSidebarOpen ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#18181B] text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sắp xếp */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#78716C] hidden sm:inline">Sắp xếp:</span>
              <select
                value={sortParam}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="text-xs font-medium bg-white border border-[#ECEAE7] rounded-lg px-3 py-1.5 text-[#18181B] focus:outline-none focus:border-[#18181B] cursor-pointer"
              >
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá: Thấp đến cao</option>
                <option value="price-desc">Giá: Cao đến thấp</option>
              </select>
            </div>
          </div>
        </div>

        {/* Layout: Sidebar + Product Grid (NO right AI panel) */}
        <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start">
          {/* CỘT TRÁI — BỘ LỌC SIDEBAR (240px, collapsible on desktop) */}
          {isDesktopSidebarOpen && (
            <aside className="hidden lg:block w-[240px] xl:w-[250px] shrink-0 bg-white rounded-xl p-5 border border-[#ECEAE7] sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#ECEAE7]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#18181B] flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#18181B]" />
                  <span>BỘ LỌC</span>
                </h2>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-[11px] text-[#78716C] hover:text-[#18181B] underline cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
              {renderFilterContent()}
            </aside>
          )}

          {/* MAIN PRODUCT GRID */}
          <main className="flex-1 min-w-0">
            {allFilteredProducts.length === 0 ? (
              /* Empty State */
              <div className="text-center py-16 px-4 bg-white rounded-xl border border-[#ECEAE7] space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#F0EFED] mx-auto flex items-center justify-center text-[#78716C]">
                  <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18181B]">
                    Không tìm thấy sản phẩm phù hợp
                  </h3>
                  <p className="text-xs text-[#78716C] mt-1 max-w-md mx-auto">
                    Không có sản phẩm nào khớp với bộ lọc hiện tại. Thử chọn danh mục khác hoặc xóa bộ lọc để xem toàn bộ sản phẩm.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs font-semibold rounded-lg border-[#18181B] text-[#18181B] hover:bg-[#F0EFED]"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  XÓA BỘ LỌC VÀ XEM TẤT CẢ
                </Button>
              </div>
            ) : (
              <>
                {/* Responsive Product Grid: 4 columns on large desktop, 3 on md/lg, 2 on mobile */}
                <div
                  className={`grid gap-3 sm:gap-4 lg:gap-5 transition-all duration-300 ${
                    isDesktopSidebarOpen
                      ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
                  }`}
                >
                  {displayedProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        sessionStorage.setItem('catalog_scroll_pos', String(window.scrollY));
                        sessionStorage.setItem('catalog_visible_count', String(visibleCount));
                      }}
                    >
                      <ProductCard
                        product={product}
                        onQuickView={handleOpenQuickView}
                        onToggleCompare={handleToggleCompare}
                      />
                    </div>
                  ))}
                </div>

                {/* Skeleton Loader during auto-fetch */}
                {isAutoLoading && (
                  <div
                    className={`grid gap-3 sm:gap-4 lg:gap-5 mt-4 ${
                      isDesktopSidebarOpen
                        ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                        : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
                    }`}
                  >
                    {[1, 2, 3, 4].map((s) => (
                      <div
                        key={s}
                        className="rounded-xl border border-[#ECEAE7] bg-white p-3 space-y-3 animate-pulse"
                      >
                        <div className="aspect-[3/4] bg-[#F0EFED] rounded-lg" />
                        <div className="h-3 bg-[#ECEAE7] rounded w-3/4" />
                        <div className="h-3 bg-[#ECEAE7] rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Sentinel for IntersectionObserver */}
                <div ref={sentinelRef} className="h-4 w-full" />

                {/* Sorting & Loading Footer (Section 12) */}
                <div className="mt-8 pt-6 border-t border-[#ECEAE7] flex flex-col items-center gap-4">
                  <div className="w-full max-w-sm space-y-2 text-center">
                    <div className="flex justify-between text-xs text-[#78716C]">
                      <span>
                        Đã hiển thị {displayedProducts.length} trên {allFilteredProducts.length} sản phẩm
                      </span>
                      <span className="font-semibold text-[#18181B]">
                        {Math.round((displayedProducts.length / allFilteredProducts.length) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-1 bg-[#ECEAE7] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#18181B] transition-all duration-300"
                        style={{
                          width: `${(displayedProducts.length / allFilteredProducts.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {hasMore ? (
                    <div className="flex flex-col items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleManualLoadMore}
                        disabled={isAutoLoading}
                        className="px-6 py-2.5 text-xs font-semibold tracking-wider uppercase bg-white border border-[#ECEAE7] hover:border-[#18181B] hover:bg-[#F0EFED] text-[#18181B] rounded-lg cursor-pointer"
                      >
                        {isAutoLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                            ĐANG TẢI THÊM SẢN PHẨM...
                          </>
                        ) : (
                          <>
                            <ArrowDownCircle className="w-3.5 h-3.5 mr-2" />
                            TẢI THÊM (+{Math.min(ITEMS_PER_PAGE, allFilteredProducts.length - displayedProducts.length)})
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-[#78716C] tracking-wide font-medium">
                      Đã hiển thị tất cả {allFilteredProducts.length} sản phẩm
                    </p>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <Drawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        position="left"
        title="BỘ LỌC SẢN PHẨM"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearAllFilters();
                setIsMobileFilterOpen(false);
              }}
              className="rounded-lg text-xs font-semibold border-[#ECEAE7]"
            >
              XÓA LỌC
            </Button>
            <Button
              size="sm"
              onClick={() => setIsMobileFilterOpen(false)}
              className="rounded-lg text-xs font-semibold bg-[#18181B] hover:bg-[#27272A] text-white"
            >
              ÁP DỤNG ({allFilteredProducts.length})
            </Button>
          </div>
        }
      >
        {renderFilterContent()}
      </Drawer>
    </div>
  );
};
