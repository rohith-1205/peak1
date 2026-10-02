import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, User, Phone, MapPin, Tag, Calendar, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Web Audio API Audio Synthesizer helper
const playAudioFeedback = (type) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'GRANTED') {
      // High double chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.25);
    } else if (type === 'ALREADY_CHECKED_IN') {
      // Dual tone warning chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(330, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else {
      // Low sawtooth error buzzer
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(165, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    }
  } catch (e) {
    console.warn('Audio feedback failed:', e);
  }
};

export default function CheckInResultCard({ scanResult, onClear }) {
  useEffect(() => {
    if (scanResult) {
      // Trigger Web Audio sound
      playAudioFeedback(scanResult.result);

      // Trigger Haptic feedback if available
      if ('vibrate' in navigator) {
        if (scanResult.result === 'GRANTED') {
          navigator.vibrate([100]);
        } else if (scanResult.result === 'ALREADY_CHECKED_IN') {
          navigator.vibrate([150, 100, 150]);
        } else {
          navigator.vibrate([200, 100, 200]);
        }
      }
    }
  }, [scanResult]);

  if (!scanResult) return null;

  const { success, result, message, registration } = scanResult;
  const participant = registration?.participantDetails || {};
  const race = registration?.raceDetails || {};
  const snapshot = registration?.participantSnapshot || {};

  // Status Styling Configuration
  const isGranted = result === 'GRANTED';
  const isAlready = result === 'ALREADY_CHECKED_IN';

  let resultClass = 'denied';
  let Icon = XCircle;
  let statusTitle = 'ENTRY DENIED';

  if (isGranted) {
    resultClass = 'granted';
    Icon = CheckCircle2;
    statusTitle = 'ENTRY GRANTED';
  } else if (isAlready) {
    resultClass = 'already';
    Icon = AlertTriangle;
    statusTitle = 'PASS ALREADY USED';
  } else if (result === 'PASS_NOT_FOUND') {
    statusTitle = 'ENTRY DENIED: PASS NOT FOUND';
  } else if (result === 'REGISTRATION_CANCELLED') {
    statusTitle = 'ENTRY DENIED: REGISTRATION CANCELLED';
  } else if (result === 'WRONG_EVENT') {
    statusTitle = 'ENTRY DENIED: WRONG EVENT PASS';
  } else if (result === 'PAYMENT_PENDING') {
    statusTitle = 'ENTRY DENIED: PAYMENT PENDING';
  } else if (result === 'INVALID_SIGNATURE') {
    statusTitle = 'ENTRY DENIED: TAMPERED SIGNATURE';
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`gate-result-card ${resultClass}`}
      >
        {/* Banner Header */}
        <div className="gate-result-header">
          <div className="flex items-start gap-md">
            <div className="gate-result-icon">
              <Icon size={32} />
            </div>
            <div>
              <div className="flex items-center gap-xs">
                <span className="gate-result-title">{statusTitle}</span>
                <span className="badge gate-result-badge">
                  {result}
                </span>
              </div>
              <p className="gate-result-msg">{message}</p>
            </div>
          </div>

          <button
            onClick={onClear}
            className="btn btn-sm gate-btn-dismiss"
          >
            Dismiss
          </button>
        </div>

        {/* Participant Information Card if Registration exists */}
        {registration && (
          <div className="gate-result-info-grid">
            {/* Participant Bio */}
            <div className="gate-info-box">
              <span className="gate-info-label">
                <User size={14} className="gate-icon-cyan" /> Participant Info
              </span>
              <p className="gate-info-value">{participant.fullName || 'N/A'}</p>
              <p className="gate-info-sub">{participant.email || ''}</p>
              <p className="gate-info-sub flex items-center gap-xs mt-1">
                <Phone size={12} className="gate-icon-cyan" /> {participant.phone || 'N/A'}
              </p>
            </div>

            {/* Race Details */}
            <div className="gate-info-box">
              <span className="gate-info-label">
                <Tag size={14} className="gate-icon-cyan" /> Race Category & Vehicle
              </span>
              <p className="gate-info-value text-cyan">
                {race.categoryClass || registration.eventId?.category || 'Standard Race'}
              </p>
              {race.teamName && (
                <p className="gate-info-sub mt-1">
                  Team: <span className="text-white font-semibold">{race.teamName}</span>
                </p>
              )}
              {race.vehicleNumber && (
                <p className="gate-info-sub">
                  Vehicle: <span className="text-white font-mono font-bold">{race.vehicleNumber}</span> ({race.vehicleModel || ''})
                </p>
              )}
            </div>

            {/* Pass Metadata */}
            <div className="gate-info-box">
              <span className="gate-info-label">
                <ShieldAlert size={14} className="gate-icon-cyan" /> Pass Metadata
              </span>
              <p className="font-mono font-bold text-white text-sm">{registration.registrationId}</p>
              <p className="gate-info-sub mt-1">
                City: <span className="font-medium text-white">{participant.city || snapshot.city || 'N/A'}</span>
              </p>
              <p className="gate-info-sub">
                Emergency: <span className="font-medium text-white">{snapshot.emergencyContactName || participant.emergencyContact || 'N/A'}</span>
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
