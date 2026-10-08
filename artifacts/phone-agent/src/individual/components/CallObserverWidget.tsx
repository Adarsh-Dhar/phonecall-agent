import { useState, useEffect } from 'react';
import { X, Phone, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCallObserver } from '@/individual/hooks/useCallObserver';

interface CallObserverWidgetProps {
  callId: string;
  businessName: string;
  mode: 'outgoing' | 'incoming';
  onClose: () => void;
}

export function CallObserverWidget({ callId, businessName, mode, onClose }: CallObserverWidgetProps) {
  const { status, transcript, leave } = useCallObserver({
    callId,
    onEnded: onClose,
  });

  const getStatusText = () => {
    switch (status) {
      case 'waiting': return 'Connecting...';
      case 'connecting': return 'Connecting...';
      case 'live': return mode === 'outgoing' ? 'In call with' : 'Receiving call from';
      case 'ended': return 'Call ended';
      case 'missed': return 'Call missed';
      case 'declined': return 'Call declined';
      case 'error': return 'Connection error';
      default: return '';
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-[600px] flex flex-col shadow-lg">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            {status === 'live' ? (
              <Phone className="h-5 w-5 text-primary animate-pulse" />
            ) : (
              <PhoneOff className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="font-semibold">{getStatusText()}</h3>
            <p className="text-sm text-muted-foreground">{businessName}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
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

      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          Your AI agent is handling this call. Closing this window will not end the call.
        </p>
      </div>
    </Card>
  );
}
