const fs = require('fs');

const validFilePath = 'src/constants/validImagePaths.ts';
let content = fs.readFileSync(validFilePath, 'utf8');

const files = fs.readdirSync('public/images/san-pham/quan-ao-nu/vay_optimized')
  .filter(f => f.endsWith('.webp'))
  .map(f => `  "/images/san-pham/quan-ao-nu/vay_optimized/${f}",`);

const insertBlock = files.join('\n') + '\n';

// Insert before the last item or before closing bracket
const marker = '  "/images/san-pham/quan-ao-nu/vay/váy_gothic_ren_hoa_đen_trắng_thanh_lịch.png"';
if (content.includes(marker)) {
  content = content.replace(marker, marker + ',\n' + insertBlock.trimEnd());
  fs.writeFileSync(validFilePath, content, 'utf8');
  console.log('Successfully updated validImagePaths.ts with', files.length, 'vay_optimized paths!');
} else {
  console.log('Marker not found!');
}

