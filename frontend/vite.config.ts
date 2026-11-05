import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0', // Cho phép điện thoại, laptop khác trong mạng LAN truy cập (192.168.1.139)
    port: 5173,
    watch: {
      ignored: ['**/ai-server/**', '**/.venv/**', '**/backend/**', '**/database/**'],
    },
    proxy: {
      // Chuyển tiếp các yêu cầu API nghiệp vụ đến Backend E-commerce Server (Port 5000)
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
})
