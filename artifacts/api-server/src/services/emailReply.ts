/**
 * Auto-reply generation for inbound email — the email-channel equivalent of
 * what the Gemini Live bridge does turn-by-turn on a phone call, except
 * email is one full message at a time rather than streaming audio.
 */

import { prisma } from "@workspace/db-prisma";
import { generateGeminiText, type GeminiTextTurn } from "./geminiText";
import { logger } from "../lib/logger";

type EmailReplyDecision = {
  needsEscalation: boolean;
  replyBody: string;
  escalationQuestion: string | null;
};

export async function generateEmailReply(params: {
  conversationId: string;
  contactId: string;
  contactName: string;
  incomingSubject: string;
  incomingBody: string;
}): Promise<{ subject: string; body: string; needsEscalation: boolean; escalationQuestion: string | null; isEnoughKnowledge: boolean }> {
  const facts = await prisma.contactKnowledge.findMany({
    where: { contactId: params.contactId, status: "active" },
    orderBy: { category: "asc" },
  });
  const knowledgeBlock =
    facts.length > 0
      ? "\n\nWhat you already know about this contact:\n" +
        facts.map((f) => `- (${f.category}) ${f.key}: ${f.value}`).join("\n")
      : "";

  // Pull recent conversation history (any channel — chat, call transcript,
  // or prior emails) so the reply has full context, not just this one email.
  const priorMessages = await prisma.message.findMany({
    where: { conversationId: params.conversationId },
    orderBy: { createdAt: "asc" },
    take: 40,
  });

  const turns: GeminiTextTurn[] = priorMessages.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));
  turns.push({
    role: "user",
    content: `[Incoming email — subject: "${params.incomingSubject}"]\n\n${params.incomingBody}`,
  });

  const decision = await generateEmailReplyDecision({
    contactName: params.contactName,
    knowledgeBlock,
    turns,
    incomingSubject: params.incomingSubject,
    incomingBody: params.incomingBody,
  });

  const subject = params.incomingSubject.toLowerCase().startsWith("re:")
    ? params.incomingSubject
    : `Re: ${params.incomingSubject}`;

  return {
    subject,
    body: decision.replyBody,
    needsEscalation: decision.needsEscalation,
    escalationQuestion: decision.escalationQuestion,
    isEnoughKnowledge: !decision.needsEscalation,
  };
}

/**
 * Two-step decision so the reply text can never disagree with whether we
 * escalated. Step 1 ONLY decides "can I answer confidently, and if not what
 * do I need to ask" — it does not write any email copy. Step 2 writes the
 * actual reply, but is handed step 1's decision as a hard constraint rather
 * than being asked to invent its own. This avoids the failure mode where a
 * single call writes a "checking with my user" style reply while separately
 * reporting needsEscalation: false, which silently drops the escalation.
 */
async function generateEmailReplyDecision(params: {
  contactName: string;
  knowledgeBlock: string;
  turns: GeminiTextTurn[];
  incomingSubject: string;
  incomingBody: string;
}): Promise<EmailReplyDecision> {
  const assessmentSystemText =
    "You are Phone Agent, an intelligent assistant that triages email on behalf of your user, " +
    `before any reply is written. You are looking at a conversation with ${params.contactName}, ` +
    "an external business contact, and the email they just sent.\n\n" +
    "Decide ONE thing: can you confidently and completely answer their latest email using ONLY " +
    "the conversation history and the knowledge below? Do not guess or assume favorable defaults — " +
    "if any fact needed for a complete answer is missing, you cannot answer confidently.\n\n" +
    "Return ONLY a JSON object, no markdown fences, no explanation:\n" +
    '{\n' +
    '  "canAnswerConfidently": boolean,\n' +
    '  "escalationQuestion": string | null  // if canAnswerConfidently is false, the specific question to ask YOUR USER (not the business) to get what\'s missing; null otherwise\n' +
    '}' +
    params.knowledgeBlock;

  const { text: assessmentText } = await generateGeminiText({
    systemInstructionText: assessmentSystemText,
    turns: params.turns,
    jsonResponse: true,
  });

  // Fallback question used whenever the model decides it needs to escalate
  // but doesn't hand back clean text for the question — we NEVER silently
  // downgrade a decided escalation back to "answerable", since that's what
  // caused replies to hedge with no Query ever getting created.
  const fallbackEscalationQuestion =
    `${params.contactName} emailed about "${params.incomingSubject}" and I don't have enough information ` +
    `to answer confidently. Can you review and let me know how to respond?\n\nTheir message:\n${params.incomingBody}`;

  let needsEscalation = false;
  let escalationQuestion: string | null = null;
  try {
    const parsed = JSON.parse(assessmentText) as {
      canAnswerConfidently?: boolean;
      escalationQuestion?: string | null;
    };
    needsEscalation = parsed.canAnswerConfidently === false;
    if (needsEscalation) {
      escalationQuestion =
        typeof parsed.escalationQuestion === "string" && parsed.escalationQuestion.trim().length > 0
          ? parsed.escalationQuestion
          : fallbackEscalationQuestion;
    }
  } catch {
    logger.warn({ assessmentText }, "emailReply: failed to parse assessment JSON, defaulting to answerable");
  }

  const replySystemText =
    "You are Phone Agent, an intelligent assistant replying by email on behalf of your user. " +
    `You are corresponding with ${params.contactName}, who is an external business contact. ` +
    "Your user is the person you represent.\n\n" +
    "Write a complete, professional email reply — a real greeting, a clear body, a sign-off. " +
    "Be conversational and natural, not robotic. No markdown, no bullet lists unless the content genuinely needs them.\n\n" +
    (needsEscalation
      ? "You have ALREADY determined you cannot answer this yet — you are waiting on your user for: " +
        `"${escalationQuestion}". Write ONLY a brief, polite holding reply to the business contact. ` +
        "Acknowledge their email and say you're checking on the specific detail and will follow up shortly. " +
        "Do NOT attempt to answer their question, do NOT guess, and do NOT ask the business contact for " +
        "the missing information — that question is for your user, handled separately."
      : "You have ALREADY determined you can answer this confidently. Write the complete, substantive answer " +
        "directly — do not hedge, do not say you'll check and get back to them, do not imply you need to " +
        "confirm anything further.") +
    params.knowledgeBlock;

  const { text: replyBody } = await generateGeminiText({
    systemInstructionText: replySystemText,
    turns: params.turns,
  });

  // Last-resort safety net: if the assessment said "confident" but the reply
  // it produced still reads like a holding email (ignoring the explicit
  // instruction not to hedge), treat it as an escalation anyway rather than
  // sending a "we'll get back to you" email with no Query behind it.
  if (!needsEscalation && looksLikeHoldingReply(replyBody)) {
    logger.warn(
      { replyBody },
      "emailReply: assessment said confident but reply text hedges — forcing escalation"
    );
    return { needsEscalation: true, replyBody, escalationQuestion: fallbackEscalationQuestion };
  }

  return { needsEscalation, replyBody, escalationQuestion };
}

const HOLDING_REPLY_PATTERNS = [
  /checking with my user/i,
  /check(ing)? with my (user|team)/i,
  /follow up (with you )?(shortly|soon|as soon as)/i,
  /will (get back to you|follow up)/i,
  /let me confirm/i,
  /confirm(ing)? (the )?(specific )?details/i,
];

function looksLikeHoldingReply(text: string): boolean {
  return HOLDING_REPLY_PATTERNS.some((pattern) => pattern.test(text));
}

export async function generateFollowUpEmailReply(params: {
  conversationId: string;
  contactId: string;
  contactName: string;
  originalSubject: string;
}): Promise<{ subject: string; body: string; isEnoughKnowledge: boolean }> {
  const facts = await prisma.contactKnowledge.findMany({
    where: { contactId: params.contactId, status: "active" },
    orderBy: { category: "asc" },
  });
  const knowledgeBlock =
    facts.length > 0
      ? "\n\nWhat you already know about this contact:\n" +
        facts.map((f) => `- (${f.category}) ${f.key}: ${f.value}`).join("\n")
      : "";

  // Pull recent conversation history including the user's answer
  const priorMessages = await prisma.message.findMany({
    where: { conversationId: params.conversationId },
    orderBy: { createdAt: "asc" },
    take: 40,
  });

  const turns: GeminiTextTurn[] = priorMessages.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));

  const systemInstructionText =
    "You are Phone Agent, an intelligent assistant replying by email on behalf of your user. " +
    `You are corresponding with ${params.contactName}, who is an external business contact. ` +
    "Your user has just provided an answer to a previous question. Write a follow-up email that provides this answer to the business contact.\n\n" +
    "CRITICAL INSTRUCTIONS:\n" +
    "1. READ the conversation history carefully to understand the context and the original question\n" +
    "2. Your user's answer is in the most recent message — use it to provide a complete, helpful response to the business\n" +
    "3. Be conversational and natural, not robotic\n" +
    "4. Write a complete, professional email reply — a real greeting, a clear body, a sign-off\n" +
    "5. No markdown, no bullet lists unless the content genuinely needs them" +
    knowledgeBlock;

  const { text } = await generateGeminiText({ systemInstructionText, turns });

  const subject = params.originalSubject.toLowerCase().startsWith("re:")
    ? params.originalSubject
    : `Re: ${params.originalSubject}`;

  return { subject, body: text, isEnoughKnowledge: true };
}