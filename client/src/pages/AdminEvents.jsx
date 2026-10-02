import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../services/adminApi';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import { Plus, Search, Eye, Edit, Trash2, Users, AlertTriangle, X } from 'lucide-react';

export default function AdminEvents() {
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);
      params.append('limit', '50');

      const res = await adminApi.get(`/events?${params.toString()}`);
      if (res.success && res.data?.events) {
        setEvents(res.data.events);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch admin events', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [statusFilter]);

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      const res = await adminApi.patch(`/events/${eventId}/status`, { status: newStatus });
      if (res.success) {
        showToast(`Event status updated to ${newStatus}`, 'success');
        fetchEvents();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const confirmDeleteEvent = (evt) => {
    setEventToDelete(evt);
    setDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!eventToDelete) return;
    setDeleting(true);
    try {
      const res = await adminApi.delete(`/events/${eventToDelete._id}`);
      if (res.success) {
        showToast(`Event "${eventToDelete.title}" archived/deleted successfully`, 'success');
        setDeleteModalOpen(false);
        setEventToDelete(null);
        fetchEvents();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete event', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-md" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <span className="label-eyebrow">MANAGEMENT</span>
          <h1 className="page-title" style={{ marginTop: '0.25rem' }}>
            EVENT CATALOG & PUBLISHING
          </h1>
        </div>

        <Link to="/admin/events/new" className="btn btn-primary btn-sm">
          <Plus size={14} /> Create New Event
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card-mono p-4 flex flex-col sm:flex-row gap-md">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} className="text-dim" style={{ position: 'absolute', left: '0.75rem', top: '0.75rem' }} />
          <input
            type="text"
            placeholder="Search by title, venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchEvents()}
            className="form-input"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-select"
          style={{ width: 'auto', minWidth: '12rem' }}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="REGISTRATION_CLOSED">REGISTRATION CLOSED</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Events Data Table */}
      <div className="card-mono" style={{ padding: '1rem' }}>
        {loading ? (
          <div className="text-center text-muted" style={{ padding: '2rem' }}>Loading event catalog...</div>
        ) : events.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title & Category</th>
                  <th>Date & Time</th>
                  <th>City / Venue</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Status Toggle</th>
                  <th style={{ textAlign: 'right' }}>Actions & Interlinks</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => (
                  <tr key={evt._id}>
                    <td>
                      <span className="font-bold text-white block" style={{ fontSize: '0.875rem' }}>{evt.title}</span>
                      <span className="label-eyebrow" style={{ fontSize: '0.65rem' }}>{evt.category}</span>
                    </td>
                    <td>
                      <span className="text-white block" style={{ fontSize: '0.8125rem' }}>{new Date(evt.eventDate).toLocaleDateString()}</span>
                      <span className="text-dim" style={{ fontSize: '0.7rem' }}>{evt.startTime} - {evt.endTime}</span>
                    </td>
                    <td>
                      <span className="text-white block">{evt.city}</span>
                      <span className="text-dim truncate block" style={{ fontSize: '0.7rem', maxWidth: '9rem' }}>{evt.venue}</span>
                    </td>
                    <td className="font-bold text-white">
                      {evt.isPaid ? `₹${evt.price?.toLocaleString('en-IN')}` : 'FREE'}
                    </td>
                    <td><StatusBadge status={evt.status} /></td>
                    <td>
                      <select
                        value={evt.status}
                        onChange={(e) => handleStatusChange(evt._id, e.target.value)}
                        className="form-select"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="PUBLISHED">PUBLISHED</option>
                        <option value="REGISTRATION_CLOSED">REGISTRATION CLOSED</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-xs">
                        <Link
                          to={`/admin/registrations?eventId=${evt._id}`}
                          className="btn btn-ghost btn-sm text-dim"
                          title="View Participant Roster for Event"
                        >
                          <Users size={14} />
                        </Link>
                        <Link
                          to={`/events/${evt.slug}`}
                          className="btn btn-ghost btn-sm text-dim"
                          title="View Public Event Page"
                        >
                          <Eye size={14} />
                        </Link>
                        <Link
                          to={`/admin/events/edit/${evt._id}`}
                          className="btn btn-secondary btn-sm"
                          title="Edit Event Details"
                        >
                          <Edit size={14} /> Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => confirmDeleteEvent(evt)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--accent-rose)' }}
                          title="Delete / Archive Event"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-muted" style={{ padding: '3rem' }}>
            No events found in catalog.
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && eventToDelete && (
        <div className="modal-overlay">
          <div className="modal-content flex flex-col gap-md">
            <button
              onClick={() => setDeleteModalOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-xs" style={{ color: 'var(--accent-rose)' }}>
              <AlertTriangle size={20} />
              <span className="label-eyebrow" style={{ color: 'var(--accent-rose)' }}>CONFIRM ACTION</span>
            </div>

            <h3 className="section-title">DELETE / ARCHIVE EVENT?</h3>
            <p className="text-muted" style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
              Are you sure you want to delete or archive <strong className="text-white">"{eventToDelete.title}"</strong>?
              This will update its status to ARCHIVED and remove it from public event listings.
            </p>

            <div className="flex justify-end gap-sm" style={{ marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleExecuteDelete}
                className="btn btn-primary btn-sm"
                style={{ backgroundColor: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
