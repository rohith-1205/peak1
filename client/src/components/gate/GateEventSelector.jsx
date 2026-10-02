import React from 'react';
import { RefreshCw, QrCode, Users, CheckCircle2, Clock, Calendar } from 'lucide-react';

export default function GateEventSelector({
  events = [],
  selectedEventId,
  onSelectEvent,
  stats,
  loadingStats,
  onRefreshStats
}) {
  const currentEvent = events.find((e) => e._id === selectedEventId);

  return (
    <div className="card-mono gate-selector-card mb-6">
      <div className="gate-selector-header">
        {/* Event Selector Dropdown */}
        <div className="gate-selector-input-group">
          <label className="form-label gate-label">
            <Calendar size={14} className="gate-icon-cyan" /> Select Gate Check-in Event
          </label>
          <select
            value={selectedEventId || ''}
            onChange={(e) => onSelectEvent(e.target.value)}
            className="form-select"
          >
            <option value="">-- All Events (Global Check-in) --</option>
            {events.map((evt) => (
              <option key={evt._id} value={evt._id}>
                {evt.title} ({new Date(evt.eventDate).toLocaleDateString()}) - {evt.city}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh Action */}
        <div className="gate-selector-actions">
          <button
            onClick={onRefreshStats}
            disabled={loadingStats}
            className="btn btn-secondary"
            title="Refresh Check-in Metrics"
          >
            <RefreshCw size={14} className={`gate-icon-cyan ${loadingStats ? 'spin' : ''}`} />
            Refresh Metrics
          </button>
        </div>
      </div>

      {/* Live Check-in Metrics Header Banner */}
      {stats && (
        <div className="gate-metrics-grid mt-5">
          {/* Confirmed */}
          <div className="gate-metric-card">
            <div className="gate-metric-icon bg-blue">
              <Users size={20} />
            </div>
            <div>
              <p className="gate-metric-label">Total Confirmed</p>
              <p className="gate-metric-value">{stats.totalConfirmed || 0}</p>
            </div>
          </div>

          {/* Checked In */}
          <div className="gate-metric-card">
            <div className="gate-metric-icon bg-emerald">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="gate-metric-label">Checked In</p>
              <p className="gate-metric-value text-emerald">{stats.totalCheckedIn || 0}</p>
            </div>
          </div>

          {/* Remaining */}
          <div className="gate-metric-card">
            <div className="gate-metric-icon bg-amber">
              <Clock size={20} />
            </div>
            <div>
              <p className="gate-metric-label">Remaining</p>
              <p className="gate-metric-value text-amber">{stats.remaining || 0}</p>
            </div>
          </div>

          {/* Progress % */}
          <div className="gate-metric-card progress-card">
            <div className="gate-progress-header">
              <span className="gate-metric-label">Progress</span>
              <span className="gate-progress-pct">{stats.percentage || 0}%</span>
            </div>
            <div className="gate-progress-track">
              <div
                className="gate-progress-fill"
                style={{ width: `${Math.min(100, stats.percentage || 0)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
