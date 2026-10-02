import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../services/adminApi';
import { useToast } from '../context/ToastContext';
import ImageUploader from '../components/ImageUploader';
import ParticipantRequirementsBuilder from '../components/ParticipantRequirementsBuilder';
import { Plus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';

export default function AdminCreateEvent() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Event State Data
  const [eventData, setEventData] = useState({
    title: '',
    category: 'General',
    shortDescription: '',
    fullDescription: '',
    organizer: {
      name: 'Peak1 Event Operations',
      email: 'events@peak1.app',
      phone: '+91 98765 43210',
      logoUrl: ''
    },
    eventDate: '',
    startTime: '08:00',
    endTime: '17:00',
    venue: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    mapUrl: '',
    posterUrl: '',
    bannerUrl: '',
    isPaid: false,
    price: 0,
    currency: 'INR',
    capacity: 100,
    isUnlimitedCapacity: false,
    status: 'PUBLISHED',
    hasLeaderboard: false,
    leaderboardTitle: 'Leaderboard',
    raceConfig: {
      vehicleType: '',
      raceCategory: '',
      distance: '',
      trackName: '',
      safetyRequirements: '',
      licenseRequired: false
    },
    registrationConfig: {
      requiredProfileFields: ['fullName', 'email', 'phone', 'emergencyContactName', 'emergencyContactPhone', 'bloodGroup', 'tShirtSize'],
      raceFields: {
        vehicleModel: 'HIDDEN',
        vehicleNumber: 'HIDDEN',
        licenseNumber: 'HIDDEN',
        teamName: 'OPTIONAL',
        categoryClass: 'OPTIONAL'
      },
      minAge: 0,
      customFields: []
    },
    customFields: [
      { id: 'custom_bloodGroup', label: 'Blood Group', type: 'DROPDOWN', required: true, options: ['A+', 'B+', 'O+', 'AB+'] },
      { id: 'custom_tShirtSize', label: 'T-Shirt Size', type: 'DROPDOWN', required: true, options: ['S', 'M', 'L', 'XL', 'XXL'] }
    ],
    rules: [
      'All participants must arrive 45 minutes before start time for mandatory briefing.',
      'Decision of the Event Director is final.'
    ],
    terms: ['Participation is at participant\'s own risk.'],
    cancellationPolicy: 'Refunds permitted up to 7 days before event date.'
  });

  const handleAddField = () => {
    const fieldId = `custom_${Date.now()}`;
    setEventData((prev) => ({
      ...prev,
      customFields: [
        ...prev.customFields,
        { fieldId, label: 'New Custom Field', type: 'text', required: false, options: [] }
      ]
    }));
  };

  const handleRemoveField = (index) => {
    setEventData((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index)
    }));
  };

  const handleCustomFieldUpdate = (index, key, value) => {
    setEventData((prev) => {
      const updated = [...prev.customFields];
      updated[index][key] = value;
      return { ...prev, customFields: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventData.title.trim()) {
      showToast('Event title is required (Step 1)', 'error');
      setCurrentStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...eventData,
        shortDescription: eventData.shortDescription || eventData.title,
        fullDescription: eventData.fullDescription || eventData.shortDescription || eventData.title,
        venue: eventData.venue || 'Main Venue',
        address: eventData.address || eventData.venue || 'Main Venue Address',
        city: eventData.city || 'Coimbatore',
        state: eventData.state || 'Tamil Nadu',
        eventDate: eventData.eventDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
      };

      const res = await adminApi.post('/events', payload);
      if (res.success && res.data?.event) {
        showToast('Event Created & Published Successfully!', 'success');
        navigate(`/events/${res.data.event.slug}`);
      }
    } catch (err) {
      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        showToast(`Validation Error: ${err.errors.join(' | ')}`, 'error');
      } else {
        showToast(err.message || 'Failed to create event. Check required fields.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-lg">
      {/* Wizard Header */}
      <div className="flex flex-col gap-xs" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <span className="label-eyebrow">CREATION WIZARD</span>
        <h1 className="page-title">
          CREATE NEW EVENT
        </h1>
        <p className="text-muted" style={{ fontSize: '0.75rem' }}>Step {currentStep} of 8 — Configure details, pricing, dynamic registration fields & publishing state</p>
      </div>

      {/* Steps Indicator Bar */}
      <div className="card-mono flex items-center justify-between gap-xs" style={{ padding: '0.75rem', overflowX: 'auto' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((stepNum) => (
          <button
            key={stepNum}
            type="button"
            onClick={() => setCurrentStep(stepNum)}
            className={`btn btn-sm ${currentStep === stepNum ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.7rem' }}
          >
            Step {stepNum}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="card-mono flex flex-col gap-lg" style={{ padding: '2rem' }}>
        {/* STEP 1: Basic Information */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-md">
            <h3 className="font-heading font-bold text-white uppercase" style={{ fontSize: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              Step 1: Basic Information
            </h3>
            
            <div className="form-group">
              <label className="form-label">Event Title *</label>
              <input
                type="text"
                required
                value={eventData.title}
                onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                placeholder="e.g. Annual Championship Series 2026"
                className="form-input"
              />
            </div>

            <div className="grid grid-2 gap-md">
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  required
                  value={eventData.category}
                  onChange={(e) => setEventData({ ...eventData, category: e.target.value })}
                  placeholder="e.g. Marathons / Motorsport / Corporate"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Organizer Unit *</label>
                <input
                  type="text"
                  required
                  value={eventData.organizer.name}
                  onChange={(e) => setEventData({
                    ...eventData,
                    organizer: { ...eventData.organizer, name: e.target.value }
                  })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Short Summary *</label>
              <input
                type="text"
                required
                maxLength={300}
                value={eventData.shortDescription}
                onChange={(e) => setEventData({ ...eventData, shortDescription: e.target.value })}
                placeholder="Brief summary for event catalog cards..."
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Full Description *</label>
              <textarea
                rows={5}
                required
                value={eventData.fullDescription}
                onChange={(e) => setEventData({ ...eventData, fullDescription: e.target.value })}
                placeholder="Comprehensive event overview, schedule, and details..."
                className="form-textarea"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Date & Location */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-md">
            <h3 className="font-heading font-bold text-white uppercase" style={{ fontSize: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              Step 2: Date & Venue Location
            </h3>

            <div className="grid grid-3 gap-md">
              <div className="form-group">
                <label className="form-label">Event Date *</label>
                <input
                  type="date"
                  required
                  value={eventData.eventDate}
                  onChange={(e) => setEventData({ ...eventData, eventDate: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Start Time *</label>
                <input
                  type="time"
                  required
                  value={eventData.startTime}
                  onChange={(e) => setEventData({ ...eventData, startTime: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time *</label>
                <input
                  type="time"
                  required
                  value={eventData.endTime}
                  onChange={(e) => setEventData({ ...eventData, endTime: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="grid grid-2 gap-md">
              <div className="form-group">
                <label className="form-label">Venue Name *</label>
                <input
                  type="text"
                  required
                  value={eventData.venue}
                  onChange={(e) => setEventData({ ...eventData, venue: e.target.value })}
                  placeholder="e.g. National Speedway Complex"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  required
                  value={eventData.city}
                  onChange={(e) => setEventData({ ...eventData, city: e.target.value })}
                  placeholder="e.g. Coimbatore"
                  className="form-input"
                />
              </div>
            </div>

            <div className="grid grid-2 gap-md">
              <div className="form-group">
                <label className="form-label">Address *</label>
                <input
                  type="text"
                  required
                  value={eventData.address}
                  onChange={(e) => setEventData({ ...eventData, address: e.target.value })}
                  placeholder="Street address..."
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">State *</label>
                <input
                  type="text"
                  required
                  value={eventData.state}
                  onChange={(e) => setEventData({ ...eventData, state: e.target.value })}
                  placeholder="e.g. Tamil Nadu"
                  className="form-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Media */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-md">
            <h3 className="font-heading font-bold text-white uppercase" style={{ fontSize: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              Step 3: Poster & Header Banner Uploads
            </h3>
            
            <div className="grid grid-2 gap-lg">
              <ImageUploader
                kind="poster"
                value={eventData.poster || eventData.posterUrl}
                onChange={(imgData) => {
                  setEventData({
                    ...eventData,
                    poster: imgData,
                    posterUrl: imgData?.url || ''
                  });
                }}
              />

              <ImageUploader
                kind="banner"
                value={eventData.banner || eventData.bannerUrl}
                onChange={(imgData) => {
                  setEventData({
                    ...eventData,
                    banner: imgData,
                    bannerUrl: imgData?.url || ''
                  });
                }}
              />
            </div>
          </div>
        )}

        {/* STEP 4: Pricing */}
        {currentStep === 4 && (
          <div className="flex flex-col gap-md">
            <h3 className="font-heading font-bold text-white uppercase" style={{ fontSize: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              Step 4: Pricing & Registration Fees
            </h3>

            <div className="flex items-center gap-xl">
              <label className="flex items-center gap-xs font-bold text-white cursor-pointer" style={{ fontSize: '0.8125rem' }}>
                <input
                  type="radio"
                  name="isPaid"
                  checked={!eventData.isPaid}
                  onChange={() => setEventData({ ...eventData, isPaid: false, price: 0 })}
                />
                FREE ENTRY
              </label>

              <label className="flex items-center gap-xs font-bold text-white cursor-pointer" style={{ fontSize: '0.8125rem' }}>
                <input
                  type="radio"
                  name="isPaid"
                  checked={eventData.isPaid}
                  onChange={() => setEventData({ ...eventData, isPaid: true })}
                />
                PAID ENTRY (Razorpay)
              </label>
            </div>

            {eventData.isPaid && (
              <div className="form-group" style={{ maxWidth: '16rem', marginTop: '0.5rem' }}>
                <label className="form-label">Registration Fee (INR) *</label>
                <input
                  type="number"
                  min={1}
                  value={eventData.price}
                  onChange={(e) => setEventData({ ...eventData, price: parseFloat(e.target.value) || 0 })}
                  className="form-input"
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Capacity */}
        {currentStep === 5 && (
          <div className="flex flex-col gap-md">
            <h3 className="font-heading font-bold text-white uppercase" style={{ fontSize: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              Step 5: Capacity & Limits
            </h3>

            <div className="form-group" style={{ maxWidth: '16rem' }}>
              <label className="form-label">Maximum Participants Limit</label>
              <input
                type="number"
                min={1}
                value={eventData.capacity}
                onChange={(e) => setEventData({ ...eventData, capacity: parseInt(e.target.value, 10) || 0 })}
                className="form-input"
              />
            </div>
          </div>
        )}

        {/* STEP 6: Specifications */}
        {currentStep === 6 && (
          <div className="flex flex-col gap-md">
            <h3 className="font-heading font-bold text-white uppercase" style={{ fontSize: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              Step 6: Event Specific Requirements
            </h3>

            <div className="grid grid-2 gap-md">
              <div className="form-group">
                <label className="form-label">Format / Category Specs</label>
                <input
                  type="text"
                  placeholder="e.g. 21K Half Marathon / Drag Class 400m"
                  value={eventData.raceConfig.distance}
                  onChange={(e) => setEventData({
                    ...eventData,
                    raceConfig: { ...eventData.raceConfig, distance: e.target.value }
                  })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Safety Requirements</label>
                <input
                  type="text"
                  placeholder="e.g. Mandatory helmets, medical clearance"
                  value={eventData.raceConfig.safetyRequirements}
                  onChange={(e) => setEventData({
                    ...eventData,
                    raceConfig: { ...eventData.raceConfig, safetyRequirements: e.target.value }
                  })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="grid grid-2 gap-md" style={{ marginTop: '1rem' }}>
              <div className="form-group flex flex-col justify-center">
                <label className="flex items-center gap-xs font-bold text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eventData.hasLeaderboard}
                    onChange={(e) => setEventData({ ...eventData, hasLeaderboard: e.target.checked })}
                  />
                  Enable Leaderboard
                </label>
              </div>

              {eventData.hasLeaderboard && (
                <div className="form-group">
                  <label className="form-label">Leaderboard Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Fastest Laps"
                    value={eventData.leaderboardTitle}
                    onChange={(e) => setEventData({ ...eventData, leaderboardTitle: e.target.value })}
                    className="form-input"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 7: Participant Requirements & Questions */}
        {currentStep === 7 && (
          <ParticipantRequirementsBuilder
            category={eventData.category}
            config={eventData.registrationConfig}
            onChange={(newConfig) => {
              setEventData({
                ...eventData,
                registrationConfig: newConfig,
                customFields: newConfig.customFields
              });
            }}
          />
        )}

        {/* STEP 8: Review & Publish */}
        {currentStep === 8 && (
          <div className="flex flex-col gap-md">
            <h3 className="font-heading font-bold text-white uppercase" style={{ fontSize: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              Step 8: Review & Publish
            </h3>

            <div className="card-mono font-mono text-muted flex flex-col gap-xs" style={{ padding: '1rem', backgroundColor: 'var(--color-black)', fontSize: '0.75rem' }}>
              <p><strong className="text-white">Title:</strong> {eventData.title}</p>
              <p><strong className="text-white">Category:</strong> {eventData.category}</p>
              <p><strong className="text-white">Date:</strong> {eventData.eventDate}</p>
              <p><strong className="text-white">Venue:</strong> {eventData.venue}, {eventData.city}</p>
              <p><strong className="text-white">Pricing:</strong> {eventData.isPaid ? `₹${eventData.price}` : 'FREE'}</p>
              <p><strong className="text-white">Min Age Restriction:</strong> {eventData.registrationConfig?.minAge > 0 ? `${eventData.registrationConfig.minAge}+ years old` : 'None'}</p>
            </div>

            {/* Participant Data Collected Review */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Participant Data Collected On Checkout</h4>
              
              <div className="text-xs text-slate-300 space-y-1">
                <p><strong className="text-white">Required Profile Fields:</strong> {(eventData.registrationConfig?.requiredProfileFields || ['fullName', 'email', 'phone']).join(', ')}</p>
                <p><strong className="text-white">Race Specifications Required:</strong> {
                  Object.entries(eventData.registrationConfig?.raceFieldsConfig || {})
                    .filter(([, val]) => val === 'REQUIRED')
                    .map(([k]) => k)
                    .join(', ') || 'None'
                }</p>
                <p><strong className="text-white">Custom Questions ({eventData.registrationConfig?.customQuestions?.length || 0}):</strong></p>
                {(eventData.registrationConfig?.customQuestions || []).length > 0 ? (
                  <ul className="list-disc list-inside pl-2 text-slate-400 space-y-0.5">
                    {eventData.registrationConfig.customQuestions.map((q, idx) => (
                      <li key={idx}>
                        <span className="text-slate-200">{q.label}</span> ({q.type.toUpperCase()}){q.required ? ' *Required' : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-slate-500 italic"> No custom questions configured</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Publishing State *</label>
              <select
                value={eventData.status}
                onChange={(e) => setEventData({ ...eventData, status: e.target.value })}
                className="form-select"
              >
                <option value="PUBLISHED">PUBLISHED (Live on public website)</option>
                <option value="DRAFT">DRAFT (Internal review)</option>
              </select>
            </div>
          </div>
        )}

        {/* Wizard Controls Footer */}
        <div className="flex items-center justify-between" style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="btn btn-secondary btn-sm"
            >
              <ArrowLeft size={14} /> Previous
            </button>
          ) : <div />}

          {currentStep < 8 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="btn btn-primary btn-sm"
            >
              Next Step <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Creating Event...' : 'Publish Event'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
