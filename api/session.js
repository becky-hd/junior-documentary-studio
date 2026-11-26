import {
  checkMethod,
  checkRateLimit,
  cleanText,
  generateId,
  getVerifiedSession,
  readJsonBody,
  sendJson,
  setSessionCookie,
  validateAllowList,
  verifyCsrfToken,
} from './_lib/security.js';
import { ALLOWED_AVATARS, ALLOWED_EXPLORER_TITLES } from './_lib/seedData.js';
import { loadBootstrapData, upsertProfile } from './_lib/sheetsDb.js';

export default async function handler(req, res) {
  if (!checkMethod(req, res, ['POST'])) return;
  if (!checkRateLimit(req, res)) return;
  if (!verifyCsrfToken(req, res)) return;

  try {
    const body = await readJsonBody(req);
    const authorName = cleanText(body.authorName, 40);
    if (!authorName) {
      sendJson(res, 400, { error: 'Please type your Explorer Name first!' });
      return;
    }

    const explorerTitle = validateAllowList(
      body.explorerTitle,
      ALLOWED_EXPLORER_TITLES,
      ALLOWED_EXPLORER_TITLES[0]
    );
    const avatarEmoji = validateAllowList(body.avatarEmoji, ALLOWED_AVATARS, ALLOWED_AVATARS[0]);
    const favoriteTopicId = cleanText(body.favoriteTopicId || 'mimic-octopus', 60) || 'mimic-octopus';

    const existingSession = getVerifiedSession(req);
    const studentId = existingSession?.studentId || generateId('stu');
    const existingData = existingSession ? await loadBootstrapData(studentId) : null;
    const existingStars = existingData?.profile?.totalStars || 10;

    const profile = await upsertProfile({
      studentId,
      authorName,
      explorerTitle,
      avatarEmoji,
      favoriteTopicId,
      totalStars: Math.max(existingStars, 10),
    });

    setSessionCookie(req, res, studentId);
    sendJson(res, 200, { profile });
  } catch (err) {
    if (err?.message === 'PAYLOAD_TOO_LARGE') {
      sendJson(res, 413, { error: 'Request too large.' });
      return;
    }
    if (err?.message === 'INVALID_JSON') {
      sendJson(res, 400, { error: 'Invalid request body.' });
      return;
    }
    console.error('Session save error:', err?.message || 'unknown');
    sendJson(res, 500, { error: 'Could not save Explorer Press Pass.' });
  }
}
