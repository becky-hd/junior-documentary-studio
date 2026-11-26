import {
  checkMethod,
  checkRateLimit,
  ensureCsrfToken,
  getVerifiedSession,
  sendJson,
} from './_lib/security.js';
import { loadBootstrapData } from './_lib/sheetsDb.js';

export default async function handler(req, res) {
  if (!checkMethod(req, res, ['GET'])) return;
  if (!checkRateLimit(req, res)) return;

  try {
    const csrfToken = ensureCsrfToken(req, res);
    const session = getVerifiedSession(req);
    const data = await loadBootstrapData(session?.studentId || null);

    sendJson(res, 200, {
      ...data,
      csrfToken,
      authenticated: Boolean(session),
    });
  } catch (err) {
    console.error('Bootstrap error:', err?.message || 'unknown');
    sendJson(res, 500, { error: 'Could not load writing studio data right now.' });
  }
}
