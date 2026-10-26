import { prisma } from '@workspace/db-prisma';
import { isOnline, sendToAccount } from './presence';
import { logger } from '../lib/logger';
import { isWithinAllowedWindow, DEFAULT_BUSINESS_HOURS, parseBusinessHours } from './schedulerPolicy';
import { loadClosureInfo } from './businessClosures';
import { handleAgentCallDeclined } from './declineHandling';

// Shared ringing timeout constant (default 30 seconds, override via env)
// This is used by the scheduler for bookkeeping; actual telephony timeout is provider-controlled
export const DEFAULT_RINGING_TIMEOUT_MS = 30000;
export const RINGING_TIMEOUT_MS = Number(process.env.RINGING_TIMEOUT_MS) || DEFAULT_RINGING_TIMEOUT_MS;

export type CallRole = 'individual' | 'business';

export class NotInContactsError extends Error {
  constructor(message = "You are not in the receiver's contact list") {
    super(message);
    this.name = 'NotInContactsError';
  }
}

export class AgentModeOffError extends Error {
  constructor(message = 'Agent mode is off') {
    super(message);
    this.name = 'AgentModeOffError';
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
  logger.info({ ownerId, targetId, hasContact: !!row }, 'hasContact check');
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
  logger.info({ 
    callerId, 
    receiverId, 
    callerHasReceiver, 
    receiverHasCaller,
    result: callerHasReceiver && receiverHasCaller 
  }, 'isContact: mutual check');
  return callerHasReceiver && receiverHasCaller;
}

/**
 * Master switch: has this individual turned on agent mode? (Account.agentMode, toggled via
 * PATCH /api/user/agent-mode.) Only individuals can have it on; business accounts never do.
 */
export async function isAgentModeOn(individualId: string): Promise<boolean> {
  const account = await prisma.account.findUnique({
    where: { id: individualId },
    select: { agentMode: true, isService: true },
  });
  return !!account && !account.isService && account.agentMode === true;
}

/**
 * RECEIVE side of the agent's call tools: does this individual let their AI agent pick up
 * incoming business calls itself? Same as agent mode.
 */
export async function agentWillAutoAnswer(individualId: string): Promise<boolean> {
  return isAgentModeOn(individualId);
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
    select: { 
      id: true,
      individualId: true,
      businessId: true,
    },
  });

  if (!call) return null;

  // Fetch account names for speaker display
  const [individualAccount, businessAccount] = await Promise.all([
    call.individualId ? prisma.account.findUnique({
      where: { id: call.individualId },
      select: { name: true },
    }) : null,
    call.businessId ? prisma.account.findUnique({
      where: { id: call.businessId },
      select: { name: true },
    }) : null,
  ]);

  const messages = await prisma.message.findMany({
    where: { callId },
    orderBy: { createdAt: 'asc' },
  });

  // Convert BigInt fields to strings for JSON serialization and map speaker to display names
  return messages.map(msg => ({
    ...msg,
    seq: msg.seq === null ? null : String(msg.seq),
    // Map speaker field to display names
    speakerName: msg.speaker === 'individual_agent' 
      ? `${individualAccount?.name || 'Agent'} (AI)` 
      : msg.speaker === 'business' 
      ? businessAccount?.name || 'Business'
      : msg.speaker === 'individual_owner'
      ? individualAccount?.name || 'Individual'
      : msg.speaker === 'system'
      ? 'System'
      : msg.speaker,
  }));
}

/**
 * Dial a call as a specific role.
 */
export async function dialCallAs(
  contactId: string,
  taskId: string | null,
  dialerId: string,
  dialerRole: CallRole,
  opts: { agent?: boolean } = {}
): Promise<{ call: any; status: 'missed' | 'ringing' | 'in-progress'; delivered?: boolean }> {
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

  // The agent may only dial on its own when the owner has agent mode on (server-side guard, so it
  // holds even if the toggle was switched off after the scheduler claimed the task).
  if (opts.agent) {
    if (dialerRole !== 'individual' || !(await isAgentModeOn(dialerId))) {
      throw new AgentModeOffError();
    }
  }

  // Determine the parties using linkedAccountId
  // For individual dialing: contact must belong to the individual
  // For business dialing: contact must belong to the business
  if (dialerRole === 'individual' && contact.ownerId !== dialerId) {
    throw new Error('Contact not found');
  }
  if (dialerRole === 'business' && contact.ownerId !== dialerId) {
    throw new Error('Contact does not belong to the business');
  }

  const otherId = contact.linkedAccountId;
  if (!otherId) throw new Error('This contact is not linked to an account');

  const other = await prisma.account.findUnique({ where: { id: otherId }, select: { isService: true } });
  if (!other) throw new Error('Linked account not found');

  // For business dialing: verify the business has this individual as a contact
  if (dialerRole === 'business') {
    // The contactId passed should be the business's mirror contact
    // Verify this contact belongs to the business dialing (already checked above)
    // The contact should have a linkedAccountId pointing to the individual (already checked above)
    // For business dialing, we only need the business to have the individual as a contact
    // (the individual doesn't need to have the business saved)
    // Skip mutual contact check for business dialing

    // Check business working hours and closures
    const business = await prisma.account.findUnique({
      where: { id: dialerId },
      select: { businessHoursJson: true, timezone: true, isService: true },
    });

    if (business && business.isService) {
      const now = new Date();
      const ownerTz = business.timezone || process.env.DEFAULT_TIMEZONE || "UTC";
      const hours = parseBusinessHours(business.businessHoursJson) ?? DEFAULT_BUSINESS_HOURS;

      // Load closures for this business
      const closureInfo = await loadClosureInfo([dialerId], now);
      const activeClosure = closureInfo.get(dialerId)?.active ?? null;
      const closures = activeClosure ? [{ startsAt: activeClosure.startsAt, endsAt: activeClosure.endsAt }] : [];

      const windowCheck = isWithinAllowedWindow(
        now,
        ownerTz,
        null, // quiet hours don't apply to business dialing
        null,
        hours,
        closures
      );

      if (!windowCheck.allowed) {
        if (activeClosure && activeClosure.blockCalls) {
          const error = new Error(activeClosure.message || 'Business is not taking calls right now');
          (error as any).code = 'BUSINESS_CLOSED';
          (error as any).reopensAt = activeClosure.endsAt?.toISOString() ?? null;
          (error as any).kind = activeClosure.kind;
          (error as any).label = activeClosure.label;
          throw error;
        }
        const error = new Error('Business is outside working hours');
        (error as any).code = 'BUSINESS_CLOSED';
        (error as any).reopensAt = windowCheck.nextAllowedTime?.toISOString() ?? null;
        throw error;
      }
    }
  } else {
    // For individual dialing: check mutual contacts
    const contactCheck = await isContact(dialerId, otherId);
    logger.info({
      dialerId,
      otherId,
      dialerRole,
      contactCheck,
    }, 'dialCallAs: mutual contact check');

    if (!contactCheck) {
      throw new NotInContactsError();
    }
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
    individualId = contact.linkedAccountId!; // The individual account this contact links to
    calleeAccountId = individualId;

    // Use the business's own mirror of this individual for the call
    // The contactId passed should already be the business's mirror
    const businessMirror = await prisma.account.findFirst({
      where: { id: contactId, ownerId: businessId, linkedAccountId: individualId, isService: true },
      include: { conversations: true },
    });
    if (!businessMirror) {
      throw new NotInContactsError();
    }
    callContactId = businessMirror.id;
    callConversationId = businessMirror.conversations[0]?.id ?? null;
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
    if (!task) {
      throw new Error('Task not found');
    }
    // For business dialing, the task should belong to the business's mirror contact
    // For individual dialing, the task should belong to the individual's contact
    if (task.contactId !== callContactId) {
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

  // Mark any previous ringing calls from the same dialer as missed
  // This ensures only the latest call shows Accept/Decline buttons
  // Agent-placed calls (several calendar events can fall on the same minute) must not hang up each
  // other's ringing calls to DIFFERENT businesses, so for those only supersede a ring to the same callee.
  const previousRingingCalls = await prisma.call.findMany({
    where: {
      status: 'ringing',
      ...(opts.agent ? { calleeAccountId } : {}),
      OR: [
        { individualId: dialerId },
        { businessId: dialerId },
      ],
    },
    select: { id: true, individualId: true, businessId: true },
  });

  if (previousRingingCalls.length > 0) {
    await prisma.call.updateMany({
      where: {
        id: { in: previousRingingCalls.map(c => c.id) },
      },
      data: { status: 'missed' },
    });

    // Notify the dialer about the status changes
    for (const call of previousRingingCalls) {
      sendToAccount(dialerId, {
        type: 'call_status_changed',
        callId: call.id,
        status: 'missed',
      });
    }
  }

  // A business calling an individual whose agent auto-answers: the call starts in-progress, no ring,
  // and the individual does not have to be online.
  const autoAnswer = dialerRole === 'business' && (await agentWillAutoAnswer(calleeAccountId));

  // Note: We removed the immediate "missed" check for offline callees.
  // Calls should always start as "ringing" regardless of online status.
  // The scheduler will mark them as "missed" after RINGING_TIMEOUT_MS if nobody accepts.
  // This ensures proper call flow and notification delivery.

  if (autoAnswer) {
    const answeredAt = new Date();
    const call = await prisma.call.create({
      data: {
        status: 'in-progress',
        ringingAt: answeredAt,
        acceptedAt: answeredAt,
        startedAt: answeredAt,
        contactId: callContactId,
        calleeAccountId,
        conversationId: conversation.id,
        from: calleeAccountId,
        to: calleeAccountId,
        taskId,
        individualId,
        businessId,
        initiatedBy: dialerRole,
        placedByAgent: opts.agent ?? false,
      },
    });

    const callerAccount = await prisma.account.findUnique({ where: { id: dialerId }, select: { name: true } });

    sendToAccount(dialerId, { type: 'call_created', callId: call.id });
    sendToAccount(dialerId, { type: 'call_status', callId: call.id, status: 'in-progress' });
    // Let the individual's open tabs know their agent just picked up (they can observe the transcript).
    sendToAccount(calleeAccountId, {
      type: 'agent_call',
      direction: 'inbound',
      callId: call.id,
      contactName: callerAccount?.name ?? null,
      title: null,
    });

    logger.info({ callId: call.id, individualId }, 'dialCallAs: agent auto-answered incoming business call');
    return { call, status: 'in-progress', delivered: online };
  }

  // Create ringing call with conditional update to prevent duplicates
  // Mark any existing ringing calls as missed first
  if (individualId && businessId) {
    await prisma.call.updateMany({
      where: {
        individualId,
        businessId,
        status: 'ringing',
      },
      data: { status: 'missed' },
    });
  }

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
      placedByAgent: opts.agent ?? false,
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
    select: { id: true, title: true, description: true, kind: true, dueDate: true, meta: true, parentTaskId: true },
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

  // Also notify the caller so their call list updates
  sendToAccount(dialerId, {
    type: 'call_created',
    callId: call.id,
  });

  // Note: Ringing timeout is handled by the scheduler sweep, not a local setTimeout

  return { call, status: 'ringing', delivered };
}

/**
 * Accept a call as a specific role.
 */
export async function acceptCallAs(callId: string, accountId: string, role: CallRole) {
  // Conditional update to handle race conditions
  const result = await prisma.call.updateMany({
    where: {
      id: callId,
      status: 'ringing',
    },
    data: {
      status: 'in-progress',
      acceptedAt: new Date(),
    },
  });

  if (result.count === 0) {
    // Someone else already accepted or declined
    const call = await prisma.call.findUnique({
      where: { id: callId },
      select: { status: true },
    });
    if (!call) {
      throw new Error('Call not found');
    }
    if (call.status === 'in-progress') {
      throw new Error('Call already accepted by another party');
    }
    if (call.status === 'declined') {
      throw new Error('Call already declined');
    }
    throw new Error(`Call is not in ringing state (status: ${call.status})`);
  }

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

  // Set startedAt if not already set
  if (!call.startedAt) {
    await prisma.call.update({
      where: { id: callId },
      data: {
        startedAt: new Date(),
      },
    });
  }

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
  // Conditional update to handle race conditions
  const result = await prisma.call.updateMany({
    where: {
      id: callId,
      status: 'ringing',
    },
    data: {
      status: 'declined',
    },
  });

  if (result.count === 0) {
    // Someone else already accepted or declined
    const call = await prisma.call.findUnique({
      where: { id: callId },
      select: { status: true },
    });
    if (!call) {
      throw new Error('Call not found');
    }
    if (call.status === 'in-progress') {
      throw new Error('Call already accepted');
    }
    if (call.status === 'declined') {
      throw new Error('Call already declined');
    }
    throw new Error(`Call is not in ringing state (status: ${call.status})`);
  }

  const call = await prisma.call.findUnique({
    where: { id: callId },
    select: {
      calleeAccountId: true,
      status: true,
      conversationId: true,
      individualId: true,
      businessId: true,
      initiatedBy: true,
      placedByAgent: true,
      taskId: true,
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

  // The agent placed this call: apply the owner's recall limit (or mark the business non-responsive).
  if (call.placedByAgent && call.taskId) {
    await handleAgentCallDeclined(callId);
  }

  return { status: 'declined' };
}
