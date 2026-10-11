import { useEffect, useState } from 'react';
import { AppLayout } from '@/individual/components/layout';
import { useSharedState } from '@/hooks/useSharedState';
import * as api from '@/lib/api';

export function HealthPage() {
  const { prefsOpen, setPrefsOpen, currentDate } = useSharedState();
  const [stats, setStats] = useState<api.NebiusStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      const data = await api.fetchNebiusHealth();
      setStats(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStats();
    const interval = setInterval(() => void loadStats(), 5000);
    return () => clearInterval(interval);
  }, []);

  const hasError = (stats?.fallbackCount ?? 0) > 0 || stats?.lastError !== null;
  const lastErrorRecent = stats?.lastErrorAt
    ? new Date(stats.lastErrorAt).getTime() > Date.now() - 60000
    : false;

  return (
    <AppLayout title="Agent Health" onPrefsOpen={() => setPrefsOpen(true)} currentDate={currentDate} prefsOpen={prefsOpen} onPrefsClose={() => setPrefsOpen(false)}>
      <div className="mx-auto max-w-3xl px-5 py-8 md:px-10 md:py-12">
        {hasError && (
          <div className="mb-6 rounded-xl border-2 border-[#b44343] bg-[#fde8e8] px-4 py-3">
            <p className="text-sm font-bold text-[#b44343]">
              {(stats?.fallbackCount ?? 0) > 0 && 'Fallback model in use. '}
              {lastErrorRecent && 'Recent error detected.'}
            </p>
          </div>
        )}

        {loading && !stats ? (
          <div className="text-center text-sm text-muted-foreground">Loading health stats...</div>
        ) : error && !stats ? (
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-sm text-[#b44343]">{error}</p>
          </div>
        ) : stats ? (
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[.18em] text-muted-foreground">Model Configuration</p>
              <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Requested Model</p>
                  <p className="font-bold">{stats.requestedModel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Model Used</p>
                  <p className="font-bold">{stats.lastModelUsed || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fallback Model</p>
                  <p className="font-bold">{stats.fallbackModel}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="font-mono text-[9px] uppercase tracking-[.18em] text-muted-foreground">Request Statistics</p>
              <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Requests</p>
                  <p className="font-bold">{stats.requests}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Successes</p>
                  <p className="font-bold text-[#3f8274]">{stats.successes}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Failures</p>
                  <p className="font-bold text-[#b44343]">{stats.failures}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Retries</p>
                  <p className="font-bold">{stats.retries}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fallback Count</p>
                  <p className={`font-bold ${(stats.fallbackCount ?? 0) > 0 ? 'text-[#e85d04]' : ''}`}>{stats.fallbackCount ?? 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Truncated</p>
                  <p className="font-bold">{stats.truncated}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="font-mono text-[9px] uppercase tracking-[.18em] text-muted-foreground">Performance</p>
              <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Average Latency</p>
                  <p className="font-bold">{stats.avgLatencyMs ? `${stats.avgLatencyMs}ms` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Prompt Tokens</p>
                  <p className="font-bold">{stats.promptTokens.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Completion Tokens</p>
                  <p className="font-bold">{stats.completionTokens.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {stats.lastError && (
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[.18em] text-muted-foreground">Last Error</p>
                <div className="mt-2 rounded-lg bg-[#fde8e8] p-3 text-sm">
                  <p className="font-mono text-[#b44343]">{stats.lastError}</p>
                  {stats.lastErrorAt && (
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(stats.lastErrorAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
