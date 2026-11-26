import { useEffect, useRef, useState } from 'react';
import type { MissionTab, StudentProfile } from '../types';

interface TopPassportBarProps {
  activeTab: MissionTab;
  onSelectTab: (tab: MissionTab) => void;
  profile: StudentProfile | null;
  storageMode: 'google-sheets-api' | 'apps-script' | 'demo-preview';
  filledBlocks: number;
  onOpenStorageModal: () => void;
}

const TABS: {
  id: MissionTab;
  step: string;
  label: string;
  shortLabel: string;
  emoji: string;
}[] = [
  { id: 'hook', step: 'Mission 1', label: 'Press Pass & Hook', shortLabel: 'Hook', emoji: '⚡' },
  { id: 'blueprint', step: 'Mission 2', label: 'Story Blueprint', shortLabel: 'Blueprint', emoji: '🧱' },
  { id: 'vault', step: 'Toolbox', label: 'Word Vault & Facts', shortLabel: 'Vault', emoji: '💎' },
  { id: 'publish', step: 'Mission 3', label: 'My Book Page', shortLabel: 'Book', emoji: '📘' },
];

export function TopPassportBar({
  activeTab,
  onSelectTab,
  profile,
  storageMode,
  filledBlocks,
  onOpenStorageModal,
}: TopPassportBarProps) {
  const isSheetConnected = storageMode !== 'demo-preview';
  const [navFolded, setNavFolded] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    function handleScroll() {
      const y = window.scrollY || 0;
      const delta = y - lastScrollY.current;
      if (y <= 64) {
        setNavFolded(false);
      } else if (delta > 8) {
        setNavFolded(true);
      } else if (delta < -8) {
        setNavFolded(false);
      }
      lastScrollY.current = y;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className="passport-banner no-print">
        <div className="passport-top-row">
          <div className="brand-lockup">
            <span className="brand-badge" aria-hidden="true">
              🌍
            </span>
            <div>
              <div className="brand-kicker">NATIONAL KID-GEOGRAPHIC</div>
              <h1 className="brand-title">WildPages Junior Documentary Studio</h1>
            </div>
          </div>

          <div className="passport-meta">
            <div className="explorer-pill">
              <span className="explorer-avatar" aria-hidden="true">
                {profile?.avatarEmoji || '🧭'}
              </span>
              <div className="explorer-pill-text">
                <strong>{profile?.authorName || 'New Explorer'}</strong>
                <span>{profile?.explorerTitle || 'Claim your Press Pass!'}</span>
              </div>
            </div>

            <div className="star-counter" title="Explorer Stars Earned">
              <span aria-hidden="true">⭐</span>
              <strong>{profile?.totalStars || 0}</strong>
              <span className="star-label">Stars</span>
            </div>

            <button
              type="button"
              className={`db-status-btn ${isSheetConnected ? 'db-live' : 'db-demo'}`}
              onClick={onOpenStorageModal}
            >
              <span className="db-dot" aria-hidden="true" />
              <span className="db-status-text">
                {isSheetConnected ? 'Sheet Synced' : 'Sheet DB'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className={`mission-nav-bar no-print ${navFolded ? 'mission-nav-folded' : ''}`}>
        <nav className="mission-nav" aria-label="Writing Missions">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`mission-tab ${isActive ? 'mission-tab-active' : ''}`}
                onClick={() => onSelectTab(tab.id)}
              >
                <span className="mission-tab-emoji" aria-hidden="true">
                  {tab.emoji}
                </span>
                <span className="mission-tab-copy">
                  <span className="mission-tab-step">{tab.step}</span>
                  <span className="mission-tab-label">{tab.label}</span>
                  <span className="mission-tab-short">{tab.shortLabel}</span>
                </span>
                {tab.id === 'blueprint' && filledBlocks > 0 && (
                  <span className="mission-pill-count">{filledBlocks}/10</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
