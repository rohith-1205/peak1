import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Menu, X, Shield } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="site-header">
      <div className="container header-inner">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo">
          <div className="brand-badge">P1</div>
          <span className="brand-name">
            PEAK<span className="brand-accent">1</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/events" className={`nav-link ${isActive('/events') ? 'active' : ''}`}>
            Events
          </Link>
          <Link to="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`}>
            About
          </Link>
        </nav>

        {/* Action Controls */}
        <div className="nav-actions">
          {user ? (
            <div className="flex items-center gap-sm">
              <Link to="/dashboard" className="btn btn-secondary btn-sm">
                <User size={14} /> My Passes
              </Link>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm" title="Log Out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-sm">
              <Link to="/login" className="btn btn-ghost btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-toggle"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="mobile-link">
            Home
          </Link>
          <Link to="/events" onClick={() => setMobileMenuOpen(false)} className="mobile-link">
            Events
          </Link>
          <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="mobile-link">
            About
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="mobile-link">
                My Passes
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="mobile-link text-left text-dim"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Log Out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-sm pt-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary w-full">
                Log In
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary w-full">
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
