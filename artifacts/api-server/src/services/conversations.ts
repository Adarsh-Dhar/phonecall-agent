import { prisma } from "@workspace/db-prisma";
import { logger } from "../lib/logger";

/**
 * Get or create the active conversation for a contact.
 * Returns the most recently updated conversation, or creates a new one if none exists.
 * 
 * @param contactId - The contact ID
 * @param titlePrefix - Prefix for the conversation title (e.g., "Email with", "Call with")
 * @param contactName - Name of the contact for the title
 * @param newContentPreview - Optional preview of new content to check for topic continuation
 */
export async function getOrCreateActiveConversation(
  contactId: string,
  titlePrefix: string,
  contactName: string,
  newContentPreview?: string
) {
  let conversation = await prisma.conversation.findFirst({
    where: { contactId },
    orderBy: { updatedAt: "desc" },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        contactId,
        title: `${titlePrefix} ${contactName}`,
      },
    });
    return conversation;
  }

  // If the latest conversation is active, reuse it
  if (conversation.status === "active") {
    return conversation;
  }

  // If the latest conversation is ended and new content was supplied,
  // check if this is a continuation of the same topic
  if (conversation.status === "ended" && newContentPreview) {
    const isContinuation = await classifyTopicContinuation(
      newContentPreview,
      conversation.topicSummary || ""
    );

    if (isContinuation) {
      // Reopen the ended conversation
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          status: "active",
          endedAt: null,
        },
      });
      logger.info(
        { conversationId: conversation.id, contactId },
        "conversations: reopened ended conversation for topic continuation"
      );
      return conversation;
    }

    // Different topic - create a new conversation
    conversation = await prisma.conversation.create({
      data: {
        contactId,
        title: `${titlePrefix} ${contactName}`,
      },
    });
    logger.info(
      { conversationId: conversation.id, contactId },
      "conversations: created new conversation for different topic"
    );
    return conversation;
  }

  // Latest conversation is ended but no new content supplied (e.g., placing a call)
  // Fall back to reusing it
  if (conversation.status === "ended") {
    conversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: "active",
        endedAt: null,
      },
    });
    logger.info(
      { conversationId: conversation.id, contactId },
      "conversations: reopened ended conversation (no content preview)"
    );
  }

  return conversation;
}

/**
 * Classify whether new content is a continuation of a previous topic.
 * Uses Gemini to compare the new content against the previous topic summary.
 * Fails safe toward "continuation" on error.
 */
async function classifyTopicContinuation(
  newContent: string,
  previousTopicSummary: string
): Promise<boolean> {
  if (!previousTopicSummary) {
    // No previous summary, assume continuation
    return true;
  }

  try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a conversation topic classifier. Determine if the new content is a continuation of the previous topic or a completely different topic.

Previous topic summary: "${previousTopicSummary}"

New content: "${newContent}"

Respond with only "continuation" or "new_topic".`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().toLowerCase().trim();

    return response === "continuation";
  } catch (error) {
    logger.error({ error }, "conversations: topic classification failed, defaulting to continuation");
    // Fail safe: assume continuation on error
    return true;
  }
}

/**
 * End a conversation by marking it as ended and generating a topic summary.
 */
export async function endConversation(conversationId: string) {
  const topicSummary = await summarizeConversationTopic(conversationId);

  const conversation = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      status: "ended",
      endedAt: new Date(),
      topicSummary,
    },
  });

  logger.info(
    { conversationId, topicSummary },
    "conversations: conversation ended"
  );

  return conversation;
}

/**
 * Generate a topic summary for a conversation using Gemini.
 */
async function summarizeConversationTopic(conversationId: string): Promise<string> {
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 50, // Limit to recent messages to avoid token limits
    });

    if (messages.length === 0) {
      return "No messages";
    }

    const conversationText = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Summarize the main topic of this conversation in 1-2 sentences (max 100 characters). Focus on what was discussed or accomplished.

Conversation:
${conversationText}

Topic summary:`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim().slice(0, 100);
  } catch (error) {
    logger.error({ error, conversationId }, "conversations: topic summarization failed");
    return "Conversation ended";
  }
}
