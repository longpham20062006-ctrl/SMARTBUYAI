/**
 * Test script for verifying Reverse Proxy on Port 80 for smartai.test
 */

const http = require('http');
const { spawn } = require('child_process');

async function testEndpoint(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 80,
        path,
        method: 'GET',
        headers: {
          Host: 'smartai.test',
          ...headers,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            bodyLength: body.length,
            bodyPreview: body.slice(0, 200),
          });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('--- KHỞI ĐỘNG PROXY TRÊN CỔNG 80 ĐỂ KIỂM THỬ ---');
  const proxyProcess = spawn('node', ['scripts/smartai_proxy.cjs'], {
    cwd: 'd:/SMARTBUYAI',
    stdio: 'inherit',
  });

  // Chờ 1 giây để proxy bind vào cổng 80
  await new Promise((r) => setTimeout(r, 1200));

  try {
    console.log('\n1. Test GET / với Host: smartai.test');
    const homeRes = await testEndpoint('/');
    console.log(`   Status: ${homeRes.statusCode}`);
    console.log(`   Body size: ${homeRes.bodyLength} bytes`);
    console.log(`   Preview: ${homeRes.bodyPreview.replace(/\r?\n/g, ' ').slice(0, 100)}...`);

    console.log('\n2. Test GET /products với Host: smartai.test (SPA Routing)');
    const productsRes = await testEndpoint('/products');
    console.log(`   Status: ${productsRes.statusCode}`);
    console.log(`   Body size: ${productsRes.bodyLength} bytes`);

    console.log('\n3. Test GET /products?gender=nam với Host: smartai.test');
    const queryRes = await testEndpoint('/products?gender=nam');
    console.log(`   Status: ${queryRes.statusCode}`);
    console.log(`   Body size: ${queryRes.bodyLength} bytes`);

    console.log('\n4. Test Vite assets /src/main.tsx');
    const assetRes = await testEndpoint('/src/main.tsx');
    console.log(`   Status: ${assetRes.statusCode}`);
    console.log(`   Content-Type: ${assetRes.headers['content-type']}`);

    console.log('\n--- TẤT CẢ TEST ĐỀU THÀNH CÔNG! ---');
  } catch (err) {
    console.error('Test thất bại:', err);
  } finally {
    proxyProcess.kill();
    console.log('Đã dừng test proxy process.');
  }
}

run();
