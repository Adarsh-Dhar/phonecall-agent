import type { BusinessClosure, ClosureKind } from '../../api';

export const KIND_LABEL: Record<ClosureKind, string> = {
  holiday: 'Holiday',
  out_of_service: 'Out of service',
  emergency: 'Emergency',
};

function safeTz(tz: string | null | undefined): string | undefined {
  if (!tz) return undefined;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return undefined;
  }
}

export function formatDateTime(iso: string, tz?: string | null): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: safeTz(tz),
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

export function formatDate(iso: string, tz?: string | null): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: safeTz(tz),
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

/** Date (YYYY-MM-DD) and time (HH:mm) of an instant as seen in tz. */
export function toLocalParts(iso: string, tz?: string | null): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTz(tz),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
}

export function describeRange(c: BusinessClosure, tz?: string | null): string {
  if (c.allDay && c.endsAt) {
    const start = formatDate(c.startsAt, tz);
    // endsAt is the start of the day after the last closed day
    const end = formatDate(new Date(new Date(c.endsAt).getTime() - 1).toISOString(), tz);
    return start === end ? start : `${start} to ${end}`;
  }
  if (!c.endsAt) return `From ${formatDateTime(c.startsAt, tz)} until you reopen`;
  return `${formatDateTime(c.startsAt, tz)} to ${formatDateTime(c.endsAt, tz)}`;
}
