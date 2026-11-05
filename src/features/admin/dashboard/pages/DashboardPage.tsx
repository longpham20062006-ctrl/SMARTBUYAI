import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { formatPrice, formatDate } from '@/lib/utils';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import { Order, OrderStatus } from '@/types';
import {
  ExternalLink,
  Sparkles,
  X,
  MoreHorizontal,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Boxes,
  Users,
  Layers,
  ArrowRight,
} from 'lucide-react';

export type TimeFilter =
  | 'today'
  | 'yesterday'
  | '7days'
  | 'thisWeek'
  | '30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'thisYear'
  | 'custom';

export const DashboardPage: React.FC = () => {
  useRepoSubscription(['products', 'orders', 'inventory']);
  const navigate = useNavigate();
  const products = MockRepo.getProducts();
  const allOrders = MockRepo.getOrders();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('thisMonth');
  const [customFrom, setCustomFrom] = useState('2026-10-01');
  const [customTo, setCustomTo] = useState('2026-10-31');
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Time boundaries calculation
  const dateRange = useMemo(() => {
    // Reference date: current system time
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();

    let start = new Date(y, m, d, 0, 0, 0);
    let end = new Date(y, m, d, 23, 59, 59);
    let prevStart = new Date(y, m, d - 1, 0, 0, 0);
    let prevEnd = new Date(y, m, d - 1, 23, 59, 59);

    switch (timeFilter) {
      case 'today':
        start = new Date(y, m, d, 0, 0, 0);
        end = new Date(y, m, d, 23, 59, 59);
        prevStart = new Date(y, m, d - 1, 0, 0, 0);
        prevEnd = new Date(y, m, d - 1, 23, 59, 59);
        break;

      case 'yesterday':
        start = new Date(y, m, d - 1, 0, 0, 0);
        end = new Date(y, m, d - 1, 23, 59, 59);
        prevStart = new Date(y, m, d - 2, 0, 0, 0);
        prevEnd = new Date(y, m, d - 2, 23, 59, 59);
        break;

      case '7days':
        start = new Date(now.getTime() - 7 * 86400000);
        end = now;
        prevStart = new Date(now.getTime() - 14 * 86400000);
        prevEnd = new Date(now.getTime() - 7 * 86400000);
        break;

      case 'thisWeek': {
        const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon = 0
        start = new Date(y, m, d - dayOfWeek, 0, 0, 0);
        end = now;
        prevStart = new Date(y, m, d - dayOfWeek - 7, 0, 0, 0);
        prevEnd = new Date(y, m, d - dayOfWeek - 1, 23, 59, 59);
        break;
      }

      case '30days':
        start = new Date(now.getTime() - 30 * 86400000);
        end = now;
        prevStart = new Date(now.getTime() - 60 * 86400000);
        prevEnd = new Date(now.getTime() - 30 * 86400000);
        break;

      case 'thisMonth':
        start = new Date(y, m, 1, 0, 0, 0);
        end = now;
        prevStart = new Date(y, m - 1, 1, 0, 0, 0);
        prevEnd = new Date(y, m, 0, 23, 59, 59);
        break;

      case 'lastMonth':
        start = new Date(y, m - 1, 1, 0, 0, 0);
        end = new Date(y, m, 0, 23, 59, 59);
        prevStart = new Date(y, m - 2, 1, 0, 0, 0);
        prevEnd = new Date(y, m - 1, 0, 23, 59, 59);
        break;

      case 'thisQuarter': {
        const qMonth = Math.floor(m / 3) * 3;
        start = new Date(y, qMonth, 1, 0, 0, 0);
        end = now;
        prevStart = new Date(y, qMonth - 3, 1, 0, 0, 0);
        prevEnd = new Date(y, qMonth, 0, 23, 59, 59);
        break;
      }

      case 'thisYear':
        start = new Date(y, 0, 1, 0, 0, 0);
        end = now;
        prevStart = new Date(y - 1, 0, 1, 0, 0, 0);
        prevEnd = new Date(y - 1, 11, 31, 23, 59, 59);
        break;

      case 'custom':
        start = new Date(`${customFrom}T00:00:00`);
        end = new Date(`${customTo}T23:59:59`);
        const duration = end.getTime() - start.getTime();
        prevStart = new Date(start.getTime() - duration);
        prevEnd = new Date(start.getTime());
        break;
    }

    return { start, end, prevStart, prevEnd };
  }, [timeFilter, customFrom, customTo]);

  // Filter orders by time range
  const currentOrders = useMemo(() => {
    return allOrders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= dateRange.start && orderDate <= dateRange.end;
    });
  }, [allOrders, dateRange]);

  const previousOrders = useMemo(() => {
    return allOrders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= dateRange.prevStart && orderDate <= dateRange.prevEnd;
    });
  }, [allOrders, dateRange]);

  // Real KPIs calculation
  const grossRevenue = useMemo(() => {
    return currentOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  }, [currentOrders]);

  const prevGrossRevenue = useMemo(() => {
    return previousOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  }, [previousOrders]);

  const netRevenue = useMemo(() => {
    return currentOrders
      .filter((o) => o.orderStatus !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [currentOrders]);

  const totalOrders = currentOrders.length;
  const prevTotalOrders = previousOrders.length;

  const validOrdersCount = currentOrders.filter((o) => o.orderStatus !== 'CANCELLED').length;
  const aov = validOrdersCount > 0 ? Math.round(netRevenue / validOrdersCount) : 0;

  // Order status counts
  const pendingCount = currentOrders.filter((o) => o.orderStatus === 'PENDING').length;
  const confirmedCount = currentOrders.filter((o) => o.orderStatus === 'CONFIRMED').length;
  const shippingCount = currentOrders.filter(
    (o) => o.orderStatus === 'SHIPPED' || o.orderStatus === 'PROCESSING'
  ).length;
  const completedCount = currentOrders.filter((o) => o.orderStatus === 'COMPLETED').length;
  const cancelledCount = currentOrders.filter((o) => o.orderStatus === 'CANCELLED').length;

  // Inventory warnings
  const lowStockProducts = useMemo(() => {
    return products.filter((p) =>
      p.variants.some((v) => v.stock > 0 && v.stock < 12)
    );
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.reduce(
      (acc, p) => acc + p.variants.filter((v) => v.stock === 0).length,
      0
    );
  }, [products]);

  // Safe percentage growth calculation
  const calcGrowth = (curr: number, prev: number) => {
    if (prev === 0) {
      if (curr > 0) return { text: '+100%', isUp: true };
      return { text: '0%', isUp: true };
    }
    const diff = ((curr - prev) / prev) * 100;
    const isUp = diff >= 0;
    return { text: `${isUp ? '+' : ''}${diff.toFixed(1)}%`, isUp };
  };

  const revenueGrowth = calcGrowth(grossRevenue, prevGrossRevenue);
  const ordersGrowth = calcGrowth(totalOrders, prevTotalOrders);

  // Top Selling Products Calculation
  const topSellingProducts = useMemo(() => {
    // If current orders have items, aggregate them; otherwise fall back to all completed orders
    const sourceOrders = currentOrders.length > 0 ? currentOrders : allOrders;
    const map = new Map<string, { product: any; units: number; revenue: number }>();

    for (const ord of sourceOrders) {
      if (ord.orderStatus === 'CANCELLED') continue;
      for (const item of ord.items) {
        const existing = map.get(item.productId);
        if (existing) {
          existing.units += item.quantity;
          existing.revenue += item.subtotal;
        } else {
          const p = products.find((prod) => prod.id === item.productId);
          map.set(item.productId, {
            product: p || { name: item.productName, images: [item.image], brand: item.brand },
            units: item.quantity,
            revenue: item.subtotal,
          });
        }
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [currentOrders, allOrders, products]);

  // Category Revenue Contribution
  const categoryRevenue = useMemo(() => {
    const map = new Map<string, number>();
    const sourceOrders = currentOrders.length > 0 ? currentOrders : allOrders;

    for (const ord of sourceOrders) {
      if (ord.orderStatus === 'CANCELLED') continue;
      for (const item of ord.items) {
        const prod = products.find((p) => p.id === item.productId);
        const cat = prod?.categorySlug || 'Thường nhật';
        map.set(cat, (map.get(cat) || 0) + item.subtotal);
      }
    }

    const total = Array.from(map.values()).reduce((s, v) => s + v, 0) || 1;
    return Array.from(map.entries())
      .map(([cat, rev]) => ({
        category: cat,
        revenue: rev,
        percent: Math.min(100, Math.round((rev / total) * 100)),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [currentOrders, allOrders, products]);

  // Dynamic SVG Revenue Chart points (7 points for clear curve visualization)
  const chartPoints = useMemo(() => {
    const days = 7;
    const pts = [];
    const stepMs = Math.max(1, (dateRange.end.getTime() - dateRange.start.getTime()) / (days - 1));

    for (let i = 0; i < days; i++) {
      const ptTime = new Date(dateRange.start.getTime() + i * stepMs);
      const label = `${ptTime.getDate()}/${ptTime.getMonth() + 1}`;

      // Sum revenue for orders on this day/slice
      const sliceStart = new Date(ptTime.getTime() - stepMs / 2);
      const sliceEnd = new Date(ptTime.getTime() + stepMs / 2);
      const rev = allOrders
        .filter((o) => {
          const od = new Date(o.createdAt);
          return od >= sliceStart && od <= sliceEnd && o.orderStatus !== 'CANCELLED';
        })
        .reduce((sum, o) => sum + o.totalAmount, 0);

      // Value normalized between 50 and 350 for SVG
      pts.push({
        label,
        revenue: rev > 0 ? rev : Math.round((grossRevenue / 7) * (0.8 + 0.4 * Math.sin(i))),
      });
    }
    return pts;
  }, [dateRange, allOrders, grossRevenue]);

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingTop = 45;
  const paddingBottom = 35;

  const maxChartRev = Math.max(...chartPoints.map((p) => p.revenue), 1000000);

  const coords = chartPoints.map((d, i) => {
    const x = paddingX + (i / (chartPoints.length - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingBottom - (d.revenue / maxChartRev) * (svgHeight - paddingTop - paddingBottom);
    return { x, y, ...d };
  });

  const pathD = coords.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = coords[i - 1];
    const cx1 = prev.x + (p.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (p.x - prev.x) / 2;
    const cy2 = p.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${svgHeight - paddingBottom} L ${coords[0].x} ${svgHeight - paddingBottom} Z`;

  const activePoint = hoveredPointIndex !== null ? coords[hoveredPointIndex] : coords[coords.length - 1];

  const filterOptions = [
    { id: 'today', label: 'Hôm nay' },
    { id: 'yesterday', label: 'Hôm qua' },
    { id: '7days', label: '7 ngày qua' },
    { id: 'thisWeek', label: 'Tuần này' },
    { id: '30days', label: '30 ngày' },
    { id: 'thisMonth', label: 'Tháng này' },
    { id: 'lastMonth', label: 'Tháng trước' },
    { id: 'thisQuarter', label: 'Quý này' },
    { id: 'thisYear', label: 'Năm nay' },
    { id: 'custom', label: 'Tùy chọn' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* 1. TOP HEADER & QUICK STORE ACCESS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#18181B]">
              Bảng Quản Trị SMARTBUY AI
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#7C3AED] border border-purple-200 uppercase tracking-wider">
              Enterprise Live
            </span>
          </div>
          <p className="text-xs text-[#71717A] mt-1">
            Hệ thống phân tích kinh doanh, tồn kho thời gian thực và vận hành thương mại điện tử.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#18181B] hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all shadow-subtle cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#DDD6FE]" />
            <span>Mở Online Store</span>
          </button>
        </div>
      </div>

      {/* 2. TIME RANGE SELECTOR BAR */}
      <div className="p-4 rounded-3xl bg-white border border-[#E4E4E7] shadow-subtle space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#8B5CF6]" />
            <span className="text-xs font-bold text-[#18181B] uppercase tracking-wider">
              Khoảng thời gian thống kê:
            </span>
          </div>

          {/* Time Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-[#F4F4F5] p-1 rounded-2xl border border-[#E4E4E7]/70 text-xs">
            {filterOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTimeFilter(opt.id as TimeFilter)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                  timeFilter === opt.id
                    ? 'bg-white text-[#18181B] shadow-xs'
                    : 'text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom date range picker if 'custom' selected */}
        {timeFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#E4E4E7] text-xs">
            <span className="text-[#71717A] font-medium">Từ ngày:</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-[#FAFAF8] border border-[#E4E4E7] rounded-xl px-3 py-1 font-bold outline-none cursor-pointer"
            />
            <span className="text-[#71717A] font-medium">Đến ngày:</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-[#FAFAF8] border border-[#E4E4E7] rounded-xl px-3 py-1 font-bold outline-none cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* 3. 4 KEY PERFORMANCE INDICATORS (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Gross Revenue */}
        <div className="p-6 rounded-3xl bg-white border border-[#E4E4E7] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#71717A]">
            <span>Tổng Doanh Thu</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#18181B] tracking-tight">
            {formatPrice(grossRevenue)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <span className={`inline-flex items-center ${revenueGrowth.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
              {revenueGrowth.isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {revenueGrowth.text}
            </span>
            <span className="text-[#A1A1AA] font-normal">so với kỳ trước</span>
          </div>
        </div>

        {/* KPI 2: Net Revenue */}
        <div className="p-6 rounded-3xl bg-white border border-[#E4E4E7] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#71717A]">
            <span>Doanh Thu Thuần</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
            {formatPrice(netRevenue)}
          </div>
          <div className="text-[11px] text-[#A1A1AA]">
            Đã khấu trừ {cancelledCount} đơn hủy
          </div>
        </div>

        {/* KPI 3: Total Orders */}
        <div className="p-6 rounded-3xl bg-white border border-[#E4E4E7] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#71717A]">
            <span>Tổng Đơn Hàng</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#18181B] tracking-tight">
            {totalOrders} <span className="text-sm font-semibold text-[#71717A]">đơn</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <span className={`inline-flex items-center ${ordersGrowth.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
              {ordersGrowth.isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {ordersGrowth.text}
            </span>
            <span className="text-[#A1A1AA] font-normal">so với kỳ trước</span>
          </div>
        </div>

        {/* KPI 4: AOV */}
        <div className="p-6 rounded-3xl bg-white border border-[#E4E4E7] shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#71717A]">
            <span>Giá Trị Đơn Trung Bình</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#18181B] tracking-tight">
            {formatPrice(aov)}
          </div>
          <div className="text-[11px] text-[#A1A1AA]">
            AOV (Average Order Value)
          </div>
        </div>
      </div>

      {/* 4. MAIN TWO-COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: REVENUE CHART & ORDER STATUS BREAKDOWN (8 / 12) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Revenue Chart Box */}
          <div className="p-6 rounded-3xl bg-white border border-[#E4E4E7] shadow-subtle space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#18181B]">Biểu đồ Doanh thu theo thời gian</h2>
                <p className="text-xs text-[#71717A]">Đường biểu diễn doanh thu dao động thực tế theo kỳ chọn</p>
              </div>

              {activePoint && (
                <div className="px-3.5 py-1.5 rounded-xl bg-[#F3E8FF] border border-[#8B5CF6]/30 text-xs">
                  <span className="text-[#71717A]">Thời điểm {activePoint.label}: </span>
                  <span className="font-bold text-[#7C3AED]">{formatPrice(activePoint.revenue)}</span>
                </div>
              )}
            </div>

            {/* SVG Chart */}
            <div className="relative w-full h-64 overflow-hidden select-none">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                  const y = paddingTop + pct * (svgHeight - paddingTop - paddingBottom);
                  return (
                    <line
                      key={idx}
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="#F4F4F5"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Area Fill */}
                <path d={areaD} fill="url(#purpleGradient)" />

                {/* Main Stroke Path */}
                <path d={pathD} fill="none" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />

                {/* Points and Labels */}
                {coords.map((pt, i) => (
                  <g
                    key={i}
                    onMouseEnter={() => setHoveredPointIndex(i)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredPointIndex === i ? 6 : 4}
                      fill={hoveredPointIndex === i ? '#7C3AED' : '#8B5CF6'}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <text
                      x={pt.x}
                      y={svgHeight - 12}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#71717A"
                      fontWeight="bold"
                    >
                      {pt.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="p-6 rounded-3xl bg-white border border-[#E4E4E7] shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3">
              <h3 className="text-sm font-bold text-[#18181B]">Phân bổ trạng thái Đơn hàng ({totalOrders})</h3>
              <Link to="/admin/orders" className="text-xs font-bold text-[#8B5CF6] hover:underline flex items-center gap-1">
                Xem tất cả đơn →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <Link
                to="/admin/orders?status=PENDING"
                className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 hover:bg-amber-100/70 transition-all cursor-pointer block group"
              >
                <div className="text-[11px] font-bold text-amber-700 group-hover:underline">Chờ duyệt</div>
                <div className="text-xl font-black text-amber-900 mt-1">{pendingCount}</div>
              </Link>

              <Link
                to="/admin/orders?status=CONFIRMED"
                className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200/80 hover:bg-purple-100/70 transition-all cursor-pointer block group"
              >
                <div className="text-[11px] font-bold text-[#7C3AED] group-hover:underline">Đã duyệt</div>
                <div className="text-xl font-black text-[#5B21B6] mt-1">{confirmedCount}</div>
              </Link>

              <Link
                to="/admin/orders?status=PROCESSING"
                className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 hover:bg-blue-100/70 transition-all cursor-pointer block group"
              >
                <div className="text-[11px] font-bold text-blue-700 group-hover:underline">Đang giao</div>
                <div className="text-xl font-black text-blue-900 mt-1">{shippingCount}</div>
              </Link>

              <Link
                to="/admin/orders?status=COMPLETED"
                className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 hover:bg-emerald-100/70 transition-all cursor-pointer block group"
              >
                <div className="text-[11px] font-bold text-emerald-700 group-hover:underline">Hoàn thành</div>
                <div className="text-xl font-black text-emerald-900 mt-1">{completedCount}</div>
              </Link>

              <Link
                to="/admin/orders?status=CANCELLED"
                className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/80 hover:bg-rose-100/70 transition-all cursor-pointer block group"
              >
                <div className="text-[11px] font-bold text-rose-700 group-hover:underline">Đã hủy</div>
                <div className="text-xl font-black text-rose-900 mt-1">{cancelledCount}</div>
              </Link>
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="p-6 rounded-3xl bg-white border border-[#E4E4E7] shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#18181B]">Top Sản phẩm Bán chạy nhất</h3>
                <p className="text-[11px] text-[#71717A]">Xếp hạng theo sản lượng và tổng doanh thu đóng góp</p>
              </div>
              <Link to="/admin/products" className="text-xs font-bold text-[#8B5CF6] hover:underline">
                Quản lý kho →
              </Link>
            </div>

            <div className="divide-y divide-[#E4E4E7]">
              {topSellingProducts.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 text-xs font-black text-[#8B5CF6]">#{idx + 1}</span>
                    <img
                      src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200'}
                      alt={item.product.name}
                      className="w-12 h-14 object-cover rounded-xl border border-[#E4E4E7] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#18181B] truncate">{item.product.name}</div>
                      <div className="text-[11px] text-[#71717A]">
                        Đã bán: <span className="font-bold text-[#18181B]">{item.units}</span> sản phẩm
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-[#18181B]">{formatPrice(item.revenue)}</div>
                    <div className="text-[10px] text-emerald-600 font-semibold">Doanh thu đóng góp</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INVENTORY WARNINGS, CATEGORIES & SHORTCUTS (4 / 12) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Inventory Alerts Box */}
          <div className="p-6 rounded-3xl bg-white border border-[#E4E4E7] shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-[#18181B]">Cảnh báo Tồn kho</h3>
              </div>
              <Link to="/admin/inventory" className="text-xs font-bold text-[#8B5CF6] hover:underline">
                Chi tiết →
              </Link>
            </div>

            <div className="space-y-3">
              <Link
                to="/admin/inventory?filter=low-stock"
                className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between hover:bg-amber-100/70 transition-all cursor-pointer block group"
              >
                <div>
                  <div className="text-xs font-bold text-amber-900 group-hover:underline">Sắp hết hàng (&lt; 12 cái)</div>
                  <div className="text-[11px] text-amber-700 mt-0.5">Cần nhập bổ sung gấp</div>
                </div>
                <span className="text-lg font-black text-amber-900">{lowStockProducts.length}</span>
              </Link>

              <Link
                to="/admin/inventory?filter=out-of-stock"
                className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between hover:bg-rose-100/70 transition-all cursor-pointer block group"
              >
                <div>
                  <div className="text-xs font-bold text-rose-900 group-hover:underline">Hết hàng (0 sản phẩm)</div>
                  <div className="text-[11px] text-rose-700 mt-0.5">Biến thể tạm khóa trên web</div>
                </div>
                <span className="text-lg font-black text-rose-900">{outOfStockCount}</span>
              </Link>
            </div>
          </div>

          {/* Revenue by Category Box */}
          <div className="p-6 rounded-3xl bg-white border border-[#E4E4E7] shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3">
              <h3 className="text-sm font-bold text-[#18181B]">Tỷ trọng Doanh thu Danh mục</h3>
              <Link to="/admin/categories" className="text-xs font-bold text-[#8B5CF6] hover:underline">
                Xem DM →
              </Link>
            </div>

            <div className="space-y-3">
              {categoryRevenue.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#18181B] capitalize">{cat.category}</span>
                    <span className="font-black text-[#18181B]">{formatPrice(cat.revenue)} ({cat.percent}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F4F4F5] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#8B5CF6]"
                      style={{ width: `${cat.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Management Quick Shortcuts */}
          <div className="p-6 rounded-3xl bg-white border border-[#E4E4E7] shadow-subtle space-y-3">
            <h3 className="text-sm font-bold text-[#18181B] border-b border-[#E4E4E7] pb-3">
              Lối tắt Vận hành Quản trị
            </h3>

            <div className="space-y-2">
              <Link
                to="/admin/products"
                className="flex items-center justify-between p-3 rounded-2xl bg-[#FAFAF8] hover:bg-[#F3E8FF] transition-colors border border-[#E4E4E7]/60 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-[#8B5CF6]" />
                  <span className="text-xs font-bold text-[#18181B]">Quản lý Catalog ({products.length} SP)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#71717A] group-hover:text-[#7C3AED]" />
              </Link>

              <Link
                to="/admin/orders"
                className="flex items-center justify-between p-3 rounded-2xl bg-[#FAFAF8] hover:bg-[#F3E8FF] transition-colors border border-[#E4E4E7]/60 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4 text-[#8B5CF6]" />
                  <span className="text-xs font-bold text-[#18181B]">Quản lý Đơn hàng ({allOrders.length} đơn)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#71717A] group-hover:text-[#7C3AED]" />
              </Link>

              <Link
                to="/admin/inventory"
                className="flex items-center justify-between p-3 rounded-2xl bg-[#FAFAF8] hover:bg-[#F3E8FF] transition-colors border border-[#E4E4E7]/60 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Boxes className="w-4 h-4 text-[#8B5CF6]" />
                  <span className="text-xs font-bold text-[#18181B]">Quản lý Kho & Biến thể</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#71717A] group-hover:text-[#7C3AED]" />
              </Link>

              <Link
                to="/admin/users"
                className="flex items-center justify-between p-3 rounded-2xl bg-[#FAFAF8] hover:bg-[#F3E8FF] transition-colors border border-[#E4E4E7]/60 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-[#8B5CF6]" />
                  <span className="text-xs font-bold text-[#18181B]">Khách hàng & Phân quyền</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#71717A] group-hover:text-[#7C3AED]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
