'use client';

import React, { useEffect, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useBackgroundRemoval } from '@/hooks/useBackgroundRemoval';
import { useBatchProcessing } from '@/hooks/useBatchProcessing';
import Navbar, { type PageId } from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import FeatureGrid from '@/components/FeatureGrid';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ErrorBoundary';

// Core app views (client-only)
const UploadZone    = dynamic(() => import('@/components/UploadZone'),    { ssr: false });
const ProcessingView = dynamic(() => import('@/components/ProcessingView'), { ssr: false });
const ResultView    = dynamic(() => import('@/components/ResultView'),    { ssr: false });
const BatchView     = dynamic(() => import('@/components/BatchView'),     { ssr: false });

// Extra pages
const SettingsPage  = dynamic(() => import('@/components/pages/SettingsPage'),  { ssr: false });
const AboutPage     = dynamic(() => import('@/components/pages/AboutPage'),     { ssr: false });
const PricingPage   = dynamic(() => import('@/components/pages/PricingPage'),   { ssr: false });
const DocsPage      = dynamic(() => import('@/components/pages/DocsPage'),      { ssr: false });
const PrivacyPage   = dynamic(() => import('@/components/pages/PrivacyPage'),   { ssr: false });
const TermsPage     = dynamic(() => import('@/components/pages/TermsPage'),     { ssr: false });
const ContactPage   = dynamic(() => import('@/components/pages/ContactPage'),   { ssr: false });
const ChangelogPage = dynamic(() => import('@/components/pages/ChangelogPage'), { ssr: false });

type AppMode = 'single' | 'batch';

// The home page view — upload / processing / result
function HomeView() {
  const single = useBackgroundRemoval();
  const batch  = useBatchProcessing();
  const [appMode, setAppMode] = useState<AppMode>('single');

  const handleFilesSelect = useCallback((files: File[]) => {
    setAppMode('batch');
    batch.startBatch(files);
  }, [batch]);

  const handleSingleFile = useCallback((file: File) => {
    setAppMode('single');
    single.handleFile(file);
  }, [single]);

  const handleReset = useCallback(() => {
    setAppMode('single');
    single.reset();
    batch.reset();
  }, [single, batch]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key === 'v' && (single.status === 'idle' || single.status === 'error') && appMode === 'single') {
        navigator.clipboard.read().then(items => {
          for (const item of items) {
            const imgType = item.types.find(t => t.startsWith('image/'));
            if (imgType) {
              item.getType(imgType).then(blob => {
                handleSingleFile(new File([blob], 'pasted-image.png', { type: imgType }));
              });
              break;
            }
          }
        }).catch(() => {});
      }
      if (e.key === 'Escape' && (single.status === 'done' || single.status === 'error')) handleReset();
      if (meta && e.key === 'd' && single.status === 'done') { e.preventDefault(); single.downloadResult(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [single, appMode, handleSingleFile, handleReset]);

  const isBatchActive = appMode === 'batch' && batch.items.length > 0;

  if (isBatchActive) {
    return (
      <div className="page-fade" style={{ padding: '40px clamp(20px,5vw,60px)', paddingTop: 'calc(var(--nav-h) + 40px)', maxWidth: 1100, margin: '0 auto' }}>
        <BatchView
          items={batch.items}
          isRunning={batch.isRunning}
          overallLabel={batch.overallLabel}
          doneCount={batch.doneCount}
          onDownloadItem={batch.downloadItem}
          onDownloadAll={batch.downloadAll}
          onCancel={batch.cancelBatch}
          onReset={handleReset}
        />
      </div>
    );
  }

  if (single.status === 'processing') {
    return (
      <div style={{ paddingTop: 'var(--nav-h)' }}>
        <ProcessingView
          progress={single.progress}
          stage={single.progressStage}
          originalURL={single.originalURL}
          timeEstimate={single.timeEstimate}
        />
      </div>
    );
  }

  if (single.status === 'done' && single.resultURL) {
    return (
      <div style={{ padding: '40px clamp(20px,5vw,60px)', paddingTop: 'calc(var(--nav-h) + 40px)', maxWidth: 1100, margin: '0 auto' }}>
        {single.status === 'done' && (
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 16 }}>
            Ctrl+D download · Esc reset
          </p>
        )}
        <ResultView
          original={single.originalURL ?? ''}
          result={single.resultURL}
          resultSize={single.resultSize}
          originalSize={single.originalSize}
          originalFile={single.originalFile}
          onDownload={single.downloadResult}
          onReset={handleReset}
          onResultUpdated={(url, size) => { single.updateResultURL(url); single.updateResultSize(size); }}
        />
      </div>
    );
  }

  // Idle / error — show hero + upload zone
  return (
    <>
      <HeroSection />
      <div style={{ padding: '0 clamp(20px,5vw,60px) 80px', maxWidth: 1100, margin: '0 auto' }}>
        <UploadZone
          onFileSelect={handleSingleFile}
          onFilesSelect={handleFilesSelect}
          error={single.error}
          onReset={handleReset}
        />
        {(single.status === 'idle' || single.status === 'error') && (
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', marginTop: 12 }}>
            Ctrl+V paste image
          </p>
        )}

        {/* Stats row */}
        <div className="rmx-hero-stats" style={{ marginTop: 48 }}>
          {[
            { num: '40MB', label: 'Model size' },
            { num: '<5s', label: 'Avg. process time' },
            { num: '100%', label: 'Browser-local' },
            { num: 'Free', label: 'Always' },
          ].map((s, i) => (
            <div key={i} className="rmx-stat">
              <div className="rmx-stat-num">{s.num}</div>
              <div className="rmx-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <FeatureGrid />
      </div>
    </>
  );
}

export default function RootPage() {
  const [page, setPage] = useState<PageId>('home');

  useEffect(() => {
    const readHash = () => {
      const h = window.location.hash.replace('#', '') as PageId;
      if (h) setPage(h);
    };
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, []);

  const onNav = (p: PageId) => {
    setPage(p);
    window.location.hash = p;
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const renderPage = () => {
    switch (page) {
      case 'settings':  return <SettingsPage />;
      case 'about':     return <AboutPage />;
      case 'pricing':   return <PricingPage onNav={onNav} />;
      case 'docs':      return <DocsPage />;
      case 'privacy':   return <PrivacyPage />;
      case 'terms':     return <TermsPage />;
      case 'contact':   return <ContactPage />;
      case 'changelog': return <ChangelogPage />;
      default:          return <HomeView />;
    }
  };

  return (
    <ErrorBoundary onReset={() => onNav('home')}>
      <Navbar page={page} onNav={onNav} />
      <div className="page-fade" key={page}>
        {renderPage()}
      </div>
      {page !== 'docs' && <Footer onNav={onNav} />}
    </ErrorBoundary>
  );
}
