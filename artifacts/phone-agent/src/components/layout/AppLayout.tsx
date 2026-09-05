import type { ReactNode } from 'react';
import { ArrowUpRight, CircleHelp, History, MessageCircle, Phone as PhoneIcon, ShieldCheck, Users } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { IconButton } from '@/components/shared/IconButton';
import { Preferences } from './Preferences';

const navItems = [
  { path: '/calls', label: 'Calls', icon: <PhoneIcon size={16} />, testId: 'nav-calls' },
  { path: '/history', label: 'Task history', icon: <History size={16} />, testId: 'nav-history' },
  { path: '/contacts', label: 'Contacts', icon: <Users size={16} />, testId: 'nav-contacts' },
] as const;

export function AppLayout({
  children,
  title,
  onPrefsOpen,
  currentDate,
  prefsOpen,
  onPrefsClose,
}: {
  children: ReactNode;
  title: string;
  onPrefsOpen: () => void;
  currentDate: string;
  prefsOpen: boolean;
  onPrefsClose: () => void;
}) {
  const [location] = useLocation();

  const isActive = (path: string) => location.startsWith(path);

  return (
    <div className="grain min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[224px] flex-col bg-[hsl(var(--sidebar))] px-5 py-6 text-[hsl(var(--sidebar-foreground))] md:flex">
        <Link href="/contacts" className="flex items-center gap-3 text-left">
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
