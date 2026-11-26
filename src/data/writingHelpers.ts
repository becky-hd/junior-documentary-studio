import type { WordVaultItem, WritingDraft } from '../types';

export const EXPLORER_TITLES = [
  'Wildlife Detective',
  'Deep-Sea Explorer',
  'Space Reporter',
  'Time-Traveling Historian',
  'Earth Scientist',
  'Creature Specialist',
] as const;

export const AVATAR_OPTIONS = [
  { emoji: '🦊', label: 'Clever Fox' },
  { emoji: '🦉', label: 'Wise Owl' },
  { emoji: '🐙', label: 'Ocean Explorer' },
  { emoji: '🦕', label: 'Dino Tracker' },
  { emoji: '🚀', label: 'Space Scout' },
  { emoji: '🦋', label: 'Nature Artist' },
] as const;

export const HOOK_SUPERPOWERS = [
  {
    name: 'Mind-Blowing Question',
    emoji: '❓',
    tip: "Ask a question that makes the reader say 'WAIT, WHAT?!'",
    example: 'Have you ever met an animal that can turn itself into a sea snake in one second?',
  },
  {
    name: 'Sound-Effect Action',
    emoji: '💥',
    tip: 'Start with a vivid sound right inside the scene!',
    example: 'SNAP! In less than half a second, a hungry green plant just caught its lunch.',
  },
  {
    name: 'Weird-But-True Fact',
    emoji: '🤯',
    tip: 'Drop your wildest true fact right on line one!',
    example: 'Believe it or not, a creature smaller than a grain of sand can survive in outer space.',
  },
  {
    name: 'Imagine-This Scene',
    emoji: '🎬',
    tip: 'Put the reader right inside the documentary!',
    example: 'Imagine diving deep into the dark ocean where glowing fish shine like tiny lanterns.',
  },
] as const;

export const TRANSITION_OPTIONS = {
  t1: ['First,', 'To begin,', 'Amazingly,', 'One incredible fact is that', 'Did you know that'],
  tz1: ['For example,', 'This happens because', 'In fact,', 'That means', 'Scientists noticed that'],
  t2: ['In addition,', 'Next,', 'Another astonishing fact is that', 'Also,', 'Even cooler,'],
  tz2: ['For instance,', 'Because of this,', 'Imagine this:', 'That helps it', 'Amazingly,'],
  t3: ['Finally,', 'Best of all,', 'Surprisingly,', 'Believe it or not,', 'Most amazingly,'],
  tz3: ['This shows that', 'That is why', 'Even today,', 'As a result,', 'No wonder'],
  tEnd: ['Without a doubt,', 'In conclusion,', 'Clearly,', 'All in all,', 'Next time you explore nature,'],
};

export const MODEL_MIMIC_OCTOPUS = {
  catchyTitle: "The Ocean's Greatest Shape-Shifter",
  hookSentence: 'Have you ever heard of a sea creature that can disguise itself as fifteen different animals?',
  topicSentence: 'Meet the mimic octopus, one of the smartest and sneakiest animals in the ocean.',
  fact1: 'First, the mimic octopus can change both its skin color and its body shape in seconds.',
  zoom1: 'For example, it can flatten its arms to glide like a poisonous flatfish across the sandy seafloor.',
  fact2: 'In addition, this clever creature chooses the exact disguise that scares its attacker most.',
  zoom2: 'For instance, if a hungry damselfish swims too close, it waves two striped arms like a venomous sea snake!',
  fact3: 'Surprisingly, scientists did not even discover the mimic octopus until 1998.',
  zoom3: 'This shows that its disguises worked so well it hid from human explorers for thousands of years!',
  closingSentence: 'Without a doubt, the mimic octopus proves that nature is full of brilliant actors waiting to be discovered.',
};

export const STICKER_PALETTE = ['🐙', '🪼', '🌋', '🪴', '🏺', '🐻', '🚀', '⭐', '🔎', '✨', '🦋', '🐚'];

export const CHECKLIST_LABELS = [
  'My title makes a reader curious to read more.',
  'I started with an exciting Hook sentence.',
  'My Topic Sentence clearly tells what my page is about.',
  'I shared 3 real facts AND added a Zoom-In detail for each.',
  'I used Transition Words (like First, For example, In addition).',
  'I ended with a strong Wrap-Up closing sentence.',
  'I checked CAPITAL letters at the start and . ? ! at the end.',
  'I upgraded at least 2 words using the Word Vault!',
];

export function createBlankDraft(topicId: string, studentId = ''): WritingDraft {
  return {
    draftId: '',
    studentId,
    topicId,
    catchyTitle: '',
    hookStyle: 'Mind-Blowing Question',
    hookSentence: '',
    topicSentence: '',
    t1: 'First,',
    fact1: '',
    tz1: 'For example,',
    zoom1: '',
    t2: 'In addition,',
    fact2: '',
    tz2: 'For instance,',
    zoom2: '',
    t3: 'Surprisingly,',
    fact3: '',
    tz3: 'This shows that',
    zoom3: '',
    tEnd: 'Without a doubt,',
    closingSentence: '',
    bonusFact: '',
    illustrationCaption: '',
    stickers: [],
    checklist: Array(8).fill(false),
    wordCount: 0,
    rank: 'Apprentice Explorer',
    updatedAt: '',
  };
}

export function glueSentence(transition: string, text: string): string {
  const clean = text.trim();
  if (!clean) return '';
  const tr = transition.trim();
  if (!tr) return clean;
  if (clean.toLowerCase().startsWith(tr.toLowerCase())) {
    return clean;
  }
  return `${tr} ${clean}`;
}

export function assembleParagraphs(draft: WritingDraft): {
  intro: string;
  body: string;
  conclusion: string;
} {
  const intro = [draft.hookSentence.trim(), draft.topicSentence.trim()].filter(Boolean).join(' ');
  const body = [
    glueSentence(draft.t1, draft.fact1),
    glueSentence(draft.tz1, draft.zoom1),
    glueSentence(draft.t2, draft.fact2),
    glueSentence(draft.tz2, draft.zoom2),
    glueSentence(draft.t3, draft.fact3),
    glueSentence(draft.tz3, draft.zoom3),
  ]
    .filter(Boolean)
    .join(' ');
  const conclusion = glueSentence(draft.tEnd, draft.closingSentence);
  return { intro, body, conclusion };
}

export function countDraftWords(draft: WritingDraft): number {
  const parts = [
    draft.catchyTitle,
    draft.hookSentence,
    draft.topicSentence,
    draft.fact1,
    draft.zoom1,
    draft.fact2,
    draft.zoom2,
    draft.fact3,
    draft.zoom3,
    draft.closingSentence,
  ];
  const joined = parts.filter(Boolean).join(' ').trim();
  if (!joined) return 0;
  return joined.split(/\s+/).filter(Boolean).length;
}

export function countFilledBlocks(draft: WritingDraft): number {
  return [
    draft.catchyTitle,
    draft.hookSentence,
    draft.topicSentence,
    draft.fact1,
    draft.zoom1,
    draft.fact2,
    draft.zoom2,
    draft.fact3,
    draft.zoom3,
    draft.closingSentence,
  ].filter((v) => v.trim().length > 0).length;
}

export function computeAuthorRank(checklist: boolean[]): {
  title: string;
  emoji: string;
  checkedCount: number;
} {
  const checkedCount = checklist.filter(Boolean).length;
  if (checkedCount >= 8) {
    return { title: 'Master Published Author!', emoji: '🏆', checkedCount };
  }
  if (checkedCount >= 5) {
    return { title: 'Junior Documentary Author', emoji: '📘', checkedCount };
  }
  if (checkedCount >= 2) {
    return { title: 'Fact Detective', emoji: '🔎', checkedCount };
  }
  return { title: 'Apprentice Explorer', emoji: '📝', checkedCount };
}

export function detectSleepyWords(text: string, vault: WordVaultItem[]): WordVaultItem[] {
  if (!text.trim()) return [];
  const lower = text.toLowerCase();
  return vault.filter((item) => {
    const escaped = item.sleepyWord.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(lower);
  });
}

export function replaceSleepyWord(text: string, sleepyWord: string, replacement: string): string {
  const escaped = sleepyWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`\\b${escaped}\\b`, 'i'), (match) => {
    if (match[0] && match[0] === match[0].toUpperCase()) {
      return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    return replacement;
  });
}
