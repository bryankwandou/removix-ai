'use client';

import React, { useState, useRef } from 'react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  error?: string | null;
  onReset?: () => void;
}

const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, onFilesSelect, error, onReset }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files).slice(0, 10);
    if (arr.length > 1 && onFilesSelect) {
      onFilesSelect(arr);
    } else {
      onFileSelect(arr[0]);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (zoneRef.current?.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  return (
    <div className="rmx-uploader">
      {error && (
        <div className="rmx-error-banner">
          <span>⚠</span>
          <span className="rmx-error-msg">{error}</span>
          <button
            type="button"
            className="rmx-error-retry"
            onClick={(e) => { e.stopPropagation(); if (onReset) { onReset(); } else { inputRef.current?.click(); } }}
          >
            Try again
          </button>
        </div>
      )}

      <div
        ref={zoneRef}
        className={`rmx-drop-zone${isDragOver ? ' drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={handleDragLeave}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          style={{ display: 'none' }}
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple={!!onFilesSelect}
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
          title="Upload image"
          aria-label="Upload image"
        />

        <div className="rmx-drop-icon">
          <UploadIcon />
        </div>

        <div className="rmx-drop-title">
          {isDragOver ? 'Drop your image here!' : 'Drop image here'}
        </div>
        <div className="rmx-drop-sub">or click to browse from your device</div>

        <div className="rmx-drop-formats">
          {['JPG', 'PNG', 'WEBP', 'HEIC'].map(f => (
            <span key={f} className="rmx-fmt-chip">{f}</span>
          ))}
        </div>

        <div className="rmx-drop-btns" onClick={(e) => e.stopPropagation()}>
          <button className="btn btn-primary" onClick={() => inputRef.current?.click()}>
            <UploadIcon /> Choose File
          </button>
        </div>

        <div className="rmx-upload-meta">Max 25 MB · Processed locally in your browser</div>
      </div>
    </div>
  );
};

export default UploadZone;
