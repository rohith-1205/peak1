import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../services/adminApi';
import StatusBadge from '../components/StatusBadge';
import { io } from 'socket.io-client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { 
  Calendar, Users, IndianRupee, Plus, CheckSquare, Activity, Shield, Eye, Edit, ExternalLink, BarChart3 
} from 'lucide-react';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await adminApi.get('/admin/stats');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const serverUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api/v1', '');
    const socket = io(serverUrl);
    
    socket.on('checkInUpdated', () => {
      // Re-fetch stats when a check-in event happens globally
      fetchStats();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center section-padding">
        <span className="label-eyebrow">Loading Dashboard Telemetry...</span>
      </div>
    );
  }

  const overview = stats?.overview || {};

  return (
    <div className="flex flex-col gap-lg">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-md" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <span className="label-eyebrow flex items-center gap-xs">
            <Shield size={14} className="text-white" /> ORGANIZER CONSOLE
          </span>
          <h1 className="page-title" style={{ marginTop: '0.25rem' }}>
            ADMIN OVERVIEW & TELEMETRY
          </h1>
        </div>

        <div className="flex items-center gap-sm">
          <Link to="/admin/events/new" className="btn btn-primary btn-sm">
            <Plus size={14} /> Create Event
          </Link>
          <Link to="/admin/events" className="btn btn-secondary btn-sm">
            <Calendar size={14} /> Manage Catalog
          </Link>
          <Link to="/admin/registrations" className="btn btn-secondary btn-sm">
            <Users size={14} /> Roster & QR Gate
          </Link>
          <Link to="/" className="btn btn-ghost btn-sm text-dim" title="View Public Live Site">
            <ExternalLink size={14} /> Live Site
          </Link>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-4 gap-md">
        <Link to="/admin/events" className="card-mono stat-card" style={{ textDecoration: 'none' }}>
          <div>
            <span className="label-eyebrow" style={{ fontSize: '0.65rem' }}>Total Events</span>
            <p className="stat-number">{overview.totalEvents || 0}</p>
            <span className="text-dim block" style={{ fontSize: '0.7rem', marginTop: '0.375rem' }}>
              {overview.publishedEvents || 0} Published • {overview.draftEvents || 0} Drafts
            </span>
          </div>
          <Calendar size={20} className="text-muted" />
        </Link>

        <Link to="/admin/registrations" className="card-mono stat-card" style={{ textDecoration: 'none' }}>
          <div>
            <span className="label-eyebrow" style={{ fontSize: '0.65rem' }}>Registrations</span>
            <p className="stat-number">{overview.totalRegistrations || 0}</p>
            <span className="text-dim block" style={{ fontSize: '0.7rem', marginTop: '0.375rem' }}>
              {overview.confirmedRegistrations || 0} Confirmed • {overview.checkedInRegistrations || 0} Checked-In
            </span>
          </div>
          <Users size={20} className="text-muted" />
        </Link>

        <div className="card-mono stat-card">
          <div>
            <span className="label-eyebrow" style={{ fontSize: '0.65rem' }}>Total Revenue</span>
            <p className="stat-number">₹{overview.totalRevenue?.toLocaleString('en-IN') || 0}</p>
            <span className="text-dim block" style={{ fontSize: '0.7rem', marginTop: '0.375rem' }}>
              Verified Payments
            </span>
          </div>
          <IndianRupee size={20} className="text-muted" />
        </div>

        <Link to="/admin/registrations?status=CHECKED_IN" className="card-mono stat-card" style={{ textDecoration: 'none' }}>
          <div>
            <span className="label-eyebrow" style={{ fontSize: '0.65rem' }}>Check-in Rate</span>
            <p className="stat-number">
              {(overview.confirmedRegistrations || 0) + (overview.checkedInRegistrations || 0) > 0 
                ? Math.round(((overview.checkedInRegistrations || 0) / ((overview.confirmedRegistrations || 0) + (overview.checkedInRegistrations || 0))) * 100) 
                : 0}%
            </p>
            <span className="text-dim block" style={{ fontSize: '0.7rem', marginTop: '0.375rem' }}>
              Gate Conversion
            </span>
          </div>
          <CheckSquare size={20} className="text-muted" />
        </Link>
      </div>

      {/* Visual Analytics Charts */}
      {stats?.eventAnalytics?.length > 0 && (
        <div className="card-mono" style={{ padding: '1.5rem' }}>
          <div className="flex items-center justify-between" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
            <h3 className="font-heading font-bold text-white uppercase flex items-center gap-xs" style={{ fontSize: '1rem' }}>
              <BarChart3 size={16} /> Registration & Gate Performance
            </h3>
          </div>
          
          <div style={{ height: '350px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.eventAnalytics.slice(0, 5)} // Show top 5 recent events
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis 
                  dataKey="eventTitle" 
                  stroke="var(--text-muted)" 
                  tick={{ fill: 'var(--text-dim)', fontSize: 12 }} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="var(--text-muted)" 
                  tick={{ fill: 'var(--text-dim)', fontSize: 12 }} 
                  tickLine={false} 
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                  contentStyle={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                <Bar dataKey="totalRegistrations" name="Total Registrations" fill="#475569" radius={[4, 4, 0, 0]} />
                <Bar dataKey="confirmedRegistrations" name="Pending Arrival" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="checkedInRegistrations" name="Checked In (Gate)" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Event Analytics */}
      <div className="card-mono" style={{ padding: '1.5rem' }}>
        <div className="flex items-center justify-between" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
          <h3 className="font-heading font-bold text-white uppercase flex items-center gap-xs" style={{ fontSize: '1rem' }}>
            <Activity size={16} /> Event Analytics Dashboard
          </h3>
        </div>

        {stats?.eventAnalytics?.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Date</th>
                  <th>Total Registrations</th>
                  <th>Confirmed</th>
                  <th>Checked In</th>
                  <th>Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                {stats.eventAnalytics.map((evt) => {
                  const expected = (evt.confirmedRegistrations || 0) + (evt.checkedInRegistrations || 0);
                  const rate = expected > 0 ? Math.round(((evt.checkedInRegistrations || 0) / expected) * 100) : 0;
                  return (
                    <tr key={evt.eventId}>
                      <td className="font-bold text-white">{evt.eventTitle}</td>
                      <td className="text-muted">{new Date(evt.eventDate).toLocaleDateString()}</td>
                      <td className="font-mono text-white">{evt.totalRegistrations}</td>
                      <td className="font-mono text-emerald">{evt.confirmedRegistrations}</td>
                      <td className="font-mono" style={{ color: 'var(--accent-cyan)' }}>{evt.checkedInRegistrations}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white" style={{ minWidth: '3ch' }}>{rate}%</span>
                          <div className="gate-progress-track" style={{ width: '60px', height: '0.35rem', backgroundColor: 'var(--color-bg-alt)' }}>
                            <div className="gate-progress-fill" style={{ width: `${rate}%` }}></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted text-center" style={{ paddingBlock: '2rem', fontSize: '0.8125rem' }}>
            No event analytics data available.
          </p>
        )}
      </div>

      {/* Recent Registrations Table */}
      <div className="card-mono" style={{ padding: '1.5rem' }}>
        <div className="flex items-center justify-between" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
          <h3 className="font-heading font-bold text-white uppercase flex items-center gap-xs" style={{ fontSize: '1rem' }}>
            <Activity size={16} /> Recent Registrations Stream
          </h3>
          <Link to="/admin/registrations" className="nav-link" style={{ fontSize: '0.75rem' }}>
            View Full Roster →
          </Link>
        </div>

        {stats?.recentRegistrations?.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pass ID</th>
                  <th>Participant</th>
                  <th>Event</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentRegistrations.map((reg) => (
                  <tr key={reg._id}>
                    <td className="font-mono font-bold text-white">{reg.registrationId}</td>
                    <td className="font-bold text-white">{reg.participantDetails?.fullName}</td>
                    <td>
                      {reg.eventId ? (
                        <Link to={`/admin/registrations?eventId=${reg.eventId._id}`} className="text-white hover:underline block truncate" style={{ maxWidth: '12rem', fontSize: '0.8125rem' }}>
                          {reg.eventId.title}
                        </Link>
                      ) : 'N/A'}
                    </td>
                    <td className="text-muted">{reg.participantDetails?.email}</td>
                    <td><StatusBadge status={reg.status} /></td>
                    <td className="text-dim">{new Date(reg.createdAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/admin/registrations?search=${reg.registrationId}`} className="btn btn-ghost btn-sm text-dim">
                        <Eye size={14} /> Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted text-center" style={{ paddingBlock: '2rem', fontSize: '0.8125rem' }}>
            No registration activity recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}
