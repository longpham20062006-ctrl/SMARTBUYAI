const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'common', 'ProductCard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update imports
content = content.replace(
  "import { getValidProductImages, hasValidProductImage } from '@/lib/imageValidator';",
  "import { getValidProductImages, hasValidProductImage, isProductEligibleForPublicDisplay } from '@/lib/imageValidator';"
);

// Update guard check
content = content.replace(
  "if (!product || !hasValidProductImage(product)) return null;",
  "if (!product || !isProductEligibleForPublicDisplay(product)) return null;"
);

// Update price rendering block
const oldPriceBlock = `{showPrice ? (
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F2F3F5]">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                {currentPrice && currentPrice > 0 ? (
                  <>
                    <span className="text-sm sm:text-base font-bold text-[#18181B]">
                      {formatPrice(currentPrice)}
                    </span>
                    {originalPrice && originalPrice > currentPrice && (
                      <span className="text-[11px] text-[#A1A1AA] line-through">
                        {formatPrice(originalPrice)}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs sm:text-sm font-semibold text-[#71717A] italic">
                    Liên hệ / Đang cập nhật
                  </span>
                )}
              </div>

              {currentPrice && currentPrice > 0 && originalPrice && originalPrice > currentPrice && (
                <span className="text-[10px] font-bold text-[#7C3AED] bg-[#F3E8FF] px-1.5 py-0.5 rounded-sm shrink-0">
                  -{Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}%
                </span>
              )}
            </div>
          )`;

const newPriceBlock = `{showPrice ? (
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F2F3F5]">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                {currentPrice > 0 ? (
                  <>
                    <span className="text-sm sm:text-base font-bold text-[#18181B]">
                      {formatPrice(currentPrice)}
                    </span>
                    {originalPrice > currentPrice && (
                      <span className="text-[11px] text-[#A1A1AA] line-through">
                        {formatPrice(originalPrice)}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs sm:text-sm font-semibold text-[#71717A] italic">
                    Đang cập nhật giá
                  </span>
                )}
              </div>

              {Boolean(currentPrice > 0 && originalPrice > currentPrice) && (
                <span className="text-[10px] font-bold text-[#7C3AED] bg-[#F3E8FF] px-1.5 py-0.5 rounded-sm shrink-0">
                  -{Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}%
                </span>
              )}
            </div>
          )`;

const normContent = content.replace(/\r\n/g, '\n');
const normOldPriceBlock = oldPriceBlock.replace(/\r\n/g, '\n');
const normNewPriceBlock = newPriceBlock.replace(/\r\n/g, '\n');

if (normContent.includes(normOldPriceBlock)) {
  const isCRLF = content.includes('\r\n');
  const updatedNorm = normContent.replace(normOldPriceBlock, normNewPriceBlock);
  fs.writeFileSync(filePath, isCRLF ? updatedNorm.replace(/\n/g, '\r\n') : updatedNorm, 'utf8');
  console.log('Successfully updated ProductCard.tsx');
} else {
  console.error('Price block not found in ProductCard.tsx');
  process.exit(1);
}

