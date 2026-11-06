import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  AlertCircle,
  Loader2,
  CheckCircle2,
  HelpCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { useVirtualTryOn } from '../hooks/useVirtualTryOn';
import { UploadDropzone } from './UploadDropzone';
import { GarmentSelector } from './GarmentSelector';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { Button } from '@/components/ui/button';

export const VirtualTryOnStudio: React.FC = () => {
  const {
    selectedModel,
    uploadedPersonFile,
    currentPersonImage,
    selectedTop,
    selectedBottom,
    selectedOuterwear,
    selectedDress,
    selectedAccessories,
    status,
    result,
    errorMessage,
    isAiConfigured,
    providerName,
    handleUploadPersonImage,
    handleSelectDemoModel,
    clearUploadedImage,
    setSelectedTop,
    setSelectedBottom,
    setSelectedOuterwear,
    setSelectedDress,
    toggleAccessory,
    executeTryOn,
    cancelProcessing,
    downloadResultImage,
  } = useVirtualTryOn();

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'webp'>('png');
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Mobile step wizard: 1: Ảnh người -> 2: Chọn đồ -> 3: Xem trước & Tạo ảnh
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);

  const handleDownload = async (format: 'png' | 'webp') => {
    setIsDownloading(true);
    setDownloadFormat(format);
    setDownloadError(null);
    try {
      await downloadResultImage(format);
    } catch (err: any) {
      setDownloadError(err.message || 'Không thể tải ảnh về thiết bị.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Tiêu đề Studio */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3E8FF] text-[#8B5CF6] text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          SMARTBUY AI · VIRTUAL TRY-ON STUDIO
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#18181B] tracking-tight uppercase">
          Phòng Thử Đồ Bằng AI
        </h1>
        <p className="text-sm sm:text-base text-[#71717A]">
          Thử áo, quần, váy và phụ kiện trực tiếp trên ảnh của bạn hoặc người mẫu với công nghệ AI Diffusion chân thực.
        </p>
      </div>

      {/* Cảnh báo minh họa chuẩn Section 3 */}
      <div className="flex items-start gap-3 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-amber-900 text-xs sm:text-sm">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-amber-950">Lưu ý về tính năng Thử Đồ AI:</p>
          <p className="text-amber-800/90 text-xs leading-relaxed">
            Ảnh thử đồ được tạo bằng AI, chỉ mang tính minh họa. Độ vừa vặn thực tế phụ thuộc vào số đo và bảng size sản phẩm.
          </p>
        </div>
      </div>

      {/* Mobile Step Wizard Tabs (Section 11) */}
      <div className="lg:hidden flex items-center justify-between border-b border-[#E4E4E7] pb-2">
        <button
          type="button"
          onClick={() => setMobileStep(1)}
          className={`flex-1 text-center py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            mobileStep === 1
              ? 'border-[#8B5CF6] text-[#8B5CF6]'
              : 'border-transparent text-[#71717A]'
          }`}
        >
          1. Ảnh của bạn
        </button>
        <button
          type="button"
          onClick={() => setMobileStep(2)}
          className={`flex-1 text-center py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            mobileStep === 2
              ? 'border-[#8B5CF6] text-[#8B5CF6]'
              : 'border-transparent text-[#71717A]'
          }`}
        >
          2. Chọn đồ
        </button>
        <button
          type="button"
          onClick={() => setMobileStep(3)}
          className={`flex-1 text-center py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            mobileStep === 3
              ? 'border-[#8B5CF6] text-[#8B5CF6]'
              : 'border-transparent text-[#71717A]'
          }`}
        >
          3. Xem trước
        </button>
      </div>

      {/* Bố cục chính */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI: Khu vực A (Ảnh người) & Khu vực B (Chọn đồ) */}
        <div
          className={`lg:col-span-6 xl:col-span-5 space-y-6 ${
            mobileStep === 3 ? 'hidden lg:block' : ''
          }`}
        >
          {/* KHU VỰC A — ẢNH NGƯỜI DÙNG */}
          <div
            className={`bg-white p-6 rounded-3xl border border-[#E4E4E7] shadow-sm space-y-4 ${
              mobileStep === 2 ? 'hidden lg:block' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#18181B] uppercase tracking-wide">
                  Khu vực A: Ảnh của bạn
                </h2>
                <p className="text-xs text-[#71717A]">
                  {uploadedPersonFile ? 'Đang dùng ảnh cá nhân tải lên' : 'Đang chọn người mẫu mẫu'}
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F4F4F5] text-[#18181B]">
                Bước 1
              </span>
            </div>

            <UploadDropzone
              currentPersonImage={currentPersonImage}
              isUploaded={!!uploadedPersonFile}
              selectedModel={selectedModel}
              onUploadFile={handleUploadPersonImage}
              onSelectModel={handleSelectDemoModel}
              onClearUploaded={clearUploadedImage}
            />

            <div className="lg:hidden pt-2">
              <Button
                variant="accent"
                onClick={() => setMobileStep(2)}
                className="w-full text-xs font-bold h-10 flex items-center justify-center gap-1.5"
              >
                <span>Tiếp tục: Chọn đồ muốn thử</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* KHU VỰC B — CHỌN TRANG PHỤC */}
          <div
            className={`bg-white p-6 rounded-3xl border border-[#E4E4E7] shadow-sm space-y-4 ${
              mobileStep === 1 ? 'hidden lg:block' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#18181B] uppercase tracking-wide">
                  Khu vực B: Chọn đồ muốn thử
                </h2>
                <p className="text-xs text-[#71717A]">
                  Sản phẩm thật từ SMARTBUY AI (Hỗ trợ phối Áo + Quần + Phụ kiện)
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F4F4F5] text-[#18181B]">
                Bước 2
              </span>
            </div>

            <GarmentSelector
              selectedTop={selectedTop}
              selectedBottom={selectedBottom}
              selectedOuterwear={selectedOuterwear}
              selectedDress={selectedDress}
              selectedAccessories={selectedAccessories}
              onSelectTop={setSelectedTop}
              onSelectBottom={setSelectedBottom}
              onSelectOuterwear={setSelectedOuterwear}
              onSelectDress={setSelectedDress}
              onToggleAccessory={toggleAccessory}
            />

            <div className="lg:hidden pt-2 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setMobileStep(1)}
                className="flex-1 text-xs font-semibold h-10 flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại ảnh</span>
              </Button>
              <Button
                variant="accent"
                onClick={() => setMobileStep(3)}
                className="flex-1 text-xs font-bold h-10 flex items-center justify-center gap-1"
              >
                <span>Xem trước kết quả</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: KHU VỰC C — ẢNH AI TẠO RA (7 Cột) */}
        <div
          className={`lg:col-span-6 xl:col-span-7 space-y-6 ${
            mobileStep !== 3 ? 'hidden lg:block' : ''
          }`}
        >
          <div className="bg-white p-6 rounded-3xl border border-[#E4E4E7] shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#18181B] uppercase tracking-wide flex items-center gap-2">
                  <span>Khu vực C: Xem trước outfit của bạn</span>
                  {result && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành
                    </span>
                  )}
                </h2>
                <p className="text-xs text-[#71717A]">
                  {result ? 'Kéo thanh trượt để so sánh ảnh gốc và ảnh AI đã phối đồ' : 'Xem trước người mẫu và trang phục trước khi tạo'}
                </p>
              </div>

              {/* Thông tin Engine AI Backend */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F4F4F5] text-[11px] text-[#71717A]">
                <HelpCircle className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>Engine: {providerName}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isAiConfigured ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                  title={isAiConfigured ? 'Đã kết nối API' : 'Chưa cấu hình API'}
                />
              </div>
            </div>

            {/* Khung hiển thị: So sánh Trước / Sau khi có kết quả, hoặc Ảnh người mẫu ban đầu */}
            {result ? (
              <div className="space-y-4">
                <BeforeAfterSlider
                  originalImage={result.originalPersonUrl}
                  resultImage={result.resultImageUrl}
                  originalLabel="Trước khi thử"
                  resultLabel="Outfit AI đã tạo"
                />

                {/* Các thao tác kết quả theo Section 2 & 9 */}
                <div className="p-4 bg-[#FAFAF8] rounded-2xl border border-[#E4E4E7] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#18181B]">Lưu ảnh kết quả về thiết bị:</span>
                    <span className="text-[#71717A]">Tên file: SMARTBUY-AI-TRYON-*.png</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <Button
                      onClick={() => handleDownload('png')}
                      disabled={isDownloading}
                      className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold text-xs h-10 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      {isDownloading && downloadFormat === 'png' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>Tải ảnh PNG (Gốc)</span>
                    </Button>

                    <Button
                      onClick={() => handleDownload('webp')}
                      disabled={isDownloading}
                      variant="outline"
                      className="bg-white hover:bg-[#F4F4F5] text-[#18181B] font-semibold text-xs h-10 rounded-xl flex items-center justify-center gap-2 border border-[#E4E4E7] cursor-pointer"
                    >
                      {isDownloading && downloadFormat === 'webp' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>Tải WebP (Nhẹ)</span>
                    </Button>
                  </div>

                  {downloadError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{downloadError}</span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-between items-center text-xs">
                    <button
                      type="button"
                      onClick={() => setMobileStep(2)}
                      className="text-[#8B5CF6] hover:underline font-semibold"
                    >
                      ← Thay trang phục khác
                    </button>
                    <button
                      type="button"
                      onClick={executeTryOn}
                      className="flex items-center gap-1 text-[#71717A] hover:text-[#18181B]"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Thử lại</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Khi chưa có ảnh kết quả: Khung xem trước người mẫu */
              <div className="space-y-4">
                <div className="relative aspect-[3/4] max-h-[560px] w-full rounded-2xl overflow-hidden border border-[#E4E4E7] bg-gray-50 mx-auto">
                  <img
                    src={currentPersonImage}
                    alt="Người mẫu xem trước"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6 text-white space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#8B5CF6] text-white text-[10px] font-bold uppercase tracking-wider w-fit">
                      <Sparkles className="w-3 h-3" /> Sẵn sàng thử đồ
                    </div>
                    <p className="text-lg font-bold">
                      {uploadedPersonFile ? 'Ảnh của bạn đã sẵn sàng' : selectedModel?.name}
                    </p>
                    <p className="text-xs text-white/80">
                      Đã chọn:{' '}
                      {[
                        selectedTop?.name,
                        selectedBottom?.name,
                        selectedOuterwear?.name,
                        selectedDress?.name,
                        ...selectedAccessories.map((a) => a.name),
                      ]
                        .filter(Boolean)
                        .join(' + ') || 'Chưa chọn trang phục'}
                    </p>
                  </div>
                </div>

                {/* Nút Tạo ảnh thử đồ chính */}
                <div className="space-y-2.5">
                  {status === 'processing' ? (
                    <div className="space-y-2">
                      <Button
                        disabled
                        className="w-full h-12 bg-[#8B5CF6] text-white font-bold flex items-center justify-center gap-2 rounded-xl"
                      >
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>AI đang phân tích và tạo ảnh outfit...</span>
                      </Button>
                      <button
                        type="button"
                        onClick={cancelProcessing}
                        className="w-full text-center text-xs text-red-600 hover:underline py-1"
                      >
                        Hủy yêu cầu xử lý
                      </button>
                    </div>
                  ) : (
                    <Button
                      onClick={executeTryOn}
                      className="w-full h-12 bg-[#18181B] hover:bg-[#303036] text-white font-bold text-sm tracking-wide uppercase rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#8B5CF6] animate-pulse" />
                      <span>Tạo ảnh thử đồ bằng AI</span>
                    </Button>
                  )}

                  {/* Thông báo lỗi hoặc Trạng thái chưa kết nối AI thật theo Section 7 */}
                  {errorMessage && (
                    <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>{status === 'unconfigured' ? 'Chưa kết nối dịch vụ AI' : 'Lỗi xử lý'}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-red-800">{errorMessage}</p>
                      {status === 'unconfigured' && (
                        <div className="mt-2 pt-2 border-t border-red-200/60 text-[10px] text-red-600 space-y-0.5">
                          <p>• Mô hình AI: Hỗ trợ IDM-VTON / Fashn / Kling Serverless Endpoint.</p>
                          <p>• Biến môi trường cần thiết: <code className="bg-red-100 px-1 py-0.5 rounded font-mono">VITE_TRYON_API_ENDPOINT</code></p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="lg:hidden pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setMobileStep(2)}
                      className="w-full text-xs font-semibold h-10 flex items-center justify-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Đổi trang phục</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KHU VỰC KIỂM TRA CHO NHÀ PHÁT TRIỂN (DEVELOPER DEBUG PANEL - DEV ONLY) */}
      {import.meta.env.DEV && (
        <div className="mt-8 p-6 bg-slate-900 border border-slate-700 rounded-3xl text-slate-200 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Developer Debug: Kiểm tra luồng dữ liệu & Model AI Thật
              </h3>
            </div>
            <span className="text-[11px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
              DEV MODE ONLY
            </span>
          </div>

          {/* Bảng thông số kỹ thuật tác vụ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 text-[10px] block">Sản phẩm đang chọn:</span>
              <span className="font-semibold text-emerald-300 truncate block">
                {selectedTop?.name || 'Chưa chọn áo'}
              </span>
              <span className="text-[10px] text-slate-400">ID: {selectedTop?.id || 'N/A'}</span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 text-[10px] block">Mã Job / Tác vụ GPU:</span>
              <span className="font-semibold text-indigo-300 truncate block">
                {result?.debugInfo?.jobId || (status === 'processing' ? 'Đang khởi tạo...' : 'Chưa có')}
              </span>
              <span className="text-[10px] text-slate-400">Req: {result?.debugInfo?.requestId || 'N/A'}</span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 text-[10px] block">Mô hình AI Inference:</span>
              <span className="font-semibold text-amber-300 truncate block">
                {result?.debugInfo?.modelName || 'CatVTON-SD15-FP16 (RTX 3060)'}
              </span>
              <span className="text-[10px] text-slate-400">SCHP Human Parser + Rembg</span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 text-[10px] block">Trạng thái Inference:</span>
              <span className={`font-semibold capitalize block ${
                status === 'completed' ? 'text-emerald-400' :
                status === 'processing' ? 'text-amber-400 animate-pulse' :
                status === 'failed' ? 'text-red-400' : 'text-slate-400'
              }`}>
                {status}
              </span>
              <span className="text-[10px] text-slate-400">
                {result ? `${result.processingDurationMs}ms` : 'Sẵn sàng'}
              </span>
            </div>
          </div>

          {/* Lưới so sánh 4 ảnh nguồn: Người gốc | Áo chọn | Áo gửi lên backend | Ảnh kết quả */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {/* 1. Ảnh người gốc */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>1. Ảnh người gốc</span>
              </div>
              <div className="aspect-[3/4] bg-slate-950 rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
                {currentPersonImage ? (
                  <img
                    src={currentPersonImage}
                    alt="Người gốc"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-slate-500">Chưa có ảnh</span>
                )}
              </div>
            </div>

            {/* 2. Áo đang chọn */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>2. Áo đang chọn (Frontend)</span>
              </div>
              <div className="aspect-[3/4] bg-slate-950 rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
                {selectedTop?.imageUrl ? (
                  <img
                    src={selectedTop.imageUrl}
                    alt="Áo chọn"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <span className="text-xs text-slate-500">Chưa chọn áo</span>
                )}
              </div>
            </div>

            {/* 3. Áo thực tế gửi lên backend */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>3. Áo thực tế gửi lên GPU</span>
              </div>
              <div className="aspect-[3/4] bg-slate-950 rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
                {result?.debugInfo?.backendGarmentUrl ? (
                  <img
                    src={result.debugInfo.backendGarmentUrl}
                    alt="Áo backend"
                    className="w-full h-full object-contain p-2"
                  />
                ) : selectedTop?.imageUrl ? (
                  <img
                    src={selectedTop.imageUrl}
                    alt="Áo chuẩn bị gửi"
                    className="w-full h-full object-contain p-2 opacity-70"
                  />
                ) : (
                  <span className="text-xs text-slate-500">Chưa có tác vụ</span>
                )}
              </div>
            </div>

            {/* 4. Ảnh kết quả */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>4. Ảnh kết quả AI</span>
              </div>
              <div className="aspect-[3/4] bg-slate-950 rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
                {result?.resultImageUrl ? (
                  <img
                    src={result.resultImageUrl}
                    alt="Kết quả AI"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-slate-500">Chưa có kết quả</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
