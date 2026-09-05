import { useEffect, useRef } from 'react';

export type CallDueNotification = {
  type: 'call_due';
  taskId: string;
  contactId: string;
  contactName: string;
  title: string;
  description: string | null;
};

/**
 * Keeps a WebSocket open to the server's call-scheduler notification
 * channel (services/notifications.ts + services/callScheduler.ts) for as
 * long as the app is mounted. When a task's due date arrives, the server
 * pushes a "call_due" message here and `onCallDue` fires — this is what
 * lets a task's due time actually trigger something on its own, instead of
 * just sitting in the calendar until someone remembers to click "Call".
 *
 * This only works while this tab is open with a live connection — there's
 * no service-worker/push layer, so closing the tab means a due task just
 * waits (the server still marks it as triggered so it won't double-fire,
 * but nothing pops up until a tab reconnects and the user notices it).
 * Reconnects automatically with a short backoff if the connection drops.
 */
export function useCallDueNotifications(onCallDue: (notification: CallDueNotification) => void) {
  const handlerRef = useRef(onCallDue);
  handlerRef.current = onCallDue;

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
