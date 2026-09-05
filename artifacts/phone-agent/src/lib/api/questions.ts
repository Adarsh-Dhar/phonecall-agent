import { API_BASE_URL } from './shared';

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

/** Queries for a single conversation thread. */
export const fetchConversationQueries = async (
  conversationId: string,
  status?: QueryStatus,
): Promise<Query[]> => {
  const url = status
    ? `${API_BASE_URL}/conversations/${conversationId}/queries?status=${status}`
    : `${API_BASE_URL}/conversations/${conversationId}/queries`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch conversation queries');
  return response.json();
};

/** All queries for a contact across all their threads. */
export const fetchContactQueries = async (
  contactId: string,
  status?: QueryStatus,
): Promise<Query[]> => {
  const url = status
    ? `${API_BASE_URL}/contacts/${contactId}/queries?status=${status}`
    : `${API_BASE_URL}/contacts/${contactId}/queries`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch contact queries');
  return response.json();
};

/** Global query inbox — cross-contact, filterable. */
export const fetchQueries = async (filters?: {
  status?: QueryStatus;
  contactId?: string;
}): Promise<Query[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.contactId) params.set('contactId', filters.contactId);
  const qs = params.toString();
  const response = await fetch(`${API_BASE_URL}/queries${qs ? `?${qs}` : ''}`);
  if (!response.ok) throw new Error('Failed to fetch queries');
  return response.json();
};

/** Create a manual query (status: pending). */
export const createQuery = async (data: {
  question: string;
  conversationId: string;
  contactId: string;
}): Promise<Query> => {
  const response = await fetch(`${API_BASE_URL}/queries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create query');
  return response.json();
};

/** Submit an answer to a pending query. */
export const answerQuery = async (id: string, answer: string): Promise<Query> => {
  const response = await fetch(`${API_BASE_URL}/queries/${id}/answer`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer }),
  });
  if (!response.ok) throw new Error('Failed to answer query');
  return response.json();
};

/** Dismiss a query (or edit its question text). */
export const dismissQuery = async (
  id: string,
  data?: { question?: string },
): Promise<Query> => {
  const response = await fetch(`${API_BASE_URL}/queries/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'dismissed', ...data }),
  });
  if (!response.ok) throw new Error('Failed to dismiss query');
  return response.json();
};

// ─── Question types (Knowledge Gap Questions) ─────────────────────────────────────────────────────────────

// Reuse Query type for questions (they use the same underlying model)
export type Question = Query;

// ─── Question API helpers ────────────────────────────────────────────────────────

/** Questions for a single conversation thread. */
export const fetchConversationQuestions = async (
  conversationId: string,
  status?: QueryStatus,
): Promise<Question[]> => {
  const url = status
    ? `${API_BASE_URL}/conversations/${conversationId}/questions?status=${status}`
    : `${API_BASE_URL}/conversations/${conversationId}/questions`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch conversation questions');
  return response.json();
};

/** All questions for a contact across all their threads. */
export const fetchContactQuestions = async (
  contactId: string,
  status?: QueryStatus,
): Promise<Question[]> => {
  const url = status
    ? `${API_BASE_URL}/contacts/${contactId}/questions?status=${status}`
    : `${API_BASE_URL}/contacts/${contactId}/questions`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch contact questions');
  return response.json();
};

/** Global question inbox — cross-contact, filterable. */
export const fetchQuestions = async (filters?: {
  status?: QueryStatus;
  contactId?: string;
}): Promise<Question[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.contactId) params.set('contactId', filters.contactId);
  const qs = params.toString();
  const response = await fetch(`${API_BASE_URL}/questions${qs ? `?${qs}` : ''}`);
  if (!response.ok) throw new Error('Failed to fetch questions');
  return response.json();
};

/** Create a manual question (knowledge gap question, status: pending). */
export const createQuestion = async (data: {
  question: string;
  conversationId: string;
  contactId: string;
}): Promise<Question> => {
  const response = await fetch(`${API_BASE_URL}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create question');
  return response.json();
};

/** Submit an answer to a pending question (knowledge gap question). */
export const answerQuestion = async (id: string, answer: string): Promise<Question> => {
  const response = await fetch(`${API_BASE_URL}/questions/${id}/answer`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer }),
  });
  if (!response.ok) throw new Error('Failed to answer question');
  return response.json();
};

/** Dismiss a question (or edit its question text). */
export const dismissQuestion = async (
  id: string,
  data?: { question?: string },
): Promise<Question> => {
  const response = await fetch(`${API_BASE_URL}/questions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'dismissed', ...data }),
  });
  if (!response.ok) throw new Error('Failed to dismiss question');
  return response.json();
};
