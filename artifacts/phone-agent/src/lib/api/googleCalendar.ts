import { API_BASE_URL, apiFetch } from './shared';

// ─── Google Calendar API ─────────────────────────────────────────────────────

export type GoogleAuthStatus = {
  connected: boolean;
  hasAuth: boolean;
  expired: boolean;
};

export type CalendarSyncResult = {
  synced: number;
  errors: number;
};

/**
 * Check whether the current user has a connected Google Calendar.
 * The server reads the JWT cookie to identify the user; no body needed.
 */
export const fetchGoogleAuthStatus = async (): Promise<GoogleAuthStatus> => {
  const response = await apiFetch(`${API_BASE_URL}/auth/google/status`);
  if (!response.ok) throw new Error('Failed to fetch Google auth status');
  return response.json();
};

/**
 * Redirect to the Google OAuth consent screen.
 * Because this is a full-page redirect (not a fetch), it intentionally does
 * NOT use apiFetch — the browser handles cookie transmission automatically.
 * Signing in grants both identity and calendar.events scope in one step,
 * so there is no separate "Connect Calendar" button needed.
 */
export const connectGoogleCalendar = async (): Promise<void> => {
  window.location.href = `${API_BASE_URL}/auth/google/login`;
};

/**
 * Clears stored Google tokens for the current user (disconnect calendar).
 * The user stays logged in — only calendar access is revoked.
 */
export const disconnectGoogleCalendar = async (): Promise<{ success: boolean }> => {
  const response = await apiFetch(`${API_BASE_URL}/auth/google`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to disconnect Google Calendar');
  return response.json();
};

/** Manually trigger a calendar sync for the current user. */
export const syncCalendar = async (): Promise<CalendarSyncResult> => {
  const response = await apiFetch(`${API_BASE_URL}/calendar/sync`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to sync calendar');
  return response.json();
};

export type GoogleCalendarEvent = {
  id: string;
  summary: string;
  description: string | null;
  start: { dateTime?: string; date?: string } | null;
  end: { dateTime?: string; date?: string } | null;
  status: string;
  htmlLink: string;
};

/** Fetch the current user's Google Calendar events. */
export const fetchGoogleCalendarEvents = async (): Promise<{ events: GoogleCalendarEvent[] }> => {
  const response = await apiFetch(`${API_BASE_URL}/calendar/events`);
  if (!response.ok) throw new Error('Failed to fetch Google Calendar events');
  return response.json();
};
