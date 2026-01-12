
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole, UserPermission } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: UserPermission;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, requiredPermission }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Determine if specific restrictions are applied
  const isRestricted = (allowedRoles && allowedRoles.length > 0) || !!requiredPermission;

  if (isRestricted) {
    const hasRole = allowedRoles ? allowedRoles.includes(user.role) : false;
    const hasPermission = requiredPermission ? user.permissions?.includes(requiredPermission) : false;
    
    // Authorization Logic: User must have either the required role OR the required permission
    if (!hasRole && !hasPermission) {
       return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
