import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Route, Router as WouterRouter, Switch } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { RolePage } from '@/pages/RolePage';
import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';

const IndividualApp = lazy(() => import('@/individual/IndividualApp'));
const BusinessApp = lazy(() => import('@/business/BusinessApp'));

const queryClient = new QueryClient();

function Spinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
    </div>
  );
}

/**
 * The backend redirects to "/" after OAuth.
 * - "/?setup=1"  → brand-new account → send to /role to pick a role
 * - Signed in + needsRoleSetup → also send to /role (e.g. page refresh mid-setup)
 * - Signed in + role already set → send to /contacts (individual) or /calls (business)
 * - Not signed in → send to /login (preserving ?auth-error if present)
 */
function RootRedirect() {
  const { isSigned, loading, user } = useAuth();
  const search = window.location.search;
  const isSetup = new URLSearchParams(search).get('setup') === '1';

  if (loading) {
    return <Spinner />;
  }

  if (!isSigned) return <Redirect to={`/login${search}`} />;

  // New account coming straight from OAuth callback
  if (isSetup || user?.needsRoleSetup) return <Redirect to="/role" />;

  return <Redirect to="/" />;
}

function SignedInApp() {
  const { isSigned, loading, user } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  if (!isSigned) {
    return <Redirect to="/login" />;
  }

  return (
    <Suspense fallback={<Spinner />}>
      {user?.isService ? <BusinessApp /> : <IndividualApp />}
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter>
              <Switch>
                <Route path="/login"    component={LoginPage} />
                <Route path="/signup"   component={SignupPage} />
                <Route path="/role"     component={RolePage} />
                <Route path="/"         component={RootRedirect} />
                <Route component={SignedInApp} />
              </Switch>
            </WouterRouter>
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
