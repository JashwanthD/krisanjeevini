import React, { useState, useCallback, useMemo } from 'react';
import { useLanguage } from './context/LanguageContext';
import { usePWA } from './hooks/usePWA';
import LanguageToggle from './components/LanguageToggle';
import ModuleSowing from './components/ModuleSowing';
import ModulePathology from './components/ModulePathology';
import ModuleMarket from './components/ModuleMarket';
import VoiceAccessibility from './components/VoiceAccessibility';

type TabId = 'sowing' | 'leafScan' | 'market';

const TAB_ICONS: Record<TabId, string> = {
  sowing: '🌱',
  leafScan: '🍃',
  market: '📊',
};

/**
 * KRI-SANJEEVINI AI — Unified Mobile Farmer Cockpit
 * Single-page layout with bottom tab navigation, language toggle, and voice FAB.
 */
export default function App() {
  const { t } = useLanguage();
  const { isOffline, isUpdateAvailable, updateApp } = usePWA();
  const [activeTab, setActiveTab] = useState<TabId>('sowing');

  const handleNavigate = useCallback((tab: string) => {
    if (tab === 'sowing' || tab === 'leafScan' || tab === 'market') {
      setActiveTab(tab as TabId);
    }
  }, []);

  const tabs: TabId[] = ['sowing', 'leafScan', 'market'];

  // Memoize the active module to avoid unnecessary re-renders
  const activeModule = useMemo(() => {
    switch (activeTab) {
      case 'sowing':
        return <ModuleSowing />;
      case 'leafScan':
        return <ModulePathology />;
      case 'market':
        return <ModuleMarket />;
    }
  }, [activeTab]);

  return (
    <div className="app-container">
      {/* ─── Header ────────────────────────────────────────────────── */}
      <header className="app-header">
        <div>
          <h1 id="app-title">{t('app.title')}</h1>
          <div className="subtitle">{t('app.subtitle')}</div>
        </div>
        <LanguageToggle />
      </header>

      {/* ─── Offline Banner ────────────────────────────────────────── */}
      {isOffline && (
        <div className="offline-banner" id="offline-banner">
          📵 {t('app.offline')}
        </div>
      )}

      {/* ─── Update Banner ─────────────────────────────────────────── */}
      {isUpdateAvailable && (
        <div
          className="offline-banner"
          style={{ backgroundColor: '#1565C0', cursor: 'pointer' }}
          onClick={updateApp}
          id="update-banner"
        >
          🔄 {t('app.updateAvailable')} — <strong>{t('app.updateNow')}</strong>
        </div>
      )}

      {/* ─── Main Content ──────────────────────────────────────────── */}
      <main className="main-content" id="main-content">
        {activeModule}
      </main>

      {/* ─── Voice FAB ─────────────────────────────────────────────── */}
      <VoiceAccessibility onNavigate={handleNavigate} />

      {/* ─── Bottom Tab Bar ────────────────────────────────────────── */}
      <nav className="tab-bar" role="tablist" aria-label="Module navigation">
        {tabs.map((tab) => (
          <button
            key={tab}
            role="tab"
            id={`tab-${tab}`}
            className={activeTab === tab ? 'active' : ''}
            aria-selected={activeTab === tab}
            aria-controls="main-content"
            onClick={() => setActiveTab(tab)}
          >
            <span className="tab-icon">{TAB_ICONS[tab]}</span>
            <span>{t(`tabs.${tab}`)}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
