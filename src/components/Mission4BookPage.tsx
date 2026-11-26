import type { StudentProfile, TopicItem, WritingDraft } from '../types';
import {
  CHECKLIST_LABELS,
  STICKER_PALETTE,
  assembleParagraphs,
  computeAuthorRank,
  countDraftWords,
} from '../data/writingHelpers';

interface Mission4BookPageProps {
  profile: StudentProfile | null;
  draft: WritingDraft;
  topic: TopicItem;
  savedDrafts: WritingDraft[];
  saving: boolean;
  saveStatus: string;
  onChangeDraft: (updater: (prev: WritingDraft) => WritingDraft) => void;
  onSaveDraft: () => Promise<void>;
  onLoadDraft: (draft: WritingDraft) => void;
  onStartNewBook: () => void;
  onBackToBlueprint: () => void;
}

export function Mission4BookPage({
  profile,
  draft,
  topic,
  savedDrafts,
  saving,
  saveStatus,
  onChangeDraft,
  onSaveDraft,
  onLoadDraft,
  onStartNewBook,
  onBackToBlueprint,
}: Mission4BookPageProps) {
  const assembled = assembleParagraphs(draft);
  const wordCount = countDraftWords(draft);
  const rank = computeAuthorRank(draft.checklist);

  const factBlocksFilled = [
    draft.fact1,
    draft.zoom1,
    draft.fact2,
    draft.zoom2,
    draft.fact3,
    draft.zoom3,
  ].filter((v) => v.trim().length > 0).length;

  const autoHints = [
    draft.catchyTitle.trim() ? '✅ Title written!' : '✏️ Add Title in Mission 2',
    draft.hookSentence.trim() ? '✅ Hook ready!' : '✏️ Add Hook in Mission 2',
    draft.topicSentence.trim() ? '✅ Topic ready!' : '✏️ Add Topic Sentence',
    factBlocksFilled === 6
      ? '✅ All 6 Fact + Zoom-In blocks filled!'
      : `✏️ ${factBlocksFilled}/6 Fact + Zoom-In blocks filled`,
    '✅ Transition dropdowns connected!',
    draft.closingSentence.trim() ? '✅ Strong ending ready!' : '✏️ Add Wrap-Up Sentence',
    '👀 Read your page aloud like a TV host!',
    '💎 Check Word Vault for juicy upgrades!',
  ];

  function toggleChecklist(idx: number) {
    onChangeDraft((prev) => {
      const next = [...prev.checklist];
      next[idx] = !next[idx];
      return { ...prev, checklist: next };
    });
  }

  function toggleSticker(emoji: string) {
    onChangeDraft((prev) => {
      const exists = prev.stickers.includes(emoji);
      if (exists) {
        return { ...prev, stickers: prev.stickers.filter((s) => s !== emoji) };
      }
      if (prev.stickers.length >= 6) return prev;
      return { ...prev, stickers: [...prev.stickers, emoji] };
    });
  }

  return (
    <div className="mission-stack">
      {/* ACTION BAR */}
      <div className="publish-toolbar no-print">
        <div className="publish-toolbar-left">
          <button type="button" className="btn-secondary" onClick={onBackToBlueprint}>
            ← Back to Blueprint
          </button>
          <button
            type="button"
            className="btn-primary btn-teal"
            onClick={onSaveDraft}
            disabled={saving}
          >
            {saving ? 'Saving...' : '💾 Save Published Book'}
          </button>
          <button type="button" className="btn-primary btn-navy" onClick={() => window.print()}>
            🖨️ Print Book Page
          </button>
          <button type="button" className="btn-secondary" onClick={onStartNewBook}>
            ✨ Start New Book
          </button>
        </div>
        {saveStatus && <span className="inline-feedback">{saveStatus}</span>}
      </div>

      {/* PRINTABLE MAGAZINE BOOK PAGE */}
      <article className="magazine-page">
        <div className="magazine-masthead">
          <span>NATIONAL KID-GEOGRAPHIC • SPECIAL EDITION</span>
          <span>
            {topic.emoji} {topic.category.toUpperCase()}
          </span>
        </div>

        <div className="magazine-title-block">
          <h2 className="magazine-headline">
            {draft.catchyTitle.trim() || '✨ Your Catchy Documentary Title Will Appear Here!'}
          </h2>
          <p className="magazine-byline">
            Written by <strong>{profile?.authorName || 'Junior Explorer'}</strong> (
            {profile?.avatarEmoji || '🧭'} {profile?.explorerTitle || 'Documentary Author'}) •{' '}
            {wordCount} words
          </p>
        </div>

        <div className="magazine-columns">
          <div className="magazine-article-col">
            {assembled.intro || assembled.body || assembled.conclusion ? (
              <>
                {assembled.intro && <p className="magazine-lead">{assembled.intro}</p>}
                {assembled.body && <p className="magazine-body">{assembled.body}</p>}
                {assembled.conclusion && (
                  <p className="magazine-conclusion">{assembled.conclusion}</p>
                )}
              </>
            ) : (
              <div className="magazine-empty">
                <p>
                  Your structured documentary paragraphs will magically assemble right here as you
                  complete <strong>Mission 2: Story Blueprint</strong>!
                </p>
                <button
                  type="button"
                  className="btn-primary btn-blue no-print"
                  onClick={onBackToBlueprint}
                >
                  🧱 Open Story Blueprint →
                </button>
              </div>
            )}
          </div>

          <aside className="magazine-sidebar-col">
            {/* DID YOU KNOW CALLOUT */}
            <div className="did-you-know-card">
              <div className="dyk-header">🤯 DID YOU KNOW?</div>
              <textarea
                aria-label="Bonus Fun Fact"
                className="sidebar-textarea"
                rows={3}
                maxLength={350}
                placeholder="Write 1 bonus jaw-dropping fun fact for your magazine sidebar!"
                value={draft.bonusFact}
                onChange={(e) =>
                  onChangeDraft((prev) => ({ ...prev, bonusFact: e.target.value }))
                }
              />
            </div>

            {/* ILLUSTRATION & STICKER SCENE */}
            <div className="illustration-card">
              <div className="illus-header">🎨 ILLUSTRATION FRAME</div>
              <div className="sticker-stage" aria-label="Selected illustration stickers">
                {draft.stickers.length > 0 ? (
                  draft.stickers.map((st, idx) => (
                    <span key={`${st}-${idx}`} className="staged-sticker">
                      {st}
                    </span>
                  ))
                ) : (
                  <span className="sticker-placeholder">
                    Stamp stickers below — or print &amp; draw your own picture here!
                  </span>
                )}
              </div>

              <div className="sticker-picker no-print">
                {STICKER_PALETTE.map((emoji) => {
                  const active = draft.stickers.includes(emoji);
                  return (
                    <button
                      key={emoji}
                      type="button"
                      className={`sticker-btn ${active ? 'sticker-btn-active' : ''}`}
                      onClick={() => toggleSticker(emoji)}
                      title={active ? 'Remove sticker' : 'Add sticker'}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                aria-label="Photo or Illustration Caption"
                className="caption-input"
                maxLength={300}
                placeholder="Write your photo caption here..."
                value={draft.illustrationCaption}
                onChange={(e) =>
                  onChangeDraft((prev) => ({ ...prev, illustrationCaption: e.target.value }))
                }
              />
            </div>
          </aside>
        </div>
      </article>

      {/* EDITOR-IN-CHIEF CHECKLIST & BADGE */}
      <section className="journal-card card-purple no-print">
        <div className="card-header-row">
          <div>
            <span className="step-badge badge-purple">FINAL CHECK • UNLOCK YOUR BADGE</span>
            <h2 className="section-title">✅ Editor-in-Chief Checklist</h2>
            <p className="section-sub">
              Read your published page out loud like a real documentary host and check every box!
            </p>
          </div>
          <div className="trophy-badge-box">
            <div className="trophy-emoji" aria-hidden="true">
              {rank.emoji}
            </div>
            <div className="trophy-title">{rank.title}</div>
            <div className="trophy-count">{rank.checkedCount} / 8 Checked</div>
          </div>
        </div>

        <ul className="checklist-list">
          {CHECKLIST_LABELS.map((label, idx) => (
            <li key={idx} className={`checklist-item ${draft.checklist[idx] ? 'checklist-done' : ''}`}>
              <label className="checklist-label">
                <input
                  type="checkbox"
                  checked={Boolean(draft.checklist[idx])}
                  onChange={() => toggleChecklist(idx)}
                />
                <span>{label}</span>
              </label>
              <span className="checklist-hint">{autoHints[idx]}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* SAVED BOOKS LIBRARY */}
      {savedDrafts.length > 0 && (
        <section className="journal-card card-navy no-print">
          <h3 className="section-title">📚 My Saved Documentary Library ({savedDrafts.length})</h3>
          <div className="library-grid">
            {savedDrafts.map((item) => (
              <button
                key={item.draftId}
                type="button"
                className={`library-card ${item.draftId === draft.draftId ? 'library-card-active' : ''}`}
                onClick={() => onLoadDraft(item)}
              >
                <strong>{item.catchyTitle || 'Untitled Documentary'}</strong>
                <span>
                  {item.wordCount} words • {item.rank}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
