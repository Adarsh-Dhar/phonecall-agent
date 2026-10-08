import { describe, it, expect } from 'vitest';
import { parseBusinessHours, validateBusinessHours } from '../schedulerPolicy';

describe('schedulerPolicy', () => {
  describe('parseBusinessHours', () => {
    it('returns null for null input', () => {
      expect(parseBusinessHours(null)).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      expect(parseBusinessHours('invalid json')).toBeNull();
    });

    it('returns null for non-object JSON', () => {
      expect(parseBusinessHours('["not", "an", "object"]')).toBeNull();
    });

    it('returns null for missing days array', () => {
      expect(parseBusinessHours('{"start": 9, "end": 17}')).toBeNull();
    });

    it('returns null for invalid start hour', () => {
      expect(parseBusinessHours('{"days": [1,2,3,4,5], "start": 25, "end": 17}')).toBeNull();
    });

    it('returns null for invalid end hour', () => {
      expect(parseBusinessHours('{"days": [1,2,3,4,5], "start": 9, "end": 25}')).toBeNull();
    });

    it('returns parsed object for valid business hours', () => {
      const json = '{"days": [1,2,3,4,5], "start": 9, "end": 17, "tz": "Asia/Kolkata"}';
      const result = parseBusinessHours(json);
      expect(result).toEqual({
        days: [1, 2, 3, 4, 5],
        start: 9,
        end: 17,
        tz: 'Asia/Kolkata',
      });
    });
  });

  describe('validateBusinessHours', () => {
    it('throws for non-object input', () => {
      expect(() => validateBusinessHours(null)).toThrow('Business hours must be an object');
      expect(() => validateBusinessHours('string')).toThrow('Business hours must be an object');
    });

    it('throws for missing days array', () => {
      expect(() => validateBusinessHours({ start: 9, end: 17 })).toThrow(
        'Business hours must have a "days" array'
      );
    });

    it('throws for invalid day numbers', () => {
      expect(() => validateBusinessHours({ days: [1, 2, 7], start: 9, end: 17 })).toThrow(
        'Days must be numbers 0-6'
      );
    });

    it('throws for invalid start hour', () => {
      expect(() => validateBusinessHours({ days: [1, 2, 3], start: 25, end: 17 })).toThrow(
        'Start hour must be a number 0-23'
      );
    });

    it('throws for invalid end hour', () => {
      expect(() => validateBusinessHours({ days: [1, 2, 3], start: 9, end: 25 })).toThrow(
        'End hour must be a number 0-24'
      );
    });

    it('throws when start >= end', () => {
      expect(() => validateBusinessHours({ days: [1, 2, 3], start: 17, end: 9 })).toThrow(
        'Start hour must be less than end hour'
      );
    });

    it('returns validated object for valid input', () => {
      const input = { days: [1, 2, 3, 4, 5], start: 9, end: 17, tz: 'Asia/Kolkata' };
      const result = validateBusinessHours(input);
      expect(result).toEqual(input);
    });
  });
});
