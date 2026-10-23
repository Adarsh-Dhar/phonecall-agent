import { describe, it, expect } from 'vitest';
import {
  isCallEvent,
  isStillUpcoming,
  matchContact,
  normalize,
  type CalendarEventLike,
  type ContactLike,
} from '../calendarEventParser';
import { computeAutoDialRetry, computeNextAttempt } from '../schedulerPolicy';

const ev = (over: Partial<CalendarEventLike> = {}): CalendarEventLike => ({
  id: 'evt1',
  summary: 'Call Sharma Clinic',
  description: null,
  start: { dateTime: '2026-10-24T10:30:00+05:30' },
  end: { dateTime: '2026-10-24T11:00:00+05:30' },
  status: 'confirmed',
  creatorSelf: true,
  organizerSelf: true,
  ...over,
});

const contacts: ContactLike[] = [
  { id: 'c1', name: 'Dr. Anil Mehta', business: 'Mehta Dental', linkedAccountId: 'b1' },
  { id: 'c2', name: 'Sharma Clinic', business: 'Sharma Clinic', linkedAccountId: 'b2' },
  { id: 'c3', name: 'Ravi Plumber', business: null, linkedAccountId: null },
  { id: 'c4', name: 'Café Léon', business: 'Léon Bistro', linkedAccountId: 'b4' },
];

describe('isCallEvent', () => {
  it('accepts a timed, self-organised event with a call word', () => {
    expect(isCallEvent(ev())).toBe(true);
    expect(isCallEvent(ev({ summary: 'Phone call – Mehta Dental' }))).toBe(true);
    expect(isCallEvent(ev({ summary: 'Callback: Ravi' }))).toBe(true);
    expect(isCallEvent(ev({ summary: 'ring the plumber' }))).toBe(true);
  });

  it('accepts a #call tag in the description', () => {
    expect(isCallEvent(ev({ summary: 'Dentist follow-up', description: 'confirm slot #call' }))).toBe(true);
  });

  it('rejects events without a call word', () => {
    expect(isCallEvent(ev({ summary: 'Lunch with Sharma Clinic' }))).toBe(false);
    expect(isCallEvent(ev({ summary: 'Recall policy review' }))).toBe(false); // "recall" is not "call"
  });

  it('rejects all-day events (no exact time)', () => {
    expect(isCallEvent(ev({ start: { date: '2026-10-24' } }))).toBe(false);
  });

  it('rejects cancelled events', () => {
    expect(isCallEvent(ev({ status: 'cancelled' }))).toBe(false);
  });

  it('honours #nocall', () => {
    expect(isCallEvent(ev({ description: 'just a reminder #nocall' }))).toBe(false);
  });

  it('refuses events the user did not create or organise (outside invites)', () => {
    expect(isCallEvent(ev({ creatorSelf: false, organizerSelf: false }))).toBe(false);
    expect(isCallEvent(ev({ creatorSelf: false, organizerSelf: true }))).toBe(true);
  });
});

describe('matchContact', () => {
  it('matches a full contact name in the title', () => {
    const r = matchContact(ev(), contacts);
    expect(r.ok && r.contact.id).toBe('c2');
  });

  it('matches by business name', () => {
    const r = matchContact(ev({ summary: 'Call Mehta Dental about crown' }), contacts);
    expect(r.ok && r.contact.id).toBe('c1');
  });

  it('matches a partial name when every subject word belongs to one contact', () => {
    const r = matchContact(ev({ summary: 'Call Dr Mehta' }), contacts);
    expect(r.ok && r.contact.id).toBe('c1');
  });

  it('ignores accents and punctuation', () => {
    const r = matchContact(ev({ summary: 'phone call - cafe leon' }), contacts);
    expect(r.ok && r.contact.id).toBe('c4');
  });

  it('reads the "Contact:" line the app writes into event descriptions', () => {
    const r = matchContact(ev({ summary: 'Call about invoice', description: 'Contact: Ravi Plumber ()' }), contacts);
    expect(r.ok && r.contact.id).toBe('c3');
  });

  it('returns no_match when nothing in the title names a contact', () => {
    const r = matchContact(ev({ summary: 'Call the tax office' }), contacts);
    expect(r).toEqual({ ok: false, reason: 'no_match' });
  });

  it('returns ambiguous instead of guessing between equally good contacts', () => {
    const twins: ContactLike[] = [
      { id: 'a', name: 'City Clinic', business: null, linkedAccountId: 'x' },
      { id: 'b', name: 'City Clinic', business: null, linkedAccountId: 'y' },
    ];
    const r = matchContact(ev({ summary: 'Call City Clinic' }), twins);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('ambiguous');
  });

  it('prefers the longer/more specific name match', () => {
    const list: ContactLike[] = [
      { id: 'short', name: 'Mehta', business: null, linkedAccountId: 'x' },
      { id: 'long', name: 'Mehta Dental', business: null, linkedAccountId: 'y' },
    ];
    const r = matchContact(ev({ summary: 'Call Mehta Dental' }), list);
    expect(r.ok && r.contact.id).toBe('long');
  });

  it('still matches contacts that cannot be dialled in-app (scheduler falls back to a notification)', () => {
    const r = matchContact(ev({ summary: 'Call Ravi Plumber' }), contacts);
    expect(r.ok && r.contact.linkedAccountId).toBe(null);
  });
});

describe('isStillUpcoming', () => {
  const now = new Date('2026-10-24T05:00:00Z');
  it('keeps future events and events inside the grace window', () => {
    expect(isStillUpcoming(new Date('2026-10-24T05:30:00Z'), now, 10 * 60_000)).toBe(true);
    expect(isStillUpcoming(new Date('2026-10-24T04:55:00Z'), now, 10 * 60_000)).toBe(true);
  });
  it('drops older events (first full sync must not call history)', () => {
    expect(isStillUpcoming(new Date('2026-10-24T04:00:00Z'), now, 10 * 60_000)).toBe(false);
  });
});

describe('normalize', () => {
  it('lowercases, strips accents and punctuation', () => {
    expect(normalize('  Café  Léon!! ')).toBe('cafe leon');
  });
});

describe('computeAutoDialRetry', () => {
  const now = new Date('2026-10-24T05:00:00Z');
  it('retries soon: +2 min, then +10 min, then the normal backoff', () => {
    expect(computeAutoDialRetry(1, now).getTime() - now.getTime()).toBe(2 * 60_000);
    expect(computeAutoDialRetry(2, now).getTime() - now.getTime()).toBe(10 * 60_000);
    expect(computeAutoDialRetry(3, now).getTime()).toBe(computeNextAttempt(3, now).getTime());
  });
});
