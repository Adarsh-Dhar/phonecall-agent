import { useState, useEffect, useRef } from 'react';

export function useBusinessVoiceCall(callId: string) {
  const [status, setStatus] = useState<'connecting' | 'live' | 'ended' | 'error'>('connecting');
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
          break;
        case 'transcript':
          setTranscript(prev => [...prev, { role: msg.role, text: msg.text }]);
          break;
        case 'call_ended':
          setStatus('ended');
          ws.close();
          break;
        case 'error':
          setStatus('error');
          console.error('Voice call error:', msg.message);
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
      }
    };

    return () => {
      ws.close();
    };
  }, [callId]);

  const sendAudio = (payload: string) => {
    if (wsRef.current && status === 'live') {
      wsRef.current.send(JSON.stringify({ type: 'audio', payload }));
    }
  };

  const endCall = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'stop' }));
    }
  };

  return {
    status,
    transcript,
    sendAudio,
    endCall,
  };
}
