/**
 * Rate limiting middleware using express-rate-limit
 *
 * Limits requests per endpoint to prevent abuse and ensure fair usage
 */

import rateLimit from 'express-rate-limit';

// Disable rate limiting for testing if TEST_MODE is set
const TEST_MODE = process.env.TEST_MODE === 'true';

/**
 * General rate limiter for most endpoints
 * 100 requests per 15 minutes per IP (or unlimited in test mode)
 */
export const generalRateLimit = TEST_MODE
  ? (_req, _res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

/**
 * Stricter rate limiter for expensive operations like list contacts
 * 50 requests per minute per IP (or unlimited in test mode)
 */
export const strictRateLimit = TEST_MODE
  ? (_req, _res, next) => next()
  : rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 50,
      message: {
        error: 'Too many requests, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

/**
 * Very strict rate limiter for write operations
 * 20 requests per minute per IP (or unlimited in test mode)
 */
export const writeRateLimit = TEST_MODE
  ? (_req, _res, next) => next()
  : rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 20,
      message: {
        error: 'Too many write operations, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
