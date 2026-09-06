import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Route, Router as WouterRouter, Switch } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/hooks/use-toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { TestCallWidget } from '@/components/TestCallWidget';
import { IncomingCallModal } from '@/components/calls/IncomingCallModal';
import { useCallDueNotifications, type CallDueNotification } from '@/hooks/useCallDueNotifications';
import { usePresence } from '@/hooks/usePresence';
import { CallsPage } from '@/pages/CallsPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { ContactsPage } from '@/pages/ContactsPage';
import { ContactDetailPage } from '@/pages/ContactDetailPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { RolePage } from '@/pages/RolePage';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

const queryClient = new QueryClient();

/**
 * The backend redirects to "/" after OAuth.
 * - "/?setup=1"  → brand-new account → send to /role to pick a role
 * - Signed in + needsRoleSetup → also send to /role (e.g. page refresh mid-setup)
 * - Signed in + role already set → send to /contacts
 * - Not signed in → send to /login (preserving ?auth-error if present)
 */
function RootRedirect() {
  const { isSigned, loading, user } = useAuth();
  const search = window.location.search;
  const isSetup = new URLSearchParams(search).get('setup') === '1';

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  if (!isSigned) return <Redirect to={`/login${search}`} />;

  // New account coming straight from OAuth callback
  if (isSetup || user?.needsRoleSetup) return <Redirect to="/role" />;

  return <Redirect to="/contacts" />;
}

function AppRoutes() {
  const [dueCall, setDueCall] = useState<CallDueNotification | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ callId: string; callerName: string; taskContext?: { taskId: string; title: string; description: string | null } | null } | null>(null);
  const { user } = useAuth();

  useCallDueNotifications((notification) => {
    toast({
      title: 'Call due',
      description: `Time to call ${notification.contactName} about: ${notification.title}`,
    });
    setDueCall(notification);
  });

  // Only enable presence for service accounts to receive incoming calls
  usePresence(
    (event) => {
      if (user?.isService) {
        console.log('Incoming call received:', event);
        setIncomingCall({
          callId: event.callId,
          callerName: event.callerName,
          taskContext: event.taskContext,
        });
      }
    },
    (event) => {
      console.log('Call status update:', event);
      // Handle call status updates (ringing → in-progress → missed/declined)
      // This could update UI state or show notifications
    }
  );

  return (
    <>
      <Switch>
        <Route path="/login"    component={LoginPage} />
        <Route path="/signup"   component={SignupPage} />
        <Route path="/role"     component={RolePage} />
        <Route path="/calls"    component={() => <ProtectedRoute component={CallsPage} />} />
        <Route path="/history"  component={() => <ProtectedRoute component={HistoryPage} />} />
        <Route path="/contacts" component={() => <ProtectedRoute component={ContactsPage} />} />
        <Route path="/contacts/:id" component={() => <ProtectedRoute component={ContactDetailPage} />} />
        <Route path="/" component={RootRedirect} />
        <Route component={NotFound} />
      </Switch>

      {dueCall && (
        <TestCallWidget
          contactId={dueCall.contactId}
          taskId={dueCall.taskId}
          taskTitle={dueCall.title}
          onClose={() => setDueCall(null)}
        />
      )}

      {user?.isService && incomingCall && (
        <IncomingCallModal
          incomingCall={incomingCall}
          onClose={() => setIncomingCall(null)}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter>
              <AppRoutes />
            </WouterRouter>
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
