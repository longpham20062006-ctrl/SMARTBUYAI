import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export const SizeGuidePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'unisex' | 'men' | 'women' | 'accessories'>('unisex');

  return (
    <div className="bg-brand-bg min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-accent-light text-brand-accent text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>GEN Z FIT & SIZE GUIDE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-brand-primary uppercase tracking-tight">
            BẢNG QUY ĐỔI KÍCH CỠ CHUẨN
          </h1>
          <p className="text-xs sm:text-sm text-brand-secondary leading-relaxed">
            Được nghiên cứu theo phom dáng Oversized & Streetwear thịnh hành. Giúp bạn chọn đúng size mặc rũ thoải mái hoặc vừa vặn tôn dáng.
          </p>
        </div>

        {/* Tabs chuyển đổi */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 rounded-xl bg-brand-surface border border-brand-border text-xs shadow-2xs">
            {[
              { id: 'unisex', label: '⚡ Phom Rộng Unisex' },
              { id: 'men', label: 'Streetwear Nam' },
              { id: 'women', label: 'Baby Tee & Nữ' },
              { id: 'accessories', label: 'Phụ kiện & Nón' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 sm:px-5 py-2.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'text-brand-secondary hover:text-brand-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bảng số đo */}
        <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-xs p-6 overflow-x-auto space-y-4">
          <h3 className="text-xl font-bold text-brand-primary">
            {activeTab === 'unisex'
              ? 'Bảng thông số Áo Oversize & Quần Baggy Unisex (Centimet)'
              : activeTab === 'men'
              ? 'Bảng thông số Áo & Quần Nam Streetwear (Centimet)'
              : activeTab === 'women'
              ? 'Bảng thông số Baby Tee & Chân váy Nữ (Centimet)'
              : 'Quy chuẩn Kích cỡ Phụ kiện, Nón & Trang sức'}
          </h3>

          {activeTab === 'accessories' ? (
            <div className="p-6 bg-brand-subtle rounded-xl space-y-3 text-xs">
              <div className="font-bold text-brand-primary uppercase text-sm">
                Tất cả phụ kiện tại SMARTBUY AI đều là FreeSize
              </div>
              <p className="text-brand-secondary leading-relaxed">
                - <strong>Nón lưỡi trai / Mũ Beanie:</strong> Có khóa gài kim loại điều chỉnh vòng đầu từ 54–60cm, len gân co giãn 4 chiều.<br />
                - <strong>Dây chuyền Cuban / Layer:</strong> Chiều dài chuẩn 50cm kèm mắt nối phụ 5cm linh hoạt.<br />
                - <strong>Nhẫn bạc titan:</strong> Thiết kế bản hở (FreeSize) có thể nới nhẹ vừa mọi cỡ ngón tay.<br />
                - <strong>Túi Tote & Túi đeo chéo:</strong> Dây quai dù tăng giảm độ dài từ 60–120cm.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs min-w-[600px]">
              <thead>
                <tr className="bg-brand-subtle text-brand-primary font-bold border-b border-brand-border">
                  <th className="p-3.5">Size</th>
                  <th className="p-3.5">Vòng ngực</th>
                  <th className="p-3.5">Dài áo</th>
                  <th className="p-3.5">Vòng eo</th>
                  <th className="p-3.5">Chiều cao gợi ý</th>
                  <th className="p-3.5">Cân nặng gợi ý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {[
                  { size: 'S', chest: '106 cm', length: '70 cm', waist: '68 - 74 cm', height: '1m58 - 1m66', weight: '45 - 56 kg' },
                  { size: 'M', chest: '112 cm', length: '72 cm', waist: '74 - 80 cm', height: '1m66 - 1m73', weight: '57 - 66 kg' },
                  { size: 'L', chest: '118 cm', length: '74 cm', waist: '80 - 86 cm', height: '1m72 - 1m79', weight: '67 - 76 kg' },
                  { size: 'XL', chest: '124 cm', length: '76 cm', waist: '86 - 92 cm', height: '1m76 - 1m84', weight: '77 - 88 kg' },
                  { size: 'XXL', chest: '130 cm', length: '78 cm', waist: '92 - 100 cm', height: '1m80 - 1m90', weight: '88 - 98 kg' },
                ].map((row) => (
                  <tr key={row.size} className="hover:bg-brand-subtle/50 transition-colors">
                    <td className="p-3.5 font-bold text-brand-primary bg-brand-subtle">{row.size}</td>
                    <td className="p-3.5 text-brand-secondary">{row.chest}</td>
                    <td className="p-3.5 text-brand-secondary">{row.length}</td>
                    <td className="p-3.5 text-brand-secondary">{row.waist}</td>
                    <td className="p-3.5 text-brand-secondary">{row.height}</td>
                    <td className="p-3.5 font-bold text-brand-primary">{row.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Cam kết đổi size */}
        <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-brand-primary uppercase">Đổi size tận nhà trong 15 ngày</h4>
            <p className="text-xs text-brand-secondary">Nếu sản phẩm mặc không đúng phom như mong đợi, shipper sẽ giao size mới và thu lại size cũ cùng lúc.</p>
          </div>
          <Link to="/products">
            <Button variant="accent" size="sm" className="font-bold shadow-sm">
              Bắt đầu chọn đồ
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
