import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DemoModel, TryOnGarment, TryOnResult, TryOnStatus } from '../types/tryOn';
import { tryOnService } from '../services/tryOnService';
import { validateImageFile } from '../utils/fileValidation';
import { downloadImageToDevice, generateTryOnFileName } from '../utils/imageProcessing';

export function useVirtualTryOn() {
  const [searchParams] = useSearchParams();

  const [selectedModel, setSelectedModel] = useState<DemoModel | null>(tryOnService.getDemoModels()[0] || null);
  const [uploadedPersonFile, setUploadedPersonFile] = useState<File | null>(null);
  const [uploadedPersonPreview, setUploadedPersonPreview] = useState<string | null>(null);

  // Món đồ được chọn để thử
  const [selectedTop, setSelectedTop] = useState<TryOnGarment | null>(() => {
    const topId = searchParams.get('topId');
    if (topId) {
      const found = tryOnService.getGarmentByProductId(topId);
      if (found) return found;
    }
    const productId = searchParams.get('productId') || searchParams.get('slug');
    if (productId) {
      const found = tryOnService.getGarmentByProductId(productId);
      if (found && found.category === 'upper_body') return found;
    }
    const all = tryOnService.getAllRealGarments();
    return all.find((g) => g.category === 'upper_body') || null;
  });

  const [selectedBottom, setSelectedBottom] = useState<TryOnGarment | null>(() => {
    const bottomId = searchParams.get('bottomId');
    if (bottomId) {
      const found = tryOnService.getGarmentByProductId(bottomId);
      if (found) return found;
    }
    const productId = searchParams.get('productId') || searchParams.get('slug');
    if (productId) {
      const found = tryOnService.getGarmentByProductId(productId);
      if (found && found.category === 'lower_body') return found;
    }
    const all = tryOnService.getAllRealGarments();
    return all.find((g) => g.category === 'lower_body') || null;
  });

  const [selectedOuterwear, setSelectedOuterwear] = useState<TryOnGarment | null>(() => {
    const productId = searchParams.get('productId') || searchParams.get('slug');
    if (productId) {
      const found = tryOnService.getGarmentByProductId(productId);
      if (found && found.category === 'outerwear') return found;
    }
    return null;
  });

  const [selectedDress, setSelectedDress] = useState<TryOnGarment | null>(() => {
    const productId = searchParams.get('productId') || searchParams.get('slug');
    if (productId) {
      const found = tryOnService.getGarmentByProductId(productId);
      if (found && found.category === 'dresses') return found;
    }
    return null;
  });

  const [selectedAccessories, setSelectedAccessories] = useState<TryOnGarment[]>(() => {
    const accId = searchParams.get('accId');
    if (accId) {
      const found = tryOnService.getGarmentByProductId(accId);
      if (found) return [found];
    }
    const productId = searchParams.get('productId') || searchParams.get('slug');
    if (productId) {
      const found = tryOnService.getGarmentByProductId(productId);
      if (found && found.category === 'accessories') return [found];
    }
    return [];
  });

  // Trạng thái xử lý
  const [status, setStatus] = useState<TryOnStatus>('idle');
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Kiểm tra cấu hình AI máy chủ
  const isAiConfigured = tryOnService.isAiConfigured();
  const providerName = tryOnService.getProviderName();

  // Dọn dẹp URL khi unmount
  useEffect(() => {
    return () => {
      if (uploadedPersonPreview && uploadedPersonPreview.startsWith('blob:')) {
        URL.revokeObjectURL(uploadedPersonPreview);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [uploadedPersonPreview]);

  // Xử lý khi người dùng chọn tải ảnh của mình lên
  const handleUploadPersonImage = useCallback((file: File) => {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'File không hợp lệ');
      return false;
    }

    if (uploadedPersonPreview && uploadedPersonPreview.startsWith('blob:')) {
      URL.revokeObjectURL(uploadedPersonPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setUploadedPersonFile(file);
    setUploadedPersonPreview(previewUrl);
    setSelectedModel(null); // Bỏ chọn người mẫu mẫu
    setErrorMessage(null);
    setResult(null);
    setStatus('ready');
    return true;
  }, [uploadedPersonPreview]);

  // Chọn người mẫu có sẵn
  const handleSelectDemoModel = useCallback((model: DemoModel) => {
    if (uploadedPersonPreview && uploadedPersonPreview.startsWith('blob:')) {
      URL.revokeObjectURL(uploadedPersonPreview);
    }
    setUploadedPersonFile(null);
    setUploadedPersonPreview(null);
    setSelectedModel(model);
    setErrorMessage(null);
    setResult(null);
    setStatus('idle');
  }, [uploadedPersonPreview]);

  // Xóa ảnh cá nhân người dùng (Bảo vệ quyền riêng tư)
  const clearUploadedImage = useCallback(() => {
    if (uploadedPersonPreview && uploadedPersonPreview.startsWith('blob:')) {
      URL.revokeObjectURL(uploadedPersonPreview);
    }
    setUploadedPersonFile(null);
    setUploadedPersonPreview(null);
    setSelectedModel(tryOnService.getDemoModels()[0] || null);
    setResult(null);
    setStatus('idle');
    setErrorMessage(null);
  }, [uploadedPersonPreview]);

  // Chọn hoặc bỏ chọn phụ kiện
  const toggleAccessory = useCallback((accessory: TryOnGarment) => {
    setSelectedAccessories((prev) => {
      const exists = prev.some((a) => a.id === accessory.id);
      return exists ? prev.filter((a) => a.id !== accessory.id) : [...prev, accessory];
    });
    setResult(null);
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  // Thay đổi áo, quần, váy, áo khoác có tự động reset kết quả cũ
  const handleSetSelectedTop = useCallback((garment: TryOnGarment | null) => {
    setSelectedTop(garment);
    setResult(null);
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  const handleSetSelectedBottom = useCallback((garment: TryOnGarment | null) => {
    setSelectedBottom(garment);
    setResult(null);
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  const handleSetSelectedOuterwear = useCallback((garment: TryOnGarment | null) => {
    setSelectedOuterwear(garment);
    setResult(null);
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  const handleSetSelectedDress = useCallback((garment: TryOnGarment | null) => {
    setSelectedDress(garment);
    setResult(null);
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  // Hủy tiến trình AI đang thực hiện
  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('idle');
  }, []);

  // Thực hiện Virtual Try-On
  const executeTryOn = useCallback(async () => {
    const personTarget = uploadedPersonFile || selectedModel?.imageUrl;
    if (!personTarget) {
      setErrorMessage('Vui lòng chọn hoặc tải lên ảnh người mẫu/bản thân.');
      return;
    }

    if (!selectedTop && !selectedBottom && !selectedOuterwear && !selectedDress && selectedAccessories.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 món trang phục hoặc phụ kiện để thử đồ.');
      return;
    }

    if (!isAiConfigured) {
      setStatus('unconfigured');
      setErrorMessage(
        'Tính năng AI Virtual Try-On đang ở chế độ xem trước kiến trúc. Máy chủ chưa được cấu hình VITE_TRYON_API_ENDPOINT thực tế để gọi mô hình Diffusion (IDM-VTON / Fashn / Kling). Không tự tạo ảnh mô phỏng sai lệch.'
      );
      return;
    }

    // Reset kết quả cũ ngay lập tức để không gây nhầm lẫn với kết quả của áo mới
    setResult(null);
    setStatus('processing');
    setErrorMessage(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const resultData = await tryOnService.runTryOn(
        {
          personImage: personTarget,
          garments: {
            top: selectedTop || undefined,
            bottom: selectedBottom || undefined,
            dress: selectedDress || undefined,
            outerwear: selectedOuterwear || undefined,
            accessories: selectedAccessories,
          },
          options: {
            preserveBackground: true,
            fitMode: 'natural',
            qualityLevel: 'high',
          },
        },
        controller.signal
      );

      setResult(resultData);
      setStatus('completed');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setStatus('idle');
        return;
      }
      setStatus('failed');
      setErrorMessage(err.message || 'Quá trình thử đồ AI thất bại. Vui lòng thử lại.');
    } finally {
      abortControllerRef.current = null;
    }
  }, [
    uploadedPersonFile,
    selectedModel,
    selectedTop,
    selectedBottom,
    selectedOuterwear,
    selectedDress,
    selectedAccessories,
    isAiConfigured,
  ]);

  // Tải ảnh kết quả về máy
  const downloadResultImage = useCallback(async (format: 'png' | 'webp' = 'png') => {
    if (!result?.resultImageUrl) return;
    const fileName = generateTryOnFileName(1, format);
    await downloadImageToDevice(result.resultImageUrl, fileName);
  }, [result]);

  return {
    selectedModel,
    uploadedPersonFile,
    uploadedPersonPreview,
    currentPersonImage: uploadedPersonPreview || selectedModel?.imageUrl || '',
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
    setSelectedTop: handleSetSelectedTop,
    setSelectedBottom: handleSetSelectedBottom,
    setSelectedOuterwear: handleSetSelectedOuterwear,
    setSelectedDress: handleSetSelectedDress,
    toggleAccessory,
    executeTryOn,
    cancelProcessing,
    downloadResultImage,
  };
}
