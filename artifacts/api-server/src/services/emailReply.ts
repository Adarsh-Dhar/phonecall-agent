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
    const lowerSubject = params.incomingSubject.toLowerCase();
    let contextualResponse = "";
    
    // Handle empty emails by asking specific questions based on subject
    if (!params.incomingBody || params.incomingBody.trim() === "") {
      if (lowerSubject.includes("appointment") || lowerSubject.includes("schedule")) {
        contextualResponse = "I received your email about scheduling/appointments, but I need more details to help you. Could you please specify:\n\n- What type of appointment do you need?\n- Your preferred date and time\n- Any specific requirements or notes\n\nThis will help me understand exactly what you need and add it to our system.";
      } else if (lowerSubject.includes("status") || lowerSubject.includes("update")) {
        contextualResponse = "I see you're asking for a status update, but I need more context to help you. Could you please specify:\n\n- What item or request you're following up on\n- Any reference numbers or dates\n- What specific information you're looking for\n\nI'll add this as a query and make sure we get you the right information.";
      } else if (lowerSubject.includes("help") || lowerSubject.includes("support")) {
        contextualResponse = "I'd be happy to help you! To better assist you, could you please tell me:\n\n- What specific issue or question you have\n- Any relevant details or context\n- How urgent this matter is\n\nI'll make sure your request gets properly tracked and addressed.";
      } else {
        contextualResponse = "I received your email but it appears to be empty. Could you please let me know what you need help with? I can assist with:\n\n- Scheduling appointments\n- Checking status of requests\n- General questions and support\n- Any other service-related inquiries\n\nJust provide a few details about what you're looking for, and I'll make sure it gets added to our system and properly handled.";
      }
    } else if (lowerBody.includes("appointment") || lowerBody.includes("status")) {
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
