/**
 * Relationship Memory Architecture - Type Definitions
 *
 * This module defines the core types for the memory system:
 * - CallBriefing: The briefing sent to the phone agent at call start
 * - BriefingQuality: Metadata about briefing completeness
 */

export interface Fact {
  category: string;
  key: string;
  value: string;
}

export interface ClosureNotice {
  kind: "holiday" | "out_of_service" | "emergency";
  label?: string;
  message?: string;
  allDay: boolean;
  startsAt: string;
  endsAt?: string;
}

export interface CallBriefing {
  version: 1;
  relationshipId: string;
  callReason: { taskId?: string; title: string; detail?: string } | null;
  now: string; // ISO + timezone
  individual: {
    name: string;
    shareableInfo: Fact[];
  };
  business: {
    name: string;
    hours?: string;
    closedNow?: ClosureNotice;
  };
  knownFacts: Fact[]; // ContactKnowledge, status active
  thread: {
    summary: string; // rolling summary (empty in Phase 1)
    recentCalls: Array<{ at: string; outcome: string; summary: string }>; // last 3
    lastCallTail: Array<{ speaker: string; text: string }>; // last ~14 turns
  };
  openLoops: Array<{ kind: string; text: string; dueAt?: string }>;
  answeredSince: Array<{ question: string; answer: string }>; // owner answers, last 7 days
  doNot: string[]; // e.g. "Do not agree to fees", "Do not invent a gate code"
  quality: {
    complete: boolean;
    staleSeconds: number;
  };
}

export interface BriefingQuality {
  complete: boolean;
  staleSeconds: number;
}

export interface BriefingOptions {
  maxTokens?: number;
  consolidationWaitMs?: number;
}
