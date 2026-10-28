import { useEffect, useState } from 'react';
import { Link, useParams } from 'wouter';
import * as api from '@/lib/api';
import type { Contact } from '@/lib/api';
import { AppLayout } from '@/individual/components/layout';
import { useSharedState } from '@/hooks/useSharedState';
import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/hooks/usePresence';
import { useToast } from '@/hooks/use-toast';
import { Avatar, CallButton } from '@/components/shared';
import { ContactTasksCard } from '@/individual/components/contact/ContactTasksCard';
import { ContactQuestionsCard } from '@/individual/components/contact/ContactQuestionsCard';
import { ContactFilesCard } from '@/individual/components/contact/ContactFilesCard';
import { BusinessHoursCard } from '@/individual/components/contact/BusinessHoursCard';
import { ContactClosureBanner } from '@/individual/components/contact/ContactClosureBanner';
import { KnowledgeBoardPanel } from '@/individual/components/knowledge/KnowledgeBoardPanel';
import { TestCallWidget } from '@/individual/components/TestCallWidget';
import { CallObserverWidget } from '@/individual/components/CallObserverWidget';
import { dialCall, DialCallError } from '@/lib/api/calls';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { updateContact } from '@/lib/api/contacts';

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { prefsOpen, setPrefsOpen, currentDate } = useSharedState();
  const { user } = useAuth();
  const { toast } = useToast();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [callingTask, setCallingTask] = useState<{ taskId?: string; taskTitle?: string } | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'in-progress' | 'missed' | 'declined'>('idle');
  const [testCallWidget, setTestCallWidget] = useState<{ contactId?: string; taskId?: string; taskTitle?: string } | null>(null);
  const [callerCallId, setCallerCallId] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [contactEmail, setContactEmail] = useState<string>('');
  const [allowFallbackMessage, setAllowFallbackMessage] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api.fetchContacts()
      .then((all) => {
        const match = all.find((c) => c.id === id);
        if (match) {
          setContact(match);
          setContactEmail(match.contactEmail ?? '');
          setAllowFallbackMessage(match.allowFallbackMessage ?? false);
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
          setCallerCallId(data.callId);
        }

        // Show warning if call is outside business hours
        if (data.warning === 'BUSINESS_CLOSED') {
          const nextOpenMsg = data.nextOpenAt
            ? ` Next available: ${new Date(data.nextOpenAt).toLocaleString()}`
            : '';
          toast({
            variant: 'warning',
            title: 'Outside Business Hours',
            description: `This contact is outside their business hours.${nextOpenMsg}`,
          });
        }
        if (data.warning === 'BUSINESS_CLOSED' && data.closure) {
          const reopenMsg = data.closure.reopensAt
            ? ` Reopens ${new Date(data.closure.reopensAt).toLocaleString()}`
            : '';
          toast({
            variant: 'warning',
            title: 'Business closed',
            description: `${data.closure.label || data.closure.kind}.${reopenMsg}`,
          });
        }
      } catch (error) {
        console.error('Error dialing call:', error);
        if (error instanceof DialCallError) {
          const reopenMsg = error.reopensAt ? ` Reopens ${new Date(error.reopensAt).toLocaleString()}` : '';
          toast({
            variant: 'destructive',
            title: error.code === 'BUSINESS_CLOSED' ? 'Business closed' : 'Call blocked',
            description: error.message + reopenMsg,
          });
        } else {
          toast({ variant: 'destructive', description: (error as Error).message });
        }
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

  const handleExtractNow = async () => {
    if (!contact) return;
    try {
      setExtracting(true);
      const conversation = await api.fetchContactConversation(contact.id);
      if (conversation.id) {
        // Trigger extraction via the messages endpoint which calls scheduleExtraction
        await api.createMessage(conversation.id, {
          role: 'user',
          content: '',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pending: false,
        });
        toast({ description: 'Extraction scheduled' });
      }
    } catch (error) {
      console.error('Error extracting:', error);
      toast({ variant: 'destructive', description: 'Failed to trigger extraction' });
    } finally {
      setExtracting(false);
    }
  };

  const handleSaveContactSettings = async () => {
    if (!contact) return;
    try {
      setSavingContact(true);
      const updated = await updateContact(contact.id, {
        contactEmail: contactEmail || null,
        allowFallbackMessage,
      });
      setContact(updated);
      toast({ description: 'Contact settings saved' });
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({ variant: 'destructive', description: error instanceof Error ? error.message : 'Failed to save contact settings' });
    } finally {
      setSavingContact(false);
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
              {contact.closure && (
                <span className="rounded-full bg-[#e26951]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.07em] text-[#e26951]">
                  {contact.closure.kind === 'out_of_service' ? 'Out of service' :
                   contact.closure.kind === 'holiday' ? 'Holiday' :
                   contact.closure.kind === 'emergency' ? 'Emergency' : 'Closed'}
                </span>
              )}
              {callStatus !== 'idle' && (
                <span className="rounded-full bg-[#fff0df] px-3 py-1 text-[10px] font-bold uppercase tracking-[.07em] text-[#af5c1c]">
                  {callStatus === 'ringing' ? 'Ringing...' : callStatus}
                </span>
              )}
              <CallButton onCall={handleCall} />
              <button
                type="button"
                onClick={handleExtractNow}
                disabled={extracting}
                className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-40"
              >
                {extracting ? 'Extracting...' : 'Extract now'}
              </button>
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
              {contact.linkedAccountId && (
                <div className="rounded-xl border border-border bg-background px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-[.18em] text-muted-foreground">Messaging if unreachable</p>
                  <div className="mt-3 space-y-3">
                    <div>
                      <Label htmlFor="contact-email" className="text-xs">Contact email (for fallback messages)</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="desk@clinic.com"
                        className="mt-1.5 h-8 text-sm"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <Label htmlFor="allow-fallback" className="cursor-pointer text-xs font-medium leading-none">
                          Message if unreachable
                        </Label>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          Send an email or WhatsApp message when the agent can't reach this contact. Requires at least one valid email or phone.
                        </p>
                      </div>
                      <Switch
                        id="allow-fallback"
                        checked={allowFallbackMessage}
                        onCheckedChange={setAllowFallbackMessage}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveContactSettings}
                      disabled={savingContact}
                      className="w-full rounded-lg bg-[#2854cc] py-2 text-xs font-bold text-white hover:bg-[#2148b4] disabled:opacity-50"
                    >
                      {savingContact ? 'Saving...' : 'Save settings'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && contact && <ContactTasksCard contactId={id} />}
        {!loading && contact && <ContactQuestionsCard contactId={id} />}
        {!loading && contact && <ContactFilesCard contactId={id} />}
        {!loading && contact && <BusinessHoursCard contactId={id} initial={contact.businessHoursJson ?? null} effectiveHours={contact.effectiveHours} hoursSource={contact.hoursSource} isBusinessContact={!!contact.linkedAccountId} />}
        {!loading && contact && <ContactClosureBanner closure={contact.closure ?? null} upcoming={contact.upcomingClosures ?? []} />}
        {!loading && contact && <KnowledgeBoardPanel contactId={id} isBusinessContact={!!contact.linkedAccountId} />}

        {testCallWidget && (
          <TestCallWidget
            contactId={testCallWidget.contactId}
            taskId={testCallWidget.taskId}
            taskTitle={testCallWidget.taskTitle}
            onClose={() => { setTestCallWidget(null); }}
          />
        )}

        {callerCallId && (
          <CallObserverWidget
            callId={callerCallId}
            businessName={contact?.name ?? 'Business'}
            mode="outgoing"
            onClose={() => { setCallerCallId(null); setCallStatus('idle'); }}
          />
        )}
      </div>
    </AppLayout>
  );
}
