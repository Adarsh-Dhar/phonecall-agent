import { API_BASE_URL } from './shared';
import { createConversation } from './conversations';

export type History = {
  id: string;
  title: string;
  detail: string;
  status: string;
  time: string;
  createdAt: string;
  updatedAt: string;
  conversationId: string;
};

// History API
export const fetchHistory = async (): Promise<History[]> => {
  const response = await fetch(`${API_BASE_URL}/history`);
  if (!response.ok) throw new Error('Failed to fetch history');
  return response.json();
};

export const createHistory = async (conversationId: string, data: Omit<History, 'id' | 'createdAt' | 'updatedAt' | 'conversationId'>): Promise<History> => {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create history');
  return response.json();
};

export const createHistoryWithConversation = async (data: Omit<History, 'id' | 'createdAt' | 'updatedAt' | 'conversationId'>): Promise<History> => {
  // First create a conversation
  const conversation = await createConversation({ title: 'New conversation' });
  // Then create history with that conversation
  return createHistory(conversation.id, data);
};
