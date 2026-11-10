import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { roleHome, useAuth } from '../../context/auth';
import { UserRole } from '../../types';
import { LoadingState } from './QueryState';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, status } = useAuth();
  const location = useLocation();

  // A stored session is still being restored: don't bounce the user to /login yet.
  if (status === 'loading') {
    return <LoadingState label="Restoring your session…" className="min-h-[60vh]" />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Signed in with a different role: send them to their own dashboard.
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return <>{children}</>;
};
