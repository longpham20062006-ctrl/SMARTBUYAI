/** Website product -> PC FASHN VTON v1.5 integration.
 * All AI credentials remain on the Vite/production reverse proxy.
 * The shopper supplies ONLY their own person image; garment is loaded from the catalogue.
 */
import type { Product } from '@/types';

export type VtonCategory = 'tops' | 'bottoms' | 'one-pieces';
export type VtonPhotoType = 'model' | 'flat-lay';
export type QualityMode = 'standard' | 'high';

export interface TryOnExecutionOptions {
  overrideCategory?: VtonCategory;
  qualityMode?: QualityMode;
  segmentationFree?: boolean;
}

/**
 * Tự động phát hiện danh mục trang phục dựa trên tên, slug và parentGroup của sản phẩm.
 * Phân biệt chính xác giữa váy liền/đầm (one-pieces) và chân váy (bottoms).
 */
export function getTryOnCategory(product: Product): VtonCategory | null {
  const slug = (product.categorySlug || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  const parent = ((product as any).parentGroup || '').toLowerCase();
  const combined = `${slug} ${name} ${parent}`;

  if (/phu[-_ ]?kien|giay|dép|dep|tui|túi|non|mũ|kinh|kính|that[-_ ]?lung|thắt lưng|trang[-_ ]?suc/.test(combined)) {
    return null;
  }

  // Chân váy thuộc về bottoms
  if (/chan[-_ ]?vay|chân váy|skirt/.test(combined)) {
    return 'bottoms';
  }

  // Đầm / Váy liền / Corset / Lolita / Gothic / Váy dạ hội thuộc về one-pieces
  if (
    /dam|đầm|vay-lien|váy liền|dress|one[-_ ]?piece|corset|maxi|bodycon|jumpsuit|lolita|gothic|da[-_ ]?hoi|dạ hội/.test(combined) ||
    slug === 'vay' ||
    parent === 'vay' ||
    /váy/i.test(name)
  ) {
    return 'one-pieces';
  }

  // Quần / Quần jeans / Quần cargo / Quần short thuộc về bottoms
  if (/quan|quần|pants|short|jeans|cargo|trouser|trousers|jogger/.test(combined)) {
    return 'bottoms';
  }

  // Các loại áo thun, sơ mi, hoodie, khoác thuộc về tops
  return 'tops';
}

/**
 * Tự động phân loại danh mục khi người dùng tải ảnh trang phục cá nhân lên
 */
export function detectCategoryFromFileName(fileName: string): VtonCategory {
  const name = (fileName || '').toLowerCase();
  if (/chan[-_ ]?vay|chân[-_ ]?váy|skirt/.test(name)) return 'bottoms';
  if (/dam|đầm|vay|váy|dress|one[-_ ]?piece|corset|maxi|bodycon|jumpsuit|lolita|gothic|da[-_ ]?hoi|dạ hội/.test(name)) {
    return 'one-pieces';
  }
  if (/quan|quần|pants|short|jeans|cargo|trouser|trousers|jogger/.test(name)) {
    return 'bottoms';
  }
  return 'tops';
}

/** Some catalogue images are on a model; default to on-model, never rely on user settings. */
export function getGarmentPhotoType(imageUrl: string): VtonPhotoType {
  return /flat[-_ ]?lay|packshot|isolated|san-pham-tach-nen|product-only/i.test(imageUrl)
    ? 'flat-lay' : 'model';
}

export function getCatalogueImage(product: Product, requested?: string | null): string {
  const candidates = [
    ...(product.images || []),
    ...(product.colors || []).flatMap(c => [c.image, ...(c.images || [])]),
    ...(product.variants || []).map(v => v.image),
  ].filter((value): value is string => !!value);
  // Never take a user-controlled query string as arbitrary image URL.
  if (requested && candidates.includes(requested)) return requested;
  return candidates[0] || '';
}

export type JobProgress = { status: string; stage?: string; error?: string; result?: {
  image_url?: string; quality?: { warnings?: string[] }; seconds?: number;
}};

const ROOT = '/api/smartfit';
const sleep = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  if (signal?.aborted) return reject(new DOMException('Đã hủy', 'AbortError'));
  const timer = setTimeout(() => { signal?.removeEventListener('abort', cancelled); resolve(); }, ms);
  const cancelled = () => { clearTimeout(timer); reject(new DOMException('Đã hủy', 'AbortError')); };
  signal?.addEventListener('abort', cancelled, { once: true });
});

async function failure(res: Response): Promise<Error> {
  let message = `Máy chủ trả lỗi HTTP ${res.status}.`;
  try { const data = await res.json(); message = data.detail || data.error || message; } catch { /* unchanged */ }
  if (typeof message !== 'string') message = JSON.stringify(message);
  return new Error(message);
}

/** Fetches image silently; no garment upload UI exists. */
async function loadGarmentFromCatalogue(imageUrl: string, signal: AbortSignal): Promise<Blob> {
  const response = await fetch(imageUrl, { signal });
  if (!response.ok) throw new Error('Không tải được ảnh sản phẩm từ website. Hãy kiểm tra ảnh của sản phẩm này.');
  const blob = await response.blob();
  if (!blob.type.startsWith('image/') || blob.size < 1000 || blob.size > 15 * 1024 * 1024) {
    throw new Error('Ảnh sản phẩm không hợp lệ hoặc quá lớn (tối đa 15 MB).');
  }
  // FASHN backend accepts JPG, PNG, WebP. Browser may display AVIF assets.
  // Convert AVIF to PNG invisibly; shopper is never asked to edit a garment.
  if (/^image\/(jpeg|png|webp)$/.test(blob.type)) return blob;
  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Không thể chuyển định dạng ảnh sản phẩm.');
    context.drawImage(bitmap, 0, 0);
    const png = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!png) throw new Error('Không thể chuyển ảnh sản phẩm sang PNG.');
    return png;
  } finally { bitmap.close(); }
}

export async function requestProductTryOn(args: {
  person: File;
  product: Product;
  productImage: string;
  signal: AbortSignal;
  seed: number;
  options?: TryOnExecutionOptions;
  onProgress: (message: string) => void;
}): Promise<{ image: Blob; warnings: string[]; seconds?: number }> {
  const { person, product, productImage, signal, seed, options, onProgress } = args;
  const category = options?.overrideCategory || getTryOnCategory(product);
  if (!category) throw new Error('AI chưa hỗ trợ thử phụ kiện/giày. Hãy chọn áo, quần hoặc váy.');
  if (!/^image\/(jpeg|png|webp)$/.test(person.type) || person.size > 10 * 1024 * 1024 || person.size < 1000) {
    throw new Error('Vui lòng dùng ảnh JPG, PNG hoặc WebP dưới 10 MB.');
  }

  // Tùy chỉnh bước khuếch tán và thang hướng dẫn cho RTX 3060
  const isHighQuality = options?.qualityMode === 'high';
  const steps = isHighQuality ? 35 : 25;
  const guidance = isHighQuality ? 1.7 : 1.5;

  // Quan trọng: Đối với đầm liền (one-pieces), bắt buộc xóa đồ cũ (segmentation_free = false)
  // để toàn bộ áo, tay áo cũ được xóa sạch và thay bằng chiếc váy mới không bị dính áo cũ!
  const isSegFree = options?.segmentationFree !== undefined
    ? options.segmentationFree
    : (category !== 'one-pieces');

  onProgress('Đang chuẩn bị ảnh sản phẩm...');
  const garment = await loadGarmentFromCatalogue(productImage, signal);
  const fd = new FormData();
  fd.append('person', person, person.name || 'person.jpg');
  fd.append('garment', garment, `product-${product.id}.${garment.type.includes('png') ? 'png' : garment.type.includes('webp') ? 'webp' : 'jpg'}`);
  fd.append('category', category);
  fd.append('photo_type', getGarmentPhotoType(productImage));
  fd.append('steps', String(steps));
  fd.append('guidance', String(guidance));
  fd.append('seed', String(seed));
  fd.append('segmentation_free', String(isSegFree));
  fd.append('retry_if_flagged', 'false');

  onProgress('Đang gửi ảnh tới máy tính xử lý AI (RTX 3060)...');
  let start: Response;
  try {
    start = await fetch(`${ROOT}/jobs`, { method: 'POST', body: fd, signal });
  } catch (err) {
    if (signal.aborted) throw err;
    throw new Error('Không kết nối được PC xử lý AI. Kiểm tra server, Tailscale/VPN và cấu hình SMARTFIT_BACKEND_URL.');
  }
  if (!start.ok) throw await failure(start);
  const task: { job_id?: string } = await start.json();
  const jobId = task.job_id;
  if (!jobId || !/^[a-f0-9]{32}$/.test(jobId)) throw new Error('API không trả về mã xử lý hợp lệ.');
  onProgress('Đang chờ GPU tạo ảnh...');
  const deadline = Date.now() + 5 * 60 * 1000; // 5 min incl queue + model warmup
  let completed: JobProgress | null = null;
  while (Date.now() < deadline) {
    await sleep(1500, signal);
    const response = await fetch(`${ROOT}/jobs/${jobId}`, { signal, cache: 'no-store' });
    if (!response.ok) throw await failure(response);
    const info: JobProgress = await response.json();
    if (info.status === 'failed') throw new Error(info.error || 'AI tạo ảnh thất bại.');
    if (info.status === 'completed') { completed = info; break; }
    onProgress(info.stage || (info.status === 'queued' ? 'Đang xếp hàng chờ GPU RTX 3060...' : 'AI đang thay trang phục...'));
  }
  if (!completed) throw new Error('Đã quá thời gian chờ GPU (5 phút). Vui lòng kiểm tra PC.');
  const imageUrl = completed.result?.image_url;
  if (!imageUrl || !/^\/api\/v1\/results\/[a-f0-9]{16}\/output$/.test(imageUrl)) {
    throw new Error('Máy chủ trả về đường dẫn ảnh không hợp lệ.');
  }
  onProgress('Đang nhận ảnh thử đồ...');
  const result = await fetch(`${ROOT}${imageUrl.replace('/api/v1', '')}`, { signal, cache: 'no-store' });
  if (!result.ok) throw await failure(result);
  const image = await result.blob();
  if (!image.type.startsWith('image/') || image.size < 1000) throw new Error('AI không trả về file ảnh hợp lệ.');
  return { image, seconds: completed.result?.seconds, warnings: completed.result?.quality?.warnings || [] };
}

export async function requestCustomGarmentTryOn(args: {
  person: File;
  garment: File;
  category: VtonCategory;
  signal: AbortSignal;
  seed: number;
  options?: TryOnExecutionOptions;
  onProgress: (message: string) => void;
}): Promise<{ image: Blob; warnings: string[]; seconds?: number }> {
  const { person, garment, category, signal, seed, options, onProgress } = args;
  if (!/^image\/(jpeg|png|webp)$/.test(person.type) || person.size > 10 * 1024 * 1024 || person.size < 1000) {
    throw new Error('Ảnh người dùng phải là JPG, PNG hoặc WebP từ 1 KB đến 10 MB.');
  }
  if (!/^image\/(jpeg|png|webp)$/.test(garment.type) || garment.size > 10 * 1024 * 1024 || garment.size < 1000) {
    throw new Error('Ảnh trang phục phải là JPG, PNG hoặc WebP từ 1 KB đến 10 MB.');
  }

  const isHighQuality = options?.qualityMode === 'high';
  const steps = isHighQuality ? 35 : 25;
  const guidance = isHighQuality ? 1.7 : 1.5;

  const isSegFree = options?.segmentationFree !== undefined
    ? options.segmentationFree
    : (category !== 'one-pieces');

  onProgress('Đang chuẩn bị ảnh người và trang phục...');
  const fd = new FormData();
  fd.append('person', person, person.name || 'person.jpg');
  fd.append('garment', garment, garment.name || 'garment.jpg');
  fd.append('category', category);
  fd.append('photo_type', 'flat-lay');
  fd.append('steps', String(steps));
  fd.append('guidance', String(guidance));
  fd.append('seed', String(seed));
  fd.append('segmentation_free', String(isSegFree));
  fd.append('retry_if_flagged', 'false');

  onProgress('Đang gửi dữ liệu tới máy chủ AI...');
  let start: Response;
  try {
    start = await fetch(`${ROOT}/jobs`, { method: 'POST', body: fd, signal });
  } catch (err) {
    if (signal.aborted) throw err;
    throw new Error('Không kết nối được server AI GPU RTX 3060. Vui lòng kiểm tra AI server tại cổng 7860.');
  }
  if (!start.ok) throw await failure(start);
  const task: { job_id?: string } = await start.json();
  const jobId = task.job_id;
  if (!jobId || !/^[a-f0-9]{32}$/.test(jobId)) throw new Error('API không trả về mã xử lý hợp lệ.');

  onProgress('Đang chờ GPU xử lý mô hình FASHN VTON...');
  const deadline = Date.now() + 5 * 60 * 1000;
  let completed: JobProgress | null = null;
  while (Date.now() < deadline) {
    await sleep(1500, signal);
    const response = await fetch(`${ROOT}/jobs/${jobId}`, { signal, cache: 'no-store' });
    if (!response.ok) throw await failure(response);
    const info: JobProgress = await response.json();
    if (info.status === 'failed') throw new Error(info.error || 'AI tạo ảnh thất bại.');
    if (info.status === 'completed') { completed = info; break; }
    onProgress(info.stage || (info.status === 'queued' ? 'Đang xếp hàng chờ GPU RTX 3060...' : 'Mô hình AI đang ghép trang phục...'));
  }
  if (!completed) throw new Error('Đã quá thời gian chờ GPU (5 phút).');
  const imageUrl = completed.result?.image_url;
  if (!imageUrl || !/^\/api\/v1\/results\/[a-f0-9]{16}\/output$/.test(imageUrl)) {
    throw new Error('Máy chủ trả về đường dẫn ảnh không hợp lệ.');
  }
  onProgress('Đang tải ảnh kết quả thử đồ...');
  const result = await fetch(`${ROOT}${imageUrl.replace('/api/v1', '')}`, { signal, cache: 'no-store' });
  if (!result.ok) throw await failure(result);
  const image = await result.blob();
  if (!image.type.startsWith('image/') || image.size < 1000) throw new Error('AI không trả về file ảnh hợp lệ.');
  return { image, seconds: completed.result?.seconds, warnings: completed.result?.quality?.warnings || [] };
}
