/**
 * Environment validation for stress harness
 *
 * Ensures all required environment variables are set and validates safety rails
 */

import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function validateEnv() {
  const errors = [];
  const warnings = [];

  // Required environment variables
  const required = [
    'TEST_DATABASE_URL',
    'JWT_SECRET',
    'BASE_URL',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  // Safety rail: database must be localhost
  if (process.env.TEST_DATABASE_URL) {
    const dbUrl = new URL(process.env.TEST_DATABASE_URL);
    if (dbUrl.hostname !== 'localhost' && dbUrl.hostname !== '127.0.0.1') {
      errors.push(
        `Safety rail violation: TEST_DATABASE_URL must use localhost, got ${dbUrl.hostname}`
      );
    }

    // Safety rail: database name must end in _test
    if (!dbUrl.pathname.endsWith('_test')) {
      errors.push(
        `Safety rail violation: TEST_DATABASE_URL database name must end in _test, got ${dbUrl.pathname}`
      );
    }
  }

  // Safety rail: BASE_URL must be localhost
  if (process.env.BASE_URL) {
    const baseUrl = new URL(process.env.BASE_URL);
    if (baseUrl.hostname !== 'localhost' && baseUrl.hostname !== '127.0.0.1') {
      errors.push(
        `Safety rail violation: BASE_URL must use localhost, got ${baseUrl.hostname}`
      );
    }
  }

  // Optional but recommended
  const recommended = [
    'NEBIUS_API_KEY',
    'NEBIUS_BASE_URL',
    'NEBIUS_MODEL',
  ];

  for (const key of recommended) {
    if (!process.env[key]) {
      warnings.push(`Missing recommended environment variable: ${key}`);
    }
  }

  // Load env file if present
  const envPath = join(__dirname, '..', '.env');
  if (existsSync(envPath)) {
    // dotenv is loaded by the test runner
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function getEnv() {
  const validation = validateEnv();

  if (!validation.valid) {
    console.error('Environment validation failed:');
    for (const error of validation.errors) {
      console.error(`  - ${error}`);
    }
    throw new Error('Invalid environment configuration');
  }

  if (validation.warnings.length > 0) {
    console.warn('Environment warnings:');
    for (const warning of validation.warnings) {
      console.warn(`  - ${warning}`);
    }
  }

  return {
    testDatabaseUrl: process.env.TEST_DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    baseUrl: process.env.BASE_URL,
    wsUrl: process.env.BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://'),
    nebiusApiKey: process.env.NEBIUS_API_KEY,
    nebiusBaseUrl: process.env.NEBIUS_BASE_URL,
    nebiusModel: process.env.NEBIUS_MODEL,
    nebiusTimeoutMs: parseInt(process.env.NEBIUS_TIMEOUT_MS || '90000', 10),
    testMode: process.env.TEST_MODE === 'true',
  };
}

// Database helper for scenarios
let dbPool = null;

export const db = {
  async query(sql, params = []) {
    if (!dbPool) {
      const dbUrl = process.env.TEST_DATABASE_URL;
      if (!dbUrl) {
        throw new Error('TEST_DATABASE_URL not set');
      }
      dbPool = new pg.Pool({ connectionString: dbUrl });
    }
    const result = await dbPool.query(sql, params);
    return result;
  },

  async close() {
    if (dbPool) {
      await dbPool.end();
      dbPool = null;
    }
  },
};
