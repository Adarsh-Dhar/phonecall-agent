import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Business voice call — talks to the voice service over WebSocket with mic capture
 * and audio playback. The business is the human on the line, speaking to the individual's AI agent.
 *
 * Protocol matches artifacts/api-server/src/services/voiceStreamService.ts:
 *   → {type:"start", callId}   → {type:"audio", payload: base64 pcm16 16k}   → {type:"stop"}
 *   ← {type:"ready", role, history}   ← {type:"audio", payload: base64 pcm16 24k}   ← {type:"transcript", role, text}
 *   ← {type:"call_ended", reason}
 */

export type TranscriptTurn = { role: 'business' | 'agent'; text: string };

export type BusinessVoiceCallStatus = 'connecting' | 'live' | 'ended' | 'error';

// ─── PCM16 <-> Float32 / base64 codec helpers ────────────────────────────────

function downsampleTo16k(input: Float32Array, inputSampleRate: number): Int16Array {
  // Handle NaN or invalid sample rates
  if (!inputSampleRate || isNaN(inputSampleRate) || inputSampleRate <= 0) {
    inputSampleRate = 16000; // Fallback to 16kHz
  }

  if (inputSampleRate === 16000) {
    const out = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i] ?? 0));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  }

  const ratio = inputSampleRate / 16000;
  const outLength = Math.floor(input.length / ratio);
  const out = new Int16Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const srcIdx = Math.floor(i * ratio);
    const s = Math.max(-1, Math.min(1, input[srcIdx] ?? 0));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function int16ToBase64(samples: Int16Array): string {
  const bytes = new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToInt16(b64: string): Int16Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.length / 2));
}

// ─── Call state machine ──────────────────────────────────────────────────────

export function useBusinessVoiceCall(callId: string) {
  const [status, setStatus] = useState<BusinessVoiceCallStatus>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackTimeRef = useRef(0);
  const statusRef = useRef<BusinessVoiceCallStatus>('connecting');

  // Keep statusRef in sync with status
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const releaseAudioResources = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;

    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;

    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
  }, []);

  const stop = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'stop' }));
    wsRef.current?.close();
    wsRef.current = null;

    releaseAudioResources();

    setStatus('ended');
  }, [releaseAudioResources]);

  const start = useCallback(async () => {
    setErrorMessage(null);
    setTranscript([]);
    setStatus('connecting');
    statusRef.current = 'connecting';

    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = mic;

      // Safari requires AudioContext to be resumed after user interaction
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioCtxRef.current = audioCtx;
      playbackTimeRef.current = audioCtx.currentTime;
      console.log('AudioContext created with sample rate:', audioCtx.sampleRate);

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/media/service`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        ws.send(JSON.stringify({ type: 'start', callId }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        console.log('Received message:', msg.type, msg);

        if (msg.type === 'ready') {
          console.log('Session ready, starting audio capture');
          setStatus('live');
          statusRef.current = 'live';

          // Start streaming mic audio only once the session is confirmed live.
          const source = audioCtx.createMediaStreamSource(mic);
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;
          processor.onaudioprocess = (e) => {
            if (ws.readyState !== WebSocket.OPEN) return;
            const input = e.inputBuffer.getChannelData(0);

            const pcm16k = downsampleTo16k(input, audioCtx.sampleRate);
            const payload = int16ToBase64(pcm16k);

            if (payload.length > 0) {
              ws.send(JSON.stringify({ type: 'audio', payload }));
            }
          };
          source.connect(processor);
          const silentGain = audioCtx.createGain();
          silentGain.gain.value = 0;
          processor.connect(silentGain);
          silentGain.connect(audioCtx.destination);

          // Handle history replay
          if (msg.history && Array.isArray(msg.history)) {
            setTranscript(msg.history.map((h: any) => ({
              role: h.role === 'business' ? 'business' : 'agent',
              text: h.text
            })));
          }
        } else if (msg.type === 'audio') {
          const pcm24k = base64ToInt16(msg.payload);
          const buffer = audioCtx.createBuffer(1, pcm24k.length, 24000);
          const channel = buffer.getChannelData(0);
          for (let i = 0; i < pcm24k.length; i++) channel[i] = pcm24k[i] / 0x8000;

          const src = audioCtx.createBufferSource();
          src.buffer = buffer;
          src.connect(audioCtx.destination);

          const startAt = Math.max(playbackTimeRef.current, audioCtx.currentTime);
          src.start(startAt);
          playbackTimeRef.current = startAt + buffer.duration;
        } else if (msg.type === 'transcript') {
          console.log('Received transcript:', msg.role, msg.text);
          setTranscript((prev) => [...prev, { role: msg.role, text: msg.text }]);
        } else if (msg.type === 'call_ended') {
          console.log('Call ended by server, reason:', msg.reason);
          releaseAudioResources();
          setStatus('ended');
          statusRef.current = 'ended';
        } else if (msg.type === 'error') {
          console.error('Received error:', msg.message);
          setErrorMessage(msg.message);
          setStatus('error');
          statusRef.current = 'error';
        }
      };

      ws.onerror = () => {
        setErrorMessage('Connection to the voice agent failed.');
        setStatus('error');
        statusRef.current = 'error';
      };

      ws.onclose = () => {
        releaseAudioResources();
        wsRef.current = null;
        if (statusRef.current !== 'error') {
          setStatus('ended');
          statusRef.current = 'ended';
        }
      };
    } catch (err) {
      console.error('Failed to start voice call:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Microphone access failed.');
      setStatus('error');
      statusRef.current = 'error';
    }
  }, [callId, releaseAudioResources]);

  useEffect(() => {
    return () => {
      wsRef.current?.send(JSON.stringify({ type: 'stop' }));
      wsRef.current?.close();
      processorRef.current?.disconnect();
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      void audioCtxRef.current?.close();
    };
  }, []);

  return { status, errorMessage, transcript, start, stop };
}
