const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'D:\\SMARTBUYAI\\scripts\\screenshots';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('=== VERIFYING AUTO HERO SLIDER 5S WITH CHROME CDP ===');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9226',
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
      const res = await fetch('http://127.0.0.1:9226/json/version');
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

  const newTabRes = await fetch('http://127.0.0.1:9226/json/new?http://127.0.0.1:5173/?intro=0', {
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

  async function evalState() {
    const res = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const gallery = document.querySelector('[aria-label="SMARTBUY AI Hero Fashion Gallery"]');
        if (!gallery) return { found: false };
        const badge = gallery.querySelector('.bg-black\\\\/75')?.innerText || '';
        const counter = gallery.querySelector('.font-mono')?.innerText.replace(/\\s+/g, ' ') || '';
        const activeImg = gallery.querySelector('img.opacity-100')?.src || '';
        const title = document.title;
        return {
          found: true,
          badge,
          counter,
          activeImg,
          title
        };
      })()`,
      returnByValue: true,
    });
    return res.result.result.value;
  }

  async function takeScreenshot(fname) {
    const res = await sendCommand('Page.captureScreenshot', { format: 'png' });
    if (res.result && res.result.data) {
      const buf = Buffer.from(res.result.data, 'base64');
      fs.writeFileSync(path.join(SCREENSHOT_DIR, fname), buf);
      console.log(`Saved screenshot: ${fname} (${buf.length} bytes)`);
    }
  }

  // 1. Initial State (t = 1.0s)
  await new Promise((r) => setTimeout(r, 1000));
  let state = await evalState();
  console.log('[t = 1.0s] Initial State (NO HOVER / NO CLICK):', state);
  await takeScreenshot('auto_slider_t1s_look1.png');

  // 2. Wait 5 seconds (t = 6.0s) -> Auto switches to Look 02 (anh_1)
  console.log('Waiting 5.2s for AUTO transition to Look 02 (anh_1)...');
  await new Promise((r) => setTimeout(r, 5200));
  state = await evalState();
  console.log('[t = 6.2s] Auto Transition 1:', state);
  await takeScreenshot('auto_slider_t5s_look2.png');

  // 3. Wait 5 seconds (t = 11.2s) -> Auto switches to Look 03 (anh_2)
  console.log('Waiting 5.0s for AUTO transition to Look 03 (anh_2)...');
  await new Promise((r) => setTimeout(r, 5000));
  state = await evalState();
  console.log('[t = 11.2s] Auto Transition 2:', state);
  await takeScreenshot('auto_slider_t10s_look3.png');

  // 4. Wait 5 seconds (t = 16.2s) -> Auto switches to Look 04 (anh_3)
  console.log('Waiting 5.0s for AUTO transition to Look 04 (anh_3)...');
  await new Promise((r) => setTimeout(r, 5000));
  state = await evalState();
  console.log('[t = 16.2s] Auto Transition 3:', state);
  await takeScreenshot('auto_slider_t15s_look4.png');

  // 5. Wait 5 seconds (t = 21.2s) -> Auto loops back to Look 01 (original)
  console.log('Waiting 5.0s for AUTO loop back to Look 01 (original)...');
  await new Promise((r) => setTimeout(r, 5000));
  state = await evalState();
  console.log('[t = 21.2s] Auto Loop Back to Look 01:', state);
  await takeScreenshot('auto_slider_t20s_look1_loop.png');

  // 6. Wait 5 seconds (t = 26.2s) -> Second cycle continues to Look 02
  console.log('Waiting 5.0s to confirm second cycle continues infinitely...');
  await new Promise((r) => setTimeout(r, 5000));
  state = await evalState();
  console.log('[t = 26.2s] Second Cycle Look 02:', state);
  await takeScreenshot('auto_slider_t25s_look2_cycle2.png');

  // 7. Test Document Title
  console.log('\n--- DOCUMENT TITLE VERIFICATION ---');
  console.log('Document Title:', state.title);
  const expectedTitle = 'SMARTBUY AI | Gen Z Fashion & AI Virtual Try-On';
  if (state.title === expectedTitle) {
    console.log('✓ Document title matches expected title perfectly!');
  } else {
    console.error(`Title mismatch: expected "${expectedTitle}", got "${state.title}"`);
  }

  // 8. Audit Network & Console
  console.log('\n--- NETWORK & CONSOLE AUDIT ---');
  console.log('Failed Image URLs count:', failedUrls.length);
  if (failedUrls.length > 0) {
    console.error('Failed Image URLs:', failedUrls);
  } else {
    console.log('✓ All images loaded with 200 OK! Zero 404s.');
  }

  console.log('Console Errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Console Errors:', consoleErrors);
  } else {
    console.log('✓ Zero console errors.');
  }

  ws.close();
  chrome.kill();
  console.log('Verification finished cleanly.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
