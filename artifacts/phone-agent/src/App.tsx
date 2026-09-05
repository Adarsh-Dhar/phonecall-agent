import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Route, Router as WouterRouter, Switch } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { TestCallWidget } from '@/components/TestCallWidget';
import { CallsPage } from '@/pages/CallsPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { ContactsPage } from '@/pages/ContactsPage';
import { ContactDetailPage } from '@/pages/ContactDetailPage';

const queryClient = new QueryClient();

export default function App() {
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
        </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
