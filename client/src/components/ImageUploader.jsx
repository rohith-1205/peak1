/**
 * ImageUploader Component
 * Reusable drag-and-drop file uploader for event posters and hero banners.
 * Handles client-side validation, upload progress, instant preview, and fallback URL pasting.
 */

import React, { useState, useRef } from 'react';
import adminApi from '../services/adminApi';
import { UploadCloud, X, RefreshCw, Link as LinkIcon, AlertCircle, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

export default function ImageUploader({ kind = 'poster', value, onChange }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [manualUrlMode, setManualUrlMode] = useState(false);
  const [manualUrlInput, setManualUrlInput] = useState('');

  const isPoster = kind === 'poster';
  const labelText = isPoster ? 'Event Poster Image' : 'Hero Header Banner Image';
  const sizeHint = isPoster ? 'Recommended: 800×1000px portrait (~4:5 ratio)' : 'Recommended: 1600×900px landscape (~16:9 ratio)';

  // Current display URL from string value or object value
  const currentUrl = typeof value === 'object' ? value?.url : value;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processUpload = async (file) => {
    setErrorMsg('');
    if (!file) return;

    // Client-side file type check
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Only JPEG, PNG, and WebP images are allowed.');
      return;
    }

    // Client-side file size check (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds maximum 5 MB limit.');
      return;
    }

    setUploading(true);
    setProgress(10);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('kind', kind);

    try {
      const res = await adminApi.post('/uploads/event-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percent);
          }
        }
      });

      if (res.success && res.data) {
        onChange(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processUpload(e.target.files[0]);
    }
  };

  const handleManualUrlSave = (e) => {
    e.preventDefault();
    if (manualUrlInput.trim()) {
      onChange({ url: manualUrlInput.trim() });
      setManualUrlMode(false);
      setManualUrlInput('');
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-sm w-full">
      <div className="flex items-center justify-between">
        <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 700, margin: 0 }}>
          {labelText}
        </label>
        <button
          type="button"
          onClick={() => setManualUrlMode(!manualUrlMode)}
          className="btn btn-ghost btn-sm text-dim"
          style={{ fontSize: '0.7rem' }}
        >
          <LinkIcon size={12} /> {manualUrlMode ? 'Upload File' : 'Paste Image URL Instead'}
        </button>
      </div>

      {/* Manual URL Input Fallback Mode */}
      {manualUrlMode ? (
        <form onSubmit={handleManualUrlSave} className="flex gap-sm">
          <input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={manualUrlInput}
            onChange={(e) => setManualUrlInput(e.target.value)}
            className="form-input flex-1"
          />
          <button type="submit" className="btn btn-secondary btn-sm">
            Save URL
          </button>
        </form>
      ) : currentUrl ? (
        /* Image Preview & Controls */
        <div className="card-mono flex flex-col gap-sm p-3" style={{ backgroundColor: 'var(--color-black)', borderColor: 'var(--border-subtle)' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: isPoster ? '4/5' : '16/9',
              maxHeight: '14rem',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#111111'
            }}
          >
            <img
              src={getImageUrl(currentUrl)}
              alt={labelText}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-dim flex items-center gap-xs" style={{ fontSize: '0.7rem' }}>
              <CheckCircle2 size={12} className="text-emerald-400" /> Asset Loaded
            </span>

            <div className="flex items-center gap-xs">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem' }}
              >
                <RefreshCw size={12} /> Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.7rem', color: 'var(--accent-rose)', padding: '0.25rem 0.6rem' }}
              >
                <X size={12} /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Drag and Drop Zone */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`card-mono flex flex-col items-center justify-center text-center p-6 cursor-pointer transition-all ${
            dragActive ? 'border-amber-400 bg-amber-400/10' : ''
          }`}
          style={{
            border: dragActive ? '2px dashed var(--accent-orange)' : '2px dashed var(--border-subtle)',
            backgroundColor: dragActive ? 'rgba(255, 61, 0, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            minHeight: '9.5rem'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-xs w-full" style={{ maxWidth: '14rem' }}>
              <div className="spinner" />
              <span className="label-eyebrow" style={{ fontSize: '0.7rem' }}>Uploading Image ({progress}%)</span>
              <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--accent-orange)', transition: 'width 0.2s ease' }} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-xs">
              <div style={{ color: dragActive ? 'var(--accent-orange)' : 'var(--text-dim)', marginBottom: '0.25rem' }}>
                <UploadCloud size={28} />
              </div>
              <span className="font-bold text-white" style={{ fontSize: '0.8125rem' }}>
                Drag & drop image here, or <span style={{ color: 'var(--accent-orange)' }}>browse</span>
              </span>
              <span className="text-dim" style={{ fontSize: '0.7rem' }}>
                JPEG, PNG, WebP up to 5 MB
              </span>
              <span className="text-dim font-mono" style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>
                {sizeHint}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center gap-xs text-rose-400" style={{ color: 'var(--accent-rose)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
          <AlertCircle size={14} /> <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
