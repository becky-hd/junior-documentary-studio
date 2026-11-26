import { useState } from 'react';
import type { TopicItem, WordVaultItem, WritingDraft } from '../types';
import { TOPIC_FACT_IMAGES, type FactImageItem } from '../data/topicImages';
import {
  HOOK_SUPERPOWERS,
  MODEL_MIMIC_OCTOPUS,
  TRANSITION_OPTIONS,
  assembleParagraphs,
  countDraftWords,
  countFilledBlocks,
  detectSleepyWords,
  replaceSleepyWord,
} from '../data/writingHelpers';

interface Mission2BlueprintProps {
  draft: WritingDraft;
  savedDrafts: WritingDraft[];
  topic: TopicItem;
  topics: TopicItem[];
  wordVault: WordVaultItem[];
  saving: boolean;
  saveStatus: string;
  onChangeDraft: (updater: (prev: WritingDraft) => WritingDraft) => void;
  onLoadDraft: (draft: WritingDraft) => void;
  onSaveDraft: () => Promise<void>;
  onGoPublish: () => void;
}

const TITLE_STARTERS = [
  'The Secret Life of ',
  'Incredible ',
  'Watch Out for ',
  'Inside the World of ',
];

const TOPIC_STARTERS = [
  'Meet the amazing ',
  'Get ready to explore ',
  'Scientists have discovered that ',
  'One of the most fascinating wonders in nature is ',
];

interface SleepyHelperProps {
  text: string;
  wordVault: WordVaultItem[];
  onUpgrade: (sleepy: string, juicy: string) => void;
}

function SleepyWordHelper({ text, wordVault, onUpgrade }: SleepyHelperProps) {
  const hits = detectSleepyWords(text, wordVault);
  if (hits.length === 0) return null;

  return (
    <div className="word-detective-bar">
      <span className="word-detective-label">💎 Word Detective spotted a sleepy word! Upgrade it:</span>
      {hits.slice(0, 2).map((hit) => (
        <div key={hit.wordId} className="word-detective-group">
          <span className="sleepy-pill">{hit.sleepyWord}</span>
          <span aria-hidden="true">→</span>
          {hit.upgrades.slice(0, 3).map((up) => (
            <button
              key={up}
              type="button"
              className="upgrade-pill"
              onClick={() => onUpgrade(hit.sleepyWord, up)}
            >
              ✨ {up}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export function Mission2Blueprint({
  draft,
  savedDrafts,
  topic,
  topics,
  wordVault,
  saving,
  saveStatus,
  onChangeDraft,
  onLoadDraft,
  onSaveDraft,
  onGoPublish,
}: Mission2BlueprintProps) {
  const [showModel, setShowModel] = useState(true);
  const [showFactPack, setShowFactPack] = useState(true);
  const [zoomedPhoto, setZoomedPhoto] = useState<FactImageItem | null>(null);
  const factPhotos = TOPIC_FACT_IMAGES[topic.topicId] || TOPIC_FACT_IMAGES['mimic-octopus'];

  const filledBlocks = countFilledBlocks(draft);
  const wordCount = countDraftWords(draft);
  const assembled = assembleParagraphs(draft);

  function setField<K extends keyof WritingDraft>(key: K, value: WritingDraft[K]) {
    onChangeDraft((prev) => ({ ...prev, [key]: value }));
  }

  function upgradeInField(
    key:
      | 'catchyTitle'
      | 'hookSentence'
      | 'topicSentence'
      | 'fact1'
      | 'zoom1'
      | 'fact2'
      | 'zoom2'
      | 'fact3'
      | 'zoom3'
      | 'closingSentence',
    sleepy: string,
    juicy: string
  ) {
    onChangeDraft((prev) => ({
      ...prev,
      [key]: replaceSleepyWord(prev[key], sleepy, juicy),
    }));
  }

  const factPairs: {
    num: number;
    tKey: 't1' | 't2' | 't3';
    fKey: 'fact1' | 'fact2' | 'fact3';
    tzKey: 'tz1' | 'tz2' | 'tz3';
    zKey: 'zoom1' | 'zoom2' | 'zoom3';
    factPrompt: string;
    zoomPrompt: string;
    modelFact: string;
    modelZoom: string;
  }[] = [
    {
      num: 1,
      tKey: 't1',
      fKey: 'fact1',
      tzKey: 'tz1',
      zKey: 'zoom1',
      factPrompt: 'Share your first awesome real fact!',
      zoomPrompt: 'ZOOM IN! Explain HOW it works, WHY it happens, or give an example.',
      modelFact: MODEL_MIMIC_OCTOPUS.fact1,
      modelZoom: MODEL_MIMIC_OCTOPUS.zoom1,
    },
    {
      num: 2,
      tKey: 't2',
      fKey: 'fact2',
      tzKey: 'tz2',
      zKey: 'zoom2',
      factPrompt: 'Share your second surprising fact!',
      zoomPrompt: 'ZOOM IN! Paint a picture or add proof so the reader feels amazed.',
      modelFact: MODEL_MIMIC_OCTOPUS.fact2,
      modelZoom: MODEL_MIMIC_OCTOPUS.zoom2,
    },
    {
      num: 3,
      tKey: 't3',
      fKey: 'fact3',
      tzKey: 'tz3',
      zKey: 'zoom3',
      factPrompt: 'Share your wildest third fact!',
      zoomPrompt: 'ZOOM IN! Tell why this fact matters or what scientists learned.',
      modelFact: MODEL_MIMIC_OCTOPUS.fact3,
      modelZoom: MODEL_MIMIC_OCTOPUS.zoom3,
    },
  ];

  return (
    <div className="blueprint-layout">
      <div className="blueprint-main">
        {/* TOP BLUEPRINT METER */}
        <section className="journal-card card-blue">
          <div className="card-header-row">
            <div>
              <span className="step-badge badge-blue">MISSION 2 • STRUCTURED WRITING LAB</span>
              <h2 className="section-title">
                {topic.emoji} Documentary Blueprint: {topic.title}
              </h2>
              <p className="section-sub">
                Build your nonfiction page one structured block at a time. Every box you fill
                magically builds your published book page!
              </p>
            </div>
            <div className="blueprint-controls">
              <select
                aria-label="Switch Documentary Topic"
                className="select-input select-compact"
                value={draft.topicId}
                onChange={(e) => setField('topicId', e.target.value)}
              >
                {topics.map((t) => (
                  <option key={t.topicId} value={t.topicId}>
                    {t.emoji} {t.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowModel((v) => !v)}
              >
                {showModel ? '📘 Hide Model' : '📘 Show Model'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowFactPack((v) => !v)}
              >
                {showFactPack ? '🔎 Hide Facts' : '🔎 Show Facts'}
              </button>
            </div>
          </div>

          <div className="meter-strip">
            <div className="meter-labels">
              <strong>🧱 Structure Blocks: {filledBlocks} / 10</strong>
              <span>📝 Total Words: {wordCount}</span>
            </div>
            <div className="meter-dots" aria-hidden="true">
              {Array.from({ length: 10 }).map((_, idx) => (
                <span
                  key={idx}
                  className={`meter-dot ${idx < filledBlocks ? 'meter-dot-filled' : ''}`}
                />
              ))}
            </div>
          </div>

          {savedDrafts.length > 0 && (
            <div className="saved-drafts-strip">
              <span className="chip-helper-label">📚 Saved Books:</span>
              {savedDrafts.map((item) => (
                <button
                  key={item.draftId}
                  type="button"
                  className={`starter-pill ${item.draftId === draft.draftId ? 'saved-pill-active' : ''}`}
                  onClick={() => onLoadDraft(item)}
                >
                  📘 {item.catchyTitle || 'Untitled'} ({item.wordCount}w)
                </button>
              ))}
            </div>
          )}
        </section>

        {/* BLOCK 1: TITLE */}
        <section className="blueprint-block block-intro">
          <div className="block-title-row">
            <h3>1. Catchy Documentary Title</h3>
            <span className={`block-status ${draft.catchyTitle.trim() ? 'status-done' : ''}`}>
              {draft.catchyTitle.trim() ? '✅ Ready' : '✏️ Waiting'}
            </span>
          </div>
          <div className="sparkle-chip-row">
            <span className="chip-helper-label">Title ideas:</span>
            {TITLE_STARTERS.map((st) => (
              <button
                key={st}
                type="button"
                className="starter-pill"
                onClick={() => setField('catchyTitle', `${st}${topic.title}`)}
              >
                + {st}...
              </button>
            ))}
          </div>
          <input
            type="text"
            maxLength={140}
            className="text-input input-writing"
            placeholder={`Example: ${topic.modelTitle}`}
            value={draft.catchyTitle}
            onChange={(e) => setField('catchyTitle', e.target.value)}
          />
          <SleepyWordHelper
            text={draft.catchyTitle}
            wordVault={wordVault}
            onUpgrade={(s, j) => upgradeInField('catchyTitle', s, j)}
          />
          {showModel && (
            <p className="model-note">
              <strong>📘 Model Example:</strong> {MODEL_MIMIC_OCTOPUS.catchyTitle}
            </p>
          )}
        </section>

        {/* BLOCK 2: OPENING HOOK */}
        <section className="blueprint-block block-intro">
          <div className="block-title-row">
            <h3>2. Opening Hook (Grab Your Reader Fast!)</h3>
            <span className={`block-status ${draft.hookSentence.trim() ? 'status-done' : ''}`}>
              {draft.hookSentence.trim() ? '✅ Ready' : '✏️ Waiting'}
            </span>
          </div>
          <div className="hook-power-grid">
            {HOOK_SUPERPOWERS.map((hp) => (
              <button
                key={hp.name}
                type="button"
                className={`hook-power-card ${
                  draft.hookStyle === hp.name ? 'hook-power-active' : ''
                }`}
                onClick={() => setField('hookStyle', hp.name)}
              >
                <div className="hook-power-head">
                  <span aria-hidden="true">{hp.emoji}</span>
                  <strong>{hp.name}</strong>
                </div>
                <p className="hook-power-tip">{hp.tip}</p>
              </button>
            ))}
          </div>
          <textarea
            className="textarea-input input-writing"
            rows={2}
            maxLength={450}
            placeholder={`Try a ${draft.hookStyle}! Example: ${topic.modelHook}`}
            value={draft.hookSentence}
            onChange={(e) => setField('hookSentence', e.target.value)}
          />
          <SleepyWordHelper
            text={draft.hookSentence}
            wordVault={wordVault}
            onUpgrade={(s, j) => upgradeInField('hookSentence', s, j)}
          />
          {showModel && (
            <p className="model-note">
              <strong>📘 Model Example:</strong> {MODEL_MIMIC_OCTOPUS.hookSentence}
            </p>
          )}
        </section>

        {/* BLOCK 3: TOPIC SENTENCE */}
        <section className="blueprint-block block-intro">
          <div className="block-title-row">
            <h3>3. Topic Sentence (State Your Big Idea!)</h3>
            <span className={`block-status ${draft.topicSentence.trim() ? 'status-done' : ''}`}>
              {draft.topicSentence.trim() ? '✅ Ready' : '✏️ Waiting'}
            </span>
          </div>
          <div className="sparkle-chip-row">
            <span className="chip-helper-label">Sentence starters:</span>
            {TOPIC_STARTERS.map((st) => (
              <button
                key={st}
                type="button"
                className="starter-pill"
                onClick={() => setField('topicSentence', `${st}${draft.topicSentence}`)}
              >
                + {st.trim()}
              </button>
            ))}
          </div>
          <textarea
            className="textarea-input input-writing"
            rows={2}
            maxLength={450}
            placeholder={`Tell readers what your whole book page is about! Example: ${topic.modelTopicSentence}`}
            value={draft.topicSentence}
            onChange={(e) => setField('topicSentence', e.target.value)}
          />
          <SleepyWordHelper
            text={draft.topicSentence}
            wordVault={wordVault}
            onUpgrade={(s, j) => upgradeInField('topicSentence', s, j)}
          />
          {showModel && (
            <p className="model-note">
              <strong>📘 Model Example:</strong> {MODEL_MIMIC_OCTOPUS.topicSentence}
            </p>
          )}
        </section>

        {/* FACT + ZOOM-IN RULE BANNER */}
        <div className="rule-banner">
          <strong>🔬 THE FACT + ZOOM-IN RULE:</strong> Real documentary authors never just list
          facts — right after EVERY fact, they <strong>ZOOM IN</strong> with an example, reason, or
          "how it works" detail!
        </div>

        {/* BLOCKS 4, 5, 6: FACT + ZOOM-IN PAIRS */}
        {factPairs.map((pair) => (
          <section key={pair.num} className="blueprint-block block-fact-pair">
            <div className="fact-subblock">
              <div className="block-title-row">
                <h3>
                  {pair.num + 3}A. Real Fact #{pair.num}
                </h3>
                <span className={`block-status ${draft[pair.fKey].trim() ? 'status-done' : ''}`}>
                  {draft[pair.fKey].trim() ? '✅ Fact Ready' : '✏️ Fact'}
                </span>
              </div>
              <div className="transition-input-row">
                <select
                  aria-label={`Transition for Fact ${pair.num}`}
                  className="select-input transition-select"
                  value={draft[pair.tKey]}
                  onChange={(e) => setField(pair.tKey, e.target.value)}
                >
                  {TRANSITION_OPTIONS[pair.tKey].map((tr) => (
                    <option key={tr} value={tr}>
                      {tr}
                    </option>
                  ))}
                </select>
                <textarea
                  className="textarea-input input-writing"
                  rows={2}
                  maxLength={450}
                  placeholder={pair.factPrompt}
                  value={draft[pair.fKey]}
                  onChange={(e) => setField(pair.fKey, e.target.value)}
                />
              </div>
              <SleepyWordHelper
                text={draft[pair.fKey]}
                wordVault={wordVault}
                onUpgrade={(s, j) => upgradeInField(pair.fKey, s, j)}
              />
              {showModel && (
                <p className="model-note">
                  <strong>📘 Model Fact #{pair.num}:</strong> {pair.modelFact}
                </p>
              )}
            </div>

            <div className="zoom-subblock">
              <div className="block-title-row">
                <h4>
                  🔍 {pair.num + 3}B. Zoom-In Detail #{pair.num}
                </h4>
                <span className={`block-status ${draft[pair.zKey].trim() ? 'status-done' : ''}`}>
                  {draft[pair.zKey].trim() ? '✅ Zoomed In!' : '🔍 Zoom In'}
                </span>
              </div>
              <div className="transition-input-row">
                <select
                  aria-label={`Transition for Zoom-In ${pair.num}`}
                  className="select-input transition-select"
                  value={draft[pair.tzKey]}
                  onChange={(e) => setField(pair.tzKey, e.target.value)}
                >
                  {TRANSITION_OPTIONS[pair.tzKey].map((tr) => (
                    <option key={tr} value={tr}>
                      {tr}
                    </option>
                  ))}
                </select>
                <textarea
                  className="textarea-input input-writing"
                  rows={2}
                  maxLength={450}
                  placeholder={pair.zoomPrompt}
                  value={draft[pair.zKey]}
                  onChange={(e) => setField(pair.zKey, e.target.value)}
                />
              </div>
              <SleepyWordHelper
                text={draft[pair.zKey]}
                wordVault={wordVault}
                onUpgrade={(s, j) => upgradeInField(pair.zKey, s, j)}
              />
              {showModel && (
                <p className="model-note">
                  <strong>📘 Model Zoom-In #{pair.num}:</strong> {pair.modelZoom}
                </p>
              )}
            </div>
          </section>
        ))}

        {/* BLOCK 7: WRAP-UP */}
        <section className="blueprint-block block-finale">
          <div className="block-title-row">
            <h3>7. Grand Finale Wrap-Up Sentence</h3>
            <span className={`block-status ${draft.closingSentence.trim() ? 'status-done' : ''}`}>
              {draft.closingSentence.trim() ? '✅ Strong Ending!' : '🎬 Finale'}
            </span>
          </div>
          <div className="transition-input-row">
            <select
              aria-label="Closing Transition"
              className="select-input transition-select"
              value={draft.tEnd}
              onChange={(e) => setField('tEnd', e.target.value)}
            >
              {TRANSITION_OPTIONS.tEnd.map((tr) => (
                <option key={tr} value={tr}>
                  {tr}
                </option>
              ))}
            </select>
            <textarea
              className="textarea-input input-writing"
              rows={2}
              maxLength={450}
              placeholder="Leave your reader amazed and thinking about your topic!"
              value={draft.closingSentence}
              onChange={(e) => setField('closingSentence', e.target.value)}
            />
          </div>
          <SleepyWordHelper
            text={draft.closingSentence}
            wordVault={wordVault}
            onUpgrade={(s, j) => upgradeInField('closingSentence', s, j)}
          />
          {showModel && (
            <p className="model-note">
              <strong>📘 Model Wrap-Up:</strong> {MODEL_MIMIC_OCTOPUS.closingSentence}
            </p>
          )}
        </section>

        {/* LIVE MINI PREVIEW + SAVE BAR */}
        <section className="journal-card card-teal">
          <h3 className="live-preview-heading">✨ Instant Live Paragraph Preview</h3>
          {assembled.intro || assembled.body || assembled.conclusion ? (
            <div className="live-draft-paper">
              {assembled.intro && <p>{assembled.intro}</p>}
              {assembled.body && <p>{assembled.body}</p>}
              {assembled.conclusion && <p>{assembled.conclusion}</p>}
            </div>
          ) : (
            <p className="empty-preview-copy">
              Start typing in any block above and watch your structured documentary story snap
              together here!
            </p>
          )}

          <div className="form-actions-row">
            <button
              type="button"
              className="btn-primary btn-teal"
              onClick={onSaveDraft}
              disabled={saving}
            >
              {saving ? 'Saving to Sheet...' : '💾 Save My Story Progress'}
            </button>
            <button type="button" className="btn-primary btn-gold" onClick={onGoPublish}>
              📘 Open My Published Book Page →
            </button>
            {saveStatus && <span className="inline-feedback">{saveStatus}</span>}
          </div>
        </section>
      </div>

      {/* SIDEBAR: TOPIC FACT PACK DRAWER */}
      {showFactPack && (
        <aside className="fact-sidebar">
          <div className="fact-sidebar-card">
            <div className="fact-sidebar-head">
              <span className="fact-sidebar-emoji" aria-hidden="true">
                {topic.emoji}
              </span>
              <div>
                <div className="mini-kicker">FACT PACK</div>
                <h3>{topic.title}</h3>
              </div>
            </div>

            <div className="fact-photo-section">
              <div className="mini-kicker">📸 FIELD PHOTOS (TAP TO ZOOM)</div>
              <div className="fact-photo-grid">
                {factPhotos.map((img, idx) => (
                  <button
                    key={img.src}
                    type="button"
                    className={`fact-photo-card ${idx === 0 ? 'fact-photo-hero' : ''}`}
                    onClick={() => setZoomedPhoto(img)}
                  >
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="fact-photo-img"
                      loading="lazy"
                    />
                    <span className="fact-photo-badge">{img.factBadge}</span>
                    <span className="fact-photo-caption">{img.caption}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="fact-sidebar-note">
              Read these real facts, then put them in <strong>YOUR OWN WORDS</strong> inside your
              Blueprint!
            </p>
            <ol className="fact-pack-list">
              {topic.facts.map((f, idx) => (
                <li key={idx}>{f}</li>
              ))}
            </ol>
            <div className="vocab-box">
              <div className="mini-kicker">🌟 EXPLORER VOCABULARY</div>
              <div className="vocab-chips">
                {topic.vocab.map((word) => (
                  <span key={word} className="vocab-chip">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>
      )}

      {zoomedPhoto && (
        <div
          className="modal-backdrop no-print"
          role="dialog"
          aria-modal="true"
          aria-label={zoomedPhoto.caption}
          onClick={() => setZoomedPhoto(null)}
        >
          <div className="photo-lightbox-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                📸 {zoomedPhoto.factBadge}: {zoomedPhoto.caption}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setZoomedPhoto(null)}
                aria-label="Close photo"
              >
                ✕
              </button>
            </div>
            <img src={zoomedPhoto.src} alt={zoomedPhoto.alt} className="photo-lightbox-img" />
            <p className="photo-lightbox-alt">{zoomedPhoto.alt}</p>
          </div>
        </div>
      )}
    </div>
  );
}
