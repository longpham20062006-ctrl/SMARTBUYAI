import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), '')
  const smartfitTarget = environment.SMARTFIT_BACKEND_URL || 'http://127.0.0.1:7860'
  const smartfitKey = environment.SMARTFIT_API_KEY || ''
  return {
    plugins: [react()],
    define: {
      'process.env': {},
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: '0.0.0.0', // Cho phép điện thoại, laptop khác trong mạng LAN truy cập (192.168.1.139)
      port: 5173,
      watch: {
        ignored: ['**/ai-server/**', '**/.venv/**', '**/backend/**', '**/database/**', '**/target/**', '**/data/**'],
      },
      proxy: {
        '/api/smartfit': {
          target: smartfitTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/smartfit/, '/api/v1'),
          configure(proxy) {
            proxy.on('proxyReq', (proxyReq) => {
              if (smartfitKey) proxyReq.setHeader('X-SmartFit-Key', smartfitKey)
            })
          },
        },
        // Chuyển tiếp các yêu cầu API nghiệp vụ đến Backend E-commerce Server
        '/api/v1': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
        },
        // Chuyển tiếp các yêu cầu AI Virtual Try-On đến Python AI Server chạy trên GPU RTX 3060 (Port 8000)
        '/api/ai': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/ai/, ''),
        },
      },
    },
  }
})
