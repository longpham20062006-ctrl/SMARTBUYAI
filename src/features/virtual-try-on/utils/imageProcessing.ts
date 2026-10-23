/**
 * Tạo tên file kết quả theo quy chuẩn: SMARTBUY-AI-TRYON-XXX.png
 */
export function generateTryOnFileName(index: number = 1, ext: 'png' | 'webp' = 'png'): string {
  const suffix = String(index).padStart(3, '0');
  return `SMARTBUY-AI-TRYON-${suffix}.${ext}`;
}

/**
 * Kiểm tra chữ ký file (Magic Bytes) để xác định định dạng ảnh thực sự
 */
export function detectImageFormat(bytes: Uint8Array): 'png' | 'jpeg' | 'webp' | 'unknown' {
  if (bytes.length < 12) return 'unknown';

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4E &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0D &&
    bytes[5] === 0x0A &&
    bytes[6] === 0x1A &&
    bytes[7] === 0x0A
  ) {
    return 'png';
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'jpeg';
  }

  // WebP: RIFF .... WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'webp';
  }

  return 'unknown';
}

/**
 * Chuyển đổi dữ liệu ảnh sang Blob PNG thật qua HTML Canvas
 */
async function convertToRealPngBlob(sourceBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(sourceBlob);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(sourceBlob);
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((pngBlob) => {
          URL.revokeObjectURL(url);
          if (pngBlob) {
            resolve(pngBlob);
          } else {
            resolve(sourceBlob);
          }
        }, 'image/png');
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không thể giải mã dữ liệu ảnh để chuyển đổi sang PNG.'));
    };
    img.src = url;
  });
}

/**
 * Chuyển đổi dữ liệu ảnh sang Blob WebP thật qua HTML Canvas
 */
async function convertToRealWebpBlob(sourceBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(sourceBlob);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(sourceBlob);
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((webpBlob) => {
          URL.revokeObjectURL(url);
          if (webpBlob) {
            resolve(webpBlob);
          } else {
            resolve(sourceBlob);
          }
        }, 'image/webp', 0.95);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không thể giải mã dữ liệu ảnh để chuyển đổi sang WebP.'));
    };
    img.src = url;
  });
}

/**
 * Tải ảnh từ URL / Blob về thiết bị người dùng với đầy đủ xác thực:
 * 1. Kiểm tra HTTP Status & Content-Type
 * 2. Xác thực Magic Bytes chữ ký ảnh thực tế (chống lưu nhầm thông báo lỗi JSON/HTML)
 * 3. Đảm bảo file .png luôn là dữ liệu PNG chuẩn (tương thích 100% Windows Photos & các phần mềm xem ảnh)
 */
export async function downloadImageToDevice(
  imageUrl: string,
  fileName?: string
): Promise<void> {
  const requestedExt = (fileName && fileName.endsWith('.webp')) ? 'webp' : 'png';
  const finalFileName = fileName || generateTryOnFileName(1, requestedExt);

  // 1. Gửi request lấy dữ liệu ảnh thật
  let response: Response;
  try {
    response = await fetch(imageUrl, {
      headers: {
        'Accept': 'image/png,image/webp,image/jpeg,image/*;q=0.9',
      },
    });
  } catch (err: any) {
    throw new Error(`Không thể kết nối đến máy chủ để tải ảnh: ${err.message || 'Lỗi mạng'}`);
  }

  // 2. Kiểm tra mã phản hồi HTTP
  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.error || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(`Máy chủ báo lỗi khi tải ảnh (${response.status}): ${errorDetail || 'Ảnh chưa sẵn sàng'}`);
  }

  // 3. Kiểm tra Content-Type
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('application/json') || contentType.includes('text/html') || contentType.includes('text/plain')) {
    const textData = await response.text();
    throw new Error(`Dữ liệu nhận về là thông báo lỗi (${textData.slice(0, 150)}), không phải file ảnh hợp lệ.`);
  }

  // 4. Đọc ArrayBuffer và kiểm tra kích thước
  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength < 500) {
    throw new Error(`Dữ liệu ảnh không hợp lệ (kích thước quá nhỏ: ${arrayBuffer.byteLength} bytes).`);
  }

  // 5. Kiểm tra chữ ký Magic Bytes
  const uint8 = new Uint8Array(arrayBuffer);
  const detectedFormat = detectImageFormat(uint8);

  if (detectedFormat === 'unknown') {
    // Thử kiểm tra xem có phải chuỗi JSON lỗi ngụy trang không
    const sampleText = new TextDecoder().decode(uint8.slice(0, 50));
    if (sampleText.trim().startsWith('{') || sampleText.trim().startsWith('<')) {
      throw new Error(`Dữ liệu tải về không phải ảnh mà là thông báo lỗi: ${sampleText}`);
    }
  }

  // 6. Xử lý xuất file đúng MIME type và chuẩn cấu trúc
  let finalBlob: Blob;
  const rawBlob = new Blob([arrayBuffer], {
    type: detectedFormat === 'png' ? 'image/png' : detectedFormat === 'webp' ? 'image/webp' : 'image/jpeg'
  });

  if (requestedExt === 'png') {
    if (detectedFormat === 'png') {
      finalBlob = rawBlob;
    } else {
      // Chuyển đổi sang định dạng PNG thật nếu ảnh gốc là JPEG/WebP
      finalBlob = await convertToRealPngBlob(rawBlob);
    }
  } else {
    // Yêu cầu WebP
    if (detectedFormat === 'webp') {
      finalBlob = rawBlob;
    } else {
      finalBlob = await convertToRealWebpBlob(rawBlob);
    }
  }

  // 7. Kích hoạt tải file về máy
  const blobUrl = URL.createObjectURL(finalBlob);
  try {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 2000);
  }
}

/**
 * Đọc file ảnh dưới dạng Data URL (Base64)
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Lỗi khi đọc file ảnh.'));
    reader.readAsDataURL(file);
  });
}
