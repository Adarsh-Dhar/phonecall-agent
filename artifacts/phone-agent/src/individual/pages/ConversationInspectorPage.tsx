import { useEffect, useState } from 'react';
import { AppLayout } from '@/individual/components/layout';
import { useSharedState } from '@/hooks/useSharedState';
import * as api from '@/lib/api';
import { ExtractionResultPanel } from '@/individual/components/ExtractionResultPanel';
import { TasksPanel } from '@/individual/components/tasks/TasksPanel';

export function ConversationInspectorPage() {
  const { prefsOpen, setPrefsOpen, currentDate } = useSharedState();
  const [contacts, setContacts] = useState<api.Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [conversations, setConversations] = useState<api.Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<api.Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractionResult, setExtractionResult] = useState<api.ExtractionResult | null>(null);
  const [extracting, setExtracting] = useState(false);

  const loadContacts = async () => {
    try {
      const data = await api.fetchContacts();
      setContacts(data);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  };

  const loadConversations = async (contactId: string) => {
    setLoading(true);
    try {
      const data = await api.fetchConversations(contactId);
      setConversations(data);
      setSelectedConversation(null);
      setExtractionResult(null);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadConversationMessages = async (conversation: api.Conversation) => {
    setLoading(true);
    try {
      const data = await api.fetchConversationMessages(conversation.id);
      setSelectedConversation(data);
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = async () => {
    if (!selectedConversation) return;
    setExtracting(true);
    try {
      const result = await api.extractTasks(selectedConversation.id);
      setExtractionResult(result);
      // Reload tasks
    } catch (err) {
      console.error('Failed to extract:', err);
    } finally {
      setExtracting(false);
    }
  };

  const handleEndConversation = async () => {
    if (!selectedConversation) return;
    try {
      await api.endConversation(selectedConversation.id);
      await loadConversationMessages(selectedConversation);
    } catch (err) {
      console.error('Failed to end conversation:', err);
    }
  };

  useEffect(() => {
    void loadContacts();
  }, []);

  useEffect(() => {
    if (selectedContactId) {
      void loadConversations(selectedContactId);
    }
  }, [selectedContactId]);

  return (
    <AppLayout title="Conversation Inspector" onPrefsOpen={() => setPrefsOpen(true)} currentDate={currentDate} prefsOpen={prefsOpen} onPrefsClose={() => setPrefsOpen(false)}>
      <div className="mx-auto max-w-4xl px-5 py-8 md:px-10 md:py-12">
        <div className="mb-4">
          <label className="mb-2 block text-xs font-bold text-muted-foreground">Contact</label>
          <select
            value={selectedContactId}
            onChange={(e) => setSelectedContactId(e.target.value)}
            className="w-full rounded-xl border border-border bg-[#fbfaf6] px-3 py-2 text-xs outline-none focus:border-[#4168e5] focus:ring-2 focus:ring-[#4168e5]/10"
          >
            <option value="">Select a contact</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.business})
              </option>
            ))}
          </select>
        </div>

        {selectedContactId && (
          <div className="mb-4">
            <label className="mb-2 block text-xs font-bold text-muted-foreground">Conversations</label>
            {loading && conversations.length === 0 ? (
              <div className="text-sm text-muted-foreground">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="text-sm text-muted-foreground">No conversations found for this contact.</div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => void loadConversationMessages(conv)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                      selectedConversation?.id === conv.id
                        ? 'border-[#6b4fc8] bg-[#f0eaff]'
                        : 'border-border bg-card hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{conv.title || 'Untitled'}</p>
                        <p className="text-xs text-muted-foreground">{conv.topicSummary || 'No summary'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          conv.status === 'active' ? 'bg-[#3f8274] text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                          {conv.status || 'unknown'}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedConversation && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {selectedConversation.status === 'active' && (
                <button
                  type="button"
                  onClick={handleEndConversation}
                  className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  End conversation
                </button>
              )}
              <button
                type="button"
                onClick={handleExtract}
                disabled={extracting}
                className="rounded-xl bg-[#6b4fc8] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#5a3fb8] disabled:opacity-40"
              >
                {extracting ? 'Extracting...' : 'Extract now'}
              </button>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 font-bold text-sm">Transcript</h3>
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading messages...</div>
              ) : selectedConversation.messages.length === 0 ? (
                <div className="text-sm text-muted-foreground">No messages in this conversation.</div>
              ) : (
                <div className="space-y-3">
                  {selectedConversation.messages.map((msg) => {
                    const isAgent = msg.speaker === 'agent';
                    const isFromCall = msg.callId !== undefined && msg.callId !== null;
                    return (
                      <div key={msg.id} className="flex gap-3">
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          isAgent ? 'bg-[#3f8274] text-white' : 'bg-[#697a73] text-white'
                        }`}>
                          {isAgent ? 'AI' : 'C'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-muted-foreground">
                              {isAgent ? 'Agent' : 'Contact'}
                            </p>
                            {isFromCall && (
                              <span className="text-[10px] text-muted-foreground">(call)</span>
                            )}
                          </div>
                          <p className="text-sm">{msg.content}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">{msg.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <TasksPanel conversationId={selectedConversation.id} contactId={selectedConversation.contactId} />

            {extractionResult && <ExtractionResultPanel result={extractionResult} />}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
