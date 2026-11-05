import { app } from './app.js';
import { config } from './config/index.js';

app.listen(config.port, '0.0.0.0', () => {
  console.log(`[Backend] SMARTBUY AI Server is running on http://127.0.0.1:${config.port}`);
  console.log(`[Backend] API Endpoint: http://127.0.0.1:${config.port}/api/v1/health`);
});

