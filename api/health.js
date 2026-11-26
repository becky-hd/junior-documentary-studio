import { checkMethod, checkRateLimit, sendJson } from './_lib/security.js';
import { getSpreadsheetId, getStorageMode } from './_lib/sheetsDb.js';

export default async function handler(req, res) {
  if (!checkMethod(req, res, ['GET'])) return;
  if (!checkRateLimit(req, res)) return;

  sendJson(res, 200, {
    ok: true,
    storageMode: getStorageMode(),
    spreadsheetId: getSpreadsheetId(),
    timestamp: new Date().toISOString(),
  });
}
