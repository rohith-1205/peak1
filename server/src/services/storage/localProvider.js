/**
 * Local Disk Storage Provider
 * Saves image files to public/uploads/events/<kind>/ on the local filesystem.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const env = require('../../config/env');

const UPLOADS_BASE = path.join(__dirname, '../../../public/uploads');

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const upload = async (buffer, options = {}) => {
  const kind = options.kind || 'general';
  const format = options.format || 'jpg';
  const targetDir = path.join(UPLOADS_BASE, 'events', kind);
  ensureDirectoryExists(targetDir);

  const fileHash = crypto.randomBytes(12).toString('hex');
  const filename = `${kind}_${Date.now()}_${fileHash}.${format}`;
  const filePath = path.join(targetDir, filename);

  await fs.promises.writeFile(filePath, buffer);

  const publicId = `local_events_${kind}_${filename}`;
  const relativeUrl = `/uploads/events/${kind}/${filename}`;

  return {
    url: relativeUrl,
    publicId,
    width: options.width || 0,
    height: options.height || 0,
    format,
    bytes: buffer.length
  };
};

const remove = async (publicId) => {
  if (!publicId || !publicId.startsWith('local_events_')) {
    return false;
  }

  try {
    const parts = publicId.split('_');
    const filename = parts.pop();
    const kind = parts.pop();
    const filePath = path.join(UPLOADS_BASE, 'events', kind, filename);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
  } catch (err) {
    console.error(`Failed to remove local image ${publicId}:`, err);
  }
  return false;
};

module.exports = {
  upload,
  remove
};
