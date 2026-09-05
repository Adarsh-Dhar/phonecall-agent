import { LoaderCircle, Send, X } from 'lucide-react';
import type * as api from '@/lib/api';

export function QueryRow({
  query,
  draft,
  submitting,
  onDraftChange,
  onAnswer,
  onDismiss,
}: {
  query: api.Question;
  draft: string;
  submitting: boolean;
  onDraftChange: (v: string) => void;
  onAnswer: () => void;
  onDismiss: () => void;
}) {
  const isPending = query.status === 'pending';

  if (!isPending) {
    // Collapsed answered/dismissed view
    return (
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 px-4 py-3 opacity-60">
        {query.contact && (
          <p className="text-[9px] font-bold uppercase tracking-[.08em] text-muted-foreground">
            {query.contact.name}
          </p>
        )}
        <p className="text-xs font-medium text-[hsl(var(--foreground))]">{query.question}</p>
        {query.answer && (
          <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">↳ {query.answer}</p>
        )}
        <span className="mt-1 inline-block text-[9px] font-bold uppercase tracking-[.1em] text-[hsl(var(--muted-foreground))]">
          {query.status}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#d4c4ff] bg-[#f8f5ff] px-4 py-3">
      {query.contact && (
        <p className="text-[9px] font-bold uppercase tracking-[.08em] text-[#8a72c4]">
          {query.contact.name}
        </p>
      )}
      <p className="text-xs font-semibold text-[#3d2a72]">{query.question}</p>
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onAnswer(); }}
          placeholder="Your answer…"
          className="flex-1 rounded-lg border border-[#c4b0f0] bg-white px-3 py-1.5 text-xs outline-none focus:border-[#6b4fc8] focus:ring-2 focus:ring-[#6b4fc8]/10"
        />
        <button
          type="button"
          onClick={onAnswer}
          disabled={!draft.trim() || submitting}
          aria-label="Send answer"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#6b4fc8] text-white hover:bg-[#5a3fb8] disabled:opacity-40"
        >
          {submitting ? <LoaderCircle size={12} className="animate-spin" /> : <Send size={12} />}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss question"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
