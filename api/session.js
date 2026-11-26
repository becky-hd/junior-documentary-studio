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

    // Optional recovery flow: restore an existing Explorer Press Pass by its server-issued student_id
    // TODO(security): For multi-classroom production deployments, replace Pass Code recovery with OAuth 2.0 / OIDC.
    const restoreCode = cleanText(body.restoreStudentId, 48);
    if (restoreCode) {
      if (!/^stu_[a-f0-9]{16,32}$/.test(restoreCode)) {
        sendJson(res, 400, {
          error: 'Pass Code should look like stu_3016efc658519efb56b2 (from StudentProfiles in your Sheet).',
        });
        return;
      }

      const existing = await loadBootstrapData(restoreCode);
      if (!existing.profile) {
        sendJson(res, 404, { error: 'No Explorer Press Pass found with that Pass Code.' });
        return;
      }

      setSessionCookie(req, res, restoreCode);
      sendJson(res, 200, {
        profile: existing.profile,
        drafts: existing.drafts || [],
        warmupSubmissions: existing.warmupSubmissions || [],
      });
      return;
    }

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
    sendJson(res, 200, {
      profile,
      drafts: existingData?.drafts || [],
      warmupSubmissions: existingData?.warmupSubmissions || [],
    });
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
