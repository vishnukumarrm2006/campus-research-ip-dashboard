import React from 'react';
import { useAuth } from '../context/AuthContext';
import Unauthorized from '../pages/Unauthorized';
import Login from '../pages/Login';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying authentication state...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role_name)) {
    return <Unauthorized requiredRoles={allowedRoles} userRole={user?.role_name} />;
  }

  return children;
}
