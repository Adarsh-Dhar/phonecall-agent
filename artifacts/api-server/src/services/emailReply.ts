/**
 * Auto-reply generation for inbound email — the email-channel equivalent of
 * what the Gemini Live bridge does turn-by-turn on a phone call, except
 * email is one full message at a time rather than streaming audio.
 */

import { prisma } from "@workspace/db-prisma";
import { generateGeminiText, type GeminiTextTurn } from "./geminiText";
import { logger } from "../lib/logger";

export async function generateEmailReply(params: {
  conversationId: string;
  contactId: string;
  contactName: string;
  incomingSubject: string;
  incomingBody: string;
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
    `You are corresponding with ${params.contactName}. ` +
    "CRITICAL INSTRUCTIONS:\n" +
    "1. READ the conversation history carefully to understand the context\n" +
    "2. ANSWER the specific question asked in the incoming email - do not give generic responses\n" +
    "3. If they ask about appointment status, task details, or anything specific, look for that information in the conversation history\n" +
    "4. If you CANNOT find the answer in the conversation history, explicitly say: 'I don't have information about [specific topic] in our conversation history. Could you provide more details?'\n" +
    "5. NEVER make up information or assume things that aren't in the conversation\n" +
    "6. Be conversational and natural, not robotic\n" +
    "7. If the conversation history is empty or irrelevant, ask them to provide more context\n" +
    "8. ANALYZE what the user needs - if their request is unclear, incomplete, or needs more information, ask specific follow-up questions to clarify their needs\n" +
    "9. When you ask for clarification, structure your questions to help them provide the exact information needed\n" +
    "Write a complete, professional email reply — a real greeting, a clear body, a sign-off. " +
    "No markdown, no bullet lists unless the content genuinely needs them." +
    knowledgeBlock;

  const { text } = await generateGeminiText({ systemInstructionText, turns });

  const subject = params.incomingSubject.toLowerCase().startsWith("re:")
    ? params.incomingSubject
    : `Re: ${params.incomingSubject}`;

  return { subject, body: text };
}
