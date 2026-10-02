import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function useQrScanner({ elementId = 'qr-reader-viewport', onScanSuccess, scanLockMs = 3000 }) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [hasPermission, setHasPermission] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isTorchOn, setIsTorchOn] = useState(false);

  const scannerRef = useRef(null);
  const lastScannedRef = useRef({ code: '', time: 0 });

  // Get Available Cameras
  const fetchCameras = useCallback(async () => {
    try {
      setErrorMsg('');
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        setHasPermission(true);
        // Default to back/environment camera if available
        const backCam = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
        setSelectedCameraId(backCam ? backCam.id : devices[0].id);
      } else {
        setHasPermission(false);
        setErrorMsg('No camera devices found on this device');
      }
    } catch (err) {
      setHasPermission(false);
      setErrorMsg(err.message || 'Camera permission denied or not available');
    }
  }, []);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  // Start Scanner
  const startScanner = useCallback(
    async (cameraIdToUse) => {
      const targetCam = cameraIdToUse || selectedCameraId;
      if (!targetCam) return;

      try {
        setErrorMsg('');
        if (scannerRef.current && isScanning) {
          await scannerRef.current.stop();
        }

        const html5QrCode = new Html5Qrcode(elementId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          targetCam,
          {
            fps: 10,
            qrbox: { width: 260, height: 260 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            const now = Date.now();
            // Debounce duplicate scans
            if (lastScannedRef.current.code === decodedText && now - lastScannedRef.current.time < scanLockMs) {
              return;
            }

            lastScannedRef.current = { code: decodedText, time: now };
            if (onScanSuccess) {
              onScanSuccess(decodedText);
            }
          },
          () => {
            // Ignore scan attempt failures (no QR detected in frame)
          }
        );

        setIsScanning(true);
      } catch (err) {
        console.error('Failed to start QR scanner:', err);
        setErrorMsg(err.message || 'Could not start camera feed');
        setIsScanning(false);
      }
    },
    [elementId, selectedCameraId, isScanning, scanLockMs, onScanSuccess]
  );

  // Stop Scanner
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Warning during scanner stop:', err);
      } finally {
        scannerRef.current = null;
        setIsScanning(false);
        setIsTorchOn(false);
      }
    }
  }, []);

  // Switch Camera
  const switchCamera = useCallback(
    async (newCameraId) => {
      setSelectedCameraId(newCameraId);
      if (isScanning) {
        await stopScanner();
        setTimeout(() => {
          startScanner(newCameraId);
        }, 300);
      }
    },
    [isScanning, stopScanner, startScanner]
  );

  // Toggle Flashlight / Torch
  const toggleTorch = useCallback(async () => {
    if (scannerRef.current && isScanning) {
      try {
        const nextState = !isTorchOn;
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: nextState }]
        });
        setIsTorchOn(nextState);
      } catch (err) {
        console.warn('Torch control not supported on this device:', err);
      }
    }
  }, [isScanning, isTorchOn]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch (e) {}
      }
    };
  }, []);

  return {
    isScanning,
    cameras,
    selectedCameraId,
    hasPermission,
    errorMsg,
    isTorchOn,
    startScanner,
    stopScanner,
    switchCamera,
    toggleTorch,
    fetchCameras
  };
}
