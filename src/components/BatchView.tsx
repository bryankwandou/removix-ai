/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { BatchItem } from '@/hooks/useBatchProcessing';
import { formatFileSize } from '@/lib/imageUtils';

interface BatchViewProps {
  items: BatchItem[];
  isRunning: boolean;
  overallLabel: string;
  doneCount: number;
  onDownloadItem: (item: BatchItem) => void;
  onDownloadAll: () => void;
  onCancel: () => void;
  onReset: () => void;
}

const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const ArchiveIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
);
const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const StopIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const SpinnerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin" style={{ animation: 'spin 0.8s linear infinite' }}>
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
    <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="1"/>
  </svg>
);

function StatusBadge({ status }: { status: BatchItem['status'] }) {
  const map: Record<BatchItem['status'], string> = {
    queued: 'rmx-status-badge rmx-status-queued',
    processing: 'rmx-status-badge rmx-status-processing',
    done: 'rmx-status-badge rmx-status-done',
    error: 'rmx-status-badge rmx-status-error',
  };
  const labels: Record<BatchItem['status'], string> = {
    queued: 'Queued', processing: 'Processing', done: 'Done', error: 'Error',
  };
  return <span className={map[status]}>{labels[status]}</span>;
}

export default function BatchView({
  items, isRunning, overallLabel, doneCount, onDownloadItem, onDownloadAll, onCancel, onReset,
}: BatchViewProps) {
  return (
    <div className="rmx-batch-view page-fade">
      <div className="rmx-batch-header">
        <div>
          <div className="rmx-batch-title">
            {isRunning ? overallLabel : doneCount === items.length ? 'Batch Complete ✓' : `${doneCount} / ${items.length} Done`}
          </div>
          <div className="rmx-batch-sub">
            {items.length} image{items.length !== 1 ? 's' : ''} · Processed locally in your browser
          </div>
        </div>
        <div className="rmx-batch-actions">
          {isRunning && (
            <button type="button" className="btn btn-danger btn-sm" onClick={onCancel}>
              <StopIcon /> Stop
            </button>
          )}
          {doneCount >= 2 && !isRunning && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onDownloadAll}>
              <ArchiveIcon /> Download All (.zip)
            </button>
          )}
          {!isRunning && (
            <button type="button" className="btn btn-primary btn-sm" onClick={onReset}>
              <RefreshIcon /> New Batch
            </button>
          )}
        </div>
      </div>

      <div className="rmx-batch-grid">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rmx-batch-item"
          >
            <div className="rmx-batch-thumb rmx-checker">
              {item.resultURL ? (
                <img src={item.resultURL} alt={item.file.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.status === 'processing'
                    ? <SpinnerIcon />
                    : <span style={{ fontSize: 11, color: 'var(--text3)', padding: '0 8px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{item.file.name}</span>
                  }
                </div>
              )}
              {item.status === 'processing' && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--surface2)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.progress}%` }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--pink))' }}
                  />
                </div>
              )}
            </div>

            <div className="rmx-batch-info">
              <div className="rmx-batch-name">{item.file.name}</div>
              <div className="rmx-batch-size">{formatFileSize(item.file.size)}</div>
              <div className="rmx-batch-foot">
                <StatusBadge status={item.status} />
                {item.status === 'processing' && (
                  <span style={{ fontSize: 11, color: 'var(--accent2)', fontFamily: 'var(--mono)' }}>{item.progress}%</span>
                )}
                {item.status === 'error' && (
                  <span style={{ fontSize: 11, color: 'var(--red)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.error}</span>
                )}
                {item.status === 'done' && (
                  <button type="button" className="btn btn-primary btn-sm" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => onDownloadItem(item)}>
                    <DownloadIcon /> PNG
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
