// Tự động sinh từ Folder-Based Product Variants Engine V4 (1 folder mẫu = 1 sản phẩm)
import { Product } from '@/types';
import rawData from './importedProducts.json';

export const IMPORTED_PRODUCTS: Product[] = rawData as Product[];
