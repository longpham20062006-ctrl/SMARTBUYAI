import React, { useState, useMemo } from 'react';
import {
  Shirt,
  Layers,
  Check,
  Sparkles,
  Gem,
  Search,
  X,
  Filter,
} from 'lucide-react';
import { TryOnGarment } from '../types/tryOn';
import { tryOnService } from '../services/tryOnService';

interface GarmentSelectorProps {
  selectedTop: TryOnGarment | null;
  selectedBottom: TryOnGarment | null;
  selectedOuterwear: TryOnGarment | null;
  selectedDress?: TryOnGarment | null;
  selectedAccessories: TryOnGarment[];
  onSelectTop: (garment: TryOnGarment | null) => void;
  onSelectBottom: (garment: TryOnGarment | null) => void;
  onSelectOuterwear: (garment: TryOnGarment | null) => void;
  onSelectDress?: (garment: TryOnGarment | null) => void;
  onToggleAccessory: (garment: TryOnGarment) => void;
}

type TabType = 'all_tops' | 'tees' | 'shirts' | 'outerwear' | 'hoodies' | 'bottoms' | 'accessories';

export const GarmentSelector: React.FC<GarmentSelectorProps> = ({
  selectedTop,
  selectedBottom,
  selectedOuterwear,
  selectedDress,
  selectedAccessories,
  onSelectTop,
  onSelectBottom,
  onSelectOuterwear,
  onSelectDress,
  onToggleAccessory,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('all_tops');
  const [searchQuery, setSearchQuery] = useState('');

  // 100% sản phẩm thực tế từ kho cửa hàng
  const allRealGarments = useMemo(() => tryOnService.getAllRealGarments(), []);

  // Phân loại trang phục dựa trên dữ liệu thật
  const tops = useMemo(
    () => allRealGarments.filter((g) => g.category === 'upper_body'),
    [allRealGarments]
  );
  const outerwears = useMemo(
    () => allRealGarments.filter((g) => g.category === 'outerwear'),
    [allRealGarments]
  );
  const bottoms = useMemo(
    () => allRealGarments.filter((g) => g.category === 'lower_body' || g.category === 'dresses'),
    [allRealGarments]
  );
  const accessories = useMemo(
    () => allRealGarments.filter((g) => g.category === 'accessories'),
    [allRealGarments]
  );

  // Lọc chi tiết theo nhóm áo phổ biến
  const tees = useMemo(
    () =>
      tops.filter(
        (g) =>
          g.name.toLowerCase().includes('thun') ||
          g.name.toLowerCase().includes('tee') ||
          g.name.toLowerCase().includes('polo')
      ),
    [tops]
  );

  const shirts = useMemo(
    () =>
      tops.filter(
        (g) =>
          g.name.toLowerCase().includes('sơ mi') ||
          g.name.toLowerCase().includes('shirt')
      ),
    [tops]
  );

  const hoodies = useMemo(
    () =>
      tops.filter(
        (g) =>
          g.name.toLowerCase().includes('hoodie') ||
          g.name.toLowerCase().includes('sweater') ||
          g.name.toLowerCase().includes('len')
      ),
    [tops]
  );

  const tabs: { id: TabType; label: string; count: number; icon: React.FC<{ className?: string }> }[] = [
    {
      id: 'all_tops',
      label: 'Tất cả áo',
      count: selectedTop ? 1 : 0,
      icon: Shirt,
    },
    {
      id: 'tees',
      label: 'Áo thun / Polo',
      count: selectedTop && (selectedTop.name.toLowerCase().includes('thun') || selectedTop.name.toLowerCase().includes('polo')) ? 1 : 0,
      icon: Shirt,
    },
    {
      id: 'shirts',
      label: 'Sơ mi',
      count: selectedTop && selectedTop.name.toLowerCase().includes('sơ mi') ? 1 : 0,
      icon: Shirt,
    },
    {
      id: 'outerwear',
      label: 'Áo khoác',
      count: selectedOuterwear ? 1 : 0,
      icon: Layers,
    },
    {
      id: 'hoodies',
      label: 'Hoodie / Len',
      count: 0,
      icon: Shirt,
    },
    {
      id: 'bottoms',
      label: 'Quần & Váy',
      count: (selectedBottom ? 1 : 0) + (selectedDress ? 1 : 0),
      icon: Layers,
    },
    {
      id: 'accessories',
      label: 'Phụ kiện',
      count: selectedAccessories.length,
      icon: Gem,
    },
  ];

  // Danh sách trang phục hiện tại theo tab và từ khóa
  const currentGarments = useMemo(() => {
    let list: TryOnGarment[] = [];
    if (activeTab === 'all_tops') list = tops;
    else if (activeTab === 'tees') list = tees.length > 0 ? tees : tops;
    else if (activeTab === 'shirts') list = shirts.length > 0 ? shirts : tops;
    else if (activeTab === 'outerwear') list = outerwears;
    else if (activeTab === 'hoodies') list = hoodies.length > 0 ? hoodies : tops;
    else if (activeTab === 'bottoms') list = bottoms;
    else if (activeTab === 'accessories') list = accessories;

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.brand?.toLowerCase().includes(q) ||
        g.color?.toLowerCase().includes(q)
    );
  }, [activeTab, tops, tees, shirts, outerwears, hoodies, bottoms, accessories, searchQuery]);

  return (
    <div className="space-y-4">
      {/* 1. THANH ĐIỀU HƯỚNG DANH MỤC */}
      <div className="flex border-b border-[#ECEAE7] gap-1.5 pb-2 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#18181B] text-white shadow-xs'
                  : 'text-[#78716C] hover:text-[#18181B] hover:bg-[#F0EFED] bg-white border border-[#ECEAE7]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#7C3AED] text-white text-[10px] flex items-center justify-center font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. THANH TÌM KIẾM TRANG PHỤC */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm sản phẩm theo tên, phong cách hoặc màu sắc..."
          className="w-full pl-8.5 pr-8 py-2 text-xs bg-white border border-[#ECEAE7] rounded-xl focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] outline-none transition-all placeholder:text-[#A8A29E]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#18181B] p-0.5"
            title="Xóa tìm kiếm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3. LƯỚI CARD SẢN PHẨM (TỶ LỆ 3:4) */}
      <div className="max-h-80 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
        {currentGarments.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#78716C] bg-[#F7F7F6] rounded-xl border border-dashed border-[#ECEAE7]">
            <Filter className="w-5 h-5 mx-auto mb-1.5 text-[#A8A29E]" />
            <p className="font-medium text-[#18181B]">Không tìm thấy trang phục phù hợp</p>
            <p className="text-[11px] text-[#78716C] mt-0.5">Vui lòng thử tìm từ khóa khác hoặc chuyển danh mục.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {currentGarments.map((garment) => {
              const isTopSelected = selectedTop?.id === garment.id;
              const isOuterwearSelected = selectedOuterwear?.id === garment.id;
              const isBottomSelected = selectedBottom?.id === garment.id;
              const isDressSelected = selectedDress?.id === garment.id;
              const isAccessorySelected = selectedAccessories.some((a) => a.id === garment.id);

              const isSelected =
                isTopSelected ||
                isOuterwearSelected ||
                isBottomSelected ||
                isDressSelected ||
                isAccessorySelected;

              const handleItemClick = () => {
                if (garment.category === 'outerwear') {
                  onSelectOuterwear(isOuterwearSelected ? null : garment);
                } else if (garment.category === 'lower_body') {
                  onSelectBottom(isBottomSelected ? null : garment);
                } else if (garment.category === 'dresses') {
                  if (onSelectDress) onSelectDress(isDressSelected ? null : garment);
                } else if (garment.category === 'accessories') {
                  onToggleAccessory(garment);
                } else {
                  // Mặc định là upper_body (áo)
                  onSelectTop(isTopSelected ? null : garment);
                }
              };

              return (
                <button
                  key={garment.id}
                  type="button"
                  onClick={handleItemClick}
                  className={`group relative rounded-xl border-2 p-1.5 text-left transition-all cursor-pointer bg-white ${
                    isSelected
                      ? 'border-[#18181B] ring-2 ring-[#18181B]/10 shadow-sm'
                      : 'border-[#ECEAE7] hover:border-[#18181B]/40 hover:bg-[#F7F7F6]'
                  }`}
                >
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-[#F7F7F6] relative">
                    <img
                      src={garment.thumbnailUrl || garment.imageUrl}
                      alt={garment.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#18181B] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className="mt-1.5 space-y-0.5 px-0.5">
                    <p className="text-[11px] font-semibold text-[#18181B] line-clamp-2 leading-snug">
                      {garment.name}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-[#78716C] pt-0.5">
                      <span className="truncate max-w-[60px]">{garment.brand || 'SMARTBUY'}</span>
                      {garment.color && (
                        <span className="text-[#18181B] font-medium truncate max-w-[50px] bg-[#F7F7F6] px-1 py-0.2 rounded border border-[#ECEAE7]">
                          {garment.color}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. KHAY TÓM TẮT OUTFIT ĐANG CHỌN */}
      <div className="p-3.5 bg-white rounded-xl border border-[#ECEAE7] text-xs space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-[#18181B] flex items-center gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Trang phục bạn đang chọn:</span>
          </p>
          {(selectedTop || selectedOuterwear || selectedBottom || selectedDress || selectedAccessories.length > 0) && (
            <button
              type="button"
              onClick={() => {
                onSelectTop(null);
                onSelectOuterwear(null);
                onSelectBottom(null);
                if (onSelectDress) onSelectDress(null);
                selectedAccessories.forEach((a) => onToggleAccessory(a));
              }}
              className="text-[11px] text-[#78716C] hover:text-[#B91C1C] underline cursor-pointer"
            >
              Bỏ chọn tất cả
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {selectedTop && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F7F7F6] border border-[#ECEAE7] text-[11px] text-[#18181B]">
              <strong className="font-semibold">Áo:</strong>
              <span className="truncate max-w-[140px]">{selectedTop.name}</span>
              <button
                type="button"
                onClick={() => onSelectTop(null)}
                className="text-[#78716C] hover:text-[#B91C1C] p-0.5 cursor-pointer"
                title="Bỏ chọn áo"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedOuterwear && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F7F7F6] border border-[#ECEAE7] text-[11px] text-[#18181B]">
              <strong className="font-semibold">Khoác:</strong>
              <span className="truncate max-w-[140px]">{selectedOuterwear.name}</span>
              <button
                type="button"
                onClick={() => onSelectOuterwear(null)}
                className="text-[#78716C] hover:text-[#B91C1C] p-0.5 cursor-pointer"
                title="Bỏ chọn áo khoác"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedBottom && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F7F7F6] border border-[#ECEAE7] text-[11px] text-[#18181B]">
              <strong className="font-semibold">Quần:</strong>
              <span className="truncate max-w-[140px]">{selectedBottom.name}</span>
              <button
                type="button"
                onClick={() => onSelectBottom(null)}
                className="text-[#78716C] hover:text-[#B91C1C] p-0.5 cursor-pointer"
                title="Bỏ chọn quần"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedDress && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F7F7F6] border border-[#ECEAE7] text-[11px] text-[#18181B]">
              <strong className="font-semibold">Váy:</strong>
              <span className="truncate max-w-[140px]">{selectedDress.name}</span>
              <button
                type="button"
                onClick={() => onSelectDress?.(null)}
                className="text-[#78716C] hover:text-[#B91C1C] p-0.5 cursor-pointer"
                title="Bỏ chọn váy"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedAccessories.map((acc) => (
            <span
              key={acc.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3E8FF] border border-[#DDD6FE] text-[11px] text-[#7C3AED]"
            >
              <strong className="font-semibold">Phụ kiện:</strong>
              <span className="truncate max-w-[120px]">{acc.name}</span>
              <button
                type="button"
                onClick={() => onToggleAccessory(acc)}
                className="text-[#7C3AED] hover:text-[#B91C1C] p-0.5 cursor-pointer"
                title="Bỏ chọn phụ kiện"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {!selectedTop && !selectedBottom && !selectedOuterwear && !selectedDress && selectedAccessories.length === 0 && (
            <span className="text-[#78716C] text-xs py-0.5">
              Chưa chọn món đồ nào từ kho. Hãy nhấp vào sản phẩm ở trên để chọn.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
