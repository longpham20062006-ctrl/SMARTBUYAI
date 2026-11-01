import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Camera,
  CheckCircle2,
  Download,
  ImagePlus,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
  UploadCloud,
  X,
  Maximize2,
  Shirt,
  Info,
  Search,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { MockRepo } from '@/mocks/repository';
import type { Product } from '@/types';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import {
  getCatalogueImage,
  getTryOnCategory,
  requestProductTryOn,
  requestCustomGarmentTryOn,
  VtonCategory,
} from '../services/productTryOnApi';
import { BackButton } from '@/components/common/BackButton';
import { Button } from '@/components/ui/button';

type CameraStatus = 'idle' | 'on' | 'error';
type GarmentSourceMode = 'shop' | 'custom';

export function ProductTryOn() {
  const [searchParams] = useSearchParams();
  const [chosenId, setChosenId] = useState('');
  const products = useMemo(() => MockRepo.getProducts(), []);
  const requestedId = searchParams.get('productId') || searchParams.get('slug');
  const defaultProduct = products.find(p => p.id === (chosenId || requestedId) || p.slug === (chosenId || requestedId)) || products[0];
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(defaultProduct);

  // Garment Source Mode: 'shop' hoặc 'custom'
  const [garmentMode, setGarmentMode] = useState<GarmentSourceMode>('shop');

  // Custom garment upload state
  const [customGarmentFile, setCustomGarmentFile] = useState<File | null>(null);
  const [customGarmentPreview, setCustomGarmentPreview] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<VtonCategory>('tops');

  // Modal chọn sản phẩm từ catalog
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [modalSearchText, setModalSearchText] = useState('');
  const [modalGenderFilter, setModalGenderFilter] = useState<'all' | 'nam' | 'nu'>('all');

  // Fullscreen / Zoom Lightbox Modal
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Person photo state
  const [person, setPerson] = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState('');

  // Result state
  const [imageResult, setImageResult] = useState('');
  const [working, setWorking] = useState(false);
  const [stage, setStage] = useState('');
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const [timeUsed, setTimeUsed] = useState<number | undefined>(undefined);

  // Camera state
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Refs
  const personInputRef = useRef<HTMLInputElement>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const personRef = useRef('');
  const customGarmentRef = useRef('');
  const resultRef = useRef('');
  const requestCountRef = useRef(0);

  // Active garment image & category
  const shopGarmentImage = selectedProduct ? getCatalogueImage(selectedProduct, searchParams.get('image')) : '';
  const effectiveGarmentImage = garmentMode === 'shop' ? shopGarmentImage : customGarmentPreview;
  const effectiveCategory = garmentMode === 'shop'
    ? (selectedProduct ? getTryOnCategory(selectedProduct) : 'tops')
    : customCategory;

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraStatus('idle');
  }, []);

  useEffect(() => () => {
    controller.current?.abort();
    streamRef.current?.getTracks().forEach(track => track.stop());
    if (personRef.current) URL.revokeObjectURL(personRef.current);
    if (customGarmentRef.current) URL.revokeObjectURL(customGarmentRef.current);
    if (resultRef.current) URL.revokeObjectURL(resultRef.current);
  }, []);

  const clearResult = useCallback(() => {
    if (resultRef.current) URL.revokeObjectURL(resultRef.current);
    resultRef.current = '';
    setImageResult('');
    setTimeUsed(undefined);
    setWarning('');
    setError('');
  }, []);

  useEffect(() => {
    clearResult();
  }, [selectedProduct?.id, garmentMode, customGarmentPreview, clearResult]);

  const onPerson = (file: File) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 10 * 1024 * 1024 || file.size < 1000) {
      setError('Ảnh người dùng chỉ nhận định dạng JPG, PNG hoặc WebP từ 1 KB đến 10 MB.');
      return;
    }
    controller.current?.abort();
    stopCamera();
    if (personRef.current) URL.revokeObjectURL(personRef.current);
    personRef.current = URL.createObjectURL(file);
    setPerson(file);
    setPersonPreview(personRef.current);
    clearResult();
  };

  const onCustomGarment = (file: File) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 10 * 1024 * 1024 || file.size < 1000) {
      setError('Ảnh trang phục chỉ nhận định dạng JPG, PNG hoặc WebP từ 1 KB đến 10 MB.');
      return;
    }
    if (customGarmentRef.current) URL.revokeObjectURL(customGarmentRef.current);
    customGarmentRef.current = URL.createObjectURL(file);
    setCustomGarmentFile(file);
    setCustomGarmentPreview(customGarmentRef.current);
    setGarmentMode('custom');
    clearResult();
  };

  const startCamera = async () => {
    setCameraError('');
    stopCamera();
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Webcam yêu cầu HTTPS hoặc localhost. Hãy chạy website tại http://localhost:5173 trên laptop.');
      setCameraStatus('error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraStatus('on');
    } catch {
      setCameraStatus('error');
      setCameraError('Không mở được webcam. Vui lòng cấp quyền truy cập Camera trên trình duyệt.');
    }
  };

  useEffect(() => {
    if (cameraStatus === 'on' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => { });
    }
  }, [cameraStatus]);

  const capture = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setCameraError('Camera chưa sẵn sàng.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (blob) onPerson(new File([blob], `webcam-${Date.now()}.jpg`, { type: 'image/jpeg' }));
  };

  const generate = async () => {
    if (!person || working) return;
    if (garmentMode === 'shop' && (!selectedProduct || !shopGarmentImage || !effectiveCategory)) {
      setError('Vui lòng chọn sản phẩm hợp lệ từ website trước khi thử.');
      return;
    }
    if (garmentMode === 'custom' && (!customGarmentFile || !customCategory)) {
      setError('Vui lòng tải ảnh trang phục và chọn danh mục phù hợp.');
      return;
    }

    clearResult();
    const abort = new AbortController();
    controller.current = abort;
    setWorking(true);
    setStage('Đang chuẩn bị ảnh & kết nối GPU RTX 3060...');

    try {
      const seed = 42 + requestCountRef.current++;
      let response: { image: Blob; warnings: string[]; seconds?: number };

      if (garmentMode === 'shop' && selectedProduct) {
        response = await requestProductTryOn({
          person,
          product: selectedProduct,
          productImage: shopGarmentImage,
          signal: abort.signal,
          seed,
          onProgress: setStage,
        });
      } else if (garmentMode === 'custom' && customGarmentFile) {
        response = await requestCustomGarmentTryOn({
          person,
          garment: customGarmentFile,
          category: customCategory,
          signal: abort.signal,
          seed,
          onProgress: setStage,
        });
      } else {
        throw new Error('Chưa đủ thông tin để thực hiện thử đồ.');
      }

      if (abort.signal.aborted) return;
      const url = URL.createObjectURL(response.image);
      resultRef.current = url;
      setImageResult(url);
      setTimeUsed(response.seconds);
      if (response.warnings.length) {
        setWarning('AI phát hiện lưu ý: ' + response.warnings.slice(0, 2).join('; '));
      }
    } catch (err: any) {
      if (!abort.signal.aborted) {
        const msg = err instanceof Error ? err.message : 'Không thể tạo ảnh thử đồ.';
        setError(msg);
      }
    } finally {
      if (controller.current === abort) controller.current = null;
      setWorking(false);
      setStage('');
    }
  };

  // Drop handlers
  const onPersonDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) onPerson(file);
  };

  const onGarmentDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) onCustomGarment(file);
  };

  // Modal filtered products
  const filteredModalProducts = useMemo(() => {
    return products.filter((p) => {
      const hasCat = Boolean(getTryOnCategory(p));
      const matchGender = modalGenderFilter === 'all' || p.gender === modalGenderFilter || p.gender === 'unisex';
      const matchText = !modalSearchText || p.name.toLowerCase().includes(modalSearchText.toLowerCase()) || p.brand.toLowerCase().includes(modalSearchText.toLowerCase());
      return hasCat && matchGender && matchText;
    });
  }, [products, modalGenderFilter, modalSearchText]);

  return (
    <main className="bg-[#FAFAF8] min-h-screen py-8 sm:py-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Top Bar with BackButton & Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <BackButton fallbackPath="/shop" label="Quay lại" />

          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#71717A]">
            <Link to="/" className="hover:text-[#8B5CF6] transition-colors">Trang chủ</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-[#8B5CF6] transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-[#8B5CF6] font-bold">Thử đồ AI</span>
          </nav>
        </div>

        {/* Page Title & Subtitle */}
        <div className="bg-white rounded-3xl border border-[#E4E4E7] p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3E8FF] text-[#7C3AED] text-xs font-bold uppercase tracking-wider mb-2 border border-[#DDD6FE]">
                <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>AI VIRTUAL TRY-ON // GPU GEFORCE RTX 3060</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-[#18181B] uppercase tracking-tight">
                Phòng Thử Đồ Trực Tuyến SMARTBUY AI
              </h1>
              <p className="text-xs sm:text-sm text-[#71717A] mt-1.5 max-w-2xl leading-relaxed">
                Tải ảnh của bạn, chọn trang phục từ catalog SMARTBUY hoặc tải ảnh áo quần riêng.
                Mô hình FASHN VTON sẽ ướm thử trang phục lên vóc dáng thực tế trong vài giây.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start lg:self-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>GPU Server 7860 Sẵn Sàng</span>
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3 CỘT CÂN ĐỐI TRÊN DESKTOP (CỘT 1: NGƯỜI DÙNG | CỘT 2: TRANG PHỤC | CỘT 3: KẾT QUẢ) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

          {/* ============================================================ */}
          {/* CỘT 1: ẢNH NGƯỜI DÙNG                                         */}
          {/* ============================================================ */}
          <div className="bg-white rounded-3xl border border-[#E4E4E7] p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              {/* Header Cột 1 */}
              <div className="flex items-center justify-between border-b border-[#F2F3F5] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#8B5CF6] text-white flex items-center justify-center text-xs font-black">
                    1
                  </div>
                  <h2 className="text-sm sm:text-base font-black uppercase text-[#18181B]">
                    Ảnh Của Bạn
                  </h2>
                </div>

                {person && (
                  <button
                    type="button"
                    onClick={() => {
                      controller.current?.abort();
                      clearResult();
                      setPerson(null);
                      if (personRef.current) URL.revokeObjectURL(personRef.current);
                      personRef.current = '';
                      setPersonPreview('');
                    }}
                    className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Xóa ảnh</span>
                  </button>
                )}
              </div>

              {/* Khung Xem Trước / Tải Lên */}
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#F4F4F5] border border-[#E4E4E7] flex flex-col items-center justify-center">
                {personPreview ? (
                  <img
                    src={personPreview}
                    alt="Ảnh người dùng xem trước"
                    className="w-full h-full object-cover object-center"
                  />
                ) : cameraStatus === 'on' ? (
                  <div className="relative w-full h-full bg-black flex flex-col items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 inset-x-4 flex gap-2 justify-center z-10">
                      <Button
                        size="sm"
                        onClick={capture}
                        className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold"
                      >
                        Chụp ảnh này
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={stopCamera}
                        className="text-xs font-bold"
                      >
                        Đóng camera
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDrop={onPersonDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => personInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    className="w-full h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-[#F3E8FF]/30 transition-colors group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-[#E4E4E7] flex items-center justify-center text-[#8B5CF6] mb-3 group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-[#18181B]">
                      Tải ảnh từ máy tính hoặc điện thoại
                    </p>
                    <p className="text-[11px] text-[#71717A] mt-1.5 leading-relaxed">
                      Kéo thả ảnh vào đây hoặc nhấn để chọn file (JPG, PNG, WEBP từ 1 KB đến 10 MB)
                    </p>
                  </div>
                )}

                <input
                  ref={personInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPerson(f);
                    e.currentTarget.value = '';
                  }}
                />
              </div>

              {/* Nút Chọn ảnh & Chụp ảnh */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => personInputRef.current?.click()}
                  className="text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <ImagePlus className="w-4 h-4 text-[#8B5CF6]" />
                  <span>{person ? 'Thay ảnh khác' : 'Chọn ảnh'}</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={startCamera}
                  className="text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4 text-[#8B5CF6]" />
                  <span>Chụp webcam</span>
                </Button>
              </div>

              {cameraError && (
                <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 mt-2">
                  {cameraError}
                </p>
              )}
            </div>

            {/* Hướng Dẫn Chọn Ảnh Phù Hợp */}
            <div className="bg-[#FAFAF9] rounded-2xl p-3.5 border border-[#E4E4E7] text-left space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#18181B]">
                <Info className="w-4 h-4 text-[#8B5CF6]" />
                <span>Mẹo chọn ảnh ghép đẹp nhất:</span>
              </div>
              <ul className="text-[11px] text-[#71717A] space-y-1 pl-4 list-disc leading-relaxed">
                <li>Đứng thẳng, hai tay thả lỏng tự nhiên, chụp rõ nửa người hoặc cả người.</li>
                <li>Ánh sáng sáng sủa, nền phía sau càng đơn giản càng nét.</li>
                <li>Hạn chế mặc áo quá phồng hoặc khoác quá nhiều lớp.</li>
              </ul>
            </div>
          </div>

          {/* ============================================================ */}
          {/* CỘT 2: ẢNH TRANG PHỤC                                         */}
          {/* ============================================================ */}
          <div className="bg-white rounded-3xl border border-[#E4E4E7] p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              {/* Header Cột 2 */}
              <div className="flex items-center justify-between border-b border-[#F2F3F5] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#8B5CF6] text-white flex items-center justify-center text-xs font-black">
                    2
                  </div>
                  <h2 className="text-sm sm:text-base font-black uppercase text-[#18181B]">
                    Trang Phục Thử
                  </h2>
                </div>

                {garmentMode === 'custom' && customGarmentFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomGarmentFile(null);
                      if (customGarmentRef.current) URL.revokeObjectURL(customGarmentRef.current);
                      customGarmentRef.current = '';
                      setCustomGarmentPreview('');
                      setGarmentMode('shop');
                    }}
                    className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Bỏ ảnh riêng</span>
                  </button>
                )}
              </div>

              {/* Mode Switch: Chọn từ Shop HOẶC Tải ảnh riêng */}
              <div className="grid grid-cols-2 p-1 bg-[#F4F4F5] rounded-2xl mb-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setGarmentMode('shop')}
                  className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${garmentMode === 'shop'
                      ? 'bg-white text-[#18181B] shadow-xs'
                      : 'text-[#71717A] hover:text-[#18181B]'
                    }`}
                >
                  Từ Shop SMARTBUY
                </button>
                <button
                  type="button"
                  onClick={() => setGarmentMode('custom')}
                  className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${garmentMode === 'custom'
                      ? 'bg-white text-[#18181B] shadow-xs'
                      : 'text-[#71717A] hover:text-[#18181B]'
                    }`}
                >
                  Tải ảnh đồ riêng
                </button>
              </div>

              {/* Khung Xem Trước Trang Phục */}
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#F4F4F5] border border-[#E4E4E7] flex flex-col items-center justify-center">
                {garmentMode === 'shop' && selectedProduct ? (
                  <>
                    <img
                      src={shopGarmentImage}
                      alt={selectedProduct.name}
                      className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-white/20">
                      {selectedProduct.brand}
                    </div>
                  </>
                ) : garmentMode === 'custom' && customGarmentPreview ? (
                  <img
                    src={customGarmentPreview}
                    alt="Trang phục tải lên"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div
                    onDrop={onGarmentDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => garmentInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    className="w-full h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-[#F3E8FF]/30 transition-colors group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-[#E4E4E7] flex items-center justify-center text-[#8B5CF6] mb-3 group-hover:scale-105 transition-transform">
                      <Shirt className="w-7 h-7" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-[#18181B]">
                      Tải ảnh trang phục của bạn
                    </p>
                    <p className="text-[11px] text-[#71717A] mt-1.5 leading-relaxed">
                      Kéo thả ảnh áo, quần, váy chụp phẳng (JPG, PNG, WEBP từ 1 KB đến 10 MB)
                    </p>
                  </div>
                )}

                <input
                  ref={garmentInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onCustomGarment(f);
                    e.currentTarget.value = '';
                  }}
                />
              </div>

              {/* Nút Thao tác cho Trang phục */}
              {garmentMode === 'shop' ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#18181B] line-clamp-1">
                      {selectedProduct?.name}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCatalogModalOpen(true)}
                      className="text-xs font-bold rounded-xl text-[#8B5CF6] border-[#DDD6FE] shrink-0"
                    >
                      Đổi mẫu khác
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => garmentInputRef.current?.click()}
                    className="w-full text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <ImagePlus className="w-4 h-4 text-[#8B5CF6]" />
                    <span>{customGarmentFile ? 'Thay ảnh trang phục khác' : 'Chọn ảnh trang phục'}</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Bộ Chọn Danh Mục Trang Phục (Áo, Quần, Váy liền) */}
            <div className="bg-[#FAFAF9] rounded-2xl p-3.5 border border-[#E4E4E7] text-left space-y-2">
              <span className="text-xs font-bold text-[#18181B] block">
                Phân loại trang phục để AI xử lý chính xác:
              </span>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'tops' as VtonCategory, label: 'Áo trên', desc: 'Áo thun, sơ mi, hoodie' },
                  { id: 'bottoms' as VtonCategory, label: 'Quần / Váy', desc: 'Jeans, cargo, chân váy' },
                  { id: 'one-pieces' as VtonCategory, label: 'Đầm liền', desc: 'Váy liền, set bộ' },
                ].map((cat) => {
                  const isCatSelected = effectiveCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      disabled={garmentMode === 'shop'}
                      onClick={() => setCustomCategory(cat.id)}
                      className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${isCatSelected
                          ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-xs'
                          : 'bg-white text-[#71717A] border-[#E4E4E7] hover:border-[#8B5CF6]'
                        } ${garmentMode === 'shop' ? 'opacity-90' : ''}`}
                    >
                      <div className="text-xs font-bold">{cat.label}</div>
                      <div className={`text-[9px] mt-0.5 line-clamp-1 ${isCatSelected ? 'text-white/80' : 'text-[#A1A1AA]'}`}>
                        {cat.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* CỘT 3: KẾT QUẢ THỬ ĐỒ                                         */}
          {/* ============================================================ */}
          <div className="bg-white rounded-3xl border border-[#E4E4E7] p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              {/* Header Cột 3 */}
              <div className="flex items-center justify-between border-b border-[#F2F3F5] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#8B5CF6] text-white flex items-center justify-center text-xs font-black">
                    3
                  </div>
                  <h2 className="text-sm sm:text-base font-black uppercase text-[#18181B]">
                    Kết Quả AI
                  </h2>
                </div>

                {imageResult && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsZoomOpen(true)}
                      className="p-1.5 rounded-lg text-[#71717A] hover:text-[#8B5CF6] hover:bg-[#F3E8FF] transition-colors cursor-pointer"
                      title="Xem toàn màn hình"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Khung Kết Quả AI hoặc Placeholder */}
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#F4F4F5] border border-[#E4E4E7] flex flex-col items-center justify-center">
                {working ? (
                  <div className="p-6 text-center space-y-3">
                    <Loader2 className="w-10 h-10 text-[#8B5CF6] animate-spin mx-auto" />
                    <p className="text-xs sm:text-sm font-bold text-[#18181B]">
                      {stage || 'Đang xử lý mô hình AI...'}
                    </p>
                    <p className="text-[11px] text-[#71717A] max-w-xs leading-relaxed">
                      GPU NVIDIA GeForce RTX 3060 đang phân tích nhân dạng và ướm trang phục.
                    </p>
                    <button
                      type="button"
                      onClick={() => controller.current?.abort()}
                      className="inline-flex items-center gap-1 text-xs text-rose-600 font-bold hover:underline cursor-pointer pt-2"
                    >
                      <Square className="w-3.5 h-3.5 fill-rose-600" />
                      <span>Hủy yêu cầu</span>
                    </button>
                  </div>
                ) : imageResult && personPreview ? (
                  <BeforeAfterSlider
                    originalImage={personPreview}
                    resultImage={imageResult}
                    originalLabel="Ảnh của bạn"
                    resultLabel="Sau khi thử"
                  />
                ) : (
                  <div className="p-6 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-[#E4E4E7] flex items-center justify-center text-[#8B5CF6] mx-auto">
                      <Sparkles className="w-7 h-7" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-[#18181B]">
                      Ảnh thử đồ sẽ xuất hiện tại đây
                    </p>
                    <p className="text-[11px] text-[#71717A] max-w-xs leading-relaxed">
                      Hãy tải ảnh của bạn ở Cột 1, chọn trang phục ở Cột 2 và nhấn nút "Thử đồ ngay" bên dưới.
                    </p>
                  </div>
                )}
              </div>

              {/* Thông tin thời gian & Cảnh báo */}
              {imageResult && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Đã tạo xong {typeof timeUsed === 'number' ? `(${timeUsed.toFixed(1)}s)` : ''}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsZoomOpen(true)}
                      className="text-xs font-bold text-[#8B5CF6] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Phóng to</span>
                    </button>
                  </div>

                  {warning && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      {warning}
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Lỗi thử đồ</span>
                  </div>
                  <p className="text-[11px] text-rose-600 leading-relaxed">
                    {error}
                  </p>
                </div>
              )}
            </div>

            {/* Hành Động: Thử Lại, Tải Ảnh & Nút Bấm Chính */}
            <div className="space-y-2.5">
              {imageResult ? (
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={imageResult}
                    download={`smartbuy-tryon-${Date.now()}.png`}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải ảnh PNG</span>
                  </a>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={generate}
                    disabled={working}
                    className="w-full text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4 text-[#8B5CF6]" />
                    <span>Thử lại</span>
                  </Button>
                </div>
              ) : null}

              {/* NÚT "THỬ ĐỒ NGAY" NỔI BẬT */}
              <button
                type="button"
                onClick={generate}
                disabled={!person || working || (!effectiveGarmentImage && !selectedProduct)}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] hover:from-[#7C3AED] hover:to-[#5B21B6] disabled:from-zinc-300 disabled:to-zinc-400 text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-elevated hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-98 select-none"
              >
                {working ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>AI ĐANG XỬ LÝ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    <span>THỬ ĐỒ NGAY</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Cam kết & Bảo mật ảnh thử đồ */}
        <div className="bg-white rounded-3xl border border-[#E4E4E7] p-5 sm:p-6 text-xs text-[#71717A] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#8B5CF6] shrink-0" />
            <span>
              Ảnh chân dung của bạn được truyền tải qua phiên bảo mật cục bộ tới máy chủ AI và tự động xóa sau phiên thử đồ. SMARTBUY AI cam kết bảo vệ 100% quyền riêng tư của bạn.
            </span>
          </div>

          <Link to="/size-guide" className="font-bold text-[#8B5CF6] hover:underline whitespace-nowrap">
            Xem Bảng Size Chuẩn →
          </Link>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CHỌN SẢN PHẨM TỪ SHOP CATALOG                                   */}
      {/* ========================================================================= */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#E4E4E7] w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E4E4E7] flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#18181B] uppercase">
                  Chọn Sản Phẩm Từ Shop SMARTBUY
                </h3>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Chọn mẫu áo, quần hoặc váy bạn muốn thử trực tiếp trên ảnh của mình.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(false)}
                className="p-2 rounded-full hover:bg-[#F4F4F5] text-[#71717A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Filters & Search */}
            <div className="p-4 bg-[#FAFAF9] border-b border-[#E4E4E7] flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
                <input
                  type="text"
                  value={modalSearchText}
                  onChange={(e) => setModalSearchText(e.target.value)}
                  placeholder="Tìm áo thun, hoodie, jeans, váy..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E4E4E7] bg-white outline-none focus:border-[#8B5CF6]"
                />
              </div>

              {/* Gender Filter pills */}
              <div className="flex gap-1.5 self-start sm:self-auto">
                {[
                  { id: 'all' as const, label: 'Tất cả' },
                  { id: 'nam' as const, label: 'Đồ Nam' },
                  { id: 'nu' as const, label: 'Đồ Nữ' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setModalGenderFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${modalGenderFilter === tab.id
                        ? 'bg-[#8B5CF6] text-white shadow-xs'
                        : 'bg-white text-[#71717A] border border-[#E4E4E7] hover:bg-[#F4F4F5]'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Product Grid */}
            <div className="p-5 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredModalProducts.map((p) => {
                const isSelected = selectedProduct?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProduct(p);
                      setChosenId(p.id);
                      setGarmentMode('shop');
                      setIsCatalogModalOpen(false);
                    }}
                    className={`rounded-2xl border p-2 cursor-pointer transition-all flex flex-col justify-between group ${isSelected
                        ? 'border-[#8B5CF6] ring-2 ring-[#8B5CF6]/30 bg-[#F3E8FF]/20'
                        : 'border-[#E4E4E7] hover:border-[#8B5CF6] bg-white'
                      }`}
                  >
                    <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#F4F4F5] mb-2 relative">
                      <img
                        src={p.images?.[0] || ''}
                        alt={p.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#8B5CF6] uppercase">
                        {p.brand}
                      </div>
                      <div className="text-xs font-bold text-[#18181B] line-clamp-2 mt-0.5">
                        {p.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PHÓNG TO / XEM TOÀN MÀN HÌNH ẢNH KẾT QUẢ                         */}
      {/* ========================================================================= */}
      {isZoomOpen && imageResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-cyan-300 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={imageResult}
              alt="Ảnh thử đồ phóng to toàn màn hình"
              className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl"
            />

            <div className="flex gap-3 mt-4">
              <a
                href={imageResult}
                download={`smartbuy-tryon-${Date.now()}.png`}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold uppercase tracking-wider shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Tải ảnh PNG</span>
              </a>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsZoomOpen(false)}
                className="text-xs font-bold"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
export default ProductTryOn;
