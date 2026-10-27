/**
 * Conversation and message fixtures
 *
 * Creates test data in the same shapes the app writes
 * Uses the same code paths as the production app
 */

import { randomBytes } from 'crypto';
import { db } from './env.mjs';

class FixtureBuilder {
  constructor() {
    this.data = {};
  }

  generateId(prefix = 'cm') {
    return `${prefix}${randomBytes(12).toString('hex')}`;
  }

  /**
   * A "contact" is an Account row with ownerId set (see prisma/schema.prisma: Call.contact, Task.contact,
   * Conversation.contact all reference Account). There is no Contact table.
   * Pass linkedAccountId to link it to a real business Account (required for agent auto-dial).
   */
  async contact(overrides = {}) {
    const id = overrides.id || this.generateId('cmc');
    if (!overrides.ownerId) throw new Error('fixtures.contact: ownerId (an existing Account id) is required');
    const c = {
      id,
      ownerId: overrides.ownerId,
      linkedAccountId: overrides.linkedAccountId || null,
      name: overrides.name || 'Test Contact',
      business: overrides.business || 'Test Business',
      category: overrides.category || 'technology',
      phone: overrides.phone || `+1555${Math.floor(Math.random() * 9000000) + 1000000}`,
      email: overrides.email || null,
      note: overrides.note || null,
      businessHoursJson: overrides.businessHoursJson || null,
      timezone: overrides.timezone || 'America/New_York',
    };
    await db.query(
      `INSERT INTO "Account"
         (id, "ownerId", "linkedAccountId", "isService", name, business, category, phone, email, note,
          "businessHoursJson", timezone, "createdAt", "updatedAt")
       VALUES ($1,$2,$3,true,$4,$5,$6,$7,$8,$9,$10,$11, now(), now())`,
      [c.id, c.ownerId, c.linkedAccountId, c.name, c.business, c.category, c.phone, c.email, c.note,
       c.businessHoursJson, c.timezone],
    );
    return c;
  }

  async conversation(overrides = {}) {
    if (!overrides.contactId) throw new Error('fixtures.conversation: contactId (a contact Account id) is required');
    const c = {
      id: overrides.id || this.generateId('cmv'),
      contactId: overrides.contactId,
      status: overrides.status || 'active',
      title: overrides.title || null,
      lastExtractedMessageId: overrides.lastExtractedMessageId || null,
      extractionFailureCount: overrides.extractionFailureCount || 0,
      extractionFailureCursor: overrides.extractionFailureCursor || null,
    };
    await db.query(
      `INSERT INTO "Conversation"
         (id, "contactId", status, title, "lastExtractedMessageId", "extractionFailureCount",
          "extractionFailureCursor", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7, now(), now())`,
      [c.id, c.contactId, c.status, c.title, c.lastExtractedMessageId, c.extractionFailureCount, c.extractionFailureCursor],
    );
    return c;
  }

  async message(overrides = {}) {
    if (!overrides.conversationId) throw new Error('fixtures.message: conversationId is required');
    const m = {
      id: overrides.id || this.generateId('cmm'),
      conversationId: overrides.conversationId,
      role: overrides.role || 'user',
      content: overrides.content ?? 'Test message',
      speaker: overrides.speaker ?? null,
      relationshipId: overrides.relationshipId ?? null,
      seq: overrides.seq ?? null,
      callId: overrides.callId ?? null,
      time: overrides.time || '09:00',
    };
    await db.query(
      `INSERT INTO "Message"
         (id, "conversationId", role, content, speaker, "relationshipId", seq, "callId", time, "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now(), now())`,
      [m.id, m.conversationId, m.role, m.content, m.speaker, m.relationshipId, m.seq, m.callId, m.time],
    );
    return m;
  }

  async task(overrides = {}) {
    if (!overrides.conversationId || !overrides.contactId) {
      throw new Error('fixtures.task: conversationId and contactId are required');
    }
    const t = {
      id: overrides.id || this.generateId('cmt'),
      conversationId: overrides.conversationId,
      contactId: overrides.contactId,
      title: overrides.title || 'Test task',
      kind: overrides.kind || 'call',
      status: overrides.status || 'open',
      schedulerStatus: overrides.schedulerStatus || 'pending',
      priority: overrides.priority || 'normal',
      dueDate: overrides.dueDate || null,
      nextAttemptAt: overrides.nextAttemptAt || null,
      callAttempts: overrides.callAttempts || 0,
      schedulerClaimedAt: overrides.schedulerClaimedAt || null,
      parentTaskId: overrides.parentTaskId || null,
      meta: overrides.meta ? JSON.stringify(overrides.meta) : null,
    };
    await db.query(
      `INSERT INTO "Task"
         (id, "conversationId", "contactId", title, kind, status, "schedulerStatus", priority, "dueDate",
          "nextAttemptAt", "callAttempts", "schedulerClaimedAt", "parentTaskId", meta, "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now(), now())`,
      [t.id, t.conversationId, t.contactId, t.title, t.kind, t.status, t.schedulerStatus, t.priority,
       t.dueDate, t.nextAttemptAt, t.callAttempts, t.schedulerClaimedAt, t.parentTaskId, t.meta],
    );
    return t;
  }

  async call(overrides = {}) {
    for (const k of ['conversationId', 'contactId', 'individualId', 'businessId']) {
      if (!overrides[k]) throw new Error(`fixtures.call: ${k} is required`);
    }
    const status = overrides.status || 'in-progress';
    const c = {
      id: overrides.id || this.generateId('cmk'),
      conversationId: overrides.conversationId,
      contactId: overrides.contactId,
      individualId: overrides.individualId,
      businessId: overrides.businessId,
      status,
      direction: overrides.direction || 'outbound',
      from: overrides.from || '+15550100001',
      to: overrides.to || '+15550100002',
      initiatedBy: overrides.initiatedBy || 'individual',
      placedByAgent: overrides.placedByAgent ?? false,
      taskId: overrides.taskId || null,
      startedAt: overrides.startedAt ?? (status === 'ringing' ? null : new Date().toISOString()),
    };
    await db.query(
      `INSERT INTO "Call"
         (id, "conversationId", "contactId", "individualId", "businessId", status, direction, "from", "to",
          "initiatedBy", "placedByAgent", "taskId", "startedAt", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, now(), now())`,
      [c.id, c.conversationId, c.contactId, c.individualId, c.businessId, c.status, c.direction, c.from, c.to,
       c.initiatedBy, c.placedByAgent, c.taskId, c.startedAt],
    );
    return c;
  }

  /**
   * One-call setup for phone-agent scenarios: individual + linked business accounts, a contact,
   * a conversation, and an in-progress call. Returns everything plus JWTs for both parties.
   */
  async liveCall(accountManager, { callOverrides = {}, individualOverrides = {} } = {}) {
    const individual = await accountManager.createIndividual({ agentMode: true, ...individualOverrides });
    const business = await accountManager.createBusiness({ name: 'Fixture Dental', business: 'Fixture Dental' });
    const contact = await this.contact({ ownerId: individual.id, linkedAccountId: business.id, name: business.name });
    const conversation = await this.conversation({ contactId: contact.id });
    const call = await this.call({
      conversationId: conversation.id, contactId: contact.id,
      individualId: individual.id, businessId: business.id, ...callOverrides,
    });
    return {
      individual, business, contact, conversation, call,
      individualToken: await accountManager.mintJwt(individual.id),
      businessToken: await accountManager.mintJwt(business.id),
    };
  }

  // Legacy synchronous methods for backward compatibility
  conversationSync(overrides = {}) {
    const id = overrides.id || this.generateId();
    return {
      id,
      contactId: overrides.contactId || this.generateId(),
      lastExtractedMessageId: overrides.lastExtractedMessageId || null,
      createdAt: overrides.createdAt || new Date().toISOString(),
      updatedAt: overrides.updatedAt || new Date().toISOString(),
      ...overrides,
    };
  }

  messageSync(overrides = {}) {
    const id = overrides.id || this.generateId();
    const now = new Date().toISOString();

    return {
      id,
      conversationId: overrides.conversationId || this.generateId(),
      role: overrides.role || 'user',
      content: overrides.content || 'Test message',
      speaker: overrides.speaker || null,
      relationshipId: overrides.relationshipId || null,
      seq: overrides.seq || 1,
      createdAt: overrides.createdAt || now,
      updatedAt: overrides.updatedAt || now,
      ...overrides,
    };
  }

  taskSync(overrides = {}) {
    const id = overrides.id || this.generateId('cmv');
    const now = new Date().toISOString();

    return {
      id,
      conversationId: overrides.conversationId || this.generateId(),
      kind: overrides.kind || 'call',
      title: overrides.title || 'Test task',
      due: overrides.due || new Date(Date.now() + 86400000).toISOString(),
      status: overrides.status || 'pending',
      completedAt: overrides.completedAt || null,
      cancelledAt: overrides.cancelledAt || null,
      claimedAt: overrides.claimedAt || null,
      claimedBy: overrides.claimedBy || null,
      retryCount: overrides.retryCount || 0,
      nextRetryAt: overrides.nextRetryAt || null,
      createdAt: overrides.createdAt || now,
      updatedAt: overrides.updatedAt || now,
      ...overrides,
    };
  }

  contactSync(overrides = {}) {
    const id = overrides.id || this.generateId('cmc');
    const now = new Date().toISOString();

    return {
      id,
      ownerId: overrides.ownerId || this.generateId(),
      businessId: overrides.businessId || this.generateId(),
      relationshipId: overrides.relationshipId || this.generateId(),
      name: overrides.name || 'Test Contact',
      business: overrides.business || 'Test Business',
      category: overrides.category || 'technology',
      phone: overrides.phone || '+15550199555',
      email: overrides.email || 'test@example.com',
      note: overrides.note || null,
      businessHoursJson: overrides.businessHoursJson || null,
      createdAt: overrides.createdAt || now,
      updatedAt: overrides.updatedAt || now,
      ...overrides,
    };
  }

  callSync(overrides = {}) {
    const id = overrides.id || this.generateId('cmc');
    const now = new Date().toISOString();

    return {
      id,
      individualId: overrides.individualId || this.generateId(),
      businessId: overrides.businessId || this.generateId(),
      status: overrides.status || 'ringing',
      outcome: overrides.outcome || null,
      confirmedAt: overrides.confirmedAt || null,
      endedAt: overrides.endedAt || null,
      createdAt: overrides.createdAt || now,
      updatedAt: overrides.updatedAt || now,
      ...overrides,
    };
  }
}

export { FixtureBuilder };
export { FixtureBuilder as fixtures };

