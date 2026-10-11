import { CalendarOff } from 'lucide-react';
import type { ContactClosure, UpcomingClosure } from '@/lib/api/contacts';

const KIND_LABEL = { holiday: 'Holiday', out_of_service: 'Out of service', emergency: 'Emergency' } as const;

const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/** Shows when a business is closed now, and its next few planned closures. Times are in your own time zone. */
export function ContactClosureBanner({
  closure,
  upcoming,
}: {
  closure: ContactClosure | null;
  upcoming: UpcomingClosure[];
}) {
  if (!closure && upcoming.length === 0) return null;

  return (
    <div className="mt-5 space-y-3">
      {closure && (
        <div className="rounded-[22px] border border-[#e26951]/40 bg-[#fff5f2] p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#fde3dc] text-[#bf4720]">
              <CalendarOff size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight">
                Closed now{closure.label ? `: ${closure.label}` : ''}{' '}
                <span className="text-xs font-medium text-muted-foreground">({KIND_LABEL[closure.kind]})</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {closure.reopensAt ? `Reopens ${fmt(closure.reopensAt)}` : 'No reopening time given yet'}
              </p>
              {closure.message && <p className="mt-2 text-sm">{closure.message}</p>}
              <p className="mt-2 text-[11px] text-muted-foreground">
                Scheduled calls are paused until then.
                {closure.blockCalls ? ' This business is not taking calls dialed by hand either.' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="rounded-[22px] border border-card-border bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Upcoming closures</p>
          <ul className="mt-2 space-y-1 text-sm">
            {upcoming.map((c) => (
              <li key={c.id}>
                <span className="font-medium">{c.label || KIND_LABEL[c.kind]}</span>{' '}
                <span className="text-xs text-muted-foreground">
                  {c.endsAt ? `${c.allDay ? fmtDay(c.startsAt) : fmt(c.startsAt)} to ${fmt(c.endsAt)}` : `from ${fmt(c.startsAt)}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
