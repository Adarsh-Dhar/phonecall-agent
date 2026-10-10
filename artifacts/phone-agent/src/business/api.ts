const API_BASE = '/api/business';

export interface Contact {
  id: string;
  name: string;
  business: string;
  category: string;
  phone: string;
  initials: string;
  color: string;
  note: string;
  description: string;
  online: boolean;
  linkedAccountId: string | null;
  createdAt: string;
  updatedAt: string;
  conversations: Array<{
    id: string;
    title: string;
    updatedAt: string;
  }>;
}

export interface Call {
  id: string;
  status: string;
  direction: string;
  from: string;
  to: string;
  recordingUrl: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSec: number | null;
  disconnectedBy: string | null;
  isEnoughKnowledge: boolean | null;
  ringingAt: string | null;
  acceptedAt: string | null;
  taskId: string | null;
  outcome: string | null;
  outcomeSummary: string | null;
  confirmedAt: string | null;
  confirmationRef: string | null;
  createdAt: string;
  updatedAt: string;
  conversationId: string;
  contactId: string;
  contact: {
    id: string;
    name: string;
    initials: string;
    color: string;
    phone: string;
    business: string;
    category: string;
    isService: boolean;
    ownerId: string;
    linkedAccountId: string | null;
    displayName?: string;
  };
  viewerRole: 'business';
}

export async function searchAccounts(query: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/accounts/search?q=${encodeURIComponent(query)}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to search accounts');
  return res.json();
}

export async function getContacts(category?: string): Promise<Contact[]> {
  const url = category
    ? `${API_BASE}/contacts?category=${encodeURIComponent(category)}`
    : `${API_BASE}/contacts`;
  const res = await fetch(url, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch contacts');
  return res.json();
}

export async function addContactFromAccount(accountId: string): Promise<Contact> {
  const res = await fetch(`${API_BASE}/contacts/from-account/${accountId}`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to add contact');
  }
  return res.json();
}

export async function deleteContact(contactId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/contacts/${contactId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete contact');
  return res.json();
}

export async function getCalls(): Promise<Call[]> {
  const res = await fetch(`${API_BASE}/calls`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch calls');
  return res.json();
}

export async function getCall(callId: string): Promise<Call> {
  const res = await fetch(`${API_BASE}/calls/${callId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch call');
  return res.json();
}

export async function dialCall(contactId: string, taskId?: string): Promise<{ callId: string; status: string }> {
  console.log('[business api] dialCall called with contactId:', contactId, 'taskId:', taskId);
  const res = await fetch(`${API_BASE}/calls/dial`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contactId, taskId }),
  });
  console.log('[business api] dialCall response status:', res.status);
  if (!res.ok) {
    const error = await res.json();
    console.error('[business api] dialCall error:', error);
    throw new Error(error.error || 'Failed to dial call');
  }
  return res.json();
}

export async function acceptCall(callId: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/calls/${callId}/accept`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to accept call');
  }
  return res.json();
}

export async function declineCall(callId: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/calls/${callId}/decline`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to decline call');
  }
  return res.json();
}

export async function getCallMessages(callId: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/calls/${callId}/messages`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch call messages');
  return res.json();
}
