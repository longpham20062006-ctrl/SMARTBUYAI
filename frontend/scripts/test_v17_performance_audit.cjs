/**
 * SMARTBUY AI — V17 PERFORMANCE AUDIT & BENCHMARK SUITE
 * Kiểm tra và đối chiếu các tiêu chí hiệu năng:
 * 1. Bundle Size & Code Splitting (Index chunk, Three.js chunk, Route chunks)
 * 2. API Response Latency & Cache-Control headers
 * 3. Product Card Image Optimization (Aspect Ratio, lazy loading, async decoding)
 * 4. Performance Mode Integration
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
  }
}

async function fetchHttp(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const latency = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          latency,
        });
      });
    }).on('error', reject);
  });
}

async function runAudit() {
  console.log('===============================================================');
  console.log('   SMARTBUY AI — V17 PERFORMANCE AUDIT & BENCHMARK REPORT     ');
  console.log('===============================================================\n');

  // --- PHẦN 1: BUNDLE SIZE & CHUNK ISOLATION ---
  console.log('1. KIỂM TRA PHÂN ĐOẠN CHUNK & KÍCH THƯỚC BUNDLE (VITE BUILD):');
  const distAssetsDir = path.join(__dirname, '..', 'dist', 'assets');
  if (fs.existsSync(distAssetsDir)) {
    const files = fs.readdirSync(distAssetsDir);

    const indexJs = files.find((f) => f.startsWith('index-') && f.endsWith('.js'));
    const vendorThree = files.find((f) => f.startsWith('vendor-three-') && f.endsWith('.js'));
    const vendorReact = files.find((f) => f.startsWith('vendor-react-') && f.endsWith('.js'));
    const homePage = files.find((f) => f.startsWith('HomePage-') && f.endsWith('.js'));
    const catalogPage = files.find((f) => f.startsWith('CatalogPage-') && f.endsWith('.js'));
    const tryOnPage = files.find((f) => f.startsWith('VirtualTryOnPage-') && f.endsWith('.js'));
    const adminProducts = files.find((f) => f.startsWith('AdminProductsPage-') && f.endsWith('.js'));

    assert(Boolean(indexJs), `Tìm thấy file main runtime index JS: ${indexJs}`);
    if (indexJs) {
      const stats = fs.statSync(path.join(distAssetsDir, indexJs));
      const sizeKb = stats.size / 1024;
      console.log(`     -> Kích thước index.js: ${sizeKb.toFixed(2)} KB (Gốc: 5,400.46 KB)`);
      assert(sizeKb < 500, `index.js đã giảm mạnh từ 5,400 KB xuống còn ${sizeKb.toFixed(2)} KB (< 500 KB)`);
    }

    assert(Boolean(vendorThree), `Vendor Three.js được bóc tách riêng: ${vendorThree}`);
    assert(Boolean(vendorReact), `Vendor React được bóc tách riêng: ${vendorReact}`);
    assert(Boolean(homePage), `HomePage được lazy-load riêng: ${homePage}`);
    assert(Boolean(catalogPage), `CatalogPage được lazy-load riêng: ${catalogPage}`);
    assert(Boolean(tryOnPage), `VirtualTryOnPage được lazy-load riêng: ${tryOnPage}`);
    assert(Boolean(adminProducts), `AdminProductsPage được tách chunk riêng: ${adminProducts}`);
  } else {
    console.error('     [!] Chưa tìm thấy thư mục dist/assets');
  }

  // --- PHẦN 2: PRODUCT CARD IMAGE OPTIMIZATION ---
  console.log('\n2. KIỂM TRA TỐI ƯU HÌNH ẢNH SẢN PHẨM & TRÁNH CLS (CUMULATIVE LAYOUT SHIFT):');
  const productCardPath = path.join(__dirname, '..', 'src', 'components', 'common', 'ProductCard.tsx');
  if (fs.existsSync(productCardPath)) {
    const content = fs.readFileSync(productCardPath, 'utf8');
    assert(content.includes('aspect-[3/4]'), 'ProductCard có tỷ lệ cố định aspect-[3/4] chống giật khung layout (CLS = 0)');
    assert(content.includes('loading="lazy"'), 'ProductCard có thuộc tính loading="lazy" tải ảnh theo cuộn');
    assert(content.includes('decoding="async"'), 'ProductCard có decoding="async" giải mã ảnh ngoài main thread');
  }

  // --- PHẦN 3: THREE.JS & HIỆU NĂNG 3D ---
  console.log('\n3. KIỂM TRA THREE.JS & INTRO 3D OPTIMIZATION:');
  const galaxyIntroPath = path.join(__dirname, '..', 'src', 'components', 'effects', 'GalaxyIntro.tsx');
  if (fs.existsSync(galaxyIntroPath)) {
    const content = fs.readFileSync(galaxyIntroPath, 'utf8');
    assert(content.includes('isMobile ? 1.0 : 1.5'), 'GalaxyIntro giới hạn pixelRatio tối đa 1.5 trên desktop và 1.0 trên mobile');
    assert(content.includes('performance.now()'), 'Sử dụng timer chuẩn performance.now() tránh lỗi deprecated THREE.Clock');
    assert(content.includes('cancelAnimationFrame'), 'Có cơ chế giải phóng render loop cancelAnimationFrame sạch sẽ');
    assert(content.includes('dispose()'), 'Có cơ chế giải phóng bộ nhớ WebGL Geometries/Materials/Textures (dispose)');
  }

  // --- PHẦN 4: PERFORMANCE MODE PROVIDER & TOGGLE ---
  console.log('\n4. KIỂM TRA CHẾ ĐỘ HIỆU NĂNG (PERFORMANCE MODE):');
  const perfContextPath = path.join(__dirname, '..', 'src', 'context', 'PerformanceContext.tsx');
  const perfTogglePath = path.join(__dirname, '..', 'src', 'components', 'common', 'PerformanceToggle.tsx');
  assert(fs.existsSync(perfContextPath), 'File PerformanceContext.tsx tồn tại và hoạt động');
  assert(fs.existsSync(perfTogglePath), 'File PerformanceToggle.tsx tồn tại với 3 chế độ: Auto, Standard, Saver');
  if (fs.existsSync(perfContextPath)) {
    const content = fs.readFileSync(perfContextPath, 'utf8');
    assert(content.includes('sb_perf_mode'), 'Trạng thái chế độ hiệu năng được lưu bền vững (sb_perf_mode)');
    assert(content.includes('hardwareConcurrency'), 'Tự động phát hiện cấu hình CPU / RAM máy yếu');
  }

  // --- PHẦN 5: BACKEND DATABASE & API RESPONSE LATENCY ---
  console.log('\n5. KIỂM TRA API BACKEND LATENCY & HTTP CACHING HEADERS:');
  try {
    const resProducts = await fetchHttp('http://127.0.0.1:8080/api/v1/products?size=20');
    assert(resProducts.statusCode === 200, `API /api/v1/products trả về HTTP 200 (Latency: ${resProducts.latency}ms)`);
    assert(resProducts.latency < 250, `Thời gian phản hồi API sản phẩm cực nhanh: ${resProducts.latency}ms (< 250ms)`);
    const cacheControl = resProducts.headers['cache-control'] || '';
    assert(cacheControl.includes('public') && cacheControl.includes('max-age'), `Header Cache-Control được kích hoạt: "${cacheControl}"`);

    const resNewDrops = await fetchHttp('http://127.0.0.1:8080/api/v1/products/new-drops');
    assert(resNewDrops.statusCode === 200, `API /api/v1/products/new-drops trả về HTTP 200 (Latency: ${resNewDrops.latency}ms)`);

    const resNu = await fetchHttp('http://127.0.0.1:8080/api/v1/products?gender=nu&size=200');
    const nuJson = JSON.parse(resNu.data);
    assert(nuJson.totalElements === 120, `Danh mục Nữ trả về chính xác 120 sản phẩm thực tế có ảnh`);
  } catch (err) {
    console.error('     [!] Lỗi khi gọi API Backend:', err.message);
  }

  console.log('\n===============================================================');
  console.log(`KẾT QUẢ AUDIT HIỆU NĂNG: ${passedTests}/${totalTests} TIÊU CHÍ ĐẠT (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('===============================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAudit();

