import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { productService, ProductFilterOptions } from '@/services/productService';
import { stylistService } from '@/services/stylistService';
import { ProductCard } from '@/components/common/ProductCard';
import { CoupleSetCard } from '@/components/common/CoupleSetCard';
import { COUPLE_SETS } from '@/mocks/coupleSets';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { Product, SizeCode, AIStylistMessage } from '@/types';
import { GENZ_CATEGORIES, GENZ_BRANDS } from '@/mocks/genzCategories';
import { getActiveCategories, getActiveGroupedCategories, CATEGORY_DEFINITIONS } from '@/constants/categories';
import { getDiscoveryOrderedProducts } from '@/utils/productDiscoveryOrder';
import { formatPrice } from '@/lib/utils';
import {
  SlidersHorizontal,
  Heart,
  X,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  ArrowDownCircle,
  Flame,
  Send,
  Bot,
  RefreshCw,
  Loader2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Minimize2,
  Maximize2,
  ExternalLink,
} from 'lucide-react';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';

const AVAILABLE_SIZES: SizeCode[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'FreeSize'];
const FIT_OPTIONS = ['Oversized', 'Boxy Fit', 'Baggy', 'Relaxed Fit', 'Baby Tee / Crop', 'Ống rộng (Wide Leg)'];
const STYLE_OPTIONS = ['Streetwear', 'Korean Casual', 'Y2K', 'Minimalist', 'Vintage', 'Cyber / Gorpcore'];

interface QuickFilter {
  category?: string;
  season?: string;
  gender?: string;
  style?: string;
  maxPrice?: string;
}

interface QuickFilterPill {
  id: string;
  label: string;
  filter: QuickFilter;
}

const ITEMS_PER_PAGE = 15;
const MAX_CONSECUTIVE_AUTOLOADS = 3;

export const CatalogPage: React.FC = () => {
  useRepoSubscription(['products']);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Scroll restoration & saved count state
  const [visibleCount, setVisibleCount] = useState<number>(() => {
    const saved = sessionStorage.getItem('catalog_visible_count');
    return saved ? Number(saved) : ITEMS_PER_PAGE;
  });

  // Read URL params
  const genderParam = searchParams.get('gender') || 'all';
  const categoryParam = searchParams.get('category') || 'all';
  const seasonParam = searchParams.get('season') || 'all';
  const brandParam = searchParams.get('brand') || 'all';
  const sortParam = (searchParams.get('sort') as any) || 'newest';
  const searchParam = searchParams.get('q') || '';
  const inStockParam = searchParams.get('inStock') === 'true';
  const minPriceParam = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPriceParam = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const selectedSizes = searchParams.getAll('size');
  const selectedColors = searchParams.getAll('color');
  const selectedStyles = searchParams.getAll('style');
  const selectedFits = searchParams.getAll('fit');

  // Mobile filter drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Left Filter Accordion Open/Closed States
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true,
    price: true,
    color: true,
    size: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Quick filter horizontal scroll state & refs
  const quickFilterScrollRef = useRef<HTMLDivElement>(null);
  const quickFilterContainerRef = useRef<HTMLDivElement>(null);
  const catalogTopAnchorRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Auto Scroll thông minh: cuộn mượt về đầu danh sách sản phẩm khi người dùng chọn danh mục/bộ lọc
  const performAutoScrollToTop = useCallback(() => {
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior = prefersReduced ? 'instant' : 'smooth';

    requestAnimationFrame(() => {
      if (catalogTopAnchorRef.current) {
        // Đo chính xác chiều cao header đang dính + chiều cao thanh quick filter
        const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--site-header-height')) || 110;
        const quickH = quickFilterContainerRef.current?.getBoundingClientRect().height || 48;
        const totalStickyOffset = headerH + quickH + 10; // Khoảng thở an toàn 10px

        const anchorTop = catalogTopAnchorRef.current.getBoundingClientRect().top + window.scrollY;
        const targetY = Math.max(0, anchorTop - totalStickyOffset);

        // Chỉ cuộn lên nếu vị trí hiện tại đang ở bên dưới mục tiêu
        if (window.scrollY > targetY + 20) {
          window.scrollTo({
            top: targetY,
            behavior,
          });
        }
      }
    });
  }, []);

  const checkScrollability = () => {
    if (!quickFilterScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = quickFilterScrollRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, []);

  const handleScrollPills = (direction: 'left' | 'right') => {
    if (!quickFilterScrollRef.current) return;
    const amount = direction === 'left' ? -260 : 260;
    quickFilterScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(checkScrollability, 300);
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

  // Support ?scrollTo=Y query param for testing and direct navigation
  useEffect(() => {
    const scrollPos = searchParams.get('scrollTo');
    if (scrollPos) {
      const y = parseInt(scrollPos, 10);
      if (!isNaN(y) && y >= 0) {
        const timer = setTimeout(() => window.scrollTo({ top: y, behavior: 'instant' }), 120);
        return () => clearTimeout(timer);
      }
    }
  }, [searchParams]);

  // Reset scroll count when core filter params change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setAutoLoadCount(0);
  }, [categoryParam, seasonParam, genderParam]);

  // Param update helper
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
    performAutoScrollToTop();
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
    performAutoScrollToTop();
  };

  const clearAllFilters = () => {
    const next = new URLSearchParams();
    // If on a dedicated gender URL like /products?gender=nam, keep it or clear completely
    setSearchParams(next);
    setVisibleCount(ITEMS_PER_PAGE);
    setAutoLoadCount(0);
    performAutoScrollToTop();
  };

  // 5.3: Đồng bộ bộ lọc & Giữ nguyên giới tính hiện tại khi bấm quick filter
  const handlePillClick = (pill: QuickFilterPill) => {
    const next = new URLSearchParams(searchParams);

    if (pill.id === 'all') {
      next.delete('category');
      next.delete('season');
      next.delete('style');
      next.delete('maxPrice');
      setSearchParams(next);
      setVisibleCount(ITEMS_PER_PAGE);
      setAutoLoadCount(0);
      performAutoScrollToTop();
      return;
    }

    if (pill.filter.category) {
      if (categoryParam === pill.filter.category) {
        next.delete('category');
      } else {
        next.set('category', pill.filter.category);
      }
    }

    if (pill.filter.season) {
      if (seasonParam === pill.filter.season) {
        next.delete('season');
      } else {
        next.set('season', pill.filter.season);
      }
    }

    if (pill.filter.gender) {
      if (genderParam === pill.filter.gender) {
        next.delete('gender');
      } else {
        next.set('gender', pill.filter.gender);
      }
    }

    if (pill.filter.maxPrice) {
      if (maxPriceParam === Number(pill.filter.maxPrice)) {
        next.delete('maxPrice');
      } else {
        next.set('maxPrice', pill.filter.maxPrice);
      }
    }

    setSearchParams(next);
    setVisibleCount(ITEMS_PER_PAGE);
    setAutoLoadCount(0);
    performAutoScrollToTop();
  };

  // Filter options
  const filterOptions: ProductFilterOptions = useMemo(
    () => ({
      gender: genderParam,
      categorySlug: categoryParam,
      season: seasonParam,
      brand: brandParam,
      sort: sortParam,
      searchQuery: searchParam.trim(),
      inStockOnly: inStockParam,
      minPrice: minPriceParam,
      maxPrice: maxPriceParam,
      colors: selectedColors.length > 0 ? selectedColors : undefined,
      sizes: selectedSizes.length > 0 ? selectedSizes : undefined,
      styles: selectedStyles.length > 0 ? selectedStyles : undefined,
      fits: selectedFits.length > 0 ? selectedFits : undefined,
    }),
    [
      genderParam,
      categoryParam,
      seasonParam,
      brandParam,
      sortParam,
      searchParam,
      inStockParam,
      minPriceParam,
      maxPriceParam,
      selectedColors,
      selectedSizes,
      selectedStyles,
      selectedFits,
    ]
  );

  const allFilteredProducts = useMemo(() => {
    const rawList = productService.getAll(filterOptions);
    const isDefaultDiscoveryMode =
      genderParam === 'all' &&
      categoryParam === 'all' &&
      seasonParam === 'all' &&
      brandParam === 'all' &&
      !searchParam &&
      !minPriceParam &&
      !maxPriceParam &&
      selectedColors.length === 0 &&
      selectedSizes.length === 0 &&
      selectedStyles.length === 0 &&
      selectedFits.length === 0 &&
      (sortParam === 'newest' || !sortParam);

    return getDiscoveryOrderedProducts(rawList, isDefaultDiscoveryMode);
  }, [
    filterOptions,
    genderParam,
    categoryParam,
    seasonParam,
    brandParam,
    searchParam,
    minPriceParam,
    maxPriceParam,
    selectedColors,
    selectedSizes,
    selectedStyles,
    selectedFits,
    sortParam,
  ]);

  // Master Product Catalog & Color System: Đồng bộ danh mục và đếm số lượng thật theo bộ lọc
  const allCatalogProducts = useMemo(() => productService.getAll(), []);

  const activeCategories = useMemo(
    () => getActiveCategories(allCatalogProducts, { gender: genderParam, season: seasonParam }),
    [allCatalogProducts, genderParam, seasonParam]
  );

  const groupedCategories = useMemo(
    () => getActiveGroupedCategories(allCatalogProducts, { gender: genderParam, season: seasonParam }),
    [allCatalogProducts, genderParam, seasonParam]
  );

  const totalScopedProductsCount = useMemo(() => {
    return allCatalogProducts.filter((p) => {
      if (genderParam === 'nam' && p.gender !== 'nam') return false;
      if (genderParam === 'nu' && p.gender !== 'nu') return false;
      if (genderParam === 'unisex' && p.gender !== 'unisex') return false;
      return true;
    }).length;
  }, [allCatalogProducts, genderParam]);

  // Nhóm Cấp 2 đang hoạt động (Tất cả, Áo, Quần, Váy, Áo khoác, Đồ bộ, Đồ đôi)
  const currentActiveGroup = useMemo<'all' | 'ao' | 'ao-khoac' | 'quan' | 'vay' | 'do-bo' | 'do-doi' | 'khac'>(() => {
    if (categoryParam === 'all') return 'all';
    if (categoryParam === 'ao') return 'ao';
    if (categoryParam === 'ao-khoac') return 'ao-khoac';
    if (categoryParam === 'quan') return 'quan';
    if (categoryParam === 'vay' || categoryParam === 'chan-vay' || categoryParam === 'dam') return 'vay';
    if (categoryParam === 'do-bo') return 'do-bo';
    if (categoryParam === 'do-doi') return 'do-doi';
    const meta = CATEGORY_DEFINITIONS[categoryParam];
    if (meta?.parentGroup === 'ao') return 'ao';
    if (meta?.parentGroup === 'ao-khoac') return 'ao-khoac';
    if (meta?.parentGroup === 'quan') return 'quan';
    if (meta?.parentGroup === 'vay' || meta?.parentGroup === 'chan-vay-dam') return 'vay';
    if (meta?.parentGroup === 'do-bo') return 'do-bo';
    return 'all';
  }, [categoryParam]);

  const shirtCount = useMemo(() => {
    return allCatalogProducts.filter((p) => {
      if (genderParam === 'nam' && p.gender !== 'nam') return false;
      if (genderParam === 'nu' && p.gender !== 'nu') return false;
      if (genderParam === 'unisex' && p.gender !== 'unisex') return false;
      const meta = CATEGORY_DEFINITIONS[p.categorySlug];
      return meta?.parentGroup === 'ao';
    }).length;
  }, [allCatalogProducts, genderParam]);

  const jacketCount = useMemo(() => {
    return allCatalogProducts.filter((p) => {
      if (genderParam === 'nam' && p.gender !== 'nam') return false;
      if (genderParam === 'nu' && p.gender !== 'nu') return false;
      if (genderParam === 'unisex' && p.gender !== 'unisex') return false;
      const meta = CATEGORY_DEFINITIONS[p.categorySlug];
      return meta?.parentGroup === 'ao-khoac';
    }).length;
  }, [allCatalogProducts, genderParam]);

  const pantCount = useMemo(() => {
    return allCatalogProducts.filter((p) => {
      if (genderParam === 'nam' && p.gender !== 'nam') return false;
      if (genderParam === 'nu' && p.gender !== 'nu') return false;
      if (genderParam === 'unisex' && p.gender !== 'unisex') return false;
      const meta = CATEGORY_DEFINITIONS[p.categorySlug];
      return meta?.parentGroup === 'quan';
    }).length;
  }, [allCatalogProducts, genderParam]);

  const vayCount = useMemo(() => {
    return allCatalogProducts.filter((p) => {
      if (genderParam === 'nam' && p.gender !== 'nam') return false;
      if (genderParam === 'nu' && p.gender !== 'nu') return false;
      if (genderParam === 'unisex' && p.gender !== 'unisex') return false;
      const meta = CATEGORY_DEFINITIONS[p.categorySlug];
      return meta?.parentGroup === 'vay' || meta?.parentGroup === 'chan-vay-dam';
    }).length;
  }, [allCatalogProducts, genderParam]);

  const doBoCount = useMemo(() => {
    return allCatalogProducts.filter((p) => {
      if (genderParam === 'nam' && p.gender !== 'nam') return false;
      if (genderParam === 'nu' && p.gender !== 'nu') return false;
      if (genderParam === 'unisex' && p.gender !== 'unisex') return false;
      const meta = CATEGORY_DEFINITIONS[p.categorySlug];
      return meta?.parentGroup === 'do-bo' || p.categorySlug === 'do-bo';
    }).length;
  }, [allCatalogProducts, genderParam]);

  const coupleCount = COUPLE_SETS.length;

  // Danh sách màu sắc thực tế được xác minh từ các sản phẩm đang hiển thị
  const availableColors = useMemo(() => {
    const map = new Map<string, { slug: string; name: string; hex: string; count: number }>();
    allCatalogProducts.forEach((p) => {
      if (genderParam === 'nam' && p.gender !== 'nam') return;
      if (genderParam === 'nu' && p.gender !== 'nu') return;
      if (genderParam === 'unisex' && p.gender !== 'unisex') return;
      p.colors.forEach((c) => {
        if (!map.has(c.slug)) {
          map.set(c.slug, { slug: c.slug, name: c.name, hex: c.hex, count: 0 });
        }
        map.get(c.slug)!.count++;
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [allCatalogProducts, genderParam]);

  // Dynamic quick filter pills theo nhóm Cấp 2 đang chọn
  const quickFilterPills: QuickFilterPill[] = useMemo(() => {
    if (currentActiveGroup === 'ao') {
      const shirtCats = activeCategories.filter((c) => CATEGORY_DEFINITIONS[c.slug]?.parentGroup === 'ao');
      return [
        { id: 'ao-all', label: `Tất cả áo (${shirtCount})`, filter: { category: 'ao' } },
        ...shirtCats.map((c) => ({
          id: c.slug,
          label: `${c.name} (${c.itemCount})`,
          filter: { category: c.slug },
        })),
      ];
    }

    if (currentActiveGroup === 'ao-khoac') {
      const jacketCats = activeCategories.filter((c) => CATEGORY_DEFINITIONS[c.slug]?.parentGroup === 'ao-khoac');
      return [
        { id: 'ao-khoac-all', label: `Tất cả áo khoác (${jacketCount})`, filter: { category: 'ao-khoac' } },
        ...jacketCats.map((c) => ({
          id: c.slug,
          label: `${c.name} (${c.itemCount})`,
          filter: { category: c.slug },
        })),
      ];
    }

    if (currentActiveGroup === 'quan') {
      const pantCats = activeCategories.filter((c) => CATEGORY_DEFINITIONS[c.slug]?.parentGroup === 'quan');
      return [
        { id: 'quan-all', label: `Tất cả quần (${pantCount})`, filter: { category: 'quan' } },
        ...pantCats.map((c) => ({
          id: c.slug,
          label: `${c.name} (${c.itemCount})`,
          filter: { category: c.slug },
        })),
      ];
    }

    if (currentActiveGroup === 'vay') {
      const vayCats = activeCategories.filter(
        (c) => CATEGORY_DEFINITIONS[c.slug]?.parentGroup === 'vay' || CATEGORY_DEFINITIONS[c.slug]?.parentGroup === 'chan-vay-dam'
      );
      return [
        { id: 'vay-all', label: `Tất cả váy & chân váy (${vayCount})`, filter: { category: 'vay' } },
        ...vayCats.map((c) => ({
          id: c.slug,
          label: `${c.name} (${c.itemCount})`,
          filter: { category: c.slug },
        })),
      ];
    }

    if (currentActiveGroup === 'do-bo') {
      const doBoCats = activeCategories.filter((c) => CATEGORY_DEFINITIONS[c.slug]?.parentGroup === 'do-bo');
      return [
        { id: 'do-bo-all', label: `Tất cả đồ bộ (${doBoCount})`, filter: { category: 'do-bo' } },
        ...doBoCats.map((c) => ({
          id: c.slug,
          label: `${c.name} (${c.itemCount})`,
          filter: { category: c.slug },
        })),
      ];
    }

    if (currentActiveGroup === 'do-doi') {
      return [
        { id: 'do-doi-all', label: `Tất cả đồ đôi (${coupleCount})`, filter: { category: 'do-doi' } },
      ];
    }

    // Default: pills theo giới tính đang chọn (Bỏ hoàn toàn bộ lọc mùa)
    if (genderParam === 'nu') {
      return [
        { id: 'all', label: `Tất cả đồ Nữ (${totalScopedProductsCount})`, filter: {} },
        { id: 'ao-thun', label: 'Áo thun (13)', filter: { category: 'ao-thun' } },
        { id: 'vay-group', label: `Váy Nữ (${vayCount})`, filter: { category: 'vay' } },
        { id: 'ao-hoodie', label: 'Hoodie (9)', filter: { category: 'ao-hoodie' } },
        { id: 'ao-croptop', label: 'Croptop (7)', filter: { category: 'ao-croptop' } },
        { id: 'ao-hai-day', label: 'Áo hai dây (7)', filter: { category: 'ao-hai-day' } },
        { id: 'ao-len', label: 'Áo len (4)', filter: { category: 'ao-len' } },
        { id: 'ao-cardigan', label: 'Cardigan (6)', filter: { category: 'ao-cardigan' } },
        { id: 'quan-group', label: `Quần Nữ (${pantCount})`, filter: { category: 'quan' } },
      ];
    }

    if (genderParam === 'all') {
      return [
        { id: 'all', label: `Tất cả sản phẩm (${totalScopedProductsCount})`, filter: {} },
        { id: 'ao-thun', label: 'Áo thun', filter: { category: 'ao-thun' } },
        { id: 'ao-hoodie', label: 'Hoodie', filter: { category: 'ao-hoodie' } },
        { id: 'vay-group', label: `Váy & Đầm (${vayCount})`, filter: { category: 'vay' } },
        { id: 'quan-group', label: `Quần (${pantCount})`, filter: { category: 'quan' } },
        { id: 'ao-khoac-group', label: `Áo khoác (${jacketCount})`, filter: { category: 'ao-khoac' } },
        { id: 'ao-polo', label: 'Polo (10)', filter: { category: 'ao-polo' } },
        { id: 'ao-so-mi', label: 'Sơ mi (12)', filter: { category: 'ao-so-mi' } },
        { id: 'do-bo-group', label: `Đồ bộ (${doBoCount})`, filter: { category: 'do-bo' } },
      ];
    }

    return [
      { id: 'all', label: `Tất cả đồ Nam (${totalScopedProductsCount})`, filter: {} },
      { id: 'ao-group', label: `Áo Nam (${shirtCount})`, filter: { category: 'ao' } },
      { id: 'ao-khoac-group', label: `Áo khoác (${jacketCount})`, filter: { category: 'ao-khoac' } },
      { id: 'quan-group', label: `Quần Nam (${pantCount})`, filter: { category: 'quan' } },
      { id: 'do-bo-group', label: `Đồ bộ Nam (${doBoCount})`, filter: { category: 'do-bo' } },
      { id: 'ao-thun', label: 'Áo thun (13)', filter: { category: 'ao-thun' } },
      { id: 'ao-thun-dai-tay', label: 'Áo dài tay (24)', filter: { category: 'ao-thun-dai-tay' } },
      { id: 'ao-polo', label: 'Polo (10)', filter: { category: 'ao-polo' } },
      { id: 'ao-so-mi', label: 'Sơ mi (12)', filter: { category: 'ao-so-mi' } },
      { id: 'ao-hoodie', label: 'Hoodie (10)', filter: { category: 'ao-hoodie' } },
      { id: 'ao-len', label: 'Áo len (17)', filter: { category: 'ao-len' } },
      { id: 'quan-short', label: 'Quần short (16)', filter: { category: 'quan-short' } },
      { id: 'quan-dai', label: 'Quần dài (5)', filter: { category: 'quan-dai' } },
    ];
  }, [currentActiveGroup, activeCategories, shirtCount, jacketCount, pantCount, vayCount, doBoCount, totalScopedProductsCount, genderParam]);

  // Paginated products
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

  // Active filters count
  const activeFilterCount =
    (genderParam !== 'all' ? 1 : 0) +
    (categoryParam !== 'all' ? 1 : 0) +
    (searchParam ? 1 : 0) +
    (inStockParam ? 1 : 0) +
    (minPriceParam ? 1 : 0) +
    (maxPriceParam ? 1 : 0) +
    selectedColors.length +
    selectedSizes.length;

  // 7.1: Tiêu đề danh mục lớn & Rõ ràng
  const categoryHeaderData = useMemo(() => {
    if (genderParam === 'nam') {
      if (categoryParam === 'all') {
        return {
          title: "MEN'S COLLECTION",
          breadcrumb: 'Thời trang Nam',
          categoryName: 'Thời trang Nam',
          description: 'Khám phá phong cách phù hợp với bạn.',
        };
      }
      if (categoryParam === 'ao') {
        return {
          title: 'ÁO NAM',
          breadcrumb: 'Áo',
          categoryName: 'Áo Nam',
          description: `Tuyển chọn ${shirtCount} thiết kế áo thun, áo thun dài tay, polo, sơ mi, hoodie và áo len thời thượng chuẩn phom rộng phóng khoáng.`,
        };
      }
      if (categoryParam === 'ao-khoac') {
        return {
          title: 'ÁO KHOÁC NAM',
          breadcrumb: 'Áo khoác',
          categoryName: 'Áo khoác Nam',
          description: `Tuyển chọn ${jacketCount} thiết kế áo khoác gió dù, bomber dạo phố chuẩn phong cách streetwear.`,
        };
      }
      if (categoryParam === 'quan') {
        return {
          title: 'QUẦN NAM',
          breadcrumb: 'Quần',
          categoryName: 'Quần Nam',
          description: `Tuyển chọn ${pantCount} thiết kế quần short và quần dài năng động, tôn dáng dành cho phái mạnh.`,
        };
      }
      if (categoryParam === 'do-bo') {
        return {
          title: 'ĐỒ BỘ NAM (SET NGUYÊN BỘ)',
          breadcrumb: 'Đồ bộ',
          categoryName: 'Đồ bộ Nam',
          description: `Tuyển chọn ${doBoCount} thiết kế set đồ bộ nam phối sẵn nguyên bộ chuẩn phong cách năng động.`,
        };
      }
      if (categoryParam === 'do-doi') {
        return {
          title: 'ĐỒ ĐÔI GEN Z (COUPLE OUTFITS)',
          breadcrumb: 'Đồ đôi',
          categoryName: 'Đồ đôi Couple',
          description: `Bộ sưu tập ${coupleCount} set đồ đôi dành cho Chàng & Nàng được phối chuẩn gu với tùy chọn màu/size độc lập.`,
        };
      }
      const catName = CATEGORY_DEFINITIONS[categoryParam]?.name || categoryParam;
      const count = allCatalogProducts.filter((p) => p.categorySlug === categoryParam).length;
      return {
        title: `${catName.toUpperCase()} NAM`,
        breadcrumb: catName,
        categoryName: `${catName} Nam`,
        description: `Tuyển chọn ${count} thiết kế ${catName.toLowerCase()} chuẩn phom rộng phóng khoáng, chất liệu cao cấp dành cho phái mạnh.`,
      };
    }

    if (genderParam === 'nu') {
      if (categoryParam === 'all') {
        return {
          title: "WOMEN'S COLLECTION",
          breadcrumb: 'Thời trang Nữ',
          categoryName: 'Thời trang Nữ',
          description: totalScopedProductsCount > 0
            ? 'Bộ sưu tập thời trang Nữ Gen Z chuẩn gu Y2K, tôn dáng và rạng rỡ cho các bạn nữ.'
            : 'Bộ sưu tập Nữ đang được cập nhật',
        };
      }
      if (categoryParam === 'ao') {
        return {
          title: 'ÁO NỮ',
          breadcrumb: 'Áo Nữ',
          categoryName: 'Áo Nữ',
          description: `Tuyển chọn ${shirtCount} thiết kế áo thun, croptop, sơ mi, polo và cardigan nữ thời thượng chuẩn Gen Z.`,
        };
      }
      if (categoryParam === 'quan') {
        return {
          title: 'QUẦN NỮ',
          breadcrumb: 'Quần Nữ',
          categoryName: 'Quần Nữ',
          description: `Tuyển chọn ${pantCount} thiết kế jeans, quần ống rộng, cargo và leggings tôn dáng cho phái đẹp.`,
        };
      }
      if (categoryParam === 'vay') {
        return {
          title: 'VÁY & CHÂN VÁY NỮ',
          breadcrumb: 'Váy & Chân váy Nữ',
          categoryName: 'Váy & Chân váy Nữ',
          description: `Tuyển chọn ${vayCount} thiết kế chân váy ngắn xếp ly, chân váy dài, đầm maxi và đầm dự tiệc rạng rỡ.`,
        };
      }
      if (categoryParam === 'ao-khoac') {
        return {
          title: 'ÁO KHOÁC NỮ',
          breadcrumb: 'Áo khoác Nữ',
          categoryName: 'Áo khoác Nữ',
          description: `Tuyển chọn ${jacketCount} mẫu denim jacket, bomber, blazer và áo khoác chống nắng nữ cao cấp.`,
        };
      }
      if (categoryParam === 'do-bo') {
        return {
          title: 'ĐỒ BỘ NỮ',
          breadcrumb: 'Đồ bộ Nữ',
          categoryName: 'Đồ bộ Nữ',
          description: `Tuyển chọn ${doBoCount} set áo & quần, set áo & chân váy và đồ thể thao nữ tiện lợi, năng động.`,
        };
      }
      const catName = CATEGORY_DEFINITIONS[categoryParam]?.name || categoryParam;
      const count = allCatalogProducts.filter((p) => p.categorySlug === categoryParam && (p.gender === 'nu' || p.gender === 'unisex')).length;
      return {
        title: `${catName.toUpperCase()} NỮ`,
        breadcrumb: `${catName} Nữ`,
        categoryName: `${catName} Nữ`,
        description: `Tuyển chọn ${count} thiết kế ${catName.toLowerCase()} chuẩn phom dáng, chất liệu cao cấp cho phái đẹp.`,
      };
    }

    if (categoryParam !== 'all') {
      const catName = CATEGORY_DEFINITIONS[categoryParam]?.name || categoryParam;
      return {
        title: catName.toUpperCase(),
        breadcrumb: catName,
        categoryName: catName,
        description: `Tuyển tập các mẫu ${catName.toLowerCase()} chuẩn phom rộng phóng khoáng, chất liệu cao cấp và phối màu cực nghệ dành cho giới trẻ Gen Z.`,
      };
    }

    if (seasonParam === 'he') {
      return {
        title: 'BỘ SƯU TẬP MÙA HÈ',
        breadcrumb: 'Mùa Hè',
        categoryName: 'Mùa Hè',
        description: 'Tập hợp các mẫu áo thun cotton 100% thoáng mát, baby tee, quần short, croptop và sơ mi cuban ngắn tay rực rỡ đón hè.',
      };
    }
    if (seasonParam === 'dong') {
      return {
        title: 'BỘ SƯU TẬP MÙA ĐÔNG',
        breadcrumb: 'Mùa Đông',
        categoryName: 'Mùa Đông',
        description: 'Hoodie nỉ bông trùm đầu dày dặn, áo sweater dệt kim, áo phao và varsity jacket ấm áp bất chấp thời tiết.',
      };
    }
    if (seasonParam === 'xuan-thu') {
      return {
        title: 'BỘ SƯU TẬP XUÂN - THU',
        breadcrumb: 'Xuân - Thu',
        categoryName: 'Xuân - Thu',
        description: 'Phối layer thời trang nhẹ nhàng với sơ mi oversize, áo khoác denim, cardigan mỏng và quần jeans baggy suông.',
      };
    }

    if (genderParam === 'unisex') {
      return {
        title: 'UNISEX FIT PHÓNG KHOÁNG',
        breadcrumb: 'Unisex Fit',
        categoryName: 'Unisex Fit',
        description: 'Thiết kế phi giới tính, phom rộng thoải mái (Oversized & Boxy) tự do thể hiện cá tính cho cả nam và nữ.',
      };
    }

    return {
      title: 'TẤT CẢ SẢN PHẨM SMARTBUY',
      breadcrumb: 'Tất cả Drops',
      categoryName: 'Streetwear',
      description: 'Khám phá hơn 130+ mẫu thiết kế Streetwear bốn mùa, Unisex, Y2K và Local Brand độc quyền với mức giá học sinh sinh viên từ 79.000₫ – 449.000₫.',
    };
  }, [categoryParam, seasonParam, genderParam]);

  const handleOpenQuickView = (product: Product, initialImageIndex: number = 0) => {
    window.dispatchEvent(new CustomEvent('open_quick_view', { detail: { product, initialImageIndex } }));
  };

  const handleToggleCompare = (product: Product) => {
    window.dispatchEvent(new CustomEvent('toggle_compare', { detail: product }));
  };

  // Section header helper for accordion
  const renderSectionHeader = (title: string, sectionKey: string, activeCount: number = 0) => (
    <button
      type="button"
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between py-2 text-[11px] font-bold uppercase tracking-wider text-[#18181B] hover:text-[#8B5CF6] transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-1.5">
        <span>{title}</span>
        {activeCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-[#8B5CF6] text-white text-[9px] font-black flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </div>
      <ChevronDown
        className={`w-3.5 h-3.5 text-[#71717A] transition-transform duration-200 ${
          openSections[sectionKey] ? 'rotate-180 text-[#8B5CF6]' : ''
        }`}
      />
    </button>
  );

  // 6: BỘ LỌC BÊN TRÁI TINH GỌN (NAM/NỮ, LOẠI SẢN PHẨM, KHOẢNG GIÁ, KÍCH THƯỚC & MÀU SẮC)
  const renderFilterContent = () => (
    <div className="space-y-4 text-xs font-sans divide-y divide-[#E4E4E7]">
      {/* 1. Nam / Nữ */}
      <div className="pt-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#18181B] mb-2 flex items-center justify-between">
          <span>Giới tính</span>
          {genderParam !== 'all' && (
            <span className="w-4 h-4 rounded-full bg-[#8B5CF6] text-white text-[9px] font-black flex items-center justify-center">
              1
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => updateParam('gender', genderParam === 'nam' ? 'all' : 'nam')}
            className={`py-2 px-3 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer text-center ${
              genderParam === 'nam'
                ? 'bg-[#8B5CF6] text-white shadow-xs'
                : 'bg-white border border-[#E4E4E7] text-[#18181B] hover:border-[#8B5CF6] hover:bg-[#F3E8FF]/30'
            }`}
          >
            NAM
          </button>
          <button
            type="button"
            onClick={() => updateParam('gender', genderParam === 'nu' ? 'all' : 'nu')}
            className={`py-2 px-3 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer text-center ${
              genderParam === 'nu'
                ? 'bg-[#8B5CF6] text-white shadow-xs'
                : 'bg-white border border-[#E4E4E7] text-[#18181B] hover:border-[#8B5CF6] hover:bg-[#F3E8FF]/30'
            }`}
          >
            NỮ
          </button>
        </div>
        {genderParam !== 'all' && (
          <button
            type="button"
            onClick={() => updateParam('gender', 'all')}
            className="w-full text-center text-[11px] text-[#71717A] hover:text-[#8B5CF6] pt-2 transition-colors cursor-pointer"
          >
            Xem tất cả (Nam & Nữ)
          </button>
        )}
      </div>

      {/* 2. Loại sản phẩm */}
      <div className="pt-3">
        {renderSectionHeader('Loại sản phẩm', 'category', categoryParam !== 'all' ? 1 : 0)}
        {openSections.category && (
          <div className="space-y-2.5 pt-1.5 max-h-72 overflow-y-auto scrollbar-thin pr-1 animate-fade-in">
            <button
              type="button"
              onClick={() => updateParam('category', 'all')}
              className={`w-full text-left py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                categoryParam === 'all'
                  ? 'font-bold text-[#7C3AED] bg-[#F3E8FF] border-l-2 border-[#8B5CF6]'
                  : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F2F3F5]'
              }`}
            >
              <span className="font-semibold">Tất cả sản phẩm</span>
              <span className="text-[11px] text-[#71717A]">({totalScopedProductsCount})</span>
            </button>

            {groupedCategories.map((group) => (
              <div key={group.groupKey} className="space-y-1">
                {/* Tiêu đề Cấp 2: Nhóm Lớn (Áo, Quần, Váy...) */}
                <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#18181B] bg-[#F2F3F5] rounded-md">
                  <span>{group.groupName}</span>
                  <span className="text-[10px] text-[#71717A] font-semibold">({group.totalCount})</span>
                </div>

                {/* Danh sách Cấp 3: Loại sản phẩm */}
                <div className="space-y-0.5 pl-1.5">
                  {group.categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => updateParam('category', cat.slug)}
                      className={`w-full text-left py-1 px-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                        categoryParam === cat.slug
                          ? 'font-bold text-[#7C3AED] bg-[#F3E8FF] border-l-2 border-[#8B5CF6]'
                          : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F2F3F5]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="text-[10px] text-[#A1A1AA]">•</span>
                        <span>{cat.name}</span>
                      </span>
                      <span className="text-[11px] text-[#71717A]">({cat.itemCount})</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Khoảng giá */}
      <div className="pt-3">
        {renderSectionHeader('Khoảng giá', 'price', minPriceParam || maxPriceParam ? 1 : 0)}
        {openSections.price && (
          <div className="space-y-1.5 pt-1.5 animate-fade-in">
            {[
              { label: 'Tất cả mức giá', min: undefined, max: undefined },
              { label: 'Dưới 150.000₫ (Hạt dẻ)', min: undefined, max: 150000 },
              { label: '150.000₫ – 300.000₫ (Phổ biến)', min: 150000, max: 300000 },
              { label: '300.000₫ – 500.000₫', min: 300000, max: 500000 },
              { label: 'Trên 500.000₫ (Cao cấp)', min: 500000, max: undefined },
            ].map((preset, idx) => {
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
                  className={`w-full text-left py-1 px-2 rounded-md transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'font-bold text-[#7C3AED] bg-[#F3E8FF]'
                      : 'text-[#71717A] hover:text-[#18181B]'
                  }`}
                >
                  <span>{preset.label}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Kích thước & Màu sắc */}
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
                  className={`py-1.5 rounded text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#18181B] text-white shadow-subtle'
                      : 'bg-white border border-[#E4E4E7] text-[#18181B] hover:border-[#8B5CF6]'
                  }`}
                >
                  {sz}
                </button>
              );
            })}
          </div>
        )}
      </div>

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
                        ? 'border-[#8B5CF6] bg-[#F3E8FF] text-[#7C3AED] font-bold shadow-xs ring-1 ring-[#8B5CF6]'
                        : 'border-[#E4E4E7] bg-white text-[#18181B] hover:border-[#8B5CF6]'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                    <span className="text-[10px] text-[#A1A1AA]">({c.count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Nút xóa bộ lọc */}
      <div className="pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllFilters}
          className="w-full text-xs font-semibold rounded-xl"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Đặt lại bộ lọc
        </Button>
      </div>
    </div>
  );

  return (
    <div className="bg-[#FAFAF8] min-h-screen">
      {/* 7.1: EDITORIAL CENTERED PAGE HEADER */}
      <div className="border-b border-[#E4E4E7] bg-white py-8 sm:py-10 text-center">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb nhỏ tương tác */}
          <nav aria-label="Breadcrumb" className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider text-[#71717A] mb-3">
            <Link to="/" className="hover:text-[#8B5CF6] transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            {genderParam === 'nam' ? (
              <button
                type="button"
                onClick={() => updateParam('category', 'all')}
                className={`hover:text-[#8B5CF6] transition-colors cursor-pointer ${
                  categoryParam === 'all' ? 'font-bold text-[#8B5CF6]' : ''
                }`}
              >
                Nam
              </button>
            ) : (
              <span className="text-[#71717A]">Catalog</span>
            )}

            {genderParam === 'nam' && currentActiveGroup !== 'all' && (
              <>
                <span>/</span>
                <button
                  type="button"
                  onClick={() => updateParam('category', currentActiveGroup)}
                  className={`hover:text-[#8B5CF6] transition-colors cursor-pointer ${
                    categoryParam === currentActiveGroup ? 'font-bold text-[#8B5CF6]' : ''
                  }`}
                >
                  {currentActiveGroup === 'ao'
                    ? 'Áo'
                    : currentActiveGroup === 'ao-khoac'
                    ? 'Áo khoác'
                    : currentActiveGroup === 'quan'
                    ? 'Quần'
                    : currentActiveGroup}
                </button>
              </>
            )}

            {categoryParam !== 'all' &&
              categoryParam !== 'ao' &&
              categoryParam !== 'ao-khoac' &&
              categoryParam !== 'quan' && (
                <>
                  <span>/</span>
                  <span className="text-[#8B5CF6] font-bold">
                    {CATEGORY_DEFINITIONS[categoryParam]?.name || categoryParam}
                  </span>
                </>
              )}
          </nav>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#F3E8FF] text-[#7C3AED] text-[10px] font-bold uppercase mb-2 border border-[#DDD6FE]">
            <Sparkles className="w-3 h-3 text-[#8B5CF6]" />
            <span>
              {genderParam === 'nu'
                ? "GEN Z WOMEN'S ESSENTIALS"
                : genderParam === 'unisex'
                ? "GEN Z UNISEX ESSENTIALS"
                : "GEN Z MEN'S ESSENTIALS"}
            </span>
          </div>

          {/* Tiêu đề danh mục cực lớn căn giữa */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#18181B] uppercase font-sans max-w-4xl mx-auto transition-all duration-300">
            {categoryHeaderData.title}
          </h1>

          {/* Mô tả ngắn căn giữa */}
          <p className="text-xs sm:text-sm text-[#71717A] mt-2 max-w-2xl mx-auto text-center leading-relaxed">
            {categoryHeaderData.description}
          </p>

          {/* Thanh chọn nhóm chính Nữ: [Tất cả | Áo | Quần | Váy & Chân váy | Áo khoác | Đồ bộ] */}
          {genderParam === 'nu' && (
            <div className="mt-6 flex items-center justify-center">
              <div className="inline-flex p-1 rounded-2xl bg-[#F2F3F5] border border-[#E4E4E7] gap-1 shadow-2xs overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => updateParam('category', 'all')}
                  className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                    currentActiveGroup === 'all'
                      ? 'bg-[#8B5CF6] text-white shadow-xs'
                      : 'text-[#71717A] hover:text-[#18181B] hover:bg-white/60'
                  }`}
                >
                  Tất cả ({totalScopedProductsCount})
                </button>
                <button
                  type="button"
                  onClick={() => updateParam('category', 'ao')}
                  className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                    currentActiveGroup === 'ao'
                      ? 'bg-[#8B5CF6] text-white shadow-xs'
                      : 'text-[#71717A] hover:text-[#18181B] hover:bg-white/60'
                  }`}
                >
                  Áo ({shirtCount})
                </button>
                <button
                  type="button"
                  onClick={() => updateParam('category', 'quan')}
                  className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                    currentActiveGroup === 'quan'
                      ? 'bg-[#8B5CF6] text-white shadow-xs'
                      : 'text-[#71717A] hover:text-[#18181B] hover:bg-white/60'
                  }`}
                >
                  Quần ({pantCount})
                </button>
                <button
                  type="button"
                  onClick={() => updateParam('category', 'vay')}
                  className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                    currentActiveGroup === 'vay'
                      ? 'bg-[#8B5CF6] text-white shadow-xs'
                      : 'text-[#71717A] hover:text-[#18181B] hover:bg-white/60'
                  }`}
                >
                  Váy &amp; Chân váy ({vayCount})
                </button>
                <button
                  type="button"
                  onClick={() => updateParam('category', 'ao-khoac')}
                  className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                    currentActiveGroup === 'ao-khoac'
                      ? 'bg-[#8B5CF6] text-white shadow-xs'
                      : 'text-[#71717A] hover:text-[#18181B] hover:bg-white/60'
                  }`}
                >
                  Áo khoác ({jacketCount})
                </button>
                <button
                  type="button"
                  onClick={() => updateParam('category', 'do-bo')}
                  className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                    currentActiveGroup === 'do-bo'
                      ? 'bg-[#8B5CF6] text-white shadow-xs'
                      : 'text-[#71717A] hover:text-[#18181B] hover:bg-white/60'
                  }`}
                >
                  Đồ bộ ({doBoCount})
                </button>
              </div>
            </div>
          )}

          {/* Thanh chọn nhóm chính Nam: [Tất cả | Áo | Áo khoác | Quần | Đồ bộ | Đồ đôi] */}
          {genderParam === 'nam' && (
            <div className="mt-6 flex items-center justify-center">
              <div className="inline-flex p-1 rounded-2xl bg-[#F2F3F5] border border-[#E4E4E7] gap-1 shadow-2xs overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => updateParam('category', 'all')}
                  className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                    currentActiveGroup === 'all'
                      ? 'bg-[#8B5CF6] text-white shadow-xs'
                      : 'text-[#71717A] hover:text-[#18181B] hover:bg-white/60'
                  }`}
                >
                  Tất cả ({totalScopedProductsCount})
                </button>
                <button
                  type="button"
                  onClick={() => updateParam('category', 'ao')}
                  className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                    currentActiveGroup === 'ao'
                      ? 'bg-[#8B5CF6] text-white shadow-xs'
                      : 'text-[#71717A] hover:text-[#18181B] hover:bg-white/60'
                  }`}
                >
                  Áo ({shirtCount})
                </button>
                <button
                  type="button"
                  onClick={() => updateParam('category', 'ao-khoac')}
                  className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                    currentActiveGroup === 'ao-khoac'
                      ? 'bg-[#8B5CF6] text-white shadow-xs'
                      : 'text-[#71717A] hover:text-[#18181B] hover:bg-white/60'
                  }`}
                >
                  Áo khoác ({jacketCount})
                </button>
                <button
                  type="button"
                  onClick={() => updateParam('category', 'quan')}
                  className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                    currentActiveGroup === 'quan'
                      ? 'bg-[#8B5CF6] text-white shadow-xs'
                      : 'text-[#71717A] hover:text-[#18181B] hover:bg-white/60'
                  }`}
                >
                  Quần ({pantCount})
                </button>
                <button
                  type="button"
                  onClick={() => updateParam('category', 'do-bo')}
                  className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                    currentActiveGroup === 'do-bo'
                      ? 'bg-[#8B5CF6] text-white shadow-xs'
                      : 'text-[#71717A] hover:text-[#18181B] hover:bg-white/60'
                  }`}
                >
                  Đồ bộ ({doBoCount})
                </button>
                <button
                  type="button"
                  onClick={() => updateParam('category', 'do-doi')}
                  className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                    currentActiveGroup === 'do-doi'
                      ? 'bg-[#8B5CF6] text-white shadow-xs'
                      : 'text-pink-600 hover:text-pink-700 hover:bg-pink-50'
                  }`}
                >
                  Đồ đôi ({coupleCount})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5.2: QUICK FILTER PILLS BAR CÓ CUỘN NGANG VÀ MŨI TÊN ĐIỀU HƯỚNG — STICKY DƯỚI HEADER */}
      <div
        ref={quickFilterContainerRef}
        data-testid="quick-filter-container"
        className="border-b border-[#E4E4E7] bg-white/95 backdrop-blur-md sticky z-30 shadow-xs transition-all duration-200"
        style={{ top: 'var(--site-header-height, 110px)' }}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="relative flex items-center">
            {/* Scroll Left Button */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => handleScrollPills('left')}
                className="absolute left-0 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-[#E4E4E7] text-[#18181B] hover:text-[#8B5CF6] hover:border-[#8B5CF6] hidden md:flex items-center justify-center transition-all cursor-pointer -translate-x-2"
                aria-label="Cuộn sang trái"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Scrollable Pills Container */}
            <div
              ref={quickFilterScrollRef}
              onScroll={checkScrollability}
              className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 scroll-smooth px-1"
            >
              <span className="text-[11px] font-bold uppercase text-[#71717A] shrink-0 mr-1 hidden sm:inline">
                {currentActiveGroup === 'ao' ? 'Loại áo:' : currentActiveGroup === 'quan' ? 'Loại quần:' : 'Lọc nhanh:'}
              </span>
              {quickFilterPills.map((pill) => {
                const isActive =
                  (pill.id === 'all' &&
                    categoryParam === 'all' &&
                    seasonParam === 'all' &&
                    selectedColors.length === 0 &&
                    selectedStyles.length === 0 &&
                    !maxPriceParam) ||
                  (pill.filter.category && categoryParam === pill.filter.category) ||
                  (pill.filter.season && seasonParam === pill.filter.season) ||
                  (pill.filter.gender && genderParam === pill.filter.gender) ||
                  (pill.filter.style && selectedStyles.includes(pill.filter.style)) ||
                  (pill.filter.maxPrice && maxPriceParam === Number(pill.filter.maxPrice));

                return (
                  <button
                    key={pill.id}
                    onClick={() => handlePillClick(pill)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all cursor-pointer active:scale-95 ${
                      isActive
                        ? 'bg-[#8B5CF6] text-white shadow-subtle ring-1 ring-[#8B5CF6]'
                        : 'bg-[#F2F3F5] border border-[#E4E4E7] text-[#18181B] hover:border-[#8B5CF6] hover:bg-[#F3E8FF]/40'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* Scroll Right Button */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => handleScrollPills('right')}
                className="absolute right-0 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-[#E4E4E7] text-[#18181B] hover:text-[#8B5CF6] hover:border-[#8B5CF6] hidden md:flex items-center justify-center transition-all cursor-pointer translate-x-2"
                aria-label="Cuộn sang phải"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Anchor cuộn mượt thông minh cho QuickFilter và Category click */}
      <div
        ref={catalogTopAnchorRef}
        id="catalog-top-anchor"
        data-testid="catalog-top-anchor"
        className="scroll-mt-36 sm:scroll-mt-44"
        style={{ scrollMarginTop: 'calc(var(--site-header-height, 110px) + 56px)' }}
      />

      {/* 3: BỐ CỤC 3 VÙNG / 2 VÙNG LINH HOẠT [BỘ LỌC 240px | CATALOG TỰ CO GIÃN | AI STYLIST 290px] */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Toolbar: Mobile trigger + Active chips + Sort + AI Stylist toggle */}
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#E4E4E7] mb-6 gap-3">
          {/* Mobile buttons */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#18181B] text-white text-xs font-semibold cursor-pointer active:scale-95 transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#DDD6FE]" />
              <span>Bộ lọc {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
            </button>
          </div>

          {/* Desktop Filter Summary */}
          <div className="hidden lg:flex items-center text-xs text-[#71717A] gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
            <span className="font-medium">
              Hiển thị <strong className="text-[#18181B]">{displayedProducts.length}</strong> / <strong>{allFilteredProducts.length}</strong> sản phẩm phù hợp
            </span>
          </div>

          {/* Right Controls: Sort Select */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Sort Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#71717A] hidden sm:inline font-medium">SẮP XẾP:</span>
              <select
                value={sortParam}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="text-xs font-semibold bg-white border border-[#E4E4E7] rounded-xl px-3 py-2 text-[#18181B] focus:outline-none focus:border-[#8B5CF6] cursor-pointer shadow-2xs"
              >
                <option value="newest">Mới nhất (Latest Drop)</option>
                <option value="price-asc">Giá: Thấp → Cao (Sinh viên)</option>
                <option value="price-desc">Giá: Cao → Thấp</option>
                <option value="rating-desc">Đánh giá tốt nhất</option>
                <option value="name-asc">Tên sản phẩm A → Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6 text-xs">
            <span className="text-[#71717A] uppercase text-[11px] font-semibold">Đang lọc:</span>

            {searchParam && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-[#18181B] font-semibold border border-[#E4E4E7] shadow-subtle">
                Từ khóa: "{searchParam}"
                <button
                  onClick={() => updateParam('q', null)}
                  className="hover:text-[#DC2626] ml-1 cursor-pointer"
                  aria-label="Xóa lọc từ khóa"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {seasonParam !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#D97706] font-semibold text-[11px] border border-[#FDE68A]">
                {seasonParam === 'he' ? 'Mùa Hè' : seasonParam === 'dong' ? 'Mùa Đông' : 'Xuân - Thu'}
                <button
                  onClick={() => updateParam('season', null)}
                  className="hover:text-[#DC2626] ml-1 cursor-pointer"
                  aria-label="Xóa lọc mùa"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {genderParam !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#18181B] text-white font-semibold text-[11px]">
                {genderParam.toUpperCase()}
                <button
                  onClick={() => updateParam('gender', null)}
                  className="hover:text-[#DDD6FE] ml-1 cursor-pointer"
                  aria-label="Xóa lọc giới tính"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {categoryParam !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F3E8FF] text-[#7C3AED] font-semibold border border-[#DDD6FE]">
                {categoryParam === 'ao' ? 'Tất cả Áo' : categoryParam === 'quan' ? 'Tất cả Quần' : CATEGORY_DEFINITIONS[categoryParam]?.name || categoryParam}
                <button
                  onClick={() => updateParam('category', null)}
                  className="hover:text-[#DC2626] ml-1 cursor-pointer"
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
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F3E8FF] text-[#7C3AED] font-semibold border border-[#DDD6FE]"
                >
                  Màu: {colName}
                  <button
                    onClick={() => toggleArrayParam('color', colSlug)}
                    className="hover:text-[#DC2626] ml-1 cursor-pointer"
                    aria-label="Xóa lọc màu"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            {brandParam !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-[#18181B] font-semibold border border-[#E4E4E7]">
                Brand: {brandParam}
                <button
                  onClick={() => updateParam('brand', null)}
                  className="hover:text-[#DC2626] ml-1 cursor-pointer"
                  aria-label="Xóa lọc thương hiệu"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedStyles.map((st) => (
              <span
                key={st}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-[#18181B] font-semibold border border-[#E4E4E7]"
              >
                {st}
                <button
                  onClick={() => toggleArrayParam('style', st)}
                  className="hover:text-[#DC2626] ml-1 cursor-pointer"
                  aria-label={`Xóa lọc phong cách ${st}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {selectedSizes.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#F3E8FF] text-[#7C3AED] font-semibold text-[11px] border border-[#DDD6FE]"
              >
                Size {s}
                <button
                  onClick={() => toggleArrayParam('size', s)}
                  className="hover:text-[#DC2626] ml-1 cursor-pointer"
                  aria-label={`Xóa lọc size ${s}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            <button
              onClick={clearAllFilters}
              className="text-[#8B5CF6] hover:underline font-bold text-[11px] ml-2 cursor-pointer"
            >
              [XÓA TẤT CẢ LỌC]
            </button>
          </div>
        )}

        {/* 3-COLUMN DYNAMIC FLEX CONTAINER */}
        <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start">
          {/* CỘT TRÁI — BỘ LỌC (Khoảng 240px, sticky dưới Quick Filter) */}
          <aside
            className="hidden lg:block w-[240px] xl:w-[250px] shrink-0 bg-white rounded-2xl p-5 border border-[#E4E4E7] shadow-subtle sticky z-20 overflow-y-auto scrollbar-thin"
            style={{
              top: 'calc(var(--site-header-height, 112px) + 54px)',
              maxHeight: 'calc(100vh - var(--site-header-height, 112px) - 70px)',
            }}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E4E4E7]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>BỘ LỌC SẢN PHẨM</span>
              </h3>
              {activeFilterCount > 0 && (
                <span className="text-[10px] font-bold text-white bg-[#8B5CF6] px-2 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </div>
            {renderFilterContent()}
          </aside>

          {/* CỘT GIỮA — DANH SÁCH SẢN PHẨM (chiếm toàn bộ phần còn lại) */}
          <main className="flex-1 min-w-0">
            {categoryParam === 'do-doi' ? (
              <div className="space-y-6">
                <div className="bg-pink-50/70 border border-pink-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-extrabold text-[#18181B] flex items-center gap-2">
                      <span>👩‍❤️‍👨 BỘ SƯU TẬP ĐỒ ĐÔI GEN Z (COUPLE OUTFITS)</span>
                      <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-bold">
                        {COUPLE_SETS.length} Set đã xác minh
                      </span>
                    </h2>
                    <p className="text-xs text-[#71717A] mt-1">
                      Mỗi set gồm 2 sản phẩm thiết kế đồng điệu cho Chàng & Nàng. Bạn có thể chọn màu và size độc lập cho từng người kèm giá ưu đãi combo!
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  {COUPLE_SETS.map((cs) => (
                    <CoupleSetCard key={cs.id} coupleSet={cs} />
                  ))}
                </div>
              </div>
            ) : allFilteredProducts.length === 0 ? (
              genderParam === 'nu' ? (
                totalScopedProductsCount === 0 ? (
                  /* WOMEN'S COLLECTION EMPTY STATE KHI TOÀN BỘ CHƯA CÓ ẢNH */
                  <div className="text-center py-20 px-6 bg-white rounded-3xl border border-[#E4E4E7] space-y-6 shadow-subtle max-w-2xl mx-auto my-4 animate-fade-in">
                    <div className="w-20 h-20 rounded-full bg-[#F3E8FF] mx-auto flex items-center justify-center text-[#7C3AED] shadow-inner">
                      <Sparkles className="w-10 h-10 animate-pulse text-[#8B5CF6]" />
                    </div>
                    <div className="space-y-2.5">
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#F3E8FF] text-[#7C3AED] border border-[#DDD6FE]">
                        WOMEN'S COLLECTION 2026
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] tracking-tight">
                        Bộ sưu tập Nữ đang được cập nhật
                      </h3>
                      <p className="text-xs sm:text-sm text-[#71717A] max-w-lg mx-auto leading-relaxed">
                        Hệ thống 29 danh mục thời trang Nữ Gen Z chuẩn phom dáng (Áo, Quần, Váy &amp; Chân váy, Áo khoác, Đồ bộ) đã được cấu hình sẵn sàng. SMARTBUY AI đang tuyển chọn và hoàn thiện hình ảnh thực tế từ xưởng thiết kế. Các sản phẩm chính thức sẽ lập tức xuất hiện ngay khi ảnh được đồng bộ.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => navigate('/')}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold"
                      >
                        Về trang chủ
                      </Button>
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => navigate('/products?gender=nam')}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold border-[#E4E4E7] hover:border-[#8B5CF6] hover:text-[#7C3AED]"
                      >
                        Khám phá Thời trang Nam
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* NHÓM / DANH MỤC ĐANG CẬP NHẬT TRONG KHI ĐÃ CÓ MẪU ÁO NỮ CÔNG KHAI */
                  <div className="text-center py-16 px-6 bg-white rounded-3xl border border-[#E4E4E7] space-y-5 shadow-subtle max-w-xl mx-auto my-4 animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-[#F3E8FF] mx-auto flex items-center justify-center text-[#7C3AED]">
                      <Sparkles className="w-8 h-8 text-[#8B5CF6]" />
                    </div>
                    <div className="space-y-2">
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#F3E8FF] text-[#7C3AED] border border-[#DDD6FE]">
                        WOMEN'S COLLECTION
                      </span>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-[#18181B] tracking-tight">
                        {categoryParam !== 'all' ? `Danh mục ${CATEGORY_DEFINITIONS[categoryParam]?.name || categoryParam} đang cập nhật` : 'Không có sản phẩm phù hợp'}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#71717A] max-w-md mx-auto">
                        Hình ảnh thực tế cho nhóm này đang được xử lý từ folder xưởng. Bạn có thể khám phá các mẫu Áo Nữ ({shirtCount} mẫu) đã sẵn sàng mua sắm ngay bên dưới!
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => updateParam('category', 'ao')}
                        className="text-xs font-bold rounded-xl"
                      >
                        Xem các mẫu Áo Nữ có sẵn ({shirtCount})
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-xs font-bold rounded-xl border-[#E4E4E7]"
                      >
                        Xem tất cả đồ Nữ ({totalScopedProductsCount})
                      </Button>
                    </div>
                  </div>
                )
              ) : (
                /* Empty State thường khi lọc không ra kết quả */
                <div className="text-center py-16 px-4 bg-white rounded-2xl border border-[#E4E4E7] space-y-4 shadow-subtle">
                  <div className="w-16 h-16 rounded-full bg-[#F2F3F5] mx-auto flex items-center justify-center text-[#71717A]">
                    <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#18181B] uppercase">
                      Không tìm thấy sản phẩm phù hợp
                    </h3>
                    <p className="text-xs text-[#71717A] mt-1 max-w-md mx-auto">
                      Không có sản phẩm nào khớp với bộ lọc hiện tại. Thử chọn danh mục khác hoặc xóa bộ lọc để xem toàn bộ sản phẩm.
                    </p>
                  </div>
                  <Button variant="accent" size="sm" onClick={clearAllFilters} className="text-xs font-bold rounded-xl">
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    XÓA BỘ LỌC VÀ XEM TẤT CẢ
                  </Button>
                </div>
              )
            ) : (
              <>
                {/* 4 CỘT SẢN PHẨM TRÊN DESKTOP RỘNG (xl:grid-cols-4), 3 CỘT TRÊN LAPTOP (md:grid-cols-3), 2 CỘT TRÊN MOBILE (grid-cols-2) */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4.5 transition-all duration-300">
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

                {/* Skeleton Cards during Auto-Loading */}
                {isAutoLoading && (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4.5 mt-4">
                    {[1, 2, 3, 4].map((s) => (
                      <div
                        key={s}
                        className="rounded-2xl border border-[#E4E4E7] bg-white p-3 space-y-3 animate-pulse"
                      >
                        <div className="aspect-[3/4] bg-[#F2F3F5] rounded-xl" />
                        <div className="h-3 bg-[#E4E4E7] rounded w-3/4" />
                        <div className="h-3 bg-[#E4E4E7] rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Sentinel Element for Intersection Observer Auto-Loading */}
                <div ref={sentinelRef} className="h-4 w-full" />

                {/* 13: HYBRID PAGINATION & PROGRESS */}
                <div className="mt-8 pt-6 border-t border-[#E4E4E7] flex flex-col items-center gap-4">
                  <div className="w-full max-w-md space-y-2">
                    <div className="flex justify-between text-xs text-[#71717A]">
                      <span>
                        Đang hiển thị {displayedProducts.length} trên {allFilteredProducts.length} sản phẩm
                      </span>
                      <span className="font-semibold text-[#18181B]">
                        {Math.round((displayedProducts.length / allFilteredProducts.length) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#E4E4E7] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#8B5CF6] transition-all duration-300"
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
                        size="lg"
                        onClick={handleManualLoadMore}
                        disabled={isAutoLoading}
                        className="px-8 py-3 text-xs font-bold tracking-wider uppercase hover:bg-[#F3E8FF] hover:border-[#8B5CF6] hover:text-[#7C3AED] rounded-xl"
                      >
                        {isAutoLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ĐANG TẢI THÊM SẢN PHẨM...
                          </>
                        ) : (
                          <>
                            <ArrowDownCircle className="w-4 h-4 mr-2" />
                            TẢI THÊM (+{Math.min(ITEMS_PER_PAGE, allFilteredProducts.length - displayedProducts.length)})
                          </>
                        )}
                      </Button>
                      <span className="text-[10px] text-[#71717A]">
                        (Tự động cuộn tải thêm hoặc bấm nút dự phòng)
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-[#71717A] uppercase tracking-wider font-medium">
                      — ĐÃ HIỂN THỊ HẾT TOÀN BỘ SẢN PHẨM TRONG MỤC NÀY —
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
              className="rounded-xl"
            >
              XÓA LỌC
            </Button>
            <Button
              variant="accent"
              size="sm"
              onClick={() => setIsMobileFilterOpen(false)}
              className="rounded-xl"
            >
              XEM KẾT QUẢ ({allFilteredProducts.length})
            </Button>
          </div>
        }
      >
        {renderFilterContent()}
      </Drawer>
    </div>
  );
};
