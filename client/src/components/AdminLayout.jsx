import React, { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { 
  Shield, Activity, Calendar, Plus, Users, ExternalLink, LogOut 
} from 'lucide-react';
import './AdminLayout.css';

export default function AdminLayout() {
  const { adminUser, adminLogout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Enforce noindex robots meta tag on all admin console pages
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    let created = false;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
      created = true;
    }
    meta.content = 'noindex, nofollow';

    return () => {
      if (created && meta.parentNode) {
        meta.parentNode.removeChild(meta);
      }
    };
  }, []);

  const handleAdminLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    if (adminUser?.role === 'CHECKIN_STAFF' && (location.pathname === '/admin' || location.pathname === '/admin/')) {
      navigate('/admin/gate', { replace: true });
    }
  }, [adminUser, location.pathname, navigate]);

  return (
    <div className="admin-app-wrapper">
      {/* Standalone Admin Header Bar */}
      <header className="admin-header">
        <div className="admin-header-left">
          <Link to="/admin" className="brand-logo">
            <div className="brand-badge" style={{ backgroundColor: 'var(--text-white)', color: 'var(--color-black)' }}>
              P1
            </div>
            <span className="admin-header-title">
              PEAK<span className="brand-accent">1</span> CONSOLE
            </span>
          </Link>
          <span className="admin-badge-tag">ORGANIZER DASHBOARD</span>
        </div>

        <div className="admin-header-right">
          <Link to="/" className="btn btn-secondary btn-sm" title="View Public Website">
            <ExternalLink size={14} /> Live Site
          </Link>
          
          <div className="flex items-center gap-xs font-mono text-muted" style={{ fontSize: '0.75rem' }}>
            <Shield size={14} className="text-white shrink-0" />
            <span className="text-white font-bold admin-user-name">{adminUser?.name || 'Admin'}</span>
          </div>

          <button onClick={handleAdminLogout} className="btn btn-ghost btn-sm text-dim" title="Log Out of Admin Console">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Admin Body Workspace */}
      <div className="admin-body">
        {/* Dedicated Admin Sidebar */}
        <nav className="admin-sidebar-nav">
          {adminUser?.role !== 'CHECKIN_STAFF' && (
            <>
              <Link
                to="/admin"
                className={`admin-nav-item ${isActive('/admin') && location.pathname === '/admin' ? 'active' : ''}`}
              >
                <Activity size={16} /> Overview
              </Link>

              <Link
                to="/admin/events"
                className={`admin-nav-item ${isActive('/admin/events') && location.pathname !== '/admin/events/new' ? 'active' : ''}`}
              >
                <Calendar size={16} /> Manage Events
              </Link>

              <Link
                to="/admin/events/new"
                className={`admin-nav-item ${isActive('/admin/events/new') ? 'active' : ''}`}
              >
                <Plus size={16} /> Create Event
              </Link>

              <Link
                to="/admin/registrations"
                className={`admin-nav-item ${isActive('/admin/registrations') ? 'active' : ''}`}
              >
                <Users size={16} /> Roster & Registrations
              </Link>
            </>
          )}

          <Link
            to="/admin/gate"
            className={`admin-nav-item ${isActive('/admin/gate') ? 'active' : ''}`}
          >
            <Shield size={16} /> Gate Check-in
          </Link>

          {adminUser?.role !== 'CHECKIN_STAFF' && (
            <Link
              to="/admin/staff"
              className={`admin-nav-item ${isActive('/admin/staff') ? 'active' : ''}`}
            >
              <Users size={16} /> Staff Settings
            </Link>
          )}
        </nav>

        {/* Main Viewport Content */}
        <main className="admin-main-viewport">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
