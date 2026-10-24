/**
 * Relationship Memory Architecture
 *
 * This module implements the memory system for the phone agent.
 * Phase 1: BriefingBuilder with raw-tail fallback
 * Phase 2: Relationship table, Ingest service, seq/speaker/visibility on Message
 * Phase 3: CallSummary, Consolidator, rolling summary
 * Phase 4: OpenLoop management
 */

export { buildBriefing } from "./briefing";
export { renderBriefing, renderMemoryBlock } from "./render";
export type { CallBriefing, Fact, ClosureNotice, BriefingOptions } from "./types";

export {
  getOrCreateRelationship,
  getRelationship,
  updateRelationshipSummary,
  markConsolidating,
  unmarkConsolidating,
} from "./relationship";

export {
  ingestMessage,
  ingestMessages,
  type Speaker,
  type Visibility,
} from "./ingest";

export {
  consolidateCall,
  scheduleConsolidation,
} from "./consolidator";

export { createLoopsFromPromises } from "./promiseLoops";
export { sweepOverdueLoops } from "./loopSweeper";

export {
  createOpenLoop,
  resolveOpenLoop,
  getOpenLoops,
  resolveOpenLoopsByQueryId,
  resolveOpenLoopsByTaskId,
  createOpenLoopFromQuery,
  createOpenLoopFromTask,
  type OpenLoopKind,
  type OpenLoopStatus,
} from "./loops";
