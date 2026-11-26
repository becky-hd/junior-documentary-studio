import type {
  BootstrapResponse,
  StudentProfile,
  WarmupSubmission,
  WritingDraft,
} from '../types';

let csrfTokenMemory = '';

export function setCsrfToken(token: string) {
  csrfTokenMemory = token;
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (options.method && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
    if (csrfTokenMemory) {
      headers.set('X-CSRF-Token', csrfTokenMemory);
    }
  }

  const resp = await fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Something went wrong.');
  }
  return data as T;
}

export async function fetchBootstrap(): Promise<BootstrapResponse> {
  const data = await apiFetch<BootstrapResponse>('/api/bootstrap', { method: 'GET' });
  if (data.csrfToken) {
    setCsrfToken(data.csrfToken);
  }
  return data;
}

export async function saveSessionProfile(input: {
  authorName: string;
  explorerTitle: string;
  avatarEmoji: string;
  favoriteTopicId: string;
}): Promise<{
  profile: StudentProfile;
  drafts: WritingDraft[];
  warmupSubmissions: WarmupSubmission[];
  restored: boolean;
}> {
  return apiFetch('/api/session', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function saveWarmupCaption(input: {
  challengeId: string;
  captionText: string;
}): Promise<{ submission: WarmupSubmission; profile: StudentProfile | null }> {
  return apiFetch<{ submission: WarmupSubmission; profile: StudentProfile | null }>(
    '/api/warmups',
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
}

export async function saveWritingDraft(
  draft: WritingDraft
): Promise<{ draft: WritingDraft; profile: StudentProfile | null }> {
  return apiFetch<{ draft: WritingDraft; profile: StudentProfile | null }>('/api/drafts', {
    method: 'POST',
    body: JSON.stringify(draft),
  });
}
