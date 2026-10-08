import { ArrowUpRight, Check, CircleHelp } from 'lucide-react';
import { Link } from 'wouter';
import type * as api from '@/lib/api';

export function RecentTasksWidget({ history }: { history: api.History[] }) {
  return (
    <section className="rounded-[22px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Your paper trail</p>
          <h3 className="mt-2 text-lg font-bold tracking-tight">Recent threads</h3>
        </div>
        <Link href="/history" className="text-xs font-bold text-[#3159c4] hover:underline" data-testid="button-view-history">
          View all <ArrowUpRight className="ml-1 inline" size={13} />
        </Link>
      </div>
      <div className="mt-4 divide-y divide-[hsl(var(--border))]">
        {history.slice(0, 3).length === 0 ? (
          <p className="py-4 text-xs text-[hsl(var(--muted-foreground))]">No tasks yet — they'll show up here after your first conversation.</p>
        ) : history.slice(0, 3).map((item) => (
          <Link
            href="/history"
            key={item.id}
            data-testid={`button-history-${item.id}`}
            className="flex w-full items-center gap-3 py-3 text-left transition-colors first:pt-0 last:pb-0 hover:bg-[#faf8f2]"
          >
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${item.status === 'Needs you' ? 'bg-[#ffe5dd] text-[#bd5d47]' : 'bg-[#e1efe9] text-[#4a8978]'}`}>
              {item.status === 'Needs you' ? <CircleHelp size={15} /> : <Check size={15} />}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-xs">{item.title}</strong>
              <small className="block truncate text-[10px] text-[hsl(var(--muted-foreground))]">{item.detail}</small>
            </span>
            <span className="shrink-0 text-[10px] text-[hsl(var(--muted-foreground))]">{item.time}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
