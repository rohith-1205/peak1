import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { ShieldAlert } from 'lucide-react';

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container flex flex-col items-center justify-center section-padding">
        <span className="label-eyebrow">Verifying Session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { isAdminAuthenticated, adminLoading } = useAdminAuth();
  const { user } = useAuth();
  const location = useLocation();

  if (adminLoading) {
    return (
      <div className="container flex flex-col items-center justify-center section-padding min-h-screen">
        <span className="label-eyebrow">Checking Admin Console Credentials...</span>
      </div>
    );
  }

  // Not logged in as Admin → redirect to /admin/login?redirect=<path>
  if (!isAdminAuthenticated) {
    const currentPath = encodeURIComponent(location.pathname + location.search);
    
    // If logged in as a normal participant user (without admin rights)
    if (user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return (
        <div className="container flex flex-col items-center justify-center section-padding min-h-screen text-center gap-md">
          <div style={{ color: 'var(--accent-rose)' }}>
            <ShieldAlert size={48} />
          </div>
          <h2 className="section-title">ADMINISTRATOR ACCESS DENIED</h2>
          <p className="text-muted" style={{ maxWidth: '28rem', fontSize: '0.875rem' }}>
            Your account ({user.email}) does not have administrative privileges required to access the Organizer Console.
          </p>
          <div className="flex gap-md pt-2">
            <Link to="/" className="btn btn-secondary btn-sm">Return to Home</Link>
            <Link to={`/admin/login?redirect=${currentPath}`} className="btn btn-primary btn-sm">Admin Login</Link>
          </div>
        </div>
      );
    }

    return <Navigate to={`/admin/login?redirect=${currentPath}`} replace />;
  }

  return <Outlet />;
}
