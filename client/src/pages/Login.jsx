import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await login({ email, password });
      showToast('Welcome back to Peak1!', 'success');
      navigate('/dashboard');
    } catch (err) {
      if (err.errorCode === 'ADMIN_LOGIN_REQUIRED') {
        showToast('Admin accounts must log in via the Organizer Console (/admin/login)', 'info');
        navigate('/admin/login');
      } else {
        showToast(err.message || 'Login failed. Please check credentials.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container flex items-center justify-center section-padding" style={{ minHeight: '70vh' }}>
      <div className="card-mono w-full" style={{ maxWidth: '28rem', padding: '2rem' }}>
        <div className="text-center flex flex-col items-center gap-xs" style={{ marginBottom: '1.5rem' }}>
          <div className="brand-badge" style={{ width: '2.5rem', height: '2.5rem', fontSize: '1rem' }}>
            P1
          </div>
          <h2 className="section-title" style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>
            SIGN IN TO PEAK1
          </h2>
          <p className="text-muted" style={{ fontSize: '0.75rem' }}>
            Enter your credentials to access your event passes & roster
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} className="text-dim" style={{ position: 'absolute', left: '0.75rem', top: '0.75rem' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@peak1.app"
                className="form-input"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="flex items-center justify-between">
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              <Link to="/forgot-password" className="text-cyan-400 hover:underline" style={{ fontSize: '0.75rem' }}>
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: 'relative', marginTop: '0.25rem' }}>
              <Lock size={14} className="text-dim" style={{ position: 'absolute', left: '0.75rem', top: '0.75rem' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full"
            style={{ marginTop: '0.5rem' }}
          >
            {submitting ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        <div className="text-center text-muted" style={{ paddingTop: '1.25rem', marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem' }}>
          Don't have a Peak1 account?{' '}
          <Link to="/register" className="text-white font-bold hover:underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
}
