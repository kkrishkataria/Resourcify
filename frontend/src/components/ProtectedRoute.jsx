import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Route protection wrapper.
 * Requires user to be authenticated, otherwise redirects to /login with back-navigation state.
 * If requiredRole is specified, ensures the user role matches, otherwise redirects to dashboard.
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs font-semibold text-slate-400">
        Authenticating TIET campus session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          message: 'Please sign in with your Thapar roll number or email to view reservations or book venues.',
        }}
        replace
      />
    );
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
