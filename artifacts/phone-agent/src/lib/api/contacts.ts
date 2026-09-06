import { API_BASE_URL, apiFetch } from './shared';

export type Contact = {
  id: string;
  name: string;
  business: string | null;
  category: string | null;
  phone: string | null;
  initials: string | null;
  color: string | null;
  note: string | null;
  description: string | null;
  online: boolean;
  linkedAccountId: string | null;
  createdAt: string;
  updatedAt: string;
  conversations?: Array<{
    id: string;
    title: string;
    updatedAt: string;
  }>;
};

export type AccountSearchResult = {
  id: string;
  name: string;
  email: string | null;
  picture: string | null;
  isService: boolean;
  business: string | null;
  category: string | null;
  description: string | null;
};

// ── Contacts ──────────────────────────────────────────────────────────────

export const fetchContacts = async (): Promise<Contact[]> => {
  const response = await apiFetch(`${API_BASE_URL}/contacts`);
  if (!response.ok) throw new Error('Failed to fetch contacts');
  return response.json();
};

export const createContact = async (
  data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'linkedAccountId'>,
): Promise<Contact> => {
  const response = await apiFetch(`${API_BASE_URL}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create contact');
  return response.json();
};

// ── Account search + link ─────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Search registered app accounts to add as a contact.
 *  Personal users see service accounts; service accounts see personal users.
 *  Requires at least 2 characters. */
export const searchAccounts = async (q: string): Promise<AccountSearchResult[]> => {
  if (q.trim().length < 2) return [];
  const response = await apiFetch(
    `${API_BASE_URL}/accounts/search?q=${encodeURIComponent(q.trim())}`,
  );
  if (response.status === 401) throw new ApiError(401, 'Session expired — please reload the page');
  if (!response.ok) throw new ApiError(response.status, `Search failed (${response.status})`);
  return response.json();
};

/** Add a found app account as a contact (creates a linked mirror row + conversation). */
export const addContactFromAccount = async (accountId: string): Promise<Contact> => {
  const response = await apiFetch(`${API_BASE_URL}/contacts/from-account/${accountId}`, {
    method: 'POST',
  });
  if (response.status === 409) throw new ApiError(409, 'Already in your contacts');
  if (response.status === 401) throw new ApiError(401, 'Session expired — please reload the page');
  if (response.status === 404) throw new ApiError(404, 'Account no longer exists');
  if (!response.ok) throw new ApiError(response.status, 'Failed to add contact');
  return response.json();
};
