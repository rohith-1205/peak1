/**
 * AdminLoginPage.jsx
 * Dedicated authentication screen for event organizers and race directors.
 * Accessible strictly via /admin/login.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/admin';

  const { adminUser, adminLogin, isAdminAuthenticated } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect if already logged in as admin
  useEffect(() => {
    if (isAdminAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAdminAuthenticated, navigate, redirectPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      await adminLogin({ email: email.trim(), password });
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Invalid admin credentials. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center section-padding"
      style={{
        backgroundColor: 'var(--color-black)',
        backgroundImage: 'radial-gradient(ellipse at top, rgba(255, 61, 0, 0.12), transparent 70%)'
      }}
    >
      <div
        className="card-mono w-full flex flex-col gap-lg"
        style={{
          maxWidth: '26rem',
          padding: '2.5rem 2rem',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Header Branding */}
        <div className="text-center flex flex-col items-center gap-xs">
          <div
            className="brand-badge flex items-center justify-center"
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '12px',
              backgroundColor: 'var(--color-black)',
              border: '2px solid var(--accent-orange)',
              color: 'var(--accent-orange)',
              boxShadow: '0 0 20px rgba(255, 61, 0, 0.3)'
            }}
          >
            <Shield size={28} />
          </div>

          <div style={{ marginTop: '0.5rem' }}>
            <span className="label-eyebrow" style={{ color: 'var(--accent-orange)', letterSpacing: '0.15em' }}>
              PEAK1 ORGANIZER CONSOLE
            </span>
            <h1 className="font-heading font-black text-white" style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>
              ADMIN LOGIN
            </h1>
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div
            className="card-mono flex items-center gap-sm p-3"
            style={{
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              borderColor: 'var(--accent-rose)',
              color: 'var(--accent-rose)',
              fontSize: '0.8125rem'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              ADMIN EMAIL
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} className="text-dim" style={{ position: 'absolute', left: '0.875rem', top: '0.875rem' }} />
              <input
                type="email"
                required
                autoFocus
                placeholder="admin@peak1.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} className="text-dim" style={{ position: 'absolute', left: '0.875rem', top: '0.875rem' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '0.75rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer'
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full"
            style={{ marginTop: '0.5rem', paddingBlock: '0.75rem', fontWeight: 800 }}
          >
            {submitting ? 'Authenticating...' : 'Sign In to Console'}
          </button>
        </form>

        <div className="text-center pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <p className="text-dim" style={{ fontSize: '0.7rem' }}>
            Authorized Personnel Only • IP & Security Telemetry Monitored
          </p>
        </div>
      </div>
    </div>
  );
}
