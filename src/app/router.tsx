import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';

// Store Pages
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
  // 1. Cửa hàng khách hàng (Store Layout)
  {
    path: '/',
    element: <StoreLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <CatalogPage /> },
      { path: 'products/:slug', element: <ProductDetailPage /> },
      { path: 'collections', element: <CollectionsPage /> },
      { path: 'collections/:slug', element: <CollectionDetailPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'orders/:id', element: <OrderDetailPage /> },
      { path: 'compare', element: <ComparePage /> },
      { path: 'ai-stylist', element: <AIStylistPage /> },
      { path: 'try-on', element: <VirtualTryOnPage /> },
      { path: 'virtual-try-on', element: <VirtualTryOnPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'account', element: <AccountPage /> },
      { path: 'size-guide', element: <SizeGuidePage /> },
      { path: '403', element: <ForbiddenPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },

  // 2. Phân hệ Quản trị (Admin Layout)
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'products', element: <AdminProductsPage /> },
      { path: 'products/new', element: <AdminProductFormPage /> },
      { path: 'products/:id/edit', element: <AdminProductFormPage /> },
      { path: 'categories', element: <AdminCategoriesPage /> },
      { path: 'brands', element: <AdminBrandsPage /> },
      { path: 'inventory', element: <AdminInventoryPage /> },
      { path: 'orders', element: <AdminOrdersPage /> },
      { path: 'orders/:id', element: <AdminOrderDetailPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'pricing', element: <AdminPricingPage /> },
    ],
  },
]);
