import { TryOnRequestPayload, TryOnResult } from '../types/tryOn';

export interface TryOnApiResponse {
  success: boolean;
  resultUrl?: string;
  result_url?: string;
  taskId?: string;
  job_id?: string;
  status?: string;
  error?: string;
  warningNote?: string;
}

export interface IVirtualTryOnAdapter {
  isConfigured(): boolean;
  getProviderName(): string;
  executeTryOn(
    payload: TryOnRequestPayload,
    signal?: AbortSignal
  ): Promise<TryOnResult>;
}

/**
 * Adapter kết nối máy chủ AI cục bộ chạy trên GPU NVIDIA GeForce RTX 3060 12GB
 * Hỗ trợ giao tiếp qua Proxy /api/ai/try-on, chống CORS và bảo mật đường truyền LAN.
 */
export class ServerlessTryOnAdapter implements IVirtualTryOnAdapter {
  private endpoint: string;
  private providerName: string;

  constructor() {
    this.endpoint = (import.meta as any).env?.VITE_TRYON_API_ENDPOINT || '/api/ai/try-on';
    this.providerName = (import.meta as any).env?.VITE_TRYON_PROVIDER || 'NVIDIA RTX 3060 12GB (Local AI)';
  }

  isConfigured(): boolean {
    return true; // Mặc định bật chế độ kết nối AI Server cục bộ
  }

  getProviderName(): string {
    return this.providerName;
  }

  async executeTryOn(
    payload: TryOnRequestPayload,
    signal?: AbortSignal
  ): Promise<TryOnResult> {
    const startTime = performance.now();
    const formData = new FormData();

    // 1. Thêm ảnh người mẫu (File hoặc URL mẫu)
    if (payload.personImage instanceof File) {
      formData.append('person_image', payload.personImage);
    } else {
      formData.append('person_image_url', payload.personImage);
    }

    // 2. Xác định chính xác món đồ đang được chọn
    const targetGarment =
      payload.garments.top ||
      payload.garments.outerwear ||
      payload.garments.dress ||
      payload.garments.bottom;

    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    formData.append('request_id', requestId);

    if (targetGarment) {
      formData.append('garment_id', targetGarment.id);
      formData.append('garment_name', targetGarment.name);

      // Tải trực tiếp dữ liệu nhị phân ảnh của áo được chọn để upload thẳng lên backend
      // Điều này ngăn chặn triệt để tình trạng backend dùng lại ảnh áo cũ hoặc ảnh mặc định
      try {
        const garmentFetch = await fetch(targetGarment.imageUrl);
        if (garmentFetch.ok) {
          const garmentBlob = await garmentFetch.blob();
          const ext = targetGarment.imageUrl.toLowerCase().includes('.png') ? 'png' : 'jpg';
          formData.append('garment_image', garmentBlob, `${targetGarment.id}.${ext}`);
        }
      } catch (err) {
        console.warn('Không thể fetch ảnh áo trực tiếp từ client, gửi URL dự phòng:', err);
      }
    }

    // 3. Thêm thông tin URL & Category dự phòng
    if (payload.garments.top) {
      formData.append('top_garment_url', payload.garments.top.imageUrl);
      formData.append('category', 'upper_body');
    } else if (payload.garments.outerwear) {
      formData.append('top_garment_url', payload.garments.outerwear.imageUrl);
      formData.append('category', 'outerwear');
    } else if (payload.garments.bottom) {
      formData.append('bottom_garment_url', payload.garments.bottom.imageUrl);
      formData.append('category', 'lower_body');
    } else if (payload.garments.dress) {
      formData.append('top_garment_url', payload.garments.dress.imageUrl);
      formData.append('category', 'dresses');
    } else if (payload.garments.accessories && payload.garments.accessories.length > 0) {
      formData.append('top_garment_url', payload.garments.accessories[0].imageUrl);
      formData.append('category', 'accessories');
    }

    // 4. Gửi yêu cầu tới AI Server (qua Proxy /api/ai/try-on)
    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        body: formData,
        signal,
      });
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      throw new Error(
        'Máy chủ AI đang ngoại tuyến. Vui lòng chạy file "ai-server/start_server.bat" trên máy tính trang bị GPU NVIDIA RTX 3060 để kích hoạt thử đồ.'
      );
    }

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 503 || response.status === 502) {
        throw new Error('Máy chủ AI đang ngoại tuyến hoặc đang khởi động lại.');
      }
      throw new Error(`Máy chủ AI phản hồi lỗi (${response.status}): ${errText || 'Lỗi không xác định'}`);
    }

    const data: TryOnApiResponse = await response.json();
    const jobId = data.job_id || data.taskId;

    // 5. Bắt buộc Polling đến khi GPU xử lý hoàn thành thực sự
    let finalResultUrl = '';
    let pollGarmentName = targetGarment?.name;
    let pollGarmentId = targetGarment?.id;
    let pollModelName = 'CatVTON-SD15-FP16 (NVIDIA RTX 3060)';

    if (jobId) {
      const maxPollAttempts = 60; // 60 x 1.5s = 90s tối đa cho 20 diffusion steps
      let attempts = 0;

      while (attempts < maxPollAttempts) {
        if (signal?.aborted) throw new Error('Người dùng đã hủy yêu cầu xử lý.');
        await new Promise((r) => setTimeout(r, 1500));
        attempts++;

        try {
          const pollResp = await fetch(`/api/ai/jobs/${jobId}`, { signal });
          if (pollResp.ok) {
            const pollData = await pollResp.json();
            if (pollData.model_name) pollModelName = pollData.model_name;
            if (pollData.garment_name) pollGarmentName = pollData.garment_name;
            if (pollData.garment_id) pollGarmentId = pollData.garment_id;

            if (pollData.status === 'completed') {
              finalResultUrl = pollData.resultUrl || `/api/ai/jobs/${jobId}/result`;
              break;
            } else if (pollData.status === 'failed') {
              throw new Error(pollData.error || 'Quá trình xử lý mô hình AI trên GPU thất bại.');
            }
          }
        } catch (pollErr: any) {
          if (pollErr.name === 'AbortError') throw pollErr;
          if (pollErr.message && !pollErr.message.includes('fetch')) throw pollErr;
        }
      }

      if (!finalResultUrl) {
        throw new Error('Thời gian xử lý trên GPU vượt quá giới hạn (Timeout 90s). Vui lòng thử lại với ảnh dung lượng nhỏ hơn.');
      }
    } else if (data.resultUrl || data.result_url) {
      finalResultUrl = (data.resultUrl || data.result_url)!;
    } else {
      throw new Error('Máy chủ AI không trả về mã tác vụ (Job ID) hợp lệ.');
    }

    // 6. Kiểm tra và xác thực dữ liệu ảnh thật trước khi đánh dấu thành công
    let verifiedObjectUrl = finalResultUrl;
    try {
      const verifyResp = await fetch(finalResultUrl, { signal });
      if (!verifyResp.ok) {
        const errText = await verifyResp.text();
        throw new Error(`Máy chủ không thể xuất file ảnh (${verifyResp.status}): ${errText}`);
      }
      const contentType = (verifyResp.headers.get('content-type') || '').toLowerCase();
      if (!contentType.includes('image/')) {
        const errText = await verifyResp.text();
        throw new Error(`Máy chủ trả về dữ liệu không phải ảnh (${contentType}): ${errText.slice(0, 100)}`);
      }
      const imageBlob = await verifyResp.blob();
      if (imageBlob.size < 1000) {
        throw new Error(`File ảnh kết quả rỗng hoặc quá nhỏ (${imageBlob.size} bytes).`);
      }
      // Tạo Blob URL trực tiếp để hiển thị mượt mà trên BeforeAfterSlider
      verifiedObjectUrl = URL.createObjectURL(imageBlob);
    } catch (verifyErr: any) {
      if (verifyErr.name === 'AbortError') throw verifyErr;
      throw new Error(`Xác thực ảnh kết quả thất bại: ${verifyErr.message}`);
    }

    const duration = Math.round(performance.now() - startTime);

    const garmentsList = [
      payload.garments.top,
      payload.garments.bottom,
      payload.garments.dress,
      payload.garments.outerwear,
      ...(payload.garments.accessories || []),
    ].filter(Boolean) as any[];

    return {
      id: jobId || `res_${Date.now()}`,
      originalPersonUrl:
        typeof payload.personImage === 'string'
          ? payload.personImage
          : URL.createObjectURL(payload.personImage),
      resultImageUrl: verifiedObjectUrl,
      generatedAt: new Date().toISOString(),
      status: 'success',
      garmentsUsed: garmentsList,
      processingDurationMs: duration,
      warningNote:
        data.warningNote ||
        'Ảnh thử đồ được tạo bằng AI trên NVIDIA RTX 3060, chỉ mang tính minh họa. Độ vừa vặn thực tế phụ thuộc vào số đo và bảng size sản phẩm.',
      debugInfo: {
        jobId: jobId || 'unknown',
        requestId,
        modelName: pollModelName,
        garmentId: pollGarmentId,
        garmentName: pollGarmentName,
        garmentImageUrl: targetGarment?.imageUrl,
        backendGarmentUrl: jobId ? `/api/ai/jobs/${jobId}/garment` : undefined,
        backendPersonUrl: jobId ? `/api/ai/jobs/${jobId}/person` : undefined,
        inferenceStatus: 'completed',
      },
    };
  }
}
