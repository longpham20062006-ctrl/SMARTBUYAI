import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
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

  // Debug panel collapsed state (Dev only)
  const [showDevDebug, setShowDevDebug] = useState(false);

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

  // Tính số lượng trang phục đang được chọn
  const selectedGarmentCount = [
    selectedTop,
    selectedBottom,
    selectedOuterwear,
    selectedDress,
    ...selectedAccessories,
  ].filter(Boolean).length;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 pb-24">
      {/* 1. STUDIO HEADER */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3E8FF] border border-[#DDD6FE] text-[#7C3AED] text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SMARTBUY AI · VIRTUAL TRY-ON STUDIO</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#18181B] tracking-tight font-editorial leading-tight">
          Phòng thử đồ AI
        </h1>
        <p className="text-sm sm:text-base text-[#78716C] max-w-xl mx-auto leading-relaxed">
          Xem trước phong cách của bạn cùng SMARTBUY AI. Công nghệ AI Diffusion chân thực giúp bạn tự tin chọn outfit phù hợp nhất.
        </p>
      </div>

      {/* 2. DISCLAIMER & GENTLE NOTICE */}
      <div className="max-w-3xl mx-auto flex items-start gap-3 p-3.5 sm:p-4 bg-white border border-[#ECEAE7] rounded-2xl text-xs text-[#78716C] shadow-xs">
        <div className="w-7 h-7 rounded-xl bg-[#F7F7F6] border border-[#ECEAE7] flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle className="w-4 h-4 text-[#78716C]" />
        </div>
        <div className="space-y-0.5 leading-relaxed">
          <p className="font-semibold text-[#18181B]">Lưu ý về trải nghiệm thử đồ:</p>
          <p>
            Hệ thống tối ưu nhất cho các mẫu áo, sơ mi và áo khoác. Hãy chọn ảnh chụp chính diện, đủ sáng và rõ dáng người để có kết quả mượt mà nhất. Ảnh tạo bởi AI mang tính minh họa trực quan phong cách.
          </p>
        </div>
      </div>

      {/* 3. STEPPER (3 BƯỚC THỬ ĐỒ TRỰC QUAN) */}
      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 p-1.5 bg-white border border-[#ECEAE7] rounded-2xl shadow-xs">
          {/* Bước 1 */}
          <button
            type="button"
            onClick={() => setMobileStep(1)}
            className={`flex items-center gap-2.5 p-2 sm:p-3 rounded-xl transition-all text-left cursor-pointer ${
              mobileStep === 1
                ? 'bg-[#18181B] text-white'
                : 'hover:bg-[#F7F7F6] text-[#292524]'
            }`}
          >
            <div
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                mobileStep === 1
                  ? 'bg-white text-[#18181B]'
                  : uploadedPersonFile || selectedModel
                  ? 'bg-[#166534] text-white'
                  : 'bg-[#F0EFED] text-[#78716C]'
              }`}
            >
              {uploadedPersonFile || selectedModel ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : (
                '1'
              )}
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="text-xs font-semibold truncate leading-tight">Bước 1: Chọn ảnh</p>
              <p className={`text-[10px] truncate ${mobileStep === 1 ? 'text-white/80' : 'text-[#78716C]'}`}>
                {uploadedPersonFile ? 'Ảnh cá nhân' : selectedModel?.name.split(' ')[0] || 'Người mẫu'}
              </p>
            </div>
            <span className="sm:hidden text-xs font-semibold">1. Chọn ảnh</span>
          </button>

          {/* Bước 2 */}
          <button
            type="button"
            onClick={() => setMobileStep(2)}
            className={`flex items-center gap-2.5 p-2 sm:p-3 rounded-xl transition-all text-left cursor-pointer ${
              mobileStep === 2
                ? 'bg-[#18181B] text-white'
                : 'hover:bg-[#F7F7F6] text-[#292524]'
            }`}
          >
            <div
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                mobileStep === 2
                  ? 'bg-white text-[#18181B]'
                  : selectedGarmentCount > 0
                  ? 'bg-[#166534] text-white'
                  : 'bg-[#F0EFED] text-[#78716C]'
              }`}
            >
              {selectedGarmentCount > 0 ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : (
                '2'
              )}
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="text-xs font-semibold truncate leading-tight">Bước 2: Chọn đồ</p>
              <p className={`text-[10px] truncate ${mobileStep === 2 ? 'text-white/80' : 'text-[#78716C]'}`}>
                {selectedGarmentCount > 0 ? `${selectedGarmentCount} món đã chọn` : 'Chưa chọn'}
              </p>
            </div>
            <span className="sm:hidden text-xs font-semibold">2. Chọn đồ</span>
          </button>

          {/* Bước 3 */}
          <button
            type="button"
            onClick={() => setMobileStep(3)}
            className={`flex items-center gap-2.5 p-2 sm:p-3 rounded-xl transition-all text-left cursor-pointer ${
              mobileStep === 3
                ? 'bg-[#18181B] text-white'
                : 'hover:bg-[#F7F7F6] text-[#292524]'
            }`}
          >
            <div
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                mobileStep === 3
                  ? 'bg-white text-[#18181B]'
                  : result
                  ? 'bg-[#166534] text-white'
                  : 'bg-[#F0EFED] text-[#78716C]'
              }`}
            >
              {result ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '3'}
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="text-xs font-semibold truncate leading-tight">Bước 3: Xem kết quả</p>
              <p className={`text-[10px] truncate ${mobileStep === 3 ? 'text-white/80' : 'text-[#78716C]'}`}>
                {result ? 'Đã tạo xong' : 'Tạo & so sánh'}
              </p>
            </div>
            <span className="sm:hidden text-xs font-semibold">3. Kết quả</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN WORKSPACE (2 CỘT DESKTOP: 44% TRÁI / 56% PHẢI) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI: KHU VỰC CHỌN ẢNH & CHỌN TRANG PHỤC (lg:col-span-5) */}
        <div
          className={`lg:col-span-5 space-y-6 ${
            mobileStep === 3 ? 'hidden lg:block' : ''
          }`}
        >
          {/* CARD BƯỚC 1: ẢNH CỦA BẠN / NGƯỜI MẪU */}
          <div
            className={`bg-white p-5 sm:p-6 rounded-2xl border border-[#ECEAE7] shadow-xs space-y-4 ${
              mobileStep === 2 ? 'hidden lg:block' : ''
            }`}
          >
            <div className="flex items-center justify-between border-b border-[#ECEAE7] pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#18181B] tracking-tight">
                  Bước 1: Chọn ảnh thử đồ
                </h2>
                <p className="text-xs text-[#78716C] mt-0.5">
                  {uploadedPersonFile ? 'Đang dùng ảnh cá nhân tải lên' : 'Đang chọn người mẫu mẫu'}
                </p>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F7F7F6] text-[#18181B] border border-[#ECEAE7]">
                Ảnh người
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

            {/* Mobile navigation button: Chuyển sang Bước 2 */}
            <div className="lg:hidden pt-2">
              <Button
                onClick={() => setMobileStep(2)}
                className="w-full text-xs font-semibold h-11 bg-[#18181B] hover:bg-[#27272A] text-white flex items-center justify-center gap-2 rounded-xl cursor-pointer"
              >
                <span>Tiếp tục: Chọn trang phục</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* CARD BƯỚC 2: CHỌN TRANG PHỤC TỪ CỬA HÀNG */}
          <div
            className={`bg-white p-5 sm:p-6 rounded-2xl border border-[#ECEAE7] shadow-xs space-y-4 ${
              mobileStep === 1 ? 'hidden lg:block' : ''
            }`}
          >
            <div className="flex items-center justify-between border-b border-[#ECEAE7] pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#18181B] tracking-tight">
                  Bước 2: Chọn trang phục muốn thử
                </h2>
                <p className="text-xs text-[#78716C] mt-0.5">
                  Chọn các sản phẩm thực tế từ kho thời trang SMARTBUY AI
                </p>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F7F7F6] text-[#18181B] border border-[#ECEAE7]">
                Kho sản phẩm
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

            {/* Mobile navigation buttons: Quay lại Bước 1 / Sang Bước 3 */}
            <div className="lg:hidden pt-2 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setMobileStep(1)}
                className="flex-1 text-xs font-medium h-11 border-[#ECEAE7] flex items-center justify-center gap-1.5 rounded-xl cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại ảnh</span>
              </Button>
              <Button
                onClick={() => setMobileStep(3)}
                className="flex-1 text-xs font-semibold h-11 bg-[#18181B] hover:bg-[#27272A] text-white flex items-center justify-center gap-1.5 rounded-xl cursor-pointer"
              >
                <span>Xem kết quả</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: KHU VỰC XEM TRƯỚC & KẾT QUẢ AI (lg:col-span-7) */}
        <div
          className={`lg:col-span-7 space-y-6 ${
            mobileStep !== 3 ? 'hidden lg:block' : ''
          }`}
        >
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#ECEAE7] shadow-xs space-y-5">
            {/* Header Cột Phải */}
            <div className="flex items-center justify-between border-b border-[#ECEAE7] pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#18181B] tracking-tight flex items-center gap-2">
                  <span>Bước 3: Xem trước & Kết quả thử đồ</span>
                  {result && (
                    <span className="inline-flex items-center gap-1 text-xs text-[#166534] font-medium bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành
                    </span>
                  )}
                </h2>
                <p className="text-xs text-[#78716C] mt-0.5">
                  {result
                    ? 'Kéo thanh trượt để so sánh ảnh gốc và trang phục sau khi AI ghép'
                    : 'Kiểm tra ảnh người mẫu và trang phục trước khi yêu cầu AI xử lý'}
                </p>
              </div>

              {/* Status Engine AI */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F7F7F6] border border-[#ECEAE7] text-[11px] text-[#78716C]">
                <Cpu className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>{providerName.includes('3060') ? 'GPU RTX 3060 AI' : providerName}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isAiConfigured ? 'bg-[#166534]' : 'bg-amber-400'
                  }`}
                  title={isAiConfigured ? 'AI Service Online' : 'AI Service Offline'}
                />
              </div>
            </div>

            {/* KHUNG HIỂN THỊ KẾT QUẢ: BEFORE/AFTER HOẶC PREVIEW BAN ĐẦU */}
            {result ? (
              <div className="space-y-4">
                <BeforeAfterSlider
                  originalImage={result.originalPersonUrl}
                  resultImage={result.resultImageUrl}
                  originalLabel="Ảnh trước khi thử"
                  resultLabel="Outfit AI đã phối"
                />

                {/* HÀNH ĐỘNG KẾT QUẢ: TẢI ẢNH VÀ THỬ LẠI */}
                <div className="p-4 bg-[#F7F7F6] rounded-xl border border-[#ECEAE7] space-y-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#18181B]">Lưu ảnh outfit về thiết bị:</span>
                    <span className="text-[11px] text-[#78716C]">Độ phân giải cao · Tự động watermark</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <Button
                      onClick={() => handleDownload('png')}
                      disabled={isDownloading}
                      className="bg-[#18181B] hover:bg-[#27272A] text-white font-semibold text-xs h-10 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      {isDownloading && downloadFormat === 'png' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>Tải ảnh PNG (Chất lượng cao)</span>
                    </Button>

                    <Button
                      onClick={() => handleDownload('webp')}
                      disabled={isDownloading}
                      variant="outline"
                      className="bg-white hover:bg-[#F0EFED] text-[#18181B] font-semibold text-xs h-10 rounded-xl flex items-center justify-center gap-2 border border-[#ECEAE7] cursor-pointer"
                    >
                      {isDownloading && downloadFormat === 'webp' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>Tải ảnh WebP (Tiết kiệm dung lượng)</span>
                    </Button>
                  </div>

                  {downloadError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[#B91C1C] text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
                      <span>{downloadError}</span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-between items-center text-xs border-t border-[#ECEAE7]">
                    <button
                      type="button"
                      onClick={() => setMobileStep(2)}
                      className="text-[#7C3AED] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Đổi trang phục khác</span>
                    </button>
                    <button
                      type="button"
                      onClick={executeTryOn}
                      className="flex items-center gap-1.5 text-[#78716C] hover:text-[#18181B] font-medium cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Thử lại outfit này</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* KHI CHƯA CÓ KẾT QUẢ: KHUNG XEM TRƯỚC ẢNH VÀ NÚT TẠO ẢNH */
              <div className="space-y-4">
                <div className="relative aspect-[3/4] max-h-[580px] w-full rounded-2xl overflow-hidden border border-[#ECEAE7] bg-[#F7F7F6] mx-auto flex items-center justify-center">
                  <img
                    src={currentPersonImage}
                    alt="Người mẫu xem trước"
                    className="w-full h-full object-contain"
                  />

                  {/* Gradient overlay & thông tin trang phục đang chọn */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 sm:p-6 text-white space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider w-fit border border-white/20">
                      <Sparkles className="w-3 h-3 text-[#DDD6FE]" />
                      <span>Sẵn sàng thử đồ</span>
                    </div>
                    <p className="text-base sm:text-lg font-bold tracking-tight">
                      {uploadedPersonFile ? 'Ảnh của bạn đã sẵn sàng' : selectedModel?.name}
                    </p>
                    <p className="text-xs text-white/80 leading-snug">
                      Đã chọn:{' '}
                      <span className="text-white font-medium">
                        {[
                          selectedTop?.name,
                          selectedOuterwear?.name,
                          selectedBottom?.name,
                          selectedDress?.name,
                          ...selectedAccessories.map((a) => a.name),
                        ]
                          .filter(Boolean)
                          .join(' + ') || 'Chưa chọn trang phục (Nhấp Bước 2 để chọn)'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* NÚT KÍCH HOẠT TẠO ẢNH THỬ ĐỒ BẰNG AI */}
                <div className="space-y-2.5">
                  {status === 'processing' ? (
                    <div className="space-y-2 bg-[#F7F7F6] p-4 rounded-xl border border-[#ECEAE7]">
                      <Button
                        disabled
                        className="w-full h-12 bg-[#18181B] text-white font-semibold flex items-center justify-center gap-2 rounded-xl"
                      >
                        <Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" />
                        <span>AI đang phân tích và xử lý khuếch tán trang phục...</span>
                      </Button>
                      <div className="flex items-center justify-between text-xs text-[#78716C] px-1">
                        <span>Thời gian ước tính: 5–15 giây</span>
                        <button
                          type="button"
                          onClick={cancelProcessing}
                          className="text-[#B91C1C] hover:underline cursor-pointer"
                        >
                          Hủy xử lý
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={executeTryOn}
                      className="w-full h-12 bg-[#18181B] hover:bg-[#27272A] text-white font-bold text-sm tracking-wide uppercase rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#DDD6FE] animate-pulse" />
                      <span>Tạo ảnh thử đồ bằng AI</span>
                    </Button>
                  )}

                  {/* THÔNG BÁO LỖI HOẶC CHƯA CẤU HÌNH */}
                  {errorMessage && (
                    <div className="p-3.5 bg-red-50 text-[#B91C1C] text-xs rounded-xl border border-red-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        <XCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
                        <span>{status === 'unconfigured' ? 'Chưa kết nối dịch vụ AI' : 'Thông báo từ máy chủ AI'}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-red-900">{errorMessage}</p>
                      {status === 'unconfigured' && (
                        <div className="mt-2 pt-2 border-t border-red-200/60 text-[10px] text-red-700 space-y-0.5">
                          <p>• Mô hình AI: Hỗ trợ CatVTON / IDM-VTON / Fashn Serverless Endpoint.</p>
                          <p>
                            • Biến môi trường: <code className="bg-red-100 px-1 py-0.5 rounded font-mono">VITE_TRYON_API_ENDPOINT</code>
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Nút quay lại trên Mobile */}
                  <div className="lg:hidden pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setMobileStep(2)}
                      className="w-full text-xs font-medium h-11 border-[#ECEAE7] flex items-center justify-center gap-1 rounded-xl cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Đổi trang phục khác</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. THÔNG SỐ KỸ THUẬT (DÀNH CHO NHÀ PHÁT TRIỂN - GỌN GÀNG, MẶC ĐỊNH THU GỌN) */}
      {import.meta.env.DEV && (
        <div className="border border-[#ECEAE7] bg-white rounded-2xl overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setShowDevDebug(!showDevDebug)}
            className="w-full p-3 px-4 flex items-center justify-between text-[#78716C] hover:text-[#18181B] hover:bg-[#F7F7F6] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <Cpu className="w-4 h-4 text-[#7C3AED]" />
              <span className="font-semibold text-[#18181B]">Developer Debug & GPU Pipeline</span>
              <span className="px-1.5 py-0.2 bg-[#F0EFED] text-[#78716C] rounded text-[10px]">
                DEV MODE ONLY
              </span>
            </div>
            {showDevDebug ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showDevDebug && (
            <div className="p-4 bg-slate-900 border-t border-slate-800 text-slate-200 space-y-3 font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                  <span className="text-slate-400 text-[10px] block">Món đồ đang chọn:</span>
                  <span className="font-semibold text-emerald-300 truncate block">
                    {selectedTop?.name || selectedOuterwear?.name || 'Chưa chọn áo'}
                  </span>
                  <span className="text-[10px] text-slate-400">ID: {selectedTop?.id || selectedOuterwear?.id || 'N/A'}</span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                  <span className="text-slate-400 text-[10px] block">Mã Job / Tác vụ:</span>
                  <span className="font-semibold text-indigo-300 truncate block">
                    {result?.debugInfo?.jobId || (status === 'processing' ? 'Đang tạo...' : 'Chưa có')}
                  </span>
                  <span className="text-[10px] text-slate-400">Req: {result?.debugInfo?.requestId || 'N/A'}</span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                  <span className="text-slate-400 text-[10px] block">Model AI Inference:</span>
                  <span className="font-semibold text-amber-300 truncate block">
                    {result?.debugInfo?.modelName || 'CatVTON-SD15-FP16 (RTX 3060)'}
                  </span>
                  <span className="text-[10px] text-slate-400">SCHP Parser + Rembg</span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                  <span className="text-slate-400 text-[10px] block">Trạng thái:</span>
                  <span
                    className={`font-semibold capitalize block ${
                      status === 'completed'
                        ? 'text-emerald-400'
                        : status === 'processing'
                        ? 'text-amber-400 animate-pulse'
                        : status === 'failed'
                        ? 'text-red-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {status}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {result ? `${result.processingDurationMs}ms` : 'Sẵn sàng'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
