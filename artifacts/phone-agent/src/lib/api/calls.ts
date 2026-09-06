import { API_BASE_URL, apiFetch } from './shared';

// ─── Call API helpers ─────────────────────────────────────────────────────────

export type CallStatus =
  'initiated' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'no-answer' | 'busy' | 'missed' | 'declined';
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

export type DialCallResponse = {
  callId: string;
  status: 'ringing' | 'missed';
};

/** Fetch a single call by ID. */
export const fetchCall = async (id: string): Promise<Call> => {
  const response = await apiFetch(`${API_BASE_URL}/calls/${id}`);
  if (!response.ok) throw new Error('Failed to fetch call');
  return response.json();
};

/** List all calls for a conversation. */
export const fetchConversationCalls = async (conversationId: string): Promise<Call[]> => {
  const response = await apiFetch(`${API_BASE_URL}/conversations/${conversationId}/calls`);
  if (!response.ok) throw new Error('Failed to fetch conversation calls');
  return response.json();
};

/** List all calls across all conversations. */
export const fetchAllCalls = async (): Promise<Call[]> => {
  const response = await apiFetch(`${API_BASE_URL}/calls`);
  if (!response.ok) throw new Error('Failed to fetch all calls');
  return response.json();
};

/** Dial a call to a service account. */
export const dialCall = async (contactId: string, taskId?: string): Promise<DialCallResponse> => {
  const response = await apiFetch(`${API_BASE_URL}/calls/dial`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contactId, taskId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to dial call');
  }
  return response.json();
};

/** Accept an incoming call. */
export const acceptCall = async (callId: string): Promise<{ status: string }> => {
  const response = await apiFetch(`${API_BASE_URL}/calls/${callId}/accept`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to accept call');
  }
  return response.json();
};

/** Decline an incoming call. */
export const declineCall = async (callId: string): Promise<{ status: string }> => {
  const response = await apiFetch(`${API_BASE_URL}/calls/${callId}/decline`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to decline call');
  }
  return response.json();
};
