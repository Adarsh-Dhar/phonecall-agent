import { type ComponentType } from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

/**
 * Wraps a page component. On mount the AuthProvider fetches /auth/me once.
 * - While that fetch is in flight → spinner
 * - isSigned === false after the fetch → redirect to /login
 * - isSigned === true → render the page
 */
export function ProtectedRoute({ component: Component }: { component: ComponentType }) {
  const { isSigned, loading } = useAuth();

  console.log('[ProtectedRoute] loading:', loading, '| isSigned:', isSigned);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  if (!isSigned) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}
