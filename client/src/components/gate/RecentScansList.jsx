import React, { useState } from 'react';
import { History, RotateCcw, CheckCircle2, AlertTriangle, XCircle, QrCode, Keyboard } from 'lucide-react';

export default function RecentScansList({ scans = [], onUndoCheckIn, loadingUndo }) {
  const [undoItem, setUndoItem] = useState(null);
  const [undoReason, setUndoReason] = useState('');

  const handleConfirmUndo = (e) => {
    e.preventDefault();
    if (!undoItem || loadingUndo) return;
    onUndoCheckIn(undoItem.registrationId, undoReason);
    setUndoItem(null);
    setUndoReason('');
  };

  return (
    <div className="card-mono gate-scans-panel">
      <div className="gate-scans-header">
        <div className="flex items-center gap-sm">
          <div className="gate-scans-icon">
            <History size={16} />
          </div>
          <div>
            <h4 className="gate-scans-title">Live Check-in Feed</h4>
            <p className="gate-scans-desc">Recent check-in attempts in current session</p>
          </div>
        </div>

        <span className="badge gate-scans-count">
          {scans.length} Logged
        </span>
      </div>

      {scans.length === 0 ? (
        <div className="gate-scans-empty">
          <History size={32} className="gate-empty-icon" />
          <p className="gate-empty-title">No Check-in Activity Yet</p>
          <p className="gate-empty-desc">Scan a QR ticket or enter a Pass ID above to start checking in participants.</p>
        </div>
      ) : (
        <div className="gate-scans-list">
          {scans.map((scan, idx) => {
            const isGranted = scan.result === 'GRANTED';
            const isAlready = scan.result === 'ALREADY_CHECKED_IN';
            const isUndo = scan.result === 'UNDO';

            let resultClass = 'denied';
            let StatusIcon = XCircle;

            if (isGranted) {
              resultClass = 'granted';
              StatusIcon = CheckCircle2;
            } else if (isAlready) {
              resultClass = 'already';
              StatusIcon = AlertTriangle;
            } else if (isUndo) {
              resultClass = 'undo';
              StatusIcon = RotateCcw;
            }

            const timeStr = scan.timestamp ? new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now';

            return (
              <div
                key={scan._id || idx}
                className="gate-scan-item"
              >
                <div className="flex items-center gap-md min-w-0">
                  <div className={`gate-scan-icon ${resultClass}`}>
                    <StatusIcon size={16} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-xs">
                      <span className="gate-scan-name">
                        {scan.participantName || scan.registrationId || 'Unknown Pass'}
                      </span>
                      <span className={`badge gate-scan-badge ${resultClass}`}>
                        {scan.result}
                      </span>
                    </div>

                    <div className="gate-scan-meta">
                      <span className="font-mono">{scan.registrationId || 'N/A'}</span>
                      <span className="flex items-center gap-xs">
                        {scan.method === 'QR' ? <QrCode size={12} className="gate-icon-cyan" /> : <Keyboard size={12} className="text-amber" />}
                        {scan.method || 'QR'}
                      </span>
                      <span>{timeStr}</span>
                    </div>
                  </div>
                </div>

                {/* Action button: Undo Check-in */}
                {isGranted && scan.registrationId && (
                  <button
                    onClick={() => setUndoItem(scan)}
                    className="btn btn-sm gate-btn-undo"
                    title="Undo Check-in"
                  >
                    <RotateCcw size={14} /> Undo
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Undo Check-in Confirmation Modal */}
      {undoItem && (
        <div className="modal-overlay">
          <div className="modal-content gate-undo-modal">
            <h3 className="gate-modal-title">
              <RotateCcw size={20} className="text-amber" /> Confirm Check-in Reversal
            </h3>
            <p className="gate-modal-desc">
              Are you sure you want to revert check-in for participant{' '}
              <strong className="text-white">{undoItem.participantName || undoItem.registrationId}</strong>?
            </p>

            <form onSubmit={handleConfirmUndo}>
              <label className="form-label">Reason for Reversal (Optional)</label>
              <input
                type="text"
                value={undoReason}
                onChange={(e) => setUndoReason(e.target.value)}
                placeholder="e.g. Scanned by mistake / Wrong gate"
                className="form-input mt-1 mb-4"
              />

              <div className="flex justify-end gap-sm">
                <button
                  type="button"
                  onClick={() => setUndoItem(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingUndo}
                  className="btn gate-btn-confirm-undo"
                >
                  Revert Check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
