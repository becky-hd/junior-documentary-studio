import {
  checkMethod,
  checkRateLimit,
  cleanText,
  generateId,
  getVerifiedSession,
  readJsonBody,
  sendJson,
  validateAllowList,
  verifyCsrfToken,
} from './_lib/security.js';
import { ALLOWED_HOOK_STYLES } from './_lib/seedData.js';
import { loadBootstrapData, upsertDraft, upsertProfile } from './_lib/sheetsDb.js';

function countWords(parts) {
  const joined = parts.filter(Boolean).join(' ').trim();
  if (!joined) return 0;
  return joined.split(/\s+/).filter(Boolean).length;
}

function computeRank(checklist) {
  const checked = Array.isArray(checklist) ? checklist.filter(Boolean).length : 0;
  if (checked >= 8) return 'Master Published Author';
  if (checked >= 5) return 'Junior Documentary Author';
  if (checked >= 2) return 'Fact Detective';
  return 'Apprentice Explorer';
}

export default async function handler(req, res) {
  if (!checkMethod(req, res, ['POST'])) return;
  if (!checkRateLimit(req, res)) return;
  if (!verifyCsrfToken(req, res)) return;

  const session = getVerifiedSession(req);
  if (!session) {
    sendJson(res, 401, { error: 'Create your Explorer Press Pass first to save your book!' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const rawDraftId = cleanText(body.draftId, 48);
    const draftId = /^drf_[a-f0-9]{16,32}$/.test(rawDraftId) ? rawDraftId : generateId('drf');

    const checklist = Array.isArray(body.checklist)
      ? body.checklist.slice(0, 8).map((v) => Boolean(v))
      : Array(8).fill(false);

    const stickers = Array.isArray(body.stickers)
      ? body.stickers.slice(0, 8).map((s) => cleanText(String(s), 8)).filter(Boolean)
      : [];

    const draftInput = {
      draftId,
      studentId: session.studentId,
      topicId: cleanText(body.topicId || 'mimic-octopus', 60),
      catchyTitle: cleanText(body.catchyTitle, 140),
      hookStyle: validateAllowList(body.hookStyle, ALLOWED_HOOK_STYLES, ALLOWED_HOOK_STYLES[0]),
      hookSentence: cleanText(body.hookSentence, 450),
      topicSentence: cleanText(body.topicSentence, 450),
      t1: cleanText(body.t1, 60),
      fact1: cleanText(body.fact1, 450),
      tz1: cleanText(body.tz1, 60),
      zoom1: cleanText(body.zoom1, 450),
      t2: cleanText(body.t2, 60),
      fact2: cleanText(body.fact2, 450),
      tz2: cleanText(body.tz2, 60),
      zoom2: cleanText(body.zoom2, 450),
      t3: cleanText(body.t3, 60),
      fact3: cleanText(body.fact3, 450),
      tz3: cleanText(body.tz3, 60),
      zoom3: cleanText(body.zoom3, 450),
      tEnd: cleanText(body.tEnd, 60),
      closingSentence: cleanText(body.closingSentence, 450),
      bonusFact: cleanText(body.bonusFact, 350),
      illustrationCaption: cleanText(body.illustrationCaption, 300),
      stickers,
      checklist,
    };

    const wordCount = countWords([
      draftInput.catchyTitle,
      draftInput.hookSentence,
      draftInput.topicSentence,
      draftInput.fact1,
      draftInput.zoom1,
      draftInput.fact2,
      draftInput.zoom2,
      draftInput.fact3,
      draftInput.zoom3,
      draftInput.closingSentence,
    ]);
    const rank = computeRank(checklist);

    const draft = await upsertDraft({ ...draftInput, wordCount, rank });

    const latest = await loadBootstrapData(session.studentId);
    let updatedProfile = latest.profile;
    if (updatedProfile) {
      const filledBlocks = [
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
      ].filter((v) => v.length > 0).length;
      const uniqueWarmups = new Set(latest.warmupSubmissions.map((w) => w.challengeId)).size;
      const computedStars = Math.max(
        updatedProfile.totalStars,
        10 + uniqueWarmups * 10 + filledBlocks * 5 + checklist.filter(Boolean).length * 5
      );
      updatedProfile = await upsertProfile({ ...updatedProfile, totalStars: computedStars });
    }

    sendJson(res, 200, { draft, profile: updatedProfile });
  } catch (err) {
    if (err?.message === 'PAYLOAD_TOO_LARGE' || err?.message === 'INVALID_JSON') {
      sendJson(res, 400, { error: 'Invalid draft payload.' });
      return;
    }
    console.error('Draft save error:', err?.message || 'unknown');
    sendJson(res, 500, { error: 'Could not save documentary draft right now.' });
  }
}
