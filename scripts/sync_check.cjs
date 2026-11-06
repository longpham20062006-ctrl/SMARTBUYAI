const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const rootDir = 'D:\\SMARTBUYAI';
const files = fs.readdirSync(rootDir);
for (const f of files) {
  if (f.includes('commit') || f.includes('ite and') || f.includes('tomer')) {
    console.log('Found strange file:', f);
    try {
      const gitOut = cp.execSync(`git ls-files "${f.replace(/"/g, '\\"')}"`, { cwd: rootDir, encoding: 'utf8' }).trim();
      console.log('  git ls-files:', gitOut);
    } catch (e) {
      console.log('  error:', e.message);
    }
  }
}

