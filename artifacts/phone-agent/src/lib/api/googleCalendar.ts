import { API_BASE_URL } from './shared';

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

/** Check Google Calendar connection status */
export const fetchGoogleAuthStatus = async (): Promise<GoogleAuthStatus> => {
  const response = await fetch(`${API_BASE_URL}/auth/google/status`);
  if (!response.ok) throw new Error('Failed to fetch Google auth status');
  return response.json();
};

/** Redirect to Google OAuth consent screen */
export const connectGoogleCalendar = async (): Promise<void> => {
  window.location.href = `${API_BASE_URL}/auth/google`;
};

/** Disconnect Google Calendar */
export const disconnectGoogleCalendar = async (): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to disconnect Google Calendar');
  return response.json();
};

/** Manually trigger calendar sync */
export const syncCalendar = async (): Promise<CalendarSyncResult> => {
  const response = await fetch(`${API_BASE_URL}/calendar/sync`, {
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

/** Fetch Google Calendar events */
export const fetchGoogleCalendarEvents = async (): Promise<{ events: GoogleCalendarEvent[] }> => {
  const response = await fetch(`${API_BASE_URL}/calendar/events`);
  if (!response.ok) throw new Error('Failed to fetch Google Calendar events');
  return response.json();
};
