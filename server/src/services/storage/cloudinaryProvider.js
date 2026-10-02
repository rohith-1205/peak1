/**
 * Cloudinary CDN Storage Provider
 * Uploads image buffers to Cloudinary CDN under folder 'peak1/events/<kind>'.
 */

const cloudinary = require('cloudinary').v2;
const env = require('../../config/env');

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
});

const upload = async (buffer, options = {}) => {
  const kind = options.kind || 'general';
  const folder = `peak1/${env.APP_ENV}/${kind}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        format: options.format || 'jpg'
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes
        });
      }
    );

    uploadStream.end(buffer);
  });
};

const remove = async (publicId) => {
  if (!publicId) return false;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error(`Failed to delete Cloudinary asset ${publicId}:`, error);
    return false;
  }
};

module.exports = {
  upload,
  remove
};
