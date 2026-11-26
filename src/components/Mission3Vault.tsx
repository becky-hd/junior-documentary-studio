import { useState } from 'react';
import type { TopicItem, WordVaultItem } from '../types';

interface Mission3VaultProps {
  wordVault: WordVaultItem[];
  topics: TopicItem[];
  onPickTopic: (topicId: string) => void;
}

const TRANSITION_CHEAT_SHEET = [
  {
    job: 'Start Fact #1',
    words: ['First,', 'To begin,', 'Amazingly,', 'One incredible fact is that...'],
  },
  {
    job: 'Add a Zoom-In Detail',
    words: ['For example,', 'For instance,', 'In fact,', 'This happens because...'],
  },
  {
    job: 'Add Fact #2 or #3',
    words: ['In addition,', 'Also,', 'Another astonishing fact is that...', 'Even cooler,'],
  },
  {
    job: 'Surprise Your Reader',
    words: ['Believe it or not,', 'Surprisingly,', 'Most amazingly,', 'Imagine this:'],
  },
  {
    job: 'Wrap Up Strongly',
    words: ['Without a doubt,', 'In conclusion,', 'Clearly,', 'All in all,'],
  },
];

export function Mission3Vault({ wordVault, topics, onPickTopic }: Mission3VaultProps) {
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  function toggleCard(id: string) {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="mission-stack">
      <section className="journal-card card-purple">
        <span className="step-badge badge-purple">AUTHOR TOOLBOX • PART 1</span>
        <h2 className="section-title">💎 Sleepy Word → Book-Worthy Word Vault</h2>
        <p className="section-sub">
          Tap any sleepy word card to reveal juicy book-worthy upgrades and strong action verbs!
        </p>

        <div className="vault-grid">
          {wordVault.map((item) => {
            const isOpen = Boolean(revealedIds[item.wordId]);
            return (
              <button
                key={item.wordId}
                type="button"
                className={`vault-card ${isOpen ? 'vault-card-open' : ''}`}
                onClick={() => toggleCard(item.wordId)}
              >
                <div className="vault-card-head">
                  <span className="vault-sleepy">💤 {item.sleepyWord}</span>
                  <span className="vault-toggle-tag">{isOpen ? '✨ Unlocked' : 'Tap to Upgrade'}</span>
                </div>
                <div className="vault-upgrades">
                  {item.upgrades.map((u) => (
                    <span key={u} className="vault-juicy-pill">
                      {u}
                    </span>
                  ))}
                </div>
                {isOpen && (
                  <div className="vault-extra">
                    <div className="vault-verbs">
                      <strong>Action Verbs:</strong> {item.actionVerbs.join(', ')}
                    </div>
                    <p className="vault-example">"{item.exampleSentence}"</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="journal-card card-teal">
        <span className="step-badge badge-teal">AUTHOR TOOLBOX • PART 2</span>
        <h2 className="section-title">🔗 Transition Word Glue Bank</h2>
        <p className="section-sub">
          Transition words connect your facts smoothly like a published nonfiction book.
        </p>
        <div className="transition-bank-grid">
          {TRANSITION_CHEAT_SHEET.map((row) => (
            <div key={row.job} className="transition-bank-card">
              <h3>{row.job}</h3>
              <div className="vocab-chips">
                {row.words.map((w) => (
                  <span key={w} className="transition-chip">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="journal-card card-coral">
        <span className="step-badge badge-coral">AUTHOR TOOLBOX • PART 3</span>
        <h2 className="section-title">📚 Mini Documentary Fact Encyclopedia</h2>
        <p className="section-sub">
          Explore 6 real nonfiction Fact Packs loaded straight from our Google Sheets database!
        </p>
        <div className="encyclopedia-grid">
          {topics.map((topic) => (
            <article key={topic.topicId} className="encyclopedia-card">
              <div className="topic-card-top">
                <span className="topic-emoji" aria-hidden="true">
                  {topic.emoji}
                </span>
                <span className="topic-category">{topic.category}</span>
              </div>
              <h3 className="topic-title">{topic.title}</h3>
              <ol className="fact-pack-list">
                {topic.facts.map((fact, idx) => (
                  <li key={idx}>{fact}</li>
                ))}
              </ol>
              <div className="vocab-chips">
                {topic.vocab.map((word) => (
                  <span key={word} className="vocab-chip">
                    {word}
                  </span>
                ))}
              </div>
              <div className="encyclopedia-footer">
                <button
                  type="button"
                  className="btn-primary btn-navy"
                  onClick={() => onPickTopic(topic.topicId)}
                >
                  ✍️ Write About {topic.title} →
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
