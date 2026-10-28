import { API_BASE_URL, apiFetch } from './shared';

export type ContactFile = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

const base = (contactId: string) => `${API_BASE_URL}/contacts/${encodeURIComponent(contactId)}/files`;

async function errorFrom(r: Response, fallback: string): Promise<Error> {
  const body = await r.json().catch(() => null);
  return new Error(body?.error ?? fallback);
}

export const fetchContactFiles = async (contactId: string): Promise<ContactFile[]> => {
  const r = await apiFetch(base(contactId));
  if (!r.ok) throw await errorFrom(r, 'Failed to load files');
  return r.json();
};

export const uploadContactFile = async (contactId: string, file: File): Promise<ContactFile> => {
  const form = new FormData();
  form.append('file', file);
  // Do NOT set Content-Type: the browser adds the multipart boundary itself.
  const r = await apiFetch(base(contactId), { method: 'POST', body: form });
  if (!r.ok) throw await errorFrom(r, 'Failed to upload file');
  return r.json();
};

export const deleteContactFile = async (contactId: string, fileId: string): Promise<void> => {
  const r = await apiFetch(`${base(contactId)}/${encodeURIComponent(fileId)}`, { method: 'DELETE' });
  if (!r.ok) throw await errorFrom(r, 'Failed to delete file');
};

/** Same-origin URL; the httpOnly cookie authenticates the download and the server forces "attachment". */
export const contactFileDownloadUrl = (contactId: string, fileId: string) =>
  `${base(contactId)}/${encodeURIComponent(fileId)}/download`;
