const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'D:\\SMARTBUYAI\\scripts\\screenshots';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('=== STARTING CHROME WITH REMOTE DEBUGGING ===');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--enable-webgl',
    '--use-gl=angle',
    '--window-size=1440,900',
    '--no-sandbox',
    'about:blank',
  ]);

  // Wait for Chrome CDP port to open
  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
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

  console.log('Connected to Chrome CDP:', wsUrl);

  // Create a new target/tab
  const newTabRes = await fetch('http://127.0.0.1:9222/json/new?http://127.0.0.1:5173/?debugGalaxy=1', {
    method: 'PUT',
  });
  const tab = await newTabRes.json();
  const tabWs = tab.webSocketDebuggerUrl;
  console.log('Tab opened:', tab.url);

  const ws = new WebSocket(tabWs);
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

  async function evalTelemetry() {
    const res = await sendCommand('Runtime.evaluate', {
      expression: 'JSON.stringify(window.__galaxyTelemetry || {})',
      returnByValue: true,
    });
    try {
      return JSON.parse(res.result.result.value);
    } catch {
      return {};
    }
  }

  async function takeScreenshot(fname) {
    const res = await sendCommand('Page.captureScreenshot', { format: 'png' });
    if (res.result && res.result.data) {
      const buf = Buffer.from(res.result.data, 'base64');
      fs.writeFileSync(path.join(SCREENSHOT_DIR, fname), buf);
      console.log(`Saved screenshot: ${fname} (${buf.length} bytes)`);
    }
  }

  console.log('\n=== MONITORING LIVE GALAXY 3D TIMELINE ===');
  const startTime = Date.now();
  let phaseLogged = new Set();

  for (let sec = 0; sec < 15; sec++) {
    await new Promise((r) => setTimeout(r, 500));
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const tel = await evalTelemetry();

    console.log(
      `[t=${elapsed}s] Phase: ${tel.currentPhase || 'N/A'} | Intro Mounted: ${tel.introMounted} | Frames: ${tel.frameCount} | WebGL: ${tel.webglAvailable} | Size: ${tel.canvasWidth}x${tel.canvasHeight} | Ambient Active: ${tel.ambientActive} (Frames: ${tel.ambientFrameCount})`
    );

    if (tel.currentPhase && !phaseLogged.has(tel.currentPhase)) {
      phaseLogged.add(tel.currentPhase);
      const safeName = tel.currentPhase.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await takeScreenshot(`cdp_phase_${safeName}.png`);
    }

    if (elapsed > 6.0 && tel.currentPhase === 'Completed') {
      console.log('Intro completed! Verifying ambient galaxy in Hero...');
      await takeScreenshot('cdp_final_hero_ambient.png');
      break;
    }
  }

  console.log('\n=== FINAL VERIFICATION SUMMARY ===');
  const finalTel = await evalTelemetry();
  console.log(JSON.stringify(finalTel, null, 2));

  ws.close();
  chrome.kill();
  console.log('Verification finished cleanly.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
