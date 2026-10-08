import { useState } from 'react';
import { Redirect, Route, Switch } from 'wouter';
import { CallsPage } from '@/individual/pages/CallsPage';
import { HistoryPage } from '@/individual/pages/HistoryPage';
import { ContactsPage } from '@/individual/pages/ContactsPage';
import { ContactDetailPage } from '@/individual/pages/ContactDetailPage';
import { TestCallWidget } from '@/individual/components/TestCallWidget';
import { IncomingCallModal } from '@/individual/components/IncomingCallModal';
import { LiveQuestionModal } from '@/individual/components/LiveQuestionModal';
import { useCallDueNotifications, type CallDueNotification } from '@/individual/hooks/useCallDueNotifications';
import { usePresence } from '@/hooks/usePresence';
import { toast } from '@/hooks/use-toast';

export default function IndividualApp() {
  const [dueCall, setDueCall] = useState<CallDueNotification | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ callId: string; callerName: string; taskContext?: { taskId: string; title: string; description: string | null } | null } | null>(null);
  const [liveQuestion, setLiveQuestion] = useState<{ queryId: string; callId: string; question: string; urgent: boolean } | null>(null);

  useCallDueNotifications(
    (notification) => {
      const attemptText = notification.attempt && notification.maxAttempts
        ? ` (attempt ${notification.attempt} of ${notification.maxAttempts})`
        : '';
      toast({
        title: 'Call due',
        description: `Time to call ${notification.contactName} about: ${notification.title}${attemptText}`,
      });
      setDueCall(notification);
    },
    (n) => toast({
      title: 'Could not reach contact',
      description: `Couldn't reach ${n.contactName} about "${n.title}" after ${n.attempts} attempts. Open the task to call manually.`,
    })
  );

  // Enable presence for individual users to get call status updates and live questions
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
      // Handle call status updates (ringing → in-progress → missed/declined)
    },
    (event) => {
      console.log('Live question received:', event);
      setLiveQuestion({
        queryId: event.queryId,
        callId: event.callId,
        question: event.question,
        urgent: event.urgent,
      });
    }
  );

  return (
    <>
      <Switch>
        <Route path="/calls"    component={CallsPage} />
        <Route path="/history"  component={HistoryPage} />
        <Route path="/contacts" component={ContactsPage} />
        <Route path="/contacts/:id" component={ContactDetailPage} />
        <Route path="/"         component={() => <Redirect to="/contacts" />} />
      </Switch>

      {dueCall && (
        <TestCallWidget
          contactId={dueCall.contactId}
          taskId={dueCall.taskId}
          taskTitle={dueCall.title}
          onClose={() => setDueCall(null)}
        />
      )}

      {incomingCall && (
        <IncomingCallModal
          incomingCall={incomingCall}
          onClose={() => setIncomingCall(null)}
        />
      )}

      {liveQuestion && (
        <LiveQuestionModal
          key={liveQuestion.queryId}
          liveQuestion={liveQuestion}
          onClose={() => setLiveQuestion(null)}
        />
      )}
    </>
  );
}
