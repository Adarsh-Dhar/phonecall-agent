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

  // Required environment variables with descriptions
  const required = [
    { key: 'TEST_DATABASE_URL', description: 'PostgreSQL connection URL (must end with _test)' },
    { key: 'JWT_SECRET', description: 'Secret key for JWT token signing' },
    { key: 'BASE_URL', description: 'API server base URL (e.g., http://localhost:5175)', altKey: 'API_BASE' },
    { key: 'GEMINI_API_KEY', description: 'Google Gemini API key' },
    { key: 'GEMINI_MODEL', description: 'Google Gemini model name (e.g., gemini-2.0-flash-exp)', altKey: 'GEMINI_LIVE_MODEL' },
    { key: 'NEBIUS_API_KEY', description: 'Nebius API key' },
    { key: 'NEBIUS_BASE_URL', description: 'Nebius API base URL (e.g., https://api.nebius.ai/v1)' },
    { key: 'NEBIUS_MODEL', description: 'Nebius model name' },
  ];

  for (const { key, description, altKey } of required) {
    const value = process.env[key] || process.env[altKey];
    if (!value) {
      const altText = altKey ? ` (or ${altKey})` : '';
      errors.push(`Missing: ${key}${altText} - ${description}`);
    } else if (key.includes('API_KEY') && value.length < 10) {
      errors.push(`Invalid: ${key} - appears to be too short (must be a valid API key)`);
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
    { key: 'NEBIUS_FALLBACK_MODEL', description: 'Fallback Nebius model for 404 errors' },
    { key: 'NEBIUS_RUN_BUDGET', description: 'Max Nebius calls per run (default: 1000)' },
    { key: 'NEBIUS_TIMEOUT_MS', description: 'Nebius request timeout in ms (default: 90000)' },
  ];

  for (const { key, description } of recommended) {
    if (!process.env[key]) {
      warnings.push(`Missing recommended: ${key} - ${description}`);
    }
  }

  // Load env file from parent directory (project root) first, then fallback to local
  const rootEnvPath = join(__dirname, '..', '..', '.env');
  const localEnvPath = join(__dirname, '..', '.env');
  
  if (existsSync(rootEnvPath)) {
    // dotenv is loaded by the test runner (run-all.mjs)
  } else if (existsSync(localEnvPath)) {
    // Fallback to stress-kit .env
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
    console.error('\n❌ Environment validation failed:');
    console.error('\nMissing required environment variables:');
    for (const error of validation.errors) {
      console.error(`  ✗ ${error}`);
    }
    console.error('\nPlease add these to your .env file or environment.');
    console.error('See .env.example for the required format.\n');
    throw new Error('Invalid environment configuration');
  }

  if (validation.warnings.length > 0) {
    console.warn('\n⚠️  Environment warnings:');
    for (const warning of validation.warnings) {
      console.warn(`  ! ${warning}`);
    }
    console.warn('These are optional but recommended for full functionality.\n');
  } else {
    console.log('✓ All required environment variables are set.');
  }

  return {
    testDatabaseUrl: process.env.TEST_DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    baseUrl: process.env.BASE_URL || process.env.API_BASE,
    wsUrl: (process.env.BASE_URL || process.env.API_BASE)?.replace('http://', 'ws://').replace('https://', 'wss://'),
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || process.env.GEMINI_LIVE_MODEL,
    nebiusApiKey: process.env.NEBIUS_API_KEY,
    nebiusBaseUrl: process.env.NEBIUS_BASE_URL,
    nebiusModel: process.env.NEBIUS_MODEL,
    nebiusFallbackModel: process.env.NEBIUS_FALLBACK_MODEL,
    nebiusRunBudget: parseInt(process.env.NEBIUS_RUN_BUDGET || '1000', 10),
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
