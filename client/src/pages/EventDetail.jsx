import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import { 
  Calendar, MapPin, ShieldAlert, FileText, CheckCircle2, 
  ArrowLeft, Ticket, Gauge, X 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function EventDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [event, setEvent] = useState(null);
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
              src={event.posterUrl || 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800'}
              alt={event.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Details Column */}
          <div style={{ padding: '2rem', gridColumn: 'span 2', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.5rem' }}>
            <div className="flex flex-col gap-sm">
              <div className="flex items-center gap-xs">
                <span className="badge">{event.category}</span>
                <StatusBadge status={event.status} />
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
            <div className="flex items-center justify-between gap-md">
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                Organizer: <strong className="text-white">{event.organizer?.name}</strong>
              </span>

              <button
                onClick={handleRegisterClick}
                disabled={event.status !== 'PUBLISHED'}
                className="btn btn-primary btn-md"
              >
                {event.status === 'PUBLISHED' ? 'Register Now' : 'Registration Closed'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Body Grid */}
      <div className="grid grid-3 gap-lg">
        {/* Main Content */}
        <div style={{ gridColumn: 'span 2' }} className="flex flex-col gap-lg">
          <div className="card-mono" style={{ padding: '2rem' }}>
            <h3 className="font-heading font-bold text-white uppercase flex items-center gap-xs" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
              <FileText size={20} /> Event Overview
            </h3>
            <p className="text-muted leading-relaxed whitespace-pre-line" style={{ fontSize: '0.875rem' }}>
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
