import { describe, it, expect } from "vitest";
import { extractJson, extractJsonObject } from "../../lib/extractJson";
import { parseModelDueDate, sanitizeExtraction, sanitizeTaskAction, sanitizeKnowledgeAction } from "../taskExtraction/validate";
import { buildExtractionPrompt, buildExtractionUserContent, parseExtractionReply, utcOffsetFor } from "../taskExtraction/orchestratorPrompt";

const NOW = new Date("2026-10-10T06:00:00Z");

describe("extractJson", () => {
  it("parses plain, fenced (triple backticks), think-prefixed and chatty replies", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
    expect(extractJson('`json\n{"a":1}\n`')).toEqual({ a: 1 });
    expect(extractJson('
hmm {x}
{"a":1}')).toEqual({ a: 1 });
    expect(extractJson('Sure! Here you go: {"a":1} Hope it helps')).toEqual({ a: 1 });
  });
  it("throws SyntaxError on garbage or non-objects", () => {
    expect(() => extractJson("not json")).toThrow(SyntaxError);
    expect(() => extractJson('{"a":')).toThrow(SyntaxError);
    expect(() => extractJsonObject("[1,2]")).toThrow(SyntaxError);
  });
});

describe("parseModelDueDate", () => {
  it("accepts a future date with an offset", () => {
    expect(parseModelDueDate("2026-10-12T15:00:00+05:30", NOW)?.toISOString()).toBe("2026-10-12T09:30:00.000Z");
    expect(parseModelDueDate("2026-10-12T15:00Z", NOW)).not.toBeNull();
  });
  it("rejects no-offset, date-only, garbage, past and far-future", () => {
    expect(parseModelDueDate("2026-10-12T15:00:00", NOW)).toBeNull();
    expect(parseModelDueDate("2026-10-12", NOW)).toBeNull();
    expect(parseModelDueDate("next tuesday", NOW)).toBeNull();
    expect(parseModelDueDate("2026-10-01T10:00:00Z", NOW)).toBeNull();
    expect(parseModelDueDate("2031-10-12T10:00:00Z", NOW)).toBeNull();
    expect(parseModelDueDate("2026-13-45T10:00:00Z", NOW)).toBeNull();
    expect(parseModelDueDate(undefined, NOW)).toBeNull();
  });
});

describe("schema validation", () => {
  const base = { confidence: 0.95, sourceMessageIds: ["m1"] };
  it("task actions: enums, required fields and clamping", () => {
    expect(sanitizeTaskAction({ type: "create", title: "  Call dentist ", priority: "urgent", kind: "email", ...base }))
      .toMatchObject({ type: "create", title: "Call dentist", priority: undefined, kind: undefined });
    expect(sanitizeTaskAction({ type: "create", title: "   ", ...base })).toBeNull();
    expect(sanitizeTaskAction({ type: "complete", ...base })).toBeNull(); // no taskId
    expect(sanitizeTaskAction({ type: "explode", taskId: "t", ...base })).toBeNull();
    expect(sanitizeTaskAction({ type: "cancel", taskId: "t", confidence: 7, sourceMessageIds: [] })).toBeNull();
    expect(sanitizeTaskAction({ type: "cancel", taskId: "t", confidence: "high", sourceMessageIds: [] })).toBeNull();
  });
  it("knowledge actions: category enum, key normalised, value required", () => {
    expect(sanitizeKnowledgeAction({ type: "upsert", category: "fact", key: "Preferred Contact-Time!", value: "mornings", ...base }))
      .toMatchObject({ key: "preferred_contact_time" });
    expect(sanitizeKnowledgeAction({ type: "upsert", category: "mood", key: "k", value: "v", ...base })).toBeNull();
    expect(sanitizeKnowledgeAction({ type: "upsert", category: "fact", key: "k", ...base })).toBeNull();
    expect(sanitizeKnowledgeAction({ type: "invalidate", key: "old_fact", ...base })).toMatchObject({ type: "invalidate", key: "old_fact" });
  });
  it("sanitizeExtraction counts what it dropped", () => {
    const r = sanitizeExtraction({
      taskActions: [{ type: "create", title: "ok", ...base }, { type: "nope" }],
      knowledgeActions: [{ type: "upsert", category: "bad", key: "k", value: "v", ...base }],
    });
    expect(r.taskActions).toHaveLength(1);
    expect(r.knowledgeActions).toHaveLength(0);
    expect(r.dropped).toBe(2);
  });
  it("parseExtractionReply throws on unreadable output instead of returning 'nothing'", () => {
    expect(() => parseExtractionReply("I could not do that")).toThrow(SyntaxError);
    expect(parseExtractionReply('`json\n{"taskActions":[],"knowledgeActions":[]}\n`')).toMatchObject({ taskActions: [], knowledgeActions: [] });
  });
});

describe("extraction prompt", () => {
  it("asks for a UTC offset in the owner's timezone and explains speakers", () => {
    expect(utcOffsetFor("Asia/Kolkata", NOW)).toBe("+05:30");
    expect(utcOffsetFor("UTC", NOW)).toBe("+00:00");
    const p = buildExtractionPrompt("Asia/Kolkata", NOW);
    expect(p).toContain("2026-10-10");
    expect(p).toContain("+05:30");
    expect(p).toMatch(/contact's own requests|request made by the contact/i);
    expect(p).toMatch(/REUSE its exact key/);
  });
  it("user content includes known facts and speaker-labelled messages", () => {
    const c = buildExtractionUserContent({
      contactName: "Dr Rao", contactBusiness: "Clinic", existingTasks: [],
      existingKnowledge: [{ key: "opening_hours", category: "fact", value: "9-5" }],
      newMessages: [{ id: "m1", speaker: "contact (on the call)", source: "phone_call", content: "send me the form", time: "Now" }],
    });
    expect(c).toContain("opening_hours");
    expect(c).toContain('"speaker": "contact (on the call)"');
  });
});
