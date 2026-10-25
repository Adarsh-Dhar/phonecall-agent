import { useEffect, useRef, useCallback } from 'react';

export type PresenceEvent =
  | { type: 'incoming_call'; callId: string; callerName: string; taskContext?: { taskId: string; title: string; description: string | null } | null }
  | { type: 'call_status'; callId: string; status: 'in-progress' | 'missed' | 'declined' }
  | { type: 'user_question'; queryId: string; callId: string; question: string; urgent: boolean }
  | { type: 'post_call_question'; queryId: string; question: string; contactId: string }
  | { type: 'handoff_request'; handoffId: string; callId: string; contactName: string; reason: string; summary: string; expiresInMs: number }
  | { type: 'agent_call'; direction: 'outbound' | 'inbound'; callId: string; contactName: string | null; title: string | null };

/**
 * Keeps a WebSocket open to the server's presence registry (/presence)
 * for real-time call notifications. Handles incoming_call, call_status, user_question, and post_call_question events.
 *
 * This enables:
 * - Service accounts to receive incoming call notifications
 * - Personal users to receive call status updates (ringing → in-progress → missed/declined)
 * - Personal users to receive urgent questions during in-progress calls
 * - Personal users to receive post-call questions
 *
 * Reconnects automatically with a short backoff if the connection drops.
 */
export function usePresence(
  onIncomingCall: (event: Extract<PresenceEvent, { type: 'incoming_call' }>) => void,
  onCallStatus: (event: Extract<PresenceEvent, { type: 'call_status' }>) => void,
  onUserQuestion?: (event: Extract<PresenceEvent, { type: 'user_question' }>) => void,
  onPostCallQuestion?: (event: Extract<PresenceEvent, { type: 'post_call_question' }>) => void,
  onAgentCall?: (event: Extract<PresenceEvent, { type: 'agent_call' }>) => void,
  onHandoffRequest?: (event: Extract<PresenceEvent, { type: 'handoff_request' }>) => void
) {
  const onIncomingCallRef = useRef(onIncomingCall);
  const onCallStatusRef = useRef(onCallStatus);
  const onUserQuestionRef = useRef(onUserQuestion);
  const onPostCallQuestionRef = useRef(onPostCallQuestion);
  const onAgentCallRef = useRef(onAgentCall);
  const onHandoffRequestRef = useRef(onHandoffRequest);

  onIncomingCallRef.current = onIncomingCall;
  onCallStatusRef.current = onCallStatus;
  onUserQuestionRef.current = onUserQuestion;
  onPostCallQuestionRef.current = onPostCallQuestion;
  onAgentCallRef.current = onAgentCall;
  onHandoffRequestRef.current = onHandoffRequest;

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

          if (msg?.type === 'incoming_call') {
            onIncomingCallRef.current(msg as Extract<PresenceEvent, { type: 'incoming_call' }>);
          } else if (msg?.type === 'call_status') {
            onCallStatusRef.current(msg as Extract<PresenceEvent, { type: 'call_status' }>);
          } else if (msg?.type === 'user_question') {
            onUserQuestionRef.current?.(msg as Extract<PresenceEvent, { type: 'user_question' }>);
          } else if (msg?.type === 'post_call_question') {
            onPostCallQuestionRef.current?.(msg as Extract<PresenceEvent, { type: 'post_call_question' }>);
          } else if (msg?.type === 'handoff_request') {
            onHandoffRequestRef.current?.(msg as Extract<PresenceEvent, { type: 'handoff_request' }>);
          } else if (msg?.type === 'agent_call') {
            onAgentCallRef.current?.(msg as Extract<PresenceEvent, { type: 'agent_call' }>);
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