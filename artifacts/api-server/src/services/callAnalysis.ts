import { prisma } from "@workspace/db-prisma";
import { generateOrchestratorText, type OrchestratorTextTurn } from "./nebiusText";
import { logger } from "../lib/logger";
import { slugify, normalizeKnowledgeKey } from "../lib/utils";
import { extractJsonObject } from "../lib/extractJson";
import { notifyOwnerOfQuestion } from "./questionNotify";
import { buildOwnerInfoBlock, type OwnerInfoFact } from "./ownerInfo";
import { renderRulesBlock, type ApprovalRuleLite } from "./approvalRules";

export function buildCallTimeContext(tz: string, now = new Date()): string {
  const defaultTz = process.env.DEFAULT_TIMEZONE || "Asia/Kolkata";
  const effectiveTz = (() => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return tz;
    } catch {
      return defaultTz;
    }
  })();

  const dateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: effectiveTz, weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeFormatter = new Intl.DateTimeFormat("en-US", { timeZone: effectiveTz, hour: "numeric", minute: "numeric", hour12: true });
  const tzFormatter = new Intl.DateTimeFormat("en-US", { timeZone: effectiveTz, timeZoneName: "long" });

  const dateStr = dateFormatter.format(now);
  const timeStr = timeFormatter.format(now);
  const tzName = tzFormatter.formatToParts(now).find((p) => p.type === "timeZoneName")?.value || effectiveTz;

  return `CURRENT DATE AND TIME: ${dateStr}, ${timeStr} (${tzName}). Resolve "today/tomorrow/next Tuesday" against this and repeat the exact calendar date back to confirm.`;
}

function buildBaseCallInstruction(
  contactName: string,
  knowledgeFacts: Array<{ category: string; key: string; value: string }> = [],
  taskContext: {
    title: string;
    description: string | null;
    kind?: string;
    dueDate?: Date | null;
    appointment?: { title: string; dueDate: Date | null; ref?: string } | null;
    meta?: Record<string, unknown> | null;
  } | null = null,
  timezone: string
): string {
  const knowledgeBlock =
    knowledgeFacts.length > 0
      ? "\n\nWhat you already know about this contact:\n" +
        knowledgeFacts.map((f) => `- (${f.category}) ${f.key}: ${f.value}`).join("\n") +
        "\n\nUse these facts when relevant instead of asking the other person to repeat them. They were noted from earlier conversations and may be out of date: if the other person contradicts one, accept their version, do not argue, and mention the discrepancy in your end_call summary."
      : "";

  function buildTaskBlock(t: NonNullable<typeof taskContext>, tz: string): string {
    const when = (d?: Date | null) => d ? new Intl.DateTimeFormat("en-US", { timeZone: tz, dateStyle: "full", timeStyle: "short" }).format(d) : "";
    const base = `\n\nTHE REASON FOR THIS CALL: "${t.title}"` + (t.description ? ` — ${t.description}` : "") + ". ";
    if (t.kind === "follow_up")
      return base + "The business promised something. Ask for the status, get a firm new date AND time if it is not done, and do not re-explain the whole background.";
    if (t.appointment)
      return base + `This concerns the existing appointment "${t.appointment.title}" on ${when(t.appointment.dueDate)}` +
        (t.appointment.ref ? ` (reference ${t.appointment.ref})` : "") + ". Reschedule or cancel THAT booking, not a new one.";
    return base + "Get straight to this and keep the conversation focused on it.";
  }

  const taskBlock = taskContext ? buildTaskBlock(taskContext, timezone) : "";

  const timeContext = buildCallTimeContext(timezone);

  return (
    timeContext +
      "\n\n" +
      "Reply in whatever language the other person speaks (English, Hindi, Odia).\n\n" +
      "GETTING PRECISE INFORMATION: If the call involves scheduling, rescheduling, or referencing any " +
      "appointment or follow-up, always pin down an exact date AND time before moving on — never accept " +
      "a vague answer like \"sometime next week,\" \"in the morning,\" or \"I'll get back to you\" without " +
      "a direct follow-up asking for a specific day and time. The same applies to any other detail you " +
      "need to act on — reference numbers, claim or order IDs, addresses, names — ask for the exact value " +
      "rather than accepting a vague or partial one. If the other person genuinely doesn't have it on hand, " +
      "confirm that plainly (so it's clear it was asked and unavailable, not skipped) before moving on.\n\n" +
      "SCHEDULING TOOLS: When the other person offers a specific day and time, call check_availability BEFORE " +
      "accepting (say 'one moment' first). If it says free, call hold_slot, then confirm the slot out loud and " +
      "repeat the exact date and time. If it says busy, politely decline that time and offer the alternatives it " +
      "returned (read the 'spoken' field). If it says outsideUsualHours, or calendarChecked is false, do NOT " +
      "accept on your own: use ask_user. If a tool returns an error, retry once with a corrected startsAt " +
      "(ISO 8601 with UTC offset), then fall back to ask_user. Use the exact time you held as confirmedAt in end_call.\n\n" +
      "Never agree to a fee, deposit or cancellation charge, or to a time that check_availability has not " +
      "reported as free. Say 'one moment', call ask_user, and use its answer. If it returns USER_UNAVAILABLE, tell " +
      "them you'll call back, then call end_call with outcome needs_user.\n\n" +
      "ENDING THE CALL: This call has a natural end point — don't drag it out. As soon as the purpose " +
      "of the call is resolved (the other person has said goodbye, confirmed there's nothing else, " +
      "or the conversation has clearly wound down), say a brief, warm goodbye and then call the " +
      "end_call function immediately in the same turn — do not keep chatting, ask another open-ended " +
      "question, or wait for further confirmation first. If the other person explicitly asks to end " +
      "the call or hang up, do the same right away. Never call end_call before you've said goodbye out loud. " +
      "CLOSING CHECKLIST: Before saying goodbye on a booked, rescheduled or info_gathered call, ask ONCE, in one short turn: what to bring, any fee or deposit and its deadline, any form to submit, arrival time and place, a reference number, and any callback they promised and by when. You may NOTE a fee they state, but never agree to it. Put each answer in end_call: followUps entries, confirmationRef, and the exact confirmedAt." +
      taskBlock +
      knowledgeBlock
  );
}

function buildCallIntro(onBehalfOfName: string, contactName: string, direction: "inbound" | "outbound"): string {
  const action = direction === "inbound" ? "taking a call" : "calling";
  return (
    `You are Phone Agent, an intelligent voice assistant ${action} on behalf of ${onBehalfOfName}, ` +
    `speaking with ${contactName}. At the start say you are an AI assistant calling on behalf of ${onBehalfOfName}. ` +
    "Be warm, but direct and concise — this is a live phone conversation, not an email. Get to the point quickly, " +
    "don't pad your sentences with filler, and don't repeat back what the other person just said. If you don't have " +
    "enough information to commit to something, or the other person can't give you something you need " +
    "(e.g. a reference number or ID you don't have), say plainly that you'll need to check with " +
    `${onBehalfOfName} and get back to them — don't guess or invent details.\n\n`
  );
}

export function buildInboundCallSystemInstruction(
  onBehalfOfName: string,
  contactName: string,
  knowledgeFacts: Array<{ category: string; key: string; value: string }> = [],
  taskContext: {
    title: string;
    description: string | null;
    kind?: string;
    dueDate?: Date | null;
    appointment?: { title: string; dueDate: Date | null; ref?: string } | null;
    meta?: Record<string, unknown> | null;
  } | null = null,
  timezone: string
): string {
  const intro = buildCallIntro(onBehalfOfName, contactName, "inbound");
  const baseInstruction = buildBaseCallInstruction(contactName, knowledgeFacts, taskContext, timezone);
  return intro + baseInstruction;
}

export function buildOutboundCallSystemInstruction(
  onBehalfOfName: string,
  calleeName: string,
  knowledgeFacts: Array<{ category: string; key: string; value: string }> = [],
  taskContext: {
    title: string;
    description: string | null;
    kind?: string;
    dueDate?: Date | null;
    appointment?: { title: string; dueDate: Date | null; ref?: string } | null;
    meta?: Record<string, unknown> | null;
  } | null = null,
  timezone: string
): string {
  const intro = buildCallIntro(onBehalfOfName, calleeName, "outbound");
  const baseInstruction = buildBaseCallInstruction(calleeName, knowledgeFacts, taskContext, timezone);
  return intro + baseInstruction;
}

/**
 * v11: Agent call system instruction with strict role separation.
 * The AI agent ALWAYS speaks for the individual, never for the business.
 */
export function buildAgentCallSystemInstruction({
  individualName,
  businessName,
  direction,
  knowledgeFacts = [],
  taskContext = null,
  timezone,
  ownerInfo = [],
  memoryBlock = '',
  agentMode = false,
  approvalRules = [],
  lessonsBlock = '',
  contactId,
}: {
  individualName: string;
  businessName: string;
  direction: 'inbound' | 'outbound';
  knowledgeFacts?: Array<{ category: string; key: string; value: string }>;
  taskContext?: {
    title: string;
    description: string | null;
    kind?: string;
    dueDate?: Date | null;
    appointment?: { title: string; dueDate: Date | null; ref?: string } | null;
    meta?: Record<string, unknown> | null;
  } | null;
  timezone: string;
  ownerInfo?: OwnerInfoFact[];
  /** Output of renderMemoryBlock(); history of earlier calls. Added to, never replaces, the rules. */
  memoryBlock?: string;
  /** Owner turned on agent mode: they are not on the line and cannot be asked mid-call. */
  agentMode?: boolean;
  /** Standing rules; only rendered in agent mode. */
  approvalRules?: ApprovalRuleLite[];
  /** Output of renderLessonsBlock(): soft hints learned from earlier calls. */
  lessonsBlock?: string;
  /** Lets contact-specific rules be filtered to this contact. */
  contactId?: string;
}): string {
  const action = direction === 'inbound' ? 'taking a call' : 'calling';
  const intro =
    `You are Phone Agent, an intelligent voice assistant ${action} on behalf of ${individualName}, ` +
    `speaking with ${businessName}. ` +
    (direction === 'outbound'
      ? `At the start say you are an AI assistant calling on behalf of ${individualName}. `
      : '') +
    `IMPORTANT: You represent ONLY ${individualName} — never speak as if you are ${businessName} or represent them. ` +
    `${businessName} is the human on the other end of the line; ${individualName} is the human you represent. ` +
    `Be warm, but direct and concise — this is a live phone conversation, not an email. Get to the point quickly, ` +
    `don't pad your sentences with filler, and don't repeat back what the other person just said. If you don't have ` +
    `enough information to commit to something, or the other person can't give you something you need ` +
    `(e.g. a reference number or ID you don't have), say plainly that you'll need to check with ` +
    `${individualName} and get back to them — don't guess or invent details.\n\n`;

  const baseInstruction = buildBaseCallInstruction(businessName, knowledgeFacts, taskContext, timezone);
  return (
    intro +
    baseInstruction +
    memoryBlock +
    buildOwnerInfoBlock(individualName, ownerInfo) +
    lessonsBlock +
    buildHandoffBlock(individualName) +
    buildAgentModeBlock(individualName, agentMode, approvalRules, contactId)
  );
}

/** When the agent should bring the owner onto the line instead of only asking them a question. */
function buildHandoffBlock(individualName: string): string {
  return (
    `\n\nLIVE HANDOFF: if the stakes are high, call request_human_handoff so ${individualName} can speak to the other person ` +
    `directly. Use it when a rule tells you to, when the other person insists on speaking with ${individualName} or on an ` +
    `identity check you cannot pass, or when a payment or commitment is above what you are allowed to agree to. Say ` +
    `"one moment, I'm connecting ${individualName}" first. If it returns owner_joined, say nothing more until told ` +
    `${individualName} has left. If it returns owner_unavailable, do not agree to anything: say ${individualName} will ` +
    `follow up and end the call with outcome needs_user. For ordinary questions, keep using ask_user.`
  );
}

/**
 * Extra rules when the owner is not available (agent mode). Empty string when agent mode is off,
 * so the normal prompt is unchanged.
 */
function buildAgentModeBlock(
  individualName: string,
  agentMode: boolean,
  approvalRules: ApprovalRuleLite[] = [],
  contactId?: string,
): string {
  if (!agentMode) return '';
  return (
    `\n\nAUTONOMOUS MODE: ${individualName} is NOT available during this call and cannot be asked questions, ` +
    `so ask_user will return USER_UNAVAILABLE straight away. Handle everything you can from the facts above. ` +
    `Never agree to a fee, deposit, payment, cancellation charge or any commitment that was not already approved. ` +
    `The one exception is a time slot: you may accept it when check_availability reports it free and calendarChecked is true. ` +
    `Never share personal details beyond what is listed above. When something needs ${individualName}'s decision, ` +
    `say you will check with them and get back, then call end_call with outcome needs_user and a summary of exactly what is needed.` +
    renderRulesBlock(approvalRules, individualName, contactId)
  );
}

/**
 * Runs once per completed call. Reads the full transcript (Message rows
 * linked to this Call) and decides whether the agent needs to escalate to
 * the user, same decision shape as the old email flow.
 */
export async function analyzeCallForEscalation(callId: string): Promise<void> {
  const call = await prisma.call.findUnique({ where: { id: callId } });
  if (!call) return;

  if (call.outcome === "booked" || call.outcome === "rescheduled" || call.outcome === "cancelled" || call.outcome === "info_gathered") {
    await prisma.call.update({ where: { id: callId }, data: { isEnoughKnowledge: true } });
    return;
  }

  const existingQuery = await prisma.query.findFirst({ where: { callId } });
  if (existingQuery) {
    // A pending or expired query counts as not enough knowledge
    const isResolved = existingQuery.status === "answered" || existingQuery.status === "dismissed";
    await prisma.call.update({ where: { id: callId }, data: { isEnoughKnowledge: isResolved } });
    return;
  }

  if (call.outcome === "needs_user" && call.outcomeSummary) {
    const contact = await prisma.account.findUnique({ where: { id: call.contactId } });
    const query = await prisma.query.create({
      data: {
        question: call.outcomeSummary,
        status: "pending",
        conversationId: call.conversationId,
        contactId: call.contactId,
        isKnowledgeGap: true,
        callId: call.id,
        knowledgeKey: normalizeKnowledgeKey(call.outcomeSummary),
        knowledgeCategory: "fact",
      },
    });
    await prisma.call.update({ where: { id: callId }, data: { isEnoughKnowledge: false } });
    if (contact?.ownerId) {
      await notifyOwnerOfQuestion({
        ownerId: contact.ownerId,
        question: call.outcomeSummary,
        queryId: query.id,
        contactId: call.contactId,
      });
    }
  }

  const turns = await prisma.message.findMany({
    where: { callId },
    orderBy: { createdAt: "asc" },
  });

  if (turns.length === 0) {
    await prisma.call.update({ where: { id: callId }, data: { isEnoughKnowledge: true } });
    return;
  }

  const contact = await prisma.account.findUnique({ where: { id: call.contactId } });
  const facts = await prisma.contactKnowledge.findMany({
    where: { contactId: call.contactId, status: "active" },
    orderBy: { category: "asc" },
  });
  const task = call.taskId
    ? await prisma.task.findUnique({ where: { id: call.taskId }, select: { title: true, description: true } })
    : null;

  const knowledgeBlock =
    facts.length > 0
      ? "\n\nWhat the agent already knew about this contact:\n" +
        facts.map((f) => `- (${f.category}) ${f.key}: ${f.value}`).join("\n")
      : "";
  const existingKeys = facts.map((f) => f.key).join(", ");
  const taskBlock = task
    ? `\n\nTHE GOAL OF THIS CALL: "${task.title}"` + (task.description ? ` — ${task.description}` : "") +
      "\nJudge \"did the agent get what it needed\" against this goal."
    : "";

  // On a call, "user" rows are the external contact and "assistant" rows are the agent.
  // Label the speakers inside the text so the roles can't be misread.
  const transcript = turns
    .map((m) => `${m.role === "assistant" ? "AGENT" : "CONTACT"}: ${m.content}`)
    .join("\n");
  const orchestratorTurns: OrchestratorTextTurn[] = [{ role: "user", content: `Call transcript:\n${transcript}` }];

  // Deterministic fallback: check transcript for unresolved escalation patterns
  function extractFallbackQuestionFromTranscript(t: string): string | null {
    const lower = t.toLowerCase();
    // Pattern: "I will need to check with [name] and get back to you regarding [topic]"
    const checkWithMatch = t.match(/i will need to check with \w+ and get back to you regarding (.+?)(?:\.|$)/i);
    if (checkWithMatch) {
      const topic = checkWithMatch[1].trim();
      return `What is ${topic}?`;
    }
    // Pattern: "Is there a gate code or security desk at the building?"
    if (lower.includes("gate code") || lower.includes("security desk") || lower.includes("building access")) {
      if (lower.includes("gate code")) return "What is the gate code?";
      if (lower.includes("security desk")) return "Is there a security desk at the building?";
      return "What is the building access procedure?";
    }
    // Pattern: "check with [name] regarding [topic]"
    const checkRegardingMatch = t.match(/check with \w+ regarding (.+?)(?:\.|$)/i);
    if (checkRegardingMatch) {
      const topic = checkRegardingMatch[1].trim();
      return `What is ${topic}?`;
    }
    return null;
  }

  const systemText =
    "You are reviewing the transcript of a phone call your voice agent just completed on behalf of " +
    `your user, with ${contact?.name ?? "a contact"}. AGENT is the voice agent; CONTACT is the external person. Decide TWO things:\n\n` +
    "1. Did the agent get everything it needed during the call, or does it need to escalate something to your user?\n" +
    "   - Set isEnoughKnowledge to FALSE if the agent said it needs to check with the user, ask the user later, or get back to the contact after checking.\n" +
    "   - Set isEnoughKnowledge to FALSE if the contact asked a question the agent couldn't answer (e.g., gate code, building access, specific details the agent doesn't know).\n" +
    "   - Set isEnoughKnowledge to TRUE only if the call concluded with a clear outcome or all necessary information was exchanged.\n" +
    "2. What was the outcome of the call? (booked, rescheduled, cancelled, info_gathered, needs_user, failed)\n\n" +
    (existingKeys ? `Existing knowledge keys for this contact: ${existingKeys}. If the gap is about an existing key, reuse it.\n\n` : "") +
    "If you need to create a new knowledge key, use a short snake_case key (3-41 characters, starts with a letter, only lowercase letters, numbers, and underscores).\n\n" +
    "When isEnoughKnowledge is false, provide a specific escalationQuestion that asks the user exactly what information is needed.\n" +
    "Examples:\n" +
    '  - "What is the gate code for the building?"\n' +
    '  - "Is there a security desk at the building?"\n' +
    '  - "What is the building access procedure?"\n' +
    '  - "Are there any parking instructions?"\n\n' +
    "Return ONLY a JSON object, no markdown fences:\n" +
    "{\n" +
    '  "isEnoughKnowledge": boolean,   // REQUIRED\n' +
    '  "escalationQuestion": string | null,  // If isEnoughKnowledge is false, ask the specific question the user needs to answer\n' +
    '  "knowledgeKey": string | null,\n' +
    '  "knowledgeCategory": string | null,\n' +
    '  "outcome": "booked" | "rescheduled" | "cancelled" | "info_gathered" | "needs_user" | "failed" | null\n' +
    "}" +
    taskBlock +
    knowledgeBlock;

  const validOutcomes = ["booked", "rescheduled", "cancelled", "info_gathered", "needs_user", "failed"] as const;
  let decided = false;
  let isEnoughKnowledge = true;
  let escalationQuestion: string | null = null;
  let knowledgeKey: string | null = null;
  let knowledgeCategory: string | null = null;
  let llmOutcome: string | null = null;

  for (let attempt = 0; attempt < 2 && !decided; attempt++) {
    try {
      const { text } = await generateOrchestratorText({
        systemInstructionText: systemText,
        turns: orchestratorTurns,
        jsonResponse: true,
        temperature: 0.1,
        maxTokens: 1500,
        purpose: "call_analysis",
      });
      const parsed = extractJsonObject(text) as {
        isEnoughKnowledge?: unknown;
        escalationQuestion?: unknown;
        knowledgeKey?: unknown;
        knowledgeCategory?: unknown;
        outcome?: unknown;
      };
      // A missing verdict is a failed parse, not "enough knowledge".
      if (typeof parsed.isEnoughKnowledge !== "boolean") {
        throw new SyntaxError("isEnoughKnowledge missing or not a boolean");
      }
      isEnoughKnowledge = parsed.isEnoughKnowledge;
      if (!isEnoughKnowledge) {
        escalationQuestion =
          (typeof parsed.escalationQuestion === "string" && parsed.escalationQuestion.trim()) ||
          `The call with ${contact?.name ?? "the contact"} needs your input — can you review the transcript?`;
        knowledgeKey = normalizeKnowledgeKey((typeof parsed.knowledgeKey === "string" && parsed.knowledgeKey) || escalationQuestion);
        knowledgeCategory = (typeof parsed.knowledgeCategory === "string" && parsed.knowledgeCategory.trim()) || "fact";
      }
      llmOutcome =
        typeof parsed.outcome === "string" && (validOutcomes as readonly string[]).includes(parsed.outcome)
          ? parsed.outcome
          : null;
      decided = true;
    } catch (err) {
      logger.warn({ err, callId, attempt }, "callAnalysis: failed to get a valid escalation decision");
    }
  }

  if (!decided) {
    // Both attempts failed: try deterministic fallback from transcript
    const fallbackQuestion = extractFallbackQuestionFromTranscript(transcript);
    if (fallbackQuestion) {
      isEnoughKnowledge = false;
      escalationQuestion = fallbackQuestion;
      knowledgeKey = normalizeKnowledgeKey(fallbackQuestion);
      knowledgeCategory = "fact";
      logger.info({ callId, fallbackQuestion }, "callAnalysis: using deterministic fallback from transcript");
    } else {
      // No fallback found: ask the owner to look
      isEnoughKnowledge = false;
      escalationQuestion = `The call with ${contact?.name ?? "the contact"} could not be analysed automatically — can you review the transcript?`;
      knowledgeKey = null;
      knowledgeCategory = null;
      logger.error({ callId }, "callAnalysis: analysis failed twice, escalating for manual review");
    }
  }

  await prisma.call.update({
    where: { id: callId },
    data: {
      isEnoughKnowledge,
      // Only fill the outcome if the agent didn't report one; callLifecycle applies it to the task afterwards.
      outcome: call.outcome || llmOutcome,
    },
  });

  if (!isEnoughKnowledge && escalationQuestion) {
    // Check for existing pending question to avoid duplicates
    // First check by callId to prevent duplicates for the same call
    const existingByCall = await prisma.query.findFirst({ where: { callId: call.id, status: "pending" } });
    // Then check by knowledgeKey or question text with contactId
    const existingByKeyOrText = knowledgeKey
      ? await prisma.query.findFirst({ where: { knowledgeKey, status: "pending", contactId: call.contactId } })
      : await prisma.query.findFirst({ where: { question: escalationQuestion, status: "pending", contactId: call.contactId } });
    const existing = existingByCall || existingByKeyOrText;

    if (!existing) {
      const query = await prisma.query.create({
        data: {
          question: escalationQuestion,
          status: "pending",
          conversationId: call.conversationId,
          contactId: call.contactId,
          isKnowledgeGap: true,
          knowledgeKey,
          knowledgeCategory,
          callId: call.id,
        },
      });
      logger.info({ callId, question: escalationQuestion }, "callAnalysis: created escalation query");

      if (contact?.ownerId) {
        await notifyOwnerOfQuestion({
          ownerId: contact.ownerId,
          question: escalationQuestion,
          queryId: query.id,
          contactId: call.contactId,
        });
      }
    }
  }
}

/**
 * Analyze a call against its task goal. Returns goal metrics for quality scoring.
 */
export async function analyzeCallGoal(callId: string): Promise<{
  goalAchieved: boolean;
  goalScore: number;
  missReason: string | null;
}> {
  const call = await prisma.call.findUnique({
    where: { id: callId },
    select: {
      outcome: true,
      durationSec: true,
      taskId: true,
      conversationId: true,
    },
  });

  if (!call) {
    return { goalAchieved: false, goalScore: 0, missReason: "call_not_found" };
  }

  if (!call.taskId) {
    // No task: score based on outcome only
    const goalScore = call.outcome === "booked" ? 80 : call.outcome === "rescheduled" ? 70 : call.outcome === "info_gathered" ? 60 : 40;
    return { goalAchieved: call.outcome === "booked", goalScore, missReason: null };
  }

  const task = await prisma.task.findUnique({
    where: { id: call.taskId },
    select: {
      title: true,
      description: true,
      kind: true,
      dueDate: true,
    },
  });

  if (!task) {
    return { goalAchieved: false, goalScore: 0, missReason: "task_not_found" };
  }

  // Analyze based on task kind and outcome
  let goalAchieved = false;
  let goalScore = 50;
  let missReason: string | null = null;

  if (task.kind === "appointment") {
    if (call.outcome === "booked" || call.outcome === "rescheduled") {
      goalAchieved = true;
      goalScore = 90;
    } else if (call.outcome === "needs_user") {
      goalScore = 40;
      missReason = "gave_up_early";
    } else if (call.outcome === "failed") {
      goalScore = 20;
      missReason = "unclear";
    }
  } else if (task.kind === "follow_up") {
    if (call.outcome === "info_gathered") {
      goalAchieved = true;
      goalScore = 85;
    } else if (call.outcome === "needs_user") {
      goalScore = 45;
      missReason = "gave_up_early";
    } else if (call.outcome === "failed") {
      goalScore = 25;
      missReason = "unclear";
    }
  } else if (task.kind === "pay") {
    if (call.outcome === "booked") {
      goalAchieved = true;
      goalScore = 90;
    } else if (call.outcome === "needs_user") {
      goalScore = 30;
      missReason = "fee_not_escalated";
    } else if (call.outcome === "failed") {
      goalScore = 20;
      missReason = "unclear";
    }
  } else {
    // Generic tasks
    if (call.outcome === "booked" || call.outcome === "info_gathered") {
      goalAchieved = true;
      goalScore = 80;
    } else if (call.outcome === "needs_user") {
      goalScore = 40;
      missReason = "gave_up_early";
    } else if (call.outcome === "failed") {
      goalScore = 20;
      missReason = "unclear";
    }
  }

  // Duration penalty: too short suggests rushed, too long suggests rambling
  if (call.durationSec) {
    if (call.durationSec < 15) {
      goalScore -= 20;
      missReason = "gave_up_early";
    } else if (call.durationSec > 600) {
      goalScore -= 10;
    }
  }

  return { goalAchieved, goalScore: Math.max(0, Math.min(100, goalScore)), missReason };
}