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
}): Promise<{ subject: string; body: string; needsEscalation: boolean; escalationQuestion: string | null }> {
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

  const systemInstructionText =
    "You are Phone Agent, an intelligent assistant replying by email on behalf of your user. " +
    `You are corresponding with ${params.contactName}, who is an external business contact. ` +
    "Your user is the person you represent, and you should ask them questions, not the business.\n\n" +
    "CRITICAL INSTRUCTIONS:\n" +
    "1. READ the conversation history carefully to understand the context\n" +
    "2. If you can confidently answer the incoming email based on conversation history and knowledge, do so directly\n" +
    "3. If you CANNOT answer confidently because you lack information: send a polite holding reply to the business and formulate a question for YOUR USER (not the business)\n" +
    "4. NEVER ask the business contact for information that should come from your user\n" +
    "5. Be conversational and natural, not robotic\n" +
    "6. Write a complete, professional email reply — a real greeting, a clear body, a sign-off\n" +
    "7. No markdown, no bullet lists unless the content genuinely needs them" +
    knowledgeBlock;

  const decision = await generateEmailReplyDecision({ systemInstructionText, turns });

  const subject = params.incomingSubject.toLowerCase().startsWith("re:")
    ? params.incomingSubject
    : `Re: ${params.incomingSubject}`;

  return {
    subject,
    body: decision.replyBody,
    needsEscalation: decision.needsEscalation,
    escalationQuestion: decision.escalationQuestion,
  };
}

async function generateEmailReplyDecision(params: {
  systemInstructionText: string;
  turns: GeminiTextTurn[];
}): Promise<EmailReplyDecision> {
  const promptSystemText =
    params.systemInstructionText +
    "\n\nYou must return a JSON object with these exact fields:\n" +
    '{\n' +
    '  "needsEscalation": boolean,  // true if you need your user\'s input to answer, false if you can answer confidently\n' +
    '  "replyBody": string,         // the actual email reply to send to the business contact\n' +
    '  "escalationQuestion": string | null  // if needsEscalation is true, the specific question to ask your user; null otherwise\n' +
    '}\n\n' +
    'Return ONLY valid JSON — no markdown fences, no explanation.';

  const { text } = await generateGeminiText({
    systemInstructionText: promptSystemText,
    turns: params.turns,
    jsonResponse: true,
  });

  try {
    const parsed = JSON.parse(text) as EmailReplyDecision;
    return {
      needsEscalation: typeof parsed.needsEscalation === "boolean" ? parsed.needsEscalation : false,
      replyBody: typeof parsed.replyBody === "string" ? parsed.replyBody : text,
      escalationQuestion: typeof parsed.escalationQuestion === "string" ? parsed.escalationQuestion : null,
    };
  } catch {
    // Fallback if JSON parsing fails
    logger.warn({ text }, "emailReply: failed to parse JSON decision, using fallback");
    return {
      needsEscalation: false,
      replyBody: text,
      escalationQuestion: null,
    };
  }
}

export async function generateFollowUpEmailReply(params: {
  conversationId: string;
  contactId: string;
  contactName: string;
  originalSubject: string;
}): Promise<{ subject: string; body: string }> {
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

  return { subject, body: text };
}
