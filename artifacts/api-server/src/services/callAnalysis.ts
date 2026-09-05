import { prisma } from "@workspace/db-prisma";
import { generateGeminiText, type GeminiTextTurn } from "./geminiText";
import { logger } from "../lib/logger";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function buildCallSystemInstruction(contactName: string): string {
  return (
    "You are Phone Agent, an intelligent voice assistant taking a call on behalf of Adarsh Dhar, " +
    `speaking with ${contactName}, an external business contact. Be warm, but direct and concise —` +
    "this is a live phone conversation, not an email. Get to the point quickly, don't pad your " +
    "sentences with filler, and don't repeat back what the other person just said. If you don't have " +
    "enough information to commit to something on your user's behalf, say you'll check and follow up, " +
    "rather than guessing.\n\n" +
    "IMPORTANT: Speak only in English. If the other person speaks in a different language, " +
    "politely ask them to speak in English. Do not attempt to respond in other languages.\n\n" +
    "ENDING THE CALL: This call has a natural end point — don't drag it out. As soon as the purpose " +
    "of the call is resolved (the other person has said goodbye, confirmed there's nothing else, " +
    "or the conversation has clearly wound down), say a brief, warm goodbye and then call the " +
    "end_call function immediately in the same turn — do not keep chatting, ask another open-ended " +
    "question, or wait for further confirmation first. If the other person explicitly asks to end " +
    "the call or hang up, do the same right away. Never call end_call before you've said goodbye out loud."
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

  const turns = await prisma.message.findMany({
    where: { callId },
    orderBy: { createdAt: "asc" },
  });

  if (turns.length === 0) {
    await prisma.call.update({ where: { id: callId }, data: { isEnoughKnowledge: true } });
    return;
  }

  const contact = await prisma.contact.findUnique({ where: { id: call.contactId } });
  const facts = await prisma.contactKnowledge.findMany({
    where: { contactId: call.contactId, status: "active" },
    orderBy: { category: "asc" },
  });
  const knowledgeBlock =
    facts.length > 0
      ? "\n\nWhat you already know about this contact:\n" +
        facts.map((f) => `- (${f.category}) ${f.key}: ${f.value}`).join("\n")
      : "";

  const geminiTurns: GeminiTextTurn[] = turns.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));

  const systemText =
    "You are reviewing the transcript of a phone call your voice agent just completed on behalf of " +
    `your user, with ${contact?.name ?? "a contact"}. Decide ONE thing: did the agent get everything ` +
    "it needed during the call, or does it need to escalate something to your user afterward " +
    "(e.g. a decision it couldn't make, a detail it couldn't confirm)?\n\n" +
    "Return ONLY a JSON object, no markdown fences:\n" +
    "{\n" +
    '  "isEnoughKnowledge": boolean,\n' +
    '  "escalationQuestion": string | null,\n' +
    '  "knowledgeKey": string | null,\n' +
    '  "knowledgeCategory": string | null\n' +
    "}" +
    knowledgeBlock;

  let isEnoughKnowledge = true;
  let escalationQuestion: string | null = null;
  let knowledgeKey: string | null = null;
  let knowledgeCategory: string | null = null;

  try {
    const { text } = await generateGeminiText({
      systemInstructionText: systemText,
      turns: geminiTurns,
      jsonResponse: true,
    });
    const parsed = JSON.parse(text) as {
      isEnoughKnowledge?: boolean;
      escalationQuestion?: string | null;
      knowledgeKey?: string | null;
      knowledgeCategory?: string | null;
    };
    isEnoughKnowledge = parsed.isEnoughKnowledge !== false;
    if (!isEnoughKnowledge) {
      escalationQuestion =
        parsed.escalationQuestion?.trim() ||
        `The call with ${contact?.name ?? "the contact"} needs your input — can you review the transcript?`;
      knowledgeKey = slugify(parsed.knowledgeKey || escalationQuestion);
      knowledgeCategory = parsed.knowledgeCategory?.trim() || "fact";
    }
  } catch (err) {
    logger.warn({ err, callId }, "callAnalysis: failed to parse escalation decision, defaulting to isEnoughKnowledge=true");
  }

  await prisma.call.update({ where: { id: callId }, data: { isEnoughKnowledge } });

  if (!isEnoughKnowledge && escalationQuestion) {
    const existing = knowledgeKey
      ? await prisma.query.findFirst({ where: { knowledgeKey, status: "pending", contactId: call.contactId } })
      : null;

    if (!existing) {
      await prisma.query.create({
        data: {
          question: escalationQuestion,
          status: "pending",
          conversationId: call.conversationId,
          contactId: call.contactId,
          isKnowledgeGap: true,
          knowledgeKey,
          knowledgeCategory,
        },
      });
      logger.info({ callId, question: escalationQuestion }, "callAnalysis: created escalation query");
    }
  }
}