import React, { useState, useEffect } from 'react';
import adminApi from '../services/adminApi';
import { useToast } from '../context/ToastContext';
import { Shield, Plus, Trash2, Users } from 'lucide-react';

export default function AdminStaff() {
  const { showToast } = useToast();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CHECKIN_STAFF'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/auth/admin/staff');
      if (res.success && res.data) {
        setStaffList(res.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load staff list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await adminApi.post('/auth/admin/staff', formData);
      showToast('Staff account created successfully!', 'success');
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'CHECKIN_STAFF' });
      fetchStaff();
    } catch (err) {
      showToast(err.message || 'Failed to create staff account', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff account?')) return;
    try {
      await adminApi.delete(`/auth/admin/staff/${id}`);
      showToast('Staff account deleted', 'success');
      fetchStaff();
    } catch (err) {
      showToast(err.message || 'Failed to delete staff account', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-center justify-between gap-md" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <span className="label-eyebrow flex items-center gap-xs">
            <Users size={14} className="text-white" /> ACCESS CONTROL
          </span>
          <h1 className="page-title" style={{ marginTop: '0.25rem' }}>
            STAFF MANAGEMENT
          </h1>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">
          <Plus size={14} /> Add New Staff
        </button>
      </div>

      <div className="card-mono">
        {loading ? (
          <div className="p-xl text-center text-muted">Loading staff accounts...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => (
                  <tr key={staff._id}>
                    <td className="font-bold text-white">{staff.name}</td>
                    <td className="text-muted">{staff.email}</td>
                    <td>
                      <span className={`status-badge ${staff.role === 'SUPER_ADMIN' ? 'bg-emerald-900 text-emerald' : 'bg-slate-800 text-white'}`}>
                        {staff.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-dim">{new Date(staff.createdAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      {staff.role !== 'SUPER_ADMIN' && (
                        <button onClick={() => handleDelete(staff._id)} className="btn btn-ghost btn-sm text-red">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {staffList.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-xl">No staff accounts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title font-heading text-white">Add Staff Member</h2>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body flex flex-col gap-md">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" placeholder="e.g. Gate Scanner 1" />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address (Login ID)</label>
                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" placeholder="e.g. scanner1@peak1.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input required type="password" name="password" value={formData.password} onChange={handleChange} className="form-input" placeholder="Set a secure password" minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label">Access Role</label>
                <select name="role" value={formData.role} onChange={handleChange} className="form-input">
                  <option value="CHECKIN_STAFF">Gate Scanner (Check-in Only)</option>
                  <option value="ADMIN">Administrator (Full Access)</option>
                </select>
              </div>
              <div className="modal-footer" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
