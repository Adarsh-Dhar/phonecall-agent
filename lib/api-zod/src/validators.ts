/**
 * Shared Zod validators for input validation
 * Prevents bad input from causing 5xx errors
 */

import { z } from 'zod';

// Max lengths
const MAX_NAME_LENGTH = 200;
const MAX_BUSINESS_LENGTH = 200;
const MAX_PHONE_LENGTH = 50;
const MAX_INITIALS_LENGTH = 10;
const MAX_CATEGORY_LENGTH = 50;
const MAX_NOTE_LENGTH = 10000; // 10KB instead of 200KB
const MAX_COLOR_LENGTH = 20;

// Helper: Create a string schema with max length and null byte rejection
const safeString = (maxLength: number, message?: string) =>
  z.string()
    .max(maxLength, message || `Must be less than ${maxLength} characters`)
    .refine((val) => !val.includes('\u0000'), 'Input contains null bytes')
    .refine((val) => !/[\u202A-\u202E\u2066-\u2069]/.test(val), 'Input contains bidirectional override characters');

// Helper: Remove RTL override characters and other suspicious Unicode (for internal use only)
const removeBidi = (val: string) =>
  val.replace(/[\u202A-\u202E\u2066-\u2069]/g, '');

// Contact validation schema
export const contactCreateSchema = z.object({
  name: safeString(MAX_NAME_LENGTH, `Name must be less than ${MAX_NAME_LENGTH} characters`).optional(),
  business: safeString(MAX_BUSINESS_LENGTH, `Business must be less than ${MAX_BUSINESS_LENGTH} characters`).optional(),
  category: z.string().max(MAX_CATEGORY_LENGTH).optional(),
  phone: z.string().max(MAX_PHONE_LENGTH).optional(),
  initials: z.string().max(MAX_INITIALS_LENGTH).optional(),
  color: z.string().max(MAX_COLOR_LENGTH).optional(),
  note: safeString(MAX_NOTE_LENGTH).optional(),
  contactEmail: z.string().email().optional(),
  allowFallbackMessage: z.boolean().optional(),
  withConversation: z.boolean().optional(),
});

export const contactUpdateSchema = z.object({
  name: safeString(MAX_NAME_LENGTH).optional(),
  business: safeString(MAX_BUSINESS_LENGTH).optional(),
  category: z.string().max(MAX_CATEGORY_LENGTH).optional(),
  phone: z.string().max(MAX_PHONE_LENGTH).optional(),
  initials: z.string().max(MAX_INITIALS_LENGTH).optional(),
  color: z.string().max(MAX_COLOR_LENGTH).optional(),
  note: safeString(MAX_NOTE_LENGTH).optional(),
  contactEmail: z.string().email().optional(),
  allowFallbackMessage: z.boolean().optional(),
  businessHoursJson: z.any().optional(),
});

// Business hours validation (already exists in schedulerPolicy, just ensuring it's used)
export const businessHoursSchema = z.object({
  days: z.array(z.number().min(0).max(6)).min(1),
  start: z.number().min(0).max(23),
  end: z.number().min(1).max(24),
  tz: z.string().optional(),
}).refine((data) => data.start !== data.end, {
  message: 'Start and end hours must be different',
});

export const safeStringSchema = z.string()
  .transform(removeBidi)
  .transform((val) => val.replace(/\u0000/g, ''));
