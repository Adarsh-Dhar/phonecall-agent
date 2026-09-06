import { Phone, PhoneOff, X } from 'lucide-react';
import { useState } from 'react';
import { ServiceCallWidget } from './ServiceCallWidget';
import { acceptCall, declineCall } from '@/lib/api/calls';

interface IncomingCallData {
  callId: string;
  callerName: string;
  taskContext?: {
    taskId: string;
    title: string;
    description: string | null;
  } | null;
}

export function IncomingCallModal({ 
  incomingCall, 
  onClose 
}: { 
  incomingCall: IncomingCallData | null;
  onClose: () => void;
}) {
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  if (!incomingCall) return null;

  if (activeCallId) {
    return (
      <ServiceCallWidget
        callId={activeCallId}
        callerName={incomingCall.callerName}
        onClose={() => setActiveCallId(null)}
      />
    );
  }

  const handleAccept = async () => {
    try {
      await acceptCall(incomingCall.callId);
      setActiveCallId(incomingCall.callId);
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const handleDecline = async () => {
    try {
      await declineCall(incomingCall.callId);
      onClose();
    } catch (error) {
      console.error('Error declining call:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3f8274]">
              <Phone size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Incoming Call</h2>
              <p className="text-sm text-muted-foreground">
                {incomingCall.callerName || 'Unknown caller'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X size={14} />
          </button>
        </div>

        {incomingCall.taskContext && (
          <div className="mb-6 rounded-lg bg-muted/30 p-3">
            <p className="text-xs font-semibold text-muted-foreground">Calling about:</p>
            <p className="text-sm font-medium">{incomingCall.taskContext.title}</p>
            {incomingCall.taskContext.description && (
              <p className="mt-1 text-xs text-muted-foreground">{incomingCall.taskContext.description}</p>
            )}
          </div>
        )}

        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={handleDecline}
            className="flex items-center gap-2 rounded-lg bg-[#b44343] px-6 py-3 text-sm font-bold text-white hover:bg-[#9c3838]"
          >
            <PhoneOff size={16} /> Decline
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex items-center gap-2 rounded-lg bg-[#3f8274] px-6 py-3 text-sm font-bold text-white hover:bg-[#356c61]"
          >
            <Phone size={16} /> Accept
          </button>
        </div>
      </div>
    </div>
  );
}