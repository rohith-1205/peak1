import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.success) {
        setSubmitted(true);
        showToast('Password reset link sent to your email!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to request password reset.', 'error');
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
            FORGOT PASSWORD
          </h2>
          <p className="text-muted" style={{ fontSize: '0.75rem' }}>
            Enter your email to receive a secure password reset link
          </p>
        </div>

        {submitted ? (
          <div className="text-center flex flex-col items-center gap-md py-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-white font-bold text-base mb-1">Check Your Email</h3>
              <p className="text-slate-300 text-xs">
                We sent a password reset link to <strong className="text-cyan-400">{email}</strong>.
              </p>
            </div>
            <Link to="/login" className="btn btn-secondary w-full flex items-center justify-center gap-2 mt-2">
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            <div className="form-group">
              <label className="form-label">Account Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} className="text-dim" style={{ position: 'absolute', left: '0.75rem', top: '0.75rem' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
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
              {submitting ? 'Sending Request...' : 'Send Reset Link'} <ArrowRight size={16} />
            </button>
          </form>
        )}

        <div className="text-center text-muted" style={{ paddingTop: '1.25rem', marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem' }}>
          Remembered your password?{' '}
          <Link to="/login" className="text-white font-bold hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
