import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Route, Router as WouterRouter, Switch } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/hooks/use-toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { TestCallWidget } from '@/components/TestCallWidget';
import { useCallDueNotifications, type CallDueNotification } from '@/hooks/useCallDueNotifications';
import { CallsPage } from '@/pages/CallsPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { ContactsPage } from '@/pages/ContactsPage';
import { ContactDetailPage } from '@/pages/ContactDetailPage';

const queryClient = new QueryClient();

export default function App() {
  // Set by the call scheduler ("agent") on the server when a task's due
  // date arrives — see services/callScheduler.ts. Mounted at this top
  // level (not inside a page) so a due call can pop up no matter which
  // page is currently open.
  const [dueCall, setDueCall] = useState<CallDueNotification | null>(null);

  useCallDueNotifications((notification) => {
    toast({
      title: 'Call due',
      description: `Time to call ${notification.contactName} about: ${notification.title}`,
    });
    setDueCall(notification);
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <TooltipProvider>
          <WouterRouter>
            <Switch>
              <Route path="/calls" component={CallsPage} />
              <Route path="/history" component={HistoryPage} />
              <Route path="/contacts" component={ContactsPage} />
              <Route path="/contacts/:id" component={ContactDetailPage} />
              <Route path="/" component={() => <Redirect to="/contacts" />} />
              <Route component={NotFound} />
            </Switch>

          </WouterRouter>
          <Toaster />
          {dueCall && (
            <TestCallWidget
              contactId={dueCall.contactId}
              taskId={dueCall.taskId}
              taskTitle={dueCall.title}
              onClose={() => setDueCall(null)}
            />
          )}
        </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
