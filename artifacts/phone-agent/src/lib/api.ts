const API_BASE_URL = '/api';

export type Contact = {
  id: string;
  name: string;
  business: string;
  category: string;
  phone: string;
  initials: string;
  color: string;
  note: string | null;
  online: boolean;
  createdAt: string;
  updatedAt: string;
  conversations?: Array<{
    id: string;
    title: string;
    updatedAt: string;
  }>;
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
  callId?: string | null;
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
  contactId?: string;
  contact?: Contact;
  messages: Message[];
  history: History[];
  status?: string;
  endedAt?: string | null;
  topicSummary?: string | null;
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

export const fetchContactConversation = async (contactId: string): Promise<Conversation> => {
  const response = await fetch(`${API_BASE_URL}/contacts/${contactId}/conversation`);
  if (!response.ok) throw new Error('Failed to fetch contact conversation');
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

export const endConversation = async (conversationId: string): Promise<Conversation> => {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to end conversation');
  return response.json();
};

// Messages API
export const fetchMessages = async (conversationId: string): Promise<Message[]> => {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`);
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
};

export const fetchConversationMessages = async (conversationId: string): Promise<Conversation> => {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`);
  if (!response.ok) throw new Error('Failed to fetch conversation');
  const conversation = await response.json();
  // Always fetch messages separately to ensure we have the full conversation
  const messages = await fetchMessages(conversationId);
  return { ...conversation, messages };
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

// ─── Task types ─────────────────────────────────────────────────────────────

export type TaskStatus = 'suggested' | 'open' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'normal' | 'high';
export type TaskSource = 'agent' | 'user';
export type TaskSourceRole = 'created' | 'updated' | 'completed';

export type TaskSourceMessage = {
  id: string;
  taskId: string;
  messageId: string;
  role: TaskSourceRole;
  message: {
    id: string;
    role: string;
    time: string;
    content: string;
  };
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  confidence: number;
  source: TaskSource;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  conversationId: string;
  contactId: string;
  contact?: {
    id: string;
    name: string;
    business: string;
    initials: string;
    color: string;
  };
  sources: TaskSourceMessage[];
  // Google Calendar integration fields
  googleEventId: string | null;
  googleEtag: string | null;
  lastSyncedAt: string | null;
};

// ─── Task API helpers ────────────────────────────────────────────────────────

/** Tasks for a single conversation thread. */
export const fetchConversationTasks = async (
  conversationId: string,
  status?: TaskStatus,
): Promise<Task[]> => {
  const url = status
    ? `${API_BASE_URL}/conversations/${conversationId}/tasks?status=${status}`
    : `${API_BASE_URL}/conversations/${conversationId}/tasks`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch conversation tasks');
  return response.json();
};

/** All tasks for a contact across all their threads. */
export const fetchContactTasks = async (
  contactId: string,
  status?: TaskStatus,
): Promise<Task[]> => {
  const url = status
    ? `${API_BASE_URL}/contacts/${contactId}/tasks?status=${status}`
    : `${API_BASE_URL}/contacts/${contactId}/tasks`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch contact tasks');
  return response.json();
};

/** Global task inbox — cross-contact, filterable. */
export const fetchTasks = async (filters?: {
  status?: TaskStatus;
  priority?: TaskPriority;
  contactId?: string;
}): Promise<Task[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.priority) params.set('priority', filters.priority);
  if (filters?.contactId) params.set('contactId', filters.contactId);
  const qs = params.toString();
  const response = await fetch(`${API_BASE_URL}/tasks${qs ? `?${qs}` : ''}`);
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
};

/** Create a manual task (source: user, goes straight to open). */
export const createTask = async (data: {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  conversationId: string;
  contactId: string;
}): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create task');
  return response.json();
};

/** Update a task's status, title, description, dueDate, or priority. */
export const updateTask = async (
  id: string,
  data: Partial<Pick<Task, 'title' | 'description' | 'dueDate' | 'priority'> & { status: TaskStatus }>,
): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update task');
  return response.json();
};

/** Trigger immediate extraction for a conversation, bypassing the debounce. */
export const extractTasks = async (
  conversationId: string,
): Promise<{ ok: boolean; created: string[]; updated: string[]; completed: string[]; cancelled: string[] }> => {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/extract`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to trigger extraction');
  return response.json();
};

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

// ─── Call API helpers ─────────────────────────────────────────────────────────

export type CallStatus =
  'initiated' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'no-answer' | 'busy';
export type CallDirection = 'outbound' | 'inbound';

export type Call = {
  id: string;
  status: CallStatus;
  direction: CallDirection;
  from: string;
  to: string;
  recordingUrl: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSec: number | null;
  disconnectedBy: string | null;
  isEnoughKnowledge: boolean | null;
  createdAt: string;
  updatedAt: string;
  conversationId: string;
  contactId: string;
  contact?: {
    id: string;
    name: string;
    business: string;
    initials: string;
    color: string;
  };
};

/** Fetch a single call by ID. */
export const fetchCall = async (id: string): Promise<Call> => {
  const response = await fetch(`${API_BASE_URL}/calls/${id}`);
  if (!response.ok) throw new Error('Failed to fetch call');
  return response.json();
};

/** List all calls for a conversation. */
export const fetchConversationCalls = async (conversationId: string): Promise<Call[]> => {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/calls`);
  if (!response.ok) throw new Error('Failed to fetch conversation calls');
  return response.json();
};

/** List all calls across all conversations. */
export const fetchAllCalls = async (): Promise<Call[]> => {
  const response = await fetch(`${API_BASE_URL}/calls`);
  if (!response.ok) throw new Error('Failed to fetch all calls');
  return response.json();
};

// ─── Google Calendar API ─────────────────────────────────────────────────────

export type GoogleAuthStatus = {
  connected: boolean;
  hasAuth: boolean;
  expired: boolean;
};

export type CalendarSyncResult = {
  synced: number;
  errors: number;
};

/** Check Google Calendar connection status */
export const fetchGoogleAuthStatus = async (): Promise<GoogleAuthStatus> => {
  const response = await fetch(`${API_BASE_URL}/auth/google/status`);
  if (!response.ok) throw new Error('Failed to fetch Google auth status');
  return response.json();
};

/** Redirect to Google OAuth consent screen */
export const connectGoogleCalendar = async (): Promise<void> => {
  window.location.href = `${API_BASE_URL}/auth/google`;
};

/** Disconnect Google Calendar */
export const disconnectGoogleCalendar = async (): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to disconnect Google Calendar');
  return response.json();
};

/** Manually trigger calendar sync */
export const syncCalendar = async (): Promise<CalendarSyncResult> => {
  const response = await fetch(`${API_BASE_URL}/calendar/sync`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to sync calendar');
  return response.json();
};

export type GoogleCalendarEvent = {
  id: string;
  summary: string;
  description: string | null;
  start: { dateTime?: string; date?: string } | null;
  end: { dateTime?: string; date?: string } | null;
  status: string;
  htmlLink: string;
};

/** Fetch Google Calendar events */
export const fetchGoogleCalendarEvents = async (): Promise<{ events: GoogleCalendarEvent[] }> => {
  const response = await fetch(`${API_BASE_URL}/calendar/events`);
  if (!response.ok) throw new Error('Failed to fetch Google Calendar events');
  return response.json();
};

// ─── Gemini Chat API ─────────────────────────────────────────────────────────

// Gemini Chat API
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