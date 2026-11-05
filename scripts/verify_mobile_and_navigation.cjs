const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'D:\\SMARTBUYAI\\scripts\\screenshots';

async function run() {
  console.log('=== TESTING MOBILE VIEWPORT & NAVIGATION ===');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--enable-webgl',
    '--use-gl=angle',
    '--window-size=390,844',
    '--no-sandbox',
    'about:blank',
  ]);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const res = await fetch('http://127.0.0.1:9223/json/version');
      const data = await res.json();
      if (data.webSocketDebuggerUrl) {
        wsUrl = data.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  const newTabRes = await fetch('http://127.0.0.1:9223/json/new?http://127.0.0.1:5173/?debugGalaxy=1', {
    method: 'PUT',
  });
  const tab = await newTabRes.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  let id = 1;
  const callbacks = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      const cb = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      cb(msg);
    }
  };

  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  function sendCommand(method, params = {}) {
    return new Promise((resolve) => {
      const reqId = id++;
      callbacks.set(reqId, resolve);
      ws.send(JSON.stringify({ id: reqId, method, params }));
    });
  }

  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');

  const consoleErrors = [];
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
    }
  });

  // Wait 2s for mobile intro
  await new Promise((r) => setTimeout(r, 2000));
  const resMobile = await sendCommand('Runtime.evaluate', {
    expression: 'JSON.stringify(window.__galaxyTelemetry || {})',
    returnByValue: true,
  });
  const mobileTel = JSON.parse(resMobile.result.result.value || '{}');
  console.log('Mobile Telemetry at 2s:', mobileTel);

  // Capture Mobile Intro screenshot
  const mobileShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'cdp_mobile_intro.png'), Buffer.from(mobileShot.result.data, 'base64'));
  console.log('Captured cdp_mobile_intro.png');

  // Test Navigation: Navigate to /products
  console.log('Navigating to /products...');
  await sendCommand('Page.navigate', { url: 'http://127.0.0.1:5173/products' });
  await new Promise((r) => setTimeout(r, 1500));

  // Navigate back to HomePage
  console.log('Navigating back to /?debugGalaxy=1...');
  await sendCommand('Page.navigate', { url: 'http://127.0.0.1:5173/?debugGalaxy=1' });
  await new Promise((r) => setTimeout(r, 1500));

  const resReturn = await sendCommand('Runtime.evaluate', {
    expression: 'JSON.stringify(window.__galaxyTelemetry || {})',
    returnByValue: true,
  });
  const returnTel = JSON.parse(resReturn.result.result.value || '{}');
  console.log('Return to HomePage Telemetry (Auto Replay):', returnTel);

  console.log('Console Errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors);
  }

  ws.close();
  chrome.kill();
}

run().catch(console.error);
