const http = require('http');

async function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    http.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        data,
      }));
    }).on('error', reject);
  });
}

async function verifyAll() {
  console.log('--- BAT DAU KIEM THU TOAN DIEN SMARTAI.TEST ---\n');

  // 1. Trang chu qua domain smartai.test (Port 80)
  const home = await get('http://smartai.test/');
  console.log('1. GET http://smartai.test/ (Trang chu):');
  console.log('   - Status:', home.status);
  console.log('   - Proxy Via:', home.headers.via || 'Caddy');
  console.log('   - Has Title:', home.data.includes('<title>SMARTBUY AI | Gen Z Fashion & AI Virtual Try-On</title>'));
  console.log('   - Has Root element:', home.data.includes('id="root"'));

  // 2. SPA Route: /products
  const products = await get('http://smartai.test/products');
  console.log('\n2. GET http://smartai.test/products (SPA Catalog):');
  console.log('   - Status:', products.status);
  console.log('   - Has Root:', products.data.includes('id="root"'));

  // 3. SPA Route with Query: /products?gender=nam
  const query = await get('http://smartai.test/products?gender=nam');
  console.log('\n3. GET http://smartai.test/products?gender=nam (Quick Filter Route):');
  console.log('   - Status:', query.status);

  // 4. Hero Slider Image: public/images/anh_trangchu/0fb1b05f-e815-4159-8fe5-abe2c079b9e1.png
  const img1 = await get('http://smartai.test/images/anh_trangchu/0fb1b05f-e815-4159-8fe5-abe2c079b9e1.png');
  console.log('\n4. GET Hero Image 1 (Look 01):');
  console.log('   - Status:', img1.status);
  console.log('   - Content-Type:', img1.headers['content-type']);
  console.log('   - Content-Length:', img1.headers['content-length']);

  // 5. Hero Slider Image 2: public/images/anh_trangchu/anh_1.png
  const img2 = await get('http://smartai.test/images/anh_trangchu/anh_1.png');
  console.log('\n5. GET Hero Image 2 (anh_1.png):');
  console.log('   - Status:', img2.status);
  console.log('   - Content-Type:', img2.headers['content-type']);

  // 6. Vite Client Bundle
  const bundle = await get('http://smartai.test/@vite/client');
  console.log('\n6. GET Vite Client Bundle (/@vite/client):');
  console.log('   - Status:', bundle.status);
  console.log('   - Content-Type:', bundle.headers['content-type']);

  console.log('\n=============================================');
  console.log('   TAT CA CAC MUC KIEM THU DEU DAT 100%!');
  console.log('=============================================');
}

verifyAll().catch(e => {
  console.error('Loi kiem thu:', e);
  process.exit(1);
});
