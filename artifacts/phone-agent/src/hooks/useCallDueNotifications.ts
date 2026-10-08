import { useEffect, useRef } from 'react';

export type CallDueNotification = {
  type: 'call_due';
  taskId: string;
  contactId: string;
  contactName: string;
  title: string;
  description: string | null;
  attempt?: number;
  maxAttempts?: number;
};

export type CallExhaustedNotification = {
  type: 'call_exhausted';
  taskId: string;
  contactId: string;
  contactName: string;
  title: string;
  attempts: number;
};

/**
 * Keeps a WebSocket open to the server's call-scheduler notification
 * channel (services/notifications.ts + services/callScheduler.ts) for as
 * long as the app is mounted. When a task's nextAttemptAt arrives, the server
 * pushes a "call_due" message here and `onCallDue` fires — this is what
 * lets a task's due time actually trigger something on its own, instead of
 * just sitting in the calendar until someone remembers to click "Call".
 *
 * When a task exhausts its maximum retry attempts, the server pushes a
 * "call_exhausted" message and `onCallExhausted` fires to notify the user.
 *
 * The scheduler now supports retries with exponential backoff, so ignored
 * notifications will re-notify the user (up to MAX_ATTEMPTS). The notification
 * includes attempt/maxAttempts to show retry progress.
 *
 * This uses the presence registry (services/presence.ts) to target specific
 * users, and falls back to push notifications (services/push.ts) if the user
 * is offline. Reconnects automatically with a short backoff if the connection drops.
 */
export function useCallDueNotifications(onCallDue: (n: CallDueNotification) => void, onCallExhausted?: (n: CallExhaustedNotification) => void) {
  const handlerRef = useRef(onCallDue);
  handlerRef.current = onCallDue;
  const exhaustedRef = useRef(onCallExhausted);
  exhaustedRef.current = onCallExhausted;

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${proto}//${window.location.host}/notifications`);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg?.type === 'call_due') {
            handlerRef.current(msg as CallDueNotification);
          }
          if (msg?.type === 'call_exhausted') {
            exhaustedRef.current?.(msg as CallExhaustedNotification);
          }
        } catch {
          // Ignore malformed messages rather than crashing the listener.
        }
      };

      ws.onclose = () => {
        if (stopped) return;
        reconnectTimer = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);
}
