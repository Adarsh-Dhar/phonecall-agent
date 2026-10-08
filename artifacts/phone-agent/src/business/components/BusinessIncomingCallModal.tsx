import { useState } from 'react';
import { Phone, PhoneOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { acceptCall, declineCall } from '../api';
import { BusinessCallWidget } from './BusinessCallWidget';

interface BusinessIncomingCallModalProps {
  incomingCall: {
    callId: string;
    callerName: string;
    taskContext?: { taskId: string; title: string; description: string | null } | null;
  };
  onClose: () => void;
}

export function BusinessIncomingCallModal({ incomingCall, onClose }: BusinessIncomingCallModalProps) {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    try {
      await acceptCall(incomingCall.callId);
      setAccepted(true);
    } catch (error) {
      console.error('Failed to accept call:', error);
    }
  };

  const handleDecline = async () => {
    try {
      await declineCall(incomingCall.callId);
      onClose();
    } catch (error) {
      console.error('Failed to decline call:', error);
    }
  };

  if (accepted) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Call in Progress</DialogTitle>
          </DialogHeader>
          <BusinessCallWidget callId={incomingCall.callId} onEnded={onClose} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Incoming Call</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="text-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
              <Phone className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <h3 className="text-2xl font-semibold">{incomingCall.callerName}</h3>
            {incomingCall.taskContext && (
              <p className="text-muted-foreground mt-2">
                About: {incomingCall.taskContext.title}
              </p>
            )}
          </div>

          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={handleAccept}>
              <Phone className="h-5 w-5 mr-2" />
              Accept
            </Button>
            <Button size="lg" variant="destructive" onClick={handleDecline}>
              <PhoneOff className="h-5 w-5 mr-2" />
              Decline
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
