/**
 * Upload Controller
 * Handles image validation (magic bytes, size, dimensions via Sharp) and storage processing.
 */

const sharp = require('sharp');
const storageProvider = require('../services/storage/storageProvider');
const { checkMagicBytes } = require('../services/storage/bufferValidator');
const AuditLog = require('../models/AuditLog');
const ApiResponse = require('../utils/apiResponse');

const uploadEventImage = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return ApiResponse.error(res, 'No image file provided in request', 400, 'FILE_MISSING');
    }

    const kind = (req.body.kind || req.query.kind || 'poster').toLowerCase();
    if (kind !== 'poster' && kind !== 'banner') {
      return ApiResponse.error(res, 'Invalid image kind. Must be "poster" or "banner".', 400, 'INVALID_IMAGE_KIND');
    }

    const buffer = req.file.buffer;

    // 1. File Size check (5 MB limit)
    if (buffer.length > 5 * 1024 * 1024) {
      return ApiResponse.error(res, 'Image size exceeds maximum 5 MB limit', 400, 'FILE_TOO_LARGE');
    }

    // 2. Real File Type check via magic bytes
    const detected = checkMagicBytes(buffer);
    if (!detected || !['image/jpeg', 'image/png', 'image/webp'].includes(detected.mime)) {
      return ApiResponse.error(
        res,
        'Invalid or corrupted image file format. Only JPEG, PNG, and WebP images are permitted.',
        400,
        'INVALID_IMAGE_FORMAT'
      );
    }

    // 3. Process with Sharp & check dimensions
    const sharpInstance = sharp(buffer).rotate();
    const metadata = await sharpInstance.metadata();

    const minWidth = kind === 'poster' ? 800 : 1600;
    const minHeight = kind === 'poster' ? 1000 : 900;

    if (!metadata.width || !metadata.height || metadata.width < minWidth || metadata.height < minHeight) {
      const requiredSpec = kind === 'poster' ? '800×1000 pixels (portrait)' : '1600×900 pixels (landscape)';
      return ApiResponse.error(
        res,
        `Image dimensions are too small. ${kind.toUpperCase()} requires a minimum of ${requiredSpec}. Uploaded image is ${metadata.width || 0}×${metadata.height || 0}px.`,
        400,
        'DIMENSIONS_TOO_SMALL'
      );
    }

    // Convert/optimize to WebP or retain clean format
    const processedBuffer = await sharpInstance.toBuffer();

    // 4. Upload to active storage provider
    const result = await storageProvider.upload(processedBuffer, {
      kind,
      format: detected.ext,
      width: metadata.width,
      height: metadata.height
    });

    // 5. Audit Log Entry
    if (req.user) {
      await AuditLog.create({
        actorId: req.user._id,
        action: 'IMAGE_UPLOAD',
        resource: 'STORAGE',
        ipAddress: req.ip || req.socket.remoteAddress,
        metadata: { kind, url: result.url, publicId: result.publicId }
      });
    }

    return ApiResponse.success(res, result, `${kind.toUpperCase()} image uploaded successfully`, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadEventImage
};
