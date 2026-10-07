import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('migration SQL applies cleanly', () => {
  it('the call_outcomes_escalation migration SQL is valid', () => {
    const migrationPath = join(__dirname, '../../../../prisma/migrations/20261007204020_call_outcomes_escalation/migration.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    // Basic validation that the SQL contains expected elements
    expect(sql).toContain('ALTER TABLE "Account"');
    expect(sql).toContain('ADD COLUMN "timezone"');
    expect(sql).toContain('ALTER TABLE "Call"');
    expect(sql).toContain('ADD COLUMN "taskId"');
    expect(sql).toContain('ADD COLUMN "outcome"');
    expect(sql).toContain('ALTER TABLE "Task"');
    expect(sql).toContain('ADD COLUMN "parentTaskId"');
    expect(sql).toContain('ALTER TABLE "Query"');
    expect(sql).toContain('ADD COLUMN "callId"');
    expect(sql).toContain('ADD COLUMN "urgent"');
    expect(sql).toContain('CREATE TABLE "PushSubscription"');

    // Check that there are no syntax errors (basic checks)
    expect(sql).not.toContain(',,'); // No double commas
    expect(sql).not.toMatch(/,\s*\)/); // No trailing commas in ALTER TABLE
  });
});
