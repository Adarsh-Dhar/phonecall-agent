import { prisma } from '@workspace/db-prisma';
import { isOnline, sendToAccount } from './presence';
import { logger } from '../lib/logger';

export type CallRole = 'individual' | 'business';

export class NotInContactsError extends Error {
  constructor(message = "You are not in the receiver's contact list") {
    super(message);
    this.name = 'NotInContactsError';
  }
}

/**
 * Does `ownerId` have `targetId` saved as a contact?
 */
async function hasContact(ownerId: string, targetId: string): Promise<boolean> {
  const row = await prisma.account.findFirst({
    where: { ownerId, linkedAccountId: targetId, isService: true },
    select: { id: true },
  });
  return row !== null;
}

/**
 * True only if BOTH accounts have each other saved.
 */
export async function isContact(callerId: string, receiverId: string): Promise<boolean> {
  const [callerHasReceiver, receiverHasCaller] = await Promise.all([
    hasContact(callerId, receiverId),
    hasContact(receiverId, callerId),
  ]);
  return callerHasReceiver && receiverHasCaller;
}

/**
 * Determine which role initiated the call.
 */
export function initiatorRoleOf(call: { initiatedBy: string | null }): CallRole | null {
  if (!call.initiatedBy) return null;
  return call.initiatedBy === 'individual' ? 'individual' : 'business';
}

/**
 * Get the account ID of the call initiator.
 */
export function initiatorIdOf(call: { individualId: string | null; businessId: string | null; initiatedBy: string | null }): string | null {
  if (!call.initiatedBy) return null;
  return call.initiatedBy === 'individual' ? call.individualId : call.businessId;
}

/**
 * Get the account ID of the call recipient.
 */
export function recipientIdOf(call: { individualId: string | null; businessId: string | null; initiatedBy: string | null }): string | null {
  if (!call.initiatedBy) return null;
  return call.initiatedBy === 'individual' ? call.businessId : call.individualId;
}

/**
 * Determine the role of a given account in a call.
 */
export function roleInCall(call: { individualId: string | null; businessId: string | null }, accountId: string): CallRole | null {
  if (call.individualId === accountId) return 'individual';
  if (call.businessId === accountId) return 'business';
  return null;
}

/**
 * List calls for a given account (either as individual or business).
 */
export async function listCallsFor(accountId: string, role: CallRole) {
  const whereClause = role === 'individual'
    ? { individualId: accountId }
    : { businessId: accountId };

  const calls = await prisma.call.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      contact: {
        select: {
          id: true,
          name: true,
          initials: true,
          color: true,
          phone: true,
          business: true,
          category: true,
          isService: true,
          ownerId: true,
          linkedAccountId: true,
        },
      },
    },
  });

  // For business accounts, resolve the individual's name from individualId
  if (role === 'business') {
    const individualIds = calls
      .map(c => c.individualId)
      .filter((id): id is string => id !== null);

    const individuals = individualIds.length > 0
      ? await prisma.account.findMany({
          where: { id: { in: individualIds } },
          select: { id: true, name: true },
        })
      : [];

    const individualMap = new Map(individuals.map(a => [a.id, a.name]));

    const result = calls.map(call => {
      const displayName = call.individualId
        ? individualMap.get(call.individualId) || call.contact.name
        : call.contact.name;

      return {
        ...call,
        viewerRole: role,
        contact: {
          ...call.contact,
          displayName,
        },
      };
    });

    return result;
  }

  return calls.map(call => ({
    ...call,
    viewerRole: role,
  }));
}

/**
 * Get a specific call for a given account.
 */
export async function getCallFor(callId: string, accountId: string, role: CallRole) {
  const whereClause = role === 'individual'
    ? { id: callId, individualId: accountId }
    : { id: callId, businessId: accountId };

  const call = await prisma.call.findFirst({
    where: whereClause,
    include: {
      contact: {
        select: {
          id: true,
          name: true,
          initials: true,
          color: true,
          phone: true,
          business: true,
          category: true,
          isService: true,
          ownerId: true,
        },
      },
    },
  });

  if (!call) return null;

  return {
    ...call,
    viewerRole: role,
  };
}

/**
 * List calls for a conversation (individual-only).
 */
export async function listConversationCallsFor(conversationId: string, accountId: string) {
  const calls = await prisma.call.findMany({
    where: {
      conversationId,
      individualId: accountId,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      contact: {
        select: {
          id: true,
          name: true,
          initials: true,
          color: true,
          phone: true,
          business: true,
          category: true,
          isService: true,
          ownerId: true,
        },
      },
    },
  });

  return calls.map(call => ({
    ...call,
    viewerRole: 'individual' as const,
  }));
}

/**
 * Get transcript messages for a call.
 */
export async function getTranscriptFor(callId: string, accountId: string, role: CallRole) {
  const whereClause = role === 'individual'
    ? { id: callId, individualId: accountId }
    : { id: callId, businessId: accountId };

  const call = await prisma.call.findFirst({
    where: whereClause,
    select: { id: true },
  });

  if (!call) return null;

  const messages = await prisma.message.findMany({
    where: { callId },
    orderBy: { createdAt: 'asc' },
  });

  return messages;
}

/**
 * Dial a call as a specific role.
 */
export async function dialCallAs(
  contactId: string,
  taskId: string | null,
  dialerId: string,
  dialerRole: CallRole
) {
  if (!contactId) {
    throw new Error('contactId is required');
  }

  const contact = await prisma.account.findUnique({
    where: { id: contactId },
    select: {
      id: true,
      name: true,
      isService: true,
      ownerId: true,
      linkedAccountId: true,
    },
  });

  if (!contact) {
    throw new Error('Contact not found');
  }

  // Determine the parties using linkedAccountId
  if (contact.ownerId !== dialerId) throw new Error('Contact not found');
  const otherId = contact.linkedAccountId;
  if (!otherId) throw new Error('This contact is not linked to an account');

  const other = await prisma.account.findUnique({ where: { id: otherId }, select: { isService: true } });
  if (!other) throw new Error('Linked account not found');

  // Check if both accounts have each other saved as contacts
  if (!(await isContact(dialerId, otherId))) {
    throw new NotInContactsError();
  }

  let individualId: string | null = null;
  let businessId: string | null = null;
  let calleeAccountId: string | null = null;
  let callContactId = contactId;
  let callConversationId: string | null = null;

  if (dialerRole === 'individual') {
    if (!other.isService) throw new Error('Individuals can only call business accounts');
    individualId = dialerId;
    businessId = otherId;
    calleeAccountId = otherId;
    // Individual's contact is already their own mirror
  } else {
    if (other.isService) throw new Error('Businesses can only call individual accounts');
    businessId = dialerId;
    individualId = otherId;
    calleeAccountId = otherId;

    // Find the individual's own mirror of this business (must exist since isContact passed)
    const mirror = await prisma.account.findFirst({
      where: { ownerId: individualId, linkedAccountId: businessId, isService: true },
      include: { conversations: true },
    });
    if (!mirror) {
      throw new NotInContactsError();
    }
    callContactId = mirror.id;
    callConversationId = mirror.conversations[0]?.id ?? null;
  }

  if (!calleeAccountId) {
    throw new Error('No valid callee account found');
  }

  // Validate taskId if provided (compare against the actual contact used for the call)
  if (taskId) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { contactId: true },
    });
    if (!task || task.contactId !== callContactId) {
      throw new Error('Task does not belong to this contact');
    }
  }

  // Get or create conversation (use mirror's conversation if business dialing)
  let conversation;
  if (callConversationId) {
    conversation = await prisma.conversation.findUnique({
      where: { id: callConversationId },
      select: { id: true },
    });
  }
  if (!conversation) {
    conversation = await prisma.conversation.findFirst({
      where: { contactId: callContactId },
      select: { id: true },
    });
  }
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        contactId: callContactId,
        title: `Chat with ${contact.name}`,
      },
    });
  }

  // Check if callee is online
  const online = isOnline(calleeAccountId);

  if (!online) {
    // Create missed call
    const call = await prisma.call.create({
      data: {
        status: 'missed',
        contactId: callContactId,
        calleeAccountId,
        conversationId: conversation.id,
        from: dialerRole === 'individual' ? 'agent' : calleeAccountId,
        to: calleeAccountId,
        taskId,
        individualId,
        businessId,
        initiatedBy: dialerRole,
      },
    });

    return { call, status: 'missed' };
  }

  // Create ringing call
  const call = await prisma.call.create({
    data: {
      status: 'ringing',
      ringingAt: new Date(),
      contactId: callContactId,
      calleeAccountId,
      conversationId: conversation.id,
      from: dialerRole === 'individual' ? 'agent' : calleeAccountId,
      to: calleeAccountId,
      taskId,
      individualId,
      businessId,
      initiatedBy: dialerRole,
    },
  });

  // Get caller name
  const caller = await prisma.account.findUnique({
    where: { id: dialerId },
    select: { name: true },
  });

  // Get task context if provided
  const taskContext = taskId ? await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, title: true, description: true },
  }) : null;

  // Send incoming call notification to callee
  const delivered = sendToAccount(calleeAccountId, {
    type: 'incoming_call',
    callId: call.id,
    callerName: caller?.name || 'Unknown',
    taskContext: taskContext ? {
      taskId: taskContext.id,
      title: taskContext.title,
      description: taskContext.description,
    } : null,
  });

  // Start timeout to auto-miss after 25 seconds
  setTimeout(async () => {
    const updatedCall = await prisma.call.findUnique({
      where: { id: call.id },
      select: { status: true },
    });

    if (updatedCall?.status === 'ringing') {
      await prisma.call.update({
        where: { id: call.id },
        data: { status: 'missed' },
      });

      sendToAccount(dialerId, {
        type: 'call_status',
        callId: call.id,
        status: 'missed',
      });

      logger.info({ callId: call.id }, 'Call automatically marked as missed after timeout');
    }
  }, 25000);

  return { call, status: 'ringing', delivered };
}

/**
 * Accept a call as a specific role.
 */
export async function acceptCallAs(callId: string, accountId: string, role: CallRole) {
  const call = await prisma.call.findUnique({
    where: { id: callId },
    select: {
      calleeAccountId: true,
      status: true,
      conversationId: true,
      startedAt: true,
      individualId: true,
      businessId: true,
      initiatedBy: true,
    },
  });

  if (!call) {
    throw new Error('Call not found');
  }

  // Verify the account is the recipient using calleeAccountId
  if (call.calleeAccountId !== accountId) {
    throw new Error('You can only accept calls directed at you');
  }

  // Re-check that both parties still have each other as contacts
  // (covers case where contact was deleted while call was ringing)
  const initiatorId = initiatorIdOf(call);
  if (initiatorId && !(await isContact(initiatorId, accountId))) {
    throw new NotInContactsError();
  }

  if (call.status !== 'ringing' && call.status !== 'in-progress') {
    throw new Error(`Call is not in ringing state (status: ${call.status})`);
  }

  // Update to in-progress
  await prisma.call.update({
    where: { id: callId },
    data: {
      status: 'in-progress',
      acceptedAt: new Date(),
      startedAt: call.startedAt || new Date(),
    },
  });

  // Notify the initiator
  if (initiatorId) {
    sendToAccount(initiatorId, {
      type: 'call_status',
      callId,
      status: 'in-progress',
    });
  }

  return { status: 'in-progress' };
}

/**
 * Decline a call as a specific role.
 */
export async function declineCallAs(callId: string, accountId: string, role: CallRole) {
  const call = await prisma.call.findUnique({
    where: { id: callId },
    select: {
      calleeAccountId: true,
      status: true,
      conversationId: true,
      individualId: true,
      businessId: true,
      initiatedBy: true,
    },
  });

  if (!call) {
    throw new Error('Call not found');
  }

  // Verify the account is the recipient
  const recipientId = recipientIdOf(call);
  if (recipientId !== accountId) {
    throw new Error('You can only decline calls directed at you');
  }

  if (call.status !== 'ringing') {
    throw new Error('Call is not in ringing state');
  }

  await prisma.call.update({
    where: { id: callId },
    data: { status: 'declined' },
  });

  // Notify the initiator
  const initiatorId = initiatorIdOf(call);
  if (initiatorId) {
    sendToAccount(initiatorId, {
      type: 'call_status',
      callId,
      status: 'declined',
    });
  }

  return { status: 'declined' };
}
