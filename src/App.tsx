import { useEffect, useState } from 'react';
import {
  fetchBootstrap,
  saveSessionProfile,
  saveWarmupCaption,
  saveWritingDraft,
} from './api/client';
import { Mission1Hook } from './components/Mission1Hook';
import { Mission2Blueprint } from './components/Mission2Blueprint';
import { Mission3Vault } from './components/Mission3Vault';
import { Mission4BookPage } from './components/Mission4BookPage';
import { StorageGuideModal } from './components/StorageGuideModal';
import { TopPassportBar } from './components/TopPassportBar';
import { countFilledBlocks, createBlankDraft } from './data/writingHelpers';
import type {
  BootstrapResponse,
  MissionTab,
  StudentProfile,
  WarmupSubmission,
  WritingDraft,
} from './types';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState<MissionTab>('hook');
  const [data, setData] = useState<BootstrapResponse | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [submissions, setSubmissions] = useState<WarmupSubmission[]>([]);
  const [savedDrafts, setSavedDrafts] = useState<WritingDraft[]>([]);
  const [currentDraft, setCurrentDraft] = useState<WritingDraft>(() =>
    createBlankDraft('mimic-octopus')
  );
  const [savingDraft, setSavingDraft] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [storageModalOpen, setStorageModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetchBootstrap()
      .then((res) => {
        if (!active) return;
        setData(res);
        setProfile(res.profile);
        setSubmissions(res.warmupSubmissions || []);
        setSavedDrafts(res.drafts || []);
        if (res.drafts && res.drafts.length > 0) {
          setCurrentDraft(res.drafts[0]);
        } else {
          const defaultTopic =
            res.profile?.favoriteTopicId || res.topics[0]?.topicId || 'mimic-octopus';
          setCurrentDraft(createBlankDraft(defaultTopic, res.profile?.studentId || ''));
        }
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to load writing studio.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSaveProfile(input: {
    authorName: string;
    explorerTitle: string;
    avatarEmoji: string;
    favoriteTopicId: string;
  }) {
    const res = await saveSessionProfile(input);
    setProfile(res.profile);
    setCurrentDraft((prev) => ({ ...prev, studentId: res.profile.studentId }));
  }

  async function handleSaveWarmup(challengeId: string, captionText: string) {
    const res = await saveWarmupCaption({ challengeId, captionText });
    setSubmissions((prev) => [
      ...prev.filter((item) => item.challengeId !== challengeId),
      res.submission,
    ]);
    if (res.profile) {
      setProfile(res.profile);
    }
  }

  async function handleSaveDraft() {
    if (!profile) {
      setSaveStatus('👆 Claim your Explorer Press Pass on Mission 1 first to save your book!');
      return;
    }
    setSavingDraft(true);
    setSaveStatus('');
    try {
      const res = await saveWritingDraft({ ...currentDraft, studentId: profile.studentId });
      setCurrentDraft(res.draft);
      setSavedDrafts((prev) => [
        res.draft,
        ...prev.filter((d) => d.draftId !== res.draft.draftId),
      ]);
      if (res.profile) setProfile(res.profile);
      setSaveStatus('✅ Saved! Your story & stars are safe!');
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : 'Could not save story right now.');
    } finally {
      setSavingDraft(false);
    }
  }

  function handleSelectTopicAndStart(topicId: string) {
    setCurrentDraft((prev) => ({ ...prev, topicId }));
    setSaveStatus('');
    setActiveTab('blueprint');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleStartNewBook() {
    const fallbackTopic = data?.topics[0]?.topicId || 'mimic-octopus';
    setCurrentDraft(createBlankDraft(fallbackTopic, profile?.studentId || ''));
    setSaveStatus('');
    setActiveTab('blueprint');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (loading) {
    return (
      <div className="loading-shell">
        <div className="loading-card">
          <div className="loading-emoji" aria-hidden="true">
            🧭
          </div>
          <h2>Opening Your Explorer Field Journal...</h2>
          <p>Loading nonfiction Fact Packs and Word Vault from storage!</p>
        </div>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="loading-shell">
        <div className="loading-card">
          <h2>Oops! Explorer Radio Static</h2>
          <p>{loadError || 'Could not load the writing studio.'}</p>
          <button type="button" className="btn-primary btn-navy" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const activeTopic =
    data.topics.find((t) => t.topicId === currentDraft.topicId) || data.topics[0];
  const filledBlocks = countFilledBlocks(currentDraft);

  return (
    <div className="app-shell">
      <TopPassportBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        profile={profile}
        storageMode={data.storageMode}
        filledBlocks={filledBlocks}
        onOpenStorageModal={() => setStorageModalOpen(true)}
      />

      <main className="main-container">
        {activeTab === 'hook' && (
          <Mission1Hook
            profile={profile}
            topics={data.topics}
            warmups={data.warmups}
            submissions={submissions}
            selectedTopicId={currentDraft.topicId}
            onSaveProfile={handleSaveProfile}
            onSaveWarmup={handleSaveWarmup}
            onSelectTopicAndStart={handleSelectTopicAndStart}
          />
        )}

        {activeTab === 'blueprint' && activeTopic && (
          <Mission2Blueprint
            draft={currentDraft}
            topic={activeTopic}
            topics={data.topics}
            wordVault={data.wordVault}
            saving={savingDraft}
            saveStatus={saveStatus}
            onChangeDraft={(updater) => {
              setSaveStatus('');
              setCurrentDraft(updater);
            }}
            onSaveDraft={handleSaveDraft}
            onGoPublish={() => {
              setActiveTab('publish');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'vault' && (
          <Mission3Vault
            wordVault={data.wordVault}
            topics={data.topics}
            onPickTopic={handleSelectTopicAndStart}
          />
        )}

        {activeTab === 'publish' && activeTopic && (
          <Mission4BookPage
            profile={profile}
            draft={currentDraft}
            topic={activeTopic}
            savedDrafts={savedDrafts}
            saving={savingDraft}
            saveStatus={saveStatus}
            onChangeDraft={(updater) => {
              setSaveStatus('');
              setCurrentDraft(updater);
            }}
            onSaveDraft={handleSaveDraft}
            onLoadDraft={(d) => {
              setCurrentDraft(d);
              setSaveStatus('📘 Loaded saved book!');
            }}
            onStartNewBook={handleStartNewBook}
            onBackToBlueprint={() => {
              setActiveTab('blueprint');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      <StorageGuideModal
        open={storageModalOpen}
        storageMode={data.storageMode}
        spreadsheetId={data.spreadsheetId}
        onClose={() => setStorageModalOpen(false)}
      />
    </div>
  );
}
