import crypto from 'node:crypto';
import {
  DEFAULT_SPREADSHEET_ID,
  SEED_TOPICS,
  SEED_WARMUPS,
  SEED_WORD_VAULT,
} from './seedData.js';
import { safeSheetCell } from './security.js';

// In-memory store used when Google Sheets write credentials aren't configured yet
const memoryStore = {
  profiles: new Map(),
  warmups: new Map(),
  drafts: new Map(),
};

let cachedAccessToken = null;
let cachedAccessTokenExp = 0;

export function getSpreadsheetId() {
  return (process.env.GOOGLE_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID).trim();
}

export function getStorageMode() {
  if (
    process.env.GOOGLE_SPREADSHEET_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  ) {
    return 'google-sheets-api';
  }
  if (process.env.GOOGLE_APPS_SCRIPT_URL && process.env.APPS_SCRIPT_SECRET) {
    return 'apps-script';
  }
  return 'demo-preview';
}

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getGoogleAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && now < cachedAccessTokenExp - 60) {
    return cachedAccessToken;
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64Url(
    JSON.stringify({
      iss: email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  );
  const unsigned = `${header}.${claim}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer
    .sign(rawKey)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const assertion = `${unsigned}.${signature}`;
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!resp.ok) {
    throw new Error(`Google token exchange failed (${resp.status})`);
  }
  const data = await resp.json();
  cachedAccessToken = data.access_token;
  cachedAccessTokenExp = now + Number(data.expires_in || 3500);
  return cachedAccessToken;
}

async function sheetsApiRequest(path, options = {}) {
  const token = await getGoogleAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    getSpreadsheetId()
  )}${path}`;
  const resp = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!resp.ok) {
    throw new Error(`Google Sheets API error (${resp.status})`);
  }
  return resp.json();
}

async function appsScriptCall(action, payload = {}) {
  const endpoint = process.env.GOOGLE_APPS_SCRIPT_URL;
  const secret = process.env.APPS_SCRIPT_SECRET;
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, action, payload }),
  });
  if (!resp.ok) {
    throw new Error(`Apps Script bridge error (${resp.status})`);
  }
  const data = await resp.json();
  if (!data.ok) {
    throw new Error(data.error || 'Apps Script rejected request');
  }
  return data.data;
}

function parseTopicRows(rows) {
  if (!Array.isArray(rows) || rows.length <= 1) return SEED_TOPICS;
  return rows
    .slice(1)
    .filter((r) => r && r[0])
    .map((r) => ({
      topicId: String(r[0]),
      title: String(r[1] || ''),
      emoji: String(r[2] || '🌍'),
      category: String(r[3] || 'Nonfiction'),
      theme: String(r[4] || 'ocean'),
      hookFact: String(r[5] || ''),
      facts: [r[6], r[7], r[8], r[9]].filter(Boolean).map(String),
      vocab: String(r[10] || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
      modelTitle: String(r[11] || ''),
      modelHook: String(r[12] || ''),
      modelTopicSentence: String(r[13] || ''),
    }));
}

function parseWarmupRows(rows) {
  if (!Array.isArray(rows) || rows.length <= 1) return SEED_WARMUPS;
  return rows
    .slice(1)
    .filter((r) => r && r[0])
    .map((r) => ({
      challengeId: String(r[0]),
      badgeLabel: String(r[1] || 'Rescue'),
      sleepySentence: String(r[2] || ''),
      realFact: String(r[3] || ''),
      hintPowerup: String(r[4] || ''),
      exampleCaption: String(r[5] || ''),
    }));
}

function parseWordVaultRows(rows) {
  if (!Array.isArray(rows) || rows.length <= 1) return SEED_WORD_VAULT;
  return rows
    .slice(1)
    .filter((r) => r && r[0])
    .map((r) => ({
      wordId: String(r[0]),
      sleepyWord: String(r[1] || ''),
      upgrades: String(r[2] || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      actionVerbs: String(r[3] || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      exampleSentence: String(r[4] || ''),
    }));
}

function rowToProfile(r) {
  return {
    studentId: String(r[0] || ''),
    authorName: String(r[1] || ''),
    explorerTitle: String(r[2] || 'Wildlife Detective'),
    avatarEmoji: String(r[3] || '🦊'),
    favoriteTopicId: String(r[4] || 'mimic-octopus'),
    totalStars: Number(r[5] || 0),
    updatedAt: String(r[6] || ''),
  };
}

function rowToWarmupSubmission(r) {
  return {
    submissionId: String(r[0] || ''),
    studentId: String(r[1] || ''),
    challengeId: String(r[2] || ''),
    captionText: String(r[3] || ''),
    starsEarned: Number(r[4] || 10),
    createdAt: String(r[5] || ''),
  };
}

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function rowToDraft(r) {
  return {
    draftId: String(r[0] || ''),
    studentId: String(r[1] || ''),
    topicId: String(r[2] || 'mimic-octopus'),
    catchyTitle: String(r[3] || ''),
    hookStyle: String(r[4] || 'Sound-Effect Action'),
    hookSentence: String(r[5] || ''),
    topicSentence: String(r[6] || ''),
    t1: String(r[7] || 'First,'),
    fact1: String(r[8] || ''),
    tz1: String(r[9] || 'For example,'),
    zoom1: String(r[10] || ''),
    t2: String(r[11] || 'In addition,'),
    fact2: String(r[12] || ''),
    tz2: String(r[13] || 'For instance,'),
    zoom2: String(r[14] || ''),
    t3: String(r[15] || 'Surprisingly,'),
    fact3: String(r[16] || ''),
    tz3: String(r[17] || 'This shows that'),
    zoom3: String(r[18] || ''),
    tEnd: String(r[19] || 'Without a doubt,'),
    closingSentence: String(r[20] || ''),
    bonusFact: String(r[21] || ''),
    illustrationCaption: String(r[22] || ''),
    stickers: safeJsonParse(String(r[23] || '[]'), []),
    checklist: safeJsonParse(String(r[24] || '[]'), []),
    wordCount: Number(r[25] || 0),
    rank: String(r[26] || 'Apprentice Explorer'),
    updatedAt: String(r[27] || ''),
  };
}

export async function loadBootstrapData(studentId) {
  const mode = getStorageMode();

  if (mode === 'google-sheets-api') {
    const ranges = [
      'Topics!A1:N50',
      'WarmupChallenges!A1:F50',
      'WordVault!A1:E50',
      'StudentProfiles!A1:G500',
      'WarmupSubmissions!A1:F1000',
      'WritingDrafts!A1:AB500',
    ];
    const query = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
    const data = await sheetsApiRequest(`/values:batchGet?${query}`);
    const vr = data.valueRanges || [];
    const topics = parseTopicRows(vr[0]?.values);
    const warmups = parseWarmupRows(vr[1]?.values);
    const wordVault = parseWordVaultRows(vr[2]?.values);

    const profileRows = (vr[3]?.values || []).slice(1);
    const warmupRows = (vr[4]?.values || []).slice(1);
    const draftRows = (vr[5]?.values || []).slice(1);

    const profileRow = studentId ? profileRows.find((r) => r[0] === studentId) : null;
    const warmupSubmissions = studentId
      ? warmupRows.filter((r) => r[1] === studentId).map(rowToWarmupSubmission)
      : [];
    const drafts = studentId
      ? draftRows.filter((r) => r[1] === studentId).map(rowToDraft)
      : [];

    return {
      storageMode: mode,
      spreadsheetId: getSpreadsheetId(),
      topics,
      warmups,
      wordVault,
      profile: profileRow ? rowToProfile(profileRow) : null,
      warmupSubmissions,
      drafts,
    };
  }

  if (mode === 'apps-script') {
    const data = await appsScriptCall('bootstrap', { studentId: studentId || '' });
    return {
      storageMode: mode,
      spreadsheetId: getSpreadsheetId(),
      topics: parseTopicRows(data.topics),
      warmups: parseWarmupRows(data.warmups),
      wordVault: parseWordVaultRows(data.wordVault),
      profile: data.profile ? rowToProfile(data.profile) : null,
      warmupSubmissions: (data.warmupSubmissions || []).map(rowToWarmupSubmission),
      drafts: (data.drafts || []).map(rowToDraft),
    };
  }

  // Demo preview fallback (instant, zero-error UX before Sheets credentials are added)
  const profile = studentId ? memoryStore.profiles.get(studentId) || null : null;
  const warmupSubmissions = studentId ? memoryStore.warmups.get(studentId) || [] : [];
  const drafts = studentId ? memoryStore.drafts.get(studentId) || [] : [];

  return {
    storageMode: mode,
    spreadsheetId: getSpreadsheetId(),
    topics: SEED_TOPICS,
    warmups: SEED_WARMUPS,
    wordVault: SEED_WORD_VAULT,
    profile,
    warmupSubmissions,
    drafts,
  };
}

export async function upsertProfile(profile) {
  const mode = getStorageMode();
  const row = [
    safeSheetCell(profile.studentId, 48),
    safeSheetCell(profile.authorName, 60),
    safeSheetCell(profile.explorerTitle, 60),
    safeSheetCell(profile.avatarEmoji, 16),
    safeSheetCell(profile.favoriteTopicId, 60),
    Number(profile.totalStars || 0),
    new Date().toISOString(),
  ];

  if (mode === 'google-sheets-api') {
    const existing = await sheetsApiRequest('/values/StudentProfiles!A1:G500');
    const rows = existing.values || [];
    const idx = rows.findIndex((r, i) => i > 0 && r[0] === profile.studentId);
    if (idx >= 0) {
      const sheetRow = idx + 1;
      await sheetsApiRequest(
        `/values/${encodeURIComponent(`StudentProfiles!A${sheetRow}:G${sheetRow}`)}?valueInputOption=RAW`,
        { method: 'PUT', body: JSON.stringify({ values: [row] }) }
      );
    } else {
      await sheetsApiRequest(
        `/values/${encodeURIComponent('StudentProfiles!A:G')}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        { method: 'POST', body: JSON.stringify({ values: [row] }) }
      );
    }
    return rowToProfile(row);
  }

  if (mode === 'apps-script') {
    await appsScriptCall('upsertProfile', { row });
    return rowToProfile(row);
  }

  const saved = rowToProfile(row);
  memoryStore.profiles.set(saved.studentId, saved);
  return saved;
}

export async function saveWarmupSubmission(sub) {
  const mode = getStorageMode();
  const row = [
    safeSheetCell(sub.submissionId, 48),
    safeSheetCell(sub.studentId, 48),
    safeSheetCell(sub.challengeId, 48),
    safeSheetCell(sub.captionText, 400),
    Number(sub.starsEarned || 10),
    new Date().toISOString(),
  ];

  if (mode === 'google-sheets-api') {
    const existing = await sheetsApiRequest('/values/WarmupSubmissions!A1:F1000');
    const rows = existing.values || [];
    const idx = rows.findIndex(
      (r, i) => i > 0 && r[1] === sub.studentId && r[2] === sub.challengeId
    );
    if (idx >= 0) {
      const sheetRow = idx + 1;
      await sheetsApiRequest(
        `/values/${encodeURIComponent(`WarmupSubmissions!A${sheetRow}:F${sheetRow}`)}?valueInputOption=RAW`,
        { method: 'PUT', body: JSON.stringify({ values: [row] }) }
      );
    } else {
      await sheetsApiRequest(
        `/values/${encodeURIComponent('WarmupSubmissions!A:F')}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        { method: 'POST', body: JSON.stringify({ values: [row] }) }
      );
    }
    return rowToWarmupSubmission(row);
  }

  if (mode === 'apps-script') {
    await appsScriptCall('saveWarmup', { row });
    return rowToWarmupSubmission(row);
  }

  const saved = rowToWarmupSubmission(row);
  const current = memoryStore.warmups.get(saved.studentId) || [];
  const filtered = current.filter((w) => w.challengeId !== saved.challengeId);
  filtered.push(saved);
  memoryStore.warmups.set(saved.studentId, filtered);
  return saved;
}

export async function upsertDraft(draft) {
  const mode = getStorageMode();
  const row = [
    safeSheetCell(draft.draftId, 48),
    safeSheetCell(draft.studentId, 48),
    safeSheetCell(draft.topicId, 60),
    safeSheetCell(draft.catchyTitle, 140),
    safeSheetCell(draft.hookStyle, 60),
    safeSheetCell(draft.hookSentence, 450),
    safeSheetCell(draft.topicSentence, 450),
    safeSheetCell(draft.t1, 60),
    safeSheetCell(draft.fact1, 450),
    safeSheetCell(draft.tz1, 60),
    safeSheetCell(draft.zoom1, 450),
    safeSheetCell(draft.t2, 60),
    safeSheetCell(draft.fact2, 450),
    safeSheetCell(draft.tz2, 60),
    safeSheetCell(draft.zoom2, 450),
    safeSheetCell(draft.t3, 60),
    safeSheetCell(draft.fact3, 450),
    safeSheetCell(draft.tz3, 60),
    safeSheetCell(draft.zoom3, 450),
    safeSheetCell(draft.tEnd, 60),
    safeSheetCell(draft.closingSentence, 450),
    safeSheetCell(draft.bonusFact, 350),
    safeSheetCell(draft.illustrationCaption, 300),
    JSON.stringify((draft.stickers || []).slice(0, 8)),
    JSON.stringify((draft.checklist || []).slice(0, 12)),
    Number(draft.wordCount || 0),
    safeSheetCell(draft.rank, 60),
    new Date().toISOString(),
  ];

  if (mode === 'google-sheets-api') {
    const existing = await sheetsApiRequest('/values/WritingDrafts!A1:AB500');
    const rows = existing.values || [];
    const idx = rows.findIndex(
      (r, i) => i > 0 && r[0] === draft.draftId && r[1] === draft.studentId
    );
    if (idx >= 0) {
      const sheetRow = idx + 1;
      await sheetsApiRequest(
        `/values/${encodeURIComponent(`WritingDrafts!A${sheetRow}:AB${sheetRow}`)}?valueInputOption=RAW`,
        { method: 'PUT', body: JSON.stringify({ values: [row] }) }
      );
    } else {
      await sheetsApiRequest(
        `/values/${encodeURIComponent('WritingDrafts!A:AB')}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        { method: 'POST', body: JSON.stringify({ values: [row] }) }
      );
    }
    return rowToDraft(row);
  }

  if (mode === 'apps-script') {
    await appsScriptCall('upsertDraft', { row });
    return rowToDraft(row);
  }

  const saved = rowToDraft(row);
  const current = memoryStore.drafts.get(saved.studentId) || [];
  const filtered = current.filter((d) => d.draftId !== saved.draftId);
  filtered.unshift(saved);
  memoryStore.drafts.set(saved.studentId, filtered);
  return saved;
}
