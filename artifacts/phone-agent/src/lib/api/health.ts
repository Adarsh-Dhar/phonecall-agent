import { API_BASE_URL, apiFetch } from './shared';

export type NebiusStats = {
  requests: number;
  successes: number;
  failures: number;
  retries: number;
  fallbackCount: number;
  truncated: number;
  promptTokens: number;
  completionTokens: number;
  totalLatencyMs: number;
  lastModelUsed: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
  avgLatencyMs: number | null;
  requestedModel: string;
  fallbackModel: string;
};

export const fetchNebiusHealth = async (): Promise<NebiusStats> => {
  const response = await apiFetch(`${API_BASE_URL}/healthz/nebius`);
  if (!response.ok) throw new Error('Failed to fetch Nebius health');
  return response.json();
};
