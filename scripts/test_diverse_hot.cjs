const fs = require('fs');

const imported = JSON.parse(fs.readFileSync('src/mocks/importedProducts.json', 'utf8'));

const DIVERSE_HOT_IDS = [
  'W-DRESS-001',        // Váy nữ thiết kế dáng xòe
  'W-DRESS-GOTHIC-005', // Đầm dạ hội dự tiệc cao cấp
  'W-CROPTOP-001',      // Áo croptop nữ Y2K
  'SHIRT-001',          // Áo sơ mi nam dài tay lụa
  'HOODIE-001',         // Áo hoodie nỉ bông streetwear
  'JACKET-002',         // Áo khoác bomber streetwear
  'PANTS-003',          // Quần cargo túi hộp tác chiến
  'ACC-027',            // Phụ kiện: Túi clutch dự tiệc tối giản
];

const found = DIVERSE_HOT_IDS.map(id => imported.find(p => p.id === id)).filter(Boolean);

console.log(`Found diverse hot products: ${found.length} / ${DIVERSE_HOT_IDS.length}`);
found.forEach((p, idx) => {
  console.log(`${idx + 1}. [${p.id}] ${p.name} (${p.categorySlug}, ${p.gender}) -> img: ${p.images[0]}`);
});

