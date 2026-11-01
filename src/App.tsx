import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './app/router';
import { ToastProvider } from './components/ui/toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { PerformanceProvider } from './context/PerformanceContext';
import { apiClient } from './services/apiClient';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export function App() {
  useEffect(() => {
    // Tự động kết nối và đồng bộ catalog từ Java Spring Boot Backend nếu có
    apiClient.syncWithBackend();
  }, []);

  return (
    <ErrorBoundary fallbackTitle="Đang khởi tạo SMARTBUY AI" fallbackMessage="Ứng dụng gặp sự cố khi tải. Bạn vui lòng tải lại trang.">
      <QueryClientProvider client={queryClient}>
        <PerformanceProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </PerformanceProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
