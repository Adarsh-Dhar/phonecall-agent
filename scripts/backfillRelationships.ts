/**
 * Phase 2: Backfill script to create Relationship rows from existing conversations
 *
 * This script:
 * 1. Finds all conversations with individual <-> business calls
 * 2. Creates Relationship rows for each unique individualId/businessId pair
 * 3. Backfills seq, speaker, and visibility on existing Message rows
 * 4. Merges split conversations per contact into one relationship thread
 *
 * Usage: npx tsx scripts/backfillRelationships.ts
 */

import { prisma } from "@workspace/db-prisma";

async function backfillRelationships() {
  console.log("Starting Relationship backfill...");

  // Step 1: Find all calls with individualId and businessId set
  const calls = await prisma.call.findMany({
    where: {
      individualId: { not: null },
      businessId: { not: null },
      contactId: { not: null },
    },
    select: {
      id: true,
      individualId: true,
      businessId: true,
      contactId: true,
      conversationId: true,
    },
    distinct: ["individualId", "businessId", "contactId"],
  });

  console.log(`Found ${calls.length} unique individual-business pairs`);

  let created = 0;
  let skipped = 0;
  let backfilledMessages = 0;

  for (const call of calls) {
    if (!call.individualId || !call.businessId || !call.contactId) {
      continue;
    }

    // Check if relationship already exists
    const existing = await prisma.relationship.findUnique({
      where: {
        individualId_businessId: {
          individualId: call.individualId,
          businessId: call.businessId,
        },
      },
    });

    if (existing) {
      console.log(`Relationship already exists for ${call.individualId} <-> ${call.businessId}`);
      skipped++;
      continue;
    }

    // Create relationship
    const relationship = await prisma.relationship.create({
      data: {
        individualId: call.individualId,
        businessId: call.businessId,
        contactId: call.contactId,
      },
    });

    console.log(`Created relationship ${relationship.id} for ${call.individualId} <-> ${call.businessId}`);
    created++;

    // Step 2: Backfill messages for this relationship
    // Find all conversations for this contact
    const conversations = await prisma.conversation.findMany({
      where: { contactId: call.contactId },
      select: { id: true },
    });

    for (const conversation of conversations) {
      // Find all messages for this conversation
      const messages = await prisma.message.findMany({
        where: {
          conversationId: conversation.id,
          relationshipId: null, // Only backfill messages not yet assigned
        },
        orderBy: { createdAt: "asc" },
      });

      if (messages.length === 0) continue;

      // Assign seq numbers
      let seq = BigInt(1);
      for (const message of messages) {
        // Determine speaker
        let speaker: string | null = null;
        if (message.callId) {
          // Call message
          speaker = message.role === "assistant" ? "individual_agent" : "business";
        } else {
          // Chat message (assume owner for now, could be refined)
          speaker = message.role === "assistant" ? "individual_agent" : "individual_owner";
        }

        // Determine visibility
        const visibility = message.callId ? "both" : "individual_only";

        await prisma.message.update({
          where: { id: message.id },
          data: {
            relationshipId: relationship.id,
            seq,
            speaker,
            visibility,
          },
        });

        seq++;
        backfilledMessages++;
      }

      console.log(`Backfilled ${messages.length} messages for conversation ${conversation.id}`);
    }
  }

  console.log("\nBackfill complete:");
  console.log(`- Relationships created: ${created}`);
  console.log(`- Relationships skipped (already existed): ${skipped}`);
  console.log(`- Messages backfilled: ${backfilledMessages}`);
}

async function backfillSeqNumbers() {
  console.log("\nStarting seq number backfill for messages without seq...");

  // Find all relationships
  const relationships = await prisma.relationship.findMany({
    select: { id: true },
  });

  let totalBackfilled = 0;

  for (const relationship of relationships) {
    // Find messages for this relationship without seq
    const messages = await prisma.message.findMany({
      where: {
        relationshipId: relationship.id,
        seq: null,
      },
      orderBy: { createdAt: "asc" },
    });

    if (messages.length === 0) continue;

    // Get current max seq for this relationship
    const lastSeq = await prisma.message.findFirst({
      where: { relationshipId: relationship.id, seq: { not: null } },
      select: { seq: true },
      orderBy: { seq: "desc" },
    });

    let nextSeq = (lastSeq?.seq ?? BigInt(0)) + BigInt(1);

    for (const message of messages) {
      // Determine speaker
      let speaker: string | null = message.speaker;
      if (!speaker) {
        if (message.callId) {
          speaker = message.role === "assistant" ? "individual_agent" : "business";
        } else {
          speaker = message.role === "assistant" ? "individual_agent" : "individual_owner";
        }
      }

      // Determine visibility
      const visibility = message.visibility || (message.callId ? "both" : "individual_only");

      await prisma.message.update({
        where: { id: message.id },
        data: {
          seq: nextSeq,
          speaker,
          visibility,
        },
      });

      nextSeq++;
      totalBackfilled++;
    }

    console.log(`Backfilled ${messages.length} messages for relationship ${relationship.id}`);
  }

  console.log(`Total messages backfilled with seq: ${totalBackfilled}`);
}

async function main() {
  try {
    await backfillRelationships();
    await backfillSeqNumbers();
    console.log("\n✅ Backfill completed successfully");
  } catch (error) {
    console.error("❌ Backfill failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
