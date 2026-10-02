/**
 * Image Helper Utilities
 * Safely extracts URL from string or { url } object and appends Cloudinary dynamic format/quality/width transformations.
 */

export const getOptimizedImageUrl = (imageInput, { width = 800 } = {}) => {
  let url = typeof imageInput === 'string' ? imageInput : imageInput?.url;
  if (!url || typeof url !== 'string') {
    return 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800';
  }

  // If Cloudinary URL, inject transformations (auto format, auto quality, width resize)
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    const transformStr = `f_auto,q_auto,w_${width},c_fill/`;
    return url.replace('/upload/', `/upload/${transformStr}`);
  }

  return url;
};

/**
 * Returns srcSet string for responsive image rendering
 */
export const getImageSrcSet = (imageInput) => {
  const url = typeof imageInput === 'string' ? imageInput : imageInput?.url;
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
    return undefined;
  }

  return [400, 800, 1200]
    .map((w) => `${getOptimizedImageUrl(url, { width: w })} ${w}w`)
    .join(', ');
};
