const crypto = require('crypto');
const QRCode = require('qrcode');
const env = require('../config/env');

// Use dev/test fallback when QR_SIGNING_SECRET is not defined
const QR_SECRET = (env.NODE_ENV === 'development' || env.NODE_ENV === 'test')
  ? (env.QR_SIGNING_SECRET || 'peak1_qr_secret_dev_32_characters_long_key_string')
  : env.QR_SIGNING_SECRET;

/**
 * Generate HMAC signature for a registration & event combination.
 */
const generateSignature = (registrationId, eventId) => {
  return crypto
    .createHmac('sha256', QR_SECRET)
    .update(`${registrationId}|${eventId}`)
    .digest('hex')
    .slice(0, 16);
};

/**
 * Generates signed QR payload string: PEAK1|<regId>|<eventId>|<sig>
 */
const generateSignedQrPayload = (registrationId, eventId) => {
  const cleanRegId = String(registrationId).trim();
  const cleanEventId = String(eventId).trim();
  const signature = generateSignature(cleanRegId, cleanEventId);
  return `PEAK1|${cleanRegId}|${cleanEventId}|${signature}`;
};

/**
 * Generates QR Code Data URL from signed payload string
 */
const generateQrDataUrl = async (registrationId, eventId) => {
  const payload = generateSignedQrPayload(registrationId, eventId);
  return await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
};

/**
 * Verifies scanned QR code or manual input string.
 * Supports:
 * 1. Signed QR payload: PEAK1|<regId>|<eventId>|<sig>
 * 2. Legacy JSON string: {"regId": "...", "eventId": "..."}
 * 3. Legacy Plain registrationId: PEAK-YYYY-XXXXXX
 */
const verifyQrPayload = (scannedCode) => {
  if (!scannedCode || typeof scannedCode !== 'string') {
    return { valid: false, code: 'INVALID_QR', reason: 'Empty or invalid QR code format' };
  }

  const trimmed = scannedCode.trim();

  // 1. Signed Format: PEAK1|<regId>|<eventId>|<sig>
  if (trimmed.startsWith('PEAK1|')) {
    const parts = trimmed.split('|');
    if (parts.length !== 4) {
      return { valid: false, code: 'INVALID_QR', reason: 'Malformed PEAK1 QR payload structure' };
    }

    const [, regId, eventId, sig] = parts;
    const expectedSig = generateSignature(regId, eventId);

    try {
      const sigBuf = Buffer.from(sig, 'utf8');
      const expectedBuf = Buffer.from(expectedSig, 'utf8');

      if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return { valid: false, code: 'INVALID_SIGNATURE', reason: 'Tampered or counterfeit QR code signature' };
      }
    } catch (err) {
      return { valid: false, code: 'INVALID_SIGNATURE', reason: 'Signature verification error' };
    }

    return {
      valid: true,
      registrationId: regId,
      eventId: eventId,
      isSigned: true
    };
  }

  // 2. Legacy JSON Format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.regId) {
        return {
          valid: true,
          registrationId: parsed.regId,
          eventId: parsed.eventId || null,
          isSigned: false
        };
      }
    } catch (e) {
      // Not valid JSON
    }
  }

  // 3. Plain Registration ID (e.g. PEAK-2026-123456 or Mongo ID)
  if (trimmed.length >= 5) {
    return {
      valid: true,
      registrationId: trimmed,
      eventId: null,
      isSigned: false
    };
  }

  return { valid: false, code: 'INVALID_QR', reason: 'Unrecognized pass code format' };
};

module.exports = {
  generateSignedQrPayload,
  generateQrDataUrl,
  verifyQrPayload
};
