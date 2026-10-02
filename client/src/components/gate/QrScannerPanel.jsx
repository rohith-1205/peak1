import React, { useEffect } from 'react';
import { Camera, CameraOff, Flashlight, SwitchCamera, AlertCircle, Play, Square } from 'lucide-react';
import useQrScanner from './useQrScanner';

export default function QrScannerPanel({ onScanResult, isProcessing }) {
  const {
    isScanning,
    cameras,
    selectedCameraId,
    hasPermission,
    errorMsg,
    isTorchOn,
    startScanner,
    stopScanner,
    switchCamera,
    toggleTorch
  } = useQrScanner({
    elementId: 'qr-reader-viewport',
    onScanSuccess: onScanResult,
    scanLockMs: 2500
  });

  return (
    <div className="card-mono gate-scanner-panel">
      {/* Viewport Frame */}
      <div className="gate-scanner-viewport-frame">
        {/* Render Html5Qrcode video container */}
        <div id="qr-reader-viewport" className="gate-scanner-viewport" />

        {/* HUD Laser Scan Animation overlay when scanning */}
        {isScanning && (
          <div className="gate-scanner-hud">
            {/* HUD Corner Reticles */}
            <div className="gate-hud-row justify-between">
              <div className="gate-hud-corner tl" />
              <div className="gate-hud-corner tr" />
            </div>

            {/* Scanning Laser Beam */}
            <div className="gate-hud-laser" />

            <div className="gate-hud-row justify-between">
              <div className="gate-hud-corner bl" />
              <div className="gate-hud-corner br" />
            </div>
          </div>
        )}

        {/* Idle / Off overlay */}
        {!isScanning && (
          <div className="gate-scanner-idle">
            <div className="gate-scanner-idle-icon">
              <Camera size={40} />
            </div>
            <h4 className="gate-scanner-idle-title">Camera Feed Stopped</h4>
            <p className="gate-scanner-idle-text">
              Click Start Scanner below to activate high-speed gate check-in scanning.
            </p>
            <button
              onClick={() => startScanner()}
              className="btn gate-btn-start"
            >
              <Play size={16} className="fill-current" /> Start Camera
            </button>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="gate-scanner-processing">
            <div className="gate-spinner" />
            <span className="gate-processing-text">Verifying Pass...</span>
          </div>
        )}
      </div>

      {/* Permission / Error Warning */}
      {errorMsg && (
        <div className="gate-scanner-error">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Scanner Control Bar */}
      <div className="gate-scanner-controls">
        <div className="flex gap-sm">
          {/* Main Toggle Button */}
          {isScanning ? (
            <button
              onClick={stopScanner}
              className="btn btn-danger flex-1"
            >
              <Square size={16} className="fill-current" /> Stop Camera
            </button>
          ) : (
            <button
              onClick={() => startScanner()}
              className="btn btn-primary flex-1 gate-btn-primary"
            >
              <Play size={16} className="fill-current" /> Start Camera
            </button>
          )}

          {/* Torch Button */}
          <button
            onClick={toggleTorch}
            disabled={!isScanning}
            className={`btn gate-btn-torch ${isTorchOn ? 'active' : ''}`}
            title="Toggle Flashlight"
          >
            <Flashlight size={20} />
          </button>
        </div>

        {/* Camera Selector Dropdown */}
        {cameras.length > 1 && (
          <div className="flex items-center gap-xs mt-2">
            <SwitchCamera size={16} className="text-muted" />
            <select
              value={selectedCameraId}
              onChange={(e) => switchCamera(e.target.value)}
              className="form-select gate-camera-select"
            >
              {cameras.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.label || `Camera ${cam.id}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
