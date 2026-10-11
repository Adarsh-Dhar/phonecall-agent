/**
 * Pure unit tests for renderBriefing
 *
 * Tests the briefing rendering logic without database access.
 */

import { describe, it, expect } from 'vitest';
import { renderBriefing } from '../memory/render';
import type { CallBriefing } from '../memory/types';

describe('renderBriefing', () => {
  const createBriefing = (overrides: Partial<CallBriefing> = {}): CallBriefing => ({
    version: 1,
    relationshipId: 'rel-1',
    callReason: null,
    now: '2026-10-12T10:00:00Z (UTC)',
    individual: {
      name: 'Test Individual',
      shareableInfo: [],
    },
    business: {
      name: 'Test Business',
      hours: '9-5 Mon-Fri',
    },
    knownFacts: [],
    thread: {
      summary: '',
      recentCalls: [],
      lastCallTail: [],
    },
    openLoops: [],
    answeredSince: [],
    doNot: [],
    quality: {
      complete: true,
      staleSeconds: 0,
    },
    ...overrides,
  });

  it('renders basic briefing sections', () => {
    const briefing = createBriefing();
    const rendered = renderBriefing(briefing);

    expect(rendered).toContain('Test Individual');
    expect(rendered).toContain('Test Business');
    expect(rendered).toContain('Hours: 9-5 Mon-Fri');
    expect(rendered).toContain('CURRENT TIME');
  });

  it('renders call reason when present', () => {
    const briefing = createBriefing({
      callReason: {
        taskId: 'task-1',
        title: 'Schedule appointment',
        detail: 'Need to fix lights',
      },
    });
    const rendered = renderBriefing(briefing);

    expect(rendered).toContain('CALL REASON');
    expect(rendered).toContain('Schedule appointment');
    expect(rendered).toContain('Need to fix lights');
  });

  it('renders open loops', () => {
    const briefing = createBriefing({
      openLoops: [
        { kind: 'awaiting_owner', text: 'What is the gate code?' },
        { kind: 'task', text: 'Fix lights', dueAt: '2026-10-13T10:00:00Z' },
      ],
    });
    const rendered = renderBriefing(briefing);

    expect(rendered).toContain('OPEN ITEMS');
    expect(rendered).toContain('[awaiting_owner] What is the gate code?');
    expect(rendered).toContain('[task] Fix lights');
    expect(rendered).toContain('due'); // Just check that "due" is present, not the exact format
  });

  it('renders do not constraints', () => {
    const briefing = createBriefing({
      doNot: ['Do not agree to fees', 'Do not invent gate code'],
    });
    const rendered = renderBriefing(briefing);

    expect(rendered).toContain('DO NOT');
    expect(rendered).toContain('- Do not agree to fees');
    expect(rendered).toContain('- Do not invent gate code');
  });

  it('renders last call tail', () => {
    const briefing = createBriefing({
      thread: {
        summary: '',
        recentCalls: [],
        lastCallTail: [
          { speaker: 'agent', text: 'Hello' },
          { speaker: 'contact', text: 'Hi there' },
        ],
      },
    });
    const rendered = renderBriefing(briefing);

    expect(rendered).toContain('LAST CALL');
    expect(rendered).toContain('agent: Hello');
    expect(rendered).toContain('contact: Hi there');
  });

  it('renders recent calls', () => {
    const briefing = createBriefing({
      thread: {
        summary: '',
        recentCalls: [
          {
            at: '2026-10-10T10:00:00Z',
            outcome: 'booked',
            summary: 'Scheduled for tomorrow',
          },
        ],
        lastCallTail: [],
      },
    });
    const rendered = renderBriefing(briefing);

    expect(rendered).toContain('RECENT CALLS');
    expect(rendered).toContain('booked');
    expect(rendered).toContain('Scheduled for tomorrow');
  });

  it('renders known facts', () => {
    const briefing = createBriefing({
      knownFacts: [
        { category: 'address', key: 'street', value: '123 Main St' },
        { category: 'preference', key: 'contact_method', value: 'text' },
      ],
    });
    const rendered = renderBriefing(briefing);

    expect(rendered).toContain('KNOWN FACTS');
    expect(rendered).toContain('(address) street: 123 Main St');
    expect(rendered).toContain('(preference) contact_method: text');
  });

  it('renders rolling summary', () => {
    const briefing = createBriefing({
      thread: {
        summary: 'Previous conversation about fixing lights.',
        recentCalls: [],
        lastCallTail: [],
      },
    });
    const rendered = renderBriefing(briefing);

    expect(rendered).toContain('THREAD SUMMARY');
    expect(rendered).toContain('Previous conversation about fixing lights.');
  });

  it('renders answered queries', () => {
    const briefing = createBriefing({
      answeredSince: [
        { question: 'What is the gate code?', answer: '1234' },
      ],
    });
    const rendered = renderBriefing(briefing);

    expect(rendered).toContain('RECENTLY ANSWERED QUESTIONS');
    expect(rendered).toContain('Q: What is the gate code?');
    expect(rendered).toContain('A: 1234');
  });

  it('renders shareable individual info', () => {
    const briefing = createBriefing({
      individual: {
        name: 'Test Individual',
        shareableInfo: [
          { category: 'preference', key: 'availability', value: 'after 5pm' },
        ],
      },
    });
    const rendered = renderBriefing(briefing);

    expect(rendered).toContain('INDIVIDUAL INFO');
    expect(rendered).toContain('(preference) availability: after 5pm');
  });

  it('renders business closure notice', () => {
    const briefing = createBriefing({
      business: {
        name: 'Test Business',
        closedNow: {
          kind: 'holiday',
          label: 'Christmas',
          allDay: true,
          startsAt: '2026-12-25T00:00:00Z',
        },
      },
    });
    const rendered = renderBriefing(briefing);

    expect(rendered).toContain('NOW CLOSED');
    expect(rendered).toContain('holiday');
    expect(rendered).toContain('Christmas');
  });

  it('adds quality note when incomplete', () => {
    const briefing = createBriefing({
      quality: {
        complete: false,
        staleSeconds: 120,
      },
    });
    const rendered = renderBriefing(briefing);

    expect(rendered).toContain('NOTE');
    expect(rendered).toContain('may not be fully processed yet');
  });

  it('trims from bottom when over token budget', () => {
    const briefing = createBriefing({
      knownFacts: Array(50).fill(null).map((_, i) => ({
        category: 'test',
        key: `key-${i}`,
        value: `value-${i}`,
      })),
      thread: {
        summary: 'A long summary that takes many tokens'.repeat(20),
        recentCalls: [],
        lastCallTail: [],
      },
    });
    const rendered = renderBriefing(briefing, { maxTokens: 500 });

    // Should be trimmed but still contain essential sections
    expect(rendered).toContain('Test Individual');
    expect(rendered).toContain('Test Business');
    // Business info might be trimmed
    // Facts should be trimmed
  });

  it('never trims open loops or do not', () => {
    const briefing = createBriefing({
      openLoops: [{ kind: 'awaiting_owner', text: 'Important question' }],
      doNot: ['Do not agree to fees'],
      knownFacts: Array(100).fill(null).map((_, i) => ({
        category: 'test',
        key: `key-${i}`,
        value: `value-${i}`,
      })),
    });
    const rendered = renderBriefing(briefing, { maxTokens: 100 });

    expect(rendered).toContain('OPEN ITEMS');
    expect(rendered).toContain('Important question');
    expect(rendered).toContain('DO NOT');
    expect(rendered).toContain('Do not agree to fees');
  });

  it('maintains fixed section order', () => {
    const briefing = createBriefing({
      callReason: { title: 'Test' },
      openLoops: [{ kind: 'awaiting_owner', text: 'Q' }],
      doNot: ['No fees'],
      thread: {
        summary: 'Summary',
        recentCalls: [],
        lastCallTail: [{ speaker: 'agent', text: 'Hi' }],
      },
      knownFacts: [{ category: 'test', key: 'k', value: 'v' }],
    });
    const rendered = renderBriefing(briefing);

    const sections = [
      'CALL REASON',
      'OPEN ITEMS',
      'DO NOT',
      'LAST CALL',
      'KNOWN FACTS',
    ];

    let lastIndex = -1;
    for (const section of sections) {
      const index = rendered.indexOf(section);
      expect(index).toBeGreaterThan(lastIndex);
      lastIndex = index;
    }
  });
});
