import crypto from 'node:crypto';

// TODO(security): For multi-classroom or public production deployments, replace lightweight
// family Press Pass sessions with OAuth 2.0 / OIDC (e.g. Sign in with Google) and MFA for parent/teacher admin controls.

let ephemeralSecret = null;

function getSessionSecret() {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  if (!ephemeralSecret) {
    console.warn(
      '[SECURITY WARNING] SESSION_SECRET env var is not configured. Generating ephemeral per-instance secret; sessions will reset across cold starts.'
    );
    ephemeralSecret = crypto.randomBytes(32).toString('hex');
  }
  return ephemeralSecret;
}

export function isHttpsRequest(req) {
  const proto = req.headers['x-forwarded-proto'];
  if (typeof proto === 'string') {
    return proto.split(',')[0].trim() === 'https';
  }
  return Boolean(req.socket && req.socket.encrypted);
}

export function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
}

export function checkMethod(req, res, allowedMethods) {
  const method = (req.method || 'GET').toUpperCase();
  if (!allowedMethods.includes(method)) {
    setSecurityHeaders(res);
    res.setHeader('Allow', allowedMethods.join(', '));
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return false;
  }
  return true;
}

// Per-IP sliding-window rate limiter (60s window, 80 requests max)
const rateBuckets = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 80;

export function checkRateLimit(req, res) {
  const forwarded = req.headers['x-forwarded-for'];
  const rawIp =
    (typeof forwarded === 'string' && forwarded.split(',')[0].trim()) ||
    req.socket?.remoteAddress ||
    'unknown';
  const now = Date.now();
  const timestamps = (rateBuckets.get(rawIp) || []).filter((ts) => now - ts < WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS) {
    setSecurityHeaders(res);
    res.statusCode = 429;
    res.end(JSON.stringify({ error: 'Too many requests. Please slow down and try again.' }));
    return false;
  }
  timestamps.push(now);
  rateBuckets.set(rawIp, timestamps);
  if (rateBuckets.size > 500) {
    for (const [key, list] of rateBuckets.entries()) {
      if (list.every((ts) => now - ts >= WINDOW_MS)) rateBuckets.delete(key);
    }
  }
  return true;
}

export function parseCookies(req) {
  const header = req.headers.cookie || '';
  const cookies = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) cookies[k] = decodeURIComponent(v);
  }
  return cookies;
}

function appendSetCookie(res, cookieStr) {
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', [cookieStr]);
  } else if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookieStr]);
  } else {
    res.setHeader('Set-Cookie', [String(existing), cookieStr]);
  }
}

function base64UrlEncode(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64').toString('utf8');
}

function signPayload(payloadObj) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64UrlEncode(JSON.stringify(payloadObj));
  const data = `${header}.${payload}`;
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${sig}`;
}

function verifyPayload(token) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(base64UrlDecode(parts[0]));
    // Strictly enforce HS256 and reject 'none' or any other algorithm
    if (!header || header.alg !== 'HS256') return null;
    const data = `${parts[0]}.${parts[1]}`;
    const expectedSig = crypto
      .createHmac('sha256', getSessionSecret())
      .update(data)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    const a = Buffer.from(parts[2]);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    if (!payload || typeof payload.exp !== 'number' || Date.now() >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function cookieNames(req) {
  const secure = isHttpsRequest(req);
  return {
    secure,
    sessionName: secure ? '__Host-jds_session' : 'jds_session',
    csrfName: secure ? '__Host-jds_csrf' : 'jds_csrf',
  };
}

export function setSessionCookie(req, res, studentId) {
  const { secure, sessionName } = cookieNames(req);
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const token = signPayload({ sub: studentId, exp });
  const attrs = [
    `${sessionName}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${7 * 24 * 60 * 60}`,
  ];
  if (secure) attrs.push('Secure');
  appendSetCookie(res, attrs.join('; '));
}

export function clearSessionCookie(req, res) {
  const { secure, sessionName } = cookieNames(req);
  const attrs = [`${sessionName}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) attrs.push('Secure');
  appendSetCookie(res, attrs.join('; '));
}

export function getVerifiedSession(req) {
  const cookies = parseCookies(req);
  const { sessionName } = cookieNames(req);
  const raw = cookies[sessionName] || cookies['__Host-jds_session'] || cookies['jds_session'];
  const payload = verifyPayload(raw);
  if (!payload || typeof payload.sub !== 'string' || !/^stu_[a-f0-9]{16,32}$/.test(payload.sub)) {
    return null;
  }
  return { studentId: payload.sub };
}

export function ensureCsrfToken(req, res) {
  const cookies = parseCookies(req);
  const { secure, csrfName } = cookieNames(req);
  const existing = cookies[csrfName] || cookies['__Host-jds_csrf'] || cookies['jds_csrf'];
  if (existing && /^[a-f0-9]{32,64}$/.test(existing)) {
    return existing;
  }
  const token = crypto.randomBytes(24).toString('hex');
  const attrs = [
    `${csrfName}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${24 * 60 * 60}`,
  ];
  if (secure) attrs.push('Secure');
  appendSetCookie(res, attrs.join('; '));
  return token;
}

export function verifyCsrfToken(req, res) {
  const cookies = parseCookies(req);
  const { csrfName } = cookieNames(req);
  const cookieToken = cookies[csrfName] || cookies['__Host-jds_csrf'] || cookies['jds_csrf'];
  const headerToken = req.headers['x-csrf-token'];
  if (typeof cookieToken !== 'string' || typeof headerToken !== 'string') {
    setSecurityHeaders(res);
    res.statusCode = 403;
    res.end(JSON.stringify({ error: 'Invalid or missing CSRF token. Please refresh the page.' }));
    return false;
  }
  const a = Buffer.from(cookieToken);
  const b = Buffer.from(headerToken);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    setSecurityHeaders(res);
    res.statusCode = 403;
    res.end(JSON.stringify({ error: 'CSRF validation failed. Please refresh the page.' }));
    return false;
  }
  return true;
}

export async function readJsonBody(req, maxBytes = 32768) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8').trim();
        resolve(text ? JSON.parse(text) : {});
      } catch {
        reject(new Error('INVALID_JSON'));
      }
    });
    req.on('error', reject);
  });
}

export function cleanText(value, maxLen = 400) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLen);
}

// Neutralize spreadsheet formula injection when persisting untrusted strings to Google Sheets
export function safeSheetCell(value, maxLen = 500) {
  const cleaned = cleanText(String(value ?? ''), maxLen);
  if (/^[=+\-@\t\r]/.test(cleaned)) {
    return `'${cleaned}`;
  }
  return cleaned;
}

export function validateAllowList(value, allowed, fallback) {
  return typeof value === 'string' && allowed.includes(value) ? value : fallback;
}

export function generateId(prefix) {
  return `${prefix}_${crypto.randomBytes(10).toString('hex')}`;
}

export function deriveExplorerStudentId(authorName, avatarEmoji, explorerTitle) {
  const normalized = [
    String(authorName || '').trim().toLowerCase().replace(/\s+/g, ' '),
    String(avatarEmoji || '').trim(),
    String(explorerTitle || '').trim().toLowerCase().replace(/\s+/g, ' '),
  ].join('|');
  const hash = crypto.createHash('sha256').update(normalized, 'utf8').digest('hex').slice(0, 20);
  return `stu_${hash}`;
}

export function sendJson(res, status, data) {
  setSecurityHeaders(res);
  res.statusCode = status;
  res.end(JSON.stringify(data));
}
