export const API_BASE_URL = '/api';

/**
 * Thin wrapper around fetch that always sends credentials (the httpOnly
 * JWT cookie) with every request. Use this instead of raw fetch in every
 * API module so authentication is never accidentally omitted.
 */
export function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  return fetch(input, { credentials: 'include', ...init });
}
