export type MissionTab = 'hook' | 'blueprint' | 'vault' | 'publish';

export interface TopicItem {
  topicId: string;
  title: string;
  emoji: string;
  category: string;
  theme: string;
  hookFact: string;
  facts: string[];
  vocab: string[];
  modelTitle: string;
  modelHook: string;
  modelTopicSentence: string;
}

export interface WarmupChallenge {
  challengeId: string;
  badgeLabel: string;
  sleepySentence: string;
  realFact: string;
  hintPowerup: string;
  exampleCaption: string;
}

export interface WordVaultItem {
  wordId: string;
  sleepyWord: string;
  upgrades: string[];
  actionVerbs: string[];
  exampleSentence: string;
}

export interface StudentProfile {
  studentId: string;
  authorName: string;
  explorerTitle: string;
  avatarEmoji: string;
  favoriteTopicId: string;
  totalStars: number;
  updatedAt: string;
}

export interface WarmupSubmission {
  submissionId: string;
  studentId: string;
  challengeId: string;
  captionText: string;
  starsEarned: number;
  createdAt: string;
}

export interface WritingDraft {
  draftId: string;
  studentId: string;
  topicId: string;
  catchyTitle: string;
  hookStyle: string;
  hookSentence: string;
  topicSentence: string;
  t1: string;
  fact1: string;
  tz1: string;
  zoom1: string;
  t2: string;
  fact2: string;
  tz2: string;
  zoom2: string;
  t3: string;
  fact3: string;
  tz3: string;
  zoom3: string;
  tEnd: string;
  closingSentence: string;
  bonusFact: string;
  illustrationCaption: string;
  stickers: string[];
  checklist: boolean[];
  wordCount: number;
  rank: string;
  updatedAt: string;
}

export interface BootstrapResponse {
  storageMode: 'google-sheets-api' | 'apps-script' | 'demo-preview';
  spreadsheetId: string;
  topics: TopicItem[];
  warmups: WarmupChallenge[];
  wordVault: WordVaultItem[];
  profile: StudentProfile | null;
  warmupSubmissions: WarmupSubmission[];
  drafts: WritingDraft[];
  csrfToken: string;
  authenticated: boolean;
}
