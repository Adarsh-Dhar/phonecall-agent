/**
 * Relationship service - manages individual ↔ business pair relationships
 *
 * Phase 2: Create the Relationship table and getOrCreateRelationship function
 */

import { prisma } from "@workspace/db-prisma";
import { logger } from "../../lib/logger";

/**
 * Get or create a relationship for an individual ↔ business pair
 *
 * The pair is identified by:
 * - individualId: the owner's account (isService: false)
 * - businessId: the contact's account (isService: true)
 * - contactId: the individual's contact row for this business
 *
 * Returns the relationship row, creating it if it doesn't exist.
 */
export async function getOrCreateRelationship(opts: {
  individualId: string;
  businessId: string;
  contactId: string;
}) {
  const { individualId, businessId, contactId } = opts;

  // Try to find existing relationship
  let relationship = await prisma.relationship.findUnique({
    where: {
      individualId_businessId: {
        individualId,
        businessId,
      },
    },
  });

  if (relationship) {
    return relationship;
  }

  // Create new relationship
  relationship = await prisma.relationship.create({
    data: {
      individualId,
      businessId,
      contactId,
    },
  });

  logger.info(
    { relationshipId: relationship.id, individualId, businessId, contactId },
    "relationship: created new relationship"
  );

  return relationship;
}

/**
 * Get a relationship by ID
 */
export async function getRelationship(id: string) {
  return prisma.relationship.findUnique({
    where: { id },
    include: {
      individual: {
        select: { id: true, name: true, timezone: true },
      },
      business: {
        select: { id: true, name: true, businessHoursJson: true },
      },
    },
  });
}

/**
 * Update the relationship's rolling summary
 *
 * Called by the Consolidator (Phase 3)
 */
export async function updateRelationshipSummary(opts: {
  relationshipId: string;
  summary: string;
  summaryUpTo: Date;
  lastCallId?: string;
  lastCallAt?: Date;
}) {
  const { relationshipId, summary, summaryUpTo, lastCallId, lastCallAt } = opts;

  return prisma.relationship.update({
    where: { id: relationshipId },
    data: {
      summary,
      summaryUpTo,
      summaryVersion: { increment: 1 },
      ...(lastCallId && { lastCallId }),
      ...(lastCallAt && { lastCallAt }),
    },
  });
}

/**
 * Mark a relationship as consolidating (for advisory lock)
 */
export async function markConsolidating(relationshipId: string) {
  return prisma.relationship.update({
    where: { id: relationshipId },
    data: { consolidating: true },
  });
}

/**
 * Unmark a relationship as consolidating
 */
export async function unmarkConsolidating(relationshipId: string) {
  return prisma.relationship.update({
    where: { id: relationshipId },
    data: { consolidating: false },
  });
}
