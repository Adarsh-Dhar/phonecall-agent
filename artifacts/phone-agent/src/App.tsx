import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowUpRight, Check, CircleHelp, Clock3, FileText, History,
  LoaderCircle, MessageCircle, MoreHorizontal, Paperclip, Plus,
  Send, ShieldCheck, Sparkles, Star, Users, X, Zap,
} from 'lucide-react';
import { type ReactNode as ReactNodeType } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import * as api from '@/lib/api';

const queryClient = new QueryClient();

type View = 'inbox' | 'history' | 'contacts';
type Message = { id: string; role: 'user' | 'assistant'; content: string; time: string; pending?: boolean };
type Contact = { id: string; name: string; business: string; initials: string; color: string; note: string; online: boolean };

const quickPrompts = [
  'Book me a dental cleaning next week, late mornings are best.',
  'Help me follow up on my delayed package PLX-48290.',
  'Find a haircut for Saturday afternoon.',
];

function IconButton({ label, children, onClick, className = '' }: { label: string; children: ReactNode; onClick: () => void; className?: string }) {
  return <button type="button" aria-label={label} data-testid={`button-${label.toLowerCase().replaceAll(' ', '-')}`} onClick={onClick} className={`grid place-items-center transition-transform duration-200 hover:-translate-y-0.5 ${className}`}>{children}</button>;
}

function Avatar({ contact, size = 'md' }: { contact: Contact; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = size === 'sm' ? 'h-7 w-7 text-[10px]' : size === 'lg' ? 'h-12 w-12 text-sm' : 'h-10 w-10 text-xs';
  return <div data-testid={`avatar-${contact.id}`} className={`grid shrink-0 place-items-center rounded-full font-bold text-[hsl(var(--foreground))] ${sizes}`} style={{ background: contact.color }}>{contact.initials}</div>;
}

function StatusPill({ busy }: { busy: boolean }) {
  return <span data-testid="status-agent" className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.12em] ${busy ? 'bg-[#fff0df] text-[#af5c1c]' : 'bg-[#dcefe9] text-[#216457]'}`}><span className={`h-1.5 w-1.5 rounded-full ${busy ? 'bg-[#e58a34] animate-breathe' : 'bg-[#3b9a83]'}`} />{busy ? 'Thinking' : 'Online'}</span>;
}

function AppShell() {
  const [view, setView] = useState<View>('inbox');
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [activeContact, setActiveContact] = useState('');
  const [history, setHistory] = useState<api.History[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // Update current date
  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
      setCurrentDate(new Intl.DateTimeFormat('en-US', options).format(now));
    };
    updateDate();
    const interval = setInterval(updateDate, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [contactsData, historyData] = await Promise.all([
          api.fetchContacts(),
          api.fetchHistory(),
        ]);
        setContacts(contactsData);
        setHistory(historyData);
        if (contactsData.length > 0) {
          setActiveContact(contactsData[0].id);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        // Fallback to seed data if API fails
        setContacts([
          { id: 'agent', name: 'Phone Agent', business: 'Your personal assistant', initials: 'PA', color: '#ff9b83', note: 'Ready to help with everyday admin', online: true },
        ]);
        setActiveContact('agent');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  const sendMessage = async (text = draft) => {
    const content = text.trim();
    if (!content || busy) return;
    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content, time: 'Now' };
    setMessages((current) => [...current, userMessage]);
    setDraft('');
    setBusy(true);
    try {
      const payload = await api.sendGeminiMessage([...messages, userMessage].map(({ role, content: value }) => ({ role, content: value })));
      const assistantMessage: Message = { id: `assistant-${Date.now()}`, role: 'assistant', content: payload.message || 'I\'m here. What should we work on?', time: 'Now' };
      setMessages((current) => [...current, assistantMessage]);
      
      // Create history item (get conversation ID from history if available)
      try {
        const conversationId = history.length > 0 ? history[0].conversationId : null;
        if (conversationId) {
          const newHistory = await api.createHistory(conversationId, {
            title: content.slice(0, 32),
            detail: 'Chat · Gemini response',
            status: 'Completed',
            time: 'Just now',
          });
          setHistory((current) => [newHistory, ...current]);
        } else {
          // Create a new conversation with history
          const newHistory = await api.createHistoryWithConversation({
            title: content.slice(0, 32),
            detail: 'Chat · Gemini response',
            status: 'Completed',
            time: 'Just now',
          });
          setHistory((current) => [newHistory, ...current]);
        }
      } catch (historyError) {
        console.error('Failed to create history item:', historyError);
        // Fallback to local state update
        setHistory((current) => [{ id: `h-${Date.now()}`, title: content.slice(0, 32), detail: 'Chat · Gemini response', status: 'Completed', time: 'Just now' } as api.History, ...current]);
      }
    } catch (error) {
      setMessages((current) => [...current, { id: `error-${Date.now()}`, role: 'assistant', content: error instanceof Error ? error.message : 'Something went wrong. Please try again.', time: 'Now' }]);
    } finally {
      setBusy(false);
    }
  };

  const contact = contacts.find((item) => item.id === activeContact) ?? contacts[0];

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return <div className="grain min-h-[100dvh] bg-[hsl(var(--background))]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[224px] flex-col bg-[hsl(var(--sidebar))] px-5 py-6 text-[hsl(var(--sidebar-foreground))] md:flex">
      <button type="button" data-testid="button-brand-home" onClick={() => setView('inbox')} className="flex items-center gap-3 text-left">
        <span className="grid h-9 w-9 place-items-center rounded-[13px] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"><MessageCircle size={17} strokeWidth={2.5} /></span>
        <span><strong className="block text-[15px] tracking-tight">phone agent</strong><small className="font-mono text-[9px] uppercase tracking-[.18em] text-[#a8b9b2]">personal inbox</small></span>
      </button>
      <div className="mt-14">
        <p className="mb-3 px-3 font-mono text-[9px] uppercase tracking-[.18em] text-[#879a94]">Workspace</p>
        <nav className="space-y-1">
          {([['inbox', 'Messages', <MessageCircle size={16} />], ['history', 'Task history', <History size={16} />], ['contacts', 'Contacts', <Users size={16} />]] as const).map(([key, label, icon]) =>
            <button type="button" data-testid={`nav-${key}`} key={key} onClick={() => setView(key)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${view === key ? 'bg-[#2d3b3c] text-[#fff8ec]' : 'text-[#aab9b3] hover:bg-[#273435] hover:text-[#fff8ec]'}`}>{icon}<span>{label}</span>{key === 'inbox' && busy ? <span className="ml-auto h-2 w-2 rounded-full bg-[hsl(var(--accent))]" /> : null}</button>,
          )}
        </nav>
      </div>
      <div className="mt-auto rounded-2xl border border-[#3a4a48] bg-[#243232] p-4">
        <div className="mb-3 flex items-center justify-between"><ShieldCheck size={17} className="text-[#ff9a7f]" /><span className="font-mono text-[9px] uppercase tracking-[.13em] text-[#9fb0aa]">Your preferences</span></div>
        <p className="text-xs leading-5 text-[#dce5df]">I'll help you think things through and keep the next step clear.</p>
        <button type="button" data-testid="button-open-preferences" onClick={() => setPrefsOpen(true)} className="mt-3 text-xs font-bold text-[#ffad95] hover:text-[#ffd0c2]">Review preferences <ArrowUpRight className="ml-1 inline" size={13} /></button>
      </div>
      <div className="mt-5 flex items-center gap-2 px-2 text-xs text-[#91a19c]"><span className="h-2 w-2 rounded-full bg-[#5bc4a3]" /> Gemini is ready</div>
    </aside>

    <main className="min-h-[100dvh] md:ml-[224px]">
      <header className="flex h-[76px] items-center justify-between border-b border-[hsl(var(--border))] px-5 md:px-10">
        <div className="flex items-center gap-3 md:hidden"><span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[hsl(var(--accent))]"><MessageCircle size={15} /></span><strong className="text-sm">phone agent</strong></div>
        <div className="hidden items-center gap-2 md:flex"><span className="font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">{currentDate}</span><span className="text-[hsl(var(--border))]">/</span><span className="text-xs text-[hsl(var(--muted-foreground))]">{view === 'inbox' ? 'Messages' : view === 'history' ? 'Task history' : 'Contacts'}</span></div>
        <div className="ml-auto flex items-center gap-2"><IconButton label="help" onClick={() => setPrefsOpen(true)} className="h-9 w-9 rounded-full text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"><CircleHelp size={18} /></IconButton><div className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-[#c8d9e8] text-[10px] font-bold">AP</div></div>
      </header>

      {view === 'inbox' ? <div className="mx-auto max-w-[1280px] px-5 py-8 md:px-10 md:py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div className="animate-rise"><p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#e26951]">Good morning, Alex</p><h1 className="max-w-[600px] font-serif text-[clamp(2.5rem,5vw,4.7rem)] leading-[.94] tracking-[-.055em] text-[#203039]">A little help,<br className="hidden md:block" /> right here.</h1></div><div className="animate-rise animate-rise-1 flex items-center gap-2 rounded-2xl border border-[hsl(var(--border))] bg-[#f2eee5] px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]"><Zap size={15} className="text-[#e26951]" /><span>3 quiet hours saved this week</span></div></div>
        <section className="animate-rise animate-rise-1 grid gap-5 xl:grid-cols-[minmax(0,1.34fr)_minmax(300px,.66fr)]">
          <div className="flex min-h-[620px] flex-col overflow-hidden rounded-[24px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] shadow-[0_16px_45px_rgba(39,53,58,.06)]">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4 md:px-7"><div className="flex items-center gap-3"><Avatar contact={contacts[0] || { id: 'agent', name: 'Phone Agent', business: 'Your personal assistant', initials: 'PA', color: '#ff9b83', note: 'Ready to help with everyday admin', online: true }} /><div><h2 className="text-sm font-bold">Phone Agent</h2><p className="text-[11px] text-[hsl(var(--muted-foreground))]">Personal admin assistant</p></div></div><StatusPill busy={busy} /></div>
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6 md:px-7">{messages.map((message) => <div key={message.id} data-testid={`message-${message.role}`} className={`flex gap-3 animate-rise ${message.role === 'user' ? 'justify-end' : ''}`}><div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'rounded-br-md bg-[#2854cc] text-white' : 'rounded-bl-md bg-[#edf1ec] text-[#34443f]'}`}><p>{message.content}</p><span className={`mt-2 block text-[10px] ${message.role === 'user' ? 'text-[#c9d5ff]' : 'text-[#82918a]'}`}>{message.time}</span></div></div>)}{busy ? <div className="flex gap-3"><div className="rounded-2xl rounded-bl-md bg-[#edf1ec] px-4 py-3"><span className="inline-flex items-center gap-2 text-xs text-[#697a73]"><LoaderCircle size={13} className="animate-spin" /> Thinking through it</span></div></div> : null}<div ref={endRef} /></div>
            <div className="border-t border-[hsl(var(--border))] px-5 py-4 md:px-7"><div className="mb-3 flex flex-wrap gap-2">{quickPrompts.map((prompt) => <button type="button" data-testid="button-quick-prompt" key={prompt} onClick={() => { setDraft(prompt); }} className="rounded-full border border-[hsl(var(--border))] bg-[#f6f3ed] px-3 py-2 text-xs font-medium text-[#58645f] transition-all hover:-translate-y-0.5 hover:border-[#a2b4e8] hover:bg-[#edf1ff] hover:text-[#244dbd]">{prompt.length > 38 ? `${prompt.slice(0, 38)}…` : prompt}</button>)}</div><div className="flex items-end gap-2 rounded-2xl border border-[hsl(var(--border))] bg-[#fbfaf6] p-2 focus-within:border-[#4168e5] focus-within:ring-4 focus-within:ring-[#4168e5]/10"><button type="button" aria-label="attach file" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[#82918a] hover:bg-[#edf1ec]"><Paperclip size={17} /></button><textarea data-testid="input-message" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder="What would you like help with?" className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 outline-none placeholder:text-[#99a19d]" /><button type="button" data-testid="button-send-message" onClick={() => void sendMessage()} disabled={busy || !draft.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#2854cc] text-white transition-all hover:-translate-y-0.5 hover:bg-[#2148b4] disabled:cursor-not-allowed disabled:opacity-40"><Send size={16} /></button></div><p className="mt-2 text-center text-[10px] text-[hsl(var(--muted-foreground))]">Powered by Gemini · Press Enter to send</p></div>
          </div>
          <div className="space-y-5"><div className="rounded-[24px] border border-[hsl(var(--card-border))] bg-[#eef4f0] p-5 md:p-7"><div className="flex items-start justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#588176]">How it works</p><h3 className="mt-2 font-serif text-3xl tracking-tight text-[#233b3b]">Quiet by default.</h3><p className="mt-2 text-xs leading-5 text-[#55716a]">Start with a message. Get a useful next step, not a wall of text.</p></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d2e8df] text-[#3f8274]"><Sparkles size={18} /></div></div><div className="mt-7 space-y-4 text-xs text-[#55716a]">{[['01', 'Tell me what you need'], ['02', 'I help you make a plan'], ['03', 'You stay in control']].map(([number, label]) => <div className="flex items-center gap-3" key={number}><strong className="font-mono text-lg text-[#3f8274]">{number}</strong><span>{label}</span></div>)}</div></div><RecentTasks history={history} onOpen={() => setView('history')} /><div className="rounded-[22px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Active conversation</p><div className="mt-4 flex items-center gap-3"><Avatar contact={contact} size="sm" /><div className="min-w-0 flex-1"><strong className="block truncate text-xs">{contact.name}</strong><small className="text-[10px] text-[hsl(var(--muted-foreground))]">{contact.business}</small></div><button type="button" data-testid="button-change-contact" onClick={() => setActiveContact(activeContact === 'agent' ? 'bright-smile' : 'agent')} className="text-[10px] font-bold text-[#3159c4]">Change</button></div></div></div>
        </section>
      </div> : view === 'history' ? <HistoryView history={history} onBack={() => setView('inbox')} /> : <ContactsView contacts={contacts} onSelect={(id) => { setActiveContact(id); setView('inbox'); }} />}
    </main>
    {prefsOpen ? <Preferences onClose={() => setPrefsOpen(false)} /> : null}
    <div className="fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[#3c4c4d] bg-[#243434] p-1 shadow-xl md:hidden"><button type="button" data-testid="mobile-nav-inbox" onClick={() => setView('inbox')} className={`rounded-full px-4 py-2 text-xs font-bold ${view === 'inbox' ? 'bg-[#ff9478] text-[#3b211b]' : 'text-[#d1dcd5]'}`}>Messages</button><button type="button" data-testid="mobile-nav-history" onClick={() => setView('history')} className={`rounded-full px-4 py-2 text-xs font-bold ${view === 'history' ? 'bg-[#ff9478] text-[#3b211b]' : 'text-[#d1dcd5]'}`}>History</button><button type="button" data-testid="mobile-nav-contacts" onClick={() => setView('contacts')} className={`rounded-full px-4 py-2 text-xs font-bold ${view === 'contacts' ? 'bg-[#ff9478] text-[#3b211b]' : 'text-[#d1dcd5]'}`}>Contacts</button></div>
  </div>;
}

function RecentTasks({ history, onOpen }: { history: api.History[]; onOpen: () => void }) {
  return <section className="rounded-[22px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5"><div className="flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Your paper trail</p><h3 className="mt-2 text-lg font-bold tracking-tight">Recent threads</h3></div><button type="button" data-testid="button-view-history" onClick={onOpen} className="text-xs font-bold text-[#3159c4] hover:underline">View all <ArrowUpRight className="ml-1 inline" size={13} /></button></div><div className="mt-4 divide-y divide-[hsl(var(--border))]">{history.slice(0, 3).map((item) => <button type="button" data-testid={`button-history-${item.id}`} onClick={onOpen} key={item.id} className="flex w-full items-center gap-3 py-3 text-left transition-colors first:pt-0 last:pb-0 hover:bg-[#faf8f2]"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${item.status === 'Needs you' ? 'bg-[#ffe5dd] text-[#bd5d47]' : 'bg-[#e1efe9] text-[#4a8978]'}`}>{item.status === 'Needs you' ? <CircleHelp size={15} /> : <Check size={15} />}</span><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{item.title}</strong><small className="block truncate text-[10px] text-[hsl(var(--muted-foreground))]">{item.detail}</small></span><span className="shrink-0 text-[10px] text-[hsl(var(--muted-foreground))]">{item.time}</span></button>)}</div></section>;
}

function HistoryView({ history, onBack }: { history: api.History[]; onBack: () => void }) {
  return <div className="mx-auto max-w-[980px] px-5 py-8 md:px-10 md:py-12"><button type="button" data-testid="button-history-back" onClick={onBack} className="mb-8 text-xs font-bold text-[#3159c4] hover:underline">← Back to messages</button><div className="mb-8"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#e26951]">The paper trail</p><h1 className="mt-2 font-serif text-5xl tracking-[-.04em]">Task history</h1></div><div className="space-y-3">{history.map((item) => <div data-testid={`card-history-${item.id}`} key={item.id} className="flex flex-col gap-4 rounded-2xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 transition-transform hover:-translate-y-0.5 sm:flex-row sm:items-center"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.status === 'Needs you' ? 'bg-[#ffe5dd] text-[#bd5d47]' : 'bg-[#e1efe9] text-[#4a8978]'}`}>{item.status === 'Needs you' ? <CircleHelp size={17} /> : <Check size={17} />}</span><div className="min-w-0 flex-1"><h3 className="font-bold">{item.title}</h3><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{item.detail}</p></div><div className="flex items-center gap-4"><span className={`text-[10px] font-bold uppercase tracking-[.1em] ${item.status === 'Needs you' ? 'text-[#bd5d47]' : 'text-[#4b8a78]'}`}>{item.status}</span><span className="text-xs text-[hsl(var(--muted-foreground))]">{item.time}</span><MoreHorizontal size={16} className="text-[hsl(var(--muted-foreground))]" /></div></div>)}</div></div>;
}

function ContactsView({ contacts, onSelect }: { contacts: Contact[]; onSelect: (id: string) => void }) {
  return <div className="mx-auto max-w-[980px] px-5 py-8 md:px-10 md:py-12"><button type="button" data-testid="button-contacts-back" onClick={() => onSelect('agent')} className="mb-8 text-xs font-bold text-[#3159c4] hover:underline">← Back to messages</button><div className="mb-8"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#e26951]">Your network</p><h1 className="mt-2 font-serif text-5xl tracking-[-.04em]">Contacts</h1></div><div className="space-y-3">{contacts.map((contact) => <button type="button" data-testid={`button-contact-${contact.id}`} key={contact.id} onClick={() => onSelect(contact.id)} className="flex w-full items-center gap-4 rounded-2xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 transition-transform hover:-translate-y-0.5"><Avatar contact={contact} /><div className="min-w-0 flex-1 text-left"><h3 className="font-bold">{contact.name}</h3><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{contact.business}</p></div><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${contact.online ? 'bg-[#5bc4a3]' : 'bg-[#879a94]'}`} /><span className="text-xs text-[hsl(var(--muted-foreground))]">{contact.online ? 'Online' : 'Offline'}</span></div></button>)}</div></div>;
}

function Preferences({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-6 shadow-xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Your preferences</h2><button type="button" data-testid="button-close-preferences" onClick={onClose} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"><X size={20} /></button></div><p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">I'll help you think things through and keep the next step clear. I'm your personal admin assistant, ready to help with everyday tasks.</p><div className="space-y-3"><div className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] p-3"><span className="text-sm">Concise responses</span><span className="h-5 w-5 rounded-full bg-[#2854cc]" /></div><div className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] p-3"><span className="text-sm">Ask clarifying questions</span><span className="h-5 w-5 rounded-full bg-[#2854cc]" /></div><div className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] p-3"><span className="text-sm">Confirm before taking action</span><span className="h-5 w-5 rounded-full bg-[#e8e8e8]" /></div></div><button type="button" data-testid="button-save-preferences" onClick={onClose} className="mt-6 w-full rounded-xl bg-[#2854cc] py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#2148b4]">Save preferences</button></div></div>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <WouterRouter>
            <Switch>
              <Route path="/" component={AppShell} />
              <Route component={NotFound} />
            </Switch>
          </WouterRouter>
          <Toaster />
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
