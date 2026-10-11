import { useCallback, useEffect, useState } from 'react';
import { CircleHelp, LoaderCircle, RefreshCw } from 'lucide-react';
import * as api from '@/lib/api';
import { QueryRow } from '@/individual/components/questions/QueryRow';
import { AppLayout } from '@/individual/components/layout';
import { useSharedState } from '@/hooks/useSharedState';

export function QueriesPage() {
  const { prefsOpen, setPrefsOpen, currentDate } = useSharedState();
  const [queries, setQueries] = useState<api.Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const loadQueries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchQuestions();
      setQueries(data);
    } catch {
      // non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueries();
    const interval = setInterval(() => void loadQueries(), 15000);
    return () => clearInterval(interval);
  }, [loadQueries]);

  const handleAnswer = async (query: api.Question) => {
    const answer = (drafts[query.id] ?? '').trim();
    if (!answer || submitting[query.id]) return;
    setSubmitting((s) => ({ ...s, [query.id]: true }));
    try {
      const updated = await api.answerQuestion(query.id, answer);
      setQueries((prev) => prev.map((q) => q.id === query.id ? updated : q));
      setDrafts((d) => { const n = { ...d }; delete n[query.id]; return n; });
    } catch { /* no-op */ } finally {
      setSubmitting((s) => ({ ...s, [query.id]: false }));
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      const updated = await api.dismissQuestion(id);
      setQueries((prev) => prev.map((q) => q.id === id ? updated : q));
    } catch { /* no-op */ }
  };

  const pendingCount = queries.filter((q) => q.status === 'pending' || q.status === 'expired').length;
  const visible = filter === 'pending'
    ? queries.filter((q) => q.status === 'pending' || q.status === 'expired')
    : queries;

  return (
    <AppLayout
      title="Questions"
      onPrefsOpen={() => setPrefsOpen(true)}
      currentDate={currentDate}
      prefsOpen={prefsOpen}
      onPrefsClose={() => setPrefsOpen(false)}
    >
      <div className="mx-auto max-w-[980px] px-5 py-8 md:px-10 md:py-12">
        {/* Page header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#e26951]">Questions inbox</p>
            <h1 className="mt-2 font-serif text-5xl tracking-[-.04em]">Questions</h1>
          </div>
          <button
            type="button"
            aria-label="Refresh questions"
            onClick={() => void loadQueries()}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex gap-2">
          {(['pending', 'all'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[.08em] transition-colors ${
                filter === f ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {f === 'pending' ? `Pending (${pendingCount})` : 'All'}
            </button>
          ))}
        </div>

        {/* Query list */}
        {loading && queries.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <LoaderCircle size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
              <CircleHelp size={24} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {filter === 'pending' ? 'No pending questions — good to go.' : 'No questions yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((query) => (
              <QueryRow
                key={query.id}
                query={query}
                draft={drafts[query.id] ?? ''}
                submitting={!!submitting[query.id]}
                onDraftChange={(v) => setDrafts((d) => ({ ...d, [query.id]: v }))}
                onAnswer={() => void handleAnswer(query)}
                onDismiss={() => void handleDismiss(query.id)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
