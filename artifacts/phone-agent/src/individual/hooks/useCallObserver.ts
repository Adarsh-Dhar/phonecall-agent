import { useState, useEffect, useRef } from 'react';

export type CallStatus = 'waiting' | 'connecting' | 'live' | 'ended' | 'missed' | 'declined' | 'error';

interface UseCallObserverOptions {
  callId: string;
  onEnded?: () => void;
  onMissed?: () => void;
  onDeclined?: () => void;
  waitForAnswer?: boolean;
}

export function useCallObserver({ callId, onEnded, onMissed, onDeclined, waitForAnswer = false }: UseCallObserverOptions) {
  const [status, setStatus] = useState<CallStatus>('waiting');
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string }>>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!callId) return;

    setStatus('connecting');
    setTranscript([]);

    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/media/service`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'start', callId }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case 'ready':
          setStatus('live');
          if (msg.history) {
            setTranscript(msg.history);
          }
          break;
        case 'transcript':
          setTranscript(prev => [...prev, { role: msg.role, text: msg.text }]);
          break;
        case 'call_ended':
          setStatus('ended');
          onEnded?.();
          ws.close();
          break;
        case 'error':
          setStatus('error');
          console.error('Call observer error:', msg.message);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus('error');
    };

    ws.onclose = () => {
      if (status === 'live') {
        setStatus('ended');
        onEnded?.();
      }
    };

    return () => {
      ws.close();
    };
  }, [callId]);

  const endCall = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'stop' }));
    }
  };

  const leave = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  return {
    status,
    transcript,
    endCall,
    leave,
  };
}
