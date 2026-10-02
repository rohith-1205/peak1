import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register({ name, email, password, phone, role: 'USER' });
      showToast('Participant account created successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message || 'Registration failed. Try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container flex items-center justify-center section-padding" style={{ minHeight: '75vh' }}>
      <div className="card-mono w-full" style={{ maxWidth: '28rem', padding: '2rem' }}>
        <div className="text-center flex flex-col items-center gap-xs" style={{ marginBottom: '1.5rem' }}>
          <div className="brand-badge" style={{ width: '2.5rem', height: '2.5rem', fontSize: '1rem' }}>
            P1
          </div>
          <h2 className="section-title" style={{ fontSize: '1.375rem', marginTop: '0.5rem' }}>
            CREATE PARTICIPANT ACCOUNT
          </h2>
          <p className="text-muted" style={{ fontSize: '0.75rem' }}>
            Register to participate in official events managed by Peak1
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <div style={{ position: 'relative' }}>
              <User size={14} className="text-dim" style={{ position: 'absolute', left: '0.75rem', top: '0.75rem' }} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className="form-input"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} className="text-dim" style={{ position: 'absolute', left: '0.75rem', top: '0.75rem' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="form-input"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Phone *</label>
            <div style={{ position: 'relative' }}>
              <Phone size={14} className="text-dim" style={{ position: 'absolute', left: '0.75rem', top: '0.75rem' }} />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="form-input"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} className="text-dim" style={{ position: 'absolute', left: '0.75rem', top: '0.75rem' }} />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
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
            {submitting ? 'Creating Account...' : 'Complete Registration'} <ArrowRight size={16} />
          </button>
        </form>

        <div className="text-center text-muted" style={{ paddingTop: '1.25rem', marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem' }}>
          Already registered?{' '}
          <Link to="/login" className="text-white font-bold hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
