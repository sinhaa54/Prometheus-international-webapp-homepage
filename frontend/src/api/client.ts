/**
 * Thin, typed fetch wrapper with timeout + AbortController support.
 * Never accepts a redirect URL from the caller - only relative API paths.
 */
import { APP_CONFIG } from '../config/app-config';
import type { ApiErrorBody } from '../types/api';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const base = APP_CONFIG.apiBaseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(base + cleanPath, window.location.origin);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    }
  }
  // Return path+search relative to origin to keep same-origin fetches.
  return url.pathname + url.search;
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? APP_CONFIG.apiTimeoutMs);
  const externalSignal = opts.signal;
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? 'GET',
      signal: controller.signal,
      headers: opts.body ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: 'same-origin',
    });

    if (!res.ok) {
      let body: ApiErrorBody | undefined;
      try {
        body = (await res.json()) as ApiErrorBody;
      } catch {
        /* ignore */
      }
      throw new ApiError(body?.error?.message ?? res.statusText, res.status, body?.error?.code, body?.error?.details);
    }

    if (res.status === 204) return undefined as unknown as T;
    return (await res.json()) as T;
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new ApiError('Request was cancelled or timed out.', 0, 'aborted');
    }
    if (err instanceof ApiError) throw err;
    throw new ApiError((err as Error).message || 'Network error.', 0, 'network_error');
  } finally {
    clearTimeout(timeout);
  }
}
