import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { Ticket, Calendar, MapPin, QrCode, Printer, Mail, Phone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function UserDashboard() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPass, setSelectedPass] = useState(null);

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

  const [showProfileBanner, setShowProfileBanner] = useState(true);

  // Compute profile completion percentage
  const profile = user?.profile || {};
  const profileFields = [user?.name, user?.email, user?.phone, profile.dob, profile.gender, profile.city, profile.emergencyContactName, profile.bloodGroup, profile.tShirtSize];
  const filledCount = profileFields.filter(Boolean).length;
  const completionPercentage = Math.round((filledCount / profileFields.length) * 100);

  return (
    <div className="container page-wrapper" style={{ paddingTop: '2.5rem' }}>
      {/* Complete Your Profile Banner */}
      {showProfileBanner && completionPercentage < 100 && (
        <div className="bg-gradient-to-r from-cyan-900/60 via-slate-900 to-emerald-900/60 border border-cyan-500/30 rounded-2xl p-4 md:p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            {/* Progress Ring */}
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" className="text-slate-800" fill="transparent" />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-cyan-400 transition-all duration-700"
                  fill="transparent"
                  strokeDasharray={125.6}
                  strokeDashoffset={125.6 - (125.6 * completionPercentage) / 100}
                />
              </svg>
              <span className="absolute text-xs font-bold text-white">{completionPercentage}%</span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white">Complete Your Participant Profile</h4>
              <p className="text-xs text-slate-300">Fast-track your race registration by saving your emergency contact, DOB & details.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <a href="/profile" className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition">
              Complete Profile
            </a>
            <button onClick={() => setShowProfileBanner(false)} className="px-3 py-2 text-slate-400 hover:text-white text-xs">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header Profile Section */}
      <div className="card-mono" style={{ padding: '2rem' }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-lg">
          <div className="flex items-center gap-md">
            <div className="brand-badge" style={{ width: '3.5rem', height: '3.5rem', fontSize: '1.5rem' }}>
              {user?.name?.[0]}
            </div>
            <div>
              <h1 className="section-title" style={{ fontSize: '1.5rem' }}>{user?.name}</h1>
              <div className="flex items-center gap-md text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                <span className="flex items-center gap-xs"><Mail size={12} /> {user?.email}</span>
                {user?.phone && <span className="flex items-center gap-xs"><Phone size={12} /> {user?.phone}</span>}
                <span className="badge">{user?.role}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-xl">
            <div className="text-center">
              <span className="font-heading font-black text-white block" style={{ fontSize: '1.5rem' }}>
                {registrations.length}
              </span>
              <span className="label-eyebrow" style={{ fontSize: '0.65rem' }}>Registered Passes</span>
            </div>
            <div className="text-center">
              <span className="font-heading font-black text-white block" style={{ fontSize: '1.5rem' }}>
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

                  <div className="flex items-center justify-between" style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', marginTop: '0.5rem' }}>
                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                      Registered: {new Date(reg.createdAt).toLocaleDateString()}
                    </span>

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
          <div className="modal-content text-center flex flex-col gap-md">
            <div>
              <span className="label-eyebrow">OFFICIAL CHECK-IN PASS</span>
              <h3 className="section-title" style={{ marginTop: '0.25rem' }}>{selectedPass.eventId?.title}</h3>
              <p className="text-muted" style={{ fontSize: '0.75rem' }}>{selectedPass.eventId?.venue}, {selectedPass.eventId?.city}</p>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', width: 'fit-content', marginInline: 'auto' }}>
              <QRCodeSVG value={selectedPass.signedQrPayload || selectedPass.registrationId} size={180} />
            </div>

            <div className="card-mono text-left font-mono flex flex-col gap-xs" style={{ padding: '1rem', backgroundColor: 'var(--color-black)', fontSize: '0.75rem' }}>
              <div className="flex justify-between">
                <span className="text-muted">PASS ID:</span>
                <span className="font-bold text-white">{selectedPass.registrationId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">PARTICIPANT:</span>
                <span className="text-white">{selectedPass.participantDetails?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">STATUS:</span>
                <span className="font-bold text-white">{selectedPass.status}</span>
              </div>
            </div>

            <div className="flex gap-md pt-2">
              <button onClick={() => window.print()} className="btn btn-secondary flex-1">
                <Printer size={14} /> Print Pass
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
