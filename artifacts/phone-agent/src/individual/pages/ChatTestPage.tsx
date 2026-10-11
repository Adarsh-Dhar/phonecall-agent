import { FormEvent, useEffect, useState } from 'react';
import { AppLayout } from '@/individual/components/layout';
import { useSharedState } from '@/hooks/useSharedState';
import * as api from '@/lib/api';

type ChatMessage = { role: 'user' | 'assistant'; content: string; model?: string };

export function ChatTestPage() {
  const { prefsOpen, setPrefsOpen, currentDate } = useSharedState();
  const [contacts, setContacts] = useState<api.Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = async () => {
    try {
      const data = await api.fetchContacts();
      setContacts(data);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await api.sendOrchestratorMessage(
        messages.concat(userMessage).map((m) => ({ role: m.role, content: m.content })),
        selectedContactId || undefined,
      );
      setMessages((prev) => [...prev, { role: 'assistant', content: response.message, model: response.model }]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError(null);
  };

  // Load contacts on mount
  useEffect(() => {
    void loadContacts();
  }, []);

  return (
    <AppLayout title="Chat Test" onPrefsOpen={() => setPrefsOpen(true)} currentDate={currentDate} prefsOpen={prefsOpen} onPrefsClose={() => setPrefsOpen(false)}>
      <div className="mx-auto max-w-3xl px-5 py-8 md:px-10 md:py-12">
        <div className="mb-4">
          <label className="mb-2 block text-xs font-bold text-muted-foreground">Contact (optional)</label>
          <select
            value={selectedContactId}
            onChange={(e) => setSelectedContactId(e.target.value)}
            className="w-full rounded-xl border border-border bg-[#fbfaf6] px-3 py-2 text-xs outline-none focus:border-[#4168e5] focus:ring-2 focus:ring-[#4168e5]/10"
          >
            <option value="">No contact selected</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.business})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            Clear
          </button>
        </div>

        <div className="mb-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No messages yet. Start a conversation below.</p>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-xl px-4 py-3 ${
                  msg.role === 'user' ? 'bg-[#6b4fc8] text-white ml-auto max-w-[80%]' : 'bg-muted text-foreground mr-auto max-w-[80%]'
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">{msg.role}</p>
                <p className="text-sm">{msg.content}</p>
                {msg.model && <p className="mt-1 text-[10px] opacity-70">Model: {msg.model}</p>}
              </div>
            ))
          )}
          {loading && (
            <div className="rounded-xl bg-muted px-4 py-3 text-foreground mr-auto max-w-[80%]">
              <p className="text-sm text-muted-foreground">Thinking...</p>
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-[#b44343] bg-[#fde8e8] px-4 py-3">
              <p className="text-sm text-[#b44343]">{error}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={loading}
            className="flex-1 rounded-xl border border-border bg-[#fbfaf6] px-4 py-2 text-sm outline-none focus:border-[#4168e5] focus:ring-2 focus:ring-[#4168e5]/10 disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-[#6b4fc8] px-4 py-2 text-sm font-bold text-white hover:bg-[#5a3fb8] disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
