const fs = require('fs');
const path = require('path');

const srcDir = 'public/images/san-pham/quan-ao-nu/vay';
const dstDir = 'public/images/san-pham/quan-ao-nu/vay_optimized';

if (!fs.existsSync(dstDir)) {
  fs.mkdirSync(dstDir, { recursive: true });
}

for (let i = 1; i <= 68; i++) {
  const padName = `vay_${String(i).padStart(2, '0')}.webp`;
  const plainName = `vay_${i}.webp`;

  const srcPath = path.join(srcDir, padName);
  const dstPath = path.join(dstDir, plainName);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, dstPath);
  }
}

const createdFiles = fs.readdirSync(dstDir);
console.log(`Created ${createdFiles.length} files in ${dstDir}`);
console.log('Sample:', createdFiles.slice(0, 10));

