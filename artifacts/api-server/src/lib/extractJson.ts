/**
 * Fence-tolerant JSON parser for model replies.
 *
 * Handles: a reasoning preamble wrapped in think tags, a markdown code fence
 * around the JSON, and chatter around a single JSON object. Throws SyntaxError
 * when nothing parseable is found, so callers can treat "model gave us
 * garbage" as a real failure instead of silently continuing with nothing.
 *
 * NOTE: the fence and tag characters are written as unicode escapes on
 * purpose. Literal backticks and angle-bracket tags in this file have been
 * stripped by chat / markdown copy-paste before, silently breaking parsing.
 */
const FENCE = "\u0060\u0060\u0060"; // three backticks
const THINK_BLOCK = /\u003cthink\u003e[\s\S]*?\u003c\/think\u003e/gi;
const FENCED_BLOCK = new RegExp(FENCE + "(?:json)?\\s*([\\s\\S]*?)" + FENCE, "i");

export function extractJson(raw: string): unknown {
  let s = (raw ?? "").replace(THINK_BLOCK, "").trim();

  const fence = s.match(FENCED_BLOCK);
  if (fence) s = fence[1].trim();

  try {
    return JSON.parse(s);
  } catch {
    /* fall through to brace extraction */
  }

  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last > first) {
    try {
      return JSON.parse(s.slice(first, last + 1));
    } catch {
      // Deliberately generic: V8's own message quotes a snippet of the input,
      // which here is a call transcript.
      throw new SyntaxError("Invalid JSON in model reply");
    }
  }
  throw new SyntaxError("No JSON object found in model reply");
}

/** extractJson, but the result must be a plain object (not array/primitive). */
export function extractJsonObject(raw: string): Record<string, unknown> {
  const parsed = extractJson(raw);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new SyntaxError("JSON in model reply is not an object");
  }
  return parsed as Record<string, unknown>;
}
