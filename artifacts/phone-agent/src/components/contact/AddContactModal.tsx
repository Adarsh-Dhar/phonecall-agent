import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Search, UserPlus, X, Loader2, Building2, User,
  Check, AtSign, AlertCircle, RefreshCw, WifiOff,
} from 'lucide-react';
import { searchAccounts, addContactFromAccount, ApiError } from '@/lib/api/contacts';
import type { AccountSearchResult, Contact } from '@/lib/api/contacts';

interface Props {
  onClose: () => void;
  onAdded: (contact: Contact) => void;
}

type SearchState =
  | { kind: 'idle' }
  | { kind: 'searching' }
  | { kind: 'results'; items: AccountSearchResult[] }
  | { kind: 'empty'; query: string }
  | { kind: 'error'; message: string; actionLabel?: string; onAction?: () => void };

type AddState =
  | { kind: 'idle' }
  | { kind: 'adding'; id: string }
  | { kind: 'added'; id: string }
  | { kind: 'error'; id: string; message: string };

/** Highlight the matched substring bold in both name and email */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent font-bold text-foreground">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function SkeletonRow() {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-28 animate-pulse rounded bg-muted" />
        <div className="h-2.5 w-44 animate-pulse rounded bg-muted" />
      </div>
    </li>
  );
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

export function AddContactModal({ onClose, onAdded }: Props) {
  const [query, setQuery]         = useState('');
  const [search, setSearch]       = useState<SearchState>({ kind: 'idle' });
  const [addStates, setAddStates] = useState<Map<string, AddState>>(new Map());

  const inputRef    = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const setAdd = (id: string, state: AddState) =>
    setAddStates((prev) => new Map(prev).set(id, state));

  const getAdd = (id: string): AddState =>
    addStates.get(id) ?? { kind: 'idle' };

  // ── Search ──────────────────────────────────────────────────────────────
  const runSearch = useCallback(async (q: string) => {
    try {
      const data = await searchAccounts(q);
      setSearch(data.length > 0
        ? { kind: 'results', items: data }
        : { kind: 'empty', query: q });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setSearch({
            kind: 'error',
            message: 'Your session has expired.',
            actionLabel: 'Reload page',
            onAction: () => window.location.reload(),
          });
        } else if (err.status === 404) {
          setSearch({
            kind: 'error',
            message: 'Search endpoint not found — the server may need a restart.',
            actionLabel: 'Reload page',
            onAction: () => window.location.reload(),
          });
        } else {
          setSearch({
            kind: 'error',
            message: `Search unavailable (${err.status}) — please try again.`,
            actionLabel: 'Retry',
            onAction: () => runSearch(q),
          });
        }
      } else if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('network'))) {
        setSearch({
          kind: 'error',
          message: 'Cannot reach the server. Check your connection.',
          actionLabel: 'Retry',
          onAction: () => runSearch(q),
        });
      } else {
        setSearch({
          kind: 'error',
          message: 'Something went wrong. Please try again.',
          actionLabel: 'Retry',
          onAction: () => runSearch(q),
        });
      }
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setSearch({ kind: 'idle' }); return; }

    setSearch({ kind: 'searching' });
    debounceRef.current = setTimeout(() => runSearch(query), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, runSearch]);

  // ── Add ─────────────────────────────────────────────────────────────────
  const handleAdd = async (account: AccountSearchResult) => {
    const current = getAdd(account.id);
    if (current.kind === 'adding' || current.kind === 'added') return;

    setAdd(account.id, { kind: 'adding', id: account.id });
    try {
      const contact = await addContactFromAccount(account.id);
      setAdd(account.id, { kind: 'added', id: account.id });
      onAdded(contact);
    } catch (err) {
      let message = 'Failed to add contact';
      if (err instanceof ApiError) {
        if (err.status === 409) {
          // Treat duplicate as success — it's already there
          setAdd(account.id, { kind: 'added', id: account.id });
          return;
        }
        message = err.message;
      }
      setAdd(account.id, { kind: 'error', id: account.id, message });
      // Auto-clear row error after 3 s so user can retry
      setTimeout(() => setAdd(account.id, { kind: 'idle', }), 3000);
    }
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const clearQuery = () => {
    setQuery('');
    setSearch({ kind: 'idle' });
    inputRef.current?.focus();
  };

  // ── Render ───────────────────────────────────────────────────────────────
  const resultItems = search.kind === 'results' ? search.items : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[10vh] backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-[22px] border border-card-border bg-card shadow-2xl">

        {/* ── Search bar ── */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          {search.kind === 'searching'
            ? <Loader2 size={16} className="shrink-0 animate-spin text-muted-foreground" />
            : <Search size={16} className="shrink-0 text-muted-foreground" />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
            placeholder="Search by name or email…"
            className="min-w-0 flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-1 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="max-h-[420px] overflow-y-auto">

          {/* Idle */}
          {search.kind === 'idle' && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <AtSign size={26} className="text-muted-foreground/35" />
              <p className="text-xs text-muted-foreground">
                Type 2+ characters to search
              </p>
            </div>
          )}

          {/* Skeleton */}
          {search.kind === 'searching' && (
            <ul className="px-3 py-2 space-y-0.5">
              {[0, 1, 2].map((i) => <SkeletonRow key={i} />)}
            </ul>
          )}

          {/* Error state */}
          {search.kind === 'error' && (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              {search.message.includes('connection') || search.message.includes('reach')
                ? <WifiOff size={24} className="text-muted-foreground/50" />
                : <AlertCircle size={24} className="text-destructive/70" />
              }
              <p className="text-sm text-muted-foreground">{search.message}</p>
              {search.actionLabel && search.onAction && (
                <button
                  type="button"
                  onClick={search.onAction}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <RefreshCw size={12} />
                  {search.actionLabel}
                </button>
              )}
            </div>
          )}

          {/* Empty */}
          {search.kind === 'empty' && (
            <div className="flex flex-col items-center gap-1.5 py-10 text-center">
              <p className="text-sm font-medium text-foreground">No results for "{search.query}"</p>
              <p className="text-xs text-muted-foreground">
                Only registered app accounts appear here
              </p>
            </div>
          )}

          {/* Results */}
          {search.kind === 'results' && (
            <ul className="px-2 py-2 space-y-0.5">
              {resultItems.map((account) => {
                const addState = getAdd(account.id);
                const isAdding = addState.kind === 'adding';
                const isAdded  = addState.kind === 'added';
                const isErr    = addState.kind === 'error';

                return (
                  <li key={account.id}>
                    {/* Row error toast */}
                    {isErr && (
                      <div className="mx-3 mb-1 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
                        <AlertCircle size={11} className="shrink-0" />
                        {addState.message}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleAdd(account)}
                      disabled={isAdding || isAdded}
                      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/60 disabled:cursor-default"
                    >
                      {/* Avatar */}
                      {account.picture ? (
                        <img
                          src={account.picture}
                          alt={account.name}
                          className="h-9 w-9 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                          {getInitials(account.name)}
                        </span>
                      )}

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm leading-snug text-foreground">
                          <Highlight text={account.name} query={query} />
                        </p>
                        {account.email && (
                          <p className="truncate text-[11px] text-muted-foreground">
                            <Highlight text={account.email} query={query} />
                          </p>
                        )}
                        {account.business && (
                          <p className="truncate text-[10px] text-muted-foreground/60">
                            {account.business}
                          </p>
                        )}
                      </div>

                      {/* Type pill */}
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {account.isService
                          ? <><Building2 size={9} />Service</>
                          : <><User size={9} />User</>
                        }
                      </span>

                      {/* Add button */}
                      <span
                        className={`ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all ${
                          isAdded
                            ? 'bg-[hsl(var(--accent))/0.12] text-[hsl(var(--accent))]'
                            : isErr
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-foreground text-background group-hover:opacity-80 active:scale-95'
                        }`}
                      >
                        {isAdding ? <Loader2 size={12} className="animate-spin" />
                          : isAdded  ? <Check size={12} />
                          : isErr    ? <AlertCircle size={12} />
                          : <UserPlus size={12} />
                        }
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-border px-5 py-2.5">
          <p className="text-[10px] text-muted-foreground">
            {search.kind === 'results'
              ? `${resultItems.length} result${resultItems.length !== 1 ? 's' : ''} — click a row to add`
              : search.kind === 'error'
                ? '⚠ Could not load results'
                : 'Only users registered in this app will appear'}
          </p>
        </div>
      </div>
    </div>
  );
}
