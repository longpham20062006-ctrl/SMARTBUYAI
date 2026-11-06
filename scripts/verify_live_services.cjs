const http = require('http');

async function testUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ url, status: res.statusCode, bodySample: data.slice(0, 100) });
      });
    }).on('error', (err) => {
      resolve({ url, error: err.message });
    });
  });
}

async function run() {
  console.log('=== VERIFYING LIVE SERVICES ===');
  const urls = [
    'http://localhost:5173/',
    'http://100.72.114.122:5173/',
    'http://localhost:7860/api/v1/health',
    'http://100.72.114.122:7860/api/v1/health',
    'http://localhost:5173/api/smartfit/health',
    'http://100.72.114.122:5173/api/smartfit/health'
  ];

  for (const u of urls) {
    const res = await testUrl(u);
    if (res.error) {
      console.log(`❌ [FAIL] ${u} -> Error: ${res.error}`);
    } else {
      console.log(`✅ [OK ${res.status}] ${u} -> ${res.bodySample.replace(/\n/g, ' ')}`);
    }
  }
}

run();

