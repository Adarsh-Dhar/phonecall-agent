import { API_BASE_URL } from './shared';

export type AuthUser = {
  id: string;
  googleId: string;
  email: string;
  name: string | null;
  picture: string | null;
  createdAt: string;
};

/** Fetch the currently logged-in user, or null if unauthenticated. */
export const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: 'include',
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error('Failed to fetch current user');
  return response.json();
};

/** Clear the session cookie on the server. */
export const logout = async (): Promise<void> => {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
};
