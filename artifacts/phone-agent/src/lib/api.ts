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

// ─── Gemini Chat API ─────────────────────────────────────────────────────────

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
