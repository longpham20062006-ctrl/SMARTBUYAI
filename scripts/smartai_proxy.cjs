/**
 * SMARTBUY AI - Local Reverse Proxy (smartai.test -> 127.0.0.1:5173)
 * Port 80 (HTTP chuẩn) -> Port 5173 (Vite Dev Server)
 * Hỗ trợ đầy đủ:
 *  - HTTP Reverse Proxy (GET, POST, OPTIONS, PATCH, DELETE)
 *  - Vite HMR WebSocket Upgrade (Hot Module Replacement)
 *  - X-Forwarded-* headers & Host Preservation
 *  - Tự động fallback/thông báo khi Vite chưa sẵn sàng
 */

const http = require('http');
const net = require('net');

const PROXY_PORT = 80;
const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = 5173;

const server = http.createServer((clientReq, clientRes) => {
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: clientReq.url,
    method: clientReq.method,
    headers: {
      ...clientReq.headers,
      host: clientReq.headers.host || 'smartai.test',
      'x-forwarded-host': clientReq.headers.host || 'smartai.test',
      'x-forwarded-proto': 'http',
      'x-forwarded-for': clientReq.socket.remoteAddress || '127.0.0.1',
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', (err) => {
    // Nếu Vite chưa khởi động xong
    clientRes.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
    clientRes.end(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="refresh" content="2">
        <title>SMARTBUY AI - Đang khởi động...</title>
        <style>
          body { background: #0b0f19; color: #fff; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
          .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); max-width: 500px; }
          h1 { color: #a855f7; margin-bottom: 12px; }
          p { color: #94a3b8; font-size: 15px; line-height: 1.6; }
          .spinner { width: 40px; height: 40px; border: 3px solid rgba(168,85,247,0.2); border-top-color: #a855f7; border-radius: 50%; animation: spin 1s linear infinite; margin: 20px auto; }
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="spinner"></div>
          <h1>SMARTBUY AI</h1>
          <p>Đang kết nối tới Vite Dev Server tại <strong>127.0.0.1:${TARGET_PORT}</strong>...<br/>Trang sẽ tự động tải lại sau 2 giây.</p>
        </div>
      </body>
      </html>
    `);
  });

  clientReq.pipe(proxyReq, { end: true });
});

// Xử lý WebSocket Upgrade cho Vite Hot Module Replacement (HMR)
server.on('upgrade', (req, clientSocket, head) => {
  const targetSocket = net.connect(
    { port: TARGET_PORT, host: TARGET_HOST },
    () => {
      // Gửi header HTTP Upgrade đến Vite dev server
      let reqHeader = `${req.method} ${req.url} HTTP/1.1\r\n`;
      for (const [key, val] of Object.entries(req.headers)) {
        if (Array.isArray(val)) {
          for (const v of val) reqHeader += `${key}: ${v}\r\n`;
        } else {
          reqHeader += `${key}: ${val}\r\n`;
        }
      }
      reqHeader += '\r\n';

      targetSocket.write(reqHeader);
      if (head && head.length > 0) {
        targetSocket.write(head);
      }

      // Nối 2 luồng socket lại với nhau
      clientSocket.pipe(targetSocket);
      targetSocket.pipe(clientSocket);
    }
  );

  targetSocket.on('error', (err) => {
    clientSocket.destroy();
  });

  clientSocket.on('error', (err) => {
    targetSocket.destroy();
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[LỖI] Cổng ${PROXY_PORT} đang bị một ứng dụng khác chiếm dụng (ví dụ: IIS, Skype, hoặc một web server khác).`);
    console.error('Vui lòng kiểm tra và giải phóng cổng 80 trước khi chạy proxy.');
  } else if (err.code === 'EACCES') {
    console.error(`\n[LỖI] Không đủ quyền truy cập cổng ${PROXY_PORT}.`);
    console.error('Hãy chạy Command Prompt / PowerShell dưới quyền Administrator.');
  } else {
    console.error('\n[LỖI PROXY]', err);
  }
  process.exit(1);
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log('\n=============================================================');
  console.log('   SMARTBUY AI - REVERSE PROXY ĐANG CHẠY THÀNH CÔNG');
  console.log('=============================================================');
  console.log(`   Địa chỉ truy cập : http://smartai.test/ (Không hiện :5173)`);
  console.log(`   Proxy chuyển tiếp: http://${TARGET_HOST}:${TARGET_PORT}/`);
  console.log(`   Vite HMR & WS    : Hoạt động song song`);
  console.log('=============================================================\n');
});
