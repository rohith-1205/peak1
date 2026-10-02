import React, { useState, useEffect, useCallback } from 'react';
import { QrCode, Shield, RefreshCw } from 'lucide-react';
import adminApi from '../services/adminApi';
import { io } from 'socket.io-client';
import GateEventSelector from '../components/gate/GateEventSelector';
import QrScannerPanel from '../components/gate/QrScannerPanel';
import ManualEntryPanel from '../components/gate/ManualEntryPanel';
import CheckInResultCard from '../components/gate/CheckInResultCard';
import RecentScansList from '../components/gate/RecentScansList';
import { SOCKET_URL } from '../config/env';

export default function AdminGatePage() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [scanResult, setScanResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [loadingUndo, setLoadingUndo] = useState(false);

  // Fetch Published Events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await adminApi.get('/events');
        const list = data.data?.events || data.events || [];
        setEvents(list);
        if (list.length > 0) {
          setSelectedEventId(list[0]._id);
        }
      } catch (err) {
        console.error('Failed to load events for gate check-in:', err);
      }
    };
    fetchEvents();
  }, []);

  // Fetch Check-in Stats & Logs for Selected Event
  const fetchStatsAndLogs = useCallback(async () => {
    setLoadingStats(true);
    try {
      const queryParam = selectedEventId ? `?eventId=${selectedEventId}` : '';
      const [statsRes, logsRes] = await Promise.all([
        adminApi.get(`/registrations/admin/check-in/stats${queryParam}`),
        adminApi.get(`/registrations/admin/check-in/logs${queryParam}&limit=30`)
      ]);

      setStats(statsRes.data?.stats || statsRes.stats);

      const logsList = logsRes.data?.logs || logsRes.logs || [];
      const formattedLogs = logsList.map((log) => ({
        _id: log._id,
        registrationId: log.registrationId,
        participantName: log.registration?.participantDetails?.fullName || log.scannedCode,
        result: log.result,
        method: log.method,
        timestamp: log.createdAt
      }));
      setRecentScans(formattedLogs);
    } catch (err) {
      console.error('Failed to fetch gate stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    fetchStatsAndLogs();
  }, [fetchStatsAndLogs]);

  // Real-time WebSocket Updates
  useEffect(() => {
    const socket = io(SOCKET_URL);
    
    socket.on('checkInUpdated', (data) => {
      // If the event matches what the current gate is scanning (or if "All Events" is selected)
      if (!selectedEventId || data.eventId === selectedEventId) {
        fetchStatsAndLogs();
      }
    });

    return () => socket.disconnect();
  }, [selectedEventId, fetchStatsAndLogs]);
  // Handle Check-in Scan or Manual Submission
  const handleCheckInSubmit = async (scannedCode, method = 'QR') => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const response = await adminApi.post('/registrations/admin/check-in', {
        scannedCode,
        targetEventId: selectedEventId,
        method
      });

      const resData = response.data || response;
      const resultObj = {
        success: response.success ?? true,
        result: resData.result || 'GRANTED',
        message: response.message || 'Check-in processed',
        registration: resData.registration
      };

      setScanResult(resultObj);

      // Prepend to local feed
      const newEntry = {
        _id: Date.now().toString(),
        registrationId: resData.registration?.registrationId || scannedCode,
        participantName: resData.registration?.participantDetails?.fullName || scannedCode,
        result: resultObj.result,
        method,
        timestamp: new Date()
      };
      setRecentScans((prev) => [newEntry, ...prev.slice(0, 49)]);

      // Refresh Stats
      fetchStatsAndLogs();
    } catch (err) {
      const errResult = {
        success: false,
        result: err.errorCode || err.raw?.response?.data?.data?.result || 'DENIED',
        message: err.message || 'Check-in verification failed',
        registration: err.raw?.response?.data?.data?.registration || null
      };

      setScanResult(errResult);

      const newEntry = {
        _id: Date.now().toString(),
        registrationId: errResult.registration?.registrationId || scannedCode,
        participantName: errResult.registration?.participantDetails?.fullName || scannedCode,
        result: errResult.result,
        method,
        timestamp: new Date()
      };
      setRecentScans((prev) => [newEntry, ...prev.slice(0, 49)]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Undo Check-in
  const handleUndoCheckIn = async (registrationId, reason) => {
    setLoadingUndo(true);
    try {
      await adminApi.post('/registrations/admin/check-in/undo', {
        registrationId,
        reason
      });

      // Update feed locally
      setRecentScans((prev) =>
        prev.map((scan) =>
          scan.registrationId === registrationId ? { ...scan, result: 'UNDO' } : scan
        )
      );

      // Clear main result banner if it belonged to this reg
      if (scanResult?.registration?.registrationId === registrationId) {
        setScanResult(null);
      }

      // Refresh Stats
      fetchStatsAndLogs();
    } catch (err) {
      alert(err.message || 'Failed to revert check-in');
    } finally {
      setLoadingUndo(false);
    }
  };

  return (
    <div className="page-wrapper admin-gate-page" style={{ paddingTop: '1.5rem' }}>
      {/* Top Header */}
      <div className="flex flex-col gap-sm">
        <div className="flex items-center gap-xs" style={{ color: 'var(--accent-cyan)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Shield size={16} /> Gate Management Console
        </div>
        <h1 className="page-title">
          QR Scanner & Participant Gate Check-in
        </h1>
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>
          High-speed camera verification, HMAC signature validation & real-time entry monitoring.
        </p>
      </div>

      {/* Event Selector & Metrics Bar */}
      <GateEventSelector
        events={events}
        selectedEventId={selectedEventId}
        onSelectEvent={(id) => setSelectedEventId(id)}
        stats={stats}
        loadingStats={loadingStats}
        onRefreshStats={fetchStatsAndLogs}
      />

      {/* Main Scan Result Banner */}
      <CheckInResultCard scanResult={scanResult} onClear={() => setScanResult(null)} />

      {/* Split Control & Feed View */}
      <div className="admin-gate-layout">
        {/* Left Column: Scanner & Manual Entry */}
        <div className="admin-gate-scanner-col flex flex-col gap-xl">
          {/* Camera Viewfinder */}
          <QrScannerPanel onScanResult={(code) => handleCheckInSubmit(code, 'QR')} isProcessing={isProcessing} />

          {/* Manual Entry Form */}
          <ManualEntryPanel onSubmitCode={(code) => handleCheckInSubmit(code, 'MANUAL')} isProcessing={isProcessing} />
        </div>

        {/* Right Column: Live Feed & Undo */}
        <div className="admin-gate-feed-col">
          <RecentScansList scans={recentScans} onUndoCheckIn={handleUndoCheckIn} loadingUndo={loadingUndo} />
        </div>
      </div>
    </div>
  );
}
