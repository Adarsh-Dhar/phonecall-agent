import { API_BASE_URL, apiFetch } from './shared';

export type OwnerInfoFact = {
  id: string; category: string; key: string; value: string;
  shareable: boolean; createdAt: string; updatedAt: string;
};

export const fetchOwnerInfo = async (): Promise<OwnerInfoFact[]> => {
  const r = await apiFetch(`${API_BASE_URL}/owner-info`);
  if (!r.ok) throw new Error('Failed to load your info');
  return r.json();
};

async function errorFrom(r: Response, fallback: string): Promise<Error> {
  const body = await r.json().catch(() => null);
  return new Error(body?.error ?? fallback);
}

export const saveOwnerInfo = async (data: { category: string; key: string; value: string; shareable: boolean }) => {
  const r = await apiFetch(`${API_BASE_URL}/owner-info`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  if (!r.ok) throw await errorFrom(r, 'Failed to save');
  return r.json() as Promise<OwnerInfoFact>;
};

export const updateOwnerInfo = async (id: string, data: Partial<Pick<OwnerInfoFact, 'category' | 'value' | 'shareable'>>) => {
  const r = await apiFetch(`${API_BASE_URL}/owner-info/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  if (!r.ok) throw await errorFrom(r, 'Failed to update');
  return r.json() as Promise<OwnerInfoFact>;
};

export const deleteOwnerInfo = async (id: string): Promise<void> => {
  const r = await apiFetch(`${API_BASE_URL}/owner-info/${id}`, { method: 'DELETE' });
  if (!r.ok) throw await errorFrom(r, 'Failed to delete');
};
