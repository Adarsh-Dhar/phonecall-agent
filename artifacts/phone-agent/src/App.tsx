import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight, CalendarDays, Check, CheckCircle2, ChevronDown, CircleHelp,
  Clock3, FileText, Headphones, History, LoaderCircle, Mic2,
  MoreHorizontal, Phone, Plus, ShieldCheck, SlidersHorizontal, Sparkles, Star, Users, X, Zap,
} from 'lucide-react';
import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type View = 'desk' | 'history' | 'contacts';
type Phase = 'idle' | 'ready' | 'connecting' | 'calling' | 'escalation' | 'complete';
type Contact = { id: string; name: string; business: string; phone: string; initials: string; color: string; note: string };
type TranscriptLine = { speaker: 'agent' | 'other' | 'system'; text: string };

const contacts: Contact[] = [
  { id: 'bright-smile', name: 'Bright Smile Dental', business: 'Dental clinic', phone: '(415) 555-0183', initials: 'BS', color: '#f7ad92', note: 'Ask for a late morning slot' },
  { id: 'luca', name: 'Luca at Northside', business: 'Barber studio', phone: '(415) 555-0116', initials: 'LN', color: '#a4c1dd', note: 'Prefer Alex or Mei' },
  { id: 'parcel', name: 'Mara · Parcel desk', business: 'Delivery support', phone: '(800) 555-0149', initials: 'MP', color: '#d4b7e9', note: 'Tracking: PLX-48290' },
];
const scenarios = [
  { label: 'Book a dental cleaning', text: 'Book me a dental cleaning at Bright Smile Dental sometime next week. Late mornings are best.', contact: 'bright-smile' },
  { label: 'Find a haircut', text: 'Can you find me a haircut with Luca at Northside this Saturday afternoon?', contact: 'luca' },
  { label: 'Follow up on a package', text: 'Follow up with the parcel desk about my package PLX-48290 and find out when it will arrive.', contact: 'parcel' },
];
const seedHistory = [
  { id: 'h1', title: 'Book dental cleaning', detail: 'Bright Smile Dental · Thu, Jun 20 at 11:30 AM', status: 'Completed', time: 'Yesterday' },
  { id: 'h2', title: 'Reschedule haircut', detail: 'Luca at Northside · Preference saved', status: 'Completed', time: 'Jun 12' },
  { id: 'h3', title: 'Package delivery update', detail: 'Parcel desk · Waiting on your choice', status: 'Needs you', time: 'Jun 08' },
];

function IconButton({ label, children, onClick, className = '' }: { label: string; children: ReactNode; onClick: () => void; className?: string }) {
  return <button type="button" aria-label={label} data-testid={`button-${label.toLowerCase().replaceAll(' ', '-')}`} onClick={onClick} className={`grid place-items-center transition-transform duration-200 hover:-translate-y-0.5 ${className}`}>{children}</button>;
}

function Avatar({ contact, size = 'md' }: { contact: Contact; size?: 'sm' | 'md' | 'lg' }) {
  return <div data-testid={`avatar-${contact.id}`} className={`grid shrink-0 place-items-center rounded-full font-bold text-[hsl(var(--foreground))] ${size === 'sm' ? 'h-7 w-7 text-[10px]' : size === 'lg' ? 'h-14 w-14 text-sm' : 'h-10 w-10 text-xs'}`} style={{ background: contact.color }}>{contact.initials}</div>;
}

function StatusPill({ phase, label }: { phase: Phase; label?: string }) {
  const copy = label ?? ({ idle: 'Ready when you are', ready: 'Task ready', connecting: 'Waking the agent', calling: 'On the phone', escalation: 'Needs your call', complete: 'Wrapped up' }[phase]);
  const tone = ({ idle: 'muted', ready: 'blue', connecting: 'orange', calling: 'orange', escalation: 'red', complete: 'green' }[phase]);
  return <span data-testid="status-task" className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.12em] ${tone === 'blue' ? 'bg-[#e0e8ff] text-[#244dbd]' : tone === 'orange' ? 'bg-[#fff0df] text-[#af5c1c]' : tone === 'red' ? 'bg-[#ffe1dc] text-[#b64835]' : tone === 'green' ? 'bg-[#dcefe9] text-[#216457]' : 'bg-[#e9e8e3] text-[#68716d]'}`}><span className={`h-1.5 w-1.5 rounded-full ${tone === 'blue' ? 'bg-[#4168e5]' : tone === 'orange' ? 'bg-[#e58a34] animate-breathe' : tone === 'red' ? 'bg-[#db5e4d]' : tone === 'green' ? 'bg-[#3b9a83]' : 'bg-[#8d9690]'}`} />{copy}</span>;
}

function AppShell() {
  const [view, setView] = useState<View>('desk');
  const [instruction, setInstruction] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('bright-smile');
  const [showContacts, setShowContacts] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [escalation, setEscalation] = useState('');
  const [history, setHistory] = useState(seedHistory);
  const [savedCalendar, setSavedCalendar] = useState(false);
  const [savedNotes, setSavedNotes] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const timerRefs = useRef<number[]>([]);
  const contact = contacts.find((item) => item.id === selectedContactId) ?? contacts[0];

  useEffect(() => () => timerRefs.current.forEach(window.clearTimeout), []);
  const setScenario = (scenario: typeof scenarios[number]) => {
    setInstruction(scenario.text);
    setSelectedContactId(scenario.contact);
    setPhase('ready');
    setTranscript([]);
    setEscalation('');
    setSavedCalendar(false);
    setSavedNotes(false);
  };
  const resetTask = () => {
    timerRefs.current.forEach(window.clearTimeout);
    timerRefs.current = [];
    setPhase('idle'); setTranscript([]); setEscalation(''); setInstruction('');
  };
  const startCall = () => {
    if (!instruction.trim()) return;
    timerRefs.current.forEach(window.clearTimeout);
    setPhase('connecting');
    setTranscript([{ speaker: 'system', text: `Calling ${contact.name}…` }]);
    const steps: Array<[number, Phase, TranscriptLine | null]> = [
      [1200, 'calling', { speaker: 'agent', text: `Hi, I'm calling on behalf of Alex. I'm hoping to ${instruction.toLowerCase().replace(/^can you |^book me |^follow up with /, '')}` }],
      [2450, 'calling', { speaker: 'other', text: `Thanks for calling. Let me check what we have available.` }],
      [3850, 'escalation', { speaker: 'system', text: 'A choice came up that only you can make.' }],
    ];
    steps.forEach(([delay, nextPhase, line]) => timerRefs.current.push(window.setTimeout(() => {
      setPhase(nextPhase);
      if (line) setTranscript((current) => [...current, line]);
    }, delay)));
  };
  const resolveEscalation = (answer: string) => {
    setEscalation(answer);
    setTranscript((current) => [...current, { speaker: 'agent', text: answer === 'yes' ? 'That works, please book it.' : 'I will pass on that option, thank you.' }]);
    timerRefs.current.push(window.setTimeout(() => {
      setPhase('complete');
      setTranscript((current) => [...current, { speaker: 'other', text: answer === 'yes' ? 'Perfect. You are all set.' : 'Understood. I will note that down.' }]);
      setHistory((current) => [{ id: `h${Date.now()}`, title: instruction.slice(0, 31) || 'Phone task', detail: `${contact.name} · Just now`, status: 'Completed', time: 'Just now' }, ...current]);
    }, 1500));
  };

  return <div className="grain min-h-[100dvh] bg-[hsl(var(--background))]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[224px] flex-col bg-[hsl(var(--sidebar))] px-5 py-6 text-[hsl(var(--sidebar-foreground))] md:flex">
      <button type="button" data-testid="button-brand-home" onClick={() => { setView('desk'); resetTask(); }} className="flex items-center gap-3 text-left">
        <span className="grid h-9 w-9 place-items-center rounded-[13px] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"><Phone size={17} strokeWidth={2.5} /></span>
        <span><strong className="block text-[15px] tracking-tight">phone agent</strong><small className="font-mono text-[9px] uppercase tracking-[.18em] text-[#a8b9b2]">personal ops desk</small></span>
      </button>
      <div className="mt-14">
        <p className="mb-3 px-3 font-mono text-[9px] uppercase tracking-[.18em] text-[#879a94]">Workspace</p>
        <nav className="space-y-1">
          {([['desk', 'My desk', <Sparkles size={16} />], ['history', 'Task history', <History size={16} />], ['contacts', 'Contacts', <Users size={16} />]] as const).map(([key, label, icon]) =>
            <button type="button" data-testid={`nav-${key}`} key={key} onClick={() => setView(key)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${view === key ? 'bg-[#2d3b3c] text-[#fff8ec]' : 'text-[#aab9b3] hover:bg-[#273435] hover:text-[#fff8ec]'}`}>{icon}<span>{label}</span>{key === 'desk' && phase === 'escalation' ? <span className="ml-auto h-2 w-2 rounded-full bg-[hsl(var(--accent))]" /> : null}</button>
          )}
        </nav>
      </div>
      <div className="mt-auto rounded-2xl border border-[#3a4a48] bg-[#243232] p-4">
        <div className="mb-3 flex items-center justify-between"><ShieldCheck size={17} className="text-[#ff9a7f]" /><span className="font-mono text-[9px] uppercase tracking-[.13em] text-[#9fb0aa]">Your preferences</span></div>
        <p className="text-xs leading-5 text-[#dce5df]">I’ll make the call. You’ll only hear from me when a real choice is needed.</p>
        <button type="button" data-testid="button-open-preferences" onClick={() => setPrefsOpen(true)} className="mt-3 text-xs font-bold text-[#ffad95] hover:text-[#ffd0c2]">Review preferences <ArrowUpRight className="ml-1 inline" size={13} /></button>
      </div>
      <div className="mt-5 flex items-center gap-2 px-2 text-xs text-[#91a19c]"><span className="h-2 w-2 rounded-full bg-[#5bc4a3]" /> Agent is ready</div>
    </aside>

    <main className="min-h-[100dvh] md:ml-[224px]">
      <header className="flex h-[76px] items-center justify-between border-b border-[hsl(var(--border))] px-5 md:px-10">
        <div className="flex items-center gap-3 md:hidden"><span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[hsl(var(--accent))]"><Phone size={15} /></span><strong className="text-sm">phone agent</strong></div>
        <div className="hidden items-center gap-2 md:flex"><span className="font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Tuesday, June 18</span><span className="text-[hsl(var(--border))]">/</span><span className="text-xs text-[hsl(var(--muted-foreground))]">{view === 'desk' ? 'My desk' : view === 'history' ? 'Task history' : 'Contacts'}</span></div>
        <div className="ml-auto flex items-center gap-2"><IconButton label="help" onClick={() => setPrefsOpen(true)} className="h-9 w-9 rounded-full text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"><CircleHelp size={18} /></IconButton><div className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-[#c8d9e8] text-[10px] font-bold">AP</div></div>
      </header>

      {view === 'desk' ? <div className="mx-auto max-w-[1280px] px-5 py-8 md:px-10 md:py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="animate-rise"><p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#e26951]">Good morning, Alex</p><h1 className="max-w-[600px] font-serif text-[clamp(2.5rem,5vw,4.7rem)] leading-[.94] tracking-[-.055em] text-[#203039]">What can I take<br className="hidden md:block" /> off your plate?</h1></div>
          <div className="animate-rise animate-rise-1 flex items-center gap-2 rounded-2xl border border-[hsl(var(--border))] bg-[#f2eee5] px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]"><Zap size={15} className="text-[#e26951]" /><span>3 quiet hours saved this week</span></div>
        </div>

        <section className="animate-rise animate-rise-1 grid gap-5 xl:grid-cols-[minmax(0,1.34fr)_minmax(300px,.66fr)]">
          <div className={`relative overflow-hidden rounded-[24px] border bg-[hsl(var(--card))] p-5 shadow-[0_16px_45px_rgba(39,53,58,.06)] transition-colors md:p-7 ${phase === 'escalation' ? 'border-[#e26951]/50' : 'border-[hsl(var(--card-border))]'}`}>
            <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-[#dbe7ff] opacity-40 blur-3xl" />
            <div className="relative">
              <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-bold tracking-tight">New phone task</h2><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Tell me what you need. I’ll figure out the rest.</p></div><StatusPill phase={phase} /></div>
              <textarea data-testid="input-task-instruction" value={instruction} onChange={(event) => { setInstruction(event.target.value); if (phase !== 'idle' && phase !== 'ready') setPhase('ready'); }} placeholder="Try “Book my dental cleaning for next week…”" className="min-h-[122px] w-full resize-none rounded-2xl border border-[hsl(var(--border))] bg-[#fbfaf6] p-4 text-[15px] leading-6 outline-none transition-colors placeholder:text-[#99a19d] focus:border-[#4168e5] focus:ring-4 focus:ring-[#4168e5]/10" />
              <div className="mt-3 flex flex-wrap gap-2">{scenarios.map((scenario) => <button type="button" data-testid={`button-scenario-${scenario.contact}`} key={scenario.contact} onClick={() => setScenario(scenario)} className="rounded-full border border-[hsl(var(--border))] bg-[#f6f3ed] px-3 py-2 text-xs font-medium text-[#58645f] transition-all hover:-translate-y-0.5 hover:border-[#a2b4e8] hover:bg-[#edf1ff] hover:text-[#244dbd]">{scenario.label}</button>)}</div>
              {instruction ? <div className="mt-6 grid gap-4 border-t border-[hsl(var(--border))] pt-5 sm:grid-cols-[1fr_auto]">
                <div><p className="mb-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]"><Sparkles size={12} className="text-[#e26951]" /> I understood</p><div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-[#e5eaff] px-2.5 py-1.5 text-xs font-bold text-[#244dbd]">{instruction.toLowerCase().includes('package') ? 'Get delivery update' : instruction.toLowerCase().includes('haircut') ? 'Find an appointment' : 'Book an appointment'}</span><span className="text-xs text-[hsl(var(--muted-foreground))]">with</span><button type="button" data-testid="button-select-contact" onClick={() => setShowContacts(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#f4e9e1] px-2.5 py-1.5 text-xs font-bold text-[#984c38] hover:bg-[#f8ddd1]"><Avatar contact={contact} size="sm" />{contact.name}<ChevronDown size={13} /></button></div><p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]"><Clock3 className="mr-1 inline" size={13} /> {contact.note}</p></div>
                <button type="button" data-testid="button-start-call" onClick={startCall} disabled={phase === 'connecting' || phase === 'calling' || phase === 'escalation'} className="group self-end rounded-xl bg-[#2854cc] px-5 py-3 text-sm font-bold text-[#fffaf1] shadow-[0_8px_20px_rgba(40,84,204,.2)] transition-all hover:-translate-y-0.5 hover:bg-[#2148b4] disabled:cursor-not-allowed disabled:opacity-50">{phase === 'complete' ? 'Run again' : 'Start the call'}<Phone size={15} className="ml-2 inline transition-transform group-hover:rotate-12" /></button>
              </div> : <div className="mt-5 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><span className="h-1.5 w-1.5 rounded-full bg-[#9cb4ae]" /> Pick a starting point above, or write it your own way.</div>}
              {phase === 'escalation' ? <div className="mt-6 rounded-2xl border border-[#efb5a7] bg-[#fff1ec] p-4 animate-rise"><div className="flex gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e26951] text-[#fff9f0]"><Phone size={16} /></div><div className="flex-1"><p className="text-sm font-bold text-[#8e4435]">I need your call</p><p className="mt-1 text-xs leading-5 text-[#8f665e]">They offered Tuesday at 11:30 AM. Does that work for you?</p><div className="mt-3 flex gap-2"><button type="button" data-testid="button-escalation-approve" onClick={() => resolveEscalation('yes')} className="rounded-lg bg-[#e26951] px-3 py-2 text-xs font-bold text-white hover:bg-[#c95640]">Yes, book it</button><button type="button" data-testid="button-escalation-decline" onClick={() => resolveEscalation('no')} className="rounded-lg border border-[#e7b3a7] px-3 py-2 text-xs font-bold text-[#9c5141] hover:bg-[#ffe5dc]">No, skip it</button></div></div></div></div> : null}
            </div>
          </div>
          <LiveCallPanel phase={phase} transcript={transcript} contact={contact} onReset={resetTask} />
        </section>

        {phase === 'complete' ? <CompletionCard contact={contact} instruction={instruction} savedCalendar={savedCalendar} savedNotes={savedNotes} setSavedCalendar={setSavedCalendar} setSavedNotes={setSavedNotes} /> : null}
        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <RecentTasks history={history} onOpen={() => setView('history')} />
          <div className="rounded-[22px] border border-[hsl(var(--card-border))] bg-[#edf4f0] p-5 md:p-6"><div className="flex items-start justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#588176]">How it works</p><h3 className="mt-2 font-serif text-2xl tracking-tight text-[#233b3b]">Quiet by default.</h3></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d2e8df] text-[#3f8274]"><Headphones size={18} /></div></div><div className="mt-5 grid grid-cols-3 gap-3 text-xs text-[#55716a]"><div><strong className="mb-2 block font-mono text-lg text-[#3f8274]">01</strong>Tell me what you need</div><div><strong className="mb-2 block font-mono text-lg text-[#3f8274]">02</strong>I make the call</div><div><strong className="mb-2 block font-mono text-lg text-[#3f8274]">03</strong>You make the choice</div></div></div>
        </div>
      </div> : view === 'history' ? <HistoryView history={history} onBack={() => setView('desk')} /> : <ContactsView onSelect={(id) => { setSelectedContactId(id); setView('desk'); }} />}
    </main>
    {showContacts ? <ContactPicker selected={selectedContactId} onClose={() => setShowContacts(false)} onSelect={(id) => { setSelectedContactId(id); setShowContacts(false); setPhase('ready'); }} /> : null}
    {prefsOpen ? <Preferences onClose={() => setPrefsOpen(false)} /> : null}
    <div className="fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[#3c4c4d] bg-[#243434] p-1 shadow-xl md:hidden"><button type="button" data-testid="mobile-nav-desk" onClick={() => setView('desk')} className={`rounded-full px-4 py-2 text-xs font-bold ${view === 'desk' ? 'bg-[#ff9478] text-[#3b211b]' : 'text-[#d1dcd5]'}`}>Desk</button><button type="button" data-testid="mobile-nav-history" onClick={() => setView('history')} className={`rounded-full px-4 py-2 text-xs font-bold ${view === 'history' ? 'bg-[#ff9478] text-[#3b211b]' : 'text-[#d1dcd5]'}`}>History</button><button type="button" data-testid="mobile-nav-contacts" onClick={() => setView('contacts')} className={`rounded-full px-4 py-2 text-xs font-bold ${view === 'contacts' ? 'bg-[#ff9478] text-[#3b211b]' : 'text-[#d1dcd5]'}`}>Contacts</button></div>
  </div>;
}

function LiveCallPanel({ phase, transcript, contact, onReset }: { phase: Phase; transcript: TranscriptLine[]; contact: Contact; onReset: () => void }) {
  const isLive = phase === 'connecting' || phase === 'calling' || phase === 'escalation';
  return <div className={`rounded-[24px] border p-5 md:p-7 ${isLive ? 'border-[#b8c8ed] bg-[#eaf0ff]' : 'border-[hsl(var(--card-border))] bg-[#eef1ec]'}`}>
    <div className="flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Call room</p><h2 className="mt-2 text-lg font-bold tracking-tight">{isLive ? 'I’m on it' : phase === 'complete' ? 'Call complete' : 'Ready to call'}</h2></div>{isLive ? <IconButton label="stop call" onClick={onReset} className="h-8 w-8 rounded-full text-[#4e69b4] hover:bg-[#dbe4ff]"><X size={16} /></IconButton> : <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#d9e1db] text-[#628074]"><Mic2 size={17} /></div>}</div>
    <div className="my-5 flex items-center gap-3 rounded-2xl bg-[#f9faf7]/70 p-3"><Avatar contact={contact} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{contact.name}</p><p className="text-[11px] text-[hsl(var(--muted-foreground))]">{contact.phone}</p></div>{isLive ? <span className="font-mono text-[10px] text-[#4c68b9]">{phase === 'connecting' ? 'CONNECTING' : 'LIVE'}</span> : null}</div>
    {isLive ? <div className="mb-4 flex h-9 items-end gap-1 px-2">{[16,29,12,23,34,19,27,15,31,20,12,27,35,17,24,13,29,21,34,18].map((height, index) => <span key={index} className="w-1 rounded-full bg-[#5f7de2] opacity-70 transition-all" style={{ height: phase === 'connecting' ? 5 : height }} />)}</div> : null}
    <div className="space-y-3">{transcript.length ? transcript.map((line, index) => <div key={`${line.text}-${index}`} data-testid={`text-transcript-${index}`} className={`animate-rise flex gap-2 text-xs leading-5 ${line.speaker === 'system' ? 'text-[#63706c]' : line.speaker === 'agent' ? 'text-[#3655a7]' : 'text-[#52605b]'}`}><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" /><p>{line.text}</p></div>) : <p className="py-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Your call transcript will appear here while the agent is working.</p>}</div>
    {isLive ? <div className="mt-5 flex items-center gap-2 border-t border-[#cbd6f0] pt-4 text-[10px] text-[#5e70ad]"><LoaderCircle size={13} className="animate-spin" /> Listening for a response</div> : null}
  </div>;
}

function CompletionCard({ contact, instruction, savedCalendar, savedNotes, setSavedCalendar, setSavedNotes }: { contact: Contact; instruction: string; savedCalendar: boolean; savedNotes: boolean; setSavedCalendar: (v: boolean) => void; setSavedNotes: (v: boolean) => void }) {
  return <section className="mt-5 overflow-hidden rounded-[24px] border border-[#b7d8c8] bg-[#e8f4ee] p-5 md:p-7 animate-rise"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#4e9b83] text-[#f3fcf6]"><Check size={22} /></div><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#43806e]">Completed just now</p><h2 className="mt-1 font-serif text-2xl tracking-tight text-[#24483e]">That’s one less thing.</h2><p className="mt-1 max-w-lg text-xs leading-5 text-[#5f7e73]">{instruction.includes('package') ? 'The parcel desk confirmed your delivery details.' : `Your request with ${contact.name} is taken care of.`}</p></div></div><span className="rounded-full bg-[#d0e9dc] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#367461]">Done</span></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" data-testid="button-save-calendar" onClick={() => setSavedCalendar(!savedCalendar)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${savedCalendar ? 'border-[#8ec2ab] bg-[#d6eddf]' : 'border-[#c7ddd1] bg-[#f3faf5] hover:bg-[#ddf1e5]'}`}><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#c3e2d2] text-[#397d69]"><CalendarDays size={15} /></span><span><strong className="block text-xs text-[#315c4e]">{savedCalendar ? 'Added to calendar' : 'Add to calendar'}</strong><small className="text-[10px] text-[#6d8c80]">Thu, Jun 20 · 11:30 AM</small></span>{savedCalendar ? <CheckCircle2 className="ml-auto text-[#4e9b83]" size={17} /> : null}</button><button type="button" data-testid="button-save-notes" onClick={() => setSavedNotes(!savedNotes)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${savedNotes ? 'border-[#8ec2ab] bg-[#d6eddf]' : 'border-[#c7ddd1] bg-[#f3faf5] hover:bg-[#ddf1e5]'}`}><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#c3e2d2] text-[#397d69]"><FileText size={15} /></span><span><strong className="block text-xs text-[#315c4e]">{savedNotes ? 'Saved to notes' : 'Save call notes'}</strong><small className="text-[10px] text-[#6d8c80]">Confirmation and details</small></span>{savedNotes ? <CheckCircle2 className="ml-auto text-[#4e9b83]" size={17} /> : null}</button></div></section>;
}

function RecentTasks({ history, onOpen }: { history: typeof seedHistory; onOpen: () => void }) {
  return <section className="rounded-[22px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 md:p-6"><div className="flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Your queue</p><h3 className="mt-2 text-lg font-bold tracking-tight">Recent tasks</h3></div><button type="button" data-testid="button-view-history" onClick={onOpen} className="text-xs font-bold text-[#3159c4] hover:underline">View all <ArrowUpRight className="ml-1 inline" size={13} /></button></div><div className="mt-4 divide-y divide-[hsl(var(--border))]">{history.slice(0, 3).map((item) => <button type="button" data-testid={`button-history-${item.id}`} onClick={onOpen} key={item.id} className="flex w-full items-center gap-3 py-3 text-left transition-colors first:pt-0 last:pb-0 hover:bg-[#faf8f2]"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${item.status === 'Needs you' ? 'bg-[#ffe5dd] text-[#bd5d47]' : 'bg-[#e1efe9] text-[#4a8978]'}`}>{item.status === 'Needs you' ? <CircleHelp size={15} /> : <Check size={15} />}</span><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{item.title}</strong><small className="block truncate text-[10px] text-[hsl(var(--muted-foreground))]">{item.detail}</small></span><span className="shrink-0 text-[10px] text-[hsl(var(--muted-foreground))]">{item.time}</span></button>)}</div></section>;
}

function HistoryView({ history, onBack }: { history: typeof seedHistory; onBack: () => void }) {
  return <div className="mx-auto max-w-[980px] px-5 py-8 md:px-10 md:py-12"><button type="button" data-testid="button-history-back" onClick={onBack} className="mb-8 text-xs font-bold text-[#3159c4] hover:underline">← Back to my desk</button><div className="mb-8 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#e26951]">The paper trail</p><h1 className="mt-2 font-serif text-5xl tracking-[-.04em]">Task history</h1></div><button type="button" data-testid="button-history-filter" onClick={() => undefined} className="hidden items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-xs font-bold sm:flex"><SlidersHorizontal size={14} /> Filter</button></div><div className="space-y-3">{history.map((item) => <div data-testid={`card-history-${item.id}`} key={item.id} className="flex flex-col gap-4 rounded-2xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 transition-transform hover:-translate-y-0.5 sm:flex-row sm:items-center"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.status === 'Needs you' ? 'bg-[#ffe5dd] text-[#bd5d47]' : 'bg-[#e1efe9] text-[#4a8978]'}`}>{item.status === 'Needs you' ? <CircleHelp size={17} /> : <CheckCircle2 size={17} />}</span><div className="min-w-0 flex-1"><h3 className="font-bold">{item.title}</h3><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{item.detail}</p></div><div className="flex items-center gap-4"><span className={`text-[10px] font-bold uppercase tracking-[.1em] ${item.status === 'Needs you' ? 'text-[#bd5d47]' : 'text-[#4b8a78]'}`}>{item.status}</span><span className="text-xs text-[hsl(var(--muted-foreground))]">{item.time}</span><MoreHorizontal size={16} className="text-[hsl(var(--muted-foreground))]" /></div></div>)}</div></div>;
}

function ContactsView({ onSelect }: { onSelect: (id: string) => void }) {
  return <div className="mx-auto max-w-[980px] px-5 py-8 md:px-10 md:py-12"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#e26951]">People & places</p><h1 className="mt-2 font-serif text-5xl tracking-[-.04em]">Contacts</h1><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">The places I already know how to reach for you.</p></div><button type="button" data-testid="button-add-contact" onClick={() => undefined} className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#2854cc] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#2148b4]"><Plus size={15} /> Add contact</button></div><div className="grid gap-4 md:grid-cols-2">{contacts.map((contact) => <button type="button" data-testid={`button-contact-${contact.id}`} key={contact.id} onClick={() => onSelect(contact.id)} className="group rounded-2xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 text-left transition-all hover:-translate-y-1 hover:border-[#a9b9e7] hover:shadow-[0_12px_30px_rgba(52,73,112,.08)]"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><Avatar contact={contact} /><span><strong className="block text-sm">{contact.name}</strong><small className="text-xs text-[hsl(var(--muted-foreground))]">{contact.business}</small></span></div><ArrowUpRight size={16} className="text-[hsl(var(--muted-foreground))] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /></div><div className="mt-5 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><Phone size={13} />{contact.phone}</div><div className="mt-3 rounded-lg bg-[#f4f0e8] px-3 py-2 text-[11px] text-[#69736e]"><Star size={12} className="mr-1 inline text-[#d17c55]" /> {contact.note}</div></button>)}</div></div>;
}

function ContactPicker({ selected, onClose, onSelect }: { selected: string; onClose: () => void; onSelect: (id: string) => void }) {
  return <div className="fixed inset-0 z-40 grid place-items-center bg-[#1d2b30]/45 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-[24px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card)] p-5 shadow-2xl animate-rise"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold">Choose a contact</h2><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Who should I call?</p></div><IconButton label="close contact picker" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-[hsl(var(--muted))]"><X size={17} /></IconButton></div><div className="space-y-2">{contacts.map((item) => <button type="button" data-testid={`button-picker-${item.id}`} key={item.id} onClick={() => onSelect(item.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${selected === item.id ? 'border-[#a6b7e5] bg-[#edf1ff]' : 'border-[hsl(var(--border))] hover:bg-[#f5f2eb]'}`}><Avatar contact={item} size="sm" /><span className="flex-1"><strong className="block text-xs">{item.name}</strong><small className="text-[10px] text-[hsl(var(--muted-foreground))]">{item.business}</small></span>{selected === item.id ? <Check size={16} className="text-[#3159c4]" /> : null}</button>)}</div></div></div>;
}

function Preferences({ onClose }: { onClose: () => void }) {
  const [morning, setMorning] = useState(true); const [confirm, setConfirm] = useState(true);
  return <div className="fixed inset-0 z-40 grid place-items-center bg-[#1d2b30]/45 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-[24px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card)] p-6 shadow-2xl animate-rise"><div className="flex items-start justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#e26951]">Your defaults</p><h2 className="mt-2 font-serif text-3xl tracking-tight">How I should help</h2></div><IconButton label="close preferences" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-[hsl(var(--muted))]"><X size={17} /></IconButton></div><div className="mt-6 space-y-3"><PreferenceRow icon={<Clock3 size={16} />} title="Prefer late mornings" detail="I’ll look for 10 AM – 1 PM first." value={morning} onChange={() => setMorning(!morning)} /><PreferenceRow icon={<ShieldCheck size={16} />} title="Ask before booking" detail="Pause when a time or price needs your input." value={confirm} onChange={() => setConfirm(!confirm)} /></div><button type="button" data-testid="button-save-preferences" onClick={onClose} className="mt-6 w-full rounded-xl bg-[#2854cc] py-3 text-sm font-bold text-white hover:bg-[#2148b4]">Save preferences</button></div></div>;
}
function PreferenceRow({ icon, title, detail, value, onChange }: { icon: ReactNode; title: string; detail: string; value: boolean; onChange: () => void }) {
  return <button type="button" data-testid={`button-toggle-${title.replaceAll(' ', '-').toLowerCase()}`} onClick={onChange} className="flex w-full items-center gap-3 rounded-xl border border-[hsl(var(--border))] p-3 text-left hover:bg-[#f6f3ec]"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e7eee9] text-[#4d806f]">{icon}</span><span className="flex-1"><strong className="block text-xs">{title}</strong><small className="text-[10px] text-[hsl(var(--muted-foreground))]">{detail}</small></span><span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${value ? 'bg-[#3f8b76]' : 'bg-[#c9d0cc]'}`}><span className={`block h-4 w-4 rounded-full bg-[#f9f8f2] shadow-sm transition-transform ${value ? 'translate-x-4' : ''}`} /></span></button>;
}

function Router() {
  return <Switch><Route path="/" component={AppShell} /><Route component={NotFound} /></Switch>;
}
function Root() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><ErrorBoundary><Router /></ErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}
export default Root;