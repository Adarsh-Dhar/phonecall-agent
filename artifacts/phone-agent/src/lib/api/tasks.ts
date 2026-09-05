import { API_BASE_URL } from './shared';

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
