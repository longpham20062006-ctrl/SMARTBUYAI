const fs = require('fs');

const imported = JSON.parse(fs.readFileSync('src/mocks/importedProducts.json', 'utf8'));

// Check test ids
const testIds = [
  // Look 1
  'HOODIE-001', 'TEE-002', 'PANTS-003', 'JACKET-002',
  // Look 2
  'SHIRT-001', 'POLO-001', 'PANTS-001', 'SHIRT-003',
  // Look 3
  'W-DRESS-001', 'W-DRESS-026', 'W-DRESS-012', 'W-DRESS-002',
  // Look 4
  'W-DRESS-GOTHIC-005', 'W-DRESS-GOTHIC-001', 'W-DRESS-GOTHIC-007', 'ACC-027',
  // Hot Section
  'W-DRESS-001', 'W-DRESS-GOTHIC-005', 'W-CROPTOP-001', 'SHIRT-001', 'HOODIE-001', 'JACKET-002', 'PANTS-003', 'ACC-027'
];

console.log('Checking all proposed IDs against importedProducts.json:');
const uniqueIds = Array.from(new Set(testIds));
let allExist = true;

uniqueIds.forEach(id => {
  const p = imported.find(x => x.id === id);
  if (!p) {
    console.log(`❌ Missing product for ID: ${id}`);
    allExist = false;
    return;
  }
  const imgPath = 'public' + p.images[0];
  const diskOk = fs.existsSync(imgPath);
  console.log(`✅ [${id}] ${p.name} (${p.categorySlug}, ${p.gender}) -> img: ${p.images[0]} (Disk: ${diskOk ? 'YES' : 'NO'})`);
  if (!diskOk) allExist = false;
});

console.log(`\nAll exist on disk: ${allExist}`);

