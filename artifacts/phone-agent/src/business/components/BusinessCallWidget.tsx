import { useState, useEffect } from 'react';
import { PhoneOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useBusinessVoiceCall } from '../hooks/useBusinessVoiceCall';

interface BusinessCallWidgetProps {
  callId: string;
  onEnded: () => void;
}

export function BusinessCallWidget({ callId, onEnded }: BusinessCallWidgetProps) {
  const { status, transcript, endCall } = useBusinessVoiceCall(callId);

  const handleEndCall = () => {
    endCall();
    onEnded();
  };

  return (
    <Card className="flex flex-col h-[500px]">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">
          {status === 'live' ? 'In Call' : status === 'connecting' ? 'Connecting...' : 'Call Ended'}
        </h3>
        <Button variant="ghost" size="icon" onClick={handleEndCall}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {transcript.length === 0 && status === 'connecting' && (
          <p className="text-center text-muted-foreground text-sm">Connecting to call...</p>
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

      <div className="p-4 border-t flex justify-center">
        <Button variant="destructive" onClick={handleEndCall}>
          <PhoneOff className="h-4 w-4 mr-2" />
          End Call
        </Button>
      </div>
    </Card>
  );
}
