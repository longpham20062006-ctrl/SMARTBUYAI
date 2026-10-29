import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import { UserRole } from '@/types';

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
      return <Navigate to="/admin" replace />;
    }
    const searchParams = new URLSearchParams(location.search);
    const redirectUrl = searchParams.get('redirect');
    return <Navigate to={redirectUrl ? decodeURIComponent(redirectUrl) : '/'} replace />;
  }

  // If user is not logged in and page is protected
  if (!currentUser && !publicOnly) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
  }

  // If role-based access is restricted
  if (currentUser && allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Customer attempting to enter Admin area
    if (currentUser.role === 'customer' && allowedRoles.includes('admin')) {
      return <Navigate to="/403" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
