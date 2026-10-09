import { Redirect, Route, Switch } from 'wouter';
import { BusinessLayout } from './layout/BusinessLayout';
import { BusinessCallsPage } from './pages/BusinessCallsPage';
import { BusinessContactsPage } from './pages/BusinessContactsPage';
import { BusinessIncomingCallModal } from './components/BusinessIncomingCallModal';
import { BusinessCallWidget } from './components/BusinessCallWidget';
import { usePresence } from '@/hooks/usePresence';
import { dialCall } from './api';
import { useState } from 'react';

export default function BusinessApp() {
  const [incomingCall, setIncomingCall] = useState<{ callId: string; callerName: string; taskContext?: any } | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [dialingId, setDialingId] = useState<string | null>(null);

  const startCall = async (contactId: string) => {
    try {
      const r = await dialCall(contactId);
      if (r.status === 'missed') {
        console.log('They are offline - call marked as missed');
        // Reload calls to show the missed call in history
        return;
      }
      setDialingId(r.callId);
    } catch (error) {
      console.error('Failed to dial:', error);
      throw error; // Re-throw to let the contact page handle the error display
    }
  };

  // Enable presence for business accounts to get incoming calls and status updates
  usePresence(
    (event) => {
      console.log('Incoming call received:', event);
      setIncomingCall({
        callId: event.callId,
        callerName: event.callerName,
        taskContext: event.taskContext,
      });
    },
    (event) => {
      console.log('Call status update:', event);
      if (event.callId === dialingId) {
        if (event.status === 'in-progress') {
          setActiveCallId(dialingId);
          setDialingId(null);
        }
        if (event.status === 'declined' || event.status === 'missed') {
          setDialingId(null);
        }
      }
    },
    (event) => {
      console.log('Live question received:', event);
      // Businesses don't get live questions (only individuals do)
    }
  );

  return (
    <BusinessLayout>
      <Switch>
        <Route path="/calls">
          {() => <BusinessCallsPage onCallAccepted={setActiveCallId} onDial={startCall} />}
        </Route>
        <Route path="/contacts">
          {() => <BusinessContactsPage onCall={startCall} />}
        </Route>
        <Route path="/history"  component={() => <Redirect to="/calls" />} />
        <Route path="/"         component={() => <Redirect to="/calls" />} />
      </Switch>

      {dialingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-2xl bg-card p-6 shadow-lg">
            <p className="text-lg font-bold">Ringing...</p>
          </div>
        </div>
      )}

      {activeCallId && (
        <BusinessCallWidget
          callId={activeCallId}
          onEnded={() => setActiveCallId(null)}
        />
      )}

      {incomingCall && (
        <BusinessIncomingCallModal
          incomingCall={incomingCall}
          onClose={() => setIncomingCall(null)}
        />
      )}
    </BusinessLayout>
  );
}
