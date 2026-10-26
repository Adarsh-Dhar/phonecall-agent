import { useEffect, useState } from 'react';
import { Redirect, Route, Switch } from 'wouter';
import { CallsPage } from '@/individual/pages/CallsPage';
import { HistoryPage } from '@/individual/pages/HistoryPage';
import { ContactsPage } from '@/individual/pages/ContactsPage';
import { ContactDetailPage } from '@/individual/pages/ContactDetailPage';
import { OwnerInfoPage } from '@/individual/pages/OwnerInfoPage';
import { TestCallWidget } from '@/individual/components/TestCallWidget';
import { IncomingCallModal } from '@/individual/components/IncomingCallModal';
import { LiveQuestionModal } from '@/individual/components/LiveQuestionModal';
import { CallObserverWidget } from '@/individual/components/CallObserverWidget';
import { useCallDueNotifications, type CallDueNotification, type TaskDueNotification } from '@/individual/hooks/useCallDueNotifications';
import { usePresence } from '@/hooks/usePresence';
import { toast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { publishCallStatus } from '@/lib/callStatusBus';

export default function IndividualApp() {
  const [dueCall, setDueCall] = useState<CallDueNotification | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ callId: string; callerName: string; taskContext?: { taskId: string; title: string; description: string | null } | null } | null>(null);
  const [liveQuestion, setLiveQuestion] = useState<{ queryId: string; callId: string; question: string; urgent: boolean } | null>(null);
  // The agent asked to patch the owner into a live call. The widget joins the call and shows the request.
  const [handoffCall, setHandoffCall] = useState<{ callId: string; contactName: string; handoff: { id: string; reason?: string; summary?: string } } | null>(null);
  const [location, setLocation] = useLocation();

  // Opened from the push notification: /calls?handoff=<id>&call=<id>
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const handoffId = p.get('handoff');
    const callId = p.get('call');
    if (handoffId && callId) {
      setHandoffCall({ callId, contactName: 'your call', handoff: { id: handoffId, reason: 'Your agent asked you to join' } });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

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
    }),
    (m) => {
      const titles: Record<string, string> = {
        appointment: 'Appointment coming up',
        bring: 'Bring documents',
        pay: 'Payment due',
        submit: 'Submission due',
        reminder: 'Reminder',
        follow_up: 'Follow-up due',
        other: 'Task due',
      };
      toast({
        title: titles[m.kind] || titles.other,
        description: m.title,
      });
    }
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
      // Publish to the bus so observer widgets can react
      publishCallStatus(event.callId, event.status);
    },
    (event) => {
      console.log('Live question received:', event);
      setLiveQuestion({
        queryId: event.queryId,
        callId: event.callId,
        question: event.question,
        urgent: event.urgent,
      });
    },
    (event) => {
      console.log('Post-call question received:', event);
      toast({
        title: 'Your call agent has a question',
        description: event.question,
      });
      setLocation('/my-info');
    },
    (event) => {
      // The agent placed (scheduled call) or answered (auto-answer) a call by itself.
      toast({
        title: event.direction === 'outbound' ? 'Your agent is calling' : 'Your agent answered a call',
        description:
          event.direction === 'outbound'
            ? `${event.contactName ?? 'A contact'}${event.title ? ` — ${event.title}` : ''}. Open Calls to watch the transcript.`
            : `${event.contactName ?? 'A business'} called. Open Calls to watch the transcript.`,
      });
    },
    (event) => {
      setHandoffCall({
        callId: event.callId,
        contactName: event.contactName || 'the business',
        handoff: { id: event.handoffId, reason: event.reason, summary: event.summary },
      });
    },
    (event) => {
      // Agent completed a call
      toast({
        title: 'Agent call completed',
        description: `Your agent finished a call with ${event.contactName || 'a business'}. Outcome: ${event.outcome || 'unknown'}`,
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
        <Route path="/queries"  component={() => <Redirect to="/my-info" />} />
        <Route path="/my-info"  component={OwnerInfoPage} />
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
          onClose={(declinedCallId) => {
            setIncomingCall(null);
            // If the declined call matches the observer widget, close it
            if (declinedCallId && handoffCall?.callId === declinedCallId) {
              setHandoffCall(null);
            }
          }}
        />
      )}

      {liveQuestion && (
        <LiveQuestionModal
          key={liveQuestion.queryId}
          liveQuestion={liveQuestion}
          onClose={() => setLiveQuestion(null)}
        />
      )}

      {handoffCall && (
        <CallObserverWidget
          key={handoffCall.handoff.id}
          callId={handoffCall.callId}
          businessName={handoffCall.contactName}
          mode="outgoing"
          incomingHandoff={handoffCall.handoff}
          onClose={() => setHandoffCall(null)}
        />
      )}
    </>
  );
}
