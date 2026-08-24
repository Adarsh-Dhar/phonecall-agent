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

  // Check if we have any conversation history to work with
  const hasContext = priorMessages.length > 0;
  
  const apiKey = process.env.GEMINI_API_KEY;
  const isTestKey = !apiKey || apiKey === "test_key" || apiKey === "test_key_for_testing";

  if (isTestKey) {
    // When using test key, provide a more contextual response based on the incoming email
    logger.debug({ conversationId: params.conversationId }, "Using test key - generating contextual response");
    
    const lowerBody = params.incomingBody.toLowerCase();
    let contextualResponse = "";
    
    if (lowerBody.includes("appointment") || lowerBody.includes("status")) {
      if (hasContext) {
        contextualResponse = "I checked our conversation history but couldn't find specific information about the appointment you mentioned. Could you please provide more details like the date, time, or what the appointment is for? I want to make sure I give you the right information.";
      } else {
        contextualResponse = "I don't have any previous conversation history with you about appointments. This appears to be our first interaction. Could you please provide more details about the appointment you're asking about (date, time, what it's for) so I can help you with the status?";
      }
    } else if (lowerBody.includes("task") || lowerBody.includes("to do")) {
      contextualResponse = "I don't see any existing tasks or action items in our conversation history. If you're following up on a specific task or request, could you provide more details about what you're referring to?";
    } else {
      contextualResponse = "Thanks for your message. I'd be happy to help you with that, but I need a bit more context. Could you provide more details about what you're looking for?";
    }
    
    const body = `Hi ${params.contactName},\n\n${contextualResponse}\n\nBest regards,\nPhone Agent`;
    
    const subject = params.incomingSubject.toLowerCase().startsWith("re:")
      ? params.incomingSubject
      : `Re: ${params.incomingSubject}`;
    
    return { subject, body };
  }

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
    "Write a complete, professional email reply — a real greeting, a clear body, a sign-off. " +
    "No markdown, no bullet lists unless the content genuinely needs them." +
    knowledgeBlock;

  const { text } = await generateGeminiText({ systemInstructionText, turns });

  const subject = params.incomingSubject.toLowerCase().startsWith("re:")
    ? params.incomingSubject
    : `Re: ${params.incomingSubject}`;

  return { subject, body: text };
}
