/**
 * ProfilePage.jsx
 * Participant profile management page for viewing and editing reusable personal details.
 */

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Phone, MapPin, Heart, Shield, Save, CheckCircle2, UserCheck } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'Prefer not to say',
    city: '',
    state: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodGroup: 'O+',
    tShirtSize: 'M'
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/me/profile');
        if (res.success && res.data?.user) {
          const u = res.data.user;
          const prof = u.profile || {};
          let formattedDob = '';
          if (prof.dob) {
            formattedDob = new Date(prof.dob).toISOString().split('T')[0];
          }

          setFormData({
            name: u.name || '',
            email: u.email || '',
            phone: u.phone || '',
            dob: formattedDob,
            gender: prof.gender || 'Prefer not to say',
            city: prof.city || '',
            state: prof.state || '',
            emergencyContactName: prof.emergencyContactName || '',
            emergencyContactPhone: prof.emergencyContactPhone || '',
            bloodGroup: prof.bloodGroup || 'O+',
            tShirtSize: prof.tShirtSize || 'M'
          });
          setCompletionPercentage(u.completionPercentage || 0);
        }
      } catch (err) {
        showToast(err.message || 'Failed to load user profile', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.put('/users/me/profile', formData);
      if (res.success && res.data?.user) {
        setCompletionPercentage(res.data.user.completionPercentage || 100);
        showToast('Profile updated successfully!', 'success');
      }
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        showToast(`Validation Error: ${err.errors.join(' | ')}`, 'error');
      } else {
        showToast(err.message || 'Failed to update profile', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container flex flex-col items-center justify-center section-padding">
        <span className="label-eyebrow">Loading User Profile...</span>
      </div>
    );
  }

  return (
    <div className="container page-wrapper" style={{ paddingTop: '2.5rem', maxWidth: '44rem' }}>
      {/* Header Profile Banner */}
      <div className="card-mono p-6 flex flex-col gap-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-md">
          <div className="flex items-center gap-md">
            <div className="brand-badge" style={{ width: '4rem', height: '4rem', fontSize: '1.75rem', borderRadius: '16px' }}>
              {formData.name?.[0] || 'P'}
            </div>
            <div>
              <span className="label-eyebrow" style={{ color: 'var(--accent-orange)' }}>PARTICIPANT PROFILE</span>
              <h1 className="section-title" style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>{formData.name}</h1>
              <p className="text-muted" style={{ fontSize: '0.75rem' }}>{formData.email}</p>
            </div>
          </div>

          {/* Completion Progress Bar */}
          <div className="flex flex-col items-end gap-xs w-full sm:w-auto">
            <div className="flex items-center gap-xs">
              <UserCheck size={16} className="text-emerald-400" />
              <span className="font-heading font-black text-white" style={{ fontSize: '1.25rem' }}>
                {completionPercentage}%
              </span>
              <span className="text-dim" style={{ fontSize: '0.7rem' }}>COMPLETE</span>
            </div>
            <div style={{ width: '10rem', height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${completionPercentage}%`,
                  height: '100%',
                  backgroundColor: completionPercentage >= 80 ? 'var(--accent-emerald)' : 'var(--accent-orange)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-lg" style={{ marginTop: '1.5rem' }}>
        {/* Account Essentials Card */}
        <div className="card-mono p-6 flex flex-col gap-md">
          <h3 className="font-heading font-bold text-white uppercase flex items-center gap-xs" style={{ fontSize: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <User size={18} /> Account Essentials (Pre-filled on Registrations)
          </h3>

          <div className="grid grid-2 gap-md">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Read-only)</label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="form-input opacity-60 cursor-not-allowed"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Phone Number *</label>
              <input
                type="text"
                required
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Location & Personal Info Card */}
        <div className="card-mono p-6 flex flex-col gap-md">
          <h3 className="font-heading font-bold text-white uppercase flex items-center gap-xs" style={{ fontSize: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <MapPin size={18} /> Location & Demographics
          </h3>

          <div className="grid grid-3 gap-md">
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="form-select"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                placeholder="e.g. Coimbatore"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                placeholder="e.g. Tamil Nadu"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Emergency & Safety Metadata Card */}
        <div className="card-mono p-6 flex flex-col gap-md">
          <h3 className="font-heading font-bold text-white uppercase flex items-center gap-xs" style={{ fontSize: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <Heart size={18} /> Safety & Race Metadata
          </h3>

          <div className="grid grid-2 gap-md">
            <div className="form-group">
              <label className="form-label">Emergency Contact Name</label>
              <input
                type="text"
                placeholder="Next of Kin / Parent / Contact Name"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Emergency Contact Mobile Phone</label>
              <input
                type="text"
                placeholder="Emergency Contact Phone"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="form-select"
              >
                <option value="A+">A+ve</option>
                <option value="A-">A-ve</option>
                <option value="B+">B+ve</option>
                <option value="B-">B-ve</option>
                <option value="AB+">AB+ve</option>
                <option value="AB-">AB-ve</option>
                <option value="O+">O+ve</option>
                <option value="O-">O-ve</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">T-Shirt Size</label>
              <select
                value={formData.tShirtSize}
                onChange={(e) => setFormData({ ...formData, tShirtSize: e.target.value })}
                className="form-select"
              >
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ paddingInline: '2rem' }}
          >
            <Save size={16} /> {submitting ? 'Saving Profile...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
