import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
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
    strictPort: false,
    allowedHosts: true,
    watch: {
      ignored: ['**/ai-server/**', '**/.venv/**', '**/backend/**', '**/target/**', '**/data/**'],
    },
    proxy: {
      // Chuyển tiếp các yêu cầu REST API đến Java Spring Boot Backend (Port 8080)
      '/api/v1': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      // Chuyển tiếp các yêu cầu AI Virtual Try-On đến Python AI Server chạy trên GPU RTX 3060
      '/api/ai': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ai/, ''),
      },
    },
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('three')) {
              return 'vendor-three';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
          }
          // Tách riêng tập dữ liệu mock JSON nặng khỏi app runtime bundle
          if (id.includes('importedProducts') || id.includes('pricingRegistry') || id.includes('duplicateReport')) {
            return 'catalog-data';
          }
        },
      },
    },
  },
})
