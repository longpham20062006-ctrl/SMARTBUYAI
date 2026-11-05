export type GarmentCategoryType =
  | 'upper_body'    // Áo thun, sơ mi, hoodie, sweater, jacket
  | 'lower_body'    // Quần dài, short, chân váy
  | 'dresses'       // Váy, đầm liền thân
  | 'outerwear'     // Áo khoác ngoài
  | 'accessories'   // Túi, nón, mắt kính, trang sức
  | 'full_outfit';  // Cả bộ outfit

export type AccessoryType =
  | 'necklace'
  | 'bracelet'
  | 'ring'
  | 'earrings'
  | 'hat'
  | 'bag'
  | 'glasses'
  | 'belt'
  | 'scarf';

export interface TryOnGarment {
  id: string;
  name: string;
  category: GarmentCategoryType;
  subCategory?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  brand?: string;
  sku?: string;
  color?: string;
}

export interface DemoModel {
  id: string;
  name: string;
  gender: 'nam' | 'nu' | 'unisex';
  heightCm: number;
  weightKg: number;
  imageUrl: string;
  thumbnailUrl: string;
}

export type TryOnStatus =
  | 'idle'
  | 'ready'
  | 'validating'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'unconfigured';

export interface TryOnRequestPayload {
  personImage: File | string; // File uploaded or URL of demo model
  garments: {
    top?: TryOnGarment;
    bottom?: TryOnGarment;
    dress?: TryOnGarment;
    outerwear?: TryOnGarment;
    accessories?: TryOnGarment[];
  };
  options?: {
    preserveBackground?: boolean;
    fitMode?: 'natural' | 'tight' | 'oversized';
    qualityLevel?: 'standard' | 'high' | 'ultra';
    seed?: number;
  };
}

export interface TryOnDebugInfo {
  jobId: string;
  requestId?: string;
  modelName: string;
  garmentId?: string;
  garmentName?: string;
  garmentImageUrl?: string;
  backendGarmentUrl?: string;
  backendPersonUrl?: string;
  inferenceStatus: string;
}

export interface TryOnResult {
  id: string;
  originalPersonUrl: string;
  resultImageUrl: string;
  generatedAt: string;
  status: 'success' | 'partial' | 'error';
  garmentsUsed: TryOnGarment[];
  processingDurationMs: number;
  warningNote?: string;
  debugInfo?: TryOnDebugInfo;
}

export interface TryOnApiConfig {
  provider: 'idm-vton' | 'fashn' | 'kling' | 'custom_serverless' | 'unconfigured';
  endpoint?: string;
  timeoutMs?: number;
  maxFileSizeMb: number;
  supportedFormats: string[];
}
