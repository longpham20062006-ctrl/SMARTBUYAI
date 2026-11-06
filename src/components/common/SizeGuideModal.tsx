import React, { useState, useEffect } from 'react';
import { X, Ruler, Sparkles, CheckCircle2, Info } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

export type SizeCategory = 'men_tops' | 'women_tops' | 'men_bottoms' | 'women_bottoms' | 'measuring_guide';

interface SizeGuideModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialCategory?: SizeCategory;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  initialCategory = 'men_tops',
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SizeCategory>(initialCategory);

  const isControlled = propIsOpen !== undefined;
  const isOpen = isControlled ? propIsOpen : internalIsOpen;

  const handleClose = () => {
    if (isControlled) {
      propOnClose?.();
    } else {
      setInternalIsOpen(false);
    }
  };

  useEffect(() => {
    const handleOpen = (e: CustomEvent<{ category?: SizeCategory }>) => {
      if (e?.detail?.category) {
        setActiveTab(e.detail.category);
      }
      setInternalIsOpen(true);
    };

    window.addEventListener('open_size_guide' as any, handleOpen);
    return () => {
      window.removeEventListener('open_size_guide' as any, handleOpen);
    };
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="BẢNG SIZE THAM KHẢO // SMARTBUY AI"
      description="Quy chuẩn kích thước và hướng dẫn đo cơ thể chuẩn phom thời trang Gen Z"
      maxWidth="3xl"
    >
      <div className="space-y-6 text-xs sm:text-sm select-none">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-zinc-100 border border-zinc-200">
          {[
            { id: 'men_tops', label: 'Áo Nam' },
            { id: 'women_tops', label: 'Áo Nữ' },
            { id: 'men_bottoms', label: 'Quần Nam' },
            { id: 'women_bottoms', label: 'Quần / Váy Nữ' },
            { id: 'measuring_guide', label: '📏 Hướng dẫn đo' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as SizeCategory)}
              className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 1. Size Áo Nam */}
        {activeTab === 'men_tops' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-semibold text-zinc-900">Bảng số đo Áo thun, Sơ mi, Hoodie Nam (cm)</span>
              <span>Đơn vị: Centimet (cm) / Kilogram (kg)</span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs min-w-[560px]">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-800 font-black border-b border-zinc-200 uppercase tracking-wider">
                    <th className="p-3">Size</th>
                    <th className="p-3">Rộng vai</th>
                    <th className="p-3">Vòng ngực</th>
                    <th className="p-3">Dài áo</th>
                    <th className="p-3">Chiều cao</th>
                    <th className="p-3">Cân nặng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {[
                    { size: 'S', shoulder: '48 cm', chest: '104 cm', length: '68 cm', height: '1m60 - 1m68', weight: '48 - 56 kg' },
                    { size: 'M', shoulder: '50 cm', chest: '110 cm', length: '71 cm', height: '1m68 - 1m74', weight: '57 - 65 kg' },
                    { size: 'L', shoulder: '52 cm', chest: '116 cm', length: '73 cm', height: '1m72 - 1m78', weight: '66 - 75 kg' },
                    { size: 'XL', shoulder: '54 cm', chest: '122 cm', length: '75 cm', height: '1m76 - 1m84', weight: '76 - 86 kg' },
                    { size: 'XXL', shoulder: '56 cm', chest: '128 cm', length: '77 cm', height: '1m80 - 1m90', weight: '87 - 98 kg' },
                  ].map((row) => (
                    <tr key={row.size} className="hover:bg-violet-50/50 transition-colors">
                      <td className="p-3 font-black text-violet-700 bg-zinc-50/80">{row.size}</td>
                      <td className="p-3 text-zinc-700">{row.shoulder}</td>
                      <td className="p-3 text-zinc-700">{row.chest}</td>
                      <td className="p-3 text-zinc-700">{row.length}</td>
                      <td className="p-3 text-zinc-700">{row.height}</td>
                      <td className="p-3 font-bold text-zinc-900">{row.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Size Áo Nữ */}
        {activeTab === 'women_tops' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-semibold text-zinc-900">Bảng số đo Baby Tee, Áo kiểu, Cardigan Nữ (cm)</span>
              <span>Đơn vị: Centimet (cm) / Kilogram (kg)</span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs min-w-[560px]">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-800 font-black border-b border-zinc-200 uppercase tracking-wider">
                    <th className="p-3">Size</th>
                    <th className="p-3">Rộng vai</th>
                    <th className="p-3">Vòng ngực</th>
                    <th className="p-3">Dài áo (Baby Tee)</th>
                    <th className="p-3">Chiều cao</th>
                    <th className="p-3">Cân nặng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {[
                    { size: 'XS', shoulder: '34 cm', chest: '78 - 82 cm', length: '46 cm', height: '1m48 - 1m55', weight: '38 - 43 kg' },
                    { size: 'S', shoulder: '36 cm', chest: '82 - 88 cm', length: '48 cm', height: '1m52 - 1m60', weight: '44 - 50 kg' },
                    { size: 'M', shoulder: '38 cm', chest: '88 - 94 cm', length: '50 cm', height: '1m58 - 1m66', weight: '51 - 58 kg' },
                    { size: 'L', shoulder: '40 cm', chest: '94 - 100 cm', length: '52 cm', height: '1m64 - 1m72', weight: '59 - 68 kg' },
                  ].map((row) => (
                    <tr key={row.size} className="hover:bg-pink-50/50 transition-colors">
                      <td className="p-3 font-black text-pink-600 bg-zinc-50/80">{row.size}</td>
                      <td className="p-3 text-zinc-700">{row.shoulder}</td>
                      <td className="p-3 text-zinc-700">{row.chest}</td>
                      <td className="p-3 text-zinc-700">{row.length}</td>
                      <td className="p-3 text-zinc-700">{row.height}</td>
                      <td className="p-3 font-bold text-zinc-900">{row.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Size Quần Nam */}
        {activeTab === 'men_bottoms' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-semibold text-zinc-900">Bảng số đo Quần Jeans, Cargo, Jogger Nam</span>
              <span>Đơn vị: Centimet (cm) / Kilogram (kg)</span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs min-w-[560px]">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-800 font-black border-b border-zinc-200 uppercase tracking-wider">
                    <th className="p-3">Size số</th>
                    <th className="p-3">Size chữ</th>
                    <th className="p-3">Vòng eo</th>
                    <th className="p-3">Vòng mông</th>
                    <th className="p-3">Dài quần</th>
                    <th className="p-3">Cân nặng gợi ý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {[
                    { num: '29', alpha: 'S', waist: '72 - 75 cm', hip: '94 cm', length: '98 cm', weight: '48 - 56 kg' },
                    { num: '30', alpha: 'M', waist: '76 - 79 cm', hip: '98 cm', length: '100 cm', weight: '57 - 65 kg' },
                    { num: '31', alpha: 'L', waist: '80 - 83 cm', hip: '102 cm', length: '102 cm', weight: '66 - 72 kg' },
                    { num: '32', alpha: 'XL', waist: '84 - 87 cm', hip: '106 cm', length: '104 cm', weight: '73 - 80 kg' },
                    { num: '34', alpha: 'XXL', waist: '88 - 92 cm', hip: '110 cm', length: '106 cm', weight: '81 - 92 kg' },
                  ].map((row) => (
                    <tr key={row.num} className="hover:bg-violet-50/50 transition-colors">
                      <td className="p-3 font-black text-violet-700 bg-zinc-50/80">{row.num}</td>
                      <td className="p-3 font-bold text-zinc-800">{row.alpha}</td>
                      <td className="p-3 text-zinc-700">{row.waist}</td>
                      <td className="p-3 text-zinc-700">{row.hip}</td>
                      <td className="p-3 text-zinc-700">{row.length}</td>
                      <td className="p-3 font-bold text-zinc-900">{row.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Size Quần / Váy Nữ */}
        {activeTab === 'women_bottoms' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-semibold text-zinc-900">Bảng số đo Quần Jeans & Chân váy Nữ</span>
              <span>Đơn vị: Centimet (cm) / Kilogram (kg)</span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs min-w-[560px]">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-800 font-black border-b border-zinc-200 uppercase tracking-wider">
                    <th className="p-3">Size</th>
                    <th className="p-3">Vòng eo</th>
                    <th className="p-3">Vòng mông</th>
                    <th className="p-3">Dài chân váy</th>
                    <th className="p-3">Dài quần ống rộng</th>
                    <th className="p-3">Cân nặng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {[
                    { size: 'S', waist: '62 - 66 cm', hip: '86 - 90 cm', skirtLen: '38 cm', pantsLen: '98 cm', weight: '42 - 48 kg' },
                    { size: 'M', waist: '66 - 70 cm', hip: '90 - 94 cm', skirtLen: '40 cm', pantsLen: '100 cm', weight: '49 - 54 kg' },
                    { size: 'L', waist: '70 - 74 cm', hip: '94 - 98 cm', skirtLen: '41 cm', pantsLen: '102 cm', weight: '55 - 62 kg' },
                    { size: 'XL', waist: '74 - 78 cm', hip: '98 - 102 cm', skirtLen: '42 cm', pantsLen: '103 cm', weight: '63 - 70 kg' },
                  ].map((row) => (
                    <tr key={row.size} className="hover:bg-pink-50/50 transition-colors">
                      <td className="p-3 font-black text-pink-600 bg-zinc-50/80">{row.size}</td>
                      <td className="p-3 text-zinc-700">{row.waist}</td>
                      <td className="p-3 text-zinc-700">{row.hip}</td>
                      <td className="p-3 text-zinc-700">{row.skirtLen}</td>
                      <td className="p-3 text-zinc-700">{row.pantsLen}</td>
                      <td className="p-3 font-bold text-zinc-900">{row.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Hướng dẫn đo cơ thể */}
        {activeTab === 'measuring_guide' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-violet-50 border border-violet-200 text-left space-y-2">
                <span className="font-bold text-violet-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-violet-600" />
                  1. Đo Vòng Ngực
                </span>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Quấn thước dây quanh phần nở nhất của ngực, giữ thước song song với mặt đất, không kéo quá siết hoặc quá lỏng.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-violet-50 border border-violet-200 text-left space-y-2">
                <span className="font-bold text-violet-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-violet-600" />
                  2. Đo Vòng Eo
                </span>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Đo quanh vị trí nhỏ nhất của eo (thường nằm phía trên rốn 2-3 cm). Giữ tư thế thở tự nhiên khi đo.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-violet-50 border border-violet-200 text-left space-y-2">
                <span className="font-bold text-violet-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-violet-600" />
                  3. Đo Vòng Mông
                </span>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Đứng thẳng, khép hai chân và đo quanh điểm nở nhất của vòng 3 để chọn size quần jeans hoặc chân váy chuẩn nhất.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-violet-50 border border-violet-200 text-left space-y-2">
                <span className="font-bold text-violet-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-violet-600" />
                  4. Chiều dài lưng áo
                </span>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Đo từ chân cổ sau dọc theo sống lưng đến vị trí mong muốn (ngang hông hoặc qua mông tùy phom áo).
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Mẹo chọn size cho Streetwear Gen Z:</strong> Nếu bạn thích phom rộng phủ thoải mái (Boxy / Oversized), nên chọn đúng bảng size hoặc up 1 size. Nếu thích mặc ôm tôn dáng (Baby Tee, Corset), nên chọn lùi 1 size.
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer Footer */}
        <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-600 text-[11px] leading-relaxed flex items-start gap-2 text-left">
          <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <div>
            <strong>Lưu ý quan trọng:</strong> Đây là <em>bảng size tham khảo</em> dựa trên phom mẫu tiêu chuẩn của SMARTBUY AI. Độ co giãn của từng chất liệu vải và phom dáng thiết kế có thể có độ chênh lệch thực tế từ 1-2 cm. Quý khách được đổi size miễn phí tận nhà trong vòng 15 ngày!
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SizeGuideModal;

