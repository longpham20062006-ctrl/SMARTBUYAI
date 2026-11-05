const http = require('http');

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(d || '{}') });
        } catch(e) {
          resolve({ status: res.statusCode, data: d });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getJson(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'GET',
      headers
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        let json;
        try { json = JSON.parse(d); } catch (e) { json = d; }
        resolve({ status: res.statusCode, data: json });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('=== TEST 1: Unauthenticated request to /api/v1/admin/dashboard/kpi ===');
  const resUnauth = await getJson('http://localhost:8080/api/v1/admin/dashboard/kpi');
  console.log('Status:', resUnauth.status, '(Expected 401 or 403)');
  if (resUnauth.status === 401 || resUnauth.status === 403) {
    console.log('-> PASS: Unauthenticated access blocked correctly.');
  } else {
    console.error('-> FAIL: Unexpected status ' + resUnauth.status);
  }

  console.log('\n=== TEST 2: Customer login and access to admin dashboard ===');
  const custLogin = await postJson('http://localhost:8080/api/v1/auth/login', {
    email: 'khachhang@smartbuy.vn',
    password: '123456'
  });
  console.log('Customer login status:', custLogin.status);
  const custToken = custLogin.data.accessToken || custLogin.data.token;
  const resCustAdmin = await getJson('http://localhost:8080/api/v1/admin/dashboard/kpi', custToken);
  console.log('Customer access to admin dashboard status:', resCustAdmin.status, '(Expected 403)');
  if (resCustAdmin.status === 403) {
    console.log('-> PASS: Customer access to admin endpoint correctly forbidden (403).');
  } else {
    console.error('-> FAIL: Customer access not forbidden: ' + resCustAdmin.status);
  }

  console.log('\n=== TEST 3: Admin login and KPI queries with time filters ===');
  const adminLogin = await postJson('http://localhost:8080/api/v1/auth/login', {
    email: 'admin@smartbuy.vn',
    password: 'admin123'
  });
  console.log('Admin login status:', adminLogin.status);
  const adminToken = adminLogin.data.accessToken || adminLogin.data.token;
  if (!adminToken) {
    throw new Error('Admin login failed: ' + JSON.stringify(adminLogin.data));
  }

  const filters = ['today', 'yesterday', '7days', 'thisWeek', '30days', 'thisMonth', 'lastMonth', 'thisYear', 'all'];
  for (const f of filters) {
    const resKpi = await getJson('http://localhost:8080/api/v1/admin/dashboard/kpi?timeFilter=' + f, adminToken);
    console.log(`\n--- KPI [timeFilter=${f}] (Status ${resKpi.status}) ---`);
    console.log(JSON.stringify(resKpi.data, null, 2));
    if (resKpi.status !== 200) {
      console.error(`-> FAIL: Expected 200 for filter ${f}`);
    }
  }

  console.log('\n=== ALL API TESTS COMPLETED ===');
}

run().catch(console.error);
