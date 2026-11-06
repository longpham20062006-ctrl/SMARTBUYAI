import React, { useState, useMemo } from 'react';
import { Shirt, Layers, Check, Sparkles, Gem, Scissors, Search, X } from 'lucide-react';
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

type TabType = 'tops' | 'bottoms' | 'outerwear' | 'dresses' | 'accessories';

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
  const [activeTab, setActiveTab] = useState<TabType>('tops');
  const [searchQuery, setSearchQuery] = useState('');

  // Lấy 100% sản phẩm THỰC TẾ từ website
  const allRealGarments = useMemo(() => tryOnService.getAllRealGarments(), []);

  const tops = useMemo(
    () => allRealGarments.filter((g) => g.category === 'upper_body'),
    [allRealGarments]
  );
  const outerwears = useMemo(
    () => allRealGarments.filter((g) => g.category === 'outerwear'),
    [allRealGarments]
  );
  const bottoms = useMemo(
    () => allRealGarments.filter((g) => g.category === 'lower_body'),
    [allRealGarments]
  );
  const dresses = useMemo(
    () => allRealGarments.filter((g) => g.category === 'dresses'),
    [allRealGarments]
  );
  const accessories = useMemo(
    () => allRealGarments.filter((g) => g.category === 'accessories'),
    [allRealGarments]
  );

  const tabs = [
    { id: 'tops', label: 'Áo', count: selectedTop ? 1 : 0, icon: Shirt },
    { id: 'bottoms', label: 'Quần', count: selectedBottom ? 1 : 0, icon: Layers },
    { id: 'outerwear', label: 'Áo khoác', count: selectedOuterwear ? 1 : 0, icon: Layers },
    { id: 'dresses', label: 'Váy & Đầm', count: selectedDress ? 1 : 0, icon: Scissors },
    { id: 'accessories', label: 'Phụ kiện', count: selectedAccessories.length, icon: Gem },
  ];

  // Lọc sản phẩm theo tab và tìm kiếm
  const currentGarments = useMemo(() => {
    let list: TryOnGarment[] = [];
    if (activeTab === 'tops') list = tops;
    else if (activeTab === 'bottoms') list = bottoms;
    else if (activeTab === 'outerwear') list = outerwears;
    else if (activeTab === 'dresses') list = dresses;
    else if (activeTab === 'accessories') list = accessories;

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (g) => g.name.toLowerCase().includes(q) || g.brand?.toLowerCase().includes(q)
    );
  }, [activeTab, tops, bottoms, outerwears, dresses, accessories, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex border-b border-[#E4E4E7] gap-1 pb-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as TabType);
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#18181B] text-white shadow-xs'
                  : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#8B5CF6] text-white text-[10px] flex items-center justify-center font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Thanh tìm kiếm sản phẩm trong kho */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Tìm ${tabs.find((t) => t.id === activeTab)?.label.toLowerCase()} theo tên hoặc brand...`}
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAFAF8] border border-[#E4E4E7] rounded-xl focus:border-[#8B5CF6] focus:bg-white outline-none transition-all placeholder:text-[#A1A1AA]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#18181B]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Danh sách sản phẩm dạng lưới cuộn */}
      <div className="max-h-72 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
        {currentGarments.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#71717A]">
            Không tìm thấy sản phẩm nào trong danh mục này.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {currentGarments.map((garment) => {
              let isSelected = false;
              if (activeTab === 'tops') isSelected = selectedTop?.id === garment.id;
              else if (activeTab === 'bottoms') isSelected = selectedBottom?.id === garment.id;
              else if (activeTab === 'outerwear') isSelected = selectedOuterwear?.id === garment.id;
              else if (activeTab === 'dresses') isSelected = selectedDress?.id === garment.id;
              else if (activeTab === 'accessories')
                isSelected = selectedAccessories.some((a) => a.id === garment.id);

              const handleItemClick = () => {
                if (activeTab === 'tops') onSelectTop(isSelected ? null : garment);
                else if (activeTab === 'bottoms') onSelectBottom(isSelected ? null : garment);
                else if (activeTab === 'outerwear') onSelectOuterwear(isSelected ? null : garment);
                else if (activeTab === 'dresses' && onSelectDress)
                  onSelectDress(isSelected ? null : garment);
                else if (activeTab === 'accessories') onToggleAccessory(garment);
              };

              return (
                <button
                  key={garment.id}
                  type="button"
                  onClick={handleItemClick}
                  className={`group relative rounded-xl border-2 p-1.5 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#8B5CF6] bg-[#F3E8FF]/20 ring-2 ring-[#8B5CF6]/30 shadow-subtle'
                      : 'border-[#E4E4E7] hover:border-[#8B5CF6]/50 bg-white'
                  }`}
                >
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-[#FAFAF8] relative">
                    <img
                      src={garment.thumbnailUrl || garment.imageUrl}
                      alt={garment.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shadow-subtle">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className="mt-1.5 space-y-0.5">
                    <p className="text-[11px] font-semibold text-[#18181B] line-clamp-1 leading-snug">
                      {garment.name}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-[#71717A]">
                      <span className="truncate max-w-[65px]">{garment.brand}</span>
                      {garment.color && <span className="text-[#8B5CF6] truncate">{garment.color}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tóm tắt Outfit được chọn để thử & Nút hủy chọn nhanh */}
      <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#E4E4E7] text-xs space-y-2">
        <p className="font-semibold text-[#18181B] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>Set trang phục bạn đang chọn:</span>
        </p>

        <div className="flex flex-wrap gap-1.5">
          {selectedTop && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E4E4E7] text-[11px] text-[#18181B]">
              <strong>Áo:</strong> {selectedTop.name}
              <button
                type="button"
                onClick={() => onSelectTop(null)}
                className="text-[#71717A] hover:text-[#DC2626]"
                title="Bỏ chọn"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedOuterwear && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E4E4E7] text-[11px] text-[#18181B]">
              <strong>Khoác:</strong> {selectedOuterwear.name}
              <button
                type="button"
                onClick={() => onSelectOuterwear(null)}
                className="text-[#71717A] hover:text-[#DC2626]"
                title="Bỏ chọn"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedBottom && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E4E4E7] text-[11px] text-[#18181B]">
              <strong>Quần:</strong> {selectedBottom.name}
              <button
                type="button"
                onClick={() => onSelectBottom(null)}
                className="text-[#71717A] hover:text-[#DC2626]"
                title="Bỏ chọn"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedDress && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E4E4E7] text-[11px] text-[#18181B]">
              <strong>Váy:</strong> {selectedDress.name}
              <button
                type="button"
                onClick={() => onSelectDress?.(null)}
                className="text-[#71717A] hover:text-[#DC2626]"
                title="Bỏ chọn"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedAccessories.map((acc) => (
            <span
              key={acc.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#DDD6FE] text-[11px] text-[#7C3AED]"
            >
              <strong>Phụ kiện:</strong> {acc.name}
              <button
                type="button"
                onClick={() => onToggleAccessory(acc)}
                className="text-[#7C3AED] hover:text-[#DC2626]"
                title="Bỏ chọn"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {!selectedTop && !selectedBottom && !selectedOuterwear && !selectedDress && selectedAccessories.length === 0 && (
            <span className="text-[#71717A] italic py-0.5">Chưa chọn món đồ nào từ kho</span>
          )}
        </div>
      </div>
    </div>
  );
};
