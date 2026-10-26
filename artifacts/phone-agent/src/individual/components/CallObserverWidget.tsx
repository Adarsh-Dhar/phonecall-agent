import { useState, useEffect } from 'react';
import { X, Phone, PhoneOff, PhoneForwarded, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCallObserver } from '@/individual/hooks/useCallObserver';

interface CallObserverWidgetProps {
  callId: string;
  businessName: string;
  mode: 'outgoing' | 'incoming';
  onClose: () => void;
  /** Set when opened from a "your agent needs you" prompt, so the request shows immediately. */
  incomingHandoff?: { id: string; reason?: string; summary?: string } | null;
}

export function CallObserverWidget({ callId, businessName, mode, onClose, incomingHandoff }: CallObserverWidgetProps) {
  const { status, transcript, leave, handoff, handoffError, acceptHandoff, declineHandoff, endHandoff } = useCallObserver({
    callId,
    onEnded: onClose,
    incomingHandoff,
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

  const isCallFailed = status === 'declined' || status === 'missed';

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-[600px] flex flex-col shadow-lg">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full ${isCallFailed ? 'bg-red-100' : 'bg-primary/10'} flex items-center justify-center`}>
            {status === 'live' ? (
              <Phone className="h-5 w-5 text-primary animate-pulse" />
            ) : isCallFailed ? (
              <PhoneOff className="h-5 w-5 text-red-600" />
            ) : (
              <PhoneOff className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className={`font-semibold ${isCallFailed ? 'text-red-600' : ''}`}>{getStatusText()}</h3>
            <p className="text-sm text-muted-foreground">{businessName}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {handoff?.phase === 'requested' && (
        <div className="border-b bg-amber-50 p-4 text-sm" data-testid="handoff-request">
          <div className="flex items-center gap-2 font-semibold text-amber-900">
            <PhoneForwarded className="h-4 w-4" /> Your agent needs you on the line
          </div>
          {handoff.reason && <p className="mt-1 text-amber-900">{handoff.reason}</p>}
          {handoff.summary && <p className="mt-1 text-xs text-amber-800">{handoff.summary}</p>}
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={acceptHandoff} data-testid="button-take-call">Take the call</Button>
            <Button size="sm" variant="outline" onClick={declineHandoff}>Not now</Button>
          </div>
        </div>
      )}
      {handoff?.phase === 'live' && handoff.mine && (
        <div className="border-b bg-green-50 p-4 text-sm" data-testid="handoff-live">
          <p className="font-semibold text-green-900">You are speaking with {businessName}. Your agent is silent.</p>
          <Button size="sm" className="mt-3" onClick={endHandoff} data-testid="button-hand-back">
            <Bot className="mr-1 h-4 w-4" /> Hand back to agent
          </Button>
        </div>
      )}
      {handoff?.phase === 'live' && !handoff.mine && (
        <div className="border-b bg-muted p-3 text-xs text-muted-foreground">You joined this call from another window.</div>
      )}
      {handoff?.phase === 'ended' && (
        <div className="border-b bg-muted p-3 text-xs text-muted-foreground">You handed the call back. Your agent has resumed.</div>
      )}
      {handoffError && <div className="border-b bg-red-50 p-3 text-xs text-red-800">{handoffError}</div>}

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
        {isCallFailed ? (
          <p className="text-xs text-muted-foreground text-center">
            This call will close automatically in a few seconds.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground text-center">
            Your AI agent is handling this call. Closing this window will not end the call.
          </p>
        )}
      </div>
    </Card>
  );
}
