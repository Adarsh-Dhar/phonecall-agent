/**
 * Test mode detection and boot guard
 *
 * Prevents shipping test hooks live
 */

export function isTestMode(): boolean {
  return process.env.TEST_MODE === 'true';
}

export function requireTestModeOrExit(): void {
  if (process.env.TEST_MODE === 'true' && process.env.NODE_ENV === 'production') {
    console.error('FATAL: TEST_MODE=true is not allowed in production');
    console.error('This prevents shipping test hooks live');
    process.exit(1);
  }
}
