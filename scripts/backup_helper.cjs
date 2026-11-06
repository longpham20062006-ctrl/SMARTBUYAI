const fs = require('fs');
const path = require('path');

const backupDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\1740427a-d3f3-4847-8779-e5836f36995a\\backup_working_tree';

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('Copying src to backup...');
copyRecursiveSync('D:\\SMARTBUYAI\\src', path.join(backupDir, 'src'));

console.log('Copying vay_optimized to backup...');
copyRecursiveSync('D:\\SMARTBUYAI\\public\\images\\san-pham\\quan-ao-nu\\vay_optimized', path.join(backupDir, 'vay_optimized'));

console.log('Copying config files...');
fs.copyFileSync('D:\\SMARTBUYAI\\vite.config.ts', path.join(backupDir, 'vite.config.ts'));
fs.copyFileSync('D:\\SMARTBUYAI\\.gitignore', path.join(backupDir, '.gitignore'));
fs.copyFileSync('D:\\SMARTBUYAI\\gpu-server-FASHN-8GB\\app.py', path.join(backupDir, 'gpu_app.py'));

if (fs.existsSync('D:\\SMARTBUYAI\\.env.smartfit.example')) {
  fs.copyFileSync('D:\\SMARTBUYAI\\.env.smartfit.example', path.join(backupDir, '.env.smartfit.example'));
}

console.log('Backup finished successfully to:', backupDir);
