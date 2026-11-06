import React, { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { PageLoader } from '@/components/common/PageLoader';

// Lazy load all pages for optimal code splitting & lightning fast initial load (<500KB)
const HomePage = lazy(() => import('@/features/home/pages/HomePage').then((m) => ({ default: m.HomePage })));
const CatalogPage = lazy(() => import('@/features/catalog/pages/CatalogPage').then((m) => ({ default: m.CatalogPage })));
const ProductDetailPage = lazy(() => import('@/features/catalog/pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const CollectionsPage = lazy(() => import('@/features/collections/pages/CollectionsPage').then((m) => ({ default: m.CollectionsPage })));
const CollectionDetailPage = lazy(() => import('@/features/collections/pages/CollectionDetailPage').then((m) => ({ default: m.CollectionDetailPage })));
const CartPage = lazy(() => import('@/features/cart/pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('@/features/checkout/pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const OrdersPage = lazy(() => import('@/features/orders/pages/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() => import('@/features/orders/pages/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage })));
const ComparePage = lazy(() => import('@/features/compare/pages/ComparePage').then((m) => ({ default: m.ComparePage })));
const AIStylistPage = lazy(() => import('@/features/ai-stylist/pages/AIStylistPage').then((m) => ({ default: m.AIStylistPage })));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const IntroPage = lazy(() => import('@/features/intro/pages/IntroPage').then((m) => ({ default: m.IntroPage })));
const AccountPage = lazy(() => import('@/features/account/pages/AccountPage').then((m) => ({ default: m.AccountPage })));
const AboutPage = lazy(() => import('@/features/info/pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const SizeGuidePage = lazy(() => import('@/features/info/pages/SizeGuidePage').then((m) => ({ default: m.SizeGuidePage })));
const FavoritesPage = lazy(() => import('@/features/catalog/pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
const VirtualTryOnPage = lazy(() => import('@/features/virtual-try-on/pages/VirtualTryOnPage').then((m) => ({ default: m.VirtualTryOnPage })));
const ForbiddenPage = lazy(() => import('@/features/info/pages/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage })));
const NotFoundPage = lazy(() => import('@/features/info/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

// Admin Pages (Lazy chunked into admin bundle)
const DashboardPage = lazy(() => import('@/features/admin/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const AdminProductsPage = lazy(() => import('@/features/admin/products/pages/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage })));
const AdminProductFormPage = lazy(() => import('@/features/admin/products/pages/AdminProductFormPage').then((m) => ({ default: m.AdminProductFormPage })));
const AdminCategoriesPage = lazy(() => import('@/features/admin/categories/pages/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage })));
const AdminBrandsPage = lazy(() => import('@/features/admin/brands/pages/AdminBrandsPage').then((m) => ({ default: m.AdminBrandsPage })));
const AdminInventoryPage = lazy(() => import('@/features/admin/inventory/pages/AdminInventoryPage').then((m) => ({ default: m.AdminInventoryPage })));
const AdminOrdersPage = lazy(() => import('@/features/admin/orders/pages/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage })));
const AdminOrderDetailPage = lazy(() => import('@/features/admin/orders/pages/AdminOrderDetailPage').then((m) => ({ default: m.AdminOrderDetailPage })));
const AdminUsersPage = lazy(() => import('@/features/admin/users/pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })));
const AdminPricingPage = lazy(() => import('@/features/admin/pricing/pages/AdminPricingPage').then((m) => ({ default: m.AdminPricingPage })));

const load = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  // 1. Phân hệ Xác thực độc lập (AuthLayout)
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: (
          <AuthGuard publicOnly>
            {load(LoginPage)}
          </AuthGuard>
        ),
      },
      {
        path: '/register',
        element: (
          <AuthGuard publicOnly>
            {load(RegisterPage)}
          </AuthGuard>
        ),
      },
    ],
  },

  // 2. Màn hình Intro 3D vũ trụ dành riêng cho CUSTOMER ngay sau khi đăng nhập mới
  {
    path: '/intro',
    element: (
      <AuthGuard allowedRoles={['customer']}>
        {load(IntroPage)}
      </AuthGuard>
    ),
  },

  // 3. Phân hệ Cửa hàng & Khách hàng (Customer Store Layout)
  {
    path: '/',
    element: <StoreLayout />,
    children: [
      // Trang chủ công khai: BẤT KỲ AI CŨNG CÓ THỂ XEM
      { index: true, element: load(HomePage) },

      // Phân hệ Shopping Area dành riêng cho Customer đã đăng nhập:
      // Khách chưa đăng nhập truy cập sẽ được chuyển hướng sang /login kèm thông báo thân thiện
      { path: 'products', element: <AuthGuard allowedRoles={['customer']}>{load(CatalogPage)}</AuthGuard> },
      { path: 'shop', element: <AuthGuard allowedRoles={['customer']}>{load(CatalogPage)}</AuthGuard> },
      { path: 'products/:slug', element: <AuthGuard allowedRoles={['customer']}>{load(ProductDetailPage)}</AuthGuard> },
      { path: 'collections', element: <AuthGuard allowedRoles={['customer']}>{load(CollectionsPage)}</AuthGuard> },
      { path: 'collections/:slug', element: <AuthGuard allowedRoles={['customer']}>{load(CollectionDetailPage)}</AuthGuard> },
      { path: 'cart', element: <AuthGuard allowedRoles={['customer']}>{load(CartPage)}</AuthGuard> },
      { path: 'checkout', element: <AuthGuard allowedRoles={['customer']}>{load(CheckoutPage)}</AuthGuard> },
      { path: 'wishlist', element: <AuthGuard allowedRoles={['customer']}>{load(FavoritesPage)}</AuthGuard> },
      { path: 'favorites', element: <AuthGuard allowedRoles={['customer']}>{load(FavoritesPage)}</AuthGuard> },
      { path: 'orders', element: <AuthGuard allowedRoles={['customer']}>{load(OrdersPage)}</AuthGuard> },
      { path: 'orders/:id', element: <AuthGuard allowedRoles={['customer']}>{load(OrderDetailPage)}</AuthGuard> },
      { path: 'compare', element: <AuthGuard allowedRoles={['customer']}>{load(ComparePage)}</AuthGuard> },
      { path: 'ai-stylist', element: <AuthGuard allowedRoles={['customer']}>{load(AIStylistPage)}</AuthGuard> },
      { path: 'try-on', element: <AuthGuard allowedRoles={['customer']}>{load(VirtualTryOnPage)}</AuthGuard> },
      { path: 'ai-tryon', element: <AuthGuard allowedRoles={['customer']}>{load(VirtualTryOnPage)}</AuthGuard> },
      { path: 'virtual-try-on', element: <AuthGuard allowedRoles={['customer']}>{load(VirtualTryOnPage)}</AuthGuard> },
      { path: 'account', element: <AuthGuard allowedRoles={['customer']}>{load(AccountPage)}</AuthGuard> },
      { path: 'profile', element: <AuthGuard allowedRoles={['customer']}>{load(AccountPage)}</AuthGuard> },

      // Các trang thông tin hỗ trợ
      { path: 'about', element: load(AboutPage) },
      { path: 'size-guide', element: load(SizeGuidePage) },
      { path: '403', element: load(ForbiddenPage) },
      { path: '*', element: load(NotFoundPage) },
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
      { index: true, element: load(DashboardPage) },
      { path: 'dashboard', element: load(DashboardPage) },
      { path: 'products', element: load(AdminProductsPage) },
      { path: 'products/new', element: load(AdminProductFormPage) },
      { path: 'products/:id/edit', element: load(AdminProductFormPage) },
      { path: 'categories', element: load(AdminCategoriesPage) },
      { path: 'brands', element: load(AdminBrandsPage) },
      { path: 'inventory', element: load(AdminInventoryPage) },
      { path: 'orders', element: load(AdminOrdersPage) },
      { path: 'orders/:id', element: load(AdminOrderDetailPage) },
      { path: 'users', element: load(AdminUsersPage) },
      { path: 'customers', element: load(AdminUsersPage) },
      { path: 'pricing', element: load(AdminPricingPage) },
    ],
  },
]);
