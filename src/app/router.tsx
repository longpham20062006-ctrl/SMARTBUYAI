import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';

// Store & Customer Pages
import { HomePage } from '@/features/home/pages/HomePage';
import { CatalogPage } from '@/features/catalog/pages/CatalogPage';
import { ProductDetailPage } from '@/features/catalog/pages/ProductDetailPage';
import { CollectionsPage } from '@/features/collections/pages/CollectionsPage';
import { CollectionDetailPage } from '@/features/collections/pages/CollectionDetailPage';
import { CartPage } from '@/features/cart/pages/CartPage';
import { CheckoutPage } from '@/features/checkout/pages/CheckoutPage';
import { OrdersPage } from '@/features/orders/pages/OrdersPage';
import { OrderDetailPage } from '@/features/orders/pages/OrderDetailPage';
import { ComparePage } from '@/features/compare/pages/ComparePage';
import { AIStylistPage } from '@/features/ai-stylist/pages/AIStylistPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { AccountPage } from '@/features/account/pages/AccountPage';
import { AboutPage } from '@/features/info/pages/AboutPage';
import { SizeGuidePage } from '@/features/info/pages/SizeGuidePage';
import { VirtualTryOnPage } from '@/features/virtual-try-on/pages/VirtualTryOnPage';
import { ForbiddenPage } from '@/features/info/pages/ForbiddenPage';
import { NotFoundPage } from '@/features/info/pages/NotFoundPage';

// Admin Pages
import { DashboardPage } from '@/features/admin/dashboard/pages/DashboardPage';
import { AdminProductsPage } from '@/features/admin/products/pages/AdminProductsPage';
import { AdminProductFormPage } from '@/features/admin/products/pages/AdminProductFormPage';
import { AdminCategoriesPage } from '@/features/admin/categories/pages/AdminCategoriesPage';
import { AdminBrandsPage } from '@/features/admin/brands/pages/AdminBrandsPage';
import { AdminInventoryPage } from '@/features/admin/inventory/pages/AdminInventoryPage';
import { AdminOrdersPage } from '@/features/admin/orders/pages/AdminOrdersPage';
import { AdminOrderDetailPage } from '@/features/admin/orders/pages/AdminOrderDetailPage';
import { AdminUsersPage } from '@/features/admin/users/pages/AdminUsersPage';
import { AdminPricingPage } from '@/features/admin/pricing/pages/AdminPricingPage';

export const router = createBrowserRouter([
  // 1. Phân hệ Xác thực độc lập (AuthLayout - KHÔNG có shopping header hay sidebar)
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: (
          <AuthGuard publicOnly>
            <LoginPage />
          </AuthGuard>
        ),
      },
      {
        path: '/register',
        element: (
          <AuthGuard publicOnly>
            <RegisterPage />
          </AuthGuard>
        ),
      },
    ],
  },

  // 2. Phân hệ Cửa hàng & Khách hàng (Customer Store Layout)
  {
    path: '/',
    element: <StoreLayout />,
    children: [
      // Trang chủ công khai: BẤT KỲ AI CŨNG CÓ THỂ XEM
      { index: true, element: <HomePage /> },
      { path: 'products', element: <CatalogPage /> },
      { path: 'products/:slug', element: <AuthGuard allowedRoles={['customer', 'admin']}><ProductDetailPage /></AuthGuard> },
      { path: 'collections', element: <CollectionsPage /> },
      { path: 'collections/:slug', element: <CollectionDetailPage /> },
      { path: 'cart', element: <AuthGuard allowedRoles={['customer', 'admin']}><CartPage /></AuthGuard> },
      { path: 'checkout', element: <AuthGuard allowedRoles={['customer', 'admin']}><CheckoutPage /></AuthGuard> },
      { path: 'orders', element: <AuthGuard allowedRoles={['customer', 'admin']}><OrdersPage /></AuthGuard> },
      { path: 'orders/:id', element: <AuthGuard allowedRoles={['customer', 'admin']}><OrderDetailPage /></AuthGuard> },
      { path: 'compare', element: <AuthGuard allowedRoles={['customer', 'admin']}><ComparePage /></AuthGuard> },
      { path: 'ai-stylist', element: <AuthGuard allowedRoles={['customer', 'admin']}><AIStylistPage /></AuthGuard> },
      { path: 'try-on', element: <AuthGuard allowedRoles={['customer', 'admin']}><VirtualTryOnPage /></AuthGuard> },
      { path: 'virtual-try-on', element: <AuthGuard allowedRoles={['customer', 'admin']}><VirtualTryOnPage /></AuthGuard> },
      { path: 'account', element: <AuthGuard allowedRoles={['customer', 'admin']}><AccountPage /></AuthGuard> },

      // Các trang thông tin hỗ trợ
      { path: 'about', element: <AboutPage /> },
      { path: 'size-guide', element: <SizeGuidePage /> },
      { path: '403', element: <ForbiddenPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },

  // 3. Phân hệ Quản trị Toàn diện (Admin Layout - Bắt buộc ROLE_ADMIN)
  {
    path: '/admin',
    element: (
      <AuthGuard allowedRoles={['admin']}>
        <AdminLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'products', element: <AdminProductsPage /> },
      { path: 'products/new', element: <AdminProductFormPage /> },
      { path: 'products/:id/edit', element: <AdminProductFormPage /> },
      { path: 'categories', element: <AdminCategoriesPage /> },
      { path: 'brands', element: <AdminBrandsPage /> },
      { path: 'inventory', element: <AdminInventoryPage /> },
      { path: 'orders', element: <AdminOrdersPage /> },
      { path: 'orders/:id', element: <AdminOrderDetailPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'customers', element: <AdminUsersPage /> },
      { path: 'pricing', element: <AdminPricingPage /> },
    ],
  },
]);
