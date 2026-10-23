import React, { useRef, useState } from 'react';
import { UploadCloud, User, Trash2, CheckCircle2, ShieldAlert, Info, ChevronDown } from 'lucide-react';
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
      {/* Khung tải ảnh / Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-[#8B5CF6] bg-[#F3E8FF]/40'
            : 'border-[#E4E4E7] hover:border-[#8B5CF6]/60 bg-[#FAFAF8]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-semibold text-[#18181B]">
              Kéo thả ảnh toàn thân / nửa người vào đây
            </p>
            <p className="text-xs text-[#71717A] mt-1">
              hoặc <span className="text-[#8B5CF6] underline font-medium">chọn từ thiết bị</span> (JPG, PNG, WebP &lt; 10MB)
            </p>
          </div>
        </div>
      </div>

      {/* Hướng dẫn chụp ảnh phù hợp (Section 2 - Khu vực A) */}
      <div className="rounded-xl border border-[#E4E4E7] bg-white overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => setShowGuidelines(!showGuidelines)}
          className="w-full p-2.5 flex items-center justify-between text-[#18181B] font-semibold hover:bg-[#F4F4F5] transition-colors"
        >
          <span className="flex items-center gap-1.5 text-[#8B5CF6]">
            <Info className="w-3.5 h-3.5" />
            Hướng dẫn chụp ảnh để AI ghép chuẩn nhất
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#71717A] transition-transform duration-200 ${
              showGuidelines ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showGuidelines && (
          <div className="p-3 bg-[#FAFAF8] border-t border-[#E4E4E7] space-y-1.5 text-[#71717A] text-[11px] leading-relaxed">
            <p className="flex items-center gap-1.5 text-[#18181B] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
              Một người duy nhất trong khung hình, phông nền đơn giản.
            </p>
            <p className="flex items-center gap-1.5 text-[#18181B] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
              Đứng thẳng hoặc tư thế rõ ràng, thấy rõ vùng cơ thể cần thử đồ.
            </p>
            <p className="flex items-center gap-1.5 text-[#18181B] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
              Ánh sáng tự nhiên tốt, không bị sấp bóng hoặc ngược sáng.
            </p>
            <p className="flex items-center gap-1.5 text-[#18181B] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
              Tránh quần áo ban đầu quá dày phồng hoặc che kín tay chân.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-600 rounded-xl border border-red-200">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hiển thị trạng thái ảnh đang chọn & Nút xóa ảnh cá nhân */}
      {isUploaded && (
        <div className="flex items-center justify-between p-3 bg-[#F4F4F5] rounded-xl border border-[#E4E4E7]">
          <div className="flex items-center gap-3">
            <img
              src={currentPersonImage}
              alt="Ảnh cá nhân tải lên"
              className="w-10 h-10 rounded-lg object-cover border border-[#E4E4E7]"
            />
            <div>
              <p className="text-xs font-semibold text-[#18181B] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Ảnh cá nhân của bạn
              </p>
              <p className="text-[10px] text-[#71717A]">Được lưu trữ tạm thời trong phiên duyệt</p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClearUploaded();
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Xóa ảnh cá nhân"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa</span>
          </button>
        </div>
      )}

      {/* Người mẫu mẫu có sẵn */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#71717A] flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#8B5CF6]" />
            Hoặc chọn Người mẫu Gen Z có sẵn
          </p>
          {selectedModel && !isUploaded && (
            <span className="text-[11px] text-[#8B5CF6] font-medium">Đang chọn: {selectedModel.name.split('(')[0]}</span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {demoModels.map((model) => {
            const isSelected = !isUploaded && selectedModel?.id === model.id;
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => onSelectModel(model)}
                className={`relative group rounded-xl overflow-hidden border-2 transition-all p-0.5 text-left ${
                  isSelected
                    ? 'border-[#8B5CF6] ring-2 ring-[#8B5CF6]/30'
                    : 'border-[#E4E4E7] hover:border-[#8B5CF6]/40 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={model.thumbnailUrl}
                    alt={model.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-1.5 bg-white">
                  <p className="text-[11px] font-semibold text-[#18181B] truncate">
                    {model.name.split(' ')[0]}
                  </p>
                  <p className="text-[9px] text-[#71717A]">
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
