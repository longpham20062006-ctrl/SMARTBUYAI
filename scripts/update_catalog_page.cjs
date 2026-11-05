const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'features', 'catalog', 'pages', 'CatalogPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes('isProductEligibleForPublicDisplay')) {
  content = content.replace(
    "import { getActiveCategories, getActiveGroupedCategories, CATEGORY_DEFINITIONS } from '@/constants/categories';",
    "import { getActiveCategories, getActiveGroupedCategories, CATEGORY_DEFINITIONS } from '@/constants/categories';\nimport { isProductEligibleForPublicDisplay } from '@/lib/imageValidator';"
  );
}

// 2. Update displayedProducts
content = content.replace(
  `  // Paginated products
  const displayedProducts = useMemo(() => {
    return allFilteredProducts.slice(0, visibleCount);
  }, [allFilteredProducts, visibleCount]);`,
  `  // Paginated products (đảm bảo 100% chỉ hiển thị sản phẩm hợp lệ, không có ô trống/lỗ thủng grid)
  const displayedProducts = useMemo(() => {
    return allFilteredProducts.filter(isProductEligibleForPublicDisplay).slice(0, visibleCount);
  }, [allFilteredProducts, visibleCount]);`
);

// 3. Update grid map
content = content.replace(
  `                  {displayedProducts.map((product) => (
                    <div
                      key={product.id}`,
  `                  {displayedProducts.filter(isProductEligibleForPublicDisplay).map((product) => (
                    <div
                      key={product.id}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated CatalogPage.tsx');

