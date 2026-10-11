/**
 * renderBriefing - Convert a CallBriefing to prompt text
 *
 * Rendering rules (from section 6):
 * - Fixed section order: reason → open loops → last call → recent calls → facts → rolling summary
 * - Token budget (default 1,500 tokens): trim from the bottom of that order
 * - Never trim open loops or doNot
 * - Anything not in the briefing is "unknown"
 */

import type { CallBriefing, Fact, ClosureNotice } from "./types";

interface RenderOptions {
  maxTokens?: number;
}

/**
 * Approximate token count (rough estimate: 1 token ≈ 4 characters)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Render a closure notice into a brief description
 */
function renderClosureNotice(notice: ClosureNotice): string {
  const kind = notice.kind === "holiday" ? "holiday" : notice.kind === "emergency" ? "emergency" : "out of service";
  const dateRange = notice.allDay
    ? `all day ${new Date(notice.startsAt).toLocaleDateString()}`
    : `${new Date(notice.startsAt).toLocaleString()}${notice.endsAt ? ` to ${new Date(notice.endsAt).toLocaleString()}` : ""}`;
  return `${kind}${notice.label ? `: ${notice.label}` : ""} ${dateRange}${notice.message ? ` - ${notice.message}` : ""}`;
}

/**
 * Render the briefing into prompt text
 */
export function renderBriefing(briefing: CallBriefing, options: RenderOptions = {}): string {
  const maxTokens = options.maxTokens ?? 1500;

  // Build sections in order
  const sections: string[] = [];

  // 1. Call reason (if present)
  if (briefing.callReason) {
    sections.push(`CALL REASON: ${briefing.callReason.title}${briefing.callReason.detail ? ` — ${briefing.callReason.detail}` : ""}`);
  }

  // 2. Open loops (never trimmed)
  if (briefing.openLoops.length > 0) {
    const loops = briefing.openLoops
      .map((loop) => {
        const due = loop.dueAt ? ` (due ${new Date(loop.dueAt).toLocaleString()})` : "";
        return `- [${loop.kind}] ${loop.text}${due}`;
      })
      .join("\n");
    sections.push(`OPEN ITEMS:\n${loops}`);
  }

  // 3. Do not constraints (never trimmed)
  if (briefing.doNot.length > 0) {
    sections.push(`DO NOT:\n${briefing.doNot.map((d) => `- ${d}`).join("\n")}`);
  }

  // 4. Last call tail (raw transcript)
  if (briefing.thread.lastCallTail.length > 0) {
    const tail = briefing.thread.lastCallTail
      .map((turn) => `${turn.speaker}: ${turn.text}`)
      .join("\n");
    sections.push(`LAST CALL (most recent turns):\n${tail}`);
  }

  // 5. Recent calls (last 3)
  if (briefing.thread.recentCalls.length > 0) {
    const recent = briefing.thread.recentCalls
      .map((call) => {
        const date = new Date(call.at).toLocaleDateString();
        const consolidated = (call as any).consolidated ? " ✓" : "";
        return `- ${date}: ${call.outcome}${consolidated} — ${call.summary}`;
      })
      .join("\n");
    sections.push(`RECENT CALLS:\n${recent}`);
  }

  // 6. Known facts
  if (briefing.knownFacts.length > 0) {
    const facts = briefing.knownFacts
      .map((f) => `- (${f.category}) ${f.key}: ${f.value}`)
      .join("\n");
    sections.push(`KNOWN FACTS:\n${facts}`);
  }

  // 7. Rolling summary (empty in Phase 1)
  if (briefing.thread.summary) {
    sections.push(`THREAD SUMMARY:\n${briefing.thread.summary}`);
  }

  // 8. Answered queries (last 7 days)
  if (briefing.answeredSince.length > 0) {
    const answered = briefing.answeredSince
      .map((a) => `- Q: ${a.question}\n  A: ${a.answer}`)
      .join("\n");
    sections.push(`RECENTLY ANSWERED QUESTIONS:\n${answered}`);
  }

  // 9. Individual info (shareable)
  if (briefing.individual.shareableInfo.length > 0) {
    const info = briefing.individual.shareableInfo
      .map((f) => `- (${f.category}) ${f.key}: ${f.value}`)
      .join("\n");
    sections.push(`INDIVIDUAL INFO (shareable):\n${info}`);
  }

  // 10. Individual info (always rendered)
  const individualInfo = [`Individual: ${briefing.individual.name}`];
  sections.push(individualInfo.join("\n"));

  // 11. Business info
  const businessInfo = [`Business: ${briefing.business.name}`];
  if (briefing.business.hours) {
    businessInfo.push(`Hours: ${briefing.business.hours}`);
  }
  if (briefing.business.closedNow) {
    businessInfo.push(`NOW CLOSED: ${renderClosureNotice(briefing.business.closedNow)}`);
  }
  sections.push(businessInfo.join("\n"));

  // 11. Time context
  sections.push(`CURRENT TIME: ${briefing.now}`);

  // 12. Quality note (if incomplete)
  if (!briefing.quality.complete) {
    sections.push(`NOTE: The previous call may not be fully processed yet. Some details from the last call may be incomplete.`);
  }

  // Join all sections
  let fullText = sections.join("\n\n");

  // Trim from the bottom if over token budget
  // Trim order: business info → answered queries → known facts → recent calls → last call tail
  // Never trim: reason, open loops, do not, rolling summary, time context, quality note
  let estimated = estimateTokens(fullText);
  if (estimated <= maxTokens) {
    return fullText;
  }

  // Find split point: after reason, open loops, doNot, rolling summary, individual info, time context, quality note
  const untrimmableSections: string[] = [];
  const trimmableSections: string[] = [];

  // Reason (index 0 if present)
  if (briefing.callReason) {
    untrimmableSections.push(sections[0]);
    sections.shift();
  }

  // Open loops (index 0 now if present)
  if (briefing.openLoops.length > 0) {
    untrimmableSections.push(sections[0]);
    sections.shift();
  }

  // Do not (index 0 now if present)
  if (briefing.doNot.length > 0) {
    untrimmableSections.push(sections[0]);
    sections.shift();
  }

  // Rolling summary (if present, near the end)
  const summaryIndex = sections.findIndex((s) => s.startsWith("THREAD SUMMARY:"));
  if (summaryIndex !== -1) {
    untrimmableSections.push(sections[summaryIndex]);
    sections.splice(summaryIndex, 1);
  }

  // Individual info (always rendered)
  const individualIndex = sections.findIndex((s) => s.startsWith("Individual:"));
  if (individualIndex !== -1) {
    untrimmableSections.push(sections[individualIndex]);
    sections.splice(individualIndex, 1);
  }

  // Time context (always last or second-to-last)
  const timeIndex = sections.findIndex((s) => s.startsWith("CURRENT TIME:"));
  if (timeIndex !== -1) {
    untrimmableSections.push(sections[timeIndex]);
    sections.splice(timeIndex, 1);
  }

  // Quality note (always last)
  const qualityIndex = sections.findIndex((s) => s.startsWith("NOTE:"));
  if (qualityIndex !== -1) {
    untrimmableSections.push(sections[qualityIndex]);
    sections.splice(qualityIndex, 1);
  }

  // Remaining sections are trimmable (in reverse order: business, answered, facts, recent, tail)
  trimmableSections.push(...sections);

  // Build base text from untrimmable sections
  let baseText = untrimmableSections.join("\n\n");
  let baseTokens = estimateTokens(baseText);
  let remainingTokens = maxTokens - baseTokens;

  // Add trimmable sections from top (reverse order to preserve priority)
  // Priority: last call tail > recent calls > known facts > answered queries > business info
  // So we add in reverse: business info first (least important)
  const finalSections: string[] = [];
  for (let i = trimmableSections.length - 1; i >= 0; i--) {
    const section = trimmableSections[i];
    const sectionTokens = estimateTokens(section);
    if (sectionTokens <= remainingTokens) {
      finalSections.unshift(section);
      remainingTokens -= sectionTokens;
    }
  }

  return [...finalSections, ...untrimmableSections].join("\n\n");
}
