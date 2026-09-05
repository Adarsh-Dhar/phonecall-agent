import { useCallback, useEffect, useState } from 'react';
import { CircleHelp, LoaderCircle, RefreshCw } from 'lucide-react';
import * as api from '@/lib/api';
import { QueryRow } from './QueryRow';

export function QueriesPanel({
  conversationId,
  contactId,
}: {
  conversationId: string | undefined;
  contactId: string | undefined;
}) {
  const [queries, setQueries] = useState<api.Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  // answer drafts keyed by query id
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  // Global inbox — questions can come from ANY business contact's
  // conversation, not just whichever one happens to be open right now, so
  // this intentionally does not scope by conversationId/contactId.
  const loadQueries = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch questions (knowledge gap questions) instead of general queries
      // since email escalation creates questions with isKnowledgeGap: true
      const data = await api.fetchQuestions();
      setQueries(data);
    } catch {
      // non-critical — panel is best-effort
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueries();
    // Poll so escalations that arrive while the app is open (e.g. a new
    // inbound email from a business) show up without a manual refresh.
    const interval = setInterval(() => void loadQueries(), 15000);
    return () => clearInterval(interval);
  }, [loadQueries]);

  const handleAnswer = async (query: api.Question) => {
    const answer = (drafts[query.id] ?? '').trim();
    if (!answer || submitting[query.id]) return;
    setSubmitting((s) => ({ ...s, [query.id]: true }));
    try {
      // Use answerQuestion endpoint for knowledge gap questions
      const updated = await api.answerQuestion(query.id, answer);
      setQueries((prev) => prev.map((q) => q.id === query.id ? updated : q));
      setDrafts((d) => { const n = { ...d }; delete n[query.id]; return n; });
    } catch { /* no-op */ } finally {
      setSubmitting((s) => ({ ...s, [query.id]: false }));
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      // Use dismissQuestion endpoint for knowledge gap questions
      const updated = await api.dismissQuestion(id);
      setQueries((prev) => prev.map((q) => q.id === id ? updated : q));
    } catch { /* no-op */ }
  };

  const pendingCount = queries.filter((q) => q.status === 'pending').length;
  const visible = filter === 'pending'
    ? queries.filter((q) => q.status === 'pending')
    : queries;

  return (
    <section className="rounded-[22px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#f0eaff] text-[#6b4fc8]">
            <CircleHelp size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Questions</h3>
            {pendingCount > 0 && (
              <p className="text-[10px] text-[#7a4fc8]">{pendingCount} need{pendingCount === 1 ? 's' : ''} your answer</p>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-label="Refresh questions"
          onClick={() => void loadQueries()}
          className="grid h-7 w-7 place-items-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mt-3 flex gap-1">
        {(['pending', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[.08em] transition-colors ${
              filter === f ? 'bg-[#6b4fc8] text-white' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
            }`}
          >
            {f === 'pending' ? 'Pending' : 'All'}
          </button>
        ))}
      </div>

      {/* Query list */}
      <div className="mt-3 space-y-3">
        {loading && queries.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <LoaderCircle size={14} className="animate-spin text-[hsl(var(--muted-foreground))]" />
          </div>
        ) : visible.length === 0 ? (
          <p className="py-3 text-center text-xs text-[hsl(var(--muted-foreground))]">
            {filter === 'pending' ? 'No pending questions — good to go.' : 'No questions yet.'}
          </p>
        ) : (
          visible.map((query) => (
            <QueryRow
              key={query.id}
              query={query}
              draft={drafts[query.id] ?? ''}
              submitting={!!submitting[query.id]}
              onDraftChange={(v) => setDrafts((d) => ({ ...d, [query.id]: v }))}
              onAnswer={() => void handleAnswer(query)}
              onDismiss={() => void handleDismiss(query.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}
