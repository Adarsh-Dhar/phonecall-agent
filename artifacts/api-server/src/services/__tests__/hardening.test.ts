import { describe, it, expect, vi } from 'vitest';
vi.mock('../../lib/logger', () => ({ logger: { info() {}, warn() {}, error() {}, debug() {} } }));
import { extractJsonObject } from '../../lib/extractJson';
import { isModelRejection } from '../nebiusText';
import { parseModelDueDate } from '../taskExtraction/reconcileTasks';

const NOW = new Date('2026-10-10T08:00:00.000Z');

describe('extractJsonObject', () => {
  it.each([
    ['{"a":1}'],
    ['`json\n{"a":1}\n`'],
    ['Sure! Here you go:\n{"a":1}\nHope that helps'],
  ])('parses %j', (raw) => {
    expect(extractJsonObject(raw)).toEqual({ a: 1 });
  });
  it.each([['not json'], ['[1,2]'], ['{"a":']])('rejects %j without echoing it', (raw) => {
    expect(() => extractJsonObject(raw)).toThrow(/model reply/);
  });
});

describe('isModelRejection is only about the model', () => {
  it.each([
    [404, 'The model `foo` does not exist', true],
    [400, 'Model not found: foo', true],
    [400, "Invalid response_format for model Qwen", false],
    [400, "This model's maximum context length is 32768 tokens", false],
    [400, 'Unsupported value for temperature on this model', false],
    [404, 'Route not found', false],
    [500, 'model unavailable', false],
  ])('%i %s -> %s', (status, msg, expected) => {
    expect(isModelRejection(status as number, msg as string)).toBe(expected);
  });
});

describe('parseModelDueDate requires an explicit UTC offset', () => {
  it('accepts Z and +hh:mm', () => {
    expect(parseModelDueDate('2026-10-12T15:00:00+05:30', NOW)).toEqual(new Date('2026-10-12T09:30:00Z'));
    expect(parseModelDueDate('2026-10-12T15:00:00Z', NOW)).not.toBeNull();
  });
  it('rejects a time with no offset (would be read in server time)', () => {
    expect(parseModelDueDate('2026-10-12T15:00:00', NOW)).toBeNull();
    expect(parseModelDueDate('2026-10-12T15:00', NOW)).toBeNull();
  });
});
