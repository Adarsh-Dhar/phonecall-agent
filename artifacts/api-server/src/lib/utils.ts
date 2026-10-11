export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Normalizes a knowledge key to ensure it matches the required format.
 * Only accepts keys matching ^[a-z][a-z0-9_]{2,40}$ (lowercase, starts with letter, 3-41 chars).
 * Returns null for invalid keys.
 */
export function normalizeKnowledgeKey(key: string | null | undefined): string | null {
  if (!key) return null;
  const trimmed = key.trim();
  // Must start with lowercase letter, followed by 2-40 lowercase letters, numbers, or underscores
  const validPattern = /^[a-z][a-z0-9_]{2,40}$/;
  return validPattern.test(trimmed) ? trimmed : null;
}
