import { Redirect, Route, Switch } from 'wouter';
import { BusinessLayout } from './layout/BusinessLayout';
import { BusinessCallsPage } from './pages/BusinessCallsPage';
import { BusinessContactsPage } from './pages/BusinessContactsPage';
import { BusinessIncomingCallModal } from './components/BusinessIncomingCallModal';
import { usePresence } from '@/hooks/usePresence';
import { useState } from 'react';

export default function BusinessApp() {
  const [incomingCall, setIncomingCall] = useState<{ callId: string; callerName: string; taskContext?: any } | null>(null);

  // Enable presence for business accounts to get incoming calls
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
    },
    (event) => {
      console.log('Live question received:', event);
      // Businesses don't get live questions (only individuals do)
    }
  );

  return (
    <BusinessLayout>
      <Switch>
        <Route path="/calls"    component={BusinessCallsPage} />
        <Route path="/contacts" component={BusinessContactsPage} />
        <Route path="/history"  component={() => <Redirect to="/calls" />} />
        <Route path="/"         component={() => <Redirect to="/calls" />} />
      </Switch>

      {incomingCall && (
        <BusinessIncomingCallModal
          incomingCall={incomingCall}
          onClose={() => setIncomingCall(null)}
        />
      )}
    </BusinessLayout>
  );
}
