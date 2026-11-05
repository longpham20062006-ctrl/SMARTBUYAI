import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import { UserRole } from '@/types';
import { safeSessionStorage } from '@/lib/storage';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  publicOnly?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  allowedRoles,
  publicOnly = false,
}) => {
  useRepoSubscription(['auth']);
  const location = useLocation();
  const currentUser = MockRepo.getCurrentUser();

  // If page is for unauthenticated visitors only (e.g., /login or /register)
  if (publicOnly && currentUser) {
    if (currentUser.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    // CUSTOMER: Kiểm tra nếu có phiên Intro 3D đang chờ chạy
    const isIntroActive = safeSessionStorage.getItem('sb_intro_active') === '1';
    const isIntroSeen = safeSessionStorage.getItem('sb_intro_seen') === '1';
    if (isIntroActive && !isIntroSeen) {
      return <Navigate to="/intro" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // If user is not logged in and page is protected
  if (!currentUser && !publicOnly) {
    safeSessionStorage.setItem('sb_login_notice', 'Đăng nhập để khám phá cửa hàng và trải nghiệm mua sắm cùng SMARTBUY AI nhé!');
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
  }

  // If role-based access is restricted
  if (currentUser && allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Customer attempting to enter Admin area
    if (currentUser.role === 'customer' && allowedRoles.includes('admin')) {
      return <Navigate to="/403" replace />;
    }
    // Admin attempting to enter Customer-only area
    if (currentUser.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
