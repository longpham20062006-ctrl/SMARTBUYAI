const fs = require('fs');
const path = require('path');
const cp = require('child_process');

console.log('=== PRE-PUSH AUDIT ===');

// 1. Check git status
const status = cp.execSync('git status --porcelain', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
console.log(`Total changed/untracked items: ${status.length}`);

// 2. Check for large files (> 50MB) in repo
const filesOver50MB = [];
function checkDir(dir) {
  if (dir.includes('node_modules') || dir.includes('.venv') || dir.includes('.git') || dir.includes('dist') || dir.includes('target')) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      checkDir(full);
    } else {
      try {
        const stat = fs.statSync(full);
        if (stat.size > 50 * 1024 * 1024) {
          filesOver50MB.push({ path: full, sizeMB: (stat.size / (1024 * 1024)).toFixed(2) });
        }
      } catch (e) {}
    }
  }
}
checkDir('D:\\SMARTBUYAI');
console.log('Files > 50MB (excluding node_modules, .venv, target, dist):', filesOver50MB);

// 3. Check for API keys or secrets in modified/untracked files
const sensitivePatterns = [
  /AIza[0-9A-Za-z-_]{35}/, // Google API key
  /sk-[a-zA-Z0-9]{32,}/,   // OpenAI key
  /ghp_[a-zA-Z0-9]{36}/,   // GitHub token
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/ // JWT token
];

console.log('Done scanning.');

