const API_BASE_URL = '/api';

export type Contact = {
  id: string;
  name: string;
  business: string;
  initials: string;
  color: string;
  note: string | null;
  online: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  role: string;
  content: string;
  time: string;
  pending: boolean;
  createdAt: string;
  updatedAt: string;
  conversationId: string;
};

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

export type Conversation = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  history: History[];
};

// Contacts API
export const fetchContacts = async (): Promise<Contact[]> => {
  const response = await fetch(`${API_BASE_URL}/contacts`);
  if (!response.ok) throw new Error('Failed to fetch contacts');
  return response.json();
};

export const createContact = async (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> => {
  const response = await fetch(`${API_BASE_URL}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create contact');
  return response.json();
};

// Conversations API
export const fetchConversations = async (): Promise<Conversation[]> => {
  const response = await fetch(`${API_BASE_URL}/conversations`);
  if (!response.ok) throw new Error('Failed to fetch conversations');
  return response.json();
};

export const createConversation = async (data: { title?: string }): Promise<Conversation> => {
  const response = await fetch(`${API_BASE_URL}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create conversation');
  return response.json();
};

// Messages API
export const fetchMessages = async (conversationId: string): Promise<Message[]> => {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`);
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
};

export const createMessage = async (conversationId: string, data: Omit<Message, 'id' | 'createdAt' | 'updatedAt' | 'conversationId'>): Promise<Message> => {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create message');
  return response.json();
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

// Gemini Chat API
export const sendGeminiMessage = async (messages: Array<{ role: string; content: string }>) => {
  const response = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
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
