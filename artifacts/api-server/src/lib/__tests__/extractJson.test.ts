import { describe, it, expect } from "vitest";
import { extractJson, extractJsonObject } from "../extractJson";

describe("extractJson", () => {
  it("extracts clean JSON", () => {
    const input = '{"key": "value"}';
    expect(extractJson(input)).toEqual({ key: "value" });
  });

  it("extracts JSON from markdown fence", () => {
    const input = '```json\n{"key": "value"}\n```';
    expect(extractJson(input)).toEqual({ key: "value" });
  });

  it("extracts JSON from markdown fence without json label", () => {
    const input = '```\n{"key": "value"}\n```';
    expect(extractJson(input)).toEqual({ key: "value" });
  });

  it("removes think blocks", () => {
    const input = '<think>reasoning</think>\n{"key": "value"}';
    expect(extractJson(input)).toEqual({ key: "value" });
  });

  it("extracts JSON from text with chatter", () => {
    const input = 'Here is the result: {"key": "value"} done';
    expect(extractJson(input)).toEqual({ key: "value" });
  });

  it("extracts JSON from mixed fences and think blocks", () => {
    const input = '<think>reasoning</think>\n```json\n{"key": "value"}\n```';
    expect(extractJson(input)).toEqual({ key: "value" });
  });

  it("handles trailing commas", () => {
    const input = '{"key": "value",}';
    expect(extractJson(input)).toEqual({ key: "value" });
  });

  it("handles trailing commas in arrays", () => {
    const input = '{"key": ["a", "b",]}';
    expect(extractJson(input)).toEqual({ key: ["a", "b"] });
  });

  it("handles unquoted keys", () => {
    const input = '{key: "value"}';
    expect(extractJson(input)).toEqual({ key: "value" });
  });

  it("handles unquoted keys with underscores", () => {
    const input = '{isEnoughKnowledge: false, escalationQuestion: "test"}';
    expect(extractJson(input)).toEqual({ isEnoughKnowledge: false, escalationQuestion: "test" });
  });

  it("handles multiple issues at once", () => {
    const input = '{isEnoughKnowledge: false, escalationQuestion: "What is the gate code?",}';
    expect(extractJson(input)).toEqual({ isEnoughKnowledge: false, escalationQuestion: "What is the gate code?" });
  });

  it("throws on invalid JSON", () => {
    const input = "not json at all";
    expect(() => extractJson(input)).toThrow(SyntaxError);
  });

  it("throws on malformed JSON that cannot be fixed", () => {
    const input = '{key: value}'; // unquoted value
    expect(() => extractJson(input)).toThrow(SyntaxError);
  });
});

describe("extractJsonObject", () => {
  it("extracts object from JSON", () => {
    const input = '{"key": "value"}';
    expect(extractJsonObject(input)).toEqual({ key: "value" });
  });

  it("throws on array", () => {
    const input = '["a", "b"]';
    expect(() => extractJsonObject(input)).toThrow(SyntaxError);
  });

  it("throws on primitive", () => {
    const input = '"string"';
    expect(() => extractJsonObject(input)).toThrow(SyntaxError);
  });

  it("throws on null", () => {
    const input = 'null';
    expect(() => extractJsonObject(input)).toThrow(SyntaxError);
  });
});
