import { useCallback, useEffect, useState } from 'react';
import { LoaderCircle, Mic, Phone as PhoneIcon, RefreshCw, X } from 'lucide-react';
import { Link } from 'wouter';
import * as api from '@/lib/api';
import type { Contact } from '@/lib/api';
import { AppLayout } from '@/components/layout';
import { useSharedState } from '@/hooks/useSharedState';
import { CallRow } from '@/components/calls';
import { TestCallWidget } from '@/components/TestCallWidget';
import { CallerCallWidget } from '@/components/calls/CallerCallWidget';
import { dialCall } from '@/lib/api/calls';

export function CallsPage() {
  const { prefsOpen, setPrefsOpen, currentDate } = useSharedState();
  const [calls, setCalls] = useState<api.Call[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showTestCall, setShowTestCall] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'in-progress' | 'missed' | 'declined'>('idle');
  const [callerCallId, setCallerCallId] = useState<string | null>(null);

  const loadCalls = useCallback(async () => {
    setLoading(true);
    try {
      const data = selectedConversationId
        ? await api.fetchConversationCalls(selectedConversationId)
        : await api.fetchAllCalls();
      setCalls(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedConversationId]);

  const loadContacts = useCallback(async () => {
    try {
      const data = await api.fetchContacts();
      setContacts(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { void loadCalls(); }, [loadCalls]);
  useEffect(() => { void loadContacts(); }, [loadContacts]);

  const handleExpandCall = (call: api.Call) => {
    setExpandedCallId(expandedCallId === call.id ? null : call.id);
  };

  const handleCall = async (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    // If contact has a linkedAccountId, use the real call system
    if (contact.linkedAccountId) {
      try {
        setCallStatus('ringing');
        setSelectedContactId(contactId);
        const data = await dialCall(contact.id, undefined);
        
        if (data.status === 'missed') {
          setCallStatus('missed');
          setTimeout(() => setCallStatus('idle'), 3000);
        } else if (data.status === 'ringing') {
          setCallStatus('ringing');
          setCallerCallId(data.callId);
        }
      } catch (error) {
        console.error('Error dialing call:', error);
        setCallStatus('idle');
      }
    } else {
      // Fall back to browser test call for contacts without linkedAccountId
      setSelectedContactId(contactId);
      setShowTestCall(true);
    }
  };

  return (
    <AppLayout title="Calls" onPrefsOpen={() => setPrefsOpen(true)} currentDate={currentDate} prefsOpen={prefsOpen} onPrefsClose={() => setPrefsOpen(false)}>
      <div className="mx-auto max-w-245 px-5 py-8 md:px-10 md:py-12">
        <Link href="/contacts" className="mb-8 block text-xs font-bold text-[#3159c4] hover:underline">← Back to contacts</Link>
        <div className="mb-8">
          <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#e26951]">Communication</p>
          <h1 className="mt-2 font-serif text-5xl tracking-[-.04em]">Calls</h1>
        </div>

        {/* Header row: create button + conversation filter + refresh */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowContactPicker(true)}
              className="flex items-center gap-1.5 rounded-full bg-[#3f8274] px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#356c61]"
            >
              <PhoneIcon size={13} />
              New Call
            </button>
            <button
              type="button"
              onClick={() => setSelectedConversationId(null)}
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[.08em] transition-colors ${
                !selectedConversationId ? 'bg-[#2854cc] text-white' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              All calls
            </button>
            {callStatus !== 'idle' && (
              <span className="rounded-full bg-[#fff0df] px-3 py-1 text-[10px] font-bold uppercase tracking-[.07em] text-[#af5c1c]">
                {callStatus === 'ringing' ? 'Ringing...' : callStatus}
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="Refresh calls"
            onClick={() => void loadCalls()}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading && calls.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <LoaderCircle size={16} className="animate-spin text-muted-foreground" />
          </div>
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#eef4f0] text-[#4a8978]">
              <PhoneIcon size={24} />
            </div>
            <p className="mt-4 font-bold text-[#203039]">No calls yet</p>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Calls will appear here after you place or receive them.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {calls.map((call) => (
              <CallRow
                key={call.id}
                call={call}
                expanded={expandedCallId === call.id}
                onToggle={() => handleExpandCall(call)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Contact picker — choose who to call */}
      {showContactPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">New Call</h2>
                <p className="text-[11px] text-muted-foreground">Select a contact to call with notifications.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowContactPicker(false)}
                className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X size={14} />
              </button>
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-xs font-bold text-muted-foreground">Select contact</label>
              <select
                value={selectedContactId || ''}
                onChange={(e) => setSelectedContactId(e.target.value || null)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-[#a7d0c1]"
              >
                {contacts.length === 0 ? (
                  <option value="" disabled>No contacts available</option>
                ) : (
                  <>
                    <option value="">Select a contact...</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name} {contact.business ? `(${contact.business})` : ''} {contact.linkedAccountId ? '✓' : '(browser only)'}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowContactPicker(false)}
                className="rounded-lg px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedContactId) {
                    handleCall(selectedContactId);
                  }
                  setShowContactPicker(false);
                }}
                disabled={!selectedContactId}
                className="flex items-center gap-1.5 rounded-lg bg-[#3f8274] px-4 py-2 text-xs font-bold text-white hover:bg-[#356c61] disabled:opacity-50"
              >
                <PhoneIcon size={13} /> Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Call in Browser — fallback for contacts without linkedAccountId */}
      {showTestCall && (
        <TestCallWidget
          contactId={selectedContactId || undefined}
          onClose={() => { setShowTestCall(false); setSelectedContactId(null); setCallStatus('idle'); void loadCalls(); }}
        />
      )}

      {callerCallId && (
        <CallerCallWidget
          callId={callerCallId}
          contactName={contacts.find(c => c.id === selectedContactId)?.name}
          onClose={() => { setCallerCallId(null); setCallStatus('idle'); void loadCalls(); }}
        />
      )}
    </AppLayout>
  );
}
