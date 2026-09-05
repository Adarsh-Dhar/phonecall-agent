/**
 * Google Calendar Service
 *
 * Handles all Google Calendar API operations including OAuth token management,
 * event creation/update/deletion, and incremental sync polling.
 *
 * This is a barrel re-export — the implementation is split across:
 *   - config.ts:     env-driven constants
 *   - authClient.ts: OAuth2 client creation, token refresh/persistence
 *   - eventsApi.ts:  direct calendar-event CRUD used by the /calendar/events routes
 *   - taskSync.ts:   task <-> calendar-event sync engine
 *
 * Every symbol that used to live in services/googleCalendar.ts is re-exported
 * here so existing `from "../services/googleCalendar"` imports keep working
 * unchanged.
 */

export { getAuthedClient, getAuthedClientOrReason } from "./authClient";
export type { AuthedClientResult } from "./authClient";
export { insertCalendarEvent, listAllCalendarEvents } from "./eventsApi";
export {
  createEvent,
  updateEvent,
  deleteEvent,
  listChangedEvents,
  syncTaskToCalendar,
} from "./taskSync";
