import { API_BASE_URL, apiFetch } from './shared';

// ─── Call API helpers ─────────────────────────────────────────────────────────

export type CallStatus =
  'initiated' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'no-answer' | 'busy' | 'missed' | 'declined';
export type CallDirection = 'outbound' | 'inbound';

export type CallOutcome =
  'booked' | 'rescheduled' | 'cancelled' | 'info_gathered' | 'needs_user' | 'failed';

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
  // Resolved server-side relative to the viewer — the caller's name when the
  // viewer is the callee (inbound), or the callee's name when the viewer is
  // the caller (outbound). Use this instead of `contact.name` for display.
  otherPartyName: string;
  viewerRole?: 'individual' | 'business';
  outcome: CallOutcome | null;
  outcomeSummary: string | null;
  confirmedAt: string | null;
  confirmationRef: string | null;
  taskId: string | null;
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
  warning?: 'OUTSIDE_BUSINESS_HOURS' | 'BUSINESS_CLOSED';
  nextOpenAt?: string | null;
  closure?: {
    kind: 'holiday' | 'out_of_service' | 'emergency';
    label: string | null;
    message: string | null;
    reopensAt: string | null;
  };
};

/** Thrown by dialCall; code is set for known refusals such as BUSINESS_CLOSED. */
export class DialCallError extends Error {
  code?: string;
  reopensAt?: string | null;
  constructor(message: string, code?: string, reopensAt?: string | null) {
    super(message);
    this.name = 'DialCallError';
    this.code = code;
    this.reopensAt = reopensAt;
  }
}

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
    const error = await response.json().catch(() => ({}));
    throw new DialCallError(error.error || 'Failed to dial call', error.code, error.reopensAt);
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
