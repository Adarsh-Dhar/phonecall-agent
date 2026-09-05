import { Mic, PhoneOff, X, LoaderCircle } from 'lucide-react';
import { useBrowserVoiceCall } from '@/hooks/useBrowserVoiceCall';

export function TestCallWidget({ contactId, onClose }: { contactId?: string; onClose: () => void }) {
  const { status, errorMessage, transcript, start, stop } = useBrowserVoiceCall(contactId);

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
