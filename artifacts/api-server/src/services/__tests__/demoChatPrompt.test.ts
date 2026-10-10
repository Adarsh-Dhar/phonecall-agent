import { describe, it, expect } from 'vitest';
import { buildDemoChatSystemPrompt } from '../demoChatPrompt';

describe('buildDemoChatSystemPrompt', () => {
  it('contains the honesty clause about not booking anything', () => {
    const prompt = buildDemoChatSystemPrompt('');
    expect(prompt).toContain('This chat cannot place calls, bookings or appointments');
    expect(prompt).toContain('does not save tasks');
    expect(prompt).toContain('Never say or imply that anything has been booked, scheduled, confirmed or sent');
  });

  it('does not contain the old misleading phrases', () => {
    const prompt = buildDemoChatSystemPrompt('');
    expect(prompt.toLowerCase()).not.toContain('settled');
    expect(prompt.toLowerCase()).not.toContain('simulated');
    expect(prompt.toLowerCase()).not.toContain('state the booking/action as done');
    expect(prompt.toLowerCase()).not.toContain('not pending');
  });

  it('keeps the no-nagging rule', () => {
    const prompt = buildDemoChatSystemPrompt('');
    expect(prompt).toContain('do not ask another confirming question');
    expect(prompt).toContain('Never ask');
  });

  it('appends the knowledge block when provided', () => {
    const knowledgeBlock = '\n\nWhat you already know about this contact:\n- (preference) hours: 9-5';
    const prompt = buildDemoChatSystemPrompt(knowledgeBlock);
    expect(prompt).toContain(knowledgeBlock);
  });

  it('returns the base prompt when knowledge block is empty', () => {
    const prompt = buildDemoChatSystemPrompt('');
    expect(prompt).toContain('You are Phone Agent');
    expect(prompt).not.toContain('What you already know about this contact');
  });

  it('suggests "Ready to book" style next steps instead of claiming it is done', () => {
    const prompt = buildDemoChatSystemPrompt('');
    expect(prompt).toContain('summarise the plan as a clear next step');
    expect(prompt).toContain('Ready to book');
    expect(prompt).toContain('point the user to creating a task or starting a call');
  });
});
