import {
  checkMethod,
  checkRateLimit,
  cleanText,
  generateId,
  getVerifiedSession,
  readJsonBody,
  sendJson,
  verifyCsrfToken,
} from './_lib/security.js';
import { loadBootstrapData, saveWarmupSubmission, upsertProfile } from './_lib/sheetsDb.js';

export default async function handler(req, res) {
  if (!checkMethod(req, res, ['POST'])) return;
  if (!checkRateLimit(req, res)) return;
  if (!verifyCsrfToken(req, res)) return;

  const session = getVerifiedSession(req);
  if (!session) {
    sendJson(res, 401, { error: 'Create your Explorer Press Pass first to save warm-ups!' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const challengeId = cleanText(body.challengeId, 48);
    const captionText = cleanText(body.captionText, 350);

    if (!challengeId || !/^[a-z0-9-]+$/i.test(challengeId)) {
      sendJson(res, 400, { error: 'Invalid challenge ID.' });
      return;
    }
    if (captionText.length < 6) {
      sendJson(res, 400, { error: 'Write at least one punchy sentence to rescue the boring fact!' });
      return;
    }

    const submission = await saveWarmupSubmission({
      submissionId: generateId('wrm'),
      studentId: session.studentId,
      challengeId,
      captionText,
      starsEarned: 10,
    });

    const latest = await loadBootstrapData(session.studentId);
    let updatedProfile = latest.profile;
    if (updatedProfile) {
      const uniqueWarmups = new Set(latest.warmupSubmissions.map((w) => w.challengeId)).size;
      const draftBonus = latest.drafts.length * 15;
      const computedStars = Math.max(updatedProfile.totalStars, 10 + uniqueWarmups * 10 + draftBonus);
      updatedProfile = await upsertProfile({ ...updatedProfile, totalStars: computedStars });
    }

    sendJson(res, 200, { submission, profile: updatedProfile });
  } catch (err) {
    if (err?.message === 'PAYLOAD_TOO_LARGE' || err?.message === 'INVALID_JSON') {
      sendJson(res, 400, { error: 'Invalid submission payload.' });
      return;
    }
    console.error('Warmup save error:', err?.message || 'unknown');
    sendJson(res, 500, { error: 'Could not save warm-up right now.' });
  }
}
