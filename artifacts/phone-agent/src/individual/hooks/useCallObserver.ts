import { useState, useEffect, useRef, useCallback } from 'react';
import { callStatusBus } from '@/lib/callStatusBus';

interface TranscriptTurn {
  role: 'agent' | 'business';
  text: string;
}

interface HandoffState {
  phase: 'requested' | 'live' | 'ended' | null;
  id: string | null;
  reason?: string;
  summary?: string;
  mine: boolean;
}

interface UseCallObserverOptions {
  callId: string;
  onEnded?: () => void;
  incomingHandoff?: { id: string; reason?: string; summary?: string } | null;
}

export function useCallObserver({ callId, onEnded, incomingHandoff }: UseCallObserverOptions) {
  const [status, setStatus] = useState<'waiting' | 'connecting' | 'live' | 'ended' | 'missed' | 'declined' | 'error'>('waiting');
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [handoff, setHandoff] = useState<HandoffState>({ phase: null, id: null, mine: false });
  const [handoffError, setHandoffError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHandoffHandledRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  const endedRef = useRef(false);

  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);

  // Subscribe to call status updates from the bus
  useEffect(() => {
    const unsubscribe = callStatusBus.subscribe((event) => {
      if (event.callId === callId) {
        if (event.status === 'declined' || event.status === 'missed') {
          console.log('useCallObserver: call declined/missed via bus', { callId, status: event.status });
          // Set the status
          setStatus(event.status);
          // Close the observer socket
          const ws = wsRef.current;
          wsRef.current = null;
          if (ws) {
            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'stop' }));
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
          }
          // Dismiss the widget after 4 seconds
          setTimeout(() => {
            onEndedRef.current?.();
          }, 4000);
        } else if (event.status === 'in-progress') {
          console.log('useCallObserver: call in-progress via bus', { callId });
          // Set status to live when call is in-progress
          setStatus('live');
        }
      }
    });

    return unsubscribe;
  }, [callId]);

  const leave = useCallback(() => {
    const ws = wsRef.current;
    wsRef.current = null;
    if (!ws) return;
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'stop' }));
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
  }, []);

  const acceptHandoff = useCallback(() => {
    if (!handoff.id) return;
    setHandoffError(null);
    wsRef.current?.send(JSON.stringify({ type: 'handoff_accept', handoffId: handoff.id }));
  }, [handoff.id]);

  const declineHandoff = useCallback(() => {
    if (!handoff.id) return;
    wsRef.current?.send(JSON.stringify({ type: 'handoff_decline', handoffId: handoff.id }));
    setHandoff({ phase: null, id: null, mine: false });
  }, [handoff.id]);

  const endHandoff = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'handoff_end' }));
  }, []);

  useEffect(() => {
    if (incomingHandoff && !isHandoffHandledRef.current) {
      isHandoffHandledRef.current = true;
      setHandoff({
        phase: 'requested',
        id: incomingHandoff.id,
        reason: incomingHandoff.reason,
        summary: incomingHandoff.summary,
        mine: true,
      });
    }
  }, [incomingHandoff]);

  useEffect(() => {
    let disposed = false;
    endedRef.current = false;
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/media/browser`);
    wsRef.current = ws;

    const connectionTimeout = setTimeout(() => {
      if (disposed || ws.readyState === WebSocket.OPEN) return;
      console.error('WebSocket connection timeout in useCallObserver');
      setStatus('error');
      setHandoffError('Connection timeout. Please check your network and try again.');
      ws.close();
    }, 10000);

    ws.onopen = () => {
      if (disposed) return;
      clearTimeout(connectionTimeout);
      setStatus('connecting');
      ws.send(JSON.stringify({ type: 'start', callId }));
    };

    ws.onmessage = (event) => {
      if (disposed) return;
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'ready':
            // Don't overwrite declined or missed status
            if (status !== 'declined' && status !== 'missed') {
              setStatus('live');
            }
            break;

          case 'transcript':
            setTranscript((prev) => [...prev, { role: msg.role, text: msg.text }]);
            break;

          case 'call_ended':
            endedRef.current = true;
            setStatus('ended');
            onEndedRef.current?.();
            ws.close();
            break;

          case 'error':
            // Don't overwrite declined or missed status
            if (status !== 'declined' && status !== 'missed') {
              setStatus('error');
            }
            setHandoffError(msg.message);
            break;

          case 'handoff_request':
            setHandoff({
              phase: 'requested',
              id: msg.handoffId,
              reason: msg.reason,
              summary: msg.summary,
              mine: true,
            });
            break;

          case 'handoff':
            if (msg.state === 'live') {
              setHandoff((prev) => ({
                phase: 'live',
                id: msg.handoffId || prev.id,
                mine: msg.you || prev.mine,
              }));
            } else if (msg.state === 'ended') {
              setHandoff({ phase: 'ended', id: null, mine: false });
            } else if (msg.state === 'gone') {
              setHandoffError('Handoff request expired or was handled elsewhere');
              setHandoff({ phase: null, id: null, mine: false });
            }
            break;
        }
      } catch (err) {
        console.error('Failed to parse voice-stream message:', err);
      }
    };

    ws.onclose = () => {
      clearTimeout(connectionTimeout);
      if (disposed) return;
      if (!endedRef.current && status !== 'declined' && status !== 'missed') {
        setStatus('error');
      }
    };

    ws.onerror = (err) => {
      clearTimeout(connectionTimeout);
      if (disposed) return;
      console.error('Voice stream WebSocket error:', err);
      // Don't overwrite declined or missed status
      if (status !== 'declined' && status !== 'missed') {
        setStatus('error');
      }
    };

    return () => {
      disposed = true;
      clearTimeout(connectionTimeout);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current === ws) wsRef.current = null;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
      // Clear the call status from the bus when unmounting
      callStatusBus.clear(callId);
    };
  }, [callId]);

  return {
    status,
    transcript,
    leave,
    handoff,
    handoffError,
    acceptHandoff,
    declineHandoff,
    endHandoff,
  };
}
