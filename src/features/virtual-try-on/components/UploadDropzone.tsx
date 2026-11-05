import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  User,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { DemoModel } from '../types/tryOn';
import { tryOnService } from '../services/tryOnService';

interface UploadDropzoneProps {
  currentPersonImage: string;
  isUploaded: boolean;
  selectedModel: DemoModel | null;
  onUploadFile: (file: File) => boolean;
  onSelectModel: (model: DemoModel) => void;
  onClearUploaded: () => void;
  error?: string | null;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  currentPersonImage,
  isUploaded,
  selectedModel,
  onUploadFile,
  onSelectModel,
  onClearUploaded,
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const demoModels = tryOnService.getDemoModels();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. KHUNG TẢI ẢNH CỦA BẠN (DROPZONE) */}
      {!isUploaded ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-7 text-center cursor-pointer transition-all duration-200 bg-white ${
            isDragOver
              ? 'border-[#7C3AED] bg-[#F3E8FF]/30'
              : 'border-[#D6D3D1] hover:border-[#18181B] hover:bg-[#F7F7F6]'
          }`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F7F7F6] border border-[#ECEAE7] text-[#18181B] flex items-center justify-center transition-transform group-hover:scale-105">
              <UploadCloud className="w-5 h-5 text-[#18181B]" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#18181B] tracking-tight">
                Tải ảnh chụp của bạn lên
              </p>
              <p className="text-xs text-[#78716C]">
                Kéo thả ảnh vào đây hoặc{' '}
                <span className="text-[#18181B] underline font-medium">chọn từ thiết bị</span>
              </p>
              <p className="text-[11px] text-[#A8A29E]">
                Hỗ trợ JPG, PNG, WebP · Tối đa 10MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* KHI ĐÃ CÓ ẢNH TẢI LÊN */
        <div className="p-3.5 bg-white rounded-2xl border border-[#ECEAE7] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-14 rounded-xl overflow-hidden border border-[#ECEAE7] bg-[#F7F7F6] shrink-0">
                <img
                  src={currentPersonImage}
                  alt="Ảnh cá nhân đã tải lên"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#18181B]">
                  <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
                  <span className="truncate">Ảnh cá nhân của bạn</span>
                </div>
                <p className="text-[11px] text-[#78716C] mt-0.5">
                  Đang dùng làm người mẫu thử đồ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#18181B] bg-[#F7F7F6] hover:bg-[#F0EFED] rounded-lg border border-[#ECEAE7] transition-colors cursor-pointer"
                title="Thay ảnh khác"
              >
                <RefreshCw className="w-3 h-3 text-[#78716C]" />
                <span className="hidden sm:inline">Đổi ảnh</span>
              </button>
              <button
                type="button"
                onClick={onClearUploaded}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#B91C1C] hover:bg-red-50 rounded-lg border border-red-100 transition-colors cursor-pointer"
                title="Xóa ảnh cá nhân"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden sm:inline">Xóa</span>
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* 2. HƯỚNG DẪN CHỤP ẢNH CHUẨN KOREAN FIT */}
      <div className="rounded-xl border border-[#ECEAE7] bg-white overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => setShowGuidelines(!showGuidelines)}
          className="w-full p-2.5 px-3 flex items-center justify-between text-[#292524] font-medium hover:bg-[#F7F7F6] transition-colors"
        >
          <span className="flex items-center gap-2 text-[#18181B] text-xs">
            <HelpCircle className="w-3.5 h-3.5 text-[#7C3AED]" />
            Mẹo chọn ảnh để AI thử đồ chân thực nhất
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#78716C] transition-transform duration-200 ${
              showGuidelines ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showGuidelines && (
          <div className="p-3.5 bg-[#F7F7F6] border-t border-[#ECEAE7] space-y-2 text-[#78716C] text-xs leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#18181B] mt-1.5 shrink-0" />
              <p><strong className="text-[#18181B]">Một người duy nhất:</strong> Chụp chính diện, rõ nửa người hoặc toàn thân, không bị che khuất vai và eo.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#18181B] mt-1.5 shrink-0" />
              <p><strong className="text-[#18181B]">Ánh sáng tốt:</strong> Đủ sáng, ánh sáng tự nhiên, không bị sấp bóng hoặc ngược sáng mạnh.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#18181B] mt-1.5 shrink-0" />
              <p><strong className="text-[#18181B]">Trang phục ban đầu:</strong> Mặc đồ gọn gàng (áo phông đơn giản, ôm vừa vặn) để AI thay đồ chuẩn phom.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#18181B] mt-1.5 shrink-0" />
              <p><strong className="text-[#18181B]">Bảo mật quyền riêng tư:</strong> Ảnh cá nhân chỉ lưu trong phiên thử nghiệm và không chia sẻ công khai.</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-[#B91C1C] rounded-xl border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. HOẶC CHỌN NGƯỜI MẪU GEN Z CÓ SẴN */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-[#18181B] flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#7C3AED]" />
            Hoặc chọn Người mẫu chuẩn dáng
          </p>
          {selectedModel && !isUploaded && (
            <span className="text-[11px] text-[#7C3AED] font-medium">
              Đang chọn: {selectedModel.name.split('(')[0].trim()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
          {demoModels.map((model) => {
            const isSelected = !isUploaded && selectedModel?.id === model.id;
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => onSelectModel(model)}
                className={`relative group rounded-xl overflow-hidden border-2 transition-all p-1 text-left bg-white cursor-pointer ${
                  isSelected
                    ? 'border-[#18181B] ring-2 ring-[#18181B]/10 shadow-sm'
                    : 'border-[#ECEAE7] hover:border-[#18181B]/40 hover:bg-[#F7F7F6]'
                }`}
              >
                <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-[#F7F7F6] relative">
                  <img
                    src={model.thumbnailUrl}
                    alt={model.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#18181B] text-white flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="pt-1.5 pb-0.5 px-0.5">
                  <p className="text-[11px] font-semibold text-[#18181B] truncate">
                    {model.name.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-[#78716C] truncate">
                    {model.heightCm}cm · {model.weightKg}kg
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
