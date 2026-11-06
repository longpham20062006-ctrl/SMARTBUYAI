const cp = require('child_process');
const fs = require('fs');

console.log('Testing staging...');
cp.execSync('git add -A', { encoding: 'utf8' });

const stagedFiles = cp.execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
console.log(`Total files staged: ${stagedFiles.length}`);

let oversized = [];
for (const file of stagedFiles) {
  try {
    const stat = fs.statSync(file);
    if (stat.size > 20 * 1024 * 1024) { // check > 20MB
      oversized.push({ file, sizeMB: (stat.size / (1024 * 1024)).toFixed(2) });
    }
  } catch (e) {}
}

console.log('Staged files > 20MB:', oversized);

