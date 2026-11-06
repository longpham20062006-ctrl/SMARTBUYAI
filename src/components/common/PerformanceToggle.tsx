import React, { useState, useRef, useEffect } from 'react';
import { usePerformance, PerformanceMode } from '@/context/PerformanceContext';
import { Gauge, Zap, Leaf, Check, ChevronDown } from 'lucide-react';

interface PerformanceToggleProps {
  compact?: boolean;
}

export const PerformanceToggle: React.FC<PerformanceToggleProps> = ({ compact = false }) => {
  const { mode, effectiveMode, setMode } = usePerformance();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const options: { id: PerformanceMode; label: string; desc: string; icon: any }[] = [
    {
      id: 'auto',
      label: 'Tự động',
      desc: effectiveMode === 'saver' ? 'Đang bật tiết kiệm cho thiết bị này' : 'Tối ưu theo cấu hình máy',
      icon: Gauge,
    },
    {
      id: 'standard',
      label: 'Tiêu chuẩn',
      desc: 'Hiệu ứng vũ trụ 3D đầy đủ',
      icon: Zap,
    },
    {
      id: 'saver',
      label: 'Siêu mượt',
      desc: 'Tiết kiệm pin & RAM cho máy yếu',
      icon: Leaf,
    },
  ];

  const currentOption = options.find((opt) => opt.id === mode) || options[0];
  const CurrentIcon = currentOption.icon;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-full border border-brand-border/70 bg-white/80 backdrop-blur-xs transition-all hover:bg-white hover:border-brand-forest/40 focus:outline-hidden cursor-pointer ${
          compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs font-medium'
        }`}
        title={`Chế độ hiệu năng: ${currentOption.label}`}
        aria-label="Chọn chế độ hiệu năng"
      >
        <CurrentIcon className={`w-3.5 h-3.5 ${mode === 'saver' ? 'text-emerald-600' : 'text-brand-forest'}`} />
        <span className="text-brand-charcoal text-[11px] font-medium hidden sm:inline">
          {currentOption.label}
        </span>
        <ChevronDown className={`w-3 h-3 text-brand-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 sm:bottom-auto sm:top-full sm:mt-2 w-64 rounded-2xl bg-white p-2 shadow-xl border border-brand-border/80 z-50 animate-fade-in text-left">
          <div className="px-2.5 py-1.5 border-b border-brand-border/50 mb-1">
            <span className="text-[11px] font-bold text-brand-charcoal uppercase tracking-wider">
              Chế độ hiệu năng
            </span>
            <p className="text-[10px] text-brand-muted">
              Tùy chỉnh để website mượt mà nhất trên máy của bạn
            </p>
          </div>

          <div className="space-y-1">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = mode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setMode(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-brand-forest/10 text-brand-forest font-semibold' : 'hover:bg-brand-ivory text-brand-charcoal'
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${opt.id === 'saver' ? 'text-emerald-600' : 'text-brand-forest'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs">
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand-forest shrink-0 ml-1" />}
                    </div>
                    <p className="text-[10px] text-brand-muted font-normal mt-0.5 truncate">
                      {opt.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

