import { useState, useEffect, useRef, useCallback } from 'react';

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

  const leave = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'stop' }));
      wsRef.current.close();
      wsRef.current = null;
    }
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
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/voice-stream`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connecting');
      ws.send(JSON.stringify({ type: 'start', callId }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'ready':
            setStatus('live');
            break;

          case 'transcript':
            setTranscript((prev) => [...prev, { role: msg.role, text: msg.text }]);
            break;

          case 'call_ended':
            setStatus('ended');
            onEnded?.();
            ws.close();
            break;

          case 'error':
            setStatus('error');
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
      if (status !== 'ended') {
        setStatus('error');
      }
    };

    ws.onerror = (err) => {
      console.error('Voice stream WebSocket error:', err);
      setStatus('error');
    };

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      ws.close();
    };
  }, [callId, onEnded, status]);

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
