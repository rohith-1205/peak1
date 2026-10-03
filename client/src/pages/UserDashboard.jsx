import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { Ticket, Calendar, MapPin, QrCode, Printer, Mail, Phone, UserCheck, X, Trophy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function UserDashboard() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPass, setSelectedPass] = useState(null);
  const [showProfileBanner, setShowProfileBanner] = useState(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const res = await api.get('/registrations/my');
        if (res.success && res.data?.registrations) {
          setRegistrations(res.data.registrations);
        }
      } catch (err) {
        console.error('Failed to load user registrations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrations();
  }, []);

  // Compute profile completion percentage
  const profile = user?.profile || {};
  const profileFields = [user?.name, user?.email, user?.phone, profile.dob, profile.gender, profile.city, profile.emergencyContactName, profile.bloodGroup, profile.tShirtSize];
  const filledCount = profileFields.filter(Boolean).length;
  const completionPercentage = Math.round((filledCount / profileFields.length) * 100);

  return (
    <div className="container page-wrapper" style={{ paddingTop: '2.5rem' }}>
      {/* Complete Your Profile Banner */}
      {showProfileBanner && completionPercentage < 100 && (
        <div
          className="card-mono"
          style={{
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, rgba(8, 51, 68, 0.7), rgba(15, 23, 42, 0.95), rgba(6, 78, 59, 0.7))',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div className="flex items-center gap-md" style={{ flex: '1 1 280px' }}>
            {/* Progress Ring */}
            <div style={{ position: 'relative', width: '48px', height: '48px', minWidth: '48px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="transparent" />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="var(--accent-cyan)"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={125.6}
                  strokeDashoffset={125.6 - (125.6 * completionPercentage) / 100}
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <span style={{ position: 'absolute', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF' }}>
                {completionPercentage}%
              </span>
            </div>

            <div>
              <h4 className="font-heading font-bold text-white" style={{ fontSize: '0.95rem', margin: 0 }}>
                Complete Your Participant Profile
              </h4>
              <p className="text-muted" style={{ fontSize: '0.75rem', margin: '0.2rem 0 0 0', lineHeight: '1.4' }}>
                Save your emergency contact, DOB & details once to fast-track all future event registrations.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-xs" style={{ shrink: 0 }}>
            <Link
              to="/profile"
              className="btn btn-primary btn-sm"
              style={{ paddingInline: '1.25rem', whiteSpace: 'nowrap' }}
            >
              <UserCheck size={14} /> Complete Profile
            </Link>
            <button
              type="button"
              onClick={() => setShowProfileBanner(false)}
              className="btn btn-ghost btn-sm text-muted"
              style={{ paddingInline: '0.75rem', whiteSpace: 'nowrap', border: '1px solid var(--border-subtle)' }}
              title="Dismiss banner"
            >
              <X size={14} /> Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header Profile Section */}
      <div className="card-mono" style={{ padding: '1.25rem 1.5rem' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md">
          <div className="flex items-start sm:items-center gap-md flex-wrap w-full sm:w-auto">
            <div className="brand-badge shrink-0" style={{ width: '3rem', height: '3rem', fontSize: '1.25rem', minWidth: '3rem', minHeight: '3rem' }}>
              {user?.name?.[0]}
            </div>
            <div className="flex flex-col gap-xs flex-1" style={{ minWidth: 0 }}>
              <div className="flex items-center gap-xs flex-wrap">
                <h1 className="section-title truncate" style={{ fontSize: '1.25rem' }}>{user?.name}</h1>
                <Link to="/profile" className="btn btn-secondary btn-xs flex items-center gap-xs" style={{ fontSize: '0.6875rem', padding: '0.2rem 0.5rem', whiteSpace: 'nowrap' }}>
                  <UserCheck size={12} /> Edit Profile ({completionPercentage}%)
                </Link>
                <span className="badge" style={{ fontSize: '0.65rem' }}>{user?.role}</span>
              </div>
              <div className="flex items-center gap-sm text-muted flex-wrap" style={{ fontSize: '0.75rem' }}>
                <span className="flex items-center gap-xs truncate"><Mail size={12} className="shrink-0" /> {user?.email}</span>
                {user?.phone && <span className="flex items-center gap-xs truncate"><Phone size={12} className="shrink-0" /> {user?.phone}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-around sm:justify-end gap-lg w-full sm:w-auto pt-3 sm:pt-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div className="text-center">
              <span className="font-heading font-black text-white block" style={{ fontSize: '1.25rem' }}>
                {registrations.length}
              </span>
              <span className="label-eyebrow" style={{ fontSize: '0.65rem' }}>Registered Passes</span>
            </div>
            <div className="text-center">
              <span className="font-heading font-black text-white block" style={{ fontSize: '1.25rem' }}>
                {registrations.filter(r => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN').length}
              </span>
              <span className="label-eyebrow" style={{ fontSize: '0.65rem' }}>Confirmed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Registrations List */}
      <div className="flex flex-col gap-lg">
        <div className="flex items-center justify-between">
          <h2 className="section-title flex items-center gap-xs">
            <Ticket size={20} /> MY EVENT PASSES & TICKETS
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-2 gap-lg">
            {[1, 2].map((n) => (
              <div key={n} className="card-mono" style={{ height: '12rem', opacity: 0.5 }} />
            ))}
          </div>
        ) : registrations.length > 0 ? (
          <div className="grid grid-2 gap-lg">
            {registrations.map((reg) => {
              const event = reg.eventId;
              return (
                <div key={reg._id} className="card-mono" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', gap: '1rem' }}>
                  <div className="flex flex-col gap-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white" style={{ fontSize: '0.8125rem' }}>{reg.registrationId}</span>
                      <StatusBadge status={reg.status} />
                    </div>

                    <h3 className="font-heading font-bold text-white truncate" style={{ fontSize: '1.125rem' }}>
                      {event?.title || 'Event'}
                    </h3>

                    <div className="text-muted flex flex-col gap-xs" style={{ fontSize: '0.75rem' }}>
                      <div className="flex items-center gap-xs">
                        <Calendar size={14} className="text-dim" />
                        <span>{new Date(event?.eventDate).toLocaleDateString()} at {event?.startTime}</span>
                      </div>
                      <div className="flex items-center gap-xs">
                        <MapPin size={14} className="text-dim" />
                        <span className="truncate">{event?.venue}, {event?.city}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-xs flex-wrap" style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', marginTop: '0.5rem' }}>
                    {event?.slug ? (
                      <Link
                        to={`/events/${event.slug}?tab=leaderboard`}
                        className="btn btn-secondary btn-sm flex items-center gap-xs text-amber-400"
                        style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}
                      >
                        <Trophy size={14} /> View Event Leaderboard
                      </Link>
                    ) : <div />}

                    <button
                      onClick={() => setSelectedPass(reg)}
                      className="btn btn-secondary btn-sm"
                    >
                      <QrCode size={14} /> View QR Pass
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Ticket size={24} />
            </div>
            <h3 className="empty-state-title">No Event Passes Found</h3>
            <p className="empty-state-desc">You haven't registered for any active events yet.</p>
          </div>
        )}
      </div>

      {/* QR Code Pass Modal */}
      {selectedPass && (
        <div className="modal-overlay">
          <div className="modal-content text-center flex flex-col gap-md" style={{ maxWidth: '32rem' }}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-cyan-500 text-slate-950 font-bold flex items-center justify-center text-xs">P1</div>
                <span className="text-xs font-mono font-bold tracking-widest text-cyan-400">PEAK1 OFFICIAL ENTRY PASS</span>
              </div>
              <StatusBadge status={selectedPass.status} />
            </div>

            <div className="text-left py-1">
              <h3 className="section-title text-xl text-white">{selectedPass.eventId?.title || 'Event Pass'}</h3>
              <p className="text-muted text-xs flex items-center gap-3 mt-1">
                <span>📍 {selectedPass.eventId?.venue}, {selectedPass.eventId?.city}</span>
                <span>📅 {new Date(selectedPass.eventId?.eventDate).toLocaleDateString()}</span>
              </p>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', width: 'fit-content', marginInline: 'auto' }}>
              <QRCodeSVG value={selectedPass.signedQrPayload || selectedPass.registrationId} size={200} />
            </div>

            <div className="card-mono text-left font-mono flex flex-col gap-xs p-3" style={{ backgroundColor: 'var(--color-black)', fontSize: '0.75rem' }}>
              <div className="flex justify-between">
                <span className="text-muted">PASS ID:</span>
                <span className="font-bold text-white">{selectedPass.registrationId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">PARTICIPANT:</span>
                <span className="text-white">{selectedPass.participantDetails?.fullName || user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">EMAIL:</span>
                <span className="text-slate-300">{selectedPass.participantDetails?.email || user?.email}</span>
              </div>
              {selectedPass.raceDetails?.vehicleModel && (
                <div className="flex justify-between">
                  <span className="text-muted">VEHICLE / CLASS:</span>
                  <span className="text-cyan-400">{selectedPass.raceDetails.vehicleModel} ({selectedPass.raceDetails.vehicleNumber})</span>
                </div>
              )}
            </div>

            <p className="text-slate-400 text-[11px] leading-tight">
              Present this pass & QR code at the entry gate. Verification requires valid photo ID matching the participant name.
            </p>

            <div className="flex gap-md pt-2 modal-action-buttons">
              <button onClick={() => window.print()} className="btn btn-secondary flex-1 flex items-center justify-center gap-2">
                <Printer size={15} /> Print / Save PDF
              </button>
              <button onClick={() => setSelectedPass(null)} className="btn btn-primary flex-1">
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
