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
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

const queryClient = new QueryClient();

/**
 * The backend redirects to "/" after OAuth (success and failure).
 * - Success → user is authenticated → send to /contacts
 * - Failure → ?auth-error=true → send to /login preserving the param
 * - Unauthenticated with no error → send to /login
 */
function RootRedirect() {
  const { isSigned, loading } = useAuth();
  const search = window.location.search;

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  if (isSigned) return <Redirect to="/contacts" />;
  return <Redirect to={`/login${search}`} />;
}

function AppRoutes() {
  const [dueCall, setDueCall] = useState<CallDueNotification | null>(null);

  useCallDueNotifications((notification) => {
    toast({
      title: 'Call due',
      description: `Time to call ${notification.contactName} about: ${notification.title}`,
    });
    setDueCall(notification);
  });

  return (
    <>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={SignupPage} />
        <Route path="/calls" component={() => <ProtectedRoute component={CallsPage} />} />
        <Route path="/history" component={() => <ProtectedRoute component={HistoryPage} />} />
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
