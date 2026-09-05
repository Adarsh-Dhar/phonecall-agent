import { API_BASE_URL, apiFetch } from './shared';
import type { Contact } from './contacts';
import type { History } from './history';

export type Message = {
  id: string;
  role: string;
  content: string;
  time: string;
  pending: boolean;
  createdAt: string;
  updatedAt: string;
  conversationId: string;
  callId?: string | null;
};

export type Conversation = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  contactId?: string;
  contact?: Contact;
  messages: Message[];
  history: History[];
  status?: string;
  endedAt?: string | null;
  topicSummary?: string | null;
};

// Conversations API
export const fetchConversations = async (): Promise<Conversation[]> => {
  const response = await apiFetch(`${API_BASE_URL}/conversations`);
  if (!response.ok) throw new Error('Failed to fetch conversations');
  return response.json();
};

export const fetchContactConversation = async (contactId: string): Promise<Conversation> => {
  const response = await apiFetch(`${API_BASE_URL}/contacts/${contactId}/conversation`);
  if (!response.ok) throw new Error('Failed to fetch contact conversation');
  return response.json();
};

export const createConversation = async (data: { title?: string }): Promise<Conversation> => {
  const response = await apiFetch(`${API_BASE_URL}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create conversation');
  return response.json();
};

export const endConversation = async (conversationId: string): Promise<Conversation> => {
  const response = await apiFetch(`${API_BASE_URL}/conversations/${conversationId}/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to end conversation');
  return response.json();
};

// Messages API
export const fetchMessages = async (conversationId: string): Promise<Message[]> => {
  const response = await apiFetch(`${API_BASE_URL}/conversations/${conversationId}/messages`);
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
};

export const fetchConversationMessages = async (conversationId: string): Promise<Conversation> => {
  const response = await apiFetch(`${API_BASE_URL}/conversations/${conversationId}`);
  if (!response.ok) throw new Error('Failed to fetch conversation');
  const conversation = await response.json();
  const messages = await fetchMessages(conversationId);
  return { ...conversation, messages };
};

export const createMessage = async (
  conversationId: string,
  data: Omit<Message, 'id' | 'createdAt' | 'updatedAt' | 'conversationId'>,
): Promise<Message> => {
  const response = await apiFetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create message');
  return response.json();
};

// Get messages for a specific call (only actual call transcript)
export const fetchCallMessages = async (callId: string): Promise<Message[]> => {
  const response = await apiFetch(`${API_BASE_URL}/calls/${callId}/messages`);
  if (!response.ok) throw new Error('Failed to fetch call messages');
  return response.json();
};
