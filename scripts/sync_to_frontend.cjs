const fs = require('fs');
const path = require('path');

const backupSrc = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\1740427a-d3f3-4847-8779-e5836f36995a\\backup_working_tree\\src';
const feSrc = 'D:\\SMARTBUYAI\\frontend\\src';
const rootSrc = 'D:\\SMARTBUYAI\\src';

function copyDirRecursive(srcDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('1. Copying backup src to frontend/src...');
copyDirRecursive(backupSrc, feSrc);
console.log('   frontend/src copied successfully.');

console.log('2. Copying backup src to root src (for complete synchronization)...');
copyDirRecursive(backupSrc, rootSrc);
console.log('   root src copied successfully.');

// Copy vay_optimized
const backupVay = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\1740427a-d3f3-4847-8779-e5836f36995a\\backup_working_tree\\vay_optimized';
const feVay = 'D:\\SMARTBUYAI\\frontend\\public\\images\\san-pham\\quan-ao-nu\\vay_optimized';
const rootVay = 'D:\\SMARTBUYAI\\public\\images\\san-pham\\quan-ao-nu\\vay_optimized';

if (fs.existsSync(backupVay)) {
  console.log('3. Copying vay_optimized to frontend/public...');
  copyDirRecursive(backupVay, feVay);
  console.log('4. Copying vay_optimized to root public...');
  copyDirRecursive(backupVay, rootVay);
}

// Copy .env.smartfit.example if not exists in frontend
const rootEnvSmartfit = 'D:\\SMARTBUYAI\\.env.smartfit.example';
const feEnvSmartfit = 'D:\\SMARTBUYAI\\frontend\\.env.smartfit.example';
if (fs.existsSync(rootEnvSmartfit)) {
  fs.copyFileSync(rootEnvSmartfit, feEnvSmartfit);
  console.log('5. Copied .env.smartfit.example to frontend/.env.smartfit.example');
}

console.log('Sync completed successfully.');

