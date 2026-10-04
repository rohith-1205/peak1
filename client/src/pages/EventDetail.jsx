import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import { 
  Calendar, MapPin, ShieldAlert, FileText, CheckCircle2, 
  ArrowLeft, Ticket, Gauge, X, Trophy, Medal, Search, Flame, Award
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

import { getImageUrl } from '../utils/imageUrl';

export default function EventDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isRegisteredForEvent, fetchUserRegistrations } = useAuth();
  const { showToast } = useToast();

  const [event, setEvent] = useState(null);
  const isAlreadyRegistered = isRegisteredForEvent(event?._id);

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedRegistration, setConfirmedRegistration] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dob: user?.profile?.dob ? user.profile.dob.split('T')[0] : '',
    gender: user?.profile?.gender || '',
    city: user?.profile?.city || '',
    state: user?.profile?.state || '',
    emergencyContactName: user?.profile?.emergencyContactName || '',
    emergencyContactPhone: user?.profile?.emergencyContactPhone || '',
    bloodGroup: user?.profile?.bloodGroup || '',
    tShirtSize: user?.profile?.tShirtSize || '',
    saveToProfile: true
  });

  const [customResponses, setCustomResponses] = useState({});
  const [raceDetails, setRaceDetails] = useState({
    vehicleModel: '',
    vehicleNumber: '',
    drivingLicense: '',
    teamName: ''
  });

  const initialTab = searchParams.get('tab') === 'leaderboard' ? 'leaderboard' : 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardSearch, setLeaderboardSearch] = useState('');

  useEffect(() => {
    if (searchParams.get('tab') === 'leaderboard') {
      setActiveTab('leaderboard');
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${slug}`);
        if (res.success && res.data?.event) {
          setEvent(res.data.event);
        }
      } catch (err) {
        showToast(err.message || 'Failed to load event details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [slug]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoadingLeaderboard(true);
      try {
        const res = await api.get(`/events/${slug}/leaderboard`);
        if (res.success && res.data?.leaderboard) {
          setLeaderboardData(res.data.leaderboard);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoadingLeaderboard(false);
      }
    };

    if (slug) {
      fetchLeaderboard();
    }
  }, [slug, activeTab]);

  if (loading) {
    return (
      <div className="container flex flex-col items-center justify-center section-padding">
        <span className="label-eyebrow">Loading Event Details...</span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container text-center section-padding flex flex-col gap-md items-center">
        <h2 className="section-title">Event Not Found</h2>
        <p className="text-muted">The event you are looking for may have been removed or archived.</p>
        <button onClick={() => navigate('/events')} className="btn btn-secondary btn-sm">
          Return to Events Catalog
        </button>
      </div>
    );
  }

  const formattedDate = new Date(event.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const handleRegisterClick = () => {
    if (!user) {
      showToast('Please log in to register for this event', 'info');
      navigate('/login');
      return;
    }
    setIsModalOpen(true);
  };

  const handleCustomFieldChange = (fieldId, val) => {
    setCustomResponses((prev) => ({ ...prev, [fieldId]: val }));
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        participantDetails: formData,
        customResponses,
        raceDetails,
        saveToProfile: formData.saveToProfile
      };

      // 1. Initiate Registration
      const regRes = await api.post(`/registrations/event/${event._id}`, payload);

      if (!regRes.success) {
        throw new Error(regRes.message || 'Registration failed');
      }

      const { registration, requiresPayment } = regRes.data;

      // 2. If FREE event: Immediate Confirmation!
      if (!requiresPayment) {
        setConfirmedRegistration(registration);
        showToast('Registration Confirmed Successfully!', 'success');
        if (fetchUserRegistrations) {
          fetchUserRegistrations().catch((e) => console.error(e));
        }
        setSubmitting(false);
        return;
      }

      // 3. If PAID event: Initialize Razorpay Checkout
      const orderRes = await api.post('/payments/create-order', {
        registrationId: registration._id
      });

      if (!orderRes.success || !orderRes.data) {
        throw new Error('Failed to generate payment order');
      }

      const orderData = orderRes.data;

      const options = {
        key: orderData.keyId,
        amount: orderData.amountInPaise,
        currency: orderData.currency,
        name: 'Peak1 Event Platform',
        description: `Registration for ${event.title}`,
        order_id: orderData.orderId.startsWith('order_mock_') ? undefined : orderData.orderId,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: '#FFFFFF'
        },
        handler: async function (response) {
          try {
            const verifyRes = await api.post('/payments/verify', {
              razorpayOrderId: response.razorpay_order_id || orderData.orderId,
              razorpayPaymentId: response.razorpay_payment_id || `pay_mock_${Date.now()}`,
              razorpaySignature: response.razorpay_signature || 'mock_signature',
              registrationId: registration._id
            });

            if (verifyRes.success) {
              setConfirmedRegistration(verifyRes.data.registration);
              showToast('Payment Verified & Registration Confirmed!', 'success');
            }
          } catch (err) {
            showToast(err.message || 'Payment verification failed', 'error');
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            showToast('Payment window closed. Registration remains pending.', 'info');
            setSubmitting(false);
          }
        }
      };

      // Handle mock fallback if Razorpay script is blocked
      if (typeof window.Razorpay === 'undefined' || orderData.orderId.startsWith('order_mock_')) {
        const verifyRes = await api.post('/payments/verify', {
          razorpayOrderId: orderData.orderId,
          razorpayPaymentId: `pay_mock_${Date.now()}`,
          razorpaySignature: 'mock_signature',
          registrationId: registration._id
        });

        if (verifyRes.success) {
          setConfirmedRegistration(verifyRes.data.registration);
          showToast('Demo Payment Processed & Confirmed!', 'success');
        }
        setSubmitting(false);
      } else {
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      let errorMsg = err.message || 'Registration failed';
      if (err.errors && err.errors.length > 0) {
        errorMsg = err.errors.join(', ');
      } else if (err.errorCode === 'DUPLICATE_REGISTRATION') {
        errorMsg = 'You are already registered for this event.';
      }
      showToast(errorMsg, 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="container page-wrapper" style={{ paddingTop: '1.5rem' }}>
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost btn-sm"
        >
          <ArrowLeft size={14} /> Back to Events
        </button>
      </div>

      {/* Hero Banner Header Card */}
      <div className="card-mono" style={{ overflow: 'hidden' }}>
        <div className="grid grid-3">
          {/* Poster */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10', backgroundColor: 'var(--color-black)' }}>
            <img
              src={getImageUrl(event.posterUrl) || 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800'}
              alt={event.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Details Column */}
          <div style={{ padding: '2rem', gridColumn: 'span 2', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.5rem' }}>
            <div className="flex flex-col gap-sm">
              <div className="flex items-center gap-xs">
                {isAlreadyRegistered ? (
                  <span className="badge badge-emerald flex items-center gap-xs">
                    <CheckCircle2 size={12} /> REGISTERED
                  </span>
                ) : (
                  <StatusBadge status={event.status} />
                )}
              </div>

              <h1 className="page-title">{event.title}</h1>
              <p className="text-muted leading-relaxed" style={{ fontSize: '0.875rem' }}>
                {event.shortDescription}
              </p>
            </div>

            {/* Specs Bar */}
            <div className="grid grid-3 gap-md" style={{ paddingBlock: '1rem', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.75rem' }}>
              <div className="flex items-center gap-sm">
                <Calendar size={18} className="text-white" />
                <div>
                  <span className="label-eyebrow" style={{ fontSize: '0.65rem', display: 'block' }}>Date & Time</span>
                  <span className="font-bold text-white">{formattedDate} ({event.startTime})</span>
                </div>
              </div>

              <div className="flex items-center gap-sm">
                <MapPin size={18} className="text-white" />
                <div>
                  <span className="label-eyebrow" style={{ fontSize: '0.65rem', display: 'block' }}>Venue</span>
                  <span className="font-bold text-white truncate">{event.venue}, {event.city}</span>
                </div>
              </div>

              <div className="flex items-center gap-sm">
                <Ticket size={18} className="text-white" />
                <div>
                  <span className="label-eyebrow" style={{ fontSize: '0.65rem', display: 'block' }}>Registration Fee</span>
                  <span className="font-bold text-white">{event.isPaid ? `₹${event.price?.toLocaleString('en-IN')}` : 'FREE ENTRY'}</span>
                </div>
              </div>
            </div>

            {/* Action Row */}
            <div className="flex items-center justify-between gap-md flex-wrap">
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                Organizer: <strong className="text-white">{event.organizer?.name}</strong>
              </span>

              {isAlreadyRegistered ? (
                <div className="flex items-center gap-xs flex-wrap">
                  <span className="badge badge-emerald flex items-center gap-xs" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
                    <CheckCircle2 size={14} /> YOU ARE REGISTERED
                  </span>
                  <button 
                    onClick={() => setActiveTab('leaderboard')} 
                    className="btn btn-secondary btn-sm flex items-center gap-xs" 
                    style={{ color: 'var(--accent-amber)', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                  >
                    <Trophy size={14} /> View Standings
                  </button>
                  <button onClick={() => navigate('/dashboard')} className="btn btn-primary btn-sm flex items-center gap-xs">
                    <Ticket size={14} /> View Pass in Dashboard
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleRegisterClick}
                  disabled={event.status !== 'PUBLISHED'}
                  className="btn btn-primary btn-md"
                >
                  {event.status === 'PUBLISHED' ? 'Register Now' : 'Registration Closed'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>      {/* Navigation Tabs */}
      <div className="flex items-center gap-sm" style={{ borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem', marginTop: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className="btn btn-ghost"
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.8125rem',
            borderRadius: '0',
            borderBottom: activeTab === 'overview' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
            color: activeTab === 'overview' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            backgroundColor: activeTab === 'overview' ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
            fontWeight: 700
          }}
        >
          <FileText size={15} /> Overview & Specs
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('leaderboard')}
          className="btn btn-ghost"
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.8125rem',
            borderRadius: '0',
            borderBottom: activeTab === 'leaderboard' ? '2px solid var(--accent-amber)' : '2px solid transparent',
            color: activeTab === 'leaderboard' ? 'var(--accent-amber)' : 'var(--text-muted)',
            backgroundColor: activeTab === 'leaderboard' ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
            fontWeight: 700
          }}
        >
          <Trophy size={15} /> {event.leaderboardTitle || 'Official Standings'}
          {leaderboardData.length > 0 && (
            <span className="badge badge-amber font-mono" style={{ fontSize: '0.625rem', padding: '0.1rem 0.4rem', marginLeft: '0.35rem' }}>
              {leaderboardData.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'overview' ? (
        /* Body Grid Overview */
        <div className="grid grid-3 gap-lg">
          {/* Main Content */}
          <div style={{ gridColumn: 'span 2' }} className="flex flex-col gap-lg">
            <div className="card-mono" style={{ padding: '2rem' }}>
              <h3 className="font-heading font-bold text-white uppercase flex items-center gap-xs" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
                <FileText size={20} /> Event Overview
              </h3>
              <p className="text-muted leading-relaxed" style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {event.fullDescription}
              </p>
            </div>

            {/* Technical Specs */}
            {event.raceConfig && (event.raceConfig.vehicleType || event.raceConfig.distance) && (
              <div className="card-mono" style={{ padding: '2rem' }}>
                <h3 className="font-heading font-bold text-white uppercase flex items-center gap-xs" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
                  <Gauge size={20} /> Technical & Race Parameters
                </h3>
                <div className="grid grid-2 gap-md">
                  {event.raceConfig.vehicleType && (
                    <div className="card-mono" style={{ padding: '1rem', backgroundColor: 'var(--color-black)' }}>
                      <span className="label-eyebrow" style={{ fontSize: '0.65rem' }}>Vehicle / Discipline</span>
                      <span className="font-bold text-white block mt-1" style={{ fontSize: '0.875rem' }}>{event.raceConfig.vehicleType}</span>
                    </div>
                  )}
                  {event.raceConfig.distance && (
                    <div className="card-mono" style={{ padding: '1rem', backgroundColor: 'var(--color-black)' }}>
                      <span className="label-eyebrow" style={{ fontSize: '0.65rem' }}>Format / Distance</span>
                      <span className="font-bold text-white block mt-1" style={{ fontSize: '0.875rem' }}>{event.raceConfig.distance}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rules */}
            {event.rules && event.rules.length > 0 && (
              <div className="card-mono" style={{ padding: '2rem' }}>
                <h3 className="font-heading font-bold text-white uppercase flex items-center gap-xs" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
                  <ShieldAlert size={20} /> Regulations & Safety Rules
                </h3>
                <ul className="text-muted leading-relaxed" style={{ fontSize: '0.8125rem', paddingLeft: '1.25rem' }}>
                  {event.rules.map((rule, idx) => (
                    <li key={idx} style={{ marginBottom: '0.375rem' }}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-lg">
            <div className="card-mono" style={{ padding: '1.5rem' }}>
              <h4 className="font-heading font-bold text-white uppercase" style={{ fontSize: '0.875rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                Venue Location
              </h4>
              <div className="text-muted leading-relaxed" style={{ fontSize: '0.8125rem' }}>
                <p className="font-bold text-white">{event.venue}</p>
                <p>{event.address}</p>
                <p>{event.city}, {event.state}, {event.country}</p>
              </div>
            </div>

            <div className="card-mono" style={{ padding: '1.5rem' }}>
              <h4 className="font-heading font-bold text-white uppercase" style={{ fontSize: '0.875rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                Organizer Info
              </h4>
              <div className="flex items-center gap-md">
                <div className="brand-badge" style={{ width: '2.5rem', height: '2.5rem', fontSize: '1rem' }}>
                  {event.organizer?.name?.[0]}
                </div>
                <div>
                  <p className="font-bold text-white" style={{ fontSize: '0.875rem' }}>{event.organizer?.name}</p>
                  <p className="text-muted" style={{ fontSize: '0.75rem' }}>{event.organizer?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Leaderboard Tab Content */
        <div className="flex flex-col gap-lg">
          {/* Header Banner */}
          <div className="card-mono" style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.4), rgba(15, 23, 42, 0.95), rgba(69, 26, 3, 0.4))', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-md">
              <div className="flex items-center gap-md">
                <div style={{ width: '3rem', height: '3rem', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', items: 'center', justifyContent: 'center', color: 'var(--accent-amber)', flexShrink: 0 }}>
                  <Trophy size={24} />
                </div>
                <div>
                  <h3 className="section-title" style={{ fontSize: '1.125rem', color: '#FFFFFF' }}>
                    {event.leaderboardTitle || 'Official Race Standings'}
                  </h3>
                  <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                    Live timing, lap scores, and position rankings verified by Peak1 Gate Systems
                  </p>
                </div>
              </div>

              {/* Search Filter */}
              <div style={{ position: 'relative', width: '100%', maxWidth: '18rem' }}>
                <Search size={14} className="text-dim" style={{ position: 'absolute', left: '0.75rem', top: '0.65rem' }} />
                <input
                  type="text"
                  value={leaderboardSearch}
                  onChange={(e) => setLeaderboardSearch(e.target.value)}
                  placeholder="Search racer, vehicle, pass..."
                  className="form-input"
                  style={{ paddingLeft: '2.25rem', paddingBlock: '0.45rem', fontSize: '0.75rem' }}
                />
              </div>
            </div>
          </div>

          {/* Top 3 Winner Podium */}
          {leaderboardData.length >= 3 && !leaderboardSearch && (
            <div className="grid grid-3 gap-md items-end" style={{ marginBlock: '0.5rem' }}>
              {/* 2nd Place */}
              <div className="card-mono text-center flex flex-col items-center gap-xs" style={{ padding: '1.25rem', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-medium)', color: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8125rem' }}>
                  🥈 2nd
                </div>
                <h4 className="font-bold text-white truncate w-full" style={{ fontSize: '0.95rem' }}>
                  {leaderboardData[1].participantName}
                </h4>
                <span className="text-dim font-mono" style={{ fontSize: '0.725rem' }}>
                  {leaderboardData[1].vehicleModel || 'Participant'}
                </span>
                <div className="badge" style={{ marginTop: '0.5rem', fontSize: '0.7rem' }}>
                  Score / Lap: {leaderboardData[1].leaderboardScore > 0 ? leaderboardData[1].leaderboardScore : 'Runner Up'}
                </div>
              </div>

              {/* 1st Place (Gold Winner) */}
              <div className="card-mono text-center flex flex-col items-center gap-xs" style={{ padding: '1.5rem', background: 'linear-gradient(to bottom, rgba(245, 158, 11, 0.15), rgba(15, 23, 42, 0.95))', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                <div style={{ width: '3rem', height: '3rem', borderRadius: '9999px', backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '2px solid var(--accent-amber)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem' }}>
                  🥇 1st
                </div>
                <span className="label-eyebrow" style={{ fontSize: '0.6rem', color: 'var(--accent-amber)' }}>EVENT CHAMPION</span>
                <h4 className="font-extrabold text-white truncate w-full" style={{ fontSize: '1.125rem' }}>
                  {leaderboardData[0].participantName}
                </h4>
                <span className="text-dim font-mono" style={{ fontSize: '0.75rem' }}>
                  {leaderboardData[0].vehicleModel || 'Champion Racer'}
                </span>
                <div className="badge badge-amber" style={{ marginTop: '0.5rem', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                  Score / Time: {leaderboardData[0].leaderboardScore > 0 ? leaderboardData[0].leaderboardScore : 'Winner'}
                </div>
              </div>

              {/* 3rd Place */}
              <div className="card-mono text-center flex flex-col items-center gap-xs" style={{ padding: '1.25rem', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-medium)', color: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8125rem' }}>
                  🥉 3rd
                </div>
                <h4 className="font-bold text-white truncate w-full" style={{ fontSize: '0.95rem' }}>
                  {leaderboardData[2].participantName}
                </h4>
                <span className="text-dim font-mono" style={{ fontSize: '0.725rem' }}>
                  {leaderboardData[2].vehicleModel || 'Participant'}
                </span>
                <div className="badge" style={{ marginTop: '0.5rem', fontSize: '0.7rem' }}>
                  Score / Lap: {leaderboardData[2].leaderboardScore > 0 ? leaderboardData[2].leaderboardScore : '3rd Place'}
                </div>
              </div>
            </div>
          )}

          {/* Standings Table */}
          {loadingLeaderboard ? (
            <div className="card-mono text-center text-muted font-mono" style={{ padding: '2.5rem', fontSize: '0.75rem' }}>
              Loading Official Standings...
            </div>
          ) : (() => {
            const filtered = leaderboardData.filter((item) => {
              if (!leaderboardSearch) return true;
              const q = leaderboardSearch.toLowerCase();
              return (
                item.participantName.toLowerCase().includes(q) ||
                item.vehicleModel.toLowerCase().includes(q) ||
                item.vehicleNumber.toLowerCase().includes(q) ||
                item.registrationId.toLowerCase().includes(q) ||
                item.teamName.toLowerCase().includes(q)
              );
            });

            if (filtered.length === 0) {
              return (
                <div className="card-mono text-center flex flex-col items-center gap-xs" style={{ padding: '2.5rem' }}>
                  <Flame size={28} className="text-dim" />
                  <h4 className="text-white font-bold" style={{ fontSize: '0.875rem' }}>No Standings Recorded Yet</h4>
                  <p className="text-muted" style={{ fontSize: '0.75rem', maxWidth: '24rem' }}>
                    Live race times and scores will be updated here as participants check in and complete their laps.
                  </p>
                </div>
              );
            }

            return (
              <div className="card-mono" style={{ padding: '0.5rem' }}>
                <div className="table-container" style={{ border: 'none' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '90px' }}>Rank</th>
                        <th>Participant Name</th>
                        <th>Vehicle / Details</th>
                        <th>Team / Squad</th>
                        <th>Pass ID</th>
                        <th style={{ textAlign: 'right' }}>Score / Time</th>
                        <th style={{ textAlign: 'center' }}>Gate Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item, idx) => (
                        <tr key={item.registrationId || idx}>
                          <td className="font-mono font-bold whitespace-nowrap">
                            {item.leaderboardRank === 1 && <span style={{ color: 'var(--accent-amber)' }}>🥇 #1</span>}
                            {item.leaderboardRank === 2 && <span style={{ color: '#E2E8F0' }}>🥈 #2</span>}
                            {item.leaderboardRank === 3 && <span style={{ color: '#CBD5E1' }}>🥉 #3</span>}
                            {item.leaderboardRank > 3 && `#${item.leaderboardRank}`}
                          </td>
                          <td>
                            <span className="font-bold text-white block" style={{ fontSize: '0.8125rem' }}>{item.participantName}</span>
                            {item.city && <span className="text-dim" style={{ fontSize: '0.725rem' }}>{item.city}</span>}
                          </td>
                          <td>
                            <span className="font-mono text-white block" style={{ fontSize: '0.75rem' }}>{item.vehicleModel || '-'}</span>
                            {item.vehicleNumber && <span className="text-dim font-mono" style={{ fontSize: '0.675rem' }}>{item.vehicleNumber}</span>}
                          </td>
                          <td className="text-muted" style={{ fontSize: '0.8125rem' }}>{item.teamName || '-'}</td>
                          <td className="font-mono text-dim whitespace-nowrap" style={{ fontSize: '0.75rem' }}>{item.registrationId}</td>
                          <td className="font-mono font-bold text-white whitespace-nowrap" style={{ textAlign: 'right' }}>
                            {item.leaderboardScore > 0 ? (
                              <span className="badge badge-emerald">
                                {item.leaderboardScore}
                              </span>
                            ) : (
                              <span className="text-dim">-</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }} className="whitespace-nowrap">
                            {item.isCheckedIn ? (
                              <span className="badge badge-emerald">Checked In</span>
                            ) : (
                              <span className="badge">Registered</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Registration Modal Dialog */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setConfirmedRegistration(null);
              }}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            {confirmedRegistration ? (
              <div className="text-center flex flex-col items-center gap-md" style={{ paddingBlock: '1rem' }}>
                <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', backgroundColor: 'var(--accent-emerald-bg)', border: '1px solid var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)' }}>
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="section-title">REGISTRATION CONFIRMED!</h3>
                  <p className="text-muted" style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Your official pass has been generated.</p>
                </div>

                <div className="card-mono w-full" style={{ padding: '1.5rem', textAlign: 'left', backgroundColor: 'var(--color-black)' }}>
                  <div className="flex justify-between items-center" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span className="label-eyebrow">Pass ID</span>
                    <span className="font-mono font-bold text-white">{confirmedRegistration.registrationId}</span>
                  </div>

                  <div className="flex justify-center" style={{ paddingBlock: '1rem', backgroundColor: '#FFFFFF', borderRadius: '8px', marginBlock: '1rem' }}>
                    <QRCodeSVG value={confirmedRegistration.registrationId} size={150} />
                  </div>

                  <div className="text-muted flex flex-col gap-xs" style={{ fontSize: '0.8125rem' }}>
                    <p><strong className="text-white">Participant:</strong> {confirmedRegistration.participantDetails.fullName}</p>
                    <p><strong className="text-white">Event:</strong> {event.title}</p>
                  </div>
                </div>

                <button onClick={() => navigate('/dashboard')} className="btn btn-primary w-full">
                  View My Passes Dashboard
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitRegistration} className="flex flex-col gap-lg">
                <div>
                  <span className="label-eyebrow">OFFICIAL ENTRY FORM</span>
                  <h2 className="section-title" style={{ marginTop: '0.25rem' }}>
                    REGISTER FOR {event.title}
                  </h2>
                </div>

                {/* Section 1: Pre-filled Profile Details */}
                <div className="card-mono p-4 flex flex-col gap-sm" style={{ backgroundColor: 'var(--color-black)' }}>
                  <div className="flex justify-between items-center" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span className="label-eyebrow" style={{ fontSize: '0.65rem', color: 'var(--accent-emerald)' }}>✓ YOUR SAVED PROFILE DETAILS</span>
                    <button
                      type="button"
                      onClick={() => navigate('/profile')}
                      className="btn btn-ghost btn-sm text-dim"
                      style={{ fontSize: '0.7rem' }}
                    >
                      Edit Profile
                    </button>
                  </div>

                  <div className="grid grid-2 gap-xs text-muted" style={{ fontSize: '0.8125rem' }}>
                    <p><strong className="text-white">Name:</strong> {formData.fullName || user?.name}</p>
                    <p><strong className="text-white">Email:</strong> {formData.email || user?.email}</p>
                    <p><strong className="text-white">Phone:</strong> {formData.phone || user?.phone || 'Not set'}</p>
                    <p><strong className="text-white">City:</strong> {formData.city || user?.profile?.city || 'Not set'}</p>
                  </div>
                </div>

                {/* Section 1.1: Missing Required Profile Fields Prompt */}
                {(() => {
                  const reqProfile = event.registrationConfig?.requiredProfileFields || [];
                  const minAge = event.registrationConfig?.minAge || 0;
                  const missing = [];
                  
                  if (!formData.phone) missing.push('phone');
                  if (reqProfile.includes('bloodGroup') && !formData.bloodGroup) missing.push('bloodGroup');
                  if (reqProfile.includes('tShirtSize') && !formData.tShirtSize) missing.push('tShirtSize');
                  if ((reqProfile.includes('dob') || minAge > 0) && !formData.dob) missing.push('dob');
                  if (reqProfile.includes('emergencyContactName') && !formData.emergencyContactName) missing.push('emergencyContactName');
                  if (reqProfile.includes('emergencyContactPhone') && !formData.emergencyContactPhone) missing.push('emergencyContactPhone');
                  if (reqProfile.includes('gender') && !formData.gender) missing.push('gender');
                  if (reqProfile.includes('city') && !formData.city) missing.push('city');
                  if (reqProfile.includes('state') && !formData.state) missing.push('state');

                  if (missing.length === 0) return null;

                  return (
                    <div className="flex flex-col gap-md p-4 card-mono" style={{ borderColor: 'var(--accent-orange)' }}>
                      <span className="label-eyebrow" style={{ color: 'var(--accent-orange)' }}>REQUIRED FOR THIS EVENT</span>
                      <div className="grid grid-2 gap-md">
                        {missing.includes('phone') && (
                          <div className="form-group">
                            <label className="form-label">Phone Number *</label>
                            <input
                              type="text"
                              required
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              className="form-input"
                            />
                          </div>
                        )}
                        
                        {missing.includes('bloodGroup') && (
                          <div className="form-group">
                            <label className="form-label">Blood Group *</label>
                            <select
                              required
                              value={formData.bloodGroup}
                              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                              className="form-select"
                            >
                              <option value="">Select</option>
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
                        )}

                        {missing.includes('tShirtSize') && (
                          <div className="form-group">
                            <label className="form-label">T-Shirt Size *</label>
                            <select
                              required
                              value={formData.tShirtSize}
                              onChange={(e) => setFormData({ ...formData, tShirtSize: e.target.value })}
                              className="form-select"
                            >
                              <option value="">Select</option>
                              <option value="XS">XS</option>
                              <option value="S">S</option>
                              <option value="M">M</option>
                              <option value="L">L</option>
                              <option value="XL">XL</option>
                              <option value="XXL">XXL</option>
                            </select>
                          </div>
                        )}

                        {missing.includes('gender') && (
                          <div className="form-group">
                            <label className="form-label">Gender *</label>
                            <select
                              required
                              value={formData.gender}
                              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                              className="form-select"
                            >
                              <option value="">Select</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Non-Binary">Non-Binary</option>
                              <option value="Other">Other</option>
                              <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                          </div>
                        )}

                        {missing.includes('dob') && (
                          <div className="form-group">
                            <label className="form-label">Date of Birth *</label>
                            <input
                              type="date"
                              required
                              value={formData.dob}
                              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                              className="form-input"
                            />
                          </div>
                        )}

                        {missing.includes('city') && (
                          <div className="form-group">
                            <label className="form-label">City *</label>
                            <input
                              type="text"
                              required
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              className="form-input"
                            />
                          </div>
                        )}

                        {missing.includes('state') && (
                          <div className="form-group">
                            <label className="form-label">State *</label>
                            <input
                              type="text"
                              required
                              value={formData.state}
                              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                              className="form-input"
                            />
                          </div>
                        )}

                        {missing.includes('emergencyContactName') && (
                          <div className="form-group">
                            <label className="form-label">Emergency Contact Name *</label>
                            <input
                              type="text"
                              required
                              value={formData.emergencyContactName}
                              onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                              className="form-input"
                            />
                          </div>
                        )}
                        
                        {missing.includes('emergencyContactPhone') && (
                          <div className="form-group">
                            <label className="form-label">Emergency Contact Phone *</label>
                            <input
                              type="text"
                              required
                              value={formData.emergencyContactPhone}
                              onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                              className="form-input"
                            />
                          </div>
                        )}
                      </div>

                      <label className="flex items-center gap-xs text-dim cursor-pointer pt-1" style={{ fontSize: '0.75rem' }}>
                        <input type="checkbox" checked={formData.saveToProfile} onChange={(e) => setFormData({ ...formData, saveToProfile: e.target.checked })} />
                        Save these details to my Peak1 Profile for future registrations
                      </label>
                    </div>
                  );
                })()}

                {/* Section 2: Race Specifications */}
                {(() => {
                  const race = event.registrationConfig?.raceFields || {};
                  const activeFields = Object.entries(race).filter(([_, mode]) => mode !== 'HIDDEN');
                  if (activeFields.length === 0) return null;

                  return (
                    <div className="flex flex-col gap-md" style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                      <h4 className="label-eyebrow">Race & Participation Details</h4>
                      <div className="grid grid-2 gap-md">
                        {race.vehicleModel !== 'HIDDEN' && (
                          <div className="form-group">
                            <label className="form-label">Vehicle Model & Specs {race.vehicleModel === 'REQUIRED' ? '*' : ''}</label>
                            <input
                              type="text"
                              required={race.vehicleModel === 'REQUIRED'}
                              placeholder="e.g. Porsche 911 / Yamaha R1"
                              value={raceDetails.vehicleModel}
                              onChange={(e) => setRaceDetails({ ...raceDetails, vehicleModel: e.target.value })}
                              className="form-input"
                            />
                          </div>
                        )}

                        {race.licenseNumber !== 'HIDDEN' && (
                          <div className="form-group">
                            <label className="form-label">Driving / Racing License No. {race.licenseNumber === 'REQUIRED' ? '*' : ''}</label>
                            <input
                              type="text"
                              required={race.licenseNumber === 'REQUIRED'}
                              placeholder="FMSCI / State DL No."
                              value={raceDetails.drivingLicense}
                              onChange={(e) => setRaceDetails({ ...raceDetails, drivingLicense: e.target.value })}
                              className="form-input"
                            />
                          </div>
                        )}

                        {race.teamName !== 'HIDDEN' && (
                          <div className="form-group">
                            <label className="form-label">Team / Squad Name {race.teamName === 'REQUIRED' ? '*' : ''}</label>
                            <input
                              type="text"
                              required={race.teamName === 'REQUIRED'}
                              placeholder="Racing Team Name"
                              value={raceDetails.teamName}
                              onChange={(e) => setRaceDetails({ ...raceDetails, teamName: e.target.value })}
                              className="form-input"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Section 3: Dynamic Custom Questions */}
                {(() => {
                  const fields = event.registrationConfig?.customFields?.length > 0
                    ? event.registrationConfig.customFields
                    : event.customFields || [];

                  if (fields.length === 0) return null;

                  return (
                    <div className="flex flex-col gap-md" style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                      <h4 className="label-eyebrow">Custom Event Questions</h4>
                      <div className="grid grid-2 gap-md">
                        {fields.map((field, idx) => {
                          const fieldId = field.id || field.fieldId || `q_${idx}`;
                          const isReq = !!field.required;
                          const fieldType = (field.type || 'TEXT').toUpperCase();

                          return (
                            <div key={fieldId} className="form-group">
                              <label className="form-label">{field.label} {isReq && '*'}</label>
                              {['DROPDOWN', 'RADIO', 'CHECKBOX', 'SELECT'].includes(fieldType) ? (
                                <select
                                  required={isReq}
                                  onChange={(e) => handleCustomFieldChange(fieldId, e.target.value)}
                                  className="form-select"
                                >
                                  <option value="">Select Option</option>
                                  {field.options?.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : fieldType === 'TEXTAREA' ? (
                                <textarea
                                  required={isReq}
                                  placeholder={field.placeholder || ''}
                                  onChange={(e) => handleCustomFieldChange(fieldId, e.target.value)}
                                  className="form-textarea"
                                  rows={3}
                                />
                              ) : (
                                <input
                                  type={fieldType === 'NUMBER' ? 'number' : fieldType === 'DATE' ? 'date' : 'text'}
                                  required={isReq}
                                  placeholder={field.placeholder || ''}
                                  onChange={(e) => handleCustomFieldChange(fieldId, e.target.value)}
                                  className="form-input"
                                />
                              )}
                              {field.helpText && <span className="text-dim" style={{ fontSize: '0.7rem' }}>{field.helpText}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Footer Action */}
                <div className="flex items-center justify-between" style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <div>
                    <span className="label-eyebrow" style={{ fontSize: '0.65rem' }}>Total Fee</span>
                    <span className="font-heading font-black text-white block" style={{ fontSize: '1.25rem' }}>
                      {event.isPaid ? `₹${event.price?.toLocaleString('en-IN')}` : 'FREE'}
                    </span>
                  </div>

                  <button type="submit" disabled={submitting} className="btn btn-primary">
                    {submitting ? 'Processing...' : event.isPaid ? 'Proceed to Pay & Confirm' : 'Confirm Free Entry'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
