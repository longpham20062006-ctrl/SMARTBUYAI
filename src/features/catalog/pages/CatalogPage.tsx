import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { productService, ProductFilterOptions } from '@/services/productService';
import { stylistService } from '@/services/stylistService';
import { ProductCard } from '@/components/common/ProductCard';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { Product, SizeCode, AIStylistMessage } from '@/types';
import { GENZ_CATEGORIES, GENZ_BRANDS } from '@/mocks/genzCategories';
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

// Quick filter pills definition
const QUICK_FILTER_PILLS: QuickFilterPill[] = [
  { id: 'all', label: 'Tất cả Drops', filter: {} },
  { id: 'summer', label: '☀️ Mùa Hè', filter: { season: 'he' } },
  { id: 'winter', label: '❄️ Mùa Đông', filter: { season: 'dong' } },
  { id: 'ao-thun', label: 'Áo thun Graphic', filter: { category: 'ao-thun' } },
  { id: 'hoodie', label: 'Hoodie & Sweater', filter: { category: 'hoodie-sweater' } },
  { id: 'so-mi-polo', label: 'Sơ mi & Polo', filter: { category: 'so-mi-polo' } },
  { id: 'ao-khoac', label: 'Áo khoác Streetwear', filter: { category: 'ao-khoac' } },
  { id: 'quan-jeans', label: 'Jeans Baggy', filter: { category: 'quan-jeans' } },
  { id: 'cargo', label: 'Quần Cargo & Parachute', filter: { category: 'quan-cargo-ong-rong' } },
  { id: 'chan-vay', label: 'Chân váy & Set nữ', filter: { category: 'chan-vay-dam' } },
  { id: 'phu-kien', label: 'Phụ kiện & Nón', filter: { category: 'phu-kien' } },
  { id: 'unisex', label: '⚡ Unisex Fit', filter: { gender: 'unisex' } },
  { id: 'under-199k', label: '🔥 Dưới 199K', filter: { maxPrice: '199000' } },
];

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

  // AI Stylist Sidebar States
  const [stylistQuery, setStylistQuery] = useState('');
  const [isStylistLoading, setIsStylistLoading] = useState(false);
  const [stylistMessages, setStylistMessages] = useState<AIStylistMessage[]>([]);

  // Hybrid infinite scroll & sentinel states
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [autoLoadCount, setAutoLoadCount] = useState(0);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const isInitialMount = useRef(true);

  // PHẦN 10: SCROLL RESTORATION EFFECT
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

  // Reset scroll to top when category or filters change fundamentally
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
    setSearchParams(new URLSearchParams());
    setVisibleCount(ITEMS_PER_PAGE);
    setAutoLoadCount(0);
  };

  // Quick pill click handler
  const handlePillClick = (pill: typeof QUICK_FILTER_PILLS[0]) => {
    const next = new URLSearchParams();
    if (pill.filter.category) next.set('category', pill.filter.category);
    if (pill.filter.season) next.set('season', pill.filter.season);
    if (pill.filter.gender) next.set('gender', pill.filter.gender);
    if (pill.filter.style) next.append('style', pill.filter.style);
    if (pill.filter.maxPrice) next.set('maxPrice', pill.filter.maxPrice);
    setSearchParams(next);
    setVisibleCount(ITEMS_PER_PAGE);
    setAutoLoadCount(0);
  };

  // Filter options including 4 Seasons
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

  // Paginated products
  const displayedProducts = useMemo(() => {
    return allFilteredProducts.slice(0, visibleCount);
  }, [allFilteredProducts, visibleCount]);

  const hasMore = visibleCount < allFilteredProducts.length;

  // PHẦN 10.1: CHẾ ĐỘ TẢI HYBRID (AUTO LOAD KHI CUỘN + NÚT DỰ PHÒNG)
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
      setAutoLoadCount(0); // Resets counter to allow next auto-loads
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

  // PHẦN 6: DYNAMIC BIG CATEGORY TITLE & DESCRIPTIONS
  const categoryHeaderData = useMemo(() => {
    if (categoryParam !== 'all') {
      const cat = GENZ_CATEGORIES.find((c) => c.slug === categoryParam);
      const catName = cat?.name || categoryParam;
      let title = `${catName.toUpperCase()} COLLECTION`;

      if (categoryParam === 'hoodie-sweater') title = 'SWEATER & HOODIE COLLECTION';
      if (categoryParam === 'quan-jeans') title = 'DENIM & JORTS COLLECTION';
      if (categoryParam === 'quan-cargo-ong-rong') title = 'CARGO & PARACHUTE COLLECTION';
      if (categoryParam === 'ao-thun') title = 'T-SHIRT & GRAPHIC TEE COLLECTION';
      if (categoryParam === 'so-mi-polo') title = 'SHIRTS & POLO COLLECTION';
      if (categoryParam === 'ao-khoac') title = 'OUTERWEAR & BOMBER COLLECTION';
      if (categoryParam === 'chan-vay-dam') title = 'SKIRTS & Y2K DRESSES COLLECTION';
      if (categoryParam === 'phu-kien') title = 'ACCESSORIES & JEWELRY COLLECTION';

      return {
        title,
        breadcrumb: catName,
        categoryName: catName,
        description: `Tuyển tập các mẫu ${catName.toLowerCase()} chuẩn phom rộng phóng khoáng, chất liệu cao cấp và phối màu cực nghệ dành cho giới trẻ Gen Z.`,
      };
    }

    if (seasonParam === 'he') {
      return {
        title: 'SUMMER STREETWEAR COLLECTION',
        breadcrumb: 'Mùa Hè',
        categoryName: 'Mùa Hè',
        description: 'Tập hợp các mẫu áo thun cotton 100% thoáng mát, baby tee, quần short, croptop và sơ mi cuban ngắn tay rực rỡ đón hè.',
      };
    }
    if (seasonParam === 'dong') {
      return {
        title: 'WINTER STREETWEAR COLLECTION',
        breadcrumb: 'Mùa Đông',
        categoryName: 'Mùa Đông',
        description: 'Hoodie nỉ bông trùm đầu dày dặn, áo sweater dệt kim, áo phao và varsity jacket ấm áp bất chấp thời tiết.',
      };
    }
    if (seasonParam === 'xuan-thu') {
      return {
        title: 'SPRING & AUTUMN COLLECTION',
        breadcrumb: 'Xuân - Thu',
        categoryName: 'Xuân - Thu',
        description: 'Phối layer thời trang nhẹ nhàng với sơ mi oversize, áo khoác denim, cardigan mỏng và quần jeans baggy suông.',
      };
    }

    if (genderParam === 'nam') {
      return {
        title: "MEN'S STREETWEAR COLLECTION",
        breadcrumb: 'Thời trang Nam',
        categoryName: 'Thời trang Nam',
        description: 'Tập hợp các mẫu áo thun oversized, hoodie nỉ bông, jeans baggy và phụ kiện streetwear phóng khoáng dành cho các chàng trai.',
      };
    }
    if (genderParam === 'nu') {
      return {
        title: "WOMEN'S Y2K & STREETWEAR",
        breadcrumb: 'Thời trang Nữ',
        categoryName: 'Thời trang Nữ',
        description: 'Baby tee ôm dáng, chân váy xếp ly, áo khoác lửng và phụ kiện Y2K cá tính, tôn dáng và trẻ trung cho phái đẹp.',
      };
    }
    if (genderParam === 'unisex') {
      return {
        title: 'UNISEX EVERYDAY FIT',
        breadcrumb: 'Unisex Fit',
        categoryName: 'Unisex Fit',
        description: 'Thiết kế phi giới tính, phom rộng thoải mái (Oversized & Boxy) tự do thể hiện cá tính cho cả nam và nữ.',
      };
    }

    return {
      title: 'SMARTBUY STREETWEAR COLLECTION',
      breadcrumb: 'Tất cả Drops',
      categoryName: 'Streetwear',
      description: 'Khám phá hơn 130+ mẫu thiết kế Streetwear bốn mùa, Unisex, Y2K và Local Brand độc quyền với mức giá học sinh sinh viên từ 79.000₫ – 449.000₫.',
    };
  }, [categoryParam, seasonParam, genderParam]);

  // PHẦN 8: AI STYLIST CONTEXTUAL PROMPTS (QUẦN ÁO 4 MÙA & PHỤ KIỆN)
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
    if (categoryParam === 'hoodie-sweater') {
      return [
        'Phối Sweater với quần Jeans Baggy đi học',
        'Set Hoodie Streetwear đi chơi buổi tối',
        'Sweater phối với phụ kiện nón hay túi gì đẹp?',
        'Set đồ Sweater dưới 400k cho sinh viên',
      ];
    }
    if (categoryParam === 'phu-kien') {
      return [
        'Chọn vòng cổ bạc titan phối áo thun oversized',
        'Túi tote canvas đi học phối đồ phong cách gì?',
        'Nhẫn bạc titan Y2K và dây chuyền layer dưới 150k',
        'Phối mũ beanie với outfit streetwear mùa đông',
      ];
    }
    return [
      `Phối ${name} đi học phong cách Korean Casual`,
      `Phối ${name} đi chơi phong cách Streetwear`,
      `${name} hợp với giày và phụ kiện gì?`,
      'Gợi ý trọn set đồ 3 món dưới 400k cho sinh viên',
    ];
  }, [categoryParam, seasonParam, categoryHeaderData.categoryName]);

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

  // CỘT TRÁI: BỘ LỌC NỘI DUNG (MỞ RỘNG BỐN MÙA & PHỤ KIỆN)
  const renderFilterContent = () => (
    <div className="space-y-6 text-xs font-sans">
      {/* Bốn mùa thời trang */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#18181B] block">
          Thời trang bốn mùa
        </label>
        <div className="grid grid-cols-2 gap-1.5">
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
              className={`px-3 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                seasonParam === item.id
                  ? 'bg-[#18181B] text-white shadow-subtle'
                  : 'bg-white border border-[#E4E4E7] text-[#18181B] hover:border-[#8B5CF6] hover:bg-[#F3E8FF]/30'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Giới tính */}
      <div className="space-y-2 border-t border-[#E4E4E7] pt-4">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#18181B] block">
          Dành cho / Fit
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'nam', label: 'Nam (Boys)' },
            { id: 'nu', label: 'Nữ (Girls)' },
            { id: 'unisex', label: '⚡ Unisex' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => updateParam('gender', item.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                genderParam === item.id
                  ? 'bg-[#18181B] text-white shadow-subtle'
                  : 'bg-white border border-[#E4E4E7] text-[#18181B] hover:border-[#8B5CF6] hover:bg-[#F3E8FF]/30'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Danh mục Gen Z & Phụ kiện */}
      <div className="space-y-2 border-t border-[#E4E4E7] pt-4">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#18181B] block">
          Danh mục Quần áo & Phụ kiện
        </label>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => updateParam('category', 'all')}
            className={`w-full text-left py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
              categoryParam === 'all'
                ? 'font-bold text-[#7C3AED] bg-[#F3E8FF] border-l-2 border-[#8B5CF6]'
                : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F2F3F5]'
            }`}
          >
            <span>Tất cả sản phẩm</span>
            <span className="text-[11px] text-[#71717A]">130+</span>
          </button>
          {GENZ_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => updateParam('category', cat.slug)}
              className={`w-full text-left py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                categoryParam === cat.slug
                  ? 'font-bold text-[#7C3AED] bg-[#F3E8FF] border-l-2 border-[#8B5CF6]'
                  : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F2F3F5]'
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-[11px] text-[#71717A]">({cat.itemCount})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Khoảng giá Học sinh - Sinh viên */}
      <div className="space-y-2 border-t border-[#E4E4E7] pt-4">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#18181B] block">
          Khoảng giá sinh viên
        </label>
        <div className="space-y-1.5">
          {[
            { label: 'Tất cả mức giá', min: undefined, max: undefined },
            { label: 'Dưới 150.000₫ (Hạt dẻ)', min: undefined, max: 150000 },
            { label: '150.000₫ – 250.000₫', min: 150000, max: 250000 },
            { label: '250.000₫ – 350.000₫', min: 250000, max: 350000 },
            { label: 'Trên 350.000₫ (Cao cấp)', min: 350000, max: undefined },
          ].map((preset, idx) => {
            const isSelected =
              minPriceParam === preset.min && maxPriceParam === preset.max;
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
      </div>

      {/* Kích thước */}
      <div className="space-y-2 border-t border-[#E4E4E7] pt-4">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#18181B] block">
          Kích thước (Size)
        </label>
        <div className="grid grid-cols-4 gap-1.5">
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
      </div>

      {/* Phong cách */}
      <div className="space-y-2 border-t border-[#E4E4E7] pt-4">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#18181B] block">
          Phong cách (Vibe)
        </label>
        <div className="flex flex-wrap gap-1.5">
          {STYLE_OPTIONS.map((st) => {
            const isSelected = selectedStyles.includes(st);
            return (
              <button
                key={st}
                type="button"
                onClick={() => toggleArrayParam('style', st)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#8B5CF6] text-white'
                    : 'bg-[#F2F3F5] text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {/* Phom dáng */}
      <div className="space-y-2 border-t border-[#E4E4E7] pt-4">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#18181B] block">
          Phom dáng (Fit)
        </label>
        <div className="space-y-1">
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
      </div>

      {/* Local Brand đối tác */}
      <div className="space-y-2 border-t border-[#E4E4E7] pt-4">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#18181B] block">
          Thương hiệu đối tác
        </label>
        <div className="space-y-1">
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
      </div>

      {/* Nút xóa bộ lọc */}
      <div className="pt-4 border-t border-[#E4E4E7]">
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllFilters}
          className="w-full text-xs font-semibold"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Đặt lại bộ lọc
        </Button>
      </div>
    </div>
  );

  // CỘT PHẢI: AI STYLIST PANEL NỘI DUNG (HỖ TRỢ 4 MÙA & PHỤ KIỆN)
  const renderAIStylistPanel = () => (
    <div className="bg-white rounded-2xl border border-[#E4E4E7] shadow-subtle p-5 flex flex-col h-full max-h-[calc(100vh-8.5rem)]">
      {/* Header AI Stylist */}
      <div className="pb-4 border-b border-[#E4E4E7] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] text-[#8B5CF6] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B] flex items-center gap-1.5">
              <span>AI STYLIST</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Trực tuyến" />
            </h3>
            <p className="text-[10px] text-[#71717A]">Trợ lý phối đồ bốn mùa</p>
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
      <div className="flex-1 overflow-y-auto py-3.5 space-y-3.5 pr-1 scrollbar-thin">
        {/* Contextual Greeting */}
        <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#E4E4E7] space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#18181B]">
            <Bot className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>Tư vấn theo ngữ cảnh</span>
          </div>
          <p className="text-[11px] text-[#71717A] leading-relaxed">
            Bạn đang xem mục <strong className="text-[#8B5CF6]">{categoryHeaderData.breadcrumb}</strong>. Bạn muốn phối set bốn mùa đi học, đi chơi hay theo ngân sách sinh viên?
          </p>
        </div>

        {/* Suggestion Prompts */}
        {stylistMessages.length === 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] block">
              Gợi ý câu hỏi nhanh:
            </span>
            <div className="space-y-1.5">
              {contextualPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleConsultStylist(prompt)}
                  className="w-full text-left p-2.5 rounded-xl bg-white border border-[#E4E4E7] hover:border-[#8B5CF6] hover:bg-[#F3E8FF]/30 text-xs text-[#18181B] font-medium transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="line-clamp-1">{prompt}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-[#8B5CF6] shrink-0 ml-1 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Chat Messages Stream */}
        {stylistMessages.map((msg) => (
          <div key={msg.id} className="space-y-2.5">
            {msg.sender === 'user' ? (
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-[#18181B] text-white p-2.5 rounded-xl rounded-tr-none text-xs leading-relaxed">
                  {msg.text}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <div className="bg-[#F3E8FF]/60 border border-[#DDD6FE] p-3 rounded-xl rounded-tl-none text-xs text-[#18181B] leading-relaxed whitespace-pre-line flex-1">
                    {msg.text}
                  </div>
                </div>

                {/* Recommended Products Carousel / Grid in Panel */}
                {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] px-1">
                      Món đồ AI đề xuất cho outfit:
                    </div>
                    <div className="space-y-2">
                      {msg.recommendedProducts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-[#E4E4E7] hover:border-[#8B5CF6] transition-colors"
                        >
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-12 h-14 object-cover rounded-lg bg-[#F2F3F5] shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-[#18181B] truncate">{p.name}</h4>
                            <div className="text-[11px] font-semibold text-[#8B5CF6] mt-0.5">
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
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      ))}
                    </div>

                    {/* Nút Thử outfit này bằng AI theo Section 10 */}
                    <div className="pt-2">
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => {
                          const top = msg.recommendedProducts?.find((p) =>
                            ['ao-thun', 'hoodie-sweater', 'so-mi-polo', 'ao-khoac'].includes(p.categorySlug)
                          );
                          const bottom = msg.recommendedProducts?.find((p) =>
                            ['quan-jeans', 'quan-cargo-ong-rong', 'chan-vay-dam'].includes(p.categorySlug)
                          );
                          const accessory = msg.recommendedProducts?.find((p) => p.categorySlug === 'phu-kien');
                          const params = new URLSearchParams();
                          if (top) params.set('topId', top.id);
                          if (bottom) params.set('bottomId', bottom.id);
                          if (accessory) params.set('accId', accessory.id);
                          navigate(`/virtual-try-on?${params.toString()}`);
                        }}
                        className="w-full h-9 text-xs font-bold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white flex items-center justify-center gap-1.5 rounded-xl shadow-xs transition-all"
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
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>AI đang phân tích và tìm outfit chuẩn gu...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleConsultStylist(stylistQuery);
        }}
        className="pt-3 border-t border-[#E4E4E7] shrink-0 flex items-center gap-1.5"
      >
        <input
          type="text"
          value={stylistQuery}
          onChange={(e) => setStylistQuery(e.target.value)}
          placeholder={`Hỏi phối ${categoryHeaderData.categoryName}...`}
          disabled={isStylistLoading}
          className="flex-1 bg-[#F2F3F5] border border-[#E4E4E7] rounded-xl px-3 py-2 text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#8B5CF6] focus:bg-white transition-colors"
        />
        <Button
          type="submit"
          variant="accent"
          size="sm"
          disabled={!stylistQuery.trim() || isStylistLoading}
          className="h-9 px-3 rounded-xl shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </form>
    </div>
  );

  return (
    <div className="bg-[#FAFAF8] min-h-screen">
      {/* PHẦN 6: EDITORIAL CENTERED PAGE HEADER (TIÊU ĐỀ DANH MỤC LỚN Ở GIỮA TRANG) */}
      <div className="border-b border-[#E4E4E7] bg-white py-10 sm:py-14 text-center">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb nhỏ căn giữa */}
          <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider text-[#71717A] mb-3">
            <Link to="/" className="hover:text-[#18181B] transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <span className="text-[#71717A]">Catalog</span>
            <span>/</span>
            <span className="text-[#8B5CF6] font-bold">{categoryHeaderData.breadcrumb}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3E8FF] text-[#7C3AED] text-[10px] font-bold uppercase mb-3 border border-[#DDD6FE]">
            <Sparkles className="w-3 h-3 text-[#8B5CF6]" />
            <span>GEN Z STREETWEAR & ACCESSORIES DROPS</span>
          </div>

          {/* Tiêu đề danh mục cực lớn căn giữa */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-[#18181B] uppercase font-sans max-w-4xl mx-auto transition-all duration-300">
            {categoryHeaderData.title}
          </h1>

          {/* Mô tả ngắn căn giữa */}
          <p className="text-xs sm:text-sm text-[#71717A] mt-3 max-w-2xl mx-auto text-center leading-relaxed">
            {categoryHeaderData.description}
          </p>

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-xs text-[#18181B] bg-[#F2F3F5] px-4 py-1.5 rounded-full border border-[#E4E4E7] font-semibold">
              Đang có <strong className="text-[#8B5CF6]">{allFilteredProducts.length}</strong> sản phẩm phù hợp
            </span>
          </div>
        </div>
      </div>

      {/* QUICK FILTER PILLS BAR */}
      <div className="border-b border-[#E4E4E7] bg-white/90 sticky top-20 z-20 backdrop-blur-md shadow-subtle">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-bold uppercase text-[#71717A] shrink-0 mr-1 hidden sm:inline">
              Lọc nhanh:
            </span>
            {QUICK_FILTER_PILLS.map((pill) => {
              const isActive =
                (pill.id === 'all' &&
                  categoryParam === 'all' &&
                  genderParam === 'all' &&
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
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#8B5CF6] text-white shadow-accent ring-1 ring-[#8B5CF6]'
                      : 'bg-[#F2F3F5] border border-[#E4E4E7] text-[#18181B] hover:border-[#8B5CF6] hover:bg-[#F3E8FF]/40'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* PHẦN 7: BỐ CỤC 3 KHU VỰC DESKTOP [BỘ LỌC (3/12) | SẢN PHẨM (6/12) | AI STYLIST (3/12)] */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar: Mobile trigger + Active chips + Sort */}
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#E4E4E7] mb-6 gap-3">
          {/* Mobile buttons */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#18181B] text-white text-xs font-semibold cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#DDD6FE]" />
              <span>Bộ lọc {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
            </button>

            <button
              onClick={() => setIsMobileAIStylistOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#F3E8FF] text-[#7C3AED] text-xs font-bold border border-[#DDD6FE] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>AI Stylist</span>
            </button>
          </div>

          {/* Desktop filter indicator */}
          <div className="hidden lg:flex items-center text-xs text-[#71717A] gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
            <span>Layout 3 vùng: Bộ lọc • Danh sách sản phẩm • Tư vấn AI Stylist</span>
          </div>

          {/* Sort Select */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-[#71717A] hidden sm:inline font-medium">SẮP XẾP:</span>
            <select
              value={sortParam}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="text-xs font-semibold bg-white border border-[#E4E4E7] rounded-lg px-3 py-2 text-[#18181B] focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
            >
              <option value="newest">Mới nhất (Latest Drop)</option>
              <option value="price-asc">Giá: Thấp → Cao (Sinh viên)</option>
              <option value="price-desc">Giá: Cao → Thấp</option>
              <option value="rating-desc">Đánh giá tốt nhất</option>
              <option value="name-asc">Tên sản phẩm A → Z</option>
            </select>
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
                  className="hover:text-[#DC2626] ml-1"
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
                  className="hover:text-[#DC2626] ml-1"
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
                  className="hover:text-[#DDD6FE] ml-1"
                  aria-label="Xóa lọc giới tính"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {categoryParam !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F3E8FF] text-[#7C3AED] font-semibold border border-[#DDD6FE]">
                {GENZ_CATEGORIES.find((c) => c.slug === categoryParam)?.name || categoryParam}
                <button
                  onClick={() => updateParam('category', null)}
                  className="hover:text-[#DC2626] ml-1"
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
                  className="hover:text-[#DC2626] ml-1"
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
                  className="hover:text-[#DC2626] ml-1"
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
                  className="hover:text-[#DC2626] ml-1"
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

        {/* 3-COLUMN LAYOUT: Bộ lọc (3) | Sản phẩm (6) | AI Stylist (3) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-7 items-start">
          {/* CỘT TRÁI — BỘ LỌC (20–22%, lg:col-span-3) */}
          <div className="hidden lg:block lg:col-span-3 bg-white rounded-2xl p-5 border border-[#E4E4E7] shadow-subtle sticky top-28 max-h-[calc(100vh-8.5rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E4E4E7]">
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
          </div>

          {/* CỘT GIỮA — DANH SÁCH SẢN PHẨM (~54%, lg:col-span-6) */}
          <div className="lg:col-span-6">
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
                    Không có sản phẩm nào khớp với bộ lọc hiện tại. Thử nới rộng mức giá hoặc chọn danh mục khác.
                  </p>
                </div>
                <Button variant="accent" size="sm" onClick={clearAllFilters} className="text-xs font-bold">
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  XÓA BỘ LỌC VÀ XEM TẤT CẢ (130+)
                </Button>
              </div>
            ) : (
              <>
                {/* Responsive grid 2-3 cột */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
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
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4 mt-4">
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

                {/* PHẦN 10.1: HYBRID PAGINATION & PROGRESS */}
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
                        className="px-8 py-3 text-xs font-bold tracking-wider uppercase hover:bg-[#F3E8FF] hover:border-[#8B5CF6] hover:text-[#7C3AED]"
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
          </div>

          {/* CỘT PHẢI — AI STYLIST (22–24%, lg:col-span-3) */}
          <div className="hidden lg:block lg:col-span-3 sticky top-28">
            {renderAIStylistPanel()}
          </div>
        </div>
      </div>

      {/* Mobile Floating Button to open AI Stylist */}
      <button
        type="button"
        onClick={() => setIsMobileAIStylistOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 bg-[#18181B] text-white rounded-full shadow-modal hover:bg-[#8B5CF6] transition-all cursor-pointer font-bold text-xs"
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
            >
              XÓA LỌC
            </Button>
            <Button
              variant="accent"
              size="sm"
              onClick={() => setIsMobileFilterOpen(false)}
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
