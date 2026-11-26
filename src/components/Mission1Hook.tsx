import { useState } from 'react';
import type { StudentProfile, TopicItem, WarmupChallenge, WarmupSubmission } from '../types';
import { AVATAR_OPTIONS, EXPLORER_TITLES } from '../data/writingHelpers';

interface Mission1HookProps {
  profile: StudentProfile | null;
  topics: TopicItem[];
  warmups: WarmupChallenge[];
  submissions: WarmupSubmission[];
  selectedTopicId: string;
  onSaveProfile: (input: {
    authorName: string;
    explorerTitle: string;
    avatarEmoji: string;
    favoriteTopicId: string;
  }) => Promise<void>;
  onRestorePass: (passCode: string) => Promise<number>;
  onSaveWarmup: (challengeId: string, captionText: string) => Promise<void>;
  onSelectTopicAndStart: (topicId: string) => void;
  onOpenRestoredDraft: () => void;
}

const SPARKLE_CHIPS = ['Whoa! ', 'Believe it or not, ', 'SNAP! ', 'Did you know '];

export function Mission1Hook({
  profile,
  topics,
  warmups,
  submissions,
  selectedTopicId,
  onSaveProfile,
  onRestorePass,
  onSaveWarmup,
  onSelectTopicAndStart,
  onOpenRestoredDraft,
}: Mission1HookProps) {
  const [authorName, setAuthorName] = useState(profile?.authorName || '');
  const [explorerTitle, setExplorerTitle] = useState(profile?.explorerTitle || EXPLORER_TITLES[0]);
  const [avatarEmoji, setAvatarEmoji] = useState(profile?.avatarEmoji || AVATAR_OPTIONS[0].emoji);
  const [savingPass, setSavingPass] = useState(false);
  const [passMessage, setPassMessage] = useState('');
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreCode, setRestoreCode] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const [activeWarmupIdx, setActiveWarmupIdx] = useState(0);
  const currentWarmup = warmups[activeWarmupIdx] || warmups[0];
  const existingSub = submissions.find((s) => s.challengeId === currentWarmup?.challengeId);
  const [captionDrafts, setCaptionDrafts] = useState<Record<string, string>>({});
  const [savingWarmup, setSavingWarmup] = useState(false);
  const [warmupBanner, setWarmupBanner] = useState('');
  const [showExample, setShowExample] = useState(false);
  const [peekTopicId, setPeekTopicId] = useState<string | null>(null);

  const currentCaption =
    currentWarmup && captionDrafts[currentWarmup.challengeId] !== undefined
      ? captionDrafts[currentWarmup.challengeId]
      : existingSub?.captionText || '';

  const rescuedCount = new Set(submissions.map((s) => s.challengeId)).size;

  async function handleClaimPass(e: React.FormEvent) {
    e.preventDefault();
    if (!authorName.trim()) {
      setPassMessage('Type your Explorer Name first!');
      return;
    }
    setSavingPass(true);
    setPassMessage('');
    try {
      await onSaveProfile({
        authorName: authorName.trim(),
        explorerTitle,
        avatarEmoji,
        favoriteTopicId: selectedTopicId,
      });
      setPassMessage('🎉 Press Pass Activated! +10 Explorer Stars!');
    } catch (err) {
      setPassMessage(err instanceof Error ? err.message : 'Could not save Press Pass.');
    } finally {
      setSavingPass(false);
    }
  }

  async function handleRescueSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentWarmup) return;
    if (!profile) {
      setWarmupBanner('👆 Claim your Press Pass in Step 1 first so we can stamp your stars!');
      return;
    }
    if (currentCaption.trim().length < 6) {
      setWarmupBanner('Write a short, exciting sentence to rescue this boring fact!');
      return;
    }
    setSavingWarmup(true);
    setWarmupBanner('');
    try {
      await onSaveWarmup(currentWarmup.challengeId, currentCaption.trim());
      setWarmupBanner('🌟 BOOM! Boring textbook rescued! +10 Explorer Stars saved!');
    } catch (err) {
      setWarmupBanner(err instanceof Error ? err.message : 'Could not save caption.');
    } finally {
      setSavingWarmup(false);
    }
  }

  function appendChip(chip: string) {
    if (!currentWarmup) return;
    setCaptionDrafts((prev) => ({
      ...prev,
      [currentWarmup.challengeId]: `${chip}${currentCaption}`,
    }));
  }

  async function handleRestoreSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = restoreCode.trim();
    if (!trimmed) {
      setRestoreMsg('Paste your Explorer Pass Code (e.g. stu_3016efc658519efb56b2).');
      return;
    }
    setRestoring(true);
    setRestoreMsg('');
    try {
      const draftCount = await onRestorePass(trimmed);
      setRestoreMsg(
        draftCount > 0
          ? `🎉 Pass restored with ${draftCount} saved book${draftCount === 1 ? '' : 's'}!`
          : '🎉 Explorer Press Pass restored!'
      );
      if (draftCount > 0) {
        onOpenRestoredDraft();
      }
    } catch (err) {
      setRestoreMsg(err instanceof Error ? err.message : 'Could not restore Press Pass.');
    } finally {
      setRestoring(false);
    }
  }

  function handleCopyPassCode() {
    if (!profile?.studentId || !navigator.clipboard) return;
    navigator.clipboard.writeText(profile.studentId).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  }

  return (
    <div className="mission-stack">
      {/* STEP 1: PRESS PASS */}
      <section className="journal-card card-teal">
        <div className="card-header-row">
          <div>
            <span className="step-badge badge-teal">STEP 1 • 30 SECONDS</span>
            <h2 className="section-title">Claim Your Junior Author Press Pass</h2>
            <p className="section-sub">
              Every real documentary author starts with an official press badge!
            </p>
          </div>
          {profile && (
            <div className="press-pass-live">
              <div className="press-pass-stripe">OFFICIAL PRESS PASS</div>
              <div className="press-pass-body">
                <span className="press-pass-avatar" aria-hidden="true">
                  {profile.avatarEmoji}
                </span>
                <div>
                  <div className="press-pass-name">{profile.authorName}</div>
                  <div className="press-pass-role">{profile.explorerTitle}</div>
                  <div className="press-pass-code-row">
                    <code className="press-pass-code">{profile.studentId}</code>
                    <button
                      type="button"
                      className="copy-code-btn"
                      onClick={handleCopyPassCode}
                    >
                      {copiedCode ? '✅ Copied' : '📋 Copy'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <form className="press-pass-form" onSubmit={handleClaimPass}>
          <div className="form-group">
            <label htmlFor="author-name-input" className="field-label">
              1. Your Explorer Name (or Pen Name!)
            </label>
            <input
              id="author-name-input"
              type="text"
              maxLength={40}
              className="text-input"
              placeholder="Type your name here..."
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <span className="field-label">2. Pick Your Explorer Avatar</span>
            <div className="avatar-grid">
              {AVATAR_OPTIONS.map((opt) => (
                <button
                  key={opt.emoji}
                  type="button"
                  className={`avatar-choice ${avatarEmoji === opt.emoji ? 'avatar-choice-active' : ''}`}
                  onClick={() => setAvatarEmoji(opt.emoji)}
                  title={opt.label}
                >
                  <span aria-hidden="true">{opt.emoji}</span>
                  <span className="avatar-choice-label">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="explorer-title-select" className="field-label">
              3. Pick Your Documentary Role
            </label>
            <select
              id="explorer-title-select"
              className="select-input"
              value={explorerTitle}
              onChange={(e) => setExplorerTitle(e.target.value)}
            >
              {EXPLORER_TITLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions-row">
            <button type="submit" className="btn-primary btn-teal" disabled={savingPass}>
              {savingPass
                ? 'Printing Pass...'
                : profile
                  ? '✨ Update My Press Pass'
                  : '🪪 Print My Press Pass (+10 ⭐)'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setRestoreOpen((v) => !v)}
            >
              🔑 {restoreOpen ? 'Hide Restore' : 'Restore Saved Books'}
            </button>
            {passMessage && <span className="inline-feedback">{passMessage}</span>}
          </div>
        </form>

        {restoreOpen && (
          <form className="restore-pass-box" onSubmit={handleRestoreSubmit}>
            <label htmlFor="restore-code-input" className="field-label">
              🔑 Switching devices? Enter your Explorer Pass Code (<code>student_id</code> from your
              Google Sheet) to load all your saved drafts:
            </label>
            <div className="restore-pass-row">
              <input
                id="restore-code-input"
                type="text"
                maxLength={48}
                className="text-input"
                placeholder="e.g. stu_3016efc658519efb56b2"
                value={restoreCode}
                onChange={(e) => setRestoreCode(e.target.value)}
              />
              <button type="submit" className="btn-primary btn-navy" disabled={restoring}>
                {restoring ? 'Loading...' : '📚 Restore Books'}
              </button>
            </div>
            {restoreMsg && <span className="inline-feedback">{restoreMsg}</span>}
          </form>
        )}
      </section>

      {/* STEP 2: INSTANT HOOK MINI-TASK */}
      {currentWarmup && (
        <section className="journal-card card-coral">
          <div className="card-header-row">
            <div>
              <span className="step-badge badge-coral">STEP 2 • INSTANT 2-MINUTE WARM-UP</span>
              <h2 className="section-title">⚡ Rescue the Boring Book!</h2>
              <p className="section-sub">
                A Sleepy Textbook ruined amazing real-world facts! Turn ONE boring line into an
                exciting documentary photo caption!
              </p>
            </div>
            <div className="rescued-tally">
              <strong>
                {rescuedCount} / {warmups.length}
              </strong>
              <span>Facts Rescued</span>
            </div>
          </div>

          <div className="warmup-switcher">
            {warmups.map((w, idx) => {
              const done = submissions.some((s) => s.challengeId === w.challengeId);
              return (
                <button
                  key={w.challengeId}
                  type="button"
                  className={`warmup-chip ${idx === activeWarmupIdx ? 'warmup-chip-active' : ''} ${
                    done ? 'warmup-chip-done' : ''
                  }`}
                  onClick={() => {
                    setActiveWarmupIdx(idx);
                    setShowExample(false);
                    setWarmupBanner('');
                  }}
                >
                  {done ? '✅ ' : '⚡ '}
                  {w.badgeLabel}
                </button>
              );
            })}
          </div>

          <div className="rescue-compare">
            <div className="sleepy-box">
              <div className="mini-kicker">💤 SLEEPY TEXTBOOK SAYS...</div>
              <p className="sleepy-quote">"{currentWarmup.sleepySentence}"</p>
            </div>
            <div className="real-fact-box">
              <div className="mini-kicker">🤯 THE REAL DOCUMENTARY FACT!</div>
              <p className="real-fact-text">{currentWarmup.realFact}</p>
              <p className="hint-line">💡 Power-Up Hint: {currentWarmup.hintPowerup}</p>
            </div>
          </div>

          <form className="rescue-form" onSubmit={handleRescueSubmit}>
            <div className="sparkle-chip-row">
              <span className="chip-helper-label">Need a fast starter? Click one:</span>
              {SPARKLE_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="starter-pill"
                  onClick={() => appendChip(chip)}
                >
                  + {chip.trim()}
                </button>
              ))}
              <button
                type="button"
                className="ghost-link-btn"
                onClick={() => setShowExample((v) => !v)}
              >
                {showExample ? 'Hide Example' : '👀 Peek at Example'}
              </button>
            </div>

            {showExample && (
              <div className="example-callout">
                <strong>📘 Author Example:</strong> "{currentWarmup.exampleCaption}"
              </div>
            )}

            <label htmlFor="rescue-caption-input" className="field-label">
              ✍️ Your Exciting Photo Caption (just 1 punchy sentence!):
            </label>
            <textarea
              id="rescue-caption-input"
              className="textarea-input textarea-short"
              rows={2}
              maxLength={350}
              placeholder="Write your jaw-dropping documentary caption here..."
              value={currentCaption}
              onChange={(e) =>
                setCaptionDrafts((prev) => ({
                  ...prev,
                  [currentWarmup.challengeId]: e.target.value,
                }))
              }
            />

            <div className="form-actions-row">
              <button type="submit" className="btn-primary btn-coral" disabled={savingWarmup}>
                {savingWarmup ? 'Saving...' : '✨ Rescue This Fact! (+10 ⭐)'}
              </button>
              {warmupBanner && <span className="inline-feedback">{warmupBanner}</span>}
            </div>
          </form>
        </section>
      )}

      {/* STEP 3: PICK YOUR DOCUMENTARY MISSION */}
      <section className="journal-card card-navy">
        <span className="step-badge badge-navy">STEP 3 • CHOOSE YOUR BOOK TOPIC</span>
        <h2 className="section-title">🌍 Pick Your Documentary Feature Story!</h2>
        <p className="section-sub">
          Every topic comes with 4 real-world facts and explorer vocabulary ready for your
          structured writing blueprint.
        </p>

        <div className="topic-grid">
          {topics.map((topic) => {
            const isSelected = topic.topicId === selectedTopicId;
            const isPeeking = peekTopicId === topic.topicId;
            return (
              <article
                key={topic.topicId}
                className={`topic-card ${isSelected ? 'topic-card-selected' : ''}`}
              >
                <div className="topic-card-top">
                  <span className="topic-emoji" aria-hidden="true">
                    {topic.emoji}
                  </span>
                  <span className="topic-category">{topic.category}</span>
                </div>
                <h3 className="topic-title">{topic.title}</h3>
                <p className="topic-hook-fact">{topic.hookFact}</p>

                {isPeeking && (
                  <ul className="topic-peek-list">
                    {topic.facts.map((fact, idx) => (
                      <li key={idx}>{fact}</li>
                    ))}
                  </ul>
                )}

                <div className="topic-card-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setPeekTopicId(isPeeking ? null : topic.topicId)}
                  >
                    {isPeeking ? 'Hide Facts' : '🔎 Peek Facts'}
                  </button>
                  <button
                    type="button"
                    className="btn-primary btn-navy"
                    onClick={() => onSelectTopicAndStart(topic.topicId)}
                  >
                    Write This Book →
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
