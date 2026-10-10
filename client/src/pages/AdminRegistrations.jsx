import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import adminApi from '../services/adminApi';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Download, Search, QrCode, X, CheckCircle2, AlertCircle, Eye, Trash2, Filter, AlertTriangle, Award, PlusCircle
} from 'lucide-react';

export default function AdminRegistrations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialEventId = searchParams.get('eventId') || '';

  const { showToast } = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [eventFilter, setEventFilter] = useState(initialEventId);

  // Detail Modal State
  const [selectedReg, setSelectedReg] = useState(null);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [regToDelete, setRegToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Gate Check-in Modal State
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkInInput, setCheckInInput] = useState('');
  const [checkInResult, setCheckInResult] = useState(null);
  const [checkInError, setCheckInError] = useState('');
  const [processingCheckIn, setProcessingCheckIn] = useState(false);

  // Leaderboard Modal State
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
  const [regForLeaderboard, setRegForLeaderboard] = useState(null);
  const [leaderboardScore, setLeaderboardScore] = useState('');
  const [leaderboardRank, setLeaderboardRank] = useState('');
  const [updatingLeaderboard, setUpdatingLeaderboard] = useState(false);

  // Manual Registration State
  const [manualRegModalOpen, setManualRegModalOpen] = useState(false);
  const [manualRegEventId, setManualRegEventId] = useState('');
  const [manualRegSubmitting, setManualRegSubmitting] = useState(false);
  const [manualRegData, setManualRegData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    vehicleModel: '',
    vehicleNumber: '',
    teamName: '',
    isCheckedIn: false
  });

  // Fetch Event List for Filter Dropdown
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await adminApi.get('/events?limit=100');
        if (res.success && res.data?.events) {
          setEventsList(res.data.events);
        }
      } catch (err) {
        console.error('Error fetching event dropdown list:', err);
      }
    };
    loadEvents();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (eventFilter) params.append('eventId', eventFilter);
      params.append('limit', '50');

      const res = await adminApi.get(`/registrations/admin/list?${params.toString()}`);
      if (res.success && res.data?.registrations) {
        setRegistrations(res.data.registrations);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch registrations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [statusFilter, eventFilter]);

  const handleEventFilterChange = (e) => {
    const newEvtId = e.target.value;
    setEventFilter(newEvtId);
    if (newEvtId) {
      setSearchParams({ eventId: newEvtId });
    } else {
      setSearchParams({});
    }
  };

  const handleExportPDF = async () => {
    try {
      const params = new URLSearchParams();
      if (eventFilter) params.append('eventId', eventFilter);
      if (statusFilter) params.append('status', statusFilter);

      const blob = await adminApi.get(`/registrations/admin/export?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `participants_roster_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err.message || 'Failed to download PDF roster', 'error');
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (eventFilter) params.append('eventId', eventFilter);
      if (statusFilter) params.append('status', statusFilter);

      const blob = await adminApi.get(`/registrations/admin/export/csv?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `participants_roster_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err.message || 'Failed to download CSV roster', 'error');
    }
  };

  const handlePerformCheckIn = async (e) => {
    e.preventDefault();
    setProcessingCheckIn(true);
    setCheckInResult(null);
    setCheckInError('');

    try {
      const res = await adminApi.post('/registrations/admin/check-in', {
        registrationId: checkInInput.trim()
      });

      if (res.success && res.data?.registration) {
        setCheckInResult(res.data.registration);
        showToast('Participant Checked In Successfully!', 'success');
        fetchRegistrations();
      }
    } catch (err) {
      setCheckInError(err.message || 'Check-in failed. Verify registration ID.');
    } finally {
      setProcessingCheckIn(false);
    }
  };

  const confirmDeleteRegistration = (reg) => {
    setRegToDelete(reg);
    setDeleteModalOpen(true);
  };

  const handleExecuteDeleteReg = async () => {
    if (!regToDelete) return;
    setDeleting(true);
    try {
      const res = await adminApi.delete(`/registrations/admin/${regToDelete._id}`);
      if (res.success) {
        showToast(`Registration "${regToDelete.registrationId}" deleted successfully`, 'success');
        setDeleteModalOpen(false);
        setRegToDelete(null);
        if (selectedReg?._id === regToDelete._id) setSelectedReg(null);
        fetchRegistrations();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete registration', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateLeaderboard = async (e) => {
    e.preventDefault();
    if (!regForLeaderboard) return;
    setUpdatingLeaderboard(true);
    try {
      const payload = {};
      if (leaderboardScore !== '') payload.leaderboardScore = Number(leaderboardScore);
      if (leaderboardRank !== '') payload.leaderboardRank = Number(leaderboardRank);

      const res = await adminApi.put(`/registrations/admin/${regForLeaderboard._id}/leaderboard`, payload);
      if (res.success) {
        showToast('Leaderboard details updated', 'success');
        setLeaderboardModalOpen(false);
        fetchRegistrations();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update leaderboard', 'error');
    } finally {
      setUpdatingLeaderboard(false);
    }
  };

  const handleManualRegSubmit = async (e) => {
    e.preventDefault();
    if (!manualRegEventId) {
      showToast('Please select an event for the registration', 'error');
      return;
    }
    setManualRegSubmitting(true);
    try {
      const res = await adminApi.post(`/registrations/admin/event/${manualRegEventId}/manual-register`, manualRegData);
      if (res.success) {
        showToast('Manual registration created successfully', 'success');
        setManualRegModalOpen(false);
        setManualRegData({
          fullName: '', email: '', phone: '', city: '',
          vehicleModel: '', vehicleNumber: '', teamName: '', isCheckedIn: false
        });
        setManualRegEventId('');
        fetchRegistrations();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create manual registration', 'error');
    } finally {
      setManualRegSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-lg">
      {/* Header */}
      <div className="card-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md p-4" style={{ backgroundColor: 'var(--bg-glass-card)', borderColor: 'var(--border-subtle)', borderRadius: '12px' }}>
        <div>
          <span className="label-eyebrow" style={{ color: 'var(--accent-cyan)' }}>GATE CONTROL</span>
          <h1 className="page-title" style={{ marginTop: '0.25rem', fontSize: '1.35rem', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
            PARTICIPANT ROSTER & CHECK-IN
          </h1>
        </div>

        <div className="flex items-center gap-sm flex-wrap w-full sm:w-auto">
          <button
            onClick={() => {
              setCheckInModalOpen(true);
              setCheckInInput('');
              setCheckInResult(null);
              setCheckInError('');
            }}
            className="btn btn-primary btn-sm flex-1 sm:flex-initial justify-center"
          >
            <QrCode size={14} /> Live QR Gate Check-in
          </button>
          <button 
            onClick={() => setManualRegModalOpen(true)} 
            className="btn btn-secondary btn-sm flex-1 sm:flex-initial justify-center"
            style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(34,211,238,0.3)' }}
          >
            <PlusCircle size={14} /> Add Manual Entry
          </button>
          <button onClick={handleExportPDF} className="btn btn-secondary btn-sm flex-1 sm:flex-initial justify-center">
            <Download size={14} /> Export PDF Roster
          </button>
          <button onClick={handleExportCSV} className="btn btn-secondary btn-sm flex-1 sm:flex-initial justify-center">
            <Download size={14} /> Export CSV Roster
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-mono p-3" style={{ backgroundColor: 'var(--bg-glass-card)', borderColor: 'var(--border-subtle)', borderRadius: '12px' }}>
        <div className="flex flex-col md:flex-row gap-sm items-center justify-between">
          <div style={{ position: 'relative', flex: 1, width: '100%' }}>
            <Search size={14} className="text-dim" style={{ position: 'absolute', left: '0.75rem', top: '0.65rem' }} />
            <input
              type="text"
              placeholder="Search Pass ID, Name, Email, Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchRegistrations()}
              className="form-input"
              style={{ paddingLeft: '2.25rem', paddingBlock: '0.45rem', fontSize: '0.8125rem' }}
            />
          </div>

          <div className="flex flex-row gap-sm w-full md:w-auto" style={{ minWidth: '22rem' }}>
            {/* Event Filter Selector */}
            <select
              value={eventFilter}
              onChange={handleEventFilterChange}
              className="form-select"
              style={{ paddingBlock: '0.45rem', fontSize: '0.8125rem', flex: 1 }}
            >
              <option value="">All Events</option>
              {eventsList.map((evt) => (
                <option key={evt._id} value={evt._id}>
                  {evt.title}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ paddingBlock: '0.45rem', fontSize: '0.8125rem', flex: 1 }}
            >
              <option value="">All Statuses</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CHECKED_IN">CHECKED IN</option>
              <option value="PAYMENT_PENDING">PAYMENT PENDING</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card-mono" style={{ padding: '0.5rem', backgroundColor: 'var(--bg-glass-card)', borderColor: 'var(--border-subtle)', borderRadius: '12px' }}>
        {loading ? (
          <div className="text-center text-muted" style={{ padding: '2.5rem' }}>Loading participant roster...</div>
        ) : registrations.length > 0 ? (
          <div className="table-container" style={{ border: 'none', borderRadius: '8px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pass ID</th>
                  <th>Participant Name</th>
                  <th>Event & Category</th>
                  <th>Contact</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Gate Entry</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg._id}>
                    <td className="font-mono font-bold text-white whitespace-nowrap">{reg.registrationId}</td>
                    <td className="font-bold text-white whitespace-nowrap">{reg.participantDetails?.fullName}</td>
                    <td>
                      <div className="flex flex-col gap-3xs">
                        <span className="font-bold text-white" style={{ fontSize: '0.8125rem' }}>
                          {reg.eventId?.title || 'N/A'}
                        </span>
                        {reg.eventId?.category && (
                          <span 
                            className="badge badge-amber font-mono" 
                            style={{ fontSize: '0.6rem', width: 'fit-content', padding: '0.05rem 0.35rem' }}
                          >
                            {reg.eventId.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-3xs">
                        <span className="text-white font-medium" style={{ fontSize: '0.8125rem' }}>
                          {reg.participantDetails?.email}
                        </span>
                        <span className="text-dim font-mono" style={{ fontSize: '0.725rem' }}>
                          {reg.participantDetails?.phone}
                        </span>
                      </div>
                    </td>
                    <td className="text-muted whitespace-nowrap" style={{ fontSize: '0.8125rem' }}>
                      {reg.participantDetails?.city || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap">
                      <StatusBadge status={reg.status} />
                    </td>
                    <td className="whitespace-nowrap">
                      {reg.checkInDetails?.isCheckedIn ? (
                        <span className="badge badge-emerald" style={{ padding: '0.15rem 0.45rem', fontSize: '0.65rem' }}>
                          <CheckCircle2 size={11} /> Checked In
                        </span>
                      ) : (
                        <span className="text-dim" style={{ fontSize: '0.75rem' }}>Pending Gate Entry</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }} className="whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2xs">
                        <button
                          type="button"
                          onClick={() => setSelectedReg(reg)}
                          className="btn btn-secondary btn-xs"
                          title="View Full Participant Metadata"
                        >
                          <Eye size={13} /> Details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRegForLeaderboard(reg);
                            setLeaderboardScore(reg.leaderboardScore !== undefined && reg.leaderboardScore !== null ? String(reg.leaderboardScore) : '');
                            setLeaderboardRank(reg.leaderboardRank !== undefined && reg.leaderboardRank !== null ? String(reg.leaderboardRank) : '');
                            setLeaderboardModalOpen(true);
                          }}
                          className="btn btn-secondary btn-xs"
                          style={{ color: 'var(--accent-amber)', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                          title="Edit Rank & Score for Leaderboard"
                        >
                          <Award size={13} /> Leaderboard
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDeleteRegistration(reg)}
                          className="btn btn-ghost btn-xs"
                          style={{ color: 'var(--accent-rose)' }}
                          title="Delete Registration Record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-muted" style={{ padding: '3rem' }}>No participant registrations found.</div>
        )}
      </div>

      {/* Participant Detail Modal */}
      {selectedReg && (
        <div className="modal-overlay">
          <div className="modal-content flex flex-col gap-md" style={{ maxWidth: '34rem' }}>
            <button
              onClick={() => setSelectedReg(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div className="text-left">
              <span className="label-eyebrow">PARTICIPANT RECORD</span>
              <h3 className="section-title" style={{ marginTop: '0.25rem' }}>
                {selectedReg.participantDetails?.fullName}
              </h3>
              <p className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>Pass ID: {selectedReg.registrationId}</p>
            </div>

            <div className="card-mono flex flex-col gap-sm" style={{ padding: '1rem', backgroundColor: 'var(--color-black)', fontSize: '0.8125rem' }}>
              <p><strong className="text-white">Event:</strong> {selectedReg.eventId?.title || 'N/A'}</p>
              <p><strong className="text-white">Email:</strong> {selectedReg.participantDetails?.email}</p>
              <p><strong className="text-white">Phone:</strong> {selectedReg.participantDetails?.phone}</p>
              <p><strong className="text-white">City:</strong> {selectedReg.participantDetails?.city || 'N/A'}</p>
              {selectedReg.participantDetails?.tShirtSize && (
                <p><strong className="text-white">T-Shirt Size:</strong> {selectedReg.participantDetails.tShirtSize}</p>
              )}
              {selectedReg.participantDetails?.bloodGroup && (
                <p><strong className="text-white">Blood Group:</strong> {selectedReg.participantDetails.bloodGroup}</p>
              )}
              {selectedReg.participantDetails?.emergencyContact && (
                <p><strong className="text-white">Emergency Contact:</strong> {selectedReg.participantDetails.emergencyContact}</p>
              )}
              <p><strong className="text-white">Status:</strong> {selectedReg.status}</p>
            </div>

            {/* Race Details */}
            {selectedReg.raceDetails && Object.keys(selectedReg.raceDetails).some(k => selectedReg.raceDetails[k]) && (
              <div className="card-mono flex flex-col gap-xs" style={{ padding: '1rem', fontSize: '0.8125rem' }}>
                <span className="label-eyebrow" style={{ fontSize: '0.65rem' }}>RACE SPECIFICATIONS</span>
                {selectedReg.raceDetails.teamName && <p><strong className="text-white">Team Name:</strong> {selectedReg.raceDetails.teamName}</p>}
                {selectedReg.raceDetails.categoryClass && <p><strong className="text-white">Category Class:</strong> {selectedReg.raceDetails.categoryClass}</p>}
                {selectedReg.raceDetails.vehicleModel && <p><strong className="text-white">Vehicle Model:</strong> {selectedReg.raceDetails.vehicleModel}</p>}
                {selectedReg.raceDetails.vehicleNumber && <p><strong className="text-white">Vehicle Number:</strong> {selectedReg.raceDetails.vehicleNumber}</p>}
                {selectedReg.raceDetails.drivingLicense && <p><strong className="text-white">Driving License:</strong> {selectedReg.raceDetails.drivingLicense}</p>}
              </div>
            )}

            {/* Custom Form Responses with LABELS */}
            {selectedReg.customResponses && Object.keys(selectedReg.customResponses).length > 0 && (
              <div className="card-mono flex flex-col gap-xs" style={{ padding: '1rem', fontSize: '0.8125rem' }}>
                <span className="label-eyebrow" style={{ fontSize: '0.65rem' }}>CUSTOM FORM RESPONSES</span>
                {Object.entries(selectedReg.customResponses).map(([fieldId, val]) => {
                  const questionsList = selectedReg.eventId?.registrationConfig?.customQuestions || selectedReg.eventId?.customFields || [];
                  const qObj = questionsList.find(q => (q.fieldId || q.id) === fieldId);
                  const label = qObj ? qObj.label : fieldId;
                  return (
                    <p key={fieldId}>
                      <strong className="text-white">{label}:</strong> {Array.isArray(val) ? val.join(', ') : String(val)}
                    </p>
                  );
                })}
              </div>
            )}

            {/* QR Pass Preview */}
            <div className="flex justify-between items-center card-mono p-4" style={{ backgroundColor: '#FFFFFF', borderRadius: '8px' }}>
              <div className="text-black">
                <p className="font-bold uppercase" style={{ fontSize: '0.875rem' }}>Peak1 Gate Ticket</p>
                <p className="font-mono text-xs text-neutral-600">{selectedReg.registrationId}</p>
              </div>
              <QRCodeSVG value={selectedReg.registrationId} size={90} />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => confirmDeleteRegistration(selectedReg)}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--accent-rose)' }}
              >
                <Trash2 size={14} /> Delete Pass Record
              </button>
              <button
                type="button"
                onClick={() => setSelectedReg(null)}
                className="btn btn-secondary btn-sm"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Registration Confirmation Modal */}
      {deleteModalOpen && regToDelete && (
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
              <span className="label-eyebrow" style={{ color: 'var(--accent-rose)' }}>CONFIRM DELETION</span>
            </div>

            <h3 className="section-title">DELETE PARTICIPANT RECORD?</h3>
            <p className="text-muted" style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
              Are you sure you want to delete registration <strong className="text-white font-mono">{regToDelete.registrationId}</strong> for participant <strong className="text-white">{regToDelete.participantDetails?.fullName}</strong>?
              This action cannot be undone.
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
                onClick={handleExecuteDeleteReg}
                className="btn btn-primary btn-sm"
                style={{ backgroundColor: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}
              >
                {deleting ? 'Deleting...' : 'Confirm Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live QR Gate Check-in Scanner Modal */}
      {checkInModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content flex flex-col gap-md">
            <button
              onClick={() => setCheckInModalOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div className="text-center">
              <span className="label-eyebrow">GATE VERIFIER</span>
              <h3 className="section-title" style={{ marginTop: '0.25rem' }}>LIVE QR CHECK-IN</h3>
            </div>

            <form onSubmit={handlePerformCheckIn} className="flex flex-col gap-md">
              <div className="form-group">
                <label className="form-label">Registration Pass ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PEAK-2026-881920"
                  value={checkInInput}
                  onChange={(e) => setCheckInInput(e.target.value)}
                  className="form-input font-mono uppercase"
                />
              </div>

              <button type="submit" disabled={processingCheckIn} className="btn btn-primary w-full">
                {processingCheckIn ? 'Verifying Pass...' : 'Verify Pass & Grant Entry'}
              </button>
            </form>

            {checkInResult && (
              <div className="card-mono" style={{ padding: '1rem', backgroundColor: 'var(--accent-emerald-bg)', borderColor: 'var(--accent-emerald)' }}>
                <div className="flex items-center gap-xs font-bold text-white" style={{ color: 'var(--accent-emerald)', marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={16} /> VERIFIED ENTRY GRANTED
                </div>
                <p className="text-white" style={{ fontSize: '0.8125rem' }}>Pass ID: {checkInResult.registrationId}</p>
                <p className="text-muted" style={{ fontSize: '0.75rem' }}>Participant: {checkInResult.participantDetails?.fullName}</p>
              </div>
            )}

            {checkInError && (
              <div className="card-mono" style={{ padding: '1rem', backgroundColor: 'var(--accent-rose-bg)', borderColor: 'var(--accent-rose)' }}>
                <div className="flex items-center gap-xs font-bold" style={{ color: 'var(--accent-rose)', marginBottom: '0.25rem' }}>
                  <AlertCircle size={16} /> ENTRY DENIED
                </div>
                <p className="text-white" style={{ fontSize: '0.75rem' }}>{checkInError}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard Edit Modal */}
      {leaderboardModalOpen && regForLeaderboard && (
        <div className="modal-overlay">
          <div className="modal-content flex flex-col gap-md">
            <button
              onClick={() => setLeaderboardModalOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div className="text-left">
              <span className="label-eyebrow" style={{ color: 'var(--accent-amber)' }}>LEADERBOARD TIMING CONSOLE</span>
              <h3 className="section-title" style={{ marginTop: '0.25rem' }}>
                {regForLeaderboard.eventId?.leaderboardTitle || 'Official Standings'}
              </h3>
              <p className="text-muted" style={{ fontSize: '0.75rem' }}>Event: {regForLeaderboard.eventId?.title}</p>
            </div>

            <div className="card-mono p-3 font-mono flex flex-col gap-xs text-xs" style={{ backgroundColor: 'var(--color-black)', borderLeft: '3px solid var(--accent-amber)' }}>
              <div className="flex justify-between">
                <span className="text-muted">PARTICIPANT:</span>
                <span className="font-bold text-white">{regForLeaderboard.participantDetails?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">PASS ID:</span>
                <span className="text-cyan-400">{regForLeaderboard.registrationId}</span>
              </div>
              {regForLeaderboard.raceDetails?.vehicleModel && (
                <div className="flex justify-between">
                  <span className="text-muted">VEHICLE / CLASS:</span>
                  <span className="text-amber-300">{regForLeaderboard.raceDetails.vehicleModel} ({regForLeaderboard.raceDetails.vehicleNumber || 'No Bib'})</span>
                </div>
              )}
            </div>

            <form onSubmit={handleUpdateLeaderboard} className="flex flex-col gap-md">
              <div className="form-group">
                <label className="form-label">Leaderboard Rank / Position (#1, #2...)</label>
                <input
                  type="number"
                  placeholder="e.g. 1 (Leave blank to remove from podium)"
                  value={leaderboardRank}
                  onChange={(e) => setLeaderboardRank(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Score / Timing (Points / Seconds)</label>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={leaderboardScore}
                  onChange={(e) => setLeaderboardScore(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="flex justify-end gap-sm" style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setLeaderboardModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingLeaderboard}
                  className="btn btn-primary btn-sm"
                  style={{ backgroundColor: 'var(--accent-amber)', borderColor: 'var(--accent-amber)', color: '#000000' }}
                >
                  {updatingLeaderboard ? 'Saving...' : 'Save Leaderboard Rank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Registration Modal */}
      {manualRegModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content flex flex-col gap-md">
            <button
              onClick={() => setManualRegModalOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            
            <div className="modal-header">
              <h3 className="section-title flex items-center gap-sm" style={{ fontSize: '1.1rem' }}>
                <PlusCircle size={18} className="text-cyan" /> ADD MANUAL ENTRY
              </h3>
            </div>
            <form onSubmit={handleManualRegSubmit} className="modal-body flex flex-col gap-md">
              <div className="form-group">
                <label className="form-label">Select Target Event <span className="text-rose">*</span></label>
                <select
                  required
                  value={manualRegEventId}
                  onChange={(e) => setManualRegEventId(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Choose an Event --</option>
                  {eventsList.map(evt => (
                    <option key={evt._id} value={evt._id}>{evt.title}</option>
                  ))}
                </select>
                <span className="form-hint">Closed and Published events are eligible. Capacity limits will be bypassed.</span>
              </div>

              <div className="grid grid-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Full Name <span className="text-rose">*</span></label>
                  <input
                    required
                    type="text"
                    className="form-input"
                    value={manualRegData.fullName}
                    onChange={e => setManualRegData({...manualRegData, fullName: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email <span className="text-rose">*</span></label>
                  <input
                    required
                    type="email"
                    className="form-input"
                    value={manualRegData.email}
                    onChange={e => setManualRegData({...manualRegData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Phone <span className="text-rose">*</span></label>
                  <input
                    required
                    type="tel"
                    className="form-input"
                    value={manualRegData.phone}
                    onChange={e => setManualRegData({...manualRegData, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    value={manualRegData.city}
                    onChange={e => setManualRegData({...manualRegData, city: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Vehicle Model (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={manualRegData.vehicleModel}
                    onChange={e => setManualRegData({...manualRegData, vehicleModel: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Number (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={manualRegData.vehicleNumber}
                    onChange={e => setManualRegData({...manualRegData, vehicleNumber: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group flex items-center justify-between mt-2 card-mono p-3">
                <div>
                  <label className="form-label" style={{ marginBottom: 0 }}>Mark as Checked In</label>
                  <span className="form-hint">Automatically admit this participant at the gate.</span>
                </div>
                <input
                  type="checkbox"
                  checked={manualRegData.isCheckedIn}
                  onChange={e => setManualRegData({...manualRegData, isCheckedIn: e.target.checked})}
                  style={{ width: '1.25rem', height: '1.25rem' }}
                />
              </div>

              <div className="modal-footer mt-4">
                <button type="button" onClick={() => setManualRegModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={manualRegSubmitting} className="btn btn-primary">
                  {manualRegSubmitting ? 'Creating Entry...' : 'Create Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
