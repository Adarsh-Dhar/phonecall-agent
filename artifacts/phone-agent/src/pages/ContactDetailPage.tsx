import { useEffect, useState } from 'react';
import { Link, useParams } from 'wouter';
import * as api from '@/lib/api';
import type { Contact } from '@/lib/api';
import { AppLayout } from '@/components/layout';
import { useSharedState } from '@/hooks/useSharedState';
import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/hooks/usePresence';
import { Avatar, CallButton } from '@/components/shared';
import { ContactTasksCard } from '@/components/contact/ContactTasksCard';
import { ContactQuestionsCard } from '@/components/contact/ContactQuestionsCard';
import { ContactFilesCard } from '@/components/contact/ContactFilesCard';
import { TestCallWidget } from '@/components/TestCallWidget';
import { dialCall } from '@/lib/api/calls';

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { prefsOpen, setPrefsOpen, currentDate } = useSharedState();
  const { user } = useAuth();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [callingTask, setCallingTask] = useState<{ taskId?: string; taskTitle?: string } | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'in-progress' | 'missed' | 'declined'>('idle');
  const [testCallWidget, setTestCallWidget] = useState<{ contactId?: string; taskId?: string; taskTitle?: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api.fetchContacts()
      .then((all) => {
        const match = all.find((c) => c.id === id);
        if (match) {
          setContact(match);
        } else {
          setNotFound(true);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Listen for call status updates (only for personal users)
  usePresence(
    () => {}, // No incoming calls for personal users
    (event) => {
      if (event.callId && contact?.linkedAccountId) {
        // This is a call status update for a call we initiated
        setCallStatus(event.status);
        if (event.status === 'missed' || event.status === 'declined') {
          // Reset after a delay
          setTimeout(() => setCallStatus('idle'), 3000);
        }
      }
    }
  );

  const handleCall = async () => {
    if (!contact) return;

    // If contact has a linkedAccountId, use the real call system
    if (contact.linkedAccountId) {
      try {
        setCallStatus('ringing');
        const data = await dialCall(contact.id, callingTask?.taskId);
        
        if (data.status === 'missed') {
          setCallStatus('missed');
          setTimeout(() => setCallStatus('idle'), 3000);
        } else if (data.status === 'ringing') {
          setCallStatus('ringing');
        }
      } catch (error) {
        console.error('Error dialing call:', error);
        setCallStatus('idle');
      }
    } else {
      // Fall back to browser test call for contacts without linkedAccountId
      setTestCallWidget({
        contactId: contact.id,
        taskId: callingTask?.taskId,
        taskTitle: callingTask?.taskTitle,
      });
    }
  };

  return (
    <AppLayout title="Contact" onPrefsOpen={() => setPrefsOpen(true)} currentDate={currentDate} prefsOpen={prefsOpen} onPrefsClose={() => setPrefsOpen(false)}>
      <div className="mx-auto max-w-3xl px-5 py-8 md:px-10 md:py-12">
        <Link href="/contacts" className="mb-8 block text-xs font-bold text-[#3159c4] hover:underline">← Back to contacts</Link>

        {loading ? (
          <div className="flex items-center justify-center py-20">Loading contact…</div>
        ) : notFound || !contact ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">This contact doesn't exist.</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-card-border bg-card p-7 md:p-9">
            <div className="flex items-center gap-4">
              <Avatar contact={contact} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-3xl tracking-tight">{contact.name}</h1>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${contact.online ? 'bg-[#5bc4a3]' : 'bg-[#879a94]'}`} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{contact.business}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#edf1ec] px-3 py-1 text-[10px] font-bold uppercase tracking-[.07em] text-[#58645f]">
                {contact.category}
              </span>
              <span className="rounded-full bg-[#edf1ec] px-3 py-1 text-[10px] font-bold uppercase tracking-[.07em] text-[#58645f]">
                {contact.online ? 'Online' : 'Offline'}
              </span>
              {callStatus !== 'idle' && (
                <span className="rounded-full bg-[#fff0df] px-3 py-1 text-[10px] font-bold uppercase tracking-[.07em] text-[#af5c1c]">
                  {callStatus === 'ringing' ? 'Ringing...' : callStatus}
                </span>
              )}
              <CallButton onCall={handleCall} />
            </div>

            <div className="mt-7 space-y-5">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[.18em] text-muted-foreground">Phone</p>
                <p className="mt-1 text-sm">{contact.phone}</p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[.18em] text-muted-foreground">Description</p>
                <p className="mt-1 text-sm leading-6 text-[#34443f]">{contact.note || 'No description yet.'}</p>
              </div>
              {user?.email && (
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[.18em] text-muted-foreground">Account</p>
                  <p className="mt-1 text-sm text-[#34443f]">{user.email}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && contact && <ContactTasksCard contactId={id} />}
        {!loading && contact && <ContactQuestionsCard contactId={id} />}
        {!loading && contact && <ContactFilesCard />}

        {testCallWidget && (
          <TestCallWidget
            contactId={testCallWidget.contactId}
            taskId={testCallWidget.taskId}
            taskTitle={testCallWidget.taskTitle}
            onClose={() => { setTestCallWidget(null); }}
          />
        )}
      </div>
    </AppLayout>
  );
}
