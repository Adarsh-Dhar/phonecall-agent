import { useEffect, useRef, useCallback } from 'react';

export type PresenceEvent = 
  | { type: 'incoming_call'; callId: string; callerName: string; taskContext?: { taskId: string; title: string; description: string | null } | null }
  | { type: 'call_status'; callId: string; status: 'in-progress' | 'missed' | 'declined' };

/**
 * Keeps a WebSocket open to the server's presence registry (/presence)
 * for real-time call notifications. Handles incoming_call and call_status events.
 * 
 * This enables:
 * - Service accounts to receive incoming call notifications
 * - Personal users to receive call status updates (ringing → in-progress → missed/declined)
 * 
 * Reconnects automatically with a short backoff if the connection drops.
 */
export function usePresence(onIncomingCall: (event: Extract<PresenceEvent, { type: 'incoming_call' }>) => void, onCallStatus: (event: Extract<PresenceEvent, { type: 'call_status' }>) => void) {
  const onIncomingCallRef = useRef(onIncomingCall);
  const onCallStatusRef = useRef(onCallStatus);
  
  onIncomingCallRef.current = onIncomingCall;
  onCallStatusRef.current = onCallStatus;

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${proto}//${window.location.host}/presence`);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          console.log('Presence event received:', msg);
          
          if (msg?.type === 'incoming_call') {
            onIncomingCallRef.current(msg as Extract<PresenceEvent, { type: 'incoming_call' }>);
          } else if (msg?.type === 'call_status') {
            onCallStatusRef.current(msg as Extract<PresenceEvent, { type: 'call_status' }>);
          }
        } catch (err) {
          console.error('Failed to parse presence message:', err);
        }
      };

      ws.onclose = () => {
        console.log('Presence WebSocket closed, reconnecting in 5s...');
        if (stopped) return;
        reconnectTimer = setTimeout(connect, 5000);
      };

      ws.onerror = (err) => {
        console.error('Presence WebSocket error:', err);
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