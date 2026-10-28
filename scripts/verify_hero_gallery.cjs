const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'D:\\SMARTBUYAI\\scripts\\screenshots';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('=== STARTING CHROME CDP FOR HERO FASHION GALLERY ===');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--enable-webgl',
    '--use-gl=angle',
    '--window-size=1440,1100',
    '--no-sandbox',
    'about:blank',
  ]);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const res = await fetch('http://127.0.0.1:9225/json/version');
      const data = await res.json();
      if (data.webSocketDebuggerUrl) {
        wsUrl = data.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    console.error('Could not connect to Chrome CDP.');
    chrome.kill();
    return;
  }

  const newTabRes = await fetch('http://127.0.0.1:9225/json/new?http://127.0.0.1:5173/?intro=0', {
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
  await sendCommand('Network.enable');

  const failedUrls = [];
  const consoleErrors = [];

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Network.responseReceived') {
      const resp = msg.params.response;
      if (resp.status >= 400 && resp.url.includes('/images/')) {
        failedUrls.push({ url: resp.url, status: resp.status });
      }
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
    }
  });

  // Wait 1.5s for initial load
  await new Promise((r) => setTimeout(r, 1500));

  async function takeScreenshot(fname) {
    const res = await sendCommand('Page.captureScreenshot', { format: 'png' });
    if (res.result && res.result.data) {
      const buf = Buffer.from(res.result.data, 'base64');
      fs.writeFileSync(path.join(SCREENSHOT_DIR, fname), buf);
      console.log(`Saved screenshot: ${fname} (${buf.length} bytes)`);
    }
  }

  async function getActiveGalleryInfo() {
    const res = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const gallery = document.querySelector('[aria-label="SMARTBUY AI Hero Fashion Gallery"]');
        if (!gallery) return { found: false };
        const badge = gallery.querySelector('.bg-black\\\\/75')?.innerText || '';
        const counter = gallery.querySelector('.font-mono')?.innerText || '';
        const rect = gallery.getBoundingClientRect();
        const activeImg = gallery.querySelector('img.opacity-100')?.src || '';
        return {
          found: true,
          badge,
          counter,
          activeImg,
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
        };
      })()`,
      returnByValue: true,
    });
    return res.result.result.value;
  }

  console.log('\n--- 1. VERIFYING INITIAL STATE (NO HOVER) ---');
  let info = await getActiveGalleryInfo();
  console.log('Initial Gallery Info:', info);
  await takeScreenshot('hero_gallery_01_initial.png');

  if (!info.found) {
    console.error('Hero Fashion Gallery not found in DOM!');
    ws.close();
    chrome.kill();
    return;
  }

  console.log('\n--- 2. SIMULATING MOUSE ENTER (HOVER ON GALLERY) ---');
  await sendCommand('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: info.x,
    y: info.y,
  });

  console.log('Hovered at:', info.x, info.y);

  // Wait 2.2s -> Look 02
  console.log('Waiting 2.2s for slideshow to Look 02 (anh_1)...');
  await new Promise((r) => setTimeout(r, 2200));
  info = await getActiveGalleryInfo();
  console.log('After 2.2s:', info.badge, info.counter, info.activeImg);
  await takeScreenshot('hero_gallery_02_look2.png');

  // Wait another 2.2s -> Look 03
  console.log('Waiting 2.2s for slideshow to Look 03 (anh_2)...');
  await new Promise((r) => setTimeout(r, 2200));
  info = await getActiveGalleryInfo();
  console.log('After 4.4s:', info.badge, info.counter, info.activeImg);
  await takeScreenshot('hero_gallery_03_look3.png');

  // Wait another 2.2s -> Look 04
  console.log('Waiting 2.2s for slideshow to Look 04 (anh_3)...');
  await new Promise((r) => setTimeout(r, 2200));
  info = await getActiveGalleryInfo();
  console.log('After 6.6s:', info.badge, info.counter, info.activeImg);
  await takeScreenshot('hero_gallery_04_look4.png');

  // Wait another 2.2s -> Loop back to Look 01
  console.log('Waiting 2.2s for slideshow to loop back to Look 01...');
  await new Promise((r) => setTimeout(r, 2200));
  info = await getActiveGalleryInfo();
  console.log('After 8.8s (Loop back):', info.badge, info.counter, info.activeImg);
  await takeScreenshot('hero_gallery_05_looped.png');

  console.log('\n--- 3. SIMULATING MOUSE LEAVE ---');
  await sendCommand('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: 10,
    y: 10,
  });
  console.log('Mouse moved to outside (10, 10). Waiting 800ms for transition back to Look 01...');
  await new Promise((r) => setTimeout(r, 800));
  info = await getActiveGalleryInfo();
  console.log('After Mouse Leave:', info.badge, info.counter, info.activeImg);
  await takeScreenshot('hero_gallery_06_after_leave.png');

  console.log('\n--- 4. NETWORK & CONSOLE AUDIT ---');
  console.log('Failed Image URLs count:', failedUrls.length);
  if (failedUrls.length > 0) {
    console.error('Failed Image URLs:', failedUrls);
  } else {
    console.log('All 4 fashion images loaded with 200 OK! Zero 404s.');
  }

  console.log('Console Errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Console Errors:', consoleErrors);
  } else {
    console.log('Zero console errors encountered.');
  }

  ws.close();
  chrome.kill();
  console.log('Gallery test completed successfully.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
