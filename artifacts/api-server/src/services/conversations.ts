import { prisma } from "@workspace/db-prisma";

/**
 * Get or create the active conversation for a contact.
 * Returns the most recently updated conversation, or creates a new one if none exists.
 */
export async function getOrCreateActiveConversation(
  contactId: string,
  titlePrefix: string,
  contactName: string
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
  }

  return conversation;
}
