import { API_BASE_URL, apiFetch } from './shared';

// ─── Query types ─────────────────────────────────────────────────────────────

export type QueryStatus = 'pending' | 'answered' | 'dismissed';
export type QuerySourceRole = 'asked' | 'dismissed';

export type QuerySourceMessage = {
  id: string;
  queryId: string;
  messageId: string;
  role: QuerySourceRole;
  message: {
    id: string;
    role: string;
    time: string;
    content: string;
  };
};

export type Query = {
  id: string;
  question: string;
  answer: string | null;
  status: QueryStatus;
  createdAt: string;
  updatedAt: string;
  answeredAt: string | null;
  answerMessageId: string | null;
  conversationId: string;
  contactId: string;
  contact?: {
    id: string;
    name: string;
    business: string;
    initials: string;
    color: string;
  };
  sources: QuerySourceMessage[];
  isKnowledgeGap?: boolean;
  knowledgeKey?: string;
  knowledgeCategory?: string;
};

// ─── Query API helpers ────────────────────────────────────────────────────────

export const fetchConversationQueries = async (
  conversationId: string,
  status?: QueryStatus,
): Promise<Query[]> => {
  const url = status
    ? `${API_BASE_URL}/conversations/${conversationId}/queries?status=${status}`
    : `${API_BASE_URL}/conversations/${conversationId}/queries`;
  const response = await apiFetch(url);
  if (!response.ok) throw new Error('Failed to fetch conversation queries');
  return response.json();
};

export const fetchContactQueries = async (
  contactId: string,
  status?: QueryStatus,
): Promise<Query[]> => {
  const url = status
    ? `${API_BASE_URL}/contacts/${contactId}/queries?status=${status}`
    : `${API_BASE_URL}/contacts/${contactId}/queries`;
  const response = await apiFetch(url);
  if (!response.ok) throw new Error('Failed to fetch contact queries');
  return response.json();
};

export const fetchQueries = async (filters?: {
  status?: QueryStatus;
  contactId?: string;
}): Promise<Query[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.contactId) params.set('contactId', filters.contactId);
  const qs = params.toString();
  const response = await apiFetch(`${API_BASE_URL}/queries${qs ? `?${qs}` : ''}`);
  if (!response.ok) throw new Error('Failed to fetch queries');
  return response.json();
};

export const createQuery = async (data: {
  question: string;
  conversationId: string;
  contactId: string;
}): Promise<Query> => {
  const response = await apiFetch(`${API_BASE_URL}/queries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create query');
  return response.json();
};

export const answerQuery = async (id: string, answer: string): Promise<Query> => {
  const response = await apiFetch(`${API_BASE_URL}/queries/${id}/answer`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer }),
  });
  if (!response.ok) throw new Error('Failed to answer query');
  return response.json();
};

export const dismissQuery = async (
  id: string,
  data?: { question?: string },
): Promise<Query> => {
  const response = await apiFetch(`${API_BASE_URL}/queries/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'dismissed', ...data }),
  });
  if (!response.ok) throw new Error('Failed to dismiss query');
  return response.json();
};

// ─── Question types (Knowledge Gap Questions) ──────────────────────────────

export type Question = Query;

export const fetchConversationQuestions = async (
  conversationId: string,
  status?: QueryStatus,
): Promise<Question[]> => {
  const url = status
    ? `${API_BASE_URL}/conversations/${conversationId}/questions?status=${status}`
    : `${API_BASE_URL}/conversations/${conversationId}/questions`;
  const response = await apiFetch(url);
  if (!response.ok) throw new Error('Failed to fetch conversation questions');
  return response.json();
};

export const fetchContactQuestions = async (
  contactId: string,
  status?: QueryStatus,
): Promise<Question[]> => {
  const url = status
    ? `${API_BASE_URL}/contacts/${contactId}/questions?status=${status}`
    : `${API_BASE_URL}/contacts/${contactId}/questions`;
  const response = await apiFetch(url);
  if (!response.ok) throw new Error('Failed to fetch contact questions');
  return response.json();
};

export const fetchQuestions = async (filters?: {
  status?: QueryStatus;
  contactId?: string;
}): Promise<Question[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.contactId) params.set('contactId', filters.contactId);
  const qs = params.toString();
  const response = await apiFetch(`${API_BASE_URL}/questions${qs ? `?${qs}` : ''}`);
  if (!response.ok) throw new Error('Failed to fetch questions');
  return response.json();
};

export const createQuestion = async (data: {
  question: string;
  conversationId: string;
  contactId: string;
}): Promise<Question> => {
  const response = await apiFetch(`${API_BASE_URL}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create question');
  return response.json();
};

export const answerQuestion = async (id: string, answer: string): Promise<Question> => {
  const response = await apiFetch(`${API_BASE_URL}/questions/${id}/answer`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer }),
  });
  if (!response.ok) throw new Error('Failed to answer question');
  return response.json();
};

export const dismissQuestion = async (
  id: string,
  data?: { question?: string },
): Promise<Question> => {
  const response = await apiFetch(`${API_BASE_URL}/questions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'dismissed', ...data }),
  });
  if (!response.ok) throw new Error('Failed to dismiss question');
  return response.json();
};
