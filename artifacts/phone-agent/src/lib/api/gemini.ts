// ─── Gemini Chat API ─────────────────────────────────────────────────────────

export const sendGeminiMessage = async (
  messages: Array<{ role: string; content: string }>,
  contactId?: string,
) => {
  const response = await fetch('/api/gemini/chat', {
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
