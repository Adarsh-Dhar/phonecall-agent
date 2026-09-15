import { apiFetch } from './shared';

// ─── Orchestrator Chat API ────────────────────────────────────────────────────
// Backed by Nebius Token Factory on the server; the route path (/api/gemini/chat)
// is kept as-is for compatibility — see routes/orchestrator.ts.

export const sendOrchestratorMessage = async (
  messages: Array<{ role: string; content: string }>,
  contactId?: string,
) => {
  const response = await apiFetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, contactId }),
  });
  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    } catch {
      throw new Error('Failed to send message');
    }
  }
  try {
    return await response.json();
  } catch {
    throw new Error('Invalid response from server');
  }
};
