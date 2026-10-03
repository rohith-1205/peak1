/**
 * Resolves local relative image upload paths (/uploads/...) to full backend URLs
 * so images load properly from Render in production instead of 404ing on Vercel.
 */
export const getImageUrl = (url) => {
  if (!url) return '';
  if (typeof url !== 'string') {
    if (url?.url) return getImageUrl(url.url);
    return '';
  }

  // Strip hardcoded localhost origins if present from previous local uploads
  let cleanUrl = url.replace(/^http:\/\/localhost:\d+/, '');

  // If already an absolute URL (e.g. Unsplash, Cloudinary, http/https/data)
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:')) {
    return cleanUrl;
  }

  // Derive backend base domain from VITE_API_BASE_URL (removing /api/v1)
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
  const backendBase = envUrl ? envUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '') : '';

  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return backendBase ? `${backendBase}${cleanPath}` : cleanPath;
};

export default getImageUrl;
