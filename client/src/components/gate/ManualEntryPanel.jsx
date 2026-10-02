import React, { useState, useRef, useEffect } from 'react';
import { Keyboard, ArrowRight, X } from 'lucide-react';

export default function ManualEntryPanel({ onSubmitCode, isProcessing }) {
  const [passId, setPassId] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Auto focus on load
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!passId.trim() || isProcessing) return;
    onSubmitCode(passId.trim(), 'MANUAL');
    setPassId('');
  };

  const handleClear = () => {
    setPassId('');
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="card-mono gate-manual-panel">
      <div className="gate-manual-header">
        <div className="gate-manual-icon">
          <Keyboard size={16} />
        </div>
        <div>
          <h4 className="gate-manual-title">Manual Pass ID Check-in</h4>
          <p className="gate-manual-desc">Type registration ID or scan via hardware USB scanner</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="gate-manual-form">
        <div className="gate-manual-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={passId}
            onChange={(e) => setPassId(e.target.value.toUpperCase())}
            placeholder="e.g. PEAK-2026-123456"
            disabled={isProcessing}
            className="form-input gate-manual-input"
          />
          {passId && (
            <button
              type="button"
              onClick={handleClear}
              className="gate-manual-clear"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!passId.trim() || isProcessing}
          className="btn gate-btn-start"
        >
          Check In <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}
