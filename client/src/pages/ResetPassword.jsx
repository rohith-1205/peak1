import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return showToast('Passwords do not match.', 'error');
    }
    if (password.length < 6) {
      return showToast('Password must be at least 6 characters long.', 'error');
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/reset-password', { token, password });
      if (res.success) {
        setSuccess(true);
        showToast('Password updated successfully! You can now log in.', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to reset password. Link may be invalid or expired.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="container flex items-center justify-center section-padding" style={{ minHeight: '70vh' }}>
        <div className="card-mono text-center" style={{ maxWidth: '28rem', padding: '2rem' }}>
          <h2 className="section-title text-red-400 mb-2">Invalid Reset Link</h2>
          <p className="text-muted text-xs mb-4">No password reset token was provided in the URL link.</p>
          <Link to="/forgot-password" className="btn btn-primary w-full">Request New Reset Link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex items-center justify-center section-padding" style={{ minHeight: '70vh' }}>
      <div className="card-mono w-full" style={{ maxWidth: '28rem', padding: '2rem' }}>
        <div className="text-center flex flex-col items-center gap-xs" style={{ marginBottom: '1.5rem' }}>
          <div className="brand-badge" style={{ width: '2.5rem', height: '2.5rem', padding: 0, overflow: 'hidden', backgroundColor: 'transparent', border: 'none' }}>
            <img src="/peak1logo.jpeg" alt="Peak1" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
          </div>
          <h2 className="section-title" style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>
            SET NEW PASSWORD
          </h2>
          <p className="text-muted" style={{ fontSize: '0.75rem' }}>
            Create a secure new password for your Peak1 account
          </p>
        </div>

        {success ? (
          <div className="text-center flex flex-col items-center gap-md py-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-white font-bold text-base mb-1">Password Changed!</h3>
              <p className="text-slate-300 text-xs">
                Your password has been successfully updated. Please sign in with your new credentials.
              </p>
            </div>
            <button onClick={() => navigate('/login')} className="btn btn-primary w-full mt-2">
              Sign In Now <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} className="text-dim" style={{ position: 'absolute', left: '0.75rem', top: '0.75rem' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="form-input"
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} className="text-dim" style={{ position: 'absolute', left: '0.75rem', top: '0.75rem' }} />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
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
              {submitting ? 'Updating Password...' : 'Update Password'} <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
