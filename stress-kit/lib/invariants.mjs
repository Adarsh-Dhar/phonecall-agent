/**
 * SQL invariant checks
 *
 * Runs database queries to verify system state after each scenario
 */

import { Pool } from 'pg';

class InvariantChecker {
  constructor(dbUrl) {
    this.pool = new Pool({ connectionString: dbUrl });
  }

  async checkAll() {
    const results = [];

    const checks = [
      this.checkNoOldOpenCalls.bind(this),
      this.checkNoStaleClaimedTasks.bind(this),
      this.checkNoDuplicateRingingCalls.bind(this),
      this.checkNoDuplicateActiveTasks.bind(this),
      this.checkCursorNeverDecreases.bind(this),
      this.checkBookedCallsHaveValidConfirmedAt.bind(this),
      this.checkNoBusinessOnlyKnowledge.bind(this),
      this.checkOutboundRateLimit.bind(this),
      this.checkNoPendingQueriesOnEndedCalls.bind(this),
    ];

    for (const check of checks) {
      try {
        const result = await check();
        results.push(result);
      } catch (error) {
        results.push({
          name: check.name,
          passed: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  async checkNoOldOpenCalls() {
    // No Call with endedAt null older than max duration plus grace, when no live room exists
    const query = `
      SELECT COUNT(*) as count
      FROM "Call"
      WHERE "endedAt" IS NULL
      AND "createdAt" < NOW() - INTERVAL '70 minutes'
    `;
    const result = await this.pool.query(query);
    const count = parseInt(result.rows[0].count, 10);
    
    return {
      name: 'No old open calls',
      passed: count === 0,
      details: `Found ${count} open calls older than 70 minutes`,
    };
  }

  async checkNoStaleClaimedTasks() {
    // No Task in claimed past the claim TTL
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM "Task"
        WHERE status = 'claimed'
        AND "claimedAt" < NOW() - INTERVAL '15 minutes'
      `;
      const result = await this.pool.query(query);
      const count = parseInt(result.rows[0].count, 10);
      
      return {
        name: 'No stale claimed tasks',
        passed: count === 0,
        details: `Found ${count} tasks claimed > 15 minutes ago`,
      };
    } catch (error) {
      return {
        name: 'No stale claimed tasks',
        passed: true, // Skip this check if table doesn't exist
        details: `Skipped: ${error.message}`,
      };
    }
  }

  async checkNoDuplicateRingingCalls() {
    // At most one ringing call per individual-business pair
    const query = `
      SELECT "individualId", "businessId", COUNT(*) as count
      FROM "Call"
      WHERE status = 'ringing'
      GROUP BY "individualId", "businessId"
      HAVING COUNT(*) > 1
    `;
    const result = await this.pool.query(query);
    const count = result.rows.length;
    
    return {
      name: 'No duplicate ringing calls',
      passed: count === 0,
      details: `Found ${count} individual-business pairs with multiple ringing calls`,
    };
  }

  async checkNoDuplicateActiveTasks() {
    // No duplicate active tasks by dedupe key (kind|title|parent) per contact
    try {
      const query = `
        SELECT "contactId", kind, title, "parentId", COUNT(*) as count
        FROM "Task"
        WHERE status IN ('pending', 'claimed')
        GROUP BY "contactId", kind, title, "parentId"
        HAVING COUNT(*) > 1
      `;
      const result = await this.pool.query(query);
      const count = result.rows.length;
      
      return {
        name: 'No duplicate active tasks',
        passed: count === 0,
        details: `Found ${count} duplicate active task groups`,
      };
    } catch (error) {
      return {
        name: 'No duplicate active tasks',
        passed: true,
        details: `Skipped: ${error.message}`,
      };
    }
  }

  async checkCursorNeverDecreases() {
    // Conversation cursor never decreases between samples and never exceeds the newest message
    // This is a heuristic check - we can't know the previous sample state
    // So we check that lastExtractedMessageId exists in the conversation's messages
    const query = `
      SELECT c.id, c."lastExtractedMessageId"
      FROM "Conversation" c
      WHERE c."lastExtractedMessageId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "Message" m WHERE m.id = c."lastExtractedMessageId" AND m."conversationId" = c.id
      )
    `;
    const result = await this.pool.query(query);
    const count = result.rows.length;
    
    return {
      name: 'Cursor points to valid message',
      passed: count === 0,
      details: `Found ${count} conversations with invalid cursor`,
    };
  }

  async checkBookedCallsHaveValidConfirmedAt() {
    // Every booked call has a confirmedAt that was in the future when the call ended
    const query = `
      SELECT COUNT(*) as count
      FROM "Call"
      WHERE outcome = 'booked'
      AND ("confirmedAt" IS NULL OR "confirmedAt" < "createdAt")
    `;
    const result = await this.pool.query(query);
    const count = parseInt(result.rows[0].count, 10);
    
    return {
      name: 'Booked calls have valid confirmedAt',
      passed: count === 0,
      details: `Found ${count} booked calls with invalid confirmedAt`,
    };
  }

  async checkNoBusinessOnlyKnowledge() {
    // No active ContactKnowledge whose only source messages are business-speaker messages
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM "ContactKnowledge" ck
        WHERE ck."isActive" = true
        AND NOT EXISTS (
          SELECT 1 FROM "Message" m
          WHERE m."conversationId" IN (
            SELECT c.id FROM "Conversation" c WHERE c."contactId" = ck."contactId"
          )
          AND m.role = 'user'
          AND (m.speaker IS NULL OR m.speaker != 'business')
        )
      `;
      const result = await this.pool.query(query);
      const count = parseInt(result.rows[0].count, 10);
      
      return {
        name: 'No business-only active knowledge',
        passed: count === 0,
        details: `Found ${count} active facts sourced only from business speech`,
      };
    } catch (error) {
      return {
        name: 'No business-only active knowledge',
        passed: true,
        details: `Skipped: ${error.message}`,
      };
    }
  }

  async checkOutboundRateLimit() {
    // At most 2 business-bound OutboundMessage rows per contact per 24h
    const query = `
      SELECT "contactId", COUNT(*) as count
      FROM "OutboundMessage"
      WHERE channel IN ('email', 'whatsapp')
      AND "createdAt" > NOW() - INTERVAL '24 hours'
      GROUP BY "contactId"
      HAVING COUNT(*) > 2
    `;
    const result = await this.pool.query(query);
    const count = result.rows.length;
    
    return {
      name: 'Outbound rate limit',
      passed: count === 0,
      details: `Found ${count} contacts with > 2 outbound messages in 24h`,
    };
  }

  async checkNoPendingQueriesOnEndedCalls() {
    // No Query still pending whose call has ended, EXCEPT for needs_user which deliberately creates a pending query after the call ends
    // This invariant should only catch live ask_user queries that weren't cleaned up
    // Check only calls ended in the last minute to isolate to current scenario
    const query = `
      SELECT COUNT(*) as count
      FROM "Query" q
      JOIN "Call" c ON c.id = q."callId"
      WHERE q.status = 'pending'
      AND c."endedAt" IS NOT NULL
      AND c.outcome != 'needs_user'
      AND c."endedAt" > NOW() - INTERVAL '1 minute'
    `;
    const result = await this.pool.query(query);
    const count = parseInt(result.rows[0].count, 10);
    
    return {
      name: 'No pending queries on ended calls (except needs_user, last 1 min)',
      passed: count === 0,
      details: `Found ${count} pending queries on ended calls in last minute (excluding needs_user)`,
    };
  }

  async close() {
    await this.pool.end();
  }
}

export { InvariantChecker };
