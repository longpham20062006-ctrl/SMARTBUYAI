const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'src', 'features', 'catalog', 'pages', 'CatalogPage.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Update quickFilterPills for nu
const oldNuPills = `    if (genderParam === 'nu') {
      return [
        { id: 'all', label: \`Tất cả đồ Nữ (\${totalScopedProductsCount})\`, filter: {} },
        { id: 'ao-thun', label: 'Áo thun (13)', filter: { category: 'ao-thun' } },
        { id: 'vay-group', label: \`Váy Nữ (\${vayCount})\`, filter: { category: 'vay' } },
        { id: 'ao-hoodie', label: 'Hoodie (9)', filter: { category: 'ao-hoodie' } },
        { id: 'ao-croptop', label: 'Croptop (7)', filter: { category: 'ao-croptop' } },
        { id: 'ao-hai-day', label: 'Áo hai dây (7)', filter: { category: 'ao-hai-day' } },
        { id: 'ao-len', label: 'Áo len (4)', filter: { category: 'ao-len' } },
        { id: 'ao-cardigan', label: 'Cardigan (6)', filter: { category: 'ao-cardigan' } },
        { id: 'quan-group', label: \`Quần Nữ (\${pantCount})\`, filter: { category: 'quan' } },
      ];
    }`;

const newNuPills = `    if (genderParam === 'nu') {
      return [
        { id: 'all', label: \`Tất cả đồ Nữ (\${totalScopedProductsCount})\`, filter: {} },
        { id: 'ao-group', label: \`Áo Nữ (\${shirtCount})\`, filter: { category: 'ao' } },
        { id: 'quan-group', label: \`Quần Nữ (\${pantCount})\`, filter: { category: 'quan' } },
        { id: 'vay-group', label: \`Váy & Đầm (\${vayCount})\`, filter: { category: 'vay' } },
        { id: 'ao-thun', label: 'Áo thun (13)', filter: { category: 'ao-thun' } },
        { id: 'ao-croptop', label: 'Croptop (7)', filter: { category: 'ao-croptop' } },
        { id: 'ao-hai-day', label: 'Áo hai dây (7)', filter: { category: 'ao-hai-day' } },
        { id: 'ao-hoodie', label: 'Hoodie (9)', filter: { category: 'ao-hoodie' } },
        { id: 'ao-cardigan', label: 'Cardigan (6)', filter: { category: 'ao-cardigan' } },
        { id: 'ao-len', label: 'Áo len (4)', filter: { category: 'ao-len' } },
      ];
    }`;

// 2. Update category accordion group header to be a clickable button
const oldGroupHeader = `                {/* Tiêu đề Cấp 2: Nhóm Lớn (Áo, Quần, Váy...) */}
                <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#18181B] bg-[#F2F3F5] rounded-md">
                  <span>{group.groupName}</span>
                  <span className="text-[10px] text-[#71717A] font-semibold">({group.totalCount})</span>
                </div>`;

const newGroupHeader = `                {/* Tiêu đề Cấp 2: Nhóm Lớn (Áo, Quần, Váy...) */}
                <button
                  type="button"
                  onClick={() => updateParam('category', group.groupKey)}
                  className={\`w-full text-left flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md cursor-pointer transition-colors \${
                    categoryParam === group.groupKey
                      ? 'bg-[#8B5CF6] text-white shadow-2xs'
                      : 'text-[#18181B] bg-[#F2F3F5] hover:bg-[#E4E4E7]'
                  }\`}
                  title={\`Xem tất cả sản phẩm thuộc nhóm \${group.groupName}\`}
                >
                  <span>{group.groupName}</span>
                  <span className={\`text-[10px] font-semibold \${categoryParam === group.groupKey ? 'text-purple-100' : 'text-[#71717A]'}\`}>
                    ({group.totalCount})
                  </span>
                </button>`;

const normContent = content.replace(/\r\n/g, '\n');
const normOldNuPills = oldNuPills.replace(/\r\n/g, '\n');
const normNewNuPills = newNuPills.replace(/\r\n/g, '\n');
const normOldGroupHeader = oldGroupHeader.replace(/\r\n/g, '\n');
const normNewGroupHeader = newGroupHeader.replace(/\r\n/g, '\n');

if (!normContent.includes(normOldNuPills)) {
  console.error('Failed to match oldNuPills in CatalogPage.tsx');
  process.exit(1);
}

if (!normContent.includes(normOldGroupHeader)) {
  console.error('Failed to match oldGroupHeader in CatalogPage.tsx');
  process.exit(1);
}

let updated = normContent.replace(normOldNuPills, normNewNuPills);
updated = updated.replace(normOldGroupHeader, normNewGroupHeader);

const isCRLF = content.includes('\r\n');
fs.writeFileSync(targetFile, isCRLF ? updated.replace(/\n/g, '\r\n') : updated, 'utf8');
console.log('Successfully updated nu filters in CatalogPage.tsx');

