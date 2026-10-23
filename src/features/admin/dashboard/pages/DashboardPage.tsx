import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { formatPrice } from '@/lib/utils';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import {
  ExternalLink,
  Sparkles,
  X,
  MoreHorizontal,
  ChevronRight,
  Bell,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  useRepoSubscription(['products', 'orders', 'inventory']);
  const navigate = useNavigate();
  const products = MockRepo.getProducts();
  const orders = MockRepo.getOrders();

  const [timeRange, setTimeRange] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Week');
  const [revenuePeriod, setRevenuePeriod] = useState('Last Year');
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(8); // Default to September (index 8)

  // Real KPIs calculation
  const totalRevenue = orders
    .filter((o) => o.orderStatus !== 'CANCELLED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.orderStatus === 'PENDING').length;

  const lowStockCount = products.reduce((acc, p) => {
    return acc + p.variants.filter((v) => v.stock > 0 && v.stock < 12).length;
  }, 0);

  const soldOutCount = products.reduce((acc, p) => {
    return acc + p.variants.filter((v) => v.stock === 0).length;
  }, 0);

  // Revenue chart data points (12 months: Jan -> Dec)
  const chartData = [
    { month: 'Jan', value: 250, revenue: '1.250.000₫', change: '+3.2%' },
    { month: 'Feb', value: 240, revenue: '1.180.000₫', change: '-1.4%' },
    { month: 'Mar', value: 270, revenue: '1.450.000₫', change: '+5.0%' },
    { month: 'Apr', value: 230, revenue: '1.090.000₫', change: '-2.1%' },
    { month: 'May', value: 280, revenue: '1.620.000₫', change: '+7.4%' },
    { month: 'Jun', value: 260, revenue: '1.380.000₫', change: '+1.8%' },
    { month: 'Jul', value: 310, revenue: '1.890.000₫', change: '+6.5%' },
    { month: 'Aug', value: 300, revenue: '1.750.000₫', change: '+2.0%' },
    { month: 'Sep', value: 380, revenue: '2.420.000₫', change: '+2.4%' },
    { month: 'Oct', value: 350, revenue: '2.100.000₫', change: '+4.1%' },
    { month: 'Nov', value: 370, revenue: '2.310.000₫', change: '+5.8%' },
    { month: 'Dec', value: 390, revenue: '2.680.000₫', change: '+8.2%' },
  ];

  // SVG Area Chart points
  // Width: 600, Height: 240. Padding left: 30, right: 30, top: 40, bottom: 30.
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 35;
  const paddingTop = 45;
  const paddingBottom = 30;

  const points = chartData.map((d, i) => {
    const x = paddingX + (i / (chartData.length - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingBottom - ((d.value - 150) / 280) * (svgHeight - paddingTop - paddingBottom);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cx1 = prev.x + (p.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (p.x - prev.x) / 2;
    const cy2 = p.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`;

  // Selected tooltip point
  const activePoint = hoveredMonth !== null ? points[hoveredMonth] : points[8];

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* 4.2. HEADER DASHBOARD (Hello, SMARTBUY! + Open Site) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#18181B]">
            Hello, SMARTBUY!
          </h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            E-commerce Analytics & Store Operation Dashboard
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#18181B] hover:bg-[#303036] text-white text-xs font-bold rounded-full transition-all shadow-subtle cursor-pointer self-start sm:self-auto"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#DDD6FE]" />
          <span>Open Site</span>
        </button>
      </div>

      {/* Notice / Plan Upgrade Banner */}
      {!isBannerDismissed && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E4E4E7] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#F4F4F5] flex items-center justify-center text-[#18181B] shrink-0">
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-[#18181B]">
                Upgrade your plan to unlock advanced features
              </span>
              <span className="text-[#71717A] hidden md:inline ml-1.5">
                • Trợ lý AI Stylist đa kênh và báo cáo phân tích thời trang tự động.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
            <Link
              to="/admin/products"
              className="text-xs font-bold text-[#18181B] hover:text-[#8B5CF6] hover:underline"
            >
              Select Plan
            </Link>
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="p-1 text-[#71717A] hover:text-[#18181B] rounded-lg transition-colors cursor-pointer"
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (8 / 12) — OVERVIEW PERFORMANCE & REVENUE CHART */}
        <div className="lg:col-span-8 space-y-6">
          {/* Overview Performance Section */}
          <div className="p-6 rounded-3xl bg-white border border-[#E4E4E7] shadow-subtle space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base font-bold text-[#18181B]">Overview performance</h2>

              {/* Time Filters: Day | Week | Month | Year */}
              <div className="inline-flex p-1 bg-[#F4F4F5] rounded-xl border border-[#E4E4E7]/70 self-start sm:self-auto text-xs font-semibold">
                {(['Day', 'Week', 'Month', 'Year'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setTimeRange(tab)}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      timeRange === tab
                        ? 'bg-white text-[#18181B] shadow-2xs font-bold'
                        : 'text-[#71717A] hover:text-[#18181B]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* 4.3. KPI CARDS (2x2 Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-1">
              {/* Card 1: Total Views */}
              <div className="space-y-1.5 p-1">
                <div className="text-xs font-medium text-[#71717A]">Total Views</div>
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl sm:text-3xl font-black text-[#18181B] tracking-tight">
                    5.094
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#16A34A]">
                    <ArrowUpRight className="w-3 h-3" />
                    43%
                  </span>
                </div>
                <div className="text-[11px] text-[#A1A1AA]">From last 732 (last 7 days)</div>
              </div>

              {/* Card 2: Visits */}
              <div className="space-y-1.5 p-1">
                <div className="text-xs font-medium text-[#71717A]">Visits</div>
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl sm:text-3xl font-black text-[#18181B] tracking-tight">
                    794
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#16A34A]">
                    <ArrowUpRight className="w-3 h-3" />
                    34%
                  </span>
                </div>
                <div className="text-[11px] text-[#A1A1AA]">From last 732 (last 7 days)</div>
              </div>

              {/* Card 3: Orders */}
              <div className="space-y-1.5 p-1 border-t border-[#E4E4E7]/60 pt-4 sm:pt-4">
                <div className="text-xs font-medium text-[#71717A]">Orders</div>
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl sm:text-3xl font-black text-[#18181B] tracking-tight">
                    {totalOrdersCount}
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#16A34A]">
                    <ArrowUpRight className="w-3 h-3" />
                    34%
                  </span>
                </div>
                <div className="text-[11px] text-[#A1A1AA]">
                  {pendingOrdersCount} đơn chờ xử lý
                </div>
              </div>

              {/* Card 4: Conversion Rate */}
              <div className="space-y-1.5 p-1 border-t border-[#E4E4E7]/60 pt-4 sm:pt-4">
                <div className="text-xs font-medium text-[#71717A]">Conversion Rate</div>
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl sm:text-3xl font-black text-[#18181B] tracking-tight">
                    78%
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FEE2E2] text-[#DC2626]">
                    <ArrowDownRight className="w-3 h-3" />
                    0.6%
                  </span>
                </div>
                <div className="text-[11px] text-[#A1A1AA]">From last 732 (last 7 days)</div>
              </div>
            </div>
          </div>

          {/* 4.4. REVENUE SECTION WITH LARGE INTERACTIVE CHART */}
          <div className="p-6 rounded-3xl bg-white border border-[#E4E4E7] shadow-subtle space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#18181B]">Revenue</h2>

              <div className="flex items-center gap-2">
                <select
                  value={revenuePeriod}
                  onChange={(e) => setRevenuePeriod(e.target.value)}
                  className="bg-[#F4F4F5] border border-[#E4E4E7]/70 rounded-xl px-3 py-1.5 text-xs font-bold text-[#18181B] focus:outline-none cursor-pointer"
                >
                  <option value="Last Year">Last Year</option>
                  <option value="This Year">This Year</option>
                  <option value="Last 6 Months">Last 6 Months</option>
                </select>
                <button
                  className="p-1.5 rounded-xl hover:bg-[#F4F4F5] text-[#71717A] cursor-pointer"
                  aria-label="Thao tác khác"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Total Revenue Numbers */}
            <div className="space-y-1">
              <div className="text-xs text-[#71717A] font-medium">Total Revenue</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#18181B] tracking-tight">
                  {formatPrice(totalRevenue || 14020110)}
                </span>
              </div>
              <div className="text-xs text-[#71717A]">
                You gained <strong className="text-[#18181B] font-semibold">+420.000₫</strong> this month
              </div>
            </div>

            {/* Interactive SVG Chart Area with Vertical Shaded Lines */}
            <div className="relative pt-4 overflow-hidden">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-48 sm:h-64 overflow-visible select-none"
              >
                <defs>
                  {/* Subtle area gradient */}
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#18181B" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#18181B" stopOpacity="0.00" />
                  </linearGradient>

                  {/* Vertical bar striping pattern */}
                  <pattern id="verticalBars" width="10" height="10" patternUnits="userSpaceOnUse">
                    <line x1="5" y1="0" x2="5" y2="10" stroke="#E4E4E7" strokeWidth="1" strokeDasharray="2 2" />
                  </pattern>
                </defs>

                {/* Shaded vertical bar lines from baseline to curve */}
                {points.map((p, i) => (
                  <line
                    key={i}
                    x1={p.x}
                    y1={p.y}
                    x2={p.x}
                    y2={svgHeight - paddingBottom}
                    stroke="#E4E4E7"
                    strokeWidth="1.2"
                    strokeDasharray="2 3"
                    className="transition-opacity"
                    opacity={hoveredMonth === i ? 1 : 0.6}
                  />
                ))}

                {/* Shaded Area fill */}
                <path d={areaD} fill="url(#revenueGradient)" />

                {/* Main black trend curve */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#18181B"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points */}
                {points.map((p, i) => (
                  <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredMonth(i)}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={hoveredMonth === i ? 5 : 3}
                      fill="#FFFFFF"
                      stroke="#18181B"
                      strokeWidth="2"
                      className="transition-all"
                    />
                  </g>
                ))}

                {/* Floating Tooltip Box matching image style */}
                {activePoint && (
                  <g transform={`translate(${activePoint.x}, ${activePoint.y - 42})`}>
                    <rect
                      x="-65"
                      y="-12"
                      width="130"
                      height="34"
                      rx="8"
                      fill="#FFFFFF"
                      stroke="#E4E4E7"
                      className="shadow-md"
                    />
                    <text
                      x="-55"
                      y="5"
                      fontSize="9"
                      fill="#71717A"
                      fontWeight="bold"
                    >
                      {activePoint.month} 2026
                    </text>
                    <text
                      x="-55"
                      y="16"
                      fontSize="10"
                      fill="#18181B"
                      fontWeight="900"
                    >
                      {activePoint.revenue}
                    </text>
                    <rect
                      x="24"
                      y="2"
                      width="35"
                      height="14"
                      rx="4"
                      fill="#DCFCE7"
                    />
                    <text
                      x="41.5"
                      y="12"
                      fontSize="8"
                      fill="#16A34A"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {activePoint.change}
                    </text>
                  </g>
                )}

                {/* Month labels along x-axis */}
                {points.map((p, i) => (
                  <text
                    key={i}
                    x={p.x}
                    y={svgHeight - 10}
                    fontSize="10"
                    fill={hoveredMonth === i ? '#18181B' : '#A1A1AA'}
                    fontWeight={hoveredMonth === i ? 'bold' : 'normal'}
                    textAnchor="middle"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredMonth(i)}
                  >
                    {p.month}
                  </text>
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (4 / 12) — SHOP ADVISOR, PRODUCTS, RECENT ACTIVITIES */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Shop Advisor (Như ảnh số 2) */}
          <div className="p-6 rounded-3xl bg-white border border-[#E4E4E7] shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#18181B]">Shop Advisor</h2>
              <Link
                to="/admin/products"
                className="text-xs font-bold text-[#71717A] hover:text-[#18181B] flex items-center gap-0.5"
              >
                <span>See All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F4F5] border border-[#E4E4E7]/70 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-[#E4E4E7] flex items-center justify-center text-[#18181B] shrink-0 shadow-2xs">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-[#18181B] leading-tight">
                    The Black Friday Starts Tomorrow
                  </div>
                  <div className="text-[11px] text-[#71717A] leading-relaxed">
                    Find out how to take the advantage of the upcoming sales event.
                  </div>
                </div>
              </div>

              <Link
                to="/admin/products"
                className="inline-block text-xs font-bold text-[#18181B] hover:text-[#8B5CF6] hover:underline pt-1"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Card 2: Products (Như ảnh số 2) */}
          <div className="p-6 rounded-3xl bg-white border border-[#E4E4E7] shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#18181B]">Products</h2>
              <Link
                to="/admin/products"
                className="text-xs font-bold text-[#71717A] hover:text-[#18181B] flex items-center gap-0.5"
              >
                <span>See All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-[#71717A] font-medium">Active listings</span>
                <span className="font-bold text-[#18181B] text-sm">{products.length}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-t border-[#E4E4E7]/60">
                <span className="text-[#71717A] font-medium">Low stock</span>
                <span className="font-bold text-[#D97706] text-sm">{lowStockCount || 2}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-t border-[#E4E4E7]/60">
                <span className="text-[#71717A] font-medium">Sold out</span>
                <span className="font-bold text-[#DC2626] text-sm">{soldOutCount || 5}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Recent Activities (Như ảnh số 2) */}
          <div className="p-6 rounded-3xl bg-white border border-[#E4E4E7] shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#18181B]">Recent Activities</h2>
              <Link
                to="/admin/orders"
                className="text-xs font-bold text-[#71717A] hover:text-[#18181B] flex items-center gap-0.5"
              >
                <span>See All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3.5">
              {[
                {
                  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
                  name: 'David Elson',
                  action: 'favorited your shop',
                  time: '6 mins ago',
                },
                {
                  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
                  name: 'Kurt Bates',
                  action: 'purchased your product',
                  time: '10 mins ago',
                },
                {
                  avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=100&q=80',
                  name: 'Eddie Lake',
                  action: 'favorited your shop',
                  time: '20 mins ago',
                },
                {
                  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
                  name: 'Patricia Sanders',
                  action: 'purchased your product',
                  time: '32 mins ago',
                },
              ].map((act, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <img
                    src={act.avatar}
                    alt={act.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#E4E4E7]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-[#18181B] truncate">
                      <strong className="font-bold">{act.name}</strong> {act.action}
                    </div>
                    <div className="text-[10px] text-[#A1A1AA]">{act.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button (Như icon đen góc phải trong ảnh số 2) */}
      <button
        type="button"
        onClick={() => navigate('/admin/orders')}
        className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-2xl bg-[#18181B] hover:bg-[#303036] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer"
        aria-label="Tin nhắn và thông báo quản trị"
        title="Quản trị đơn hàng"
      >
        <MessageSquare className="w-5 h-5 text-white" />
      </button>
    </div>
  );
};
