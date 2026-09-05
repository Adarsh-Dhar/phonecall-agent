import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Free, in-browser call — talks to the same Gemini voice agent over a plain
 * WebSocket + the browser mic. No telephony carrier, no per-minute cost.
 *
 * Protocol matches artifacts/api-server/src/services/voiceStreamBrowser.ts:
 *   → {type:"start", contactId?}   → {type:"audio", payload: base64 pcm16 16k}   → {type:"stop"}
 *   ← {type:"ready"}   ← {type:"audio", payload: base64 pcm16 24k}   ← {type:"transcript", role, text}
 *   ← {type:"call_ended", reason: "agent"|"user"}   (server hung up — e.g. the agent ended the call itself)
 */

export type TranscriptTurn = { role: 'user' | 'assistant'; text: string };

export type BrowserVoiceCallStatus = 'idle' | 'connecting' | 'active' | 'error';

// ─── PCM16 <-> Float32 / base64 codec helpers ────────────────────────────────
// (Mirrors artifacts/api-server/src/lib/audioCodec.ts, but browser-side —
// operates on Float32Array from the Web Audio API instead of Node buffers.)

function downsampleTo16k(input: Float32Array, inputSampleRate: number): Int16Array {
  // If already at 16kHz, just convert without resampling
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

/**
 * Manages the WebSocket + mic-capture lifecycle for an in-browser voice call.
 * `TestCallWidget` consumes this hook and stays a thin UI layer.
 */
export function useBrowserVoiceCall(contactId?: string) {
  const [status, setStatus] = useState<BrowserVoiceCallStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackTimeRef = useRef(0);

  // Releases the mic/audio-context resources. Safe to call more than once
  // (e.g. once from the user clicking "stop", and again from ws.onclose).
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

    setStatus('idle');
  }, [releaseAudioResources]);

  const start = useCallback(async () => {
    setErrorMessage(null);
    setTranscript([]);
    setStatus('connecting');

    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = mic;

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;
      playbackTimeRef.current = audioCtx.currentTime;
      console.log('AudioContext created with sample rate:', audioCtx.sampleRate);

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/media/browser`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        ws.send(JSON.stringify({ type: 'start', contactId }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        console.log('Received message:', msg.type, msg);

        if (msg.type === 'ready') {
          console.log('Session ready, starting audio capture');
          setStatus('active');

          // Start streaming mic audio only once the session is confirmed live.
          const source = audioCtx.createMediaStreamSource(mic);
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;
          processor.onaudioprocess = (e) => {
            if (ws.readyState !== WebSocket.OPEN) return;
            const input = e.inputBuffer.getChannelData(0);

            // Check if there's actual audio data
            const maxAmplitude = Math.max(...input.map(Math.abs));
            const hasAudio = maxAmplitude > 0.01;

            if (hasAudio) {
              console.log('Audio detected, max amplitude:', maxAmplitude.toFixed(4));
            }

            const pcm16k = downsampleTo16k(input, audioCtx.sampleRate);
            const payload = int16ToBase64(pcm16k);

            if (payload.length > 0) {
              console.log('Sending audio payload, length:', payload.length);
              ws.send(JSON.stringify({ type: 'audio', payload }));
            }
          };
          source.connect(processor);
          // A ScriptProcessorNode must be connected to a destination to run,
          // even though we don't want it audible — route through a silent gain.
          const silentGain = audioCtx.createGain();
          silentGain.gain.value = 0;
          processor.connect(silentGain);
          silentGain.connect(audioCtx.destination);
        } else if (msg.type === 'audio') {
          console.log('Received audio payload length:', msg.payload.length);
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
          // The server hung up on us — most commonly the agent itself ending
          // the call. Release the mic right away rather than waiting on the
          // socket's close event.
          console.log('Call ended by server, reason:', msg.reason);
          releaseAudioResources();
        } else if (msg.type === 'error') {
          console.error('Received error:', msg.message);
          setErrorMessage(msg.message);
          setStatus('error');
        }
      };

      ws.onerror = () => {
        setErrorMessage('Connection to the voice agent failed.');
        setStatus('error');
      };

      ws.onclose = () => {
        // Covers both the user-initiated stop() path and a server-initiated
        // close (e.g. the agent ending the call) — idempotent either way.
        releaseAudioResources();
        wsRef.current = null;
        setStatus((s) => (s === 'error' ? s : 'idle'));
      };
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Microphone access failed.');
      setStatus('error');
    }
  }, [contactId, releaseAudioResources]);

  useEffect(() => {
    return () => {
      // Best-effort cleanup if the modal is closed mid-call.
      wsRef.current?.send(JSON.stringify({ type: 'stop' }));
      wsRef.current?.close();
      processorRef.current?.disconnect();
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      void audioCtxRef.current?.close();
    };
  }, []);

  return { status, errorMessage, transcript, start, stop };
}
