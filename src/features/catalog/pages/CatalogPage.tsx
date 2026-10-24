import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { productService, ProductFilterOptions } from '@/services/productService';
import { stylistService } from '@/services/stylistService';
import { ProductCard } from '@/components/common/ProductCard';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { Product, SizeCode, AIStylistMessage } from '@/types';
import { GENZ_CATEGORIES, GENZ_BRANDS } from '@/mocks/genzCategories';
import { getActiveCategories, getActiveGroupedCategories, CATEGORY_DEFINITIONS } from '@/constants/categories';
import { formatPrice } from '@/lib/utils';
import {
  SlidersHorizontal,
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
  const selectedStyles = searchParams.getAll('style');
  const selectedFits = searchParams.getAll('fit');

  // Mobile drawer states
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileAIStylistOpen, setIsMobileAIStylistOpen] = useState(false);

  // Desktop AI Stylist Collapsible state (allows product grid to expand to 4 cols)
  const [isStylistCollapsed, setIsStylistCollapsed] = useState(false);

  // Left Filter Accordion Open/Closed States
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    season: true,
    gender: true,
    category: true,
    price: true,
    size: false,
    style: false,
    fit: false,
    brand: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Quick filter horizontal scroll state & ref
  const quickFilterScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  // AI Stylist Sidebar States
  const [stylistQuery, setStylistQuery] = useState('');
  const [isStylistLoading, setIsStylistLoading] = useState(false);
  const [stylistMessages, setStylistMessages] = useState<AIStylistMessage[]>([]);

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
    // If on a dedicated gender URL like /products?gender=nam, keep it or clear completely
    setSearchParams(next);
    setVisibleCount(ITEMS_PER_PAGE);
    setAutoLoadCount(0);
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
      selectedSizes,
      selectedStyles,
      selectedFits,
    ]
  );

  const allFilteredProducts = useMemo(() => productService.getAll(filterOptions), [filterOptions]);

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
      if (genderParam !== 'all') {
        if (genderParam === 'unisex' && p.gender !== 'unisex') return false;
        if (genderParam !== 'unisex' && p.gender !== genderParam && p.gender !== 'unisex') return false;
      }
      if (seasonParam !== 'all') {
        const pSeasons = p.seasons || (p.season ? [p.season] : []);
        if (!pSeasons.includes(seasonParam)) return false;
      }
      return true;
    }).length;
  }, [allCatalogProducts, genderParam, seasonParam]);

  // Đồng bộ hoàn toàn Quick Filter Pills với activeCategories
  const quickFilterPills: QuickFilterPill[] = useMemo(() => {
    const basePills: QuickFilterPill[] = [
      { id: 'all', label: 'Tất cả', filter: {} },
      { id: 'summer', label: 'Mùa hè', filter: { season: 'he' } },
      { id: 'winter', label: 'Mùa đông', filter: { season: 'dong' } },
      { id: 'spring-autumn', label: 'Xuân – Thu', filter: { season: 'xuan-thu' } },
    ];

    const categoryPills: QuickFilterPill[] = activeCategories.map((cat) => ({
      id: cat.slug,
      label: cat.name,
      filter: { category: cat.slug },
    }));

    return [...basePills, ...categoryPills];
  }, [activeCategories]);

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
    (seasonParam !== 'all' ? 1 : 0) +
    (brandParam !== 'all' ? 1 : 0) +
    (searchParam ? 1 : 0) +
    (inStockParam ? 1 : 0) +
    (minPriceParam ? 1 : 0) +
    (maxPriceParam ? 1 : 0) +
    selectedSizes.length +
    selectedStyles.length +
    selectedFits.length;

  // 7.1: Tiêu đề danh mục lớn & Rõ ràng
  const categoryHeaderData = useMemo(() => {
    if (genderParam === 'nam') {
      if (categoryParam !== 'all') {
        const catName = CATEGORY_DEFINITIONS[categoryParam]?.name || categoryParam;
        return {
          title: `${catName.toUpperCase()} NAM`,
          breadcrumb: `${catName} Nam`,
          categoryName: `${catName} Nam`,
          description: `Tuyển chọn các thiết kế ${catName.toLowerCase()} chuẩn phom rộng phóng khoáng, chất liệu cao cấp dành cho phái mạnh.`,
        };
      }
      return {
        title: 'THỜI TRANG NAM',
        breadcrumb: 'Thời trang Nam',
        categoryName: 'Thời trang Nam',
        description: 'Tập hợp các mẫu áo thun oversized, hoodie nỉ bông, jeans baggy và phụ kiện streetwear phóng khoáng dành cho các chàng trai.',
      };
    }

    if (genderParam === 'nu') {
      if (categoryParam !== 'all') {
        const catName = CATEGORY_DEFINITIONS[categoryParam]?.name || categoryParam;
        return {
          title: `${catName.toUpperCase()} NỮ`,
          breadcrumb: `${catName} Nữ`,
          categoryName: `${catName} Nữ`,
          description: `Tuyển chọn các thiết kế ${catName.toLowerCase()} chuẩn gu Y2K, tôn dáng và rạng rỡ cho các bạn nữ.`,
        };
      }
      return {
        title: 'THỜI TRANG NỮ',
        breadcrumb: 'Thời trang Nữ',
        categoryName: 'Thời trang Nữ',
        description: 'Baby tee ôm dáng, chân váy xếp ly, áo khoác lửng và phụ kiện Y2K cá tính, tôn dáng và trẻ trung cho phái đẹp.',
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

  // Contextual Prompts for AI Stylist
  const contextualPrompts = useMemo(() => {
    const name = categoryHeaderData.categoryName;
    if (seasonParam === 'he') {
      return [
        'Outfit mùa hè dưới 500k cho học sinh sinh viên',
        'Phối áo thun oversize với quần short dạo phố mát mẻ',
        'Set đồ baby tee + chân váy đi biển/cafe',
        'Phụ kiện kính râm và mũ bucket hè năng động',
      ];
    }
    if (seasonParam === 'dong') {
      return [
        'Phối đồ mùa đông đi học ấm áp với hoodie nỉ bông',
        'Sweater dệt kim phối với quần jeans baggy ống rộng',
        'Chọn khăn quàng len và mũ beanie ấm áp cho áo khoác',
        'Set đồ mùa đông hoàn chỉnh 3 món dưới 600k',
      ];
    }
    if (genderParam === 'nam') {
      return [
        'Phối đồ nam đi học phong cách Korean Casual',
        'Phối áo hoodie với quần jeans baggy nam',
        'Outfit nam mùa hè dưới 400.000đ',
        'Chọn phụ kiện streetwear cho bạn nam',
      ];
    }
    if (genderParam === 'nu') {
      return [
        'Phối đồ nữ đi chơi phong cách Y2K',
        'Baby tee phối với chân váy chữ A',
        'Outfit nữ đi cafe chụp ảnh sống ảo',
        'Phụ kiện vòng cổ và túi xách nữ cá tính',
      ];
    }
    return [
      `Phối ${name} đi học phong cách Korean Casual`,
      `Phối ${name} đi chơi phong cách Streetwear`,
      `${name} hợp với giày và phụ kiện gì?`,
      'Gợi ý trọn set đồ 3 món dưới 400k cho sinh viên',
    ];
  }, [categoryParam, seasonParam, genderParam, categoryHeaderData.categoryName]);

  // AI Stylist submit handler
  const handleConsultStylist = async (promptText: string) => {
    if (!promptText.trim() || isStylistLoading) return;
    setIsStylistLoading(true);
    setStylistQuery('');

    setStylistMessages((prev) => [
      ...prev,
      {
        id: `usr_${prev.length + 1}_${promptText.slice(0, 8)}`,
        sender: 'user',
        text: promptText.trim(),
        timestamp: 'Vừa xong',
      },
    ]);

    try {
      const response = await stylistService.consult(promptText.trim());
      setStylistMessages((prev) => [...prev, response]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsStylistLoading(false);
    }
  };

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

  // 6: BỘ LỌC BÊN TRÁI THIẾT KẾ DẠNG ACCORDION GỌN VÀ THAO TÁC NHANH
  const renderFilterContent = () => (
    <div className="space-y-4 text-xs font-sans divide-y divide-[#E4E4E7]">
      {/* 6.1 Mùa */}
      <div className="pt-1">
        {renderSectionHeader('Thời trang bốn mùa', 'season', seasonParam !== 'all' ? 1 : 0)}
        {openSections.season && (
          <div className="grid grid-cols-2 gap-1.5 pt-1.5 animate-fade-in">
            {[
              { id: 'all', label: 'Tất cả mùa' },
              { id: 'he', label: '☀️ Mùa Hè' },
              { id: 'dong', label: '❄️ Mùa Đông' },
              { id: 'xuan-thu', label: '🍂 Xuân - Thu' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => updateParam('season', item.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                  seasonParam === item.id
                    ? 'bg-[#18181B] text-white shadow-subtle'
                    : 'bg-white border border-[#E4E4E7] text-[#18181B] hover:border-[#8B5CF6] hover:bg-[#F3E8FF]/30'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 6.2 Giới tính */}
      <div className="pt-3">
        {renderSectionHeader('Dành cho / Fit', 'gender', genderParam !== 'all' ? 1 : 0)}
        {openSections.gender && (
          <div className="grid grid-cols-2 gap-1.5 pt-1.5 animate-fade-in">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'nam', label: 'Nam' },
              { id: 'nu', label: 'Nữ' },
              { id: 'unisex', label: 'Unisex' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => updateParam('gender', item.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                  genderParam === item.id
                    ? 'bg-[#18181B] text-white shadow-subtle'
                    : 'bg-white border border-[#E4E4E7] text-[#18181B] hover:border-[#8B5CF6] hover:bg-[#F3E8FF]/30'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 6.3 Danh mục sản phẩm theo 3 cấp */}
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
                {/* Tiêu đề Cấp 2: Nhóm Lớn (Áo, Quần, ...) */}
                <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#18181B] bg-[#F2F3F5] rounded-md">
                  <span>{group.groupName}</span>
                  <span className="text-[10px] text-[#71717A] font-semibold">({group.totalCount})</span>
                </div>

                {/* Danh sách Cấp 3: Loại sản phẩm (Hoodie, Áo len, Polo, Sơ mi, Áo thun, ...) */}
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

      {/* 6.4 Mức giá */}
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

      {/* 6.5 Kích thước */}
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

      {/* 6.6 Phong cách */}
      <div className="pt-3">
        {renderSectionHeader('Phong cách (Vibe)', 'style', selectedStyles.length)}
        {openSections.style && (
          <div className="flex flex-wrap gap-1.5 pt-1.5 animate-fade-in">
            {STYLE_OPTIONS.map((st) => {
              const isSelected = selectedStyles.includes(st);
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => toggleArrayParam('style', st)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#8B5CF6] text-white shadow-xs'
                      : 'bg-[#F2F3F5] text-[#71717A] hover:text-[#18181B]'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 6.7 Phom dáng */}
      <div className="pt-3">
        {renderSectionHeader('Phom dáng (Fit)', 'fit', selectedFits.length)}
        {openSections.fit && (
          <div className="space-y-1 pt-1.5 animate-fade-in">
            {FIT_OPTIONS.map((fit) => {
              const isSelected = selectedFits.includes(fit);
              return (
                <label
                  key={fit}
                  className="flex items-center gap-2 cursor-pointer text-[#71717A] hover:text-[#18181B] py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleArrayParam('fit', fit)}
                    className="rounded border-[#E4E4E7] text-[#8B5CF6] focus:ring-[#8B5CF6]"
                  />
                  <span className={isSelected ? 'font-bold text-[#18181B]' : ''}>{fit}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 6.8 Thương hiệu đối tác */}
      <div className="pt-3">
        {renderSectionHeader('Thương hiệu', 'brand', brandParam !== 'all' ? 1 : 0)}
        {openSections.brand && (
          <div className="space-y-1 pt-1.5 animate-fade-in">
            <button
              type="button"
              onClick={() => updateParam('brand', 'all')}
              className={`w-full text-left py-1 px-2 rounded-md transition-colors cursor-pointer ${
                brandParam === 'all'
                  ? 'font-bold text-[#7C3AED] bg-[#F3E8FF]'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              Tất cả Local Brands
            </button>
            {GENZ_BRANDS.map((br) => (
              <button
                key={br.id}
                type="button"
                onClick={() => updateParam('brand', br.name)}
                className={`w-full text-left py-1 px-2 rounded-md transition-colors cursor-pointer ${
                  brandParam === br.name
                    ? 'font-bold text-[#7C3AED] bg-[#F3E8FF]'
                    : 'text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                {br.name}
              </button>
            ))}
          </div>
        )}
      </div>

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

  // 10: AI STYLIST PANEL THIẾT KẾ HIỆN ĐẠI
  const renderAIStylistPanel = () => (
    <div className="bg-white rounded-2xl border border-[#E4E4E7] shadow-subtle p-4 flex flex-col h-full max-h-[calc(100vh-9.5rem)]">
      {/* Header AI Stylist */}
      <div className="pb-3 border-b border-[#E4E4E7] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] text-[#8B5CF6] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B] flex items-center gap-1.5">
              <span>AI STYLIST</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Trực tuyến" />
            </h3>
            <p className="text-[10px] text-[#71717A]">Trợ lý phối đồ dành riêng cho bạn</p>
          </div>
        </div>

        {stylistMessages.length > 0 && (
          <button
            onClick={() => setStylistMessages([])}
            className="p-1.5 text-[#71717A] hover:text-[#DC2626] rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            title="Làm mới cuộc trò chuyện"
            aria-label="Làm mới trò chuyện"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Message & Recommendation Content Area */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 scrollbar-thin">
        {/* Contextual Greeting */}
        <div className="p-3 rounded-xl bg-[#FAFAF8] border border-[#E4E4E7] space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#18181B]">
            <Bot className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>Tư vấn theo phong cách</span>
          </div>
          <p className="text-[11px] text-[#71717A] leading-relaxed">
            Bạn đang xem <strong className="text-[#8B5CF6]">{categoryHeaderData.breadcrumb}</strong>. Bạn muốn phối set đi học, đi chơi hay outfit theo ngân sách?
          </p>
        </div>

        {/* Suggestion Prompts */}
        {stylistMessages.length === 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] block">
              Gợi ý câu hỏi nhanh:
            </span>
            <div className="space-y-1.5">
              {contextualPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleConsultStylist(prompt)}
                  className="w-full text-left p-2 rounded-xl bg-white border border-[#E4E4E7] hover:border-[#8B5CF6] hover:bg-[#F3E8FF]/30 text-xs text-[#18181B] font-medium transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="line-clamp-1">{prompt}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-[#8B5CF6] shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {stylistMessages.map((msg) => (
          <div key={msg.id} className="space-y-2 animate-fade-in">
            {msg.sender === 'user' ? (
              <div className="flex justify-end">
                <div className="bg-[#18181B] text-white text-xs py-2 px-3 rounded-2xl rounded-tr-xs max-w-[85%]">
                  {msg.text}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-[#F3E8FF]/60 border border-[#DDD6FE] text-[#18181B] text-xs p-3 rounded-2xl rounded-tl-xs leading-relaxed space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-[#7C3AED] text-[11px]">
                    <Sparkles className="w-3 h-3" />
                    <span>SMARTBUY AI STYLIST</span>
                  </div>
                  <p>{msg.text}</p>
                </div>

                {/* Recommended Products */}
                {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
                      Outfit đề xuất:
                    </span>
                    <div className="space-y-1.5">
                      {msg.recommendedProducts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-[#E4E4E7] hover:border-[#8B5CF6] transition-colors"
                        >
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-10 h-12 object-cover rounded-lg shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-semibold text-[#18181B] truncate">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-[#8B5CF6] font-bold">
                              {formatPrice(p.price)}
                            </div>
                          </div>
                          <Link
                            to={`/products/${p.slug}`}
                            onClick={() => {
                              sessionStorage.setItem('catalog_scroll_pos', String(window.scrollY));
                              sessionStorage.setItem('catalog_visible_count', String(visibleCount));
                            }}
                            className="p-1.5 text-xs text-[#8B5CF6] hover:bg-[#F3E8FF] rounded-lg transition-colors shrink-0"
                            title="Xem chi tiết"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      ))}
                    </div>

                    {/* Nút Thử outfit này bằng AI theo Master Prompt Section 10 */}
                    <div className="pt-1.5">
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => {
                          const top = msg.recommendedProducts?.find((p) =>
                            ['ao-thun', 'hoodie-sweater', 'so-mi-polo', 'ao-khoac'].includes(p.categorySlug)
                          );
                          const bottom = msg.recommendedProducts?.find((p) =>
                            ['quan-jeans', 'quan-cargo-parachute', 'chan-vay'].includes(p.categorySlug)
                          );
                          const accessory = msg.recommendedProducts?.find((p) => p.categorySlug === 'phu-kien');
                          const params = new URLSearchParams();
                          if (top) params.set('topId', top.id);
                          if (bottom) params.set('bottomId', bottom.id);
                          if (accessory) params.set('accId', accessory.id);
                          navigate(`/try-on?${params.toString()}`);
                        }}
                        className="w-full h-8 text-xs font-bold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white flex items-center justify-center gap-1.5 rounded-xl shadow-xs transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                        <span>✨ Thử outfit này bằng AI</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {isStylistLoading && (
          <div className="flex items-center gap-2 text-xs text-[#8B5CF6] p-3 rounded-xl bg-[#F3E8FF]/40 border border-[#DDD6FE]">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>AI đang phối outfit chuẩn gu...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleConsultStylist(stylistQuery);
        }}
        className="pt-2.5 border-t border-[#E4E4E7] shrink-0 flex items-center gap-1.5"
      >
        <input
          type="text"
          value={stylistQuery}
          onChange={(e) => setStylistQuery(e.target.value)}
          placeholder={`Hỏi phối ${categoryHeaderData.categoryName}...`}
          disabled={isStylistLoading}
          className="flex-1 bg-[#F2F3F5] border border-[#E4E4E7] rounded-xl px-3 py-1.5 text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#8B5CF6] focus:bg-white transition-colors"
        />
        <Button
          type="submit"
          variant="accent"
          size="sm"
          disabled={!stylistQuery.trim() || isStylistLoading}
          className="h-8 px-3 rounded-xl shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </form>
    </div>
  );

  return (
    <div className="bg-[#FAFAF8] min-h-screen">
      {/* 7.1: EDITORIAL CENTERED PAGE HEADER */}
      <div className="border-b border-[#E4E4E7] bg-white py-8 sm:py-12 text-center">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb nhỏ căn giữa */}
          <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider text-[#71717A] mb-2.5">
            <Link to="/" className="hover:text-[#18181B] transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <span className="text-[#71717A]">Catalog</span>
            <span>/</span>
            <span className="text-[#8B5CF6] font-bold">{categoryHeaderData.breadcrumb}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#F3E8FF] text-[#7C3AED] text-[10px] font-bold uppercase mb-2.5 border border-[#DDD6FE]">
            <Sparkles className="w-3 h-3 text-[#8B5CF6]" />
            <span>GEN Z STREETWEAR & ACCESSORIES</span>
          </div>

          {/* Tiêu đề danh mục cực lớn căn giữa */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#18181B] uppercase font-sans max-w-4xl mx-auto transition-all duration-300">
            {categoryHeaderData.title}
          </h1>

          {/* Mô tả ngắn căn giữa */}
          <p className="text-xs sm:text-sm text-[#71717A] mt-2.5 max-w-2xl mx-auto text-center leading-relaxed">
            {categoryHeaderData.description}
          </p>
        </div>
      </div>

      {/* 5.2: QUICK FILTER PILLS BAR CÓ CUỘN NGANG VÀ MŨI TÊN ĐIỀU HƯỚNG */}
      <div className="border-b border-[#E4E4E7] bg-white sticky top-16 z-30 shadow-subtle">
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
                Lọc nhanh:
              </span>
              {quickFilterPills.map((pill) => {
                const isActive =
                  (pill.id === 'all' &&
                    categoryParam === 'all' &&
                    seasonParam === 'all' &&
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

            <button
              onClick={() => setIsMobileAIStylistOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F3E8FF] text-[#7C3AED] text-xs font-bold border border-[#DDD6FE] cursor-pointer active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>AI Stylist</span>
            </button>
          </div>

          {/* Desktop Filter Summary */}
          <div className="hidden lg:flex items-center text-xs text-[#71717A] gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
            <span className="font-medium">
              Hiển thị <strong className="text-[#18181B]">{displayedProducts.length}</strong> / <strong>{allFilteredProducts.length}</strong> sản phẩm phù hợp
            </span>
          </div>

          {/* Right Controls: Sort & AI Stylist Panel Toggle on Desktop */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Desktop AI Stylist Toggle Button */}
            <button
              type="button"
              onClick={() => setIsStylistCollapsed(!isStylistCollapsed)}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                !isStylistCollapsed
                  ? 'bg-[#F3E8FF] text-[#7C3AED] border-[#DDD6FE] hover:bg-[#EDE9FE]'
                  : 'bg-white text-[#71717A] border-[#E4E4E7] hover:text-[#18181B] hover:border-[#8B5CF6]'
              }`}
              title={isStylistCollapsed ? 'Mở rộng AI Stylist bên phải' : 'Thu gọn AI Stylist để xem sản phẩm rộng hơn'}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>{isStylistCollapsed ? 'Mở AI Stylist' : 'Thu gọn AI'}</span>
              {isStylistCollapsed ? <Maximize2 className="w-3 h-3 ml-0.5" /> : <Minimize2 className="w-3 h-3 ml-0.5" />}
            </button>

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
                {CATEGORY_DEFINITIONS[categoryParam]?.name || categoryParam}
                <button
                  onClick={() => updateParam('category', null)}
                  className="hover:text-[#DC2626] ml-1 cursor-pointer"
                  aria-label="Xóa lọc danh mục"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

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
          {/* CỘT TRÁI — BỘ LỌC (Khoảng 240px, sticky) */}
          <aside className="hidden lg:block w-[240px] xl:w-[250px] shrink-0 bg-white rounded-2xl p-5 border border-[#E4E4E7] shadow-subtle sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto scrollbar-thin">
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
            {allFilteredProducts.length === 0 ? (
              /* Empty State */
              <div className="text-center py-16 px-4 bg-white rounded-2xl border border-[#E4E4E7] space-y-4 shadow-subtle">
                <div className="w-16 h-16 rounded-full bg-[#F2F3F5] mx-auto flex items-center justify-center text-[#71717A]">
                  <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#18181B] uppercase">
                    Không tìm thấy sản phẩm phù hợp
                  </h3>
                  <p className="text-xs text-[#71717A] mt-1 max-w-md mx-auto">
                    Không có sản phẩm nào khớp với bộ lọc hiện tại. Thử chọn danh mục khác hoặc xóa bộ lọc để xem toàn bộ 130+ sản phẩm.
                  </p>
                </div>
                <Button variant="accent" size="sm" onClick={clearAllFilters} className="text-xs font-bold rounded-xl">
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  XÓA BỘ LỌC VÀ XEM TẤT CẢ (130+)
                </Button>
              </div>
            ) : (
              <>
                {/* Responsive grid 2-3 cột (khi mở AI) hoặc 3-4 cột (khi thu gọn AI) */}
                <div
                  className={`grid gap-3.5 sm:gap-4 transition-all duration-300 ${
                    isStylistCollapsed
                      ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'
                      : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3'
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

                {/* Skeleton Cards during Auto-Loading */}
                {isAutoLoading && (
                  <div
                    className={`grid gap-3.5 sm:gap-4 mt-4 ${
                      isStylistCollapsed
                        ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'
                        : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3'
                    }`}
                  >
                    {[1, 2, 3].map((s) => (
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

          {/* CỘT PHẢI — AI STYLIST (Khoảng 280–300px, sticky, có thể thu gọn) */}
          {!isStylistCollapsed && (
            <aside className="hidden lg:block w-[280px] xl:w-[300px] shrink-0 sticky top-32">
              {renderAIStylistPanel()}
            </aside>
          )}
        </div>
      </div>

      {/* Mobile Floating Button to open AI Stylist */}
      <button
        type="button"
        onClick={() => setIsMobileAIStylistOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 bg-[#18181B] text-white rounded-full shadow-modal hover:bg-[#8B5CF6] active:scale-95 transition-all cursor-pointer font-bold text-xs"
        aria-label="Mở trợ lý AI Stylist"
      >
        <Sparkles className="w-4 h-4 text-[#DDD6FE]" />
        <span>Tư vấn AI Stylist</span>
      </button>

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

      {/* Mobile AI Stylist Drawer */}
      <Drawer
        isOpen={isMobileAIStylistOpen}
        onClose={() => setIsMobileAIStylistOpen(false)}
        position="right"
        title="AI OUTFIT STYLIST"
      >
        <div className="h-[75vh]">
          {renderAIStylistPanel()}
        </div>
      </Drawer>
    </div>
  );
};
