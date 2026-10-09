import { useState, useEffect } from 'react';
import { PhoneOff, X, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useBusinessVoiceCall } from '../hooks/useBusinessVoiceCall';

interface BusinessCallWidgetProps {
  callId: string;
  onEnded: () => void;
}

export function BusinessCallWidget({ callId, onEnded }: BusinessCallWidgetProps) {
  const { status, errorMessage, transcript, start, stop } = useBusinessVoiceCall(callId);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-start the call when the widget mounts
    console.log('BusinessCallWidget: starting call for', callId);
    start().catch((err) => {
      console.error('BusinessCallWidget: failed to start call', err);
      setInitError(err instanceof Error ? err.message : 'Failed to start call');
    });
    return () => {
      console.log('BusinessCallWidget: cleaning up call');
      stop();
    };
  }, [callId, start, stop]);

  const handleEndCall = () => {
    console.log('BusinessCallWidget: ending call');
    stop();
    onEnded();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="flex flex-col w-full max-w-md h-[600px]">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">
            {status === 'live' ? 'In Call' : status === 'connecting' ? 'Connecting...' : status === 'error' ? 'Error' : 'Call Ended'}
          </h3>
          <Button variant="ghost" size="icon" onClick={handleEndCall}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {(errorMessage || initError) && (
          <div className="p-4 bg-destructive/10 text-destructive text-sm">
            {errorMessage || initError}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {transcript.length === 0 && status === 'connecting' && (
            <p className="text-center text-muted-foreground text-sm">Connecting to call...</p>
          )}
          {transcript.length === 0 && status === 'error' && (
            <p className="text-center text-destructive text-sm">Failed to connect. Please check your microphone permissions and try again.</p>
          )}
          {transcript.map((turn, idx) => (
            <div
              key={idx}
              className={`flex ${turn.role === 'agent' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  turn.role === 'agent'
                    ? 'bg-muted'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                <p className="text-sm">{turn.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {status === 'live' && <Mic className="h-4 w-4" />}
            {status === 'live' ? 'Speaking...' : status === 'connecting' ? 'Connecting...' : status}
          </div>
          <Button variant="destructive" onClick={handleEndCall}>
            <PhoneOff className="h-4 w-4 mr-2" />
            End Call
          </Button>
        </div>
      </Card>
    </div>
  );
}
