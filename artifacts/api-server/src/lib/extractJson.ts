/**
 * Fence-tolerant JSON parser for model replies.
 *
 * Handles:  preambles, ```json fenced blocks, and chatter
 * around a single JSON object. Throws SyntaxError when nothing parseable is
 * found, so callers can treat "model gave us garbage" as a real failure
 * instead of silently continuing with an empty result.
 */
export function extractJson(raw: string): unknown {
  let s = (raw ?? "").replace(/<think[\s\S]*?<\/think>/gi, "").trim();

  const fence = s.match(/`(?:json)?\s*([\s\S]*?)`/i);
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
