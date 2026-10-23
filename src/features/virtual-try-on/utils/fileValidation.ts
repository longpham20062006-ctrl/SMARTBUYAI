export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

/**
 * Kiểm tra tính hợp lệ của file ảnh người dùng tải lên
 */
export function validateImageFile(file: File): ValidationResult {
  if (!file) {
    return { isValid: false, error: 'Vui lòng chọn một file ảnh hợp lệ.' };
  }

  // 1. Kiểm tra định dạng MIME
  const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.type);
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);

  if (!isMimeAllowed && !isExtAllowed) {
    return {
      isValid: false,
      error: `Định dạng ảnh không được hỗ trợ (${file.type || ext}). Vui lòng tải lên file JPG, PNG, WebP hoặc AVIF.`,
    };
  }

  // 2. Kiểm tra dung lượng file (tối đa 10MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `Dung lượng ảnh quá lớn (${sizeMb}MB). Giới hạn tối đa là 10MB.`,
    };
  }

  // 3. Khuyến nghị dung lượng nhỏ (< 100KB có thể bị mờ)
  if (file.size < 50 * 1024) {
    return {
      isValid: true,
      warning: 'Ảnh có độ phân giải khá thấp, kết quả ghép AI có thể bị giảm độ nét.',
    };
  }

  return { isValid: true };
}

/**
 * Đọc kích thước pixel thực tế của ảnh (width x height)
 */
export function getImageDimensions(fileOrUrl: File | string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);

    img.onload = () => {
      const dimensions = { width: img.naturalWidth, height: img.naturalHeight };
      if (typeof fileOrUrl !== 'string') {
        URL.revokeObjectURL(url);
      }
      resolve(dimensions);
    };

    img.onerror = () => {
      if (typeof fileOrUrl !== 'string') {
        URL.revokeObjectURL(url);
      }
      reject(new Error('Không thể tải dữ liệu hình ảnh để đo kích thước.'));
    };

    img.src = url;
  });
}
