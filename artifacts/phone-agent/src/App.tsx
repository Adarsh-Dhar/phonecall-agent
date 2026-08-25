import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import {
  ArrowUpRight, Check, CheckSquare, CircleHelp, History,
  ListTodo, LoaderCircle, Mail as MailIcon, MessageCircle, MoreHorizontal, Paperclip,
  Phone, PhoneCall, PhoneOff,
  Plus, RefreshCw, Send, ShieldCheck, Sparkles, Users, X, Zap,
} from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, Link, useLocation, Redirect, useParams } from 'wouter';
import * as api from '@/lib/api';

const queryClient = new QueryClient();

type Contact = { id: string; name: string; business: string; category: string; phone: string; email: string | null; initials: string; color: string; note: string | null; online: boolean };

const quickPrompts = [
  'Book me a dental cleaning next week, late mornings are best.',
  'Help me follow up on my delayed package PLX-48290.',
  'Find a haircut for Saturday afternoon.',
];

// ---------------------------------------------------------------------------
// Tiny shared primitives
// ---------------------------------------------------------------------------

function IconButton({ label, children, onClick, className = '' }: { label: string; children: ReactNode; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      data-testid={`button-${label.toLowerCase().replaceAll(' ', '-')}`}
      onClick={onClick}
      className={`grid place-items-center transition-transform duration-200 hover:-translate-y-0.5 ${className}`}
    >
      {children}
    </button>
  );
}

function Avatar({ contact, size = 'md' }: { contact: any; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = size === 'sm' ? 'h-7 w-7 text-[10px]' : size === 'lg' ? 'h-12 w-12 text-sm' : 'h-10 w-10 text-xs';
  return (
    <div
      data-testid={`avatar-${contact.id}`}
      className={`grid shrink-0 place-items-center rounded-full font-bold text-[hsl(var(--foreground))] ${sizes}`}
      style={{ background: contact.color }}
    >
      {contact.initials}
    </div>
  );
}

function StatusPill({ busy }: { busy: boolean }) {
  return (
    <span
      data-testid="status-agent"
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.12em] ${busy ? 'bg-[#fff0df] text-[#af5c1c]' : 'bg-[#dcefe9] text-[#216457]'}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${busy ? 'bg-[#e58a34] animate-breathe' : 'bg-[#3b9a83]'}`} />
      {busy ? 'Thinking' : 'Online'}
    </span>
  );
}

// ---------------------------------------------------------------------------
// CallControls — phone button + live call status badge in the chat header
// ---------------------------------------------------------------------------

const CALL_STATUS_META: Record<string, { label: string; color: string; icon: ReactNode }> = {
  initiated:   { label: 'Calling…',   color: 'bg-[#fff0df] text-[#af5c1c]', icon: <LoaderCircle size={13} className="animate-spin" /> },
  ringing:     { label: 'Ringing…',   color: 'bg-[#fff0df] text-[#af5c1c]', icon: <PhoneCall size={13} className="animate-pulse" /> },
  in_progress: { label: 'In call',    color: 'bg-[#dcefe9] text-[#216457]', icon: <PhoneCall size={13} /> },
  completed:   { label: 'Call ended', color: 'bg-[#edf1ec] text-[#58645f]', icon: <PhoneOff size={13} /> },
  failed:      { label: 'Call failed',color: 'bg-[#fde8e8] text-[#b44343]', icon: <PhoneOff size={13} /> },
  no_answer:   { label: 'No answer',  color: 'bg-[#fde8e8] text-[#b44343]', icon: <PhoneOff size={13} /> },
  busy:        { label: 'Busy',       color: 'bg-[#fde8e8] text-[#b44343]', icon: <PhoneOff size={13} /> },
  cancelled:   { label: 'Cancelled',  color: 'bg-[#edf1ec] text-[#58645f]', icon: <PhoneOff size={13} /> },
};

const CALL_TERMINAL_SET = new Set(['completed', 'failed', 'no_answer', 'busy', 'cancelled']);

function CallControls({
  activeCall,
  callError,
  onCall,
  onDismiss,
}: {
  activeCall: api.Call | null;
  callError: string | null;
  onCall: () => void;
  onDismiss: () => void;
}) {
  if (callError) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="max-w-[180px] truncate text-[11px] text-[#b44343]" title={callError}>{callError}</span>
        <button
          type="button"
          aria-label="Dismiss call error"
          onClick={onDismiss}
          className="grid h-6 w-6 place-items-center rounded-full text-[#b44343] hover:bg-[#fde8e8]"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  if (activeCall) {
    const meta = CALL_STATUS_META[activeCall.status] ?? CALL_STATUS_META.initiated;
    const isTerminal = CALL_TERMINAL_SET.has(activeCall.status);

    return (
      <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${meta.color}`}>
        {meta.icon}
        <span>{meta.label}</span>
        {isTerminal && (
          <button
            type="button"
            aria-label="Dismiss call status"
            onClick={onDismiss}
            className="ml-1 opacity-60 hover:opacity-100"
          >
            <X size={11} />
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label="Place call"
      data-testid="button-place-call"
      onClick={onCall}
      className="flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[#f6f3ed] px-3 py-1.5 text-[11px] font-bold text-[#3159c4] transition-all hover:-translate-y-0.5 hover:border-[#a2b4e8] hover:bg-[#edf1ff]"
    >
      <Phone size={13} />
      Call
    </button>
  );
}

// EmailControls — mail button that opens a small compose popover, plus a
// status pill while the send is in flight (mirrors CallControls above).
function EmailControls({
  contactName,
  contactEmail,
  sending,
  sendError,
  lastSent,
  onSend,
  onDismiss,
}: {
  contactName: string;
  contactEmail: string | null;
  sending: boolean;
  sendError: string | null;
  lastSent: boolean;
  onSend: (subject: string, body: string) => void;
  onDismiss: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  if (sendError) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="max-w-[180px] truncate text-[11px] text-[#b44343]" title={sendError}>{sendError}</span>
        <button
          type="button"
          aria-label="Dismiss email error"
          onClick={onDismiss}
          className="grid h-6 w-6 place-items-center rounded-full text-[#b44343] hover:bg-[#fde8e8]"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  if (sending) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-[#f1f0ea] px-3 py-1.5 text-[11px] font-bold text-[#697a73]">
        <LoaderCircle size={12} className="animate-spin" />
        <span>Sending…</span>
      </div>
    );
  }

  if (lastSent) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-[#e9f3ec] px-3 py-1.5 text-[11px] font-bold text-[#3f8274]">
        <Check size={12} />
        <span>Sent</span>
        <button type="button" aria-label="Dismiss" onClick={onDismiss} className="ml-1 opacity-60 hover:opacity-100">
          <X size={11} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Compose email"
        data-testid="button-compose-email"
        onClick={() => setOpen((v) => !v)}
        disabled={!contactEmail}
        title={contactEmail ? undefined : `${contactName} has no email address on file`}
        className="flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[#f6f3ed] px-3 py-1.5 text-[11px] font-bold text-[#3f8274] transition-all hover:-translate-y-0.5 hover:border-[#a7d0c1] hover:bg-[#edf7f1] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <MailIcon size={13} />
        Email
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-20 w-80 rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-3 shadow-[0_16px_40px_rgba(39,53,58,.12)]">
          <p className="mb-2 text-[11px] font-bold text-[hsl(var(--muted-foreground))]">
            Email {contactName} · {contactEmail}
          </p>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="mb-2 w-full rounded-lg border border-[hsl(var(--border))] px-2.5 py-1.5 text-xs outline-none focus:border-[#a7d0c1]"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message…"
            rows={4}
            className="mb-2 w-full resize-none rounded-lg border border-[hsl(var(--border))] px-2.5 py-1.5 text-xs outline-none focus:border-[#a7d0c1]"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-[hsl(var(--muted-foreground))] hover:bg-[#f1f0ea]"
            >
              Cancel
            </button>
            <button
              type="button"
              data-testid="button-send-email"
              disabled={!subject.trim() || !body.trim()}
              onClick={() => {
                onSend(subject.trim(), body.trim());
                setOpen(false);
                setSubject('');
                setBody('');
              }}
              className="rounded-lg bg-[#3f8274] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#356c61] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared layout — sidebar + header shell
// ---------------------------------------------------------------------------

function AppLayout({
  children,
  title,
  busy = false,
  onPrefsOpen,
  currentDate,
  prefsOpen,
  onPrefsClose,
}: {
  children: ReactNode;
  title: string;
  busy?: boolean;
  onPrefsOpen: () => void;
  currentDate: string;
  prefsOpen: boolean;
  onPrefsClose: () => void;
}) {
  const [location] = useLocation();

  const navItems = [
    { path: '/messages', label: 'Messages', icon: <MessageCircle size={16} />, testId: 'nav-inbox' },
    { path: '/history', label: 'Task history', icon: <History size={16} />, testId: 'nav-history' },
    { path: '/contacts', label: 'Contacts', icon: <Users size={16} />, testId: 'nav-contacts' },
  ] as const;

  const isActive = (path: string) => {
    if (path === '/messages') return location === '/messages' || location === '/';
    return location.startsWith(path);
  };

  return (
    <div className="grain min-h-[100dvh] bg-[hsl(var(--background))]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[224px] flex-col bg-[hsl(var(--sidebar))] px-5 py-6 text-[hsl(var(--sidebar-foreground))] md:flex">
        <Link href="/messages" className="flex items-center gap-3 text-left">
          <span className="grid h-9 w-9 place-items-center rounded-[13px] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
            <MessageCircle size={17} strokeWidth={2.5} />
          </span>
          <span>
            <strong className="block text-[15px] tracking-tight">phone agent</strong>
            <small className="font-mono text-[9px] uppercase tracking-[.18em] text-[#a8b9b2]">personal inbox</small>
          </span>
        </Link>

        <div className="mt-14">
          <p className="mb-3 px-3 font-mono text-[9px] uppercase tracking-[.18em] text-[#879a94]">Workspace</p>
          <nav className="space-y-1">
            {navItems.map(({ path, label, icon, testId }) => (
              <Link
                key={path}
                href={path}
                data-testid={testId}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  isActive(path) ? 'bg-[#2d3b3c] text-[#fff8ec]' : 'text-[#aab9b3] hover:bg-[#273435] hover:text-[#fff8ec]'
                }`}
              >
                {icon}
                <span>{label}</span>
                {path === '/messages' && busy ? <span className="ml-auto h-2 w-2 rounded-full bg-[hsl(var(--accent))]" /> : null}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto rounded-2xl border border-[#3a4a48] bg-[#243232] p-4">
          <div className="mb-3 flex items-center justify-between">
            <ShieldCheck size={17} className="text-[#ff9a7f]" />
            <span className="font-mono text-[9px] uppercase tracking-[.13em] text-[#9fb0aa]">Your preferences</span>
          </div>
          <p className="text-xs leading-5 text-[#dce5df]">I'll help you think things through and keep the next step clear.</p>
          <button
            type="button"
            data-testid="button-open-preferences"
            onClick={onPrefsOpen}
            className="mt-3 text-xs font-bold text-[#ffad95] hover:text-[#ffd0c2]"
          >
            Review preferences <ArrowUpRight className="ml-1 inline" size={13} />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-2 px-2 text-xs text-[#91a19c]">
          <span className="h-2 w-2 rounded-full bg-[#5bc4a3]" /> Gemini is ready
        </div>
      </aside>

      {/* Main content */}
      <main className="min-h-[100dvh] md:ml-[224px]">
        <header className="flex h-[76px] items-center justify-between border-b border-[hsl(var(--border))] px-5 md:px-10">
          <div className="flex items-center gap-3 md:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[hsl(var(--accent))]">
              <MessageCircle size={15} />
            </span>
            <strong className="text-sm">phone agent</strong>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">{currentDate}</span>
            <span className="text-[hsl(var(--border))]">/</span>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">{title}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <IconButton label="help" onClick={onPrefsOpen} className="h-9 w-9 rounded-full text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]">
              <CircleHelp size={18} />
            </IconButton>
            <div className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-[#c8d9e8] text-[10px] font-bold">AP</div>
          </div>
        </header>

        {children}
      </main>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[#3c4c4d] bg-[#243434] p-1 shadow-xl md:hidden">
        {navItems.map(({ path, label, testId }) => (
          <Link
            key={path}
            href={path}
            data-testid={`mobile-${testId}`}
            className={`rounded-full px-4 py-2 text-xs font-bold ${
              isActive(path) ? 'bg-[#ff9478] text-[#3b211b]' : 'text-[#d1dcd5]'
            }`}
          >
            {label === 'Task history' ? 'History' : label}
          </Link>
        ))}
      </div>

      {prefsOpen ? <Preferences onClose={onPrefsClose} /> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared layout state hook — manages date, prefs modal, contacts
// ---------------------------------------------------------------------------

function useSharedState() {
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
      setCurrentDate(new Intl.DateTimeFormat('en-US', options).format(now));
    };
    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  return { prefsOpen, setPrefsOpen, currentDate };
}

// ---------------------------------------------------------------------------
// /messages  and  /messages/:contactId  — same inbox UI, contact-scoped chat
// ---------------------------------------------------------------------------

function InboxPage() {
  const { contactId: urlContactId } = useParams<{ contactId?: string }>();
  const { prefsOpen, setPrefsOpen, currentDate } = useSharedState();
  const [, navigate] = useLocation();

  // Contacts + history list
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [history, setHistory] = useState<api.History[]>([]);
  const [loading, setLoading] = useState(true);

  // The live conversation for the active contact
  const [conversation, setConversation] = useState<api.Conversation | null>(null);
  const [convLoading, setConvLoading] = useState(false);

  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // ── Call state ────────────────────────────────────────────────────────────
  const [activeCall, setActiveCall] = useState<api.Call | null>(null);
  const [callError, setCallError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Keep a stable ref to the resolved contact id so the polling callback
  // can access the latest value without being recreated on every render.
  const resolvedContactIdRef = useRef<string>('');

  /** Terminal statuses — stop polling once reached */
  const CALL_TERMINAL: api.CallStatus[] = ['completed', 'failed', 'no_answer', 'busy', 'cancelled'];

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  /** Start status-polling loop for a call */
  const startPolling = useCallback((call: api.Call) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const updated = await api.fetchCall(call.id);
        setActiveCall(updated);
        if (CALL_TERMINAL.includes(updated.status)) {
          stopPolling();
          // Reload conversation so new transcript messages appear
          const cid = resolvedContactIdRef.current;
          if (cid) {
            api.fetchContactConversation(cid)
              .then((conv) => setConversation(conv))
              .catch(() => null);
          }
        }
      } catch {
        // non-fatal — keep polling
      }
    }, 2000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopPolling]);

  // Clean up polling on unmount or contact change
  useEffect(() => () => stopPolling(), [stopPolling]);

  const placeCall = async () => {
    if (!activeContact || activeCall) return;
    setCallError(null);
    try {
      const call = await api.placeCall(activeContact.id);
      setActiveCall(call);
      startPolling(call);
    } catch (err) {
      setCallError(err instanceof Error ? err.message : 'Could not place call');
    }
  };

  const dismissCall = () => {
    stopPolling();
    setActiveCall(null);
    setCallError(null);
  };

  // Email compose state (mirrors call state above)
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailLastSent, setEmailLastSent] = useState(false);

  const sendEmail = async (subject: string, body: string) => {
    if (!activeContact) return;
    setEmailSending(true);
    setEmailError(null);
    setEmailLastSent(false);
    try {
      await api.sendEmail({ contactId: activeContact.id, subject, body });
      setEmailLastSent(true);
      // Refresh the thread so the outbound email shows up as a message.
      if (conversation) {
        api.fetchContactConversation(resolvedContactId).then(setConversation).catch(() => {});
      }
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Could not send email');
    } finally {
      setEmailSending(false);
    }
  };

  const dismissEmail = () => {
    setEmailError(null);
    setEmailLastSent(false);
  };

  // Load contacts + history once
  useEffect(() => {
    const loadData = async () => {
      try {
        const [contactsData, historyData] = await Promise.all([api.fetchContacts(), api.fetchHistory()]);
        setContacts(contactsData);
        setHistory(historyData);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Resolve the active contact id: URL param takes priority, otherwise Phone Agent
  // If URL param is invalid (contact doesn't exist), fall back to a valid contact
  const resolvedContactId = (() => {
    if (urlContactId) {
      const matched = contacts.find((c) => c.id === urlContactId);
      if (matched) {
        return urlContactId;
      }
      // URL param exists but contact doesn't - fall back
      console.warn('[InboxPage] URL contact ID not found, falling back:', urlContactId);
    }
    // No URL param or invalid - use fallback logic
    return contacts.find((c) => c.name === 'Phone Agent')?.id
      || contacts[contacts.length - 1]?.id
      || '';
  })();

  // Keep the ref in sync so the polling callback always sees the latest value
  resolvedContactIdRef.current = resolvedContactId;

  // Log on mount and whenever the URL contact id changes
  useEffect(() => {
    if (!urlContactId) return;
    console.log('[InboxPage] contactId from URL:', urlContactId);
    const matched = contacts.find((c) => c.id === urlContactId);
    if (matched) {
      console.log('[InboxPage] matched contact:', matched.name, '|', matched.business);
    } else {
      console.warn('[InboxPage] no contact found for id:', urlContactId);
    }
  }, [urlContactId, contacts]);

  // Load conversation whenever the resolved contact changes
  useEffect(() => {
    if (!resolvedContactId) return;
    setConvLoading(true);
    setConversation(null);
    api.fetchContactConversation(resolvedContactId)
      .then((conv) => {
        console.log('[InboxPage] conversation loaded for:', conv.contact?.name ?? resolvedContactId);
        setConversation(conv);
      })
      .catch((err) => {
        console.error('[InboxPage] Failed to fetch conversation:', err);
        // If conversation fetch fails, try to get conversation from contact data
        const matchedContact = contacts.find((c) => c.id === resolvedContactId);
        if (matchedContact && matchedContact.conversations && matchedContact.conversations.length > 0) {
          const convFromContact = matchedContact.conversations[0];
          console.log('[InboxPage] using conversation from contact data:', convFromContact.title);
          setConversation(convFromContact as any);
        } else {
          console.warn('[InboxPage] No conversation available for contact');
          setConversation(null);
        }
      })
      .finally(() => setConvLoading(false));
  }, [resolvedContactId, contacts]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conversation?.messages, busy]);

  const switchContact = (id: string) => {
    navigate(`/messages/${id}`);
  };

  const sendMessage = async (text = draft) => {
    const content = text.trim();
    if (!content || busy || !conversation) return;

    const userMsg: api.Message = {
      id: `user-${Date.now()}`, role: 'user', content, time: 'Now',
      pending: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      conversationId: conversation.id,
    };
    setConversation((c) => c ? { ...c, messages: [...c.messages, userMsg] } : null);
    setDraft('');
    setBusy(true);

    try {
      const payload = await api.sendGeminiMessage(
        [...conversation.messages, userMsg].map(({ role, content: v }) => ({ role, content: v })),
        activeContact?.id,
      );
      const assistantMsg: api.Message = {
        id: `assistant-${Date.now()}`, role: 'assistant',
        content: payload.message || "I'm here. What should we work on?",
        time: 'Now', pending: false,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        conversationId: conversation.id,
      };
      setConversation((c) => c ? { ...c, messages: [...c.messages, assistantMsg] } : null);

      // Persist both messages
      await api.createMessage(conversation.id, { role: 'user', content, time: 'Now', pending: false });
      await api.createMessage(conversation.id, { role: 'assistant', content: assistantMsg.content, time: 'Now', pending: false });

      // History entry
      try {
        const newHistory = history.length > 0
          ? await api.createHistory(history[0].conversationId, { title: content.slice(0, 32), detail: `Chat with ${activeContact?.name ?? 'contact'} · Gemini`, status: 'Completed', time: 'Just now' })
          : await api.createHistoryWithConversation({ title: content.slice(0, 32), detail: `Chat with ${activeContact?.name ?? 'contact'} · Gemini`, status: 'Completed', time: 'Just now' });
        setHistory((c) => [newHistory, ...c]);
      } catch {
        setHistory((c) => [{ id: `h-${Date.now()}`, title: content.slice(0, 32), detail: 'Chat · Gemini response', status: 'Completed', time: 'Just now' } as api.History, ...c]);
      }
    } catch (error) {
      setConversation((c) => c ? { ...c, messages: [...c.messages, {
        id: `error-${Date.now()}`, role: 'assistant',
        content: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        time: 'Now', pending: false,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        conversationId: conversation.id,
      }] } : null);
    } finally {
      setBusy(false);
    }
  };

  // Derive the active contact: prefer embedded in conversation (always correct),
  // fall back to contacts list lookup by resolved id.
  const activeContact =
    conversation?.contact as Contact | undefined
    ?? contacts.find((c) => c.id === resolvedContactId);
  const chatMessages = (conversation?.messages ?? []).filter(
    (m) => !m.content.startsWith('Answering: "')
  );

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <AppLayout title="Messages" busy={busy} onPrefsOpen={() => setPrefsOpen(true)} currentDate={currentDate} prefsOpen={prefsOpen} onPrefsClose={() => setPrefsOpen(false)}>
      <div className="mx-auto max-w-[1280px] px-5 py-8 md:px-10 md:py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="animate-rise">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#e26951]">Good morning, Alex</p>
            <h1 className="max-w-[600px] font-serif text-[clamp(2.5rem,5vw,4.7rem)] leading-[.94] tracking-[-.055em] text-[#203039]">
              A little help,<br className="hidden md:block" /> right here.
            </h1>
          </div>
          <div className="animate-rise animate-rise-1 flex items-center gap-2 rounded-2xl border border-[hsl(var(--border))] bg-[#f2eee5] px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]">
            <Zap size={15} className="text-[#e26951]" />
            <span>3 quiet hours saved this week</span>
          </div>
        </div>

        <section className="animate-rise animate-rise-1 grid gap-5 xl:grid-cols-[minmax(0,1.34fr)_minmax(300px,.66fr)]">
          {/* Chat panel */}
          <div className="flex min-h-[620px] flex-col overflow-hidden rounded-[24px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] shadow-[0_16px_45px_rgba(39,53,58,.06)]">
            {/* Chat header — shows the active contact */}
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4 md:px-7">
              <div className="flex items-center gap-3">
                {activeContact && <Avatar contact={activeContact} />}
                <div>
                  <h2 className="text-sm font-bold">{activeContact?.name ?? 'Select a contact'}</h2>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{activeContact?.business ?? ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Call button + live status */}
                {activeContact && (
                  <CallControls
                    activeCall={activeCall}
                    callError={callError}
                    onCall={() => void placeCall()}
                    onDismiss={dismissCall}
                  />
                )}
                {/* Email compose button + send status */}
                {activeContact && (
                  <EmailControls
                    contactName={activeContact.name}
                    contactEmail={activeContact.email ?? null}
                    sending={emailSending}
                    sendError={emailError}
                    lastSent={emailLastSent}
                    onSend={(subject, body) => void sendEmail(subject, body)}
                    onDismiss={dismissEmail}
                  />
                )}
                <StatusPill busy={busy} />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6 md:px-7">
              {convLoading ? (
                <div className="flex items-center justify-center py-10">
                  <span className="inline-flex items-center gap-2 text-xs text-[#697a73]"><LoaderCircle size={13} className="animate-spin" /> Loading conversation…</span>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">No messages yet. Say hello!</p>
                </div>
              ) : chatMessages.map((message) => (
                <div key={message.id} data-testid={`message-${message.role}`} className={`flex gap-3 animate-rise ${message.role === 'user' ? 'justify-end' : ''}`}>
                  <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'rounded-br-md bg-[#2854cc] text-white' : 'rounded-bl-md bg-[#edf1ec] text-[#34443f]'}`}>
                    <p>{message.content}</p>
                    <span className={`mt-2 block text-[10px] ${message.role === 'user' ? 'text-[#c9d5ff]' : 'text-[#82918a]'}`}>{message.time}</span>
                  </div>
                </div>
              ))}
              {busy ? (
                <div className="flex gap-3">
                  <div className="rounded-2xl rounded-bl-md bg-[#edf1ec] px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-xs text-[#697a73]"><LoaderCircle size={13} className="animate-spin" /> Thinking through it</span>
                  </div>
                </div>
              ) : null}
              <div ref={endRef} />
            </div>

            {/* Compose */}
            <div className="border-t border-[hsl(var(--border))] px-5 py-4 md:px-7">
              <div className="mb-3 flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    type="button"
                    data-testid="button-quick-prompt"
                    key={prompt}
                    onClick={() => setDraft(prompt)}
                    className="rounded-full border border-[hsl(var(--border))] bg-[#f6f3ed] px-3 py-2 text-xs font-medium text-[#58645f] transition-all hover:-translate-y-0.5 hover:border-[#a2b4e8] hover:bg-[#edf1ff] hover:text-[#244dbd]"
                  >
                    {prompt.length > 38 ? `${prompt.slice(0, 38)}…` : prompt}
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-2 rounded-2xl border border-[hsl(var(--border))] bg-[#fbfaf6] p-2 focus-within:border-[#4168e5] focus-within:ring-4 focus-within:ring-[#4168e5]/10">
                <button type="button" aria-label="attach file" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[#82918a] hover:bg-[#edf1ec]"><Paperclip size={17} /></button>
                <textarea
                  data-testid="input-message"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }}
                  placeholder={activeContact ? `Message ${activeContact.name}…` : 'What would you like help with?'}
                  className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 outline-none placeholder:text-[#99a19d]"
                  disabled={convLoading || !conversation}
                />
                <button
                  type="button"
                  data-testid="button-send-message"
                  onClick={() => void sendMessage()}
                  disabled={busy || !draft.trim() || convLoading || !conversation}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#2854cc] text-white transition-all hover:-translate-y-0.5 hover:bg-[#2148b4] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-[hsl(var(--muted-foreground))]">Powered by Gemini · Press Enter to send</p>
            </div>
          </div>

          {/* Right column — tasks panel + supporting widgets */}
          <div className="space-y-5">
            <div className="rounded-[24px] border border-[hsl(var(--card-border))] bg-[#eef4f0] p-5 md:p-7">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#588176]">How it works</p>
                  <h3 className="mt-2 font-serif text-3xl tracking-tight text-[#233b3b]">Quiet by default.</h3>
                  <p className="mt-2 text-xs leading-5 text-[#55716a]">Start with a message. Get a useful next step, not a wall of text.</p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d2e8df] text-[#3f8274]"><Sparkles size={18} /></div>
              </div>
              <div className="mt-7 space-y-4 text-xs text-[#55716a]">
                {[['01', 'Tell me what you need'], ['02', 'I help you make a plan'], ['03', 'You stay in control']].map(([num, label]) => (
                  <div className="flex items-center gap-3" key={num}>
                    <strong className="font-mono text-lg text-[#3f8274]">{num}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <TasksPanel
              conversationId={conversation?.id}
              contactId={activeContact?.id}
            />

            <QueriesPanel
              conversationId={conversation?.id}
              contactId={activeContact?.id}
            />

            <RecentTasksWidget history={history} />

            {/* Active conversation card — click name navigates, Change goes to contacts */}
            {activeContact && (
              <div className="rounded-[22px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5">
                <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Active conversation</p>
                <div className="mt-4 flex items-center gap-3">
                  <Avatar contact={activeContact} size="sm" />
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-xs">{activeContact.name}</strong>
                    <small className="text-[10px] text-[hsl(var(--muted-foreground))]">{activeContact.business}</small>
                  </div>
                  <Link
                    href="/contacts"
                    data-testid="button-change-contact"
                    className="text-[10px] font-bold text-[#3159c4] hover:underline"
                  >
                    Change
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

// ---------------------------------------------------------------------------
// /history — History page
// ---------------------------------------------------------------------------

function HistoryPage() {
  const { prefsOpen, setPrefsOpen, currentDate } = useSharedState();
  const [tasks, setTasks] = useState<api.Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchTasks();
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadTasks(); }, [loadTasks]);

  const handleStatusChange = async (taskId: string, status: api.TaskStatus) => {
    try {
      const updated = await api.updateTask(taskId, { status });
      setTasks((prev) => prev.map((t) => t.id === taskId ? updated : t));
    } catch { /* no-op */ }
  };

  const visible = filter === 'active'
    ? tasks.filter((t) => ACTIVE_STATUSES.includes(t.status as api.TaskStatus))
    : tasks;

  const suggestedCount = tasks.filter((t) => t.status === 'suggested').length;

  return (
    <AppLayout title="Tasks" onPrefsOpen={() => setPrefsOpen(true)} currentDate={currentDate} prefsOpen={prefsOpen} onPrefsClose={() => setPrefsOpen(false)}>
      <div className="mx-auto max-w-[980px] px-5 py-8 md:px-10 md:py-12">
        <Link href="/messages" className="mb-8 block text-xs font-bold text-[#3159c4] hover:underline">← Back to messages</Link>
        <div className="mb-8">
          <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#e26951]">All contacts</p>
          <h1 className="mt-2 font-serif text-5xl tracking-[-.04em]">Tasks</h1>
        </div>

        {/* Header row: filter tabs + refresh */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {(['active', 'all'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[.08em] transition-colors ${
                  filter === f ? 'bg-[#2854cc] text-white' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
                }`}
              >
                {f === 'active' ? 'Active' : 'All'}
              </button>
            ))}
            {suggestedCount > 0 && (
              <span className="ml-1 text-[10px] text-[#995500]">{suggestedCount} suggested</span>
            )}
          </div>
          <button
            type="button"
            aria-label="Refresh tasks"
            onClick={() => void loadTasks()}
            className="grid h-7 w-7 place-items-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading && tasks.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <LoaderCircle size={16} className="animate-spin text-[hsl(var(--muted-foreground))]" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#eef4f0] text-[#4a8978]">
              <ListTodo size={24} />
            </div>
            <p className="mt-4 font-bold text-[#203039]">
              {filter === 'active' ? 'No active tasks' : 'No tasks yet'}
            </p>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              {filter === 'active' ? 'Switch to All to see completed tasks.' : 'Tasks will appear here after your first conversation.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((task) => (
              <TaskRowWithContact key={task.id} task={task} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function TaskRowWithContact({
  task,
  onStatusChange,
}: {
  task: api.Task;
  onStatusChange: (id: string, status: api.TaskStatus) => void;
}) {
  return (
    <div className="flex flex-col gap-0">
      {task.contact && (
        <div className="mb-0.5 flex items-center gap-1.5 px-1">
          <Link
            href={`/messages/${task.contact.id}`}
            className="flex items-center gap-1.5 text-[10px] font-bold text-[#3159c4] hover:underline"
          >
            <span
              className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-[8px] font-bold"
              style={{ background: task.contact.color }}
            >
              {task.contact.initials.slice(0, 1)}
            </span>
            {task.contact.name}
          </Link>
        </div>
      )}
      <TaskRow task={task} onStatusChange={onStatusChange} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// /contacts — Contacts page
// ---------------------------------------------------------------------------

function ContactsPage() {
  const { prefsOpen, setPrefsOpen, currentDate } = useSharedState();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.fetchContacts().then(setContacts).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout title="Contacts" onPrefsOpen={() => setPrefsOpen(true)} currentDate={currentDate} prefsOpen={prefsOpen} onPrefsClose={() => setPrefsOpen(false)}>
      <div className="mx-auto max-w-[980px] px-5 py-8 md:px-10 md:py-12">
        <Link href="/messages" className="mb-8 block text-xs font-bold text-[#3159c4] hover:underline">← Back to messages</Link>
        <div className="mb-8">
          <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#e26951]">Your network</p>
          <h1 className="mt-2 font-serif text-5xl tracking-[-.04em]">Contacts</h1>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20">Loading contacts…</div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <Link
                key={contact.id}
                href={`/messages/${contact.id}`}
                className="flex w-full items-center gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 transition-transform hover:-translate-y-0.5"
              >
                <Avatar contact={contact} />
                <div className="min-w-0 flex-1 text-left">
                  <h3 className="font-bold">{contact.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{contact.business}</p>
                  {contact.email && <p className="mt-1 text-xs text-muted-foreground">{contact.email}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${contact.online ? 'bg-[#5bc4a3]' : 'bg-[#879a94]'}`} />
                  <span className="text-xs text-muted-foreground">{contact.online ? 'Online' : 'Offline'}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ---------------------------------------------------------------------------
// QueriesPanel — pending questions surfaced from the active conversation
// ---------------------------------------------------------------------------

function QueriesPanel({
  conversationId,
  contactId,
}: {
  conversationId: string | undefined;
  contactId: string | undefined;
}) {
  const [queries, setQueries] = useState<api.Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  // answer drafts keyed by query id
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  // Global inbox — questions can come from ANY business contact's
  // conversation, not just whichever one happens to be open right now, so
  // this intentionally does not scope by conversationId/contactId.
  const loadQueries = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch questions (knowledge gap questions) instead of general queries
      // since email escalation creates questions with isKnowledgeGap: true
      const data = await api.fetchQuestions();
      setQueries(data);
    } catch {
      // non-critical — panel is best-effort
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueries();
    // Poll so escalations that arrive while the app is open (e.g. a new
    // inbound email from a business) show up without a manual refresh.
    const interval = setInterval(() => void loadQueries(), 15000);
    return () => clearInterval(interval);
  }, [loadQueries]);

  const handleAnswer = async (query: api.Question) => {
    const answer = (drafts[query.id] ?? '').trim();
    if (!answer || submitting[query.id]) return;
    setSubmitting((s) => ({ ...s, [query.id]: true }));
    try {
      // Use answerQuestion endpoint for knowledge gap questions
      const updated = await api.answerQuestion(query.id, answer);
      setQueries((prev) => prev.map((q) => q.id === query.id ? updated : q));
      setDrafts((d) => { const n = { ...d }; delete n[query.id]; return n; });
    } catch { /* no-op */ } finally {
      setSubmitting((s) => ({ ...s, [query.id]: false }));
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      // Use dismissQuestion endpoint for knowledge gap questions
      const updated = await api.dismissQuestion(id);
      setQueries((prev) => prev.map((q) => q.id === id ? updated : q));
    } catch { /* no-op */ }
  };

  const pendingCount = queries.filter((q) => q.status === 'pending').length;
  const visible = filter === 'pending'
    ? queries.filter((q) => q.status === 'pending')
    : queries;

  return (
    <section className="rounded-[22px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#f0eaff] text-[#6b4fc8]">
            <CircleHelp size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Questions</h3>
            {pendingCount > 0 && (
              <p className="text-[10px] text-[#7a4fc8]">{pendingCount} need{pendingCount === 1 ? 's' : ''} your answer</p>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-label="Refresh questions"
          onClick={() => void loadQueries()}
          className="grid h-7 w-7 place-items-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mt-3 flex gap-1">
        {(['pending', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[.08em] transition-colors ${
              filter === f ? 'bg-[#6b4fc8] text-white' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
            }`}
          >
            {f === 'pending' ? 'Pending' : 'All'}
          </button>
        ))}
      </div>

      {/* Query list */}
      <div className="mt-3 space-y-3">
        {loading && queries.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <LoaderCircle size={14} className="animate-spin text-[hsl(var(--muted-foreground))]" />
          </div>
        ) : visible.length === 0 ? (
          <p className="py-3 text-center text-xs text-[hsl(var(--muted-foreground))]">
            {filter === 'pending' ? 'No pending questions — good to go.' : 'No questions yet.'}
          </p>
        ) : (
          visible.map((query) => (
            <QueryRow
              key={query.id}
              query={query}
              draft={drafts[query.id] ?? ''}
              submitting={!!submitting[query.id]}
              onDraftChange={(v) => setDrafts((d) => ({ ...d, [query.id]: v }))}
              onAnswer={() => void handleAnswer(query)}
              onDismiss={() => void handleDismiss(query.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function QueryRow({
  query,
  draft,
  submitting,
  onDraftChange,
  onAnswer,
  onDismiss,
}: {
  query: api.Question;
  draft: string;
  submitting: boolean;
  onDraftChange: (v: string) => void;
  onAnswer: () => void;
  onDismiss: () => void;
}) {
  const isPending = query.status === 'pending';

  if (!isPending) {
    // Collapsed answered/dismissed view
    return (
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 px-4 py-3 opacity-60">
        {query.contact && (
          <p className="text-[9px] font-bold uppercase tracking-[.08em] text-muted-foreground">
            {query.contact.name}
          </p>
        )}
        <p className="text-xs font-medium text-[hsl(var(--foreground))]">{query.question}</p>
        {query.answer && (
          <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">↳ {query.answer}</p>
        )}
        <span className="mt-1 inline-block text-[9px] font-bold uppercase tracking-[.1em] text-[hsl(var(--muted-foreground))]">
          {query.status}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#d4c4ff] bg-[#f8f5ff] px-4 py-3">
      {query.contact && (
        <p className="text-[9px] font-bold uppercase tracking-[.08em] text-[#8a72c4]">
          {query.contact.name}
        </p>
      )}
      <p className="text-xs font-semibold text-[#3d2a72]">{query.question}</p>
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onAnswer(); }}
          placeholder="Your answer…"
          className="flex-1 rounded-lg border border-[#c4b0f0] bg-white px-3 py-1.5 text-xs outline-none focus:border-[#6b4fc8] focus:ring-2 focus:ring-[#6b4fc8]/10"
        />
        <button
          type="button"
          onClick={onAnswer}
          disabled={!draft.trim() || submitting}
          aria-label="Send answer"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#6b4fc8] text-white hover:bg-[#5a3fb8] disabled:opacity-40"
        >
          {submitting ? <LoaderCircle size={12} className="animate-spin" /> : <Send size={12} />}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss question"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TasksPanel — mined + manual tasks for the active conversation
// ---------------------------------------------------------------------------

const STATUS_META: Record<string, { label: string; dot: string; text: string }> = {
  suggested: { label: 'Suggested',   dot: 'bg-[#f5a623]',  text: 'text-[#995500]' },
  open:       { label: 'Open',       dot: 'bg-[#3b9a83]',  text: 'text-[#216457]' },
  in_progress:{ label: 'In progress',dot: 'bg-[#4168e5]',  text: 'text-[#1f40ad]' },
  done:       { label: 'Done',       dot: 'bg-[#8fba9a]',  text: 'text-[#3d6e4a]' },
  cancelled:  { label: 'Cancelled',  dot: 'bg-[#c9b0a0]',  text: 'text-[#7a5c50]' },
};

const PRIORITY_BADGE: Record<string, string> = {
  high:   'bg-[#ffe5dd] text-[#bd5d47]',
  normal: 'bg-[#edf1ec] text-[#4a7060]',
  low:    'bg-[#f3f0ea] text-[#7a7060]',
};

const ACTIVE_STATUSES: api.TaskStatus[] = ['suggested', 'open', 'in_progress'];

function TasksPanel({
  conversationId,
  contactId,
}: {
  conversationId: string | undefined;
  contactId: string | undefined;
}) {
  const [tasks, setTasks] = useState<api.Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  const loadTasks = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const data = await api.fetchConversationTasks(conversationId);
      setTasks(data);
    } catch {
      // silently ignore — panel is non-critical
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Reload whenever the conversation changes
  useEffect(() => { void loadTasks(); }, [loadTasks]);

  const handleExtract = async () => {
    if (!conversationId || extracting) return;
    setExtracting(true);
    try {
      await api.extractTasks(conversationId);
      await loadTasks();
    } finally {
      setExtracting(false);
    }
  };

  const handleStatusChange = async (taskId: string, status: api.TaskStatus) => {
    try {
      const updated = await api.updateTask(taskId, { status });
      setTasks((prev) => prev.map((t) => t.id === taskId ? updated : t));
    } catch { /* no-op */ }
  };

  const handleAddTask = async () => {
    const title = newTitle.trim();
    if (!title || !conversationId || !contactId) {
      console.warn('[TasksPanel] Missing required data:', { title, conversationId, contactId });
      return;
    }
    try {
      const task = await api.createTask({ title, conversationId, contactId });
      setTasks((prev) => [...prev, task]);
      setNewTitle('');
      setShowAddForm(false);
      console.log('[TasksPanel] Task created successfully:', task.title);
    } catch (err) {
      console.error('[TasksPanel] Failed to create task:', err);
    }
  };

  const visible = filter === 'active'
    ? tasks.filter((t) => ACTIVE_STATUSES.includes(t.status as api.TaskStatus))
    : tasks;

  const suggestedCount = tasks.filter((t) => t.status === 'suggested').length;

  return (
    <section className="rounded-[22px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#edf1ec] text-[#3f8274]">
            <ListTodo size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Tasks</h3>
            {suggestedCount > 0 && (
              <p className="text-[10px] text-[#995500]">{suggestedCount} suggested</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Refresh tasks"
            onClick={() => void loadTasks()}
            className="grid h-7 w-7 place-items-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            aria-label="Check conversation for new tasks"
            onClick={() => void handleExtract()}
            disabled={extracting || !conversationId}
            className="flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] px-2 py-1 text-[10px] font-bold text-[#3159c4] hover:bg-[#edf1ff] disabled:opacity-40"
          >
            {extracting ? <LoaderCircle size={11} className="animate-spin" /> : <Sparkles size={11} />}
            {extracting ? 'Scanning…' : 'Scan'}
          </button>
          <button
            type="button"
            aria-label="Add task manually"
            onClick={() => setShowAddForm((v) => !v)}
            className="grid h-7 w-7 place-items-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mt-3 flex gap-1">
        {(['active', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[.08em] transition-colors ${
              filter === f ? 'bg-[#2854cc] text-white' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
            }`}
          >
            {f === 'active' ? 'Active' : 'All'}
          </button>
        ))}
      </div>

      {/* Inline add form */}
      {showAddForm && (
        <div className="mt-3 flex gap-2">
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleAddTask(); if (e.key === 'Escape') setShowAddForm(false); }}
            placeholder="New task…"
            className="flex-1 rounded-xl border border-[hsl(var(--border))] bg-[#fbfaf6] px-3 py-2 text-xs outline-none focus:border-[#4168e5] focus:ring-2 focus:ring-[#4168e5]/10"
          />
          <button
            type="button"
            onClick={() => void handleAddTask()}
            disabled={!newTitle.trim()}
            className="rounded-xl bg-[#2854cc] px-3 py-2 text-xs font-bold text-white hover:bg-[#2148b4] disabled:opacity-40"
          >
            Add
          </button>
        </div>
      )}

      {/* Task list */}
      <div className="mt-3 space-y-2">
        {!conversationId ? (
          <p className="py-3 text-center text-xs text-[hsl(var(--muted-foreground))]">Select a conversation to see tasks.</p>
        ) : loading && tasks.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <LoaderCircle size={14} className="animate-spin text-[hsl(var(--muted-foreground))]" />
          </div>
        ) : visible.length === 0 ? (
          <p className="py-3 text-center text-xs text-[hsl(var(--muted-foreground))]">
            {filter === 'active' ? 'No active tasks — hit Scan to mine the conversation.' : 'No tasks yet.'}
          </p>
        ) : (
          visible.map((task) => (
            <TaskRow key={task.id} task={task} onStatusChange={handleStatusChange} />
          ))
        )}
      </div>
    </section>
  );
}

function TaskRow({
  task,
  onStatusChange,
}: {
  task: api.Task;
  onStatusChange: (id: string, status: api.TaskStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[task.status] ?? STATUS_META.open;
  const isDone = task.status === 'done' || task.status === 'cancelled';

  // Next logical status to advance to on checkbox click
  const advanceStatus = (): api.TaskStatus => {
    if (task.status === 'suggested') return 'open';
    if (task.status === 'open') return 'in_progress';
    if (task.status === 'in_progress') return 'done';
    return task.status as api.TaskStatus;
  };

  return (
    <div
      className={`rounded-xl border bg-[#fafaf7] p-3 transition-all ${
        task.status === 'suggested' ? 'border-[#f5d78e] bg-[#fffbf0]' : 'border-[hsl(var(--border))]'
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Checkbox / advance button */}
        <button
          type="button"
          aria-label={isDone ? 'Task complete' : 'Advance task status'}
          onClick={() => !isDone && onStatusChange(task.id, advanceStatus())}
          className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded ${
            isDone
              ? 'bg-[#8fba9a] text-white cursor-default'
              : task.status === 'suggested'
              ? 'border border-[#f5a623] bg-[#fff8e8]'
              : 'border border-[#3b9a83] bg-white hover:bg-[#edf9f5]'
          }`}
        >
          {(task.status === 'in_progress' || isDone) && <Check size={10} strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-xs font-semibold leading-4 ${isDone ? 'line-through text-[hsl(var(--muted-foreground))]' : ''}`}>
              {task.title}
            </span>
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[.07em] ${PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.normal}`}>
              {task.priority}
            </span>
          </div>

          {/* Status + due date */}
          <div className="mt-1 flex items-center gap-2">
            <span className={`flex items-center gap-1 text-[10px] font-bold ${meta.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
            {task.dueDate && (
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {task.source === 'agent' && task.confidence < 1 && (
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                {Math.round(task.confidence * 100)}% conf.
              </span>
            )}
          </div>

          {/* Expand toggle for description */}
          {task.description && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="mt-1 text-[10px] font-bold text-[#3159c4] hover:underline"
            >
              {open ? 'Hide detail' : 'Show detail'}
            </button>
          )}
          {open && task.description && (
            <p className="mt-1 text-[11px] leading-4 text-[hsl(var(--muted-foreground))]">{task.description}</p>
          )}
        </div>

        {/* Suggested task quick-actions: confirm or dismiss */}
        {task.status === 'suggested' && (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              aria-label="Confirm task"
              onClick={() => onStatusChange(task.id, 'open')}
              className="grid h-6 w-6 place-items-center rounded-lg bg-[#dcefe9] text-[#216457] hover:bg-[#c4e3da]"
            >
              <Check size={11} strokeWidth={3} />
            </button>
            <button
              type="button"
              aria-label="Dismiss task"
              onClick={() => onStatusChange(task.id, 'cancelled')}
              className="grid h-6 w-6 place-items-center rounded-lg bg-[#f3ebe8] text-[#a05a4a] hover:bg-[#e8d5cf]"
            >
              <X size={11} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared widgets
// ---------------------------------------------------------------------------

function RecentTasksWidget({ history }: { history: api.History[] }) {
  return (
    <section className="rounded-[22px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Your paper trail</p>
          <h3 className="mt-2 text-lg font-bold tracking-tight">Recent threads</h3>
        </div>
        <Link href="/history" className="text-xs font-bold text-[#3159c4] hover:underline" data-testid="button-view-history">
          View all <ArrowUpRight className="ml-1 inline" size={13} />
        </Link>
      </div>
      <div className="mt-4 divide-y divide-[hsl(var(--border))]">
        {history.slice(0, 3).length === 0 ? (
          <p className="py-4 text-xs text-[hsl(var(--muted-foreground))]">No tasks yet — they'll show up here after your first conversation.</p>
        ) : history.slice(0, 3).map((item) => (
          <Link
            href="/history"
            key={item.id}
            data-testid={`button-history-${item.id}`}
            className="flex w-full items-center gap-3 py-3 text-left transition-colors first:pt-0 last:pb-0 hover:bg-[#faf8f2]"
          >
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${item.status === 'Needs you' ? 'bg-[#ffe5dd] text-[#bd5d47]' : 'bg-[#e1efe9] text-[#4a8978]'}`}>
              {item.status === 'Needs you' ? <CircleHelp size={15} /> : <Check size={15} />}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-xs">{item.title}</strong>
              <small className="block truncate text-[10px] text-[hsl(var(--muted-foreground))]">{item.detail}</small>
            </span>
            <span className="shrink-0 text-[10px] text-[hsl(var(--muted-foreground))]">{item.time}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Preferences modal
// ---------------------------------------------------------------------------

function Preferences({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Your preferences</h2>
          <button type="button" data-testid="button-close-preferences" onClick={onClose} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
            <X size={20} />
          </button>
        </div>
        <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
          I'll help you think things through and keep the next step clear. I'm your personal admin assistant, ready to help with everyday tasks.
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] p-3"><span className="text-sm">Concise responses</span><span className="h-5 w-5 rounded-full bg-[#2854cc]" /></div>
          <div className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] p-3"><span className="text-sm">Ask clarifying questions</span><span className="h-5 w-5 rounded-full bg-[#2854cc]" /></div>
          <div className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] p-3"><span className="text-sm">Confirm before taking action</span><span className="h-5 w-5 rounded-full bg-[#e8e8e8]" /></div>
        </div>
        <button
          type="button"
          data-testid="button-save-preferences"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-[#2854cc] py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#2148b4]"
        >
          Save preferences
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root App — router + routes
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <WouterRouter>
            <Switch>
              <Route path="/"><Redirect to="/messages" /></Route>
              <Route path="/messages" component={InboxPage} />
              <Route path="/history" component={HistoryPage} />
              <Route path="/contacts" component={ContactsPage} />
              <Route path="/messages/:contactId" component={InboxPage} />
              <Route component={NotFound} />
            </Switch>
          </WouterRouter>
          <Toaster />
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
