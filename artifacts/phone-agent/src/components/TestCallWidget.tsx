import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, PhoneOff, X, LoaderCircle } from 'lucide-react';

/**
 * Free, in-browser call — talks to the same Gemini voice agent over a plain
 * WebSocket + the browser mic. No telephony carrier, no per-minute cost.
 *
 * Protocol matches artifacts/api-server/src/services/voiceStreamBrowser.ts:
 *   → {type:"start", contactId?}   → {type:"audio", payload: base64 pcm16 16k}   → {type:"stop"}
 *   ← {type:"ready"}   ← {type:"audio", payload: base64 pcm16 24k}   ← {type:"transcript", role, text}
 */

type TranscriptTurn = { role: 'user' | 'assistant'; text: string };

type Status = 'idle' | 'connecting' | 'active' | 'error';

function downsampleTo16k(input: Float32Array, inputSampleRate: number): Int16Array {
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

export function TestCallWidget({ contactId, onClose }: { contactId?: string; onClose: () => void }) {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackTimeRef = useRef(0);

  const stop = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'stop' }));
    wsRef.current?.close();
    wsRef.current = null;

    processorRef.current?.disconnect();
    processorRef.current = null;

    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;

    void audioCtxRef.current?.close();
    audioCtxRef.current = null;

    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    setErrorMessage(null);
    setTranscript([]);
    setStatus('connecting');

    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = mic;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      playbackTimeRef.current = audioCtx.currentTime;

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/media/browser`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'start', contactId }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === 'ready') {
          setStatus('active');

          // Start streaming mic audio only once the session is confirmed live.
          const source = audioCtx.createMediaStreamSource(mic);
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;
          processor.onaudioprocess = (e) => {
            if (ws.readyState !== WebSocket.OPEN) return;
            const input = e.inputBuffer.getChannelData(0);
            const pcm16k = downsampleTo16k(input, audioCtx.sampleRate);
            ws.send(JSON.stringify({ type: 'audio', payload: int16ToBase64(pcm16k) }));
          };
          source.connect(processor);
          // A ScriptProcessorNode must be connected to a destination to run,
          // even though we don't want it audible — route through a silent gain.
          const silentGain = audioCtx.createGain();
          silentGain.gain.value = 0;
          processor.connect(silentGain);
          silentGain.connect(audioCtx.destination);
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
          setTranscript((prev) => [...prev, { role: msg.role, text: msg.text }]);
        } else if (msg.type === 'error') {
          setErrorMessage(msg.message);
          setStatus('error');
        }
      };

      ws.onerror = () => {
        setErrorMessage('Connection to the voice agent failed.');
        setStatus('error');
      };

      ws.onclose = () => {
        setStatus((s) => (s === 'error' ? s : 'idle'));
      };
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Microphone access failed.');
      setStatus('error');
    }
  }, [contactId]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Test Call (Browser)</h2>
            <p className="text-[11px] text-muted-foreground">Free — uses your mic, no phone number involved.</p>
          </div>
          <button
            type="button"
            onClick={() => { stop(); onClose(); }}
            className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X size={14} />
          </button>
        </div>

        <div className="mb-4 h-56 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3 text-xs">
          {transcript.length === 0 ? (
            <p className="text-muted-foreground">
              {status === 'active' ? 'Listening — start talking.' : 'Transcript will appear here once the call starts.'}
            </p>
          ) : (
            <div className="space-y-2">
              {transcript.map((turn, i) => (
                <p key={i}>
                  <span className={`font-bold ${turn.role === 'assistant' ? 'text-[#3f8274]' : 'text-[#3159c4]'}`}>
                    {turn.role === 'assistant' ? 'Agent: ' : 'You: '}
                  </span>
                  {turn.text}
                </p>
              ))}
            </div>
          )}
        </div>

        {errorMessage && <p className="mb-3 text-xs text-[#b44343]">{errorMessage}</p>}

        <div className="flex justify-end gap-2">
          {status === 'active' ? (
            <button
              type="button"
              onClick={stop}
              className="flex items-center gap-1.5 rounded-lg bg-[#b44343] px-4 py-2 text-xs font-bold text-white hover:bg-[#9c3838]"
            >
              <PhoneOff size={13} /> End Call
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void start()}
              disabled={status === 'connecting'}
              className="flex items-center gap-1.5 rounded-lg bg-[#3f8274] px-4 py-2 text-xs font-bold text-white hover:bg-[#356c61] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === 'connecting' ? <LoaderCircle size={13} className="animate-spin" /> : <Mic size={13} />}
              {status === 'connecting' ? 'Connecting...' : 'Start Talking'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}