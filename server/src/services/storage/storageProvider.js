/**
 * Storage Provider Abstraction Interface
 * Selects between Cloudinary and Local disk storage providers based on STORAGE_PROVIDER env setting.
 */

const env = require('../../config/env');
const localProvider = require('./localProvider');
const cloudinaryProvider = require('./cloudinaryProvider');

const getProvider = () => {
  const provider = (env.STORAGE_PROVIDER || 'LOCAL').toUpperCase();
  if (provider === 'CLOUDINARY') {
    return cloudinaryProvider;
  }
  return localProvider;
};

const upload = async (buffer, options = {}) => {
  const provider = getProvider();
  return await provider.upload(buffer, options);
};

const remove = async (publicId) => {
  if (!publicId) return false;
  // Try local first if local prefix, else provider
  if (publicId.startsWith('local_events_')) {
    return await localProvider.remove(publicId);
  }
  const provider = getProvider();
  return await provider.remove(publicId);
};

module.exports = {
  upload,
  remove
};
