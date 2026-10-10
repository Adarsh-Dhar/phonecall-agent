/**
 * Pulls a JSON object out of model text that may be wrapped in markdown
 * fences or surrounded by chatter. Throws if no valid JSON object is found.
 * Never includes the model text in the thrown error (it is derived from
 * call transcripts).
 */
export function extractJsonObject(raw: string): Record<string, unknown> {
  let s = raw.trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) s = fenced[1].trim();
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last > first) s = s.slice(first, last + 1);
  let parsed: unknown;
  try {
    parsed = JSON.parse(s);
  } catch {
    throw new SyntaxError("model reply was not valid JSON");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new SyntaxError("model reply was not a JSON object");
  }
  return parsed as Record<string, unknown>;
}
