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

  async contact(overrides = {}) {
    const id = overrides.id || this.generateId('cmc');
    const ownerId = overrides.ownerId || this.generateId('acc');
    const now = new Date().toISOString();

    const contact = {
      id,
      ownerId,
      linkedAccountId: overrides.linkedAccountId || null,
      relationshipId: overrides.relationshipId || null,
      name: overrides.name || 'Test Contact',
      business: overrides.business || 'Test Business',
      category: overrides.category || 'technology',
      phone: overrides.phone || '+15550199555',
      email: overrides.email || 'test@example.com',
      note: overrides.note || null,
      businessHoursJson: overrides.businessHoursJson || null,
      agentMode: overrides.agentMode || false,
      createdAt: overrides.createdAt || now,
      updatedAt: overrides.updatedAt || now,
      ...overrides,
    };

    // Insert into database
    await db.query(`
      INSERT INTO "Contact" (
        id, "ownerId", "linkedAccountId", "relationshipId", name, business, category,
        phone, email, note, "businessHoursJson", "agentMode", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      contact.id, contact.ownerId, contact.linkedAccountId, contact.relationshipId,
      contact.name, contact.business, contact.category, contact.phone, contact.email,
      contact.note, contact.businessHoursJson, contact.agentMode, contact.createdAt, contact.updatedAt,
    ]);

    return contact;
  }

  async conversation(overrides = {}) {
    const id = overrides.id || this.generateId('cmc');
    const now = new Date().toISOString();

    const conversation = {
      id,
      contactId: overrides.contactId || this.generateId('cmc'),
      lastExtractedMessageId: overrides.lastExtractedMessageId || null,
      extractionFailureCount: overrides.extractionFailureCount || 0,
      extractionFailureCursor: overrides.extractionFailureCursor || null,
      createdAt: overrides.createdAt || now,
      updatedAt: overrides.updatedAt || now,
      ...overrides,
    };

    // Insert into database
    await db.query(`
      INSERT INTO "Conversation" (
        id, "contactId", "lastExtractedMessageId", "extractionFailureCount",
        "extractionFailureCursor", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      conversation.id, conversation.contactId, conversation.lastExtractedMessageId,
      conversation.extractionFailureCount, conversation.extractionFailureCursor,
      conversation.createdAt, conversation.updatedAt,
    ]);

    return conversation;
  }

  async message(overrides = {}) {
    const id = overrides.id || this.generateId('cmm');
    const now = new Date().toISOString();

    const message = {
      id,
      conversationId: overrides.conversationId || this.generateId('cmc'),
      role: overrides.role || 'user',
      content: overrides.content || 'Test message',
      speaker: overrides.speaker || null,
      relationshipId: overrides.relationshipId || null,
      seq: overrides.seq || 1,
      callId: overrides.callId || null,
      time: overrides.time || null,
      createdAt: overrides.createdAt || now,
      updatedAt: overrides.updatedAt || now,
      ...overrides,
    };

    // Insert into database
    await db.query(`
      INSERT INTO "Message" (
        id, "conversationId", role, content, speaker, "relationshipId", seq,
        "callId", time, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      message.id, message.conversationId, message.role, message.content,
      message.speaker, message.relationshipId, message.seq, message.callId,
      message.time, message.createdAt, message.updatedAt,
    ]);

    return message;
  }

  async task(overrides = {}) {
    const id = overrides.id || this.generateId('cmv');
    const now = new Date().toISOString();

    const task = {
      id,
      conversationId: overrides.conversationId || null,
      contactId: overrides.contactId || this.generateId('cmc'),
      kind: overrides.kind || 'call',
      title: overrides.title || 'Test task',
      description: overrides.description || null,
      due: overrides.due || new Date(Date.now() + 86400000).toISOString(),
      status: overrides.status || 'pending',
      completedAt: overrides.completedAt || null,
      cancelledAt: overrides.cancelledAt || null,
      claimedAt: overrides.claimedAt || null,
      claimedBy: overrides.claimedBy || null,
      retryCount: overrides.retryCount || 0,
      nextRetryAt: overrides.nextRetryAt || null,
      priority: overrides.priority || 'medium',
      parentTaskId: overrides.parentTaskId || null,
      createdAt: overrides.createdAt || now,
      updatedAt: overrides.updatedAt || now,
      ...overrides,
    };

    // Insert into database
    await db.query(`
      INSERT INTO "Task" (
        id, "conversationId", "contactId", kind, title, description, due, status,
        "completedAt", "cancelledAt", "claimedAt", "claimedBy", "retryCount",
        "nextRetryAt", priority, "parentTaskId", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    `, [
      task.id, task.conversationId, task.contactId, task.kind, task.title,
      task.description, task.due, task.status, task.completedAt, task.cancelledAt,
      task.claimedAt, task.claimedBy, task.retryCount, task.nextRetryAt,
      task.priority, task.parentTaskId, task.createdAt, task.updatedAt,
    ]);

    return task;
  }

  async call(overrides = {}) {
    const id = overrides.id || this.generateId('cmc');
    const now = new Date().toISOString();

    const call = {
      id,
      conversationId: overrides.conversationId || this.generateId('cmc'),
      individualId: overrides.individualId || this.generateId('acc'),
      businessId: overrides.businessId || this.generateId('acc'),
      status: overrides.status || 'ringing',
      outcome: overrides.outcome || null,
      outcomeSummary: overrides.outcomeSummary || null,
      confirmedAt: overrides.confirmedAt || null,
      confirmationRef: overrides.confirmationRef || null,
      endedAt: overrides.endedAt || null,
      taskId: overrides.taskId || null,
      createdAt: overrides.createdAt || now,
      updatedAt: overrides.updatedAt || now,
      ...overrides,
    };

    // Insert into database
    await db.query(`
      INSERT INTO "Call" (
        id, "conversationId", "individualId", "businessId", status, outcome,
        "outcomeSummary", "confirmedAt", "confirmationRef", "endedAt", "taskId",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      call.id, call.conversationId, call.individualId, call.businessId,
      call.status, call.outcome, call.outcomeSummary, call.confirmedAt,
      call.confirmationRef, call.endedAt, call.taskId, call.createdAt, call.updatedAt,
    ]);

    return call;
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
