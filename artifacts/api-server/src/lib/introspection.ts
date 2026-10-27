/**
 * Introspection exports (S5)
 *
 * Read-only getters for test-only metrics
 */

import { prisma } from "@workspace/db-prisma";
import { isTestMode } from "./testMode";

// Extraction in-flight count (from taskExtraction)
let extractionInFlightCount = 0;

export function setExtractionInFlightCount(count: number) {
  extractionInFlightCount = count;
}

export function getExtractionInFlightCount(): number {
  return extractionInFlightCount;
}

// Room count (from WebSocket server)
let roomCount = 0;

export function setRoomCount(count: number) {
  roomCount = count;
}

export function getRoomCount(): number {
  return roomCount;
}

// Pending query count
export async function getPendingQueryCount(): Promise<number> {
  if (!isTestMode()) {
    return 0;
  }

  try {
    const count = await prisma.query.count({
      where: {
        status: 'pending',
      },
    });
    return count;
  } catch (error) {
    return 0;
  }
}

// Active holds count
export async function getActiveHoldsCount(): Promise<number> {
  if (!isTestMode()) {
    return 0;
  }

  try {
    const count = await prisma.calendarEvent.count({
      where: {
        summary: {
          startsWith: 'HOLD:',
        },
        status: 'confirmed',
      },
    });
    return count;
  } catch (error) {
    return 0;
  }
}

// Scheduler claim counts
export async function getSchedulerClaimCounts(): Promise<Record<string, number>> {
  if (!isTestMode()) {
    return {};
  }

  try {
    const claimed = await prisma.task.count({
      where: {
        status: 'claimed',
      },
    });
    return { claimed };
  } catch (error) {
    return {};
  }
}

// Get all introspection metrics
export async function getIntrospectionMetrics() {
  return {
    extractionInFlight: getExtractionInFlightCount(),
    pendingQueries: await getPendingQueryCount(),
    roomCount: getRoomCount(),
    activeHolds: await getActiveHoldsCount(),
    schedulerClaimCounts: await getSchedulerClaimCounts(),
  };
}
