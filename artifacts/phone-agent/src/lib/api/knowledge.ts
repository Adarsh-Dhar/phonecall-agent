import { API_BASE_URL } from './shared';

// ─── Knowledge types ──────────────────────────────────────────────────────

export type KnowledgeFact = {
  id: string;
  contactId: string;
  category: string;
  key: string;
  value: string;
  confidence: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export const fetchContactKnowledge = async (contactId: string, status?: string): Promise<KnowledgeFact[]> => {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const response = await fetch(`${API_BASE_URL}/contacts/${contactId}/knowledge${qs}`);
  if (!response.ok) throw new Error('Failed to fetch contact knowledge');
  return response.json();
};

export const createContactKnowledge = async (
  contactId: string,
  data: { category: string; key: string; value: string; confidence?: number },
): Promise<KnowledgeFact> => {
  const response = await fetch(`${API_BASE_URL}/contacts/${contactId}/knowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create knowledge fact');
  return response.json();
};

export const updateContactKnowledge = async (
  id: string,
  data: { value?: string; status?: string },
): Promise<KnowledgeFact> => {
  const response = await fetch(`${API_BASE_URL}/knowledge/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update knowledge fact');
  return response.json();
};

export const deleteContactKnowledge = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/knowledge/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete knowledge fact');
};
